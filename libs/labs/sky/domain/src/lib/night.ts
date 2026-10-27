import {
  Body,
  MakeTime,
  Observer,
  SearchAltitude,
  SearchRiseSet,
} from 'astronomy-engine';
import { constellations } from './catalog';
import type { Place } from './place';
import { activeShowers, type MeteorShower } from './showers';
import {
  altitudeAzimuth,
  equatorialVector,
  moonPhaseName,
  rotate,
  skyAt,
  type Planet,
} from './sky';

const DAY = 86_400_000;

export interface RiseSet {
  rise: Date | null;
  set: Date | null;
}

export interface PlanetTonight extends RiseSet {
  name: Planet;
  /** At the moment shown, degrees. */
  altitude: number;
  azimuth: number;
  magnitude: number;
}

export interface Overhead {
  id: string;
  name: string;
  altitude: number;
  azimuth: number;
}

/** What a stargazer wants to know about the night around one moment. */
export interface NightSummary {
  /** Null when the Sun doesn't set (midnight sun) or rise (polar night). */
  sunset: Date | null;
  sunrise: Date | null;
  /** Astronomical darkness, Sun below −18°; null if it never gets that dark. */
  darkStart: Date | null;
  darkEnd: Date | null;
  moon: RiseSet & {
    phase: number;
    phaseName: string;
    illumination: number;
    altitude: number;
  };
  planets: PlanetTonight[];
  /** Constellations at least 15° up at the moment shown, highest first. */
  constellations: Overhead[];
  showers: { shower: MeteorShower; rate: number; radiantAltitude: number }[];
}

const toDate = (time: { date: Date } | null) => time?.date ?? null;

function riseSet(
  body: Body,
  observer: Observer,
  from: Date,
): { rise: Date | null; set: Date | null } {
  return {
    rise: toDate(SearchRiseSet(body, observer, +1, MakeTime(from), 1)),
    set: toDate(SearchRiseSet(body, observer, -1, MakeTime(from), 1)),
  };
}

/**
 * The night around `date` for `place`: by day, the coming night; by night,
 * the one in progress. Rise and set times are the next ones after sunset.
 */
export function nightSummary(place: Place, date: Date): NightSummary {
  const observer = new Observer(place.lat, place.lon, 0);
  const sky = skyAt(date, place);
  const searchFrom =
    sky.sun.altitude > -0.833 ? date : new Date(date.getTime() - DAY);

  const sunset = toDate(
    SearchRiseSet(Body.Sun, observer, -1, MakeTime(searchFrom), 1),
  );
  const nightStart = sunset ?? date;
  const sunrise = toDate(
    SearchRiseSet(Body.Sun, observer, +1, MakeTime(nightStart), 1),
  );
  let darkStart = toDate(
    SearchAltitude(Body.Sun, observer, -1, MakeTime(nightStart), 1, -18),
  );
  if (darkStart && sunrise && darkStart > sunrise) {
    darkStart = null;
  }
  const darkEnd = darkStart
    ? toDate(
        SearchAltitude(Body.Sun, observer, +1, MakeTime(darkStart), 1, -18),
      )
    : null;

  const local = sky.equatorialToLocal;
  const overhead = constellations
    .map((constellation) => {
      const { altitude, azimuth } = altitudeAzimuth(
        rotate(local, equatorialVector(constellation.ra, constellation.dec)),
      );
      return {
        id: constellation.id,
        name: constellation.name,
        altitude,
        azimuth,
      };
    })
    .filter((constellation) => constellation.altitude >= 15)
    .sort((a, b) => b.altitude - a.altitude);

  return {
    sunset,
    sunrise,
    darkStart,
    darkEnd,
    moon: {
      ...riseSet(Body.Moon, observer, nightStart),
      phase: sky.moon.phase,
      phaseName: moonPhaseName(sky.moon.phase),
      illumination: sky.moon.illumination,
      altitude: sky.moon.altitude,
    },
    planets: sky.planets.map((planet) => ({
      name: planet.name as Planet,
      altitude: planet.altitude,
      azimuth: planet.azimuth,
      magnitude: planet.magnitude,
      ...riseSet(Body[planet.name as Planet], observer, nightStart),
    })),
    constellations: overhead,
    showers: activeShowers(date).map(({ shower, rate }) => ({
      shower,
      rate,
      radiantAltitude: altitudeAzimuth(
        rotate(local, equatorialVector(shower.ra, shower.dec)),
      ).altitude,
    })),
  };
}
