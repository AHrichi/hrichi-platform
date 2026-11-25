import {
  CROP_YIELD_T_HA,
  defaultFuelPrice,
  LABOUR_DAYS_HA,
} from '../data/catalogue.data';
import type {
  CalcNote,
  CropId,
  GreenhouseProject,
  PlantType,
  SitePlant,
  SiteRecord,
  SiteTariffs,
} from '../models/serra.models';
import { round } from '../utils/physics';
import {
  type CalcContext,
  defaultAnnualHeating,
  defaultCropWater,
  defaultHeatLoss,
  defaultRo,
} from './defaults';
import { GAS_KWH_PER_M3 } from './energy';
import { seawaterRo } from './water-chain';
import { greenhouseGeometry } from './geometry';
import { annualHeating, heatLoss } from './heating';
import { cropWater } from './water';

/** CO₂ equivalent of a kg of tomatoes from a gas-heated desert site. */
export const CO2E_KG_PER_KG = 1.9;

/** m³ a day for an area at a yearly use per m²: ha × 10,000 × m³/m² / 365. */
export function dailyWater(areaHa: number, m3PerM2Year: number): number {
  return (areaHa * 10_000 * m3PerM2Year) / 365;
}

/** A compartment: one project's house scaled to the area it covers. */
export interface CompartmentFigures {
  projectId: string;
  title: string;
  crop: CropId;
  climateId: string;
  areaHa: number;
  /** Houses of the project's size that fill the compartment. */
  houses: number;
  peakWaterM3Day: number;
  waterM3Year: number;
  heatPeakKw: number;
  heatMwhYear: number;
  yieldT: number;
  labourDays: number;
}

export interface SiteTotals {
  areaHa: number;
  peakWaterM3Day: number;
  waterM3Year: number;
  /** The year's water as an even daily flow, m³/day. */
  meanWaterM3Day: number;
  waterM3PerM2Year: number;
  heatPeakMw: number;
  heatMwhYear: number;
  heatKwhPerM2Year: number;
  yieldT: number;
  labourDays: number;
  co2eT: number;
}

/** The project's area in hectares: its own, or its house's floor. */
export function projectAreaHa(project: GreenhouseProject): number {
  const own = project.areaHa;
  if (typeof own === 'number' && Number.isFinite(own) && own > 0) return own;
  return greenhouseGeometry(project.greenhouse).floorAreaM2 / 10_000;
}

/**
 * Scales a project's house to its compartment: crop water, peak heat, the
 * year's heat, yield and labour per m² of the house, times the area.
 */
export function compartmentFigures(
  project: GreenhouseProject,
): CompartmentFigures {
  const ctx: CalcContext = {
    greenhouse: project.greenhouse,
    climateId: project.climateId,
    crop: project.crop,
    currency: project.currency,
  };
  const floor = greenhouseGeometry(project.greenhouse).floorAreaM2;
  const areaHa = projectAreaHa(project);
  const m2 = areaHa * 10_000;
  const water = cropWater(defaultCropWater(ctx));
  const peak = heatLoss(defaultHeatLoss(ctx));
  const year = annualHeating(defaultAnnualHeating(ctx));
  const perM2 = (value: number) => (floor > 0 ? (value / floor) * m2 : 0);
  return {
    projectId: project.id,
    title: project.title,
    crop: project.crop,
    climateId: project.climateId,
    areaHa: round(areaHa, 2),
    houses: round(floor > 0 ? m2 / floor : 0, 1),
    peakWaterM3Day: round(perM2(water.peakM3Day)),
    waterM3Year: round(perM2(water.annualM3)),
    heatPeakKw: round(perM2(peak.designKw)),
    heatMwhYear: round(perM2(year.annualKwh) / 1000),
    yieldT: round(areaHa * CROP_YIELD_T_HA[project.crop]),
    labourDays: round(areaHa * LABOUR_DAYS_HA),
  };
}

/** The site: every compartment added up. */
export function siteTotals(
  compartments: readonly CompartmentFigures[],
): SiteTotals {
  const sum = (key: keyof CompartmentFigures) =>
    compartments.reduce((total, c) => total + (c[key] as number), 0);
  const areaHa = sum('areaHa');
  const waterM3Year = sum('waterM3Year');
  const heatMwhYear = sum('heatMwhYear');
  const yieldT = sum('yieldT');
  return {
    areaHa: round(areaHa, 2),
    peakWaterM3Day: round(sum('peakWaterM3Day')),
    waterM3Year: round(waterM3Year),
    meanWaterM3Day: round(waterM3Year / 365),
    waterM3PerM2Year: round(
      areaHa > 0 ? waterM3Year / (areaHa * 10_000) : 0,
      2,
    ),
    heatPeakMw: round(sum('heatPeakKw') / 1000, 2),
    heatMwhYear: round(heatMwhYear),
    heatKwhPerM2Year: round(
      areaHa > 0 ? (heatMwhYear * 1000) / (areaHa * 10_000) : 0,
    ),
    yieldT: round(yieldT),
    labourDays: round(sum('labourDays')),
    co2eT: round(yieldT * CO2E_KG_PER_KG),
  };
}

// ---------------------------------------------------------------------------
// Shared plants and tariffs
// ---------------------------------------------------------------------------

export const PLANT_TYPES: readonly PlantType[] = [
  'ro',
  'chp',
  'boiler',
  'chiller',
  'tank',
  'pump',
];

/** The unit of each plant's capacity. */
export const PLANT_UNITS: Record<PlantType, string> = {
  ro: 'm³/d',
  chp: 'kW',
  boiler: 'kW',
  chiller: 'kW',
  tank: 'm³',
  pump: 'm³/h',
};

/** The unit of each plant's efficiency: a chiller's is its COP. */
export const PLANT_EFFICIENCY_UNITS: Record<PlantType, string> = {
  ro: '%',
  chp: '%',
  boiler: '%',
  chiller: 'COP',
  tank: '%',
  pump: '%',
};

/**
 * A new plant with typical figures to overwrite: RO 1,000 m³/d at 45 %
 * recovery; CHP 4 MW of heat at 42 % electrical; boiler 5 MW at 92 %;
 * chiller 1 MW at COP 4.5; tank 2,000 m³, 90 % usable; pump 200 m³/h.
 */
export function newPlant(type: PlantType, id: string): SitePlant {
  const typical: Record<PlantType, [number, number, number]> = {
    ro: [1000, 45, 22],
    chp: [4000, 42, 16],
    boiler: [5000, 92, 24],
    chiller: [1000, 4.5, 12],
    tank: [2000, 90, 24],
    pump: [200, 70, 20],
  };
  const [capacity, efficiency, hoursDay] = typical[type];
  return { id, type, name: '', capacity, efficiency, hoursDay };
}

/**
 * Example tariffs in the project's currency: the gas and electricity prices
 * the calculators start from, power sold at 60 % of the price bought, water
 * at the RO plant's cost plus 30 % for chemicals and membranes.
 */
export function defaultTariffs(ctx: CalcContext): SiteTariffs {
  const power = defaultFuelPrice('heat_pump', ctx.currency);
  return {
    gasPerM3: defaultFuelPrice('natural_gas', ctx.currency),
    electricityPerKwh: power,
    exportPerKwh: round(power * 0.6, 3),
    waterPerM3:
      Math.round(seawaterRo(defaultRo(ctx)).costPerM3 * 1.3 * 100) / 100,
  };
}

/** A site with nothing recorded yet. */
export function emptySite(name: string, ctx: CalcContext): SiteRecord {
  return {
    name,
    plants: [],
    tariffs: defaultTariffs(ctx),
    updatedAt: new Date(0).toISOString(),
  };
}

export type PlantCheckId = 'water' | 'heat' | 'storage' | 'pumping';

/** A shared plant set against what the compartments need. */
export interface PlantCheck {
  id: PlantCheckId;
  /** What the plants give, in `unit`. */
  have: number;
  /** What the site needs on its peak day, in `unit`. */
  need: number;
  unit: string;
  pct: number;
}

/**
 * The site's plants against its totals, for each kind it has: RO product
 * (capacity × hours / 24) and pumping (m³/h × hours) against the peak day's
 * water; CHP and boiler heat against the design night's peak; tanks
 * (capacity × usable share) as a share of a peak day's water.
 */
export function plantChecks(
  plants: readonly SitePlant[],
  totals: Pick<SiteTotals, 'peakWaterM3Day' | 'heatPeakMw'>,
): PlantCheck[] {
  const sum = (types: readonly PlantType[], each: (p: SitePlant) => number) =>
    plants
      .filter((p) => types.includes(p.type))
      .reduce((s, p) => s + each(p), 0);
  const has = (...types: PlantType[]) =>
    plants.some((p) => types.includes(p.type));
  const hours = (p: SitePlant) => Math.min(24, Math.max(0, p.hoursDay));
  const water = Math.max(1, totals.peakWaterM3Day);
  const check = (
    id: PlantCheckId,
    have: number,
    need: number,
    unit: string,
  ): PlantCheck => ({
    id,
    have: round(have),
    need: round(need),
    unit,
    pct: round((have / Math.max(1e-9, need)) * 100),
  });
  const out: PlantCheck[] = [];
  if (has('ro')) {
    out.push(
      check(
        'water',
        sum(['ro'], (p) => (p.capacity * hours(p)) / 24),
        water,
        'm³/d',
      ),
    );
  }
  if (has('chp', 'boiler')) {
    out.push(
      check(
        'heat',
        sum(['chp', 'boiler'], (p) => p.capacity),
        Math.max(1, totals.heatPeakMw * 1000),
        'kW',
      ),
    );
  }
  if (has('tank')) {
    out.push(
      check(
        'storage',
        sum(['tank'], (p) => (p.capacity * Math.min(100, p.efficiency)) / 100),
        water,
        'm³',
      ),
    );
  }
  if (has('pump')) {
    out.push(
      check(
        'pumping',
        sum(['pump'], (p) => p.capacity * hours(p)),
        water,
        'm³/d',
      ),
    );
  }
  return out;
}

/**
 * The tariffs as the economics needs them: heat from gas through the
 * site's boilers (their mean efficiency, or 90 %) per MWh, and water.
 */
export function tariffPrices(
  tariffs: SiteTariffs,
  plants: readonly SitePlant[] = [],
): { heatPricePerMwh: number; waterPricePerM3: number } {
  const boilers = plants.filter((p) => p.type === 'boiler');
  const efficiency = boilers.length
    ? boilers.reduce((s, p) => s + p.efficiency, 0) / boilers.length / 100
    : 0.9;
  return {
    heatPricePerMwh: Math.round(
      (tariffs.gasPerM3 / (GAS_KWH_PER_M3 * Math.max(0.5, efficiency))) * 1000,
    ),
    waterPricePerM3: tariffs.waterPerM3,
  };
}

export interface EconomicsParams {
  areaHa: number;
  /** Marketable yield, t/ha a year. */
  yieldTHa: number;
  /** Price received, per kg. */
  pricePerKg: number;
  labourDaysHa: number;
  wagePerDay: number;
  /** Heat a year, MWh, and what a MWh of heat costs. */
  heatMwhYear: number;
  heatPricePerMwh: number;
  waterM3Year: number;
  waterPricePerM3: number;
  /** Fertiliser, crop protection and substrate, per m² a year. */
  inputsPerM2: number;
  /** Packing, transport, maintenance, overheads, per m² a year. */
  otherPerM2: number;
  /** Building the site, per m². */
  capexPerM2: number;
}

export interface EconomicsResult {
  yieldT: number;
  revenue: number;
  labour: number;
  energy: number;
  water: number;
  inputs: number;
  other: number;
  totalCost: number;
  costPerKg: number;
  margin: number;
  marginPct: number;
  /** Years for the margin to repay the build (null: it never does). */
  paybackYears: number | null;
  breakEvenPrice: number;
  /** Water per kg of fruit, L. */
  waterLPerKg: number;
  co2eT: number;
  notes: CalcNote[];
}

/**
 * The year's money: yield × price against labour, heat, water, inputs and
 * overheads; cost per kg, margin and the years to repay the build.
 */
export function siteEconomics(p: EconomicsParams): EconomicsResult {
  const m2 = Math.max(0, p.areaHa) * 10_000;
  const yieldT = Math.max(0, p.areaHa) * Math.max(0, p.yieldTHa);
  const kg = yieldT * 1000;
  const revenue = kg * Math.max(0, p.pricePerKg);
  const labour = Math.max(0, p.areaHa) * p.labourDaysHa * p.wagePerDay;
  const energy = Math.max(0, p.heatMwhYear) * Math.max(0, p.heatPricePerMwh);
  const water = Math.max(0, p.waterM3Year) * Math.max(0, p.waterPricePerM3);
  const inputs = m2 * Math.max(0, p.inputsPerM2);
  const other = m2 * Math.max(0, p.otherPerM2);
  const totalCost = labour + energy + water + inputs + other;
  const margin = revenue - totalCost;
  const capex = m2 * Math.max(0, p.capexPerM2);
  const payback = margin > 0 ? capex / margin : null;

  const notes: CalcNote[] = [];
  notes.push({
    code: margin >= 0 ? 'econ.margin' : 'econ.loss',
    severity: margin >= 0 ? 'ok' : 'error',
    values: { pct: round(revenue > 0 ? (margin / revenue) * 100 : 0) },
  });
  const biggest = (
    [
      ['labour', labour],
      ['energy', energy],
      ['water', water],
      ['inputs', inputs],
      ['other', other],
    ] as const
  ).reduce((a, b) => (b[1] > a[1] ? b : a));
  notes.push({
    code: `econ.biggest.${biggest[0]}`,
    severity: 'info',
    values: { pct: round(totalCost > 0 ? (biggest[1] / totalCost) * 100 : 0) },
  });
  if (payback !== null) {
    notes.push({
      code: 'econ.payback',
      severity: payback <= 10 ? 'ok' : 'warn',
      values: { years: round(payback, 1) },
    });
  }
  notes.push({ code: 'econ.prices', severity: 'info' });

  return {
    yieldT: round(yieldT),
    revenue: round(revenue),
    labour: round(labour),
    energy: round(energy),
    water: round(water),
    inputs: round(inputs),
    other: round(other),
    totalCost: round(totalCost),
    costPerKg: round(kg > 0 ? totalCost / kg : 0, 3),
    margin: round(margin),
    marginPct: round(revenue > 0 ? (margin / revenue) * 100 : 0, 1),
    paybackYears: payback === null ? null : round(payback, 1),
    breakEvenPrice: round(kg > 0 ? totalCost / kg : 0, 3),
    waterLPerKg: round(kg > 0 ? (p.waterM3Year * 1000) / kg : 0, 1),
    co2eT: round(yieldT * CO2E_KG_PER_KG),
    notes,
  };
}
