import type { SyncResult } from '@ah/products/greenhouse/data-access';

/**
 * What the header says about sending:
 * - `idle`: nothing going on (pending entries, if any, go out soon);
 * - `syncing`: sending now;
 * - `offline`: no signal; entries wait on the phone;
 * - `auth`: the session expired; sending waits for a sign-in;
 * - `error`: the server failed; trying again later;
 * - `no-server`: this build has no server to send to.
 */
export type SyncState =
  'idle' | 'syncing' | 'offline' | 'auth' | 'error' | 'no-server';

/** Wait after a save before sending, so a quick run of entries goes together. */
export const SAVE_DEBOUNCE_MS = 1_500;

/** Checks for anything left over, while there's something pending. */
export const PERIODIC_SYNC_MS = 30_000;

const FIRST_RETRY_MS = 5_000;
const MAX_RETRY_MS = 5 * 60_000;

/** 5 s, 10 s, 20 s… up to 5 minutes after repeated failures. */
export function retryDelay(failures: number): number {
  if (failures <= 0) return SAVE_DEBOUNCE_MS;
  return Math.min(MAX_RETRY_MS, FIRST_RETRY_MS * 2 ** (failures - 1));
}

export function stateAfter(result: SyncResult): SyncState {
  switch (result.stoppedBy) {
    case 'offline':
      return 'offline';
    case 'auth':
      return 'auth';
    case 'server':
      return 'error';
    case null:
      return 'idle';
  }
}

/** Two syncs' results (work logs, then hygiene checks) as one. */
export function combineResults(a: SyncResult, b: SyncResult): SyncResult {
  return {
    sent: a.sent + b.sent,
    rejected: a.rejected + b.rejected,
    pending: a.pending + b.pending,
    stoppedBy: a.stoppedBy ?? b.stoppedBy,
  };
}

/** Whether another run is worth scheduling, and when. */
export function nextRun(
  result: SyncResult,
  failures: number,
): { failures: number; delayMs: number | null } {
  if (result.stoppedBy === 'auth') return { failures, delayMs: null };
  if (result.stoppedBy) {
    const next = failures + 1;
    return { failures: next, delayMs: retryDelay(next) };
  }
  // Something was edited while it was being sent: send it shortly.
  return { failures: 0, delayMs: result.pending > 0 ? SAVE_DEBOUNCE_MS : null };
}
