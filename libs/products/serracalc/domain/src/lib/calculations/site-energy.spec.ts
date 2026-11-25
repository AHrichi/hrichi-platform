import { describe, expect, it } from 'vitest';
import { SAMPLE_PROJECTS } from '../data/sample-projects.data';
import type { GreenhouseProject } from '../models/serra.models';
import {
  type CalcContext,
  defaultCoolingYear,
  defaultEconomics,
  defaultEnergyHub,
  defaultHeatReuse,
} from './defaults';
import {
  COOLING_BENCHMARK_KWH_M2,
  coolingYear,
  energyHub,
  heatReuse,
} from './energy';
import {
  compartmentFigures,
  dailyWater,
  defaultTariffs,
  newPlant,
  plantChecks,
  siteEconomics,
  siteTotals,
  tariffPrices,
  energyPrices,
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

describe('shared plants and tariffs', () => {
  const totals = { peakWaterM3Day: 2000, heatPeakMw: 12 };

  it('sets each kind of plant against the peak day', () => {
    const ro = { ...newPlant('ro', 'a'), capacity: 1200, hoursDay: 20 };
    const ro2 = { ...newPlant('ro', 'b'), capacity: 1200, hoursDay: 24 };
    const chp = { ...newPlant('chp', 'c'), capacity: 4000 };
    const boiler = { ...newPlant('boiler', 'd'), capacity: 6000 };
    const tank = { ...newPlant('tank', 'e'), capacity: 3000, efficiency: 80 };
    const pump = { ...newPlant('pump', 'f'), capacity: 100, hoursDay: 20 };
    const checks = Object.fromEntries(
      plantChecks([ro, ro2, chp, boiler, tank, pump], totals).map((c) => [
        c.id,
        c,
      ]),
    );
    // RO: 1,200 × 20/24 + 1,200 = 2,200 m³/d of 2,000.
    expect(checks['water'].have).toBe(2200);
    expect(checks['water'].pct).toBe(110);
    // Heat: 4 + 6 MW against a 12 MW night.
    expect(checks['heat'].pct).toBe(83);
    // Tanks: 2,400 m³ usable, 120 % of a peak day.
    expect(checks['storage'].pct).toBe(120);
    expect(checks['pumping'].have).toBe(2000);
  });

  it('checks nothing it has no plant for', () => {
    expect(plantChecks([newPlant('chiller', 'x')], totals)).toEqual([]);
  });

  it('turns the gas tariff into a heat price through the boilers', () => {
    const tariffs = { ...defaultTariffs(KEBILI), gasPerM3: 0.9 };
    // 0.9 / (9.77 kWh × 0.9) × 1,000 ≈ 102 per MWh.
    expect(tariffPrices(tariffs).heatPricePerMwh).toBe(102);
    const boiler = { ...newPlant('boiler', 'b'), efficiency: 95 };
    expect(tariffPrices(tariffs, [boiler]).heatPricePerMwh).toBe(97);
    expect(tariffPrices(tariffs).waterPricePerM3).toBe(tariffs.waterPerM3);
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

describe('cooling over the year', () => {
  const coast: CalcContext = { ...KEBILI, climateId: 'gabes' };

  it('lands a Gabès-coast house cooled all year near 10 kWh/m² (published)', () => {
    const r = coolingYear({ ...defaultCoolingYear(coast), emptyWeeks: 0 });
    expect(Math.abs(r.kwhM2Year - COOLING_BENCHMARK_KWH_M2)).toBeLessThan(2);
    expect(r.notes.map((n) => n.code)).toContain('coolYear.range');
    // The fans run in the warm half of the year only.
    expect(r.months[0].hours).toBe(0);
    expect(r.months[7].kwhM2).toBeGreaterThan(r.months[4].kwhM2);
  });

  it('counts nothing while the house stands empty between crops', () => {
    const year = coolingYear({ ...defaultCoolingYear(coast), emptyWeeks: 0 });
    const cropped = coolingYear(defaultCoolingYear(coast));
    expect(cropped.kwhM2Year).toBeLessThan(year.kwhM2Year);
    const shut = coolingYear({
      ...defaultCoolingYear(coast),
      emptyFromWeek: 1,
      emptyWeeks: 52,
    });
    expect(shut.kwhM2Year).toBe(0);
  });

  it('runs hotter inland, and scales with fan power and airflow', () => {
    const base = defaultCoolingYear(KEBILI);
    const inland = coolingYear({ ...base, emptyWeeks: 0 });
    expect(inland.kwhM2Year).toBeGreaterThan(12);
    const worn = coolingYear({ ...base, emptyWeeks: 0, fanWPerM3h: 0.074 });
    expect(worn.kwhM2Year).toBeGreaterThan(inland.kwhM2Year * 1.6);
    expect(worn.notes.map((n) => n.code)).toContain('coolYear.fans');
    // 1 ha at 135 × 0.037 + 0.4 W/m²: 54 kW with everything running.
    const ha = coolingYear({ ...base, floorAreaM2: 10_000 });
    expect(ha.peakKw).toBe(54);
    expect(ha.mwhYear).toBeCloseTo(ha.kwhM2Year * 10, 0);
  });
});

describe('energy prices from the site', () => {
  it('gives every energy tool its price from the site tariffs', () => {
    const p = energyPrices({
      gasPerM3: 1.1,
      electricityPerKwh: 0.3,
      exportPerKwh: 0.12,
      waterPerM3: 2,
    });
    expect(p).toEqual({
      gasPrice: 1.1,
      powerPrice: 0.3,
      electricityPrice: 0.3,
      buyPrice: 0.3,
      exportPrice: 0.12,
    });
  });
});
