import {
  type FieldDatabase,
  type LogRow,
  META_LAST_SYNC_AT,
} from './field-database';
import {
  type FieldRemote,
  type LogChange,
  RemoteError,
  type RemoteErrorKind,
} from './field-remote';

export interface SyncResult {
  /** Logs the server accepted. */
  sent: number;
  /** Logs the server refused for good (now `rejected`). */
  rejected: number;
  /** Logs still waiting. */
  pending: number;
  /** Why the sync stopped early; null when it got through everything. */
  stoppedBy: Exclude<RemoteErrorKind, 'rejected'> | null;
}

export interface WorkLogSyncOptions {
  /** Logs per request. */
  batchSize?: number;
  now?: () => Date;
}

/**
 * Sends the phone's pending work logs to the server.
 *
 * - In batches, oldest first. A batch the server refuses is retried one log
 *   at a time, so one bad entry can't hold back the rest.
 * - A log edited while its batch was in flight stays pending (its `rev`
 *   moved on), so the edit goes out next time instead of being lost.
 * - No network, an expired session or a server error stops the run and
 *   leaves everything pending; calling `flush()` again later carries on.
 * - Calls made while a run is going join that run.
 */
export class WorkLogSync {
  private running: Promise<SyncResult> | null = null;
  private readonly batchSize: number;
  private readonly now: () => Date;

  constructor(
    private readonly db: FieldDatabase,
    private readonly remote: FieldRemote,
    options: WorkLogSyncOptions = {},
  ) {
    this.batchSize = Math.max(1, options.batchSize ?? 50);
    this.now = options.now ?? (() => new Date());
  }

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
    // Logs tried this run; a log edited mid-run waits for the next one.
    const tried = new Set<string>();

    while (stoppedBy === null) {
      const batch = (await this.pending())
        .filter((row) => !tried.has(row.id))
        .slice(0, this.batchSize);
      if (batch.length === 0) break;
      for (const row of batch) tried.add(row.id);

      const outcome = await this.send(batch);
      sent += outcome.sent;
      rejected += outcome.rejected;
      stoppedBy = outcome.stoppedBy;
    }

    if (sent > 0) {
      await this.db.meta.put({
        key: META_LAST_SYNC_AT,
        value: this.now().toISOString(),
      });
    }
    const pending = await this.db.logs
      .where('status')
      .equals('pending')
      .count();
    return { sent, rejected, pending, stoppedBy };
  }

  private async pending(): Promise<LogRow[]> {
    const rows = await this.db.logs.where('status').equals('pending').toArray();
    return rows.sort((a, b) => a.recordedAt.localeCompare(b.recordedAt));
  }

  /** One batch; split into single logs if the server refuses it. */
  private async send(batch: LogRow[]): Promise<Omit<SyncResult, 'pending'>> {
    try {
      await this.remote.pushLogs(batch.map(toChange));
      await this.markSynced(batch);
      return { sent: batch.length, rejected: 0, stoppedBy: null };
    } catch (error) {
      const kind = kindOf(error);
      if (kind !== 'rejected') {
        await this.countAttempt(batch);
        return { sent: 0, rejected: 0, stoppedBy: kind };
      }
      if (batch.length === 1) {
        await this.markRejected(batch[0] as LogRow, messageOf(error));
        return { sent: 0, rejected: 1, stoppedBy: null };
      }
      const total = {
        sent: 0,
        rejected: 0,
        stoppedBy: null as SyncResult['stoppedBy'],
      };
      for (const row of batch) {
        const one = await this.send([row]);
        total.sent += one.sent;
        total.rejected += one.rejected;
        if (one.stoppedBy) {
          total.stoppedBy = one.stoppedBy;
          break;
        }
      }
      return total;
    }
  }

  private async markSynced(rows: readonly LogRow[]): Promise<void> {
    const syncedAt = this.now().toISOString();
    await this.db.transaction('rw', this.db.logs, async () => {
      for (const sent of rows) {
        const current = await this.db.logs.get(sent.id);
        if (!current) continue;
        if (current.rev !== sent.rev) {
          // Edited while in flight: the server has the old version now.
          await this.db.logs.update(sent.id, { syncedAt, op: 'update' });
          continue;
        }
        await this.db.logs.update(sent.id, {
          status: 'synced',
          op: null,
          syncedAt,
          attempts: 0,
          error: null,
        });
      }
    });
  }

  private async markRejected(row: LogRow, error: string): Promise<void> {
    await this.db.transaction('rw', this.db.logs, async () => {
      const current = await this.db.logs.get(row.id);
      // An edit since may have fixed it: leave that one pending.
      if (!current || current.rev !== row.rev) return;
      await this.db.logs.update(row.id, { status: 'rejected', error });
    });
  }

  private async countAttempt(rows: readonly LogRow[]): Promise<void> {
    await this.db.transaction('rw', this.db.logs, async () => {
      for (const row of rows) {
        const current = await this.db.logs.get(row.id);
        if (current) {
          await this.db.logs.update(row.id, { attempts: current.attempts + 1 });
        }
      }
    });
  }
}

function toChange(row: LogRow): LogChange {
  return {
    op: row.op ?? 'create',
    farmId: row.farmId,
    log: {
      id: row.id,
      date: row.date,
      workerId: row.workerId,
      teamId: row.teamId,
      greenhouseId: row.greenhouseId,
      kg: row.kg,
      crates: row.crates,
      rejectedCrates: row.rejectedCrates,
      hours: row.hours,
      recordedAt: row.recordedAt,
      syncedAt: row.syncedAt,
    },
  };
}

function kindOf(error: unknown): RemoteErrorKind {
  return error instanceof RemoteError ? error.kind : 'server';
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
