import { nightPlan, skyLabLink, tripNights, withClouds } from './night-plan';

// Aïn Draham, in the hills of north-west Tunisia.
const LAT = 36.7766;
const LNG = 8.6874;
const ms = (date: Date | null) => date?.getTime() ?? Number.NaN;

describe('Night plans', () => {
  // 12 August 2026: new Moon on the night of the Perseids' peak.
  const perseids = nightPlan(LAT, LNG, '2026-08-12');
  // 28 August 2026: full Moon, the shower long over.
  const fullMoon = nightPlan(LAT, LNG, '2026-08-28');

  it('finds the dark hours and the Moon', () => {
    expect(perseids.darkMinutes).toBeGreaterThan(6 * 60);
    expect(perseids.darkMinutes).toBeLessThan(9 * 60);
    expect(perseids.moonIllumination).toBeLessThan(0.02);
    expect(perseids.moonPhase).toBe(0);
    expect(perseids.moonFreeMinutes).toBe(perseids.darkMinutes);
    expect(fullMoon.moonPhase).toBe(4);
    expect(fullMoon.moonFreeMinutes).toBeLessThan(60);
    expect(ms(perseids.sunset)).toBeLessThan(ms(perseids.darkStart));
  });

  it('scores a moonless Perseids night far above a full-Moon one', () => {
    expect(perseids.showers.map((s) => s.id)).toContain('PER');
    expect(perseids.score).toBeGreaterThanOrEqual(90);
    expect(fullMoon.score).toBeLessThan(20);
  });

  it('plans every night of a trip from the first evening', () => {
    const nights = tripNights(LAT, LNG, '2026-08-11', 3);
    expect(nights.map((n) => n.date)).toEqual([
      '2026-08-11',
      '2026-08-12',
      '2026-08-13',
    ]);
  });

  it('lowers the score under clouds', () => {
    expect(withClouds(100, null)).toBe(100);
    expect(withClouds(100, 0)).toBe(100);
    expect(withClouds(100, 50)).toBe(60);
    expect(withClouds(100, 100)).toBe(20);
  });

  it('links to the darkest moment in the Sky lab', () => {
    const link = new URL(skyLabLink(LAT, LNG, perseids), 'https://x');
    expect(link.pathname).toBe('/labs/sky');
    expect(link.searchParams.get('lat')).toBe('36.78');
    expect(link.searchParams.get('lon')).toBe('8.69');
    const at = new Date(link.searchParams.get('at') ?? '');
    expect(at.getTime()).toBeGreaterThan(ms(perseids.darkStart));
    expect(at.getTime()).toBeLessThan(ms(perseids.darkEnd));
  });
});
