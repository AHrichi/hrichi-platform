/** `418 km`, `35,786 km` */
export function formatKm(km: number): string {
  return `${Math.round(km).toLocaleString('en-GB')} km`;
}

/** `93 min`, `11 h 58 min`, `23 h 56 min` */
export function formatPeriod(minutes: number): string {
  const rounded = Math.round(minutes);
  if (rounded < 120) {
    return `${rounded} min`;
  }
  return `${Math.floor(rounded / 60)} h ${rounded % 60} min`;
}

/** `7.66 km/s` */
export function formatSpeed(kmPerSecond: number): string {
  return `${kmPerSecond.toFixed(2)} km/s`;
}

/** `Tue 23:57` in the observer's time zone. */
export function formatLocalTime(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone,
  }).format(new Date(iso));
}

/** `in 3 h 12 min`, `in 25 min`, `now` */
export function formatFromNow(iso: string, now: Date): string {
  const minutes = Math.round(
    (new Date(iso).getTime() - now.getTime()) / 60_000,
  );
  if (minutes <= 0) {
    return 'now';
  }
  if (minutes < 60) {
    return `in ${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  return `in ${hours} h ${minutes % 60} min`;
}

/** `16,821` */
export function formatCount(count: number): string {
  return count.toLocaleString('en-GB');
}
