import {
  Body,
  Equator,
  Horizon,
  Illumination,
  MakeTime,
  MoonPhase,
  Observer,
  RotateVector,
  Rotation_EQJ_HOR,
  Vector,
  type AstroTime,
} from 'astronomy-engine';
import type { Place } from './place';

const DEG = Math.PI / 180;

function julianDate(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

/**
 * Greenwich mean sidereal time in radians (IAU 1982, as in Vallado and
 * satellite.js): the angle that turns inertial coordinates into Earth-fixed ones.
 */
export function gmst(date: Date): number {
  const t = (julianDate(date) - 2_451_545) / 36_525;
  const seconds =
    -6.2e-6 * t * t * t +
    0.093104 * t * t +
    (876_600 * 3600 + 8_640_184.812866) * t +
    67_310.54841;
  const radians = ((seconds * DEG) / 240) % (2 * Math.PI);
  return radians < 0 ? radians + 2 * Math.PI : radians;
}

/**
 * Unit vector from the Earth to the Sun in inertial (equator of date)
 * coordinates. The Astronomical Almanac's low-precision formula: about 0.01°,
 * plenty to draw the day/night line.
 */
export function sunDirection(date: Date): [number, number, number] {
  const n = julianDate(date) - 2_451_545;
  const meanLongitude = (280.46 + 0.9856474 * n) * DEG;
  const meanAnomaly = (357.528 + 0.9856003 * n) * DEG;
  const longitude =
    meanLongitude +
    (1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * DEG;
  const obliquity = (23.439 - 4e-7 * n) * DEG;
  return [
    Math.cos(longitude),
    Math.cos(obliquity) * Math.sin(longitude),
    Math.sin(obliquity) * Math.sin(longitude),
  ];
}

/** Latitude and longitude (degrees) where the Sun is overhead. */
export function subsolarPoint(date: Date): { lat: number; lon: number } {
  const [x, y, z] = sunDirection(date);
  const rightAscension = Math.atan2(y, x);
  let lon = (rightAscension - gmst(date)) / DEG;
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;
  return { lat: Math.asin(z) / DEG, lon };
}

/**
 * Directions in the observer's frame, as the Sky lab's scene draws it:
 * x east, y up (zenith), z south. The camera's default −z looks north.
 */
export type Direction = [number, number, number];

/** astronomy-engine's horizontal frame is x north, y west, z zenith. */
function fromHorizontal(v: Vector): Direction {
  return [-v.y, v.z, -v.x];
}

/** The direction of an altitude and azimuth (degrees, azimuth east of north). */
export function directionOf(altitude: number, azimuth: number): Direction {
  const alt = altitude * DEG;
  const az = azimuth * DEG;
  const north = Math.cos(alt) * Math.cos(az);
  const east = Math.cos(alt) * Math.sin(az);
  return [east, Math.sin(alt), -north];
}

/** Altitude and azimuth (degrees) of a direction. */
export function altitudeAzimuth([x, y, z]: Direction): {
  altitude: number;
  azimuth: number;
} {
  const azimuth = Math.atan2(x, -z) / DEG;
  return {
    altitude: Math.asin(Math.max(-1, Math.min(1, y))) / DEG,
    azimuth: azimuth < 0 ? azimuth + 360 : azimuth,
  };
}

function observerOf(place: Place): Observer {
  return new Observer(place.lat, place.lon, 0);
}

/**
 * The rotation from J2000 equatorial coordinates (the star catalogue's) to the
 * observer's frame, row-major: precession, nutation, Earth's rotation and the
 * observer's latitude in one matrix, so the scene turns every star at once.
 * Built by rotating the basis vectors, so it never depends on how
 * astronomy-engine lays out its matrices.
 */
export function equatorialToLocal(date: Date, place: Place): number[] {
  const time = MakeTime(date);
  const rotation = Rotation_EQJ_HOR(time, observerOf(place));
  const [cx, cy, cz] = (
    [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ] as const
  ).map(([x, y, z]) =>
    fromHorizontal(RotateVector(rotation, new Vector(x, y, z, time))),
  );
  // prettier-ignore
  return [
    cx[0], cy[0], cz[0],
    cx[1], cy[1], cz[1],
    cx[2], cy[2], cz[2],
  ];
}

/** Applies a row-major 3×3 matrix. */
export function rotate(matrix: number[], [x, y, z]: Direction): Direction {
  return [
    matrix[0] * x + matrix[1] * y + matrix[2] * z,
    matrix[3] * x + matrix[4] * y + matrix[5] * z,
    matrix[6] * x + matrix[7] * y + matrix[8] * z,
  ];
}

/** Unit vector of J2000 right ascension and declination, both in degrees. */
export function equatorialVector(ra: number, dec: number): Direction {
  const a = ra * DEG;
  const d = dec * DEG;
  return [Math.cos(d) * Math.cos(a), Math.cos(d) * Math.sin(a), Math.sin(d)];
}

export const planets = [
  'Mercury',
  'Venus',
  'Mars',
  'Jupiter',
  'Saturn',
] as const;
export type Planet = (typeof planets)[number];

export interface BodyState {
  name: 'Sun' | 'Moon' | Planet;
  direction: Direction;
  /** Degrees, with atmospheric refraction. */
  altitude: number;
  azimuth: number;
  magnitude: number;
}

export interface MoonState extends BodyState {
  /** Lit fraction of the disc, 0–1. */
  illumination: number;
  /** Ecliptic longitude east of the Sun, 0–360: 0 new, 90 first quarter, 180 full. */
  phase: number;
}

export type Twilight = 'day' | 'civil' | 'nautical' | 'astronomical' | 'night';

/** The sky's brightness, named by how far below the horizon the Sun is. */
export function twilightOf(sunAltitude: number): Twilight {
  if (sunAltitude > -0.833) return 'day';
  if (sunAltitude > -6) return 'civil';
  if (sunAltitude > -12) return 'nautical';
  if (sunAltitude > -18) return 'astronomical';
  return 'night';
}

export interface SkyState {
  /** ms since 1970. */
  time: number;
  equatorialToLocal: number[];
  sun: BodyState;
  moon: MoonState;
  planets: BodyState[];
  twilight: Twilight;
}

function bodyState(
  body: Body,
  name: BodyState['name'],
  time: AstroTime,
  observer: Observer,
  magnitude: number,
): BodyState {
  const equatorial = Equator(body, time, observer, true, true);
  const { altitude, azimuth } = Horizon(
    time,
    observer,
    equatorial.ra,
    equatorial.dec,
    'normal',
  );
  return {
    name,
    direction: directionOf(altitude, azimuth),
    altitude,
    azimuth,
    magnitude,
  };
}

/** Everything the scene needs to draw the sky at one moment. */
export function skyAt(date: Date, place: Place): SkyState {
  const time = MakeTime(date);
  const observer = observerOf(place);
  const sun = bodyState(Body.Sun, 'Sun', time, observer, -26.7);
  const moonLight = Illumination(Body.Moon, time);
  const moon: MoonState = {
    ...bodyState(Body.Moon, 'Moon', time, observer, moonLight.mag),
    illumination: moonLight.phase_fraction,
    phase: MoonPhase(time),
  };
  return {
    time: date.getTime(),
    equatorialToLocal: equatorialToLocal(date, place),
    sun,
    moon,
    planets: planets.map((name) =>
      bodyState(
        Body[name],
        name,
        time,
        observer,
        Illumination(Body[name], time).mag,
      ),
    ),
    twilight: twilightOf(sun.altitude),
  };
}

/** `Waxing crescent`, `Full moon`… from the phase angle. */
export function moonPhaseName(phase: number): string {
  const names = [
    'New moon',
    'Waxing crescent',
    'First quarter',
    'Waxing gibbous',
    'Full moon',
    'Waning gibbous',
    'Last quarter',
    'Waning crescent',
  ];
  return names[Math.round((((phase % 360) + 360) % 360) / 45) % 8];
}
