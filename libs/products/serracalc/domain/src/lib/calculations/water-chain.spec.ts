import { describe, expect, it } from 'vitest';
import { SAMPLE_PROJECTS } from '../data/sample-projects.data';
import type { FertigationParams } from '../models/serra.models';
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

describe('the drain EC limit', () => {
  it('comes from the crop: tomato tolerates a 4.8 drain, lettuce does not', () => {
    const tomato = fertigation(defaultFertigation(KEBILI));
    expect(tomato.drainEcDsM).toBeCloseTo(4.8, 1);
    expect(tomato.notes.map((n) => n.code)).not.toContain('fert.drainHigh');
    const lettuce = fertigation(
      defaultFertigation({ ...KEBILI, crop: 'lettuce' }),
    );
    expect(lettuce.notes.map((n) => n.code)).toContain('fert.drainHigh');
  });

  it('falls back to the flush ceiling for results saved before it', () => {
    const old: FertigationParams = { ...defaultFertigation(KEBILI) };
    delete old.drainEcMaxDsM;
    const r = fertigation(old);
    // 4.8 against the 4.5 ceiling, as before.
    expect(r.notes.find((n) => n.code === 'fert.drainHigh')?.values).toEqual({
      ec: 4.8,
      max: 4.5,
    });
  });
});

describe('fertigation and drain recycling', () => {
  it('loses about 31 % of the yield at EC 6.3 (indicative linear rule)', () => {
    expect(1 - salinityYield(6.3, 7.3, 2)).toBeCloseTo(0.314, 3);
    expect(salinityYield(1.8, 7.3, 2)).toBe(1);
  });

  it('flushes a closed loop when the drain reaches the sodium limit', () => {
    // 50 m³ of solution, 1 mmol/L Na in 25 m³ of make-up a day, limit 8 in
    // the drain. Half the water given drains, so the drain holds twice the
    // feed's sodium: the feed may reach 8 × 25 / 50 = 4, in
    // V (C_lim·D/A − C_0) / (C_in × make-up) = 50 × 3 / 25 = 6 days.
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
    expect(r.flushDay).toBe(6);
    expect(r.naEquilibriumMmolL).toBeNull();
    expect(r.days[0].naMmolL).toBe(2);
    expect(r.notes.find((n) => n.code === 'fert.flush')?.values).toEqual({
      days: 6,
      na: 8,
    });
  });

  it('levels sodium in the drain off where salt in = salt out', () => {
    const r = fertigation(defaultFertigation(KEBILI));
    // 30 % drain, 40 % of it reused: fresh 0.88 A, let go 0.18 A, so the
    // drain holds 1 × 0.88 / 0.18 ≈ 4.9 mmol/L, under the 8 limit.
    expect(r.naEquilibriumMmolL).toBe(4.9);
    expect(r.clEquilibriumMmolL).toBe(4.9);
    expect(r.flushDay).toBeNull();
    expect(r.notes.map((n) => n.code)).toContain('fert.levels');
    expect(r.waterSavedPct).toBe(12);
    expect(r.drainEcDsM).toBeGreaterThan(r.rootEcDsM);
    expect(r.days.at(-1)?.naMmolL).toBeCloseTo(r.naEquilibriumMmolL ?? 0, 0);
  });

  it('flushes sooner the smaller the drain, which concentrates the salt', () => {
    const base = { ...defaultFertigation(KEBILI), recyclePct: 100 };
    const wet = fertigation({ ...base, drainPct: 40 });
    const dry = fertigation({ ...base, drainPct: 20 });
    expect(dry.flushDay ?? 0).toBeLessThan(wet.flushDay ?? 0);
  });

  // A closed loop of 50 m³ given 50 m³ a day, half drained: 25 m³ of
  // make-up a day, so the factor g climbs by 0.5 a day. The drain holds
  // twice the feed's salt, so limits of 16 Na and 20 Cl in the drain are
  // reached at g = 8 and 10.
  const closed = {
    ...defaultFertigation(KEBILI),
    appliedM3Day: 50,
    drainPct: 50,
    recyclePct: 100,
    sourceNaMmolL: 1,
    sourceClMmolL: 1,
    sourceHco3MmolL: 0,
    naLimitMmolL: 16,
    clLimitMmolL: 20,
    flushEcDsM: 10,
    systemM3: 50,
  };

  it('flushes on chloride when it reaches its limit first', () => {
    const r = fertigation({ ...closed, sourceClMmolL: 2 });
    // Chloride: 4 in the drain at the start, 20 at g = 20 / (2 × 2) = 5,
    // reached in 50 × 4 / 25 = 8 days.
    expect(r.limitBy).toBe('cl');
    expect(r.flushDay).toBe(8);
    expect(r.notes.map((n) => n.code)).toContain('fert.flushCl');
    expect(r.days[2].clMmolL).toBeCloseTo(2 * r.days[2].naMmolL, 2);
  });

  it('flushes on the EC ceiling: 0.06 dS/m per mmol/L of Na or Cl', () => {
    // 2.7 → 3.3 dS/m is 0.6 dS/m of salt: g − 1 = 0.6 / 0.12 = 5, 10 days.
    const r = fertigation({ ...closed, flushEcDsM: 3.3 });
    expect(r.limitBy).toBe('ec');
    expect(r.flushDay).toBe(10);
    expect(r.days[5].feedEcDsM).toBeCloseTo(2.7 + 0.12 * 0.5 * 10, 2);
  });

  it('keeps results saved before chloride: it follows the sodium', () => {
    const old: FertigationParams = { ...closed };
    delete old.sourceClMmolL;
    delete old.sourceHco3MmolL;
    delete old.clLimitMmolL;
    const r = fertigation(old);
    expect(r.flushDay).toBe(14);
    expect(r.limitBy).toBe('na');
    expect(r.clEquilibriumMmolL).toBeNull();
    expect(r.days.at(-1)?.clMmolL).toBe(r.days.at(-1)?.naMmolL);
  });

  it('compares a year of flushing, bleeding and a lowered refill EC', () => {
    const r = fertigation({ ...closed, flushEcDsM: 3.3 });
    const by = Object.fromEntries(r.strategies.map((s) => [s.id, s]));
    // Flush at the ceiling: every 10 days, 36 times a year, 50 m³ each.
    expect(by['flush'].flushesYear).toBe(36);
    expect(by['flush'].letGoM3Year).toBe(1800);
    // Bleed L = U·D / (g·A − D) = 25 × 25 / (6 × 50 − 25) ≈ 2.27 m³/d.
    expect(by['bleed'].letGoM3Day).toBeCloseTo(2.27, 2);
    expect(by['bleed'].flushesYear).toBe(0);
    expect(by['bleed'].letGoM3Year).toBeLessThan(by['flush'].letGoM3Year);
    // Holding the EC, the loop runs to the sodium limit: 16 in the drain is
    // g = 8, 14 days.
    expect(by['variable'].flushesYear).toBe(26);
    expect(by['variable'].meanRootEcDsM).toBeLessThan(
      by['flush'].meanRootEcDsM,
    );
    expect(by['variable'].minNutrientEcDsM).toBeLessThan(
      by['flush'].minNutrientEcDsM,
    );
    // As set here (fully closed), the same as flushing at the ceiling.
    expect(by['current'].flushesYear).toBe(by['flush'].flushesYear);
    expect(r.notes.map((n) => n.code)).toContain('fert.bleed');
  });

  it('flushes less often with acid in the refill when bicarbonate builds', () => {
    // 2 mmol/L of bicarbonate adds 0.09 dS/m per step of g: the EC ceiling
    // comes at g = 1 + 0.6 / 0.21, day 6; with acid only Na and Cl count.
    const r = fertigation({ ...closed, sourceHco3MmolL: 2, flushEcDsM: 3.3 });
    const by = Object.fromEntries(r.strategies.map((s) => [s.id, s]));
    expect(r.flushDay).toBe(6);
    expect(by['flush'].flushesYear).toBe(60);
    expect(by['acid'].flushesYear).toBe(36);
    expect(by['acid'].letGoM3Year).toBeLessThan(by['flush'].letGoM3Year);
  });

  it('works out the drain EC from what the crop takes up', () => {
    const r = fertigation({
      ...defaultFertigation(KEBILI),
      appliedM3Day: 100,
      drainPct: 30,
      targetEcDsM: 2.7,
      uptakeEcDsM: 1.8,
      drainEcMaxDsM: 4.5,
    });
    // (100 × 2.7 − 70 × 1.8) / 30 = 4.8 dS/m, above a 4.5 drain limit.
    expect(r.drainEcDsM).toBeCloseTo(4.8, 2);
    expect(r.notes.map((n) => n.code)).toContain('fert.drainHigh');
  });
});
