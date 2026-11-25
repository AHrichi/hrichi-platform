import { describe, expect, it } from 'vitest';
import { climateById } from '../data/climates.data';
import { SAMPLE_PROJECTS } from '../data/sample-projects.data';
import { type CalcContext, defaultSolarPv } from './defaults';
import { PV_CELL_RISE_K, PV_DESERT_YIELD, solarPv } from './solar';

const kebili = SAMPLE_PROJECTS[0];
const KEBILI: CalcContext = {
  greenhouse: kebili.greenhouse,
  climateId: kebili.climateId,
  crop: kebili.crop,
  currency: kebili.currency,
};

describe('solar power for the site', () => {
  it('yields what solar atlases give for the desert edge', () => {
    // Kebili: about 1,940 kWh/m² a year on the flat.
    const r = solarPv(defaultSolarPv(KEBILI));
    expect(r.specificKwhKwp).toBeGreaterThanOrEqual(PV_DESERT_YIELD.low);
    expect(r.specificKwhKwp).toBeLessThanOrEqual(PV_DESERT_YIELD.high);
    expect(r.notes.map((n) => n.code)).toContain('solar.range');
    expect(r.months).toHaveLength(12);
  });

  it('yields far less in the Netherlands, and says so', () => {
    const r = solarPv({ ...defaultSolarPv(KEBILI), climateId: 'de_bilt' });
    expect(r.specificKwhKwp).toBeLessThan(1100);
    expect(r.notes.map((n) => n.code)).toContain('solar.outside');
  });

  it('works one month out by hand', () => {
    const p = {
      ...defaultSolarPv(KEBILI),
      peakKw: 100,
      tiltGainPct: 10,
      systemLossPct: 10,
      soilingPct: 0,
      tempLossPctK: 0.4,
    };
    const july = climateById(p.climateId).months[6];
    const cell = (3 * july.tMaxC + july.tMinC) / 4 + PV_CELL_RISE_K;
    const expected =
      100 *
      (july.radiationMj / 3.6) *
      31 *
      1.1 *
      0.9 *
      (1 - 0.004 * (cell - 25));
    expect(solarPv(p).months[6].pvKwh).toBeCloseTo(expected, -1);
  });

  it('loses more to heat in July than in January', () => {
    const r = solarPv(defaultSolarPv(KEBILI));
    expect(r.months[6].heatLossPct).toBeGreaterThan(r.months[0].heatLossPct);
    expect(r.notes.map((n) => n.code)).toContain('solar.heat');
  });

  it('only meets the daytime load: the rest is exported, the night bought', () => {
    const base = defaultSolarPv(KEBILI);
    const big = solarPv({ ...base, dayLoadKw: 10_000, nightLoadKw: 0 });
    expect(big.selfMwh).toBe(big.yieldMwh);
    expect(big.exportMwh).toBe(0);
    const none = solarPv({ ...base, dayLoadKw: 0, nightLoadKw: 50 });
    expect(none.selfMwh).toBe(0);
    expect(none.exportMwh).toBe(none.yieldMwh);
    // 50 kW all night, every night, bought from the grid.
    expect(none.importMwh).toBe(none.demandMwh);
    expect(none.notes.map((n) => n.code)).toContain('solar.export');
  });

  it('pays back the cost from bills avoided and exports, less upkeep', () => {
    const p = defaultSolarPv(KEBILI);
    const r = solarPv(p);
    const upkeep = (r.capex * p.omPctYear) / 100;
    const net =
      r.selfMwh * 1000 * p.buyPrice +
      r.exportMwh * 1000 * p.exportPrice -
      upkeep;
    expect(r.netSavingsYear).toBeCloseTo(net, -2);
    expect(r.paybackYears).toBeCloseTo(r.capex / net, 0);
    const free = solarPv({ ...p, buyPrice: 0, exportPrice: 0 });
    expect(free.paybackYears).toBeNull();
    expect(free.notes.map((n) => n.code)).toContain('solar.never');
  });

  it('needs land for the rows, not just the modules', () => {
    // 100 kWp of 200 W/m² modules is 500 m²; rows on 40 % of the land.
    const r = solarPv({
      ...defaultSolarPv(KEBILI),
      peakKw: 100,
      moduleWm2: 200,
      groundCoverPct: 40,
    });
    expect(r.moduleM2).toBe(500);
    expect(r.landHa).toBeCloseTo(0.13, 2);
  });

  it('sizes the array to the site’s daytime use by default', () => {
    const p = defaultSolarPv(KEBILI);
    const r = solarPv(p);
    expect(p.dayLoadKw).toBeGreaterThan(p.nightLoadKw);
    // About as much made as used by day: most of it used on site.
    expect(r.selfUsePct).toBeGreaterThan(60);
  });
});
