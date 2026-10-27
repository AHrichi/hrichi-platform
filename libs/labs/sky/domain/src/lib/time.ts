const pad = (n: number) => String(n).padStart(2, '0');

/** A time zone's offset from UTC at an instant, ms (Tunis: +3,600,000). */
function zoneOffset(instant: number, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value);
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  );
  return asUtc - Math.floor(instant / 1000) * 1000;
}

/**
 * `2026-08-12T23:00`, the value of an `<input type="datetime-local">`, as the
 * clock reads in the place's time zone (null: the viewer's own).
 */
export function toLocalInput(date: Date, timeZone: string | null): string {
  const shifted = timeZone
    ? new Date(date.getTime() + zoneOffset(date.getTime(), timeZone))
    : null;
  const [year, month, day, hour, minute] = shifted
    ? [
        shifted.getUTCFullYear(),
        shifted.getUTCMonth() + 1,
        shifted.getUTCDate(),
        shifted.getUTCHours(),
        shifted.getUTCMinutes(),
      ]
    : [
        date.getFullYear(),
        date.getMonth() + 1,
        date.getDate(),
        date.getHours(),
        date.getMinutes(),
      ];
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}`;
}

/** The instant a `datetime-local` value names in the place's time zone. */
export function fromLocalInput(
  value: string,
  timeZone: string | null,
): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(value);
  if (!match) {
    return null;
  }
  const [year, month, day, hour, minute] = match.slice(1).map(Number);
  if (!timeZone) {
    return new Date(year, month - 1, day, hour, minute);
  }
  const guess = Date.UTC(year, month - 1, day, hour, minute);
  // Twice, so a guess on the far side of a daylight-saving change settles.
  let instant = guess - zoneOffset(guess, timeZone);
  instant = guess - zoneOffset(instant, timeZone);
  return new Date(instant);
}
