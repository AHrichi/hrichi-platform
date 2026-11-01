import { Body, Equator, Horizon, MakeTime, Observer } from 'astronomy-engine';
import { addDays } from '@ah/products/basecamp/domain';
import { nightSummary, placeAt, skyLink } from '@ah/labs/sky/domain';

/** One night at the campsite, for stargazing. */
export interface NightPlan {
  /** The evening's date, `YYYY-MM-DD`. */
  date: string;
  sunset: Date | null;
  sunrise: Date | null;
  /** Astronomical darkness, Sun below −18°; null if it never gets that dark. */
  darkStart: Date | null;
  darkEnd: Date | null;
  darkMinutes: number;
  /** Dark minutes with the Moon below the horizon. */
  moonFreeMinutes: number;
  moonRise: Date | null;
  moonSet: Date | null;
  /** 0 to 1. */
  moonIllumination: number;
  /** 0 new, 2 first quarter, 4 full, 6 last quarter. */
  moonPhase: number;
  showers: { id: string; name: string; rate: number }[];
  /** 0 to 100, before clouds. */
  score: number;
  /** The darkest moment to open in the Sky lab. */
  bestMoment: Date | null;
}

const MINUTE = 60_000;
const STEP = 10 * MINUTE;

function moonAltitude(date: Date, observer: Observer): number {
  const time = MakeTime(date);
  const eq = Equator(Body.Moon, time, observer, true, true);
  return Horizon(time, observer, eq.ra, eq.dec, 'normal').altitude;
}

/**
 * The night that starts on the evening of `date` at a campsite: dark hours,
 * the Moon, meteor showers, and a score that rewards moonless dark hours
 * and good shower rates.
 */
export function nightPlan(lat: number, lng: number, date: string): NightPlan {
  // Local noon, roughly: the summary then gives the coming night.
  const noon = new Date(
    Date.parse(`${date}T12:00:00Z`) - (lng / 15) * 3_600_000,
  );
  const summary = nightSummary(placeAt(lat, lng), noon);
  const observer = new Observer(lat, lng, 0);

  let darkMinutes = 0;
  let moonFreeMinutes = 0;
  let bestMoment: Date | null = null;
  if (summary.darkStart && summary.darkEnd) {
    // Sampled every 10 minutes: the longest moonless stretch is the best
    // time; with the Moon up all night, the moment it is lowest.
    let run: [number, number] | null = null;
    let best: [number, number] | null = null;
    let lowest = Infinity;
    for (
      let t = summary.darkStart.getTime();
      t < summary.darkEnd.getTime();
      t += STEP
    ) {
      const altitude = moonAltitude(new Date(t), observer);
      darkMinutes += 10;
      if (altitude < lowest) {
        lowest = altitude;
        bestMoment = new Date(t);
      }
      if (altitude < 0) {
        moonFreeMinutes += 10;
        run = run ? [run[0], t] : [t, t];
        if (!best || run[1] - run[0] > best[1] - best[0]) best = run;
      } else {
        run = null;
      }
    }
    if (best) bestMoment = new Date((best[0] + best[1]) / 2);
  }

  const showers = summary.showers
    .filter((s) => s.rate >= 2)
    .map((s) => ({ id: s.shower.id, name: s.shower.name, rate: s.rate }));
  const bestRate = Math.max(0, ...showers.map((s) => s.rate));
  const moonFreeShare = darkMinutes ? moonFreeMinutes / darkMinutes : 0;
  const score = Math.round(
    70 * Math.min(1, moonFreeMinutes / 360) +
      30 * Math.min(1, bestRate / 60) * moonFreeShare,
  );

  return {
    date,
    sunset: summary.sunset,
    sunrise: summary.sunrise,
    darkStart: summary.darkStart,
    darkEnd: summary.darkEnd,
    darkMinutes,
    moonFreeMinutes,
    moonRise: summary.moon.rise,
    moonSet: summary.moon.set,
    moonIllumination: summary.moon.illumination,
    moonPhase: Math.round((((summary.moon.phase % 360) + 360) % 360) / 45) % 8,
    showers,
    score,
    bestMoment,
  };
}

/** Every night of a trip, from the first evening. */
export function tripNights(
  lat: number,
  lng: number,
  start: string,
  nights: number,
): NightPlan[] {
  return Array.from({ length: nights }, (_, i) =>
    nightPlan(lat, lng, addDays(start, i)),
  );
}

/** Clouds hide the sky: a fully overcast night keeps a fifth of its score. */
export function withClouds(score: number, cloudPct: number | null): number {
  if (cloudPct === null) return score;
  return Math.round(score * (1 - (0.8 * Math.min(100, cloudPct)) / 100));
}

/** The Sky lab's link for that night's darkest moment. */
export function skyLabLink(lat: number, lng: number, night: NightPlan): string {
  return `/labs/sky${skyLink(placeAt(lat, lng), night.bestMoment ?? night.darkStart ?? night.sunset)}`;
}
