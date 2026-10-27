/** Time zone options: the place's, or the viewer's own when null. */
const zone = (timeZone: string | null) => (timeZone ? { timeZone } : {});

/** `23:57` in the place's time zone. */
export function formatTime(date: Date, timeZone: string | null): string {
  return new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    ...zone(timeZone),
  }).format(date);
}

/** `Wed 12 Aug, 23:57` in the place's time zone. */
export function formatDateTime(date: Date, timeZone: string | null): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    ...zone(timeZone),
  }).format(date);
}

/** `Wed 12 Aug` for a calendar date, `2026-08-12`, wherever the viewer is. */
export function formatDay(isoDate: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${isoDate}T12:00:00Z`));
}

/** `6 h 40 min`, `25 min` */
export function formatDuration(ms: number): string {
  const minutes = Math.round(ms / 60_000);
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  return minutes % 60 === 0 ? `${hours} h` : `${hours} h ${minutes % 60} min`;
}

/** `in 3 h 12 min`, `in 25 min`, `now` */
export function formatFromNow(date: Date, now: Date): string {
  const ms = date.getTime() - now.getTime();
  return ms <= 0 ? 'now' : `in ${formatDuration(ms)}`;
}

const compass = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];

/** `NE` for an azimuth in degrees, east of north. */
export function formatCompass(azimuth: number): string {
  return compass[Math.round((((azimuth % 360) + 360) % 360) / 45) % 8];
}

/** `−1.4`, with a real minus sign. */
export function formatMagnitude(magnitude: number): string {
  return magnitude.toFixed(1).replace('-', '−');
}

/** `87%` */
export function formatPercent(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

/** `5,044` */
export function formatCount(count: number): string {
  return count.toLocaleString('en-GB');
}
