// Writes reference nights computed with Astronomy Engine, an independent
// library, for the Orbit API's tests (ADR-0017): its Orekit-based planner
// must agree to within two minutes and its Moon to within a tenth of a degree.
//
// Usage: node tools/scripts/sky-fixtures.mjs
import {
  Body,
  GeoVector,
  Illumination,
  MakeTime,
  Observer,
  SearchAltitude,
  SearchRiseSet,
} from 'astronomy-engine';
import { writeFileSync } from 'node:fs';

const places = [
  {
    name: 'Tunis',
    lat: 36.8,
    lon: 10.2,
    zone: 'Africa/Tunis',
    date: '2026-08-12',
  },
  {
    name: 'Sfax',
    lat: 34.7,
    lon: 10.8,
    zone: 'Africa/Tunis',
    date: '2026-12-13',
  },
  // Midsummer: the Sun never gets 18° below the horizon.
  {
    name: 'Reykjavík',
    lat: 64.1,
    lon: -21.9,
    zone: 'Atlantic/Reykjavik',
    date: '2026-06-20',
  },
  // Polar night: the Sun doesn't rise.
  {
    name: 'Tromsø',
    lat: 69.6,
    lon: 19.0,
    zone: 'Europe/Oslo',
    date: '2026-12-20',
  },
  {
    name: 'Quito',
    lat: -0.2,
    lon: -78.5,
    zone: 'America/Guayaquil',
    date: '2026-03-20',
  },
  {
    name: 'Sydney',
    lat: -33.9,
    lon: 151.2,
    zone: 'Australia/Sydney',
    date: '2026-07-01',
  },
];

/** The UTC instant of 12:00 on `date` in `zone`. */
function noon(date, zone) {
  const guess = Date.parse(`${date}T12:00:00Z`);
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: zone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(new Date(guess));
  const get = (type) => Number(parts.find((part) => part.type === type).value);
  const local = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
  );
  return new Date(guess - (local - guess));
}

const DAY = 86_400_000;
/** The first event in the 24 h after noon, as ISO, or null. */
const within = (start, time) =>
  time && time.date.getTime() < start.getTime() + DAY
    ? time.date.toISOString()
    : null;

const nights = places.map((place) => {
  const observer = new Observer(place.lat, place.lon, 0);
  const start = noon(place.date, place.zone);
  const t = MakeTime(start);
  const riseSet = (body, direction) =>
    within(start, SearchRiseSet(body, observer, direction, t, 1));
  const altitude = (direction, degrees) =>
    within(start, SearchAltitude(Body.Sun, observer, direction, t, 1, degrees));
  const midnight = new Date(start.getTime() + DAY / 2);
  return {
    ...place,
    noon: start.toISOString(),
    sunset: riseSet(Body.Sun, -1),
    civilDusk: altitude(-1, -6),
    nauticalDusk: altitude(-1, -12),
    astronomicalDusk: altitude(-1, -18),
    astronomicalDawn: altitude(+1, -18),
    nauticalDawn: altitude(+1, -12),
    civilDawn: altitude(+1, -6),
    sunrise: riseSet(Body.Sun, +1),
    moonrise: riseSet(Body.Moon, +1),
    moonset: riseSet(Body.Moon, -1),
    moonIllumination: Illumination(Body.Moon, midnight).phase_fraction,
  };
});

// The Moon's geocentric position, J2000 equator (EME2000), every 5 days of 2026.
const moon = Array.from({ length: 73 }, (_, i) => {
  const time = new Date(Date.UTC(2026, 0, 1) + i * 5 * DAY);
  const v = GeoVector(Body.Moon, time, false);
  const km = 149_597_870.7;
  return { time: time.toISOString(), x: v.x * km, y: v.y * km, z: v.z * km };
});

const path = 'apps/orbit-api/src/test/resources/night-fixtures.json';
writeFileSync(
  path,
  `${JSON.stringify({ source: 'astronomy-engine 2.1.19, tools/scripts/sky-fixtures.mjs', nights, moon }, null, 2)}\n`,
);
console.log(
  `Wrote ${path}: ${nights.length} nights, ${moon.length} Moon positions`,
);
