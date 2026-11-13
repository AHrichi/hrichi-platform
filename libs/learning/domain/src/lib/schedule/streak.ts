import type { ReviewEvent, ReviewSession, StreakMode } from '../records';

/**
 * Streaks that forgive (design §5.3), computed from events and sets, never
 * stored:
 *
 * - A day counts with at least one card answered (an "ember" day), or a
 *   finished set, including an empty one on a day with nothing due.
 * - Daily mode: every 7 counted days in a row earns a freeze (at most 2 banked);
 *   a missed day spends a freeze, or a 30-day repair (two sets next day);
 *   today never breaks the streak.
 * - Weekly mode: a calendar week (Mon–Sun) counts once `weeklyTarget` days are
 *   counted in that week; the current week never breaks the streak.
 */
export const FREEZE_EVERY = 7;
export const MAX_FREEZES = 2;
export const REPAIR_EVERY_DAYS = 30;
export const DEFAULT_WEEKLY_TARGET = 5;

export interface StreakOptions {
  mode?: StreakMode;
  weeklyTarget?: number;
}

export interface StreakSummary {
  current: number;
  longest: number;
  freezesBanked: number;
  /** Days a freeze covered. */
  frozen: string[];
  /** Days a repair covered. */
  repaired: string[];
  /**
   * Yesterday ended the streak and a repair is available: two sets today
   * bring it back.
   */
  repairOffer: { missed: string; streakBefore: number } | null;
  todayCounted: boolean;
  /** Today's Daily Set is finished. */
  todayFull: boolean;
  mode: StreakMode;
  weeklyTarget: number;
  /** Counted days so far in the current Mon–Sun week. */
  thisWeekCount: number;
}

function addDays(localDate: string, days: number): string {
  const date = new Date(`${localDate}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

function weekStartOf(localDate: string): string {
  const day = new Date(`${localDate}T00:00:00Z`).getUTCDay();
  const offset = (day + 6) % 7; // Monday = 0, Sunday = 6
  return addDays(localDate, -offset);
}

function daysBetween(a: string, b: string): number {
  return Math.round(
    (Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000,
  );
}

export function countedDays(
  events: readonly ReviewEvent[],
  sessions: readonly ReviewSession[],
): { counted: Set<string>; full: Set<string>; doubled: Set<string> } {
  const finished = sessions.filter((session) => session.completedAt);
  const full = new Set(
    finished
      .filter((session) => session.kind === 'daily')
      .map((session) => session.localDate),
  );
  const perDay = new Map<string, number>();
  for (const session of finished) {
    if (!session.planned.length) continue;
    perDay.set(session.localDate, (perDay.get(session.localDate) ?? 0) + 1);
  }
  const doubled = new Set(
    [...perDay].filter(([, count]) => count >= 2).map(([day]) => day),
  );
  const counted = new Set([...events.map((event) => event.localDate), ...full]);
  return { counted, full, doubled };
}

export function computeStreak(
  counted: ReadonlySet<string>,
  full: ReadonlySet<string>,
  today: string,
  doubled: ReadonlySet<string> = new Set(),
  options?: StreakOptions,
): StreakSummary {
  const mode: StreakMode = options?.mode ?? 'daily';
  const weeklyTarget = Math.max(
    1,
    Math.min(7, Math.round(options?.weeklyTarget ?? DEFAULT_WEEKLY_TARGET)),
  );
  const days = [...counted].filter((day) => day <= today).sort();
  const currentWeek = weekStartOf(today);
  const thisWeekCount = days.filter((day) => day >= currentWeek).length;

  const summary: StreakSummary = {
    current: 0,
    longest: 0,
    freezesBanked: 0,
    frozen: [],
    repaired: [],
    repairOffer: null,
    todayCounted: counted.has(today),
    todayFull: full.has(today),
    mode,
    weeklyTarget,
    thisWeekCount,
  };
  if (!days.length) return summary;

  if (mode === 'weekly') {
    const perWeek = new Map<string, number>();
    for (const day of days) {
      const w = weekStartOf(day);
      perWeek.set(w, (perWeek.get(w) ?? 0) + 1);
    }
    let weekRun = 0;
    for (
      let week = weekStartOf(days[0]);
      week <= currentWeek;
      week = addDays(week, 7)
    ) {
      const count = perWeek.get(week) ?? 0;
      if (count >= weeklyTarget) {
        weekRun += 1;
      } else if (week < currentWeek) {
        weekRun = 0;
      }
      summary.longest = Math.max(summary.longest, weekRun);
    }
    summary.current = weekRun;
    return summary;
  }

  let run = 0;
  let lastRepair: string | null = null;
  for (let day = days[0]; day <= today; day = addDays(day, 1)) {
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
      const repairable =
        run > 0 &&
        (lastRepair === null ||
          daysBetween(lastRepair, day) >= REPAIR_EVERY_DAYS);
      const next = addDays(day, 1);
      if (repairable && doubled.has(next)) {
        summary.repaired.push(day);
        lastRepair = day;
      } else {
        if (repairable && next === today) {
          summary.repairOffer = { missed: day, streakBefore: run };
        }
        run = 0;
      }
    }
    summary.longest = Math.max(summary.longest, run);
  }
  summary.current = run;
  return summary;
}
