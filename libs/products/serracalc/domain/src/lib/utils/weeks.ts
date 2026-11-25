/** Calendar weeks (ISO 8601) and how they map onto monthly climate normals. */

/** Weeks in a planning year; week 53 is folded into week 52. */
export const WEEKS_PER_YEAR = 52;

/** The ISO week number (1–53) of a date. */
export function isoWeek(date: Date): number {
  const day = new Date(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()),
  );
  // Thursday of this week decides the year it belongs to.
  const weekday = day.getUTCDay() || 7;
  day.setUTCDate(day.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(day.getUTCFullYear(), 0, 1);
  return Math.ceil(((day.getTime() - yearStart) / 86_400_000 + 1) / 7);
}

/** A week number kept in 1–52, so week 60 is week 8 of the next year. */
export function wrapWeek(week: number): number {
  return (
    ((((Math.round(week) - 1) % WEEKS_PER_YEAR) + WEEKS_PER_YEAR) %
      WEEKS_PER_YEAR) +
    1
  );
}

/** The month (0–11) a week mostly falls in: its Thursday's month. */
export function monthOfWeek(week: number): number {
  const dayOfYear = (wrapWeek(week) - 1) * 7 + 4;
  return Math.min(11, Math.floor((dayOfYear / 365) * 12));
}

/**
 * A monthly value read at a week, interpolated between mid-months so a
 * week in late October sits between October and November.
 */
export function valueAtWeek(monthly: readonly number[], week: number): number {
  const position = (((wrapWeek(week) - 0.5) / WEEKS_PER_YEAR) * 12 + 11.5) % 12;
  const lower = Math.floor(position);
  const upper = (lower + 1) % 12;
  const share = position - lower;
  return monthly[lower] * (1 - share) + monthly[upper] * share;
}
