import { FUELS } from '../data/catalogue.data';
import type { CalcNote, Co2Params, Co2Result } from '../models/serra.models';
import { round } from '../utils/physics';

/** Density of CO₂ near 20 °C, kg/m³. */
export const CO2_DENSITY = 1.83;

/**
 * CO₂ enrichment: hold the target against the air that leaks out and what
 * the crop takes up. Leak = N × V × (target − outside) ppm × 10⁻⁶ × 1.83
 * kg/m³; uptake = floor × g/m²·h. A gas burner makes 1.96 kg of CO₂ per m³
 * of natural gas, and its heat with it.
 */
export function co2Enrichment(p: Co2Params): Co2Result {
  const lift = Math.max(0, p.targetPpm - p.outsidePpm);
  const ventLoss =
    Math.max(0, p.airChangesPerHour) * p.volumeM3 * lift * 1e-6 * CO2_DENSITY;
  const uptake = (Math.max(0, p.uptakeGm2h) * p.floorAreaM2) / 1000;
  const supply = ventLoss + uptake;
  const daily = supply * Math.max(0, p.hoursPerDay);
  const annual = daily * Math.max(0, p.daysPerYear);
  const gas = FUELS.natural_gas;
  const gasM3h = supply / gas.co2KgPerUnit;
  const burnerKw =
    gasM3h * gas.kwhPerUnit * (Math.max(0, p.burnerEfficiencyPct) / 100);
  const annualCost =
    p.source === 'burner'
      ? (annual / gas.co2KgPerUnit) * Math.max(0, p.gasPrice)
      : annual * Math.max(0, p.co2Price);
  const usedPct = supply > 0 ? (uptake / supply) * 100 : 0;

  const notes: CalcNote[] = [];
  if (lift === 0) {
    notes.push({ code: 'co2.noLift', severity: 'info' });
  } else if (ventLoss > uptake * 2) {
    notes.push({
      code: 'co2.leaky',
      severity: 'warn',
      values: { pct: round(100 - usedPct) },
    });
  } else {
    notes.push({
      code: 'co2.used',
      severity: 'ok',
      values: { pct: round(usedPct) },
    });
  }
  if (p.targetPpm > 1000) {
    notes.push({ code: 'co2.highTarget', severity: 'info' });
  }
  if (p.source === 'burner') {
    notes.push({
      code: 'co2.burnerHeat',
      severity: 'info',
      values: { kw: round(burnerKw) },
    });
    notes.push({ code: 'co2.flue', severity: 'warn' });
  }

  return {
    ventLossKgH: round(ventLoss, 1),
    uptakeKgH: round(uptake, 1),
    supplyKgH: round(supply, 1),
    supplyKgHaH: round(
      p.floorAreaM2 > 0 ? (supply / p.floorAreaM2) * 10000 : 0,
      1,
    ),
    dailyKg: round(daily),
    annualT: round(annual / 1000, 1),
    gasM3h: round(gasM3h, 1),
    burnerHeatKw: round(burnerKw),
    annualCost: round(annualCost),
    usedPct: round(usedPct),
    notes,
  };
}
