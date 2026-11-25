import { climateById, MONTH_DAYS } from '../data/climates.data';
import type {
  CalcNote,
  CropWaterParams,
  CropWaterResult,
  MonthRain,
  MonthWater,
  RainwaterParams,
  RainwaterResult,
} from '../models/serra.models';
import { round } from '../utils/physics';

/** MJ per kg of water evaporated. */
const LAMBDA_MJ = 2.45;
/**
 * A heavy day of rain, mm. Monthly totals hide storms: rain in a wet month
 * can all be used that month, yet it falls in a day or two, so the basin
 * should at least hold one storm's run-off.
 */
export const STORM_MM = 25;

/**
 * What the crop drinks, month by month, from the sunlight inside: a full
 * canopy transpires about two thirds of the radiation it receives, so
 * T = k × canopy × τ × (1 − shade) × Rg / λ (L/m² a day, λ = 2.45 MJ/kg).
 * Irrigation adds the drain: applied = T / (1 − drain).
 */
export function cropWater(p: CropWaterParams): CropWaterResult {
  const climate = climateById(p.climateId);
  const tau = clamp01(p.transmissionPct / 100);
  const shade = clamp01(p.shadingPct / 100);
  const k = clamp01(p.transpirationPct / 100);
  const canopy = clamp01(p.canopyPct / 100);
  const drain = Math.min(0.8, clamp01(p.drainPct / 100));
  const cropArea = p.floorAreaM2 * clamp01(p.cropAreaPct / 100);

  const months: MonthWater[] = climate.months.map((m, i) => {
    const inside = m.radiationMj * tau * (1 - shade);
    const net = (k * canopy * inside) / LAMBDA_MJ;
    const gross = net / (1 - drain);
    const perDay = (gross * cropArea) / 1000;
    return {
      month: i,
      radiationInMj: round(inside, 1),
      netLm2: round(net, 2),
      grossLm2: round(gross, 2),
      houseM3Day: round(perDay, 1),
      houseM3Month: round(perDay * MONTH_DAYS[i]),
    };
  });

  const peak = months.reduce(
    (best, m) => (m.grossLm2 > best.grossLm2 ? m : best),
    months[0],
  );
  const annual = months.reduce((s, m) => s + m.houseM3Month, 0);
  const emitters = Math.round(
    cropArea * Math.max(0, p.plantsPerM2) * Math.max(0, p.emittersPerPlant),
  );
  const perEmitter = emitters > 0 ? (peak.houseM3Day * 1000) / emitters : 0;
  const shot = Math.max(10, p.shotMl) / 1000;
  const shots = perEmitter > 0 ? Math.ceil(perEmitter / shot) : 0;
  const shotMinutes = (shot / Math.max(0.1, p.emitterLh)) * 60;
  const systemFlow = (emitters * Math.max(0, p.emitterLh)) / 1000;
  const sections =
    systemFlow > 0
      ? Math.max(1, Math.ceil(systemFlow / Math.max(0.5, p.pumpM3h)))
      : 0;

  const notes: CalcNote[] = [];
  notes.push({
    code: 'water.peak',
    severity: 'info',
    values: { month: peak.month, l: round(peak.grossLm2, 1) },
  });
  if (peak.grossLm2 > 9) {
    notes.push({ code: 'water.highPeak', severity: 'warn' });
  }
  if (p.drainPct < 15) {
    notes.push({ code: 'water.lowDrain', severity: 'warn' });
  }
  if (shots > 30) {
    notes.push({
      code: 'water.manyShots',
      severity: 'warn',
      values: { shots },
    });
  }
  if (sections > 1) {
    notes.push({
      code: 'water.sections',
      severity: 'info',
      values: { sections },
    });
  }

  return {
    months,
    peakMonth: peak.month,
    peakGrossLm2: peak.grossLm2,
    peakM3Day: peak.houseM3Day,
    annualM3: round(annual),
    annualM3PerM2: round(annual / Math.max(1, p.floorAreaM2), 2),
    emitters,
    litresPerEmitterPeak: round(perEmitter, 2),
    shotsPerDayPeak: shots,
    shotMinutes: round(shotMinutes, 1),
    systemFlowM3h: round(systemFlow, 1),
    sections,
    notes,
  };
}

/**
 * Runs a basin month by month for two years (the second starts from where
 * the first ended) and returns the second: rain in, irrigation out, the
 * overflow when the basin is full.
 */
export function simulateBasin(
  harvest: readonly number[],
  demand: readonly number[],
  basinM3: number,
): MonthRain[] {
  const size = Math.max(0, basinM3);
  let stored = 0;
  let year: MonthRain[] = [];
  for (let pass = 0; pass < 2; pass++) {
    year = harvest.map((inflow, i) => {
      const available = stored + inflow;
      const used = Math.min(available, demand[i]);
      const left = available - used;
      const overflow = Math.max(0, left - size);
      stored = Math.min(left, size);
      return {
        month: i,
        harvestM3: inflow,
        demandM3: demand[i],
        usedM3: used,
        storedEndM3: stored,
        overflowM3: overflow,
      };
    });
  }
  return year;
}

function coverage(months: readonly MonthRain[]): number {
  const demand = months.reduce((s, m) => s + m.demandM3, 0);
  const used = months.reduce((s, m) => s + m.usedM3, 0);
  return demand > 0 ? used / demand : 0;
}

/**
 * Rain off the roof into a basin, against what the crop needs: harvest =
 * rain × catchment × runoff. Also finds the smallest basin that reaches
 * 95 % of what the rain could cover at best.
 */
export function rainwater(p: RainwaterParams): RainwaterResult {
  const climate = climateById(p.climateId);
  const runoff = clamp01(p.runoffPct / 100);
  const harvest = climate.months.map(
    (m) => (m.rainMm * Math.max(0, p.catchmentM2) * runoff) / 1000,
  );
  const demand = cropWater(p).months.map((m) => m.houseM3Month);
  const months = simulateBasin(harvest, demand, p.basinM3);

  const annualHarvest = harvest.reduce((s, v) => s + v, 0);
  const annualDemand = demand.reduce((s, v) => s + v, 0);
  const best = annualDemand > 0 ? Math.min(1, annualHarvest / annualDemand) : 0;
  const reached = coverage(months);

  // Coverage only grows with the basin; bisect for 95 % of the best.
  let low = 0;
  let high = annualHarvest;
  const goal = best * 0.95;
  if (coverage(simulateBasin(harvest, demand, 0)) >= goal) {
    high = 0;
  } else {
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      if (coverage(simulateBasin(harvest, demand, mid)) >= goal) {
        high = mid;
      } else {
        low = mid;
      }
    }
  }
  const storm = (STORM_MM * Math.max(0, p.catchmentM2) * runoff) / 1000;
  const suggested = Math.ceil(Math.max(high, storm) / 10) * 10;
  const annualRain = climate.months.reduce((s, m) => s + m.rainMm, 0);

  const notes: CalcNote[] = [];
  notes.push({
    code: 'rain.coverage',
    severity: reached >= 0.5 ? 'ok' : 'info',
    values: { pct: round(reached * 100) },
  });
  if (best > 0 && reached < best * 0.8) {
    notes.push({
      code: 'rain.basinSmall',
      severity: 'warn',
      values: { m3: suggested },
    });
  } else if (p.basinM3 > suggested * 1.5 && suggested > 0) {
    notes.push({
      code: 'rain.basinBig',
      severity: 'info',
      values: { m3: suggested },
    });
  }
  notes.push({
    code: 'rain.storm',
    severity: p.basinM3 >= storm ? 'ok' : 'warn',
    values: { mm: STORM_MM, m3: round(storm) },
  });
  if (annualRain < 200) {
    notes.push({
      code: 'rain.dry',
      severity: 'info',
      values: { mm: round(annualRain) },
    });
  }
  notes.push({ code: 'rain.firstFlush', severity: 'info' });

  const roundMonth = (m: MonthRain): MonthRain => ({
    month: m.month,
    harvestM3: round(m.harvestM3),
    demandM3: round(m.demandM3),
    usedM3: round(m.usedM3),
    storedEndM3: round(m.storedEndM3),
    overflowM3: round(m.overflowM3),
  });

  return {
    months: months.map(roundMonth),
    annualRainMm: round(annualRain),
    annualHarvestM3: round(annualHarvest),
    annualDemandM3: round(annualDemand),
    annualUsedM3: round(months.reduce((s, m) => s + m.usedM3, 0)),
    coveragePct: round(reached * 100, 1),
    maxCoveragePct: round(best * 100, 1),
    suggestedBasinM3: suggested,
    stormBufferM3: round(storm),
    notes,
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
