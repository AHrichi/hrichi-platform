import {
  dayLengthHours,
  dewPointC,
  saturationVapourKpa,
  vpdKpa,
  wetBulbC,
} from './physics';

describe('Air and sun', () => {
  it('matches FAO-56 saturation vapour pressure', () => {
    // FAO-56 Annex 2: e° at 20 °C = 2.338 kPa, 30 °C = 4.243 kPa
    expect(saturationVapourKpa(20)).toBeCloseTo(2.338, 3);
    expect(saturationVapourKpa(30)).toBeCloseTo(4.243, 3);
  });

  it('gives VPD and dew point', () => {
    expect(vpdKpa(25, 60)).toBeCloseTo(saturationVapourKpa(25) * 0.4, 6);
    expect(dewPointC(25, 100)).toBeCloseTo(25, 6);
    expect(dewPointC(25, 50)).toBeCloseTo(13.9, 1);
  });

  it('matches Stull for the wet bulb', () => {
    // Stull's own example: 20 °C, 50 % → 13.7 °C
    expect(wetBulbC(20, 50)).toBeCloseTo(13.7, 1);
  });

  it('works out day length', () => {
    // Equator: 12 h all year; 36° N: about 14.5 h at midsummer.
    expect(dayLengthHours(0, 172)).toBeCloseTo(12, 1);
    expect(dayLengthHours(36, 172)).toBeGreaterThan(14.3);
    expect(dayLengthHours(36, 172)).toBeLessThan(14.7);
    expect(dayLengthHours(36, 355)).toBeLessThan(10);
  });
});
