/**
 * A small, public summary of today's set that the learning app keeps in
 * localStorage, so a host app on the same origin (the portfolio shell)
 * can show a "today" chip without reaching into the engine's database.
 */
export interface LearningTodaySummary {
  /** The learner's day it describes (`YYYY-MM-DD`). */
  localDate: string;
  total: number;
  done: number;
  streak: number;
  updatedAt: string;
}

export const TODAY_SUMMARY_KEY = 'ah.learning.today';

export function readTodaySummary(
  raw: string | null,
): LearningTodaySummary | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<LearningTodaySummary>;
    if (
      typeof value.localDate !== 'string' ||
      typeof value.total !== 'number' ||
      typeof value.done !== 'number' ||
      typeof value.streak !== 'number'
    ) {
      return null;
    }
    return {
      localDate: value.localDate,
      total: value.total,
      done: value.done,
      streak: value.streak,
      updatedAt: String(value.updatedAt ?? ''),
    };
  } catch {
    return null;
  }
}
