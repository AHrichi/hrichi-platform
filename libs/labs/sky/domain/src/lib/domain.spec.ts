import {
  Body,
  DefineStar,
  Equator,
  Horizon,
  MakeTime,
  Observer,
  SearchMoonPhase,
  SiderealTime,
} from 'astronomy-engine';
import { constellations, namedStars, starLabel } from './catalog';
import { cities, defaultCity } from './cities';
import {
  formatCompass,
  formatDuration,
  formatFromNow,
  formatMagnitude,
} from './format';
import { nightSummary } from './night';
import {
  formatCoordinates,
  parseSkyLink,
  placeAt,
  placeFromCity,
  skyLink,
} from './place';
import { activeShowers, meteorShowers, showerRate } from './showers';
import { fromLocalInput, toLocalInput } from './time';
import {
  altitudeAzimuth,
  equatorialToLocal,
  equatorialVector,
  gmst,
  moonPhaseName,
  rotate,
  skyAt,
  subsolarPoint,
  sunDirection,
  twilightOf,
} from './sky';

const tunis = placeFromCity(cities[0]);
const augustNight = new Date('2026-08-12T22:00:00Z');
const angle = (a: number, b: number) =>
  Math.abs(((((a - b) % 360) + 540) % 360) - 180);

describe('sky', () => {
  it('matches astronomy-engine for sidereal time', () => {
    for (const iso of ['2026-10-27T12:00:00Z', '2030-01-01T00:00:00Z']) {
      const date = new Date(iso);
      const apparent = (SiderealTime(date) * 15 * Math.PI) / 180;
      // Mean and apparent sidereal time differ by under a second of time.
      expect(Math.abs(gmst(date) - apparent)).toBeLessThan(1e-3);
    }
  });

  it('puts the Sun over the equator at an equinox and the tropic at a solstice', () => {
    const equinox = sunDirection(new Date('2026-03-20T14:46:00Z'));
    const solstice = sunDirection(new Date('2026-06-21T08:24:00Z'));

    expect(Math.hypot(...equinox)).toBeCloseTo(1, 9);
    expect(Math.asin(equinox[2]) * (180 / Math.PI)).toBeCloseTo(0, 1);
    expect(Math.asin(solstice[2]) * (180 / Math.PI)).toBeCloseTo(23.44, 1);
  });

  it('finds the sub-solar point near Greenwich at noon UTC', () => {
    const { lat, lon } = subsolarPoint(new Date('2026-03-20T12:00:00Z'));

    expect(Math.abs(lat)).toBeLessThan(1);
    expect(Math.abs(lon)).toBeLessThan(5);
  });

  it('turns J2000 stars into the observer frame as Horizon() does', () => {
    const matrix = equatorialToLocal(augustNight, tunis);
    // A rotation: orthonormal rows.
    for (let row = 0; row < 3; row++) {
      const r = matrix.slice(row * 3, row * 3 + 3);
      expect(Math.hypot(...r)).toBeCloseTo(1, 9);
    }

    // Vega, J2000.
    const ra = 279.2347;
    const dec = 38.7837;
    const ours = altitudeAzimuth(rotate(matrix, equatorialVector(ra, dec)));
    DefineStar(Body.Star1, ra / 15, dec, 25);
    const observer = new Observer(tunis.lat, tunis.lon, 0);
    const time = MakeTime(augustNight);
    const ofDate = Equator(Body.Star1, time, observer, true, true);
    const theirs = Horizon(time, observer, ofDate.ra, ofDate.dec);

    // Only aberration (about 20″) separates the two.
    expect(Math.abs(ours.altitude - theirs.altitude)).toBeLessThan(0.02);
    expect(angle(ours.azimuth, theirs.azimuth)).toBeLessThan(0.05);
  });

  it('puts Polaris due north at the latitude', () => {
    const polaris = altitudeAzimuth(
      rotate(
        equatorialToLocal(augustNight, tunis),
        equatorialVector(37.9529, 89.2641),
      ),
    );
    expect(Math.abs(polaris.altitude - tunis.lat)).toBeLessThan(1);
    expect(angle(polaris.azimuth, 0)).toBeLessThan(1.5);
  });

  it('puts the Sun high over Tunis at noon on the June solstice', () => {
    // 90° − (latitude − 23.44°) = 76.6°.
    const sky = skyAt(new Date('2026-06-21T11:15:00Z'), tunis);
    expect(Math.abs(sky.sun.altitude - 76.6)).toBeLessThan(1);
    expect(sky.twilight).toBe('day');
    expect(sky.planets.map((planet) => planet.name)).toEqual([
      'Mercury',
      'Venus',
      'Mars',
      'Jupiter',
      'Saturn',
    ]);
  });

  it('names twilight by the Sun’s depth below the horizon', () => {
    expect(twilightOf(10)).toBe('day');
    expect(twilightOf(-3)).toBe('civil');
    expect(twilightOf(-9)).toBe('nautical');
    expect(twilightOf(-15)).toBe('astronomical');
    expect(twilightOf(-30)).toBe('night');
  });

  it('names the Moon’s phase', () => {
    const full = SearchMoonPhase(180, MakeTime(augustNight), 31)?.date as Date;
    const sky = skyAt(full, tunis);

    expect(moonPhaseName(sky.moon.phase)).toBe('Full moon');
    expect(sky.moon.illumination).toBeGreaterThan(0.98);
    expect(moonPhaseName(2)).toBe('New moon');
    expect(moonPhaseName(95)).toBe('First quarter');
    expect(moonPhaseName(350)).toBe('New moon');
  });
});

describe('the night', () => {
  it('finds sunset, darkness, sunrise and the Perseids over Tunis', () => {
    const night = nightSummary(tunis, augustNight);
    const [sunset, darkStart, darkEnd, sunrise] = [
      night.sunset,
      night.darkStart,
      night.darkEnd,
      night.sunrise,
    ] as Date[];

    expect(sunset < darkStart && darkStart < darkEnd).toBe(true);
    expect(darkEnd < sunrise).toBe(true);
    expect(sunset < augustNight && augustNight < sunrise).toBe(true);
    expect(night.showers[0].shower.name).toBe('Perseids');
    expect(night.showers[0].rate).toBeGreaterThan(80);
    // Highest first, all at least 15° up.
    const altitudes = night.constellations.map((c) => c.altitude);
    expect(altitudes).toEqual([...altitudes].sort((a, b) => b - a));
    expect(Math.min(...altitudes)).toBeGreaterThanOrEqual(15);
  });

  it('has no astronomical darkness in a Reykjavík summer', () => {
    const night = nightSummary(
      placeAt(64.15, -21.94),
      new Date('2026-06-21T00:30:00Z'),
    );
    expect(night.sunset).not.toBeNull();
    expect(night.darkStart).toBeNull();
  });

  it('has no sunset under Tromsø’s midnight sun', () => {
    const night = nightSummary(
      placeAt(69.65, 18.96),
      new Date('2026-06-21T12:00:00Z'),
    );
    expect(night.sunset).toBeNull();
  });
});

describe('meteor showers', () => {
  const byId = (id: string) => {
    const shower = meteorShowers.find((s) => s.id === id);
    if (!shower) {
      throw new Error(`No shower ${id}`);
    }
    return shower;
  };
  const perseids = byId('PER');
  const quadrantids = byId('QUA');

  it('peaks on the peak night and is zero out of season', () => {
    expect(showerRate(perseids, new Date('2026-08-12T12:00:00Z'))).toBeCloseTo(
      100,
      0,
    );
    expect(showerRate(perseids, new Date('2026-03-01T00:00:00Z'))).toBe(0);
  });

  it('handles a shower that spans New Year', () => {
    expect(
      showerRate(quadrantids, new Date('2027-01-04T00:00:00Z')),
    ).toBeGreaterThan(50);
    expect(
      showerRate(quadrantids, new Date('2026-12-30T00:00:00Z')),
    ).toBeGreaterThan(0);
  });

  it('lists the busiest active shower first', () => {
    const active = activeShowers(new Date('2026-12-14T00:00:00Z'));
    expect(active[0].shower.name).toBe('Geminids');
  });
});

describe('catalogue', () => {
  it('has the IAU constellations and names the brightest stars', () => {
    expect(constellations).toHaveLength(89);
    expect(starLabel(0)).toBe('Sirius');
    expect(namedStars.length).toBeGreaterThan(100);
  });
});

describe('places and links', () => {
  it('round-trips a shareable link', () => {
    const at = new Date('2026-08-12T22:00:00Z');
    const link = skyLink(tunis, at);

    expect(link).toBe('?lat=36.81&lon=10.18&at=2026-08-12T22%3A00Z');
    expect(parseSkyLink(link)).toEqual({ lat: 36.81, lon: 10.18, at });
  });

  it('ignores coordinates out of range and bad dates', () => {
    expect(parseSkyLink('?lat=95&lon=10')).toBeNull();
    expect(parseSkyLink('?lat=abc&lon=10')).toBeNull();
    expect(parseSkyLink('?lat=10&lon=10&at=yesterday')).toEqual({
      lat: 10,
      lon: 10,
      at: null,
    });
  });

  it('names a spot by its coordinates', () => {
    expect(formatCoordinates(-33.87, 151.21)).toBe('33.87° S, 151.21° E');
  });
});

describe('cities and formatting', () => {
  it('lists each city once, with a valid time zone', () => {
    const names = cities.map((c) => c.name);
    expect(new Set(names).size).toBe(names.length);
    for (const city of cities) {
      expect(() =>
        new Intl.DateTimeFormat('en', { timeZone: city.timeZone }).format(),
      ).not.toThrow();
    }
  });

  it('defaults to a city in the visitor time zone, else Tunis', () => {
    expect(defaultCity('Europe/Berlin').name).toBe('Berlin');
    expect(defaultCity('Pacific/Kiritimati').name).toBe('Tunis');
  });

  it('formats directions, durations and magnitudes', () => {
    expect(formatCompass(44)).toBe('NE');
    expect(formatCompass(359)).toBe('N');
    expect(formatDuration(400 * 60_000)).toBe('6 h 40 min');
    expect(formatDuration(25 * 60_000)).toBe('25 min');
    const now = new Date('2026-10-27T12:00:00Z');
    expect(formatFromNow(new Date('2026-10-27T15:12:00Z'), now)).toBe(
      'in 3 h 12 min',
    );
    expect(formatMagnitude(-1.44)).toBe('−1.4');
  });
});

describe('local times', () => {
  it('reads and writes date-time inputs in the place’s time zone', () => {
    const at = new Date('2026-08-12T22:00:00Z');
    expect(toLocalInput(at, 'Africa/Tunis')).toBe('2026-08-12T23:00');
    expect(fromLocalInput('2026-08-12T23:00', 'Africa/Tunis')).toEqual(at);
    // New York is on daylight-saving time (UTC−4) in August.
    expect(fromLocalInput('2026-08-12T20:00', 'America/New_York')).toEqual(
      new Date('2026-08-13T00:00:00Z'),
    );
    expect(fromLocalInput('not a date', 'Africa/Tunis')).toBeNull();
  });
});
