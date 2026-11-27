import type { Gear } from './venue';

/** A block of play at a venue: matches happen inside it (P2). */
export interface PlaySession {
  readonly id: string;
  readonly venueId: string;
  readonly mapId: string;
  readonly openedAt: string;
  readonly closedAt: string | null;
  /** How many players it takes: the venue's ready vests when it opened. */
  readonly capacity: number;
}

/** Who wears the gear: a player with an account, or a guest. */
export type Wearer =
  | { readonly kind: 'player'; readonly id: string }
  | { readonly kind: 'guest'; readonly id: string };

export interface CheckIn {
  readonly id: string;
  readonly sessionId: string;
  readonly wearer: Wearer;
  readonly vestId: string;
  readonly blasterId: string | null;
  readonly at: string;
  readonly releasedAt: string | null;
}

export type CheckInProblem =
  | 'session-closed'
  | 'session-full'
  | 'already-checked-in'
  | 'not-a-vest'
  | 'gear-not-ready'
  | 'vest-in-use';

/**
 * Whether `wearer` may take `vest` in `session`, given the session's
 * check-ins. Released check-ins free both the wearer and the vest.
 */
export function checkInProblem(
  session: PlaySession,
  checkIns: readonly CheckIn[],
  wearer: Wearer,
  vest: Gear,
): CheckInProblem | null {
  if (session.closedAt) return 'session-closed';
  const active = checkIns.filter(
    (c) => c.sessionId === session.id && !c.releasedAt,
  );
  if (
    active.some(
      (c) => c.wearer.kind === wearer.kind && c.wearer.id === wearer.id,
    )
  ) {
    return 'already-checked-in';
  }
  if (vest.kind !== 'vest') return 'not-a-vest';
  if (vest.status !== 'ready') return 'gear-not-ready';
  if (active.some((c) => c.vestId === vest.id)) return 'vest-in-use';
  return active.length >= session.capacity ? 'session-full' : null;
}

/** A guest's stats wait this long to be claimed, then the guest is deleted. */
export const GUEST_DAYS = 30;

export function guestExpiresAt(createdAt: Date): Date {
  return new Date(createdAt.getTime() + GUEST_DAYS * 86_400_000);
}
