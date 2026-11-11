import type { ReviewEvent, ReviewSession } from '../records';

/**
 * Streaks that forgive (design §5.3), computed from events and sets, never
 * stored:
 *
 * - A day counts with at least one card answered (an "ember" day), or a
 *   finished set, including an empty one on a day with nothing due.
 * - Every 7 counted days in a row earns a freeze; at most 2 wait in the bank.
 * - A missed day uses a freeze when one is banked; otherwise the streak ends.
 * - Today never breaks the streak: it is still in progress.
 */
export const FREEZE_EVERY = 7;
export const MAX_FREEZES = 2;

export interface StreakSummary {
  current: number;
  longest: number;
  freezesBanked: number;
  /** Days a freeze covered. */
  frozen: string[];
  todayCounted: boolean;
  /** Today's Daily Set is finished. */
  todayFull: boolean;
}

function nextDay(localDate: string): string {
  const date = new Date(`${localDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date.toISOString().slice(0, 10);
}

export function countedDays(
  events: readonly ReviewEvent[],
  sessions: readonly ReviewSession[],
): { counted: Set<string>; full: Set<string> } {
  const full = new Set(
    sessions
      .filter((session) => session.kind === 'daily' && session.completedAt)
      .map((session) => session.localDate),
  );
  const counted = new Set([...events.map((event) => event.localDate), ...full]);
  return { counted, full };
}

export function computeStreak(
  counted: ReadonlySet<string>,
  full: ReadonlySet<string>,
  today: string,
): StreakSummary {
  const days = [...counted].filter((day) => day <= today).sort();
  const summary: StreakSummary = {
    current: 0,
    longest: 0,
    freezesBanked: 0,
    frozen: [],
    todayCounted: counted.has(today),
    todayFull: full.has(today),
  };
  if (!days.length) return summary;

  let run = 0;
  for (let day = days[0]; day <= today; day = nextDay(day)) {
    if (counted.has(day)) {
      run += 1;
      if (run % FREEZE_EVERY === 0) {
        summary.freezesBanked = Math.min(
          MAX_FREEZES,
          summary.freezesBanked + 1,
        );
      }
    } else if (day === today) {
      // Today isn't over yet.
    } else if (summary.freezesBanked > 0) {
      summary.freezesBanked -= 1;
      summary.frozen.push(day);
    } else {
      run = 0;
    }
    summary.longest = Math.max(summary.longest, run);
  }
  summary.current = run;
  return summary;
}
