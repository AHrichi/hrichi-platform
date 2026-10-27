import data from './meteor-showers.json';

export interface MeteorShower {
  id: string;
  name: string;
  /** Month-day, e.g. `08-12`. */
  start: string;
  peak: string;
  end: string;
  /** Radiant at the peak, J2000 degrees. */
  ra: number;
  dec: number;
  /** Zenithal hourly rate at the peak, under an ideal dark sky. */
  zhr: number;
  /** Entry speed, km/s. */
  speed: number;
  parent: string;
}

export const meteorShowers: readonly MeteorShower[] = data.showers;

const DAY = 86_400_000;

/** The date of `monthDay` closest to `date`, in UTC. */
function nearest(monthDay: string, date: Date): number {
  const [month, day] = monthDay.split('-').map(Number);
  const year = date.getUTCFullYear();
  return [year - 1, year, year + 1]
    .map((y) => Date.UTC(y, month - 1, day))
    .reduce((best, candidate) =>
      Math.abs(candidate - date.getTime()) < Math.abs(best - date.getTime())
        ? candidate
        : best,
    );
}

/**
 * The shower's rate at `date`, ZHR: the peak rate falling tenfold every five
 * days either side (IMO's profiles, simplified), and zero outside its window.
 */
export function showerRate(shower: MeteorShower, date: Date): number {
  const peak = nearest(shower.peak, date);
  const start = nearest(shower.start, new Date(peak));
  const end = nearest(shower.end, new Date(peak));
  const time = date.getTime();
  if (time < Math.min(start, peak) || time > Math.max(end, peak) + DAY) {
    return 0;
  }
  const days = Math.abs(time - (peak + DAY / 2)) / DAY;
  return shower.zhr * 10 ** (-days / 5);
}

/** Showers active at `date` with their rate, busiest first. */
export function activeShowers(
  date: Date,
): { shower: MeteorShower; rate: number }[] {
  return meteorShowers
    .map((shower) => ({ shower, rate: showerRate(shower, date) }))
    .filter(({ rate }) => rate >= 1)
    .sort((a, b) => b.rate - a.rate);
}
