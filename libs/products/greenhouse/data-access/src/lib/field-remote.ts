import type { WorkLog } from '@ah/products/greenhouse/domain';
import type { LogOp, Roster } from './field-database';

/** One pending log to send. */
export interface LogChange {
  op: LogOp;
  farmId: string;
  log: WorkLog;
}

/**
 * Why a call to the server failed, which decides what the sync does next:
 * - `offline`: no network or no reply; try again later;
 * - `auth`: the session expired; sign in again, then retry;
 * - `rejected`: the server refused the data itself; retrying won't help;
 * - `server`: anything else on the server's side; try again later.
 */
export type RemoteErrorKind = 'offline' | 'auth' | 'rejected' | 'server';

export class RemoteError extends Error {
  override readonly name = 'RemoteError';

  constructor(
    readonly kind: RemoteErrorKind,
    message: string,
  ) {
    super(message);
  }
}

/** The server as the field app sees it. */
export interface FieldRemote {
  /**
   * Sends a batch of changes. Creates are idempotent (one the server
   * already has is ignored) and updates overwrite, so a batch that failed
   * partway is safe to send again. Throws a `RemoteError`.
   */
  pushLogs(changes: readonly LogChange[]): Promise<void>;
  /** The signed-in supervisor's farm. Throws a `RemoteError`. */
  fetchRoster(): Promise<Roster>;
}
