import type { PadFanParams, VentilationParams } from '../models/serra.models';
import { wetBulbC } from '../utils/physics';
import { padAndFan, solarLoadW, ventilation } from './cooling';

const sunny: VentilationParams = {
  floorAreaM2: 1000,
  coverAreaM2: 1400,
  volumeM3: 4500,
  uValue: 4,
  radiationWm2: 900,
  transmissionPct: 70,
  shadingPct: 0,
  evapotranspirationPct: 50,
  outsideC: 30,
  maxRiseK: 4,
  windMs: 2,
  ventOpeningM: 1,
  fanCapacityM3h: 30000,
};

describe('Solar load', () => {
  it('keeps the share the crop does not evaporate', () => {
    // 0.7 × 900 × 1000 × 0.5
    expect(solarLoadW(sunny)).toBe(315000);
    expect(solarLoadW({ ...sunny, shadingPct: 40 })).toBe(189000);
  });
});

describe('Ventilation', () => {
  it('moves enough air to hold the rise', () => {
    const r = ventilation(sunny);
    // (315 kW − 4 × 1400 × 4) / (1.2 × 1005 × 4)
    const flow = (315000 - 22400) / (1.2 * 1005 * 4);
    expect(r.flowM3s).toBeCloseTo(flow, 2);
    expect(r.airChangesPerHour).toBeCloseTo((flow * 3600) / 4500, 1);
    expect(r.fans).toBe(Math.ceil((flow * 3600) / 30000));
  });

  it('sizes the vents by Boulard and Baille', () => {
    const r = ventilation(sunny);
    const drive = Math.sqrt(2 * 9.81 * (4 / 303.15) * 0.25 + 0.1 * 4);
    const area = (2 * r.flowM3s) / (0.65 * drive);
    expect(r.ventAreaM2).toBeCloseTo(area, 0);
    expect(r.ventPct).toBeCloseTo(area / 10, 0);
  });

  it('needs less air with a shade screen', () => {
    expect(ventilation({ ...sunny, shadingPct: 50 }).flowM3h).toBeLessThan(
      ventilation(sunny).flowM3h / 1.9,
    );
  });
});

describe('Fan and pad', () => {
  const hot: PadFanParams = {
    ...sunny,
    shadingPct: 30,
    outsideC: 40,
    outsideRhPct: 20,
    padEfficiencyPct: 80,
    riseK: 4,
    padFaceVelocityMs: 1.25,
    padHeightM: 1.8,
    padToFanM: 40,
    hoursPerDay: 8,
  };

  it('cools the air towards the wet bulb', () => {
    const r = padAndFan(hot);
    const tw = wetBulbC(40, 20);
    // About 22 °C wet bulb in dry 40 °C air.
    expect(tw).toBeGreaterThan(21);
    expect(tw).toBeLessThan(24);
    expect(r.padOutletC).toBeCloseTo(40 - 0.8 * (40 - tw), 1);
    expect(r.exhaustC).toBeCloseTo(r.padOutletC + 4, 1);
  });

  it('sizes fans, pads and water', () => {
    const r = padAndFan(hot);
    const flow = r.flowM3h / 3600;
    expect(r.padAreaM2).toBeCloseTo(flow / 1.25, 0);
    expect(r.padLengthM).toBeCloseTo(r.padAreaM2 / 1.8, 0);
    const evaporation =
      ((1.2 * flow * 1005 * (40 - r.padOutletC)) / 2.45e6) * 3600;
    expect(r.evaporationLh).toBeCloseTo(evaporation, -1);
  });

  it('warns when the air is already humid', () => {
    expect(
      padAndFan({ ...hot, outsideRhPct: 70 }).notes.map((n) => n.code),
    ).toContain('pad.humid');
  });
});
