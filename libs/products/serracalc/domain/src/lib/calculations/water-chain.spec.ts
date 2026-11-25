import { describe, expect, it } from 'vitest';
import { SAMPLE_PROJECTS } from '../data/sample-projects.data';
import { type CalcContext, defaultFertigation, defaultRo } from './defaults';
import {
  fertigation,
  recoveryFromBrine,
  salinityYield,
  seawaterRo,
} from './water-chain';

const kebili = SAMPLE_PROJECTS[0];
const KEBILI: CalcContext = {
  greenhouse: kebili.greenhouse,
  climateId: kebili.climateId,
  crop: kebili.crop,
  currency: kebili.currency,
};

describe('seawater RO', () => {
  it('reads a recovery near 0.49 from 39.5 g/L seawater and 77 g/L brine', () => {
    expect(recoveryFromBrine(39.5, 77)).toBeCloseTo(0.49, 2);
  });

  it('needs about 15,300 m³ of feed and 7,800 of brine for 7,500 of product', () => {
    const r = seawaterRo({
      ...defaultRo(KEBILI),
      demandM3Day: 7500,
      lossesPct: 0,
      recoveryPct: 49,
      capacityM3Day: 7500,
      availabilityPct: 100,
    });
    expect(r.feedM3Day).toBeCloseTo(15306, -1);
    expect(r.brineM3Day).toBeCloseTo(7806, -1);
    // Brine about S_feed / (1 − R): 39.5 / 0.51 ≈ 77 g/L.
    expect(r.brineSalinityGL).toBeCloseTo(77.4, 0);
    expect(r.coveragePct).toBe(100);
  });

  it('costs SEC × price per m³ and stores the days asked for', () => {
    const p = defaultRo(KEBILI);
    const r = seawaterRo(p);
    expect(r.costPerM3).toBeCloseTo(p.secKwhM3 * p.electricityPrice, 3);
    expect(r.tankM3).toBeCloseTo(r.needM3Day * p.storageDays, 0);
    expect(r.coveragePct).toBeGreaterThanOrEqual(100);
    expect(r.productEcDsM).toBeLessThan(1);
  });

  it('says when the plant is too small', () => {
    const r = seawaterRo({ ...defaultRo(KEBILI), capacityM3Day: 20 });
    expect(r.notes.map((n) => n.code)).toContain('ro.short');
  });
});

describe('fertigation and drain recycling', () => {
  it('loses about 31 % of the yield at EC 6.3 (indicative linear rule)', () => {
    expect(1 - salinityYield(6.3, 7.3, 2)).toBeCloseTo(0.314, 3);
    expect(salinityYield(1.8, 7.3, 2)).toBe(1);
  });

  it('flushes a closed loop after V (C_lim − C_0) / (C_in × make-up) days', () => {
    // 50 m³ of solution, 1 mmol/L Na in 25 m³ of make-up a day, limit 8.
    const r = fertigation({
      ...defaultFertigation(KEBILI),
      appliedM3Day: 50,
      drainPct: 50,
      recyclePct: 100,
      sourceNaMmolL: 1,
      naLimitMmolL: 8,
      flushEcDsM: 10,
      systemM3: 50,
    });
    expect(r.dischargedM3Day).toBe(0);
    expect(r.freshM3Day).toBe(25);
    expect(r.flushDay).toBe(14);
    expect(r.naEquilibriumMmolL).toBeNull();
  });

  it('levels sodium off when part of the drain is let go', () => {
    const r = fertigation(defaultFertigation(KEBILI));
    expect(r.naEquilibriumMmolL).not.toBeNull();
    expect(r.naEquilibriumMmolL ?? 0).toBeLessThan(8);
    expect(r.flushDay).toBeNull();
    expect(r.waterSavedPct).toBe(12);
    expect(r.drainEcDsM).toBeGreaterThan(r.rootEcDsM);
    expect(r.days.at(-1)?.naMmolL).toBeCloseTo(r.naEquilibriumMmolL ?? 0, 0);
  });

  it('works out the drain EC from what the crop takes up', () => {
    const r = fertigation({
      ...defaultFertigation(KEBILI),
      appliedM3Day: 100,
      drainPct: 30,
      targetEcDsM: 2.7,
      uptakeEcDsM: 1.8,
    });
    // (100 × 2.7 − 70 × 1.8) / 30 = 4.8 dS/m.
    expect(r.drainEcDsM).toBeCloseTo(4.8, 2);
    expect(r.notes.map((n) => n.code)).toContain('fert.drainHigh');
  });
});
