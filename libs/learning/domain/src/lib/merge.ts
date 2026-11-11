/**
 * Which version of a mutable record wins (design §4.3).
 *
 * The later `updatedAt` wins. On a tie, the larger writer id wins, so every
 * device and the server pick the same version whatever order the copies
 * arrive in. Timestamps are ISO strings in UTC; comparing them as instants
 * keeps an offset like `+01:00` from deciding the order.
 */
export interface Revision {
  updatedAt: string;
  /** The device that wrote this version. */
  by: string;
}

export function compareRevisions(a: Revision, b: Revision): number {
  const byTime = Date.parse(a.updatedAt) - Date.parse(b.updatedAt);
  if (byTime !== 0) return Math.sign(byTime);
  if (a.by === b.by) return 0;
  return a.by < b.by ? -1 : 1;
}

/** Whether `incoming` should replace `current` (none yet: always). */
export function incomingWins(
  current: Revision | null | undefined,
  incoming: Revision,
): boolean {
  return !current || compareRevisions(incoming, current) > 0;
}

/**
 * The newest acceptable `updatedAt`. A device whose clock runs far ahead
 * would otherwise write a version nothing could ever replace.
 */
export const MAX_CLOCK_SKEW_MS = 10 * 60_000;

export function isFromTheFuture(updatedAt: string, now: Date): boolean {
  return Date.parse(updatedAt) > now.getTime() + MAX_CLOCK_SKEW_MS;
}
