import type { WorkLog } from '@ah/products/greenhouse/domain';
import type { LogOp, Roster } from './field-database';

/** One pending log to send. */
export interface LogChange {
  op: LogOp;
  farmId: string;
  log: WorkLog;
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
