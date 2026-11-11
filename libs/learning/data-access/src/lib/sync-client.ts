import type { Rejection, SyncRequest, SyncResponse } from '@ah/learning/domain';
import { LearningApiError } from './learning-api';
import type { LearningLocalStore } from './local-store';

export type SyncTransport = (
  request: SyncRequest,
  token: string,
) => Promise<SyncResponse>;

export type SyncOutcome =
  | { status: 'synced'; pushed: number; pulled: number; rejected: Rejection[] }
  /** Not paired, or the pairing ended (the session is cleared). */
  | { status: 'unpaired' }
  /** Couldn't sync now; everything stays queued for the next try. */
  | { status: 'failed'; offline: boolean; message: string };

/** A safety stop: 20 rounds move 10,000 pulled records. */
const MAX_ROUNDS = 20;

/**
 * Pushes the outbox and pulls changes until both are drained (design
 * §4.3). Each round is safe to repeat: the server ignores versions it
 * already has, and the local store merges pulled versions by the same
 * rule the server uses.
 */
export class LearningSyncClient {
  private running: Promise<SyncOutcome> | null = null;

  constructor(
    private readonly store: LearningLocalStore,
    private readonly transport: SyncTransport,
  ) {}

  /** Concurrent calls share one run. */
  sync(): Promise<SyncOutcome> {
    this.running ??= this.run().finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private async run(): Promise<SyncOutcome> {
    const session = await this.store.session();
    if (!session) return { status: 'unpaired' };

    let pushed = 0;
    let pulled = 0;
    const rejected: Rejection[] = [];
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const { push, snapshot } = await this.store.readOutbox();
      let response: SyncResponse;
      try {
        response = await this.transport(
          { cursor: await this.store.cursor(), push },
          session.token,
        );
      } catch (error) {
        if (
          error instanceof LearningApiError &&
          error.kind === 'unauthorized'
        ) {
          await this.store.clearSession();
          return { status: 'unpaired' };
        }
        return {
          status: 'failed',
          offline:
            error instanceof LearningApiError && error.kind === 'network',
          message: error instanceof Error ? error.message : String(error),
        };
      }

      pulled += await this.store.applyPull(response.pull);
      await this.store.acknowledge(snapshot);
      pushed += snapshot.size;
      for (const rejection of response.rejected) {
        await this.store.dropFromOutbox(rejection.kind, rejection.id);
        rejected.push(rejection);
      }
      await this.store.setCursor(response.cursor);
      if (response.renewedToken) {
        session.token = response.renewedToken.token;
        session.expiresAt = response.renewedToken.expiresAt;
        await this.store.setSession(session);
      }

      if (!response.more && (await this.store.pendingCount()) === 0) break;
    }
    return { status: 'synced', pushed, pulled, rejected };
  }
}
