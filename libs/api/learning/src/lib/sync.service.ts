import {
  isFromTheFuture,
  type MutableKind,
  type PulledRecord,
  type Rejection,
  signDeviceToken,
  SYNC_LIMITS,
  type SyncRequest,
  type SyncResponse,
  TOKEN_RENEW_WINDOW_MS,
  PAIRING,
} from '@ah/learning/domain';
import type { LearningRepository, StoredRecord } from './learning.repository';

export interface SyncCaller {
  deviceId: string;
  tokenExpiresAt: Date;
}

/**
 * Applies a device's push, then returns what changed after its cursor
 * (design §4.3).
 *
 * Syncs run one at a time in this process. Sequence numbers are taken in
 * order and written before the next sync starts, so a reader never sees
 * seq 11 while seq 10 is still being written and skips it for good. The
 * API runs as a single instance on Render; a second instance would need
 * a lock in the database instead.
 */
export class SyncService {
  private queue: Promise<unknown> = Promise.resolve();

  constructor(
    private readonly repository: LearningRepository,
    private readonly tokenSecret: string,
    private readonly now: () => Date = () => new Date(),
  ) {}

  sync(caller: SyncCaller, request: SyncRequest): Promise<SyncResponse> {
    const run = this.queue.then(() => this.run(caller, request));
    this.queue = run.catch(() => undefined);
    return run;
  }

  private async run(
    caller: SyncCaller,
    request: SyncRequest,
  ): Promise<SyncResponse> {
    const now = this.now();
    const rejected: Rejection[] = [];
    // Versions this request wrote; the device already has them.
    const written = new Set<number>();

    const putMutable = async <K extends MutableKind>(
      kind: K,
      data: StoredRecord<K>['data'],
    ) => {
      if (isFromTheFuture(data.updatedAt, now)) {
        rejected.push({ kind, id: data.id, reason: 'clock_ahead' });
        return;
      }
      const seq = await this.repository.nextSeq();
      const outcome = await this.repository.putMutable<K>({
        kind,
        id: data.id,
        seq,
        by: caller.deviceId,
        updatedAt: data.updatedAt,
        data,
      } as StoredRecord<K>);
      if (outcome === 'stored') written.add(seq);
    };

    for (const topic of request.push.topics) await putMutable('topic', topic);
    for (const concept of request.push.concepts)
      await putMutable('concept', concept);
    for (const event of request.push.events) {
      const seq = await this.repository.nextSeq();
      const outcome = await this.repository.putAppendOnly({
        kind: 'event',
        id: event.id,
        seq,
        by: caller.deviceId,
        updatedAt: event.at,
        data: event,
      });
      if (outcome === 'stored') written.add(seq);
    }

    const changes = await this.repository.changesSince(
      request.cursor,
      SYNC_LIMITS.pull + 1,
    );
    const more = changes.length > SYNC_LIMITS.pull;
    const page = changes.slice(0, SYNC_LIMITS.pull);
    const cursor = page.length ? page[page.length - 1].seq : request.cursor;

    return {
      cursor,
      more,
      pull: page
        .filter((record) => !written.has(record.seq))
        .map(
          ({ kind, seq, by, data }) =>
            ({ kind, seq, by, data }) as PulledRecord,
        ),
      rejected,
      serverTime: now.toISOString(),
      renewedToken: await this.renewal(caller, now),
    };
  }

  private async renewal(
    caller: SyncCaller,
    now: Date,
  ): Promise<SyncResponse['renewedToken']> {
    const left = caller.tokenExpiresAt.getTime() - now.getTime();
    if (left > TOKEN_RENEW_WINDOW_MS) return null;
    const expiresAt = new Date(now.getTime() + PAIRING.tokenTtlMs);
    const token = await signDeviceToken(this.tokenSecret, {
      deviceId: caller.deviceId,
      expiresAt,
    });
    return { token, expiresAt: expiresAt.toISOString() };
  }
}
