import type { HygieneCheck } from '@ah/products/greenhouse/domain';
import { RemoteError, type RemoteErrorKind } from '../remote/remote-error';
import {
  type CheckRow,
  type FieldDatabase,
  META_LAST_SYNC_AT,
} from './field-database';
import type { FieldRemote } from './field-remote';
import type { SyncResult } from './work-log-sync';

/**
 * Sends the phone's pending hygiene checks, oldest first, each with its
 * photos uploaded before it (so the server never holds a check pointing at
 * a photo it hasn't got).
 *
 * - Like the work logs: a check edited mid-send stays pending, one the
 *   server refuses for good is marked `rejected` and the rest go on, and
 *   no network, an expired session or a server error stops the run.
 * - Once a signed check is through, the phone drops its photos' images:
 *   the server has them, and phones are short of space.
 */
export class HygieneSync {
  private running: Promise<SyncResult> | null = null;

  constructor(
    private readonly db: FieldDatabase,
    private readonly remote: FieldRemote,
    private readonly now: () => Date = () => new Date(),
  ) {}

  flush(): Promise<SyncResult> {
    this.running ??= this.run().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private async run(): Promise<SyncResult> {
    let sent = 0;
    let rejected = 0;
    let stoppedBy: SyncResult['stoppedBy'] = null;

    const rows = (
      await this.db.checks.where('status').equals('pending').toArray()
    ).sort((a, b) => a.date.localeCompare(b.date) || a.id.localeCompare(b.id));

    for (const row of rows) {
      try {
        await this.uploadPhotos(row);
        await this.remote.pushCheck(row.farmId, toCheck(row));
        await this.markSynced(row);
        sent += 1;
      } catch (error) {
        const kind: RemoteErrorKind =
          error instanceof RemoteError ? error.kind : 'server';
        if (kind === 'rejected') {
          await this.markRejected(row, messageOf(error));
          rejected += 1;
          continue;
        }
        await this.db.checks.update(row.id, { attempts: row.attempts + 1 });
        stoppedBy = kind;
        break;
      }
    }

    const pending = await this.db.checks
      .where('status')
      .equals('pending')
      .count();
    return { sent, rejected, pending, stoppedBy };
  }

  /** Uploads the check's photos still on the phone, and drops strays. */
  private async uploadPhotos(row: CheckRow): Promise<void> {
    const used = new Set(row.answers.flatMap((a) => a.photoPaths));
    const photos = await this.db.photos
      .where('checkId')
      .equals(row.id)
      .toArray();
    for (const photo of photos) {
      if (!used.has(photo.path)) {
        // Taken off its answer before it was ever sent.
        if (!photo.uploaded) await this.db.photos.delete(photo.path);
        continue;
      }
      if (photo.uploaded) continue;
      await this.remote.uploadPhoto(photo.path, photo.blob);
      await this.db.photos.update(photo.path, { uploaded: 1 });
    }
  }

  private async markSynced(sent: CheckRow): Promise<void> {
    const syncedAt = this.now().toISOString();
    await this.db.transaction(
      'rw',
      [this.db.checks, this.db.photos],
      async () => {
        const current = await this.db.checks.get(sent.id);
        if (!current || current.rev !== sent.rev) return;
        await this.db.checks.update(sent.id, {
          status: 'synced',
          attempts: 0,
          error: null,
        });
        if (current.signedAt) {
          await this.db.photos.where('checkId').equals(sent.id).delete();
        }
      },
    );
    await this.db.meta.put({ key: META_LAST_SYNC_AT, value: syncedAt });
  }

  private async markRejected(row: CheckRow, error: string): Promise<void> {
    await this.db.transaction('rw', this.db.checks, async () => {
      const current = await this.db.checks.get(row.id);
      if (!current || current.rev !== row.rev) return;
      await this.db.checks.update(row.id, { status: 'rejected', error });
    });
  }
}

function toCheck(row: CheckRow): HygieneCheck {
  return {
    id: row.id,
    date: row.date,
    greenhouseId: row.greenhouseId,
    supervisorId: row.supervisorId,
    answers: row.answers,
    signedAt: row.signedAt,
  };
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
