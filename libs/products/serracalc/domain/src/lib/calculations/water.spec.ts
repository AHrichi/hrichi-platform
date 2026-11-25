import { climateById } from '../data/climates.data';
import {
  DEFAULT_CONTEXT,
  defaultCropWater,
  defaultRainwater,
} from './defaults';
import { cropWater, rainwater, simulateBasin } from './water';

describe('Crop water', () => {
  const p = defaultCropWater(DEFAULT_CONTEXT);

  it('turns the light inside into litres per m²', () => {
    const r = cropWater(p);
    const june = climateById(p.climateId).months[5];
    const inside = june.radiationMj * 0.62;
    const net = (0.65 * inside) / 2.45;
    expect(r.months[5].netLm2).toBeCloseTo(net, 2);
    expect(r.months[5].grossLm2).toBeCloseTo(net / 0.75, 1);
    // A tomato crop in a Tunisian summer: about 5–7 L/m² a day applied.
    expect(r.peakGrossLm2).toBeGreaterThan(4.5);
    expect(r.peakGrossLm2).toBeLessThan(8);
  });

  it('peaks in summer and adds up the year', () => {
    const r = cropWater(p);
    expect([5, 6]).toContain(r.peakMonth);
    expect(r.annualM3).toBe(r.months.reduce((s, m) => s + m.houseM3Month, 0));
  });

  it('sizes drippers, shots and sections', () => {
    const r = cropWater(p);
    const emitters = Math.round(p.floorAreaM2 * 0.9 * 2.5);
    expect(r.emitters).toBe(emitters);
    expect(r.systemFlowM3h).toBeCloseTo((emitters * 2) / 1000, 1);
    expect(r.sections).toBe(Math.ceil(r.systemFlowM3h / p.pumpM3h));
    expect(r.shotsPerDayPeak).toBe(
      Math.ceil(r.litresPerEmitterPeak / 0.15 - 1e-9),
    );
    expect(r.shotMinutes).toBe(4.5);
  });
});

describe('Rainwater', () => {
  it('runs a basin month by month', () => {
    const months = simulateBasin([10, 0, 0], [2, 2, 2], 5);
    // Month 1: 10 in, 2 used, 8 left: 5 kept, 3 overflow.
    expect(months[0].usedM3).toBeGreaterThan(0);
    expect(months.every((m) => m.storedEndM3 <= 5)).toBe(true);
  });

  it('covers part of the demand and suggests a basin', () => {
    const p = defaultRainwater(DEFAULT_CONTEXT);
    const r = rainwater(p);
    expect(r.annualHarvestM3).toBeCloseTo(
      (r.annualRainMm * p.catchmentM2 * 0.8) / 1000,
      -1,
    );
    expect(r.coveragePct).toBeLessThanOrEqual(r.maxCoveragePct);
    expect(r.maxCoveragePct).toBeGreaterThan(0);
    const big = rainwater({ ...p, basinM3: r.suggestedBasinM3 });
    expect(big.coveragePct).toBeGreaterThanOrEqual(
      r.maxCoveragePct * 0.95 - 0.1,
    );
  });

  it('never uses more than falls', () => {
    const r = rainwater(defaultRainwater(DEFAULT_CONTEXT));
    expect(r.annualUsedM3).toBeLessThanOrEqual(r.annualHarvestM3 + 1);
  });
});
