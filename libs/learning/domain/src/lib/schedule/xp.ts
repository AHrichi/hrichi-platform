import type { ReviewEvent, ReviewSession, TeachBack } from '../records';

/**
 * XP, computed from events through a versioned table (design §5.3): effort
 * weighs most, so a hard card that was got right is worth more than an easy
 * one, and nothing pays for reading. Changing the table changes every
 * device's XP at once, with no migration.
 */
export const XP_RULES_VERSION = 2;

export const XP_RULES = {
  rating: { again: 2, hard: 8, good: 6, easy: 4 },
  /** Typing or saying an answer before revealing it. */
  answered: 4,
  /** Finishing a Daily Set that had cards in it. */
  setFinished: 15,
  /** Explaining a concept in your own words weighs most (design §5.3). */
  teachBack: 12,
  /** On top, when the explanation was judged clear. */
  teachBackClear: 6,
} as const;

export function xpOf(
  events: readonly ReviewEvent[],
  sessions: readonly ReviewSession[],
  teachBacks: readonly TeachBack[] = [],
): number {
  let xp = 0;
  for (const teachBack of teachBacks) {
    xp += XP_RULES.teachBack;
    if (teachBack.clarity === 'clear') xp += XP_RULES.teachBackClear;
  }
  for (const event of events) {
    xp += XP_RULES.rating[event.rating];
    if (event.answer) xp += XP_RULES.answered;
  }
  for (const session of sessions) {
    if (
      session.kind === 'daily' &&
      session.completedAt &&
      session.planned.length
    ) {
      xp += XP_RULES.setFinished;
    }
  }
  return xp;
}

/** Levels get further apart: 50, 200, 450 … XP (level n starts at 50·(n−1)²). */
export function levelOf(xp: number): {
  level: number;
  into: number;
  span: number;
} {
  const level = Math.floor(Math.sqrt(xp / 50)) + 1;
  const start = 50 * (level - 1) ** 2;
  const next = 50 * level ** 2;
  return { level, into: xp - start, span: next - start };
}
