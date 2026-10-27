import { gstime } from 'satellite.js';
import { cities, defaultCity } from './cities';
import { formatFromNow, formatKm, formatPeriod } from './format';
import { groupOf } from './groups';
import { bundledSnapshot, type Omm } from './omm';
import { orbitShape } from './orbit-shape';
import { gmst, subsolarPoint, sunDirection } from './sky';

function elements(name: string, meanMotion: number, eccentricity = 0.001): Omm {
  return {
    ...bundledSnapshot.satellites[0],
    OBJECT_NAME: name,
    MEAN_MOTION: meanMotion,
    ECCENTRICITY: eccentricity,
  };
}

describe('orbitShape (mirrors the Orbit API)', () => {
  it('puts the ISS in LEO about 420 km up, once every 93 minutes', () => {
    const iss = bundledSnapshot.satellites.find(
      (s) => s.NORAD_CAT_ID === 25544,
    );
    const shape = orbitShape(iss as Omm);

    expect(shape.orbitClass).toBe('LEO');
    expect(shape.periodMinutes).toBeCloseTo(93, 0);
    expect(shape.perigeeKm).toBeGreaterThan(380);
    expect(shape.apogeeKm).toBeLessThan(450);
  });

  it('classifies geostationary, navigation and Molniya orbits', () => {
    expect(
      orbitShape(elements('EUTELSAT 7C', 1.00271, 0.0002)).orbitClass,
    ).toBe('GEO');
    expect(orbitShape(elements('GPS BIIF-1', 2.00562, 0.011)).orbitClass).toBe(
      'MEO',
    );
    expect(orbitShape(elements('MOLNIYA 1-93', 2.0068, 0.72)).orbitClass).toBe(
      'HEO',
    );
  });
});

describe('groupOf (mirrors the Orbit API)', () => {
  it.each([
    ['ISS (ZARYA)', 15.49, 'stations'],
    ['CSS (TIANHE)', 15.6, 'stations'],
    ['STARLINK-1007', 15.06, 'starlink'],
    ['GPS BIIF-1  (PRN 25)', 2.0056, 'gnss'],
    ['COSMOS 2425 (716)', 2.1308, 'gnss'],
    ['COSMOS 2551', 15.3, 'other'],
    ['NOAA 19', 14.13, 'weather'],
    ['HUBBLE SPACE TELESCOPE', 15.29, 'other'],
  ])('%s → %s', (name, meanMotion, group) => {
    const satellite = elements(name, meanMotion);
    expect(groupOf(satellite, orbitShape(satellite).orbitClass)).toBe(group);
  });
});

describe('sky', () => {
  it('matches satellite.js for sidereal time', () => {
    for (const iso of ['2026-10-27T12:00:00Z', '2030-01-01T00:00:00Z']) {
      const date = new Date(iso);
      expect(gmst(date)).toBeCloseTo(gstime(date), 9);
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
    // The equation of time keeps it within a few degrees of 0°.
    expect(Math.abs(lon)).toBeLessThan(5);
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

  it('formats distances, periods and countdowns', () => {
    expect(formatKm(35786.4)).toBe('35,786 km');
    expect(formatPeriod(92.9)).toBe('93 min');
    expect(formatPeriod(1436.1)).toBe('23 h 56 min');
    const now = new Date('2026-10-27T12:00:00Z');
    expect(formatFromNow('2026-10-27T15:12:00Z', now)).toBe('in 3 h 12 min');
    expect(formatFromNow('2026-10-27T11:00:00Z', now)).toBe('now');
  });
});
