import { climateById, MONTH_DAYS } from '../data/climates.data';
import { FUELS, PERIMETER_LOSS } from '../data/catalogue.data';
import type {
  AnnualHeatingParams,
  AnnualHeatingResult,
  CalcNote,
  EnvelopeParams,
  HeatLossParams,
  HeatLossResult,
  MonthHeating,
} from '../models/serra.models';
import {
  AIR_W_PER_M3H_K,
  dayLengthHours,
  midMonthDay,
  round,
} from '../utils/physics';

/** How the house loses heat, per kelvin of difference with outside. */
export interface LossCoefficients {
  /** Cover: U × A, W/K. */
  transmission: number;
  /** Air leakage: 0.335 × N × V, W/K. */
  infiltration: number;
  /** Footing: F × perimeter, W/K. */
  perimeter: number;
}

export function lossCoefficients(
  p: EnvelopeParams,
  screenSaving = 0,
): LossCoefficients {
  const saving = Math.min(0.8, Math.max(0, screenSaving));
  const f = p.perimeterInsulated
    ? PERIMETER_LOSS.insulated
    : PERIMETER_LOSS.bare;
  return {
    // A closed screen cuts both the cover's losses and the leaks above it.
    transmission: Math.max(0, p.uValue) * p.coverAreaM2 * (1 - saving),
    infiltration:
      AIR_W_PER_M3H_K *
      Math.max(0, p.airChangesPerHour) *
      p.volumeM3 *
      (1 - saving),
    perimeter: f * p.perimeterM,
  };
}

/**
 * The heating plant for the coldest night: Q = (U·A + 0.335·N·V + F·P) × ΔT
 * (ASAE EP406), plus a margin for wind and a clear sky.
 */
export function heatLoss(p: HeatLossParams): HeatLossResult {
  const saving = p.screenClosed ? p.screenSavingPct / 100 : 0;
  const k = lossCoefficients(p, saving);
  const deltaT = Math.max(0, p.insideC - p.outsideDesignC);
  const transmission = k.transmission * deltaT;
  const infiltration = k.infiltration * deltaT;
  const perimeter = k.perimeter * deltaT;
  const total = transmission + infiltration + perimeter;
  const perM2 = p.floorAreaM2 > 0 ? total / p.floorAreaM2 : 0;
  const design = (total * (1 + Math.max(0, p.marginPct) / 100)) / 1000;

  const notes: CalcNote[] = [];
  if (deltaT === 0) {
    notes.push({ code: 'heat.noLoad', severity: 'info' });
  } else {
    notes.push({
      code: 'heat.perM2',
      severity: perM2 > 250 ? 'warn' : 'ok',
      values: { w: round(perM2) },
    });
  }
  if (total > 0 && infiltration / total > 0.25) {
    notes.push({
      code: 'heat.leaky',
      severity: 'warn',
      values: { pct: round((infiltration / total) * 100) },
    });
  }
  if (p.screen !== 'none' && !p.screenClosed) {
    notes.push({ code: 'heat.screenOpen', severity: 'info' });
  }
  if (p.screen === 'none') {
    notes.push({ code: 'heat.addScreen', severity: 'info' });
  }

  return {
    deltaT: round(deltaT, 1),
    uEffective: round(
      p.coverAreaM2 > 0 ? k.transmission / p.coverAreaM2 : 0,
      2,
    ),
    lossCoefficientWPerK: round(k.transmission + k.infiltration + k.perimeter),
    transmissionW: round(transmission),
    infiltrationW: round(infiltration),
    perimeterW: round(perimeter),
    totalW: round(total),
    wPerM2: round(perM2),
    designKw: round(design, 1),
    notes,
  };
}

/** Nights are close to the minimum, days close to the maximum. */
const NIGHT_WEIGHT = 0.3;

/**
 * A year of heating, month by month. Each month splits into night and day by
 * the day length at the site. Nights lose (U·A·(1 − screen) + …) × (T_set −
 * T_night); days lose the same at the day set point, minus the share of the
 * sunlight inside that warms the air. Night mean = Tmin + 0.3 (Tmax − Tmin),
 * day mean = Tmax − 0.3 (Tmax − Tmin).
 */
export function annualHeating(p: AnnualHeatingParams): AnnualHeatingResult {
  const climate = climateById(p.climateId);
  const night = lossCoefficients(p, p.screenSavingPct / 100);
  const day = lossCoefficients(p, 0);
  const nightK = night.transmission + night.infiltration + night.perimeter;
  const dayK = day.transmission + day.infiltration + day.perimeter;
  const tau = Math.min(1, Math.max(0, p.transmissionPct / 100));
  const gain = Math.min(1, Math.max(0, p.solarGainPct / 100));

  const months: MonthHeating[] = climate.months.map((m, i) => {
    const days = MONTH_DAYS[i];
    const dayHours = dayLengthHours(climate.latitude, midMonthDay(i));
    const nightHours = 24 - dayHours;
    const swing = m.tMaxC - m.tMinC;
    const nightMean = m.tMinC + NIGHT_WEIGHT * swing;
    const dayMean = m.tMaxC - NIGHT_WEIGHT * swing;

    const nightWh =
      nightK * Math.max(0, p.nightSetC - nightMean) * nightHours * days;
    // Sun inside over the day, Wh per day: MJ/m² × 1e6 / 3600.
    const sunWh = ((m.radiationMj * 1e6) / 3600) * p.floorAreaM2 * tau * gain;
    const dayLossWh = dayK * Math.max(0, p.daySetC - dayMean) * dayHours;
    const dayWh = Math.max(0, dayLossWh - sunWh) * days;

    return {
      month: i,
      nightHours: round(nightHours, 1),
      nightMeanC: round(nightMean, 1),
      dayMeanC: round(dayMean, 1),
      nightKwh: round(nightWh / 1000),
      dayKwh: round(dayWh / 1000),
      totalKwh: round((nightWh + dayWh) / 1000),
    };
  });

  const annual = months.reduce((sum, m) => sum + m.totalKwh, 0);
  const fuel = FUELS[p.fuel];
  const efficiency = Math.max(1, p.efficiencyPct) / 100;
  const units = annual / (fuel.kwhPerUnit * efficiency);
  const cost = units * Math.max(0, p.fuelPrice);
  const co2 = units * fuel.co2KgPerUnit;
  const peak = months.reduce(
    (best, m) => (m.totalKwh > best.totalKwh ? m : best),
    months[0],
  );
  const heatingMonths = months.filter((m) => m.totalKwh > 0).length;
  const perM2 = p.floorAreaM2 > 0 ? annual / p.floorAreaM2 : 0;

  const notes: CalcNote[] = [];
  if (annual === 0) {
    notes.push({ code: 'year.none', severity: 'ok' });
  } else {
    notes.push({
      code: 'year.season',
      severity: 'info',
      values: { months: heatingMonths, peak: peak.month },
    });
    const nightShare =
      months.reduce((s, m) => s + m.nightKwh, 0) / Math.max(1, annual);
    if (nightShare > 0.8) {
      notes.push({
        code: 'year.mostlyNights',
        severity: 'info',
        values: { pct: round(nightShare * 100) },
      });
    }
  }
  if (p.screen === 'none' && annual > 0) {
    notes.push({ code: 'year.screenSaves', severity: 'info' });
  }
  if (p.fuel === 'geothermal') {
    notes.push({ code: 'year.geothermal', severity: 'ok' });
  }
  if (perM2 > 250) {
    notes.push({
      code: 'year.high',
      severity: 'warn',
      values: { kwh: round(perM2) },
    });
  }

  return {
    months,
    annualKwh: round(annual),
    kwhPerM2: round(perM2, 1),
    fuelUnits: round(units),
    fuelUnit: fuel.unit,
    cost: round(cost),
    costPerM2: round(p.floorAreaM2 > 0 ? cost / p.floorAreaM2 : 0, 2),
    co2Kg: round(co2),
    peakMonth: peak.month,
    heatingMonths,
    notes,
  };
}
