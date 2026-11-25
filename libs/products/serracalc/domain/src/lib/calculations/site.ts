import { CROP_YIELD_T_HA, LABOUR_DAYS_HA } from '../data/catalogue.data';
import type {
  CalcNote,
  CropId,
  GreenhouseProject,
} from '../models/serra.models';
import { round } from '../utils/physics';
import {
  type CalcContext,
  defaultAnnualHeating,
  defaultCropWater,
  defaultHeatLoss,
} from './defaults';
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
