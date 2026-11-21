/**
 * Calendar days as ISO strings (`2026-11-23`). A farm works in one time zone
 * (Africa/Tunis), so a day is a label, not an instant: every helper here does
 * its arithmetic in UTC, where days are always 24 hours long.
 */
export type IsoDate = string;

/** ISO weekday: 1 is Monday, 7 is Sunday. */
export type Weekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** The farm's zone; Tunisia has no daylight saving time. */
export const FARM_TIME_ZONE = 'Africa/Tunis';

const DAY_MS = 86_400_000;
const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;

export function isIsoDate(value: unknown): value is IsoDate {
  if (typeof value !== 'string') return false;
  const match = ISO_DATE.exec(value);
  if (!match) return false;
  const [, y, m, d] = match.map(Number) as [number, number, number, number];
  const day = new Date(Date.UTC(y, m - 1, d));
  return (
    day.getUTCFullYear() === y &&
    day.getUTCMonth() === m - 1 &&
    day.getUTCDate() === d
  );
}

function toUtcMs(date: IsoDate): number {
  if (!isIsoDate(date)) {
    throw new RangeError(`Not an ISO calendar date: ${String(date)}`);
  }
  return Date.parse(`${date}T00:00:00Z`);
}

function fromUtcMs(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function addDays(date: IsoDate, days: number): IsoDate {
  return fromUtcMs(toUtcMs(date) + days * DAY_MS);
}

/** Whole days from `from` to `to`; negative when `to` comes first. */
export function daysBetween(from: IsoDate, to: IsoDate): number {
  return Math.round((toUtcMs(to) - toUtcMs(from)) / DAY_MS);
}

export function weekdayOf(date: IsoDate): Weekday {
  const day = new Date(toUtcMs(date)).getUTCDay();
  return (day === 0 ? 7 : day) as Weekday;
}

/** The Monday of `date`'s week. */
export function startOfWeek(date: IsoDate): IsoDate {
  return addDays(date, 1 - weekdayOf(date));
}

export function isWeekStart(date: IsoDate): boolean {
  return isIsoDate(date) && weekdayOf(date) === 1;
}

/** The calendar day of `day` in the week that starts on `weekStart`. */
export function dateOfWeekday(weekStart: IsoDate, day: Weekday): IsoDate {
  assertWeekStart(weekStart);
  return addDays(weekStart, day - 1);
}

/** The seven days of a week, Monday first. */
export function weekDates(weekStart: IsoDate): IsoDate[] {
  assertWeekStart(weekStart);
  return [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(weekStart, i));
}

/** Today's date on the farm's clock, whatever the device's zone. */
export function todayOnFarm(now: Date = new Date()): IsoDate {
  // en-CA formats dates as YYYY-MM-DD.
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: FARM_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);
}

function assertWeekStart(weekStart: IsoDate): void {
  if (!isWeekStart(weekStart)) {
    throw new RangeError(`A week starts on a Monday, not ${weekStart}`);
  }
}
