/**
 * The learner's day an instant belongs to (design §5.2).
 *
 * The day starts at `dayStartsAt` (04:00 by default) on the wall clock of
 * `timeZone`, so a late-night session counts for the day before. The
 * boundary is applied to the local wall-clock time, not by shifting the
 * instant, so daylight-saving changes never move it.
 */
export const DEFAULT_DAY_START_MINUTES = 4 * 60;

const formatters = new Map<string, Intl.DateTimeFormat>();

function formatterFor(timeZone: string): Intl.DateTimeFormat {
  let formatter = formatters.get(timeZone);
  if (!formatter) {
    formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    });
    formatters.set(timeZone, formatter);
  }
  return formatter;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    formatterFor(timeZone);
    return true;
  } catch {
    return false;
  }
}

/** `YYYY-MM-DD` of the learner's day that `at` falls in. */
export function localDateOf(
  at: Date,
  timeZone: string,
  dayStartsAtMinutes = DEFAULT_DAY_START_MINUTES,
): string {
  const parts: Record<string, number> = {};
  for (const part of formatterFor(timeZone).formatToParts(at)) {
    if (part.type !== 'literal') parts[part.type] = Number(part.value);
  }
  const minutes = parts['hour'] * 60 + parts['minute'];
  const offsetDays = minutes < dayStartsAtMinutes ? -1 : 0;
  // Calendar arithmetic on a UTC date: no time zone, no DST.
  const day = new Date(
    Date.UTC(parts['year'], parts['month'] - 1, parts['day'] + offsetDays),
  );
  return day.toISOString().slice(0, 10);
}
