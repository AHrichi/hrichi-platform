import { describe, expect, it } from 'vitest';
import { SAMPLE_PROJECTS } from '../data/sample-projects.data';
import type { GreenhouseProject } from '../models/serra.models';
import {
  type CalcContext,
  defaultEconomics,
  defaultEnergyHub,
  defaultHeatReuse,
} from './defaults';
import { energyHub, heatReuse } from './energy';
import {
  compartmentFigures,
  dailyWater,
  siteEconomics,
  siteTotals,
} from './site';

const kebili = SAMPLE_PROJECTS[0];
const KEBILI: CalcContext = {
  greenhouse: kebili.greenhouse,
  climateId: kebili.climateId,
  crop: kebili.crop,
  currency: kebili.currency,
};

describe('site scale', () => {
  it('turns 50 ha at 1.5 m³/m² a year into about 2,055 m³ a day (published 2,021)', () => {
    const day = dailyWater(50, 1.5);
    expect(day).toBeCloseTo(2055, 0);
    expect(Math.abs(day - 2021) / 2021).toBeLessThan(0.05);
  });

  it('turns 122 ha into about 5,014 m³ a day (published 4,932), within 5 %', () => {
    const day = dailyWater(122, 1.5);
    expect(day).toBeCloseTo(5014, 0);
    expect(Math.abs(day - 4932) / 4932).toBeLessThan(0.05);
  });

  it('scales a house to its compartment and adds compartments up', () => {
    const five: GreenhouseProject = { ...kebili, id: 'a', areaHa: 5 };
    const ten: GreenhouseProject = { ...kebili, id: 'b', areaHa: 10 };
    const a = compartmentFigures(five);
    const b = compartmentFigures(ten);
    expect(b.waterM3Year).toBeCloseTo(2 * a.waterM3Year, -2);
    expect(a.yieldT).toBe(1250);
    expect(a.labourDays).toBe(5000);
    const site = siteTotals([a, b]);
    expect(site.areaHa).toBe(15);
    expect(site.yieldT).toBe(3750);
    // The sample house uses about 1.4 m³ per m² a year (published site: 1.5).
    expect(site.waterM3PerM2Year).toBeGreaterThan(1.2);
    expect(site.waterM3PerM2Year).toBeLessThan(1.6);
    expect(site.co2eT).toBeCloseTo(3750 * 1.9, 0);
  });

  it('takes a project without an area at its house’s floor', () => {
    expect(compartmentFigures(kebili).areaHa).toBeCloseTo(0.96, 2);
  });
});

describe('economics', () => {
  it('reads 12.5 million kg on 50 ha as 250 t/ha', () => {
    const r = siteEconomics({
      ...defaultEconomics(KEBILI),
      areaHa: 50,
      yieldTHa: 250,
    });
    expect(r.yieldT).toBe(12500);
  });

  it('works out cost per kg, margin and payback', () => {
    const p = { ...defaultEconomics(KEBILI), areaHa: 1, yieldTHa: 200 };
    const r = siteEconomics(p);
    expect(r.revenue).toBeCloseTo(200_000 * p.pricePerKg, 0);
    expect(r.costPerKg).toBeCloseTo(r.totalCost / 200_000, 2);
    expect(r.margin).toBeCloseTo(r.revenue - r.totalCost, 0);
    if (r.paybackYears !== null) {
      expect(r.paybackYears).toBeCloseTo((10_000 * p.capexPerM2) / r.margin, 1);
    }
  });
});

describe('energy hub', () => {
  it('holds 29 kWh per m³ of well water chilled from 40 to 15 °C', () => {
    const r = heatReuse({
      waterM3Day: 1,
      inC: 40,
      outC: 15,
      heatDemandKwhDay: 0,
    });
    expect(r.kwhPerM3).toBeCloseTo(29.1, 1);
    // The sample house's 53 m³ peak day: about 1.5 MWh.
    const day = heatReuse({ ...defaultHeatReuse(KEBILI), waterM3Day: 53 });
    expect(day.kwhDay / 1000).toBeCloseTo(1.54, 1);
  });

  it('balances a winter day: CHP, buffer and boiler meet the demand', () => {
    const r = energyHub(defaultEnergyHub(KEBILI));
    expect(r.hours).toHaveLength(24);
    for (const h of r.hours) {
      const met = h.chpKw + h.fromBufferKw + h.boilerKw;
      expect(Math.abs(met - h.demandKw)).toBeLessThanOrEqual(2);
    }
    expect(r.chpUsedKwh + r.boilerKwh).toBeCloseTo(r.demandKwh, -1);
    expect(r.powerKwh).toBe(defaultEnergyHub(KEBILI).chpElectricKw * 11);
    expect(r.peakDemandKw).toBeGreaterThan(0);
  });

  it('stores the day’s surplus for the night with a bigger buffer', () => {
    const small = energyHub({ ...defaultEnergyHub(KEBILI), bufferM3: 1 });
    const big = energyHub({ ...defaultEnergyHub(KEBILI), bufferM3: 200 });
    expect(big.boilerKwh).toBeLessThanOrEqual(small.boilerKwh);
    expect(big.dumpedKwh).toBeLessThanOrEqual(small.dumpedKwh);
  });
});
