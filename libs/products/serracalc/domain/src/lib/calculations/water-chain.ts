import type {
  CalcNote,
  FertigationDay,
  FertigationParams,
  FertigationResult,
  FlushLimit,
  FlushStrategy,
  FlushStrategyResult,
  RoParams,
  RoResult,
} from '../models/serra.models';
import { round } from '../utils/physics';

/** mg/L of dissolved salt per dS/m of EC, for desalinated water. */
export const MG_L_PER_DS_M = 640;
/** EC added by 1 mmol/L of sodium chloride, dS/m. */
export const EC_PER_MMOL_NACL = 0.12;
/** EC added by 1 mmol/L of bicarbonate, its cation a nutrient, dS/m. */
export const EC_PER_MMOL_HCO3 = 0.045;
/** Days of the loop the chart shows. */
const LOOP_DAYS = 120;
/** Days the flush strategies are compared over. */
const YEAR_DAYS = 365;

/** The recovery that turns a feed salinity into a brine salinity. */
export function recoveryFromBrine(feedGL: number, brineGL: number): number {
  return brineGL > feedGL ? 1 - feedGL / brineGL : 0;
}

/**
 * Seawater reverse osmosis, by mass balance: feed F = P / R, brine
 * B = F − P, brine salinity S_b = (F·S_f − P·S_p) / B (about S_f / (1 − R)),
 * energy E = SEC × P. The product keeps (1 − rejection) of the mean salinity
 * along the membranes.
 */
export function seawaterRo(p: RoParams): RoResult {
  const recovery = Math.min(0.9, Math.max(0.05, p.recoveryPct / 100));
  const need =
    Math.max(0, p.demandM3Day) * (1 + Math.max(0, p.lossesPct) / 100);
  const feed = need / recovery;
  const brine = feed - need;
  const roughBrine = p.feedSalinityGL / (1 - recovery);
  const meanGL = (p.feedSalinityGL + roughBrine) / 2;
  const productGL =
    meanGL * (1 - Math.min(100, Math.max(90, p.rejectionPct)) / 100);
  const brineGL =
    brine > 0 ? (feed * p.feedSalinityGL - need * productGL) / brine : 0;
  const energy = Math.max(0, p.secKwhM3) * need;
  const available =
    Math.max(0, p.capacityM3Day) *
    (Math.min(100, Math.max(0, p.availabilityPct)) / 100);
  const coverage = need > 0 ? (available / need) * 100 : 0;
  const productMgL = productGL * 1000;

  const notes: CalcNote[] = [];
  notes.push({
    code: 'ro.balance',
    severity: 'info',
    values: {
      feed: round(feed),
      brine: round(brine),
      salinity: round(brineGL, 1),
    },
  });
  if (recovery > 0.5) {
    notes.push({
      code: 'ro.recoveryHigh',
      severity: 'warn',
      values: { pct: round(recovery * 100) },
    });
  }
  if (coverage < 100) {
    notes.push({
      code: 'ro.short',
      severity: 'error',
      values: { pct: round(coverage), m3: round(need - available) },
    });
  } else {
    notes.push({
      code: 'ro.headroom',
      severity: 'ok',
      values: { pct: round(coverage - 100) },
    });
  }
  if (p.secKwhM3 < 2.5) {
    notes.push({ code: 'ro.lowSec', severity: 'warn' });
  } else if (p.secKwhM3 > 4.5) {
    notes.push({ code: 'ro.highSec', severity: 'info' });
  }
  notes.push({
    code: 'ro.product',
    severity: productMgL > 500 ? 'warn' : 'ok',
    values: { mg: round(productMgL), ec: round(productMgL / MG_L_PER_DS_M, 2) },
  });
  notes.push({ code: 'ro.brine', severity: 'info' });

  return {
    needM3Day: round(need, 1),
    feedM3Day: round(feed, 1),
    brineM3Day: round(brine, 1),
    brineSalinityGL: round(brineGL, 1),
    productMgL: round(productMgL),
    productEcDsM: round(productMgL / MG_L_PER_DS_M, 2),
    energyKwhDay: round(energy),
    powerKw: round(energy / 24, 1),
    costDay: round(energy * Math.max(0, p.electricityPrice), 2),
    costPerM3: round(
      Math.max(0, p.secKwhM3) * Math.max(0, p.electricityPrice),
      3,
    ),
    tankM3: round(need * Math.max(0, p.storageDays)),
    coveragePct: round(coverage),
    notes,
  };
}

/** Relative yield of tomato at a root-zone EC: 1 − slope × (EC − threshold). */
export function salinityYield(
  ec: number,
  slopePct: number,
  thresholdEc: number,
): number {
  return Math.min(
    1,
    Math.max(0, 1 - (slopePct / 100) * Math.max(0, ec - thresholdEc)),
  );
}

/**
 * Fertigation with drain recycling. Water: applied A, drain D, reused R,
 * let go D − R, fresh make-up A − R. EC: the crop takes water with less
 * salt than it is given, so EC_drain = (A·EC_feed − U·EC_uptake) / D. Sodium
 * and chloride hardly go into the crop, so they build up in the loop of
 * volume V: V·dC/dt = C_in·fresh − C·(A/D)·let go. Fully closed, they climb
 * straight to the limit in t = V (C_lim − C_0) / (C_in · fresh); with some
 * drain let go they level off at C_in · fresh · D / (A · let go). Each
 * mmol/L of either adds 0.06 dS/m to the EC, of bicarbonate 0.045; the loop
 * goes at the first of the sodium, chloride and EC limits. A year under five
 * strategies (as set, flush at the EC ceiling, acidified refill, refill EC
 * lowered as salt builds, steady bleed) is worked out day by day. Yield: 1 − slope × (EC_root − threshold).
 */
export function fertigation(p: FertigationParams): FertigationResult {
  const applied = Math.max(0, p.appliedM3Day);
  const drain = applied * Math.min(0.9, Math.max(0, p.drainPct / 100));
  const reused = drain * Math.min(1, Math.max(0, p.recyclePct / 100));
  const discharged = drain - reused;
  const fresh = applied - reused;
  const uptakeWater = applied - drain;
  const drainEc =
    drain > 0
      ? (applied * p.targetEcDsM - uptakeWater * p.uptakeEcDsM) / drain
      : p.targetEcDsM;
  const rootEc = (p.targetEcDsM + drainEc) / 2;
  const relativeYield = salinityYield(
    rootEc,
    p.yieldSlopePct,
    p.yieldThresholdEc,
  );

  // Sodium, chloride and bicarbonate in the solution fed to the crop. The
  // crop drinks water but leaves them, so the drain holds C·A/D; what is let
  // go carries them out: V·dC/dt = C_in·fresh − C·(A/D)·let go, solved
  // exactly. All climb by the same factor g = C / C_in, so one loop tells
  // every limit.
  const loop: Loop = {
    applied,
    drain,
    volume: Math.max(0.1, p.systemM3),
  };
  const naIn = Math.max(0, p.sourceNaMmolL);
  const clIn = Math.max(0, p.sourceClMmolL ?? p.sourceNaMmolL);
  const hco3In = Math.max(0, p.sourceHco3MmolL ?? 0);
  const nutrientEc = Math.max(0, p.targetEcDsM - p.sourceEcDsM);
  // EC each step of g adds: 0.06 dS/m per mmol/L of sodium or chloride,
  // 0.045 per mmol/L of bicarbonate. Acid in the refill turns bicarbonate
  // into CO₂ (and nitrate, a nutrient), so it no longer builds up.
  const ionBallast = (EC_PER_MMOL_NACL / 2) * (naIn + clIn);
  const ballastPerG = ionBallast + EC_PER_MMOL_HCO3 * hco3In;
  const limitsFor = (ballast: number): Record<FlushLimit, number> => ({
    na: naIn > 0 ? p.naLimitMmolL / naIn : Infinity,
    cl:
      clIn > 0 && p.clLimitMmolL !== undefined
        ? p.clLimitMmolL / clIn
        : Infinity,
    ec: ballast > 0 ? 1 + (p.flushEcDsM - p.targetEcDsM) / ballast : Infinity,
  });
  const limits = limitsFor(ballastPerG);
  const firstOf = (l: Record<FlushLimit, number>): FlushLimit =>
    (['na', 'cl', 'ec'] as const).reduce((a, b) => (l[b] < l[a] ? b : a));
  const limitBy = firstOf(limits);
  const gLimit = limits[limitBy];
  const equilibrium = discharged > 0 ? levelFactor(loop, discharged) : null;
  let flushDay: number | null = null;
  if (reused > 0 && Number.isFinite(gLimit)) {
    if (gLimit <= 1) flushDay = 0;
    else if (equilibrium === null)
      flushDay = Math.ceil((loop.volume * (gLimit - 1)) / fresh);
    else if (equilibrium > gLimit) {
      const k = ((applied / drain) * discharged) / loop.volume;
      flushDay = Math.ceil(
        Math.log((equilibrium - 1) / (equilibrium - gLimit)) / k,
      );
    }
  }
  const days: FertigationDay[] = [];
  for (let day = 0; day <= LOOP_DAYS; day += 2) {
    const g = loopFactor(loop, discharged, 1, day);
    days.push({
      day,
      naMmolL: round(naIn * g, 2),
      clMmolL: round(clIn * g, 2),
      feedEcDsM: round(p.targetEcDsM + ballastPerG * (g - 1), 2),
    });
  }

  // A year under each strategy, against the same limits.
  const crop = (ballast: number): YearCrop => ({
    ballastPerG: ballast,
    nutrientEc,
    rootEc,
    dilution: p.dilution,
    slope: p.yieldSlopePct,
    threshold: p.yieldThresholdEc,
  });
  const uptake = applied - drain;
  const bleed = !Number.isFinite(gLimit)
    ? 0
    : gLimit * applied > drain
      ? Math.min(drain, (uptake * drain) / (gLimit * applied - drain))
      : drain;
  const acidLimits = limitsFor(ionBallast);
  // Holding the EC, only the ions themselves (or nutrients run out) end it.
  const variableAt = Math.min(
    limits.na,
    limits.cl,
    ballastPerG > 0 ? 1 + nutrientEc / ballastPerG : Infinity,
  );
  const withSalt = crop(ballastPerG);
  const strategies = [
    simulateYear('current', loop, discharged, gLimit, false, withSalt),
    simulateYear('flush', loop, 0, gLimit, false, withSalt),
    simulateYear(
      'acid',
      loop,
      0,
      acidLimits[firstOf(acidLimits)],
      false,
      crop(ionBallast),
    ),
    simulateYear('variable', loop, 0, variableAt, true, withSalt),
    simulateYear('bleed', loop, bleed, Infinity, false, withSalt),
  ];

  // Fertiliser: what a fresh-water-only system would need, against what is
  // left once the reused drain brings its own nutrients back.
  const openNeed = applied * nutrientEc;
  const drainNutrients = Math.max(0, drainEc - p.sourceEcDsM);
  const closedNeed = Math.max(
    0,
    openNeed - reused * Math.min(drainNutrients, nutrientEc),
  );
  const fertSaved = openNeed > 0 ? (1 - closedNeed / openNeed) * 100 : 0;
  const stockLDay =
    nutrientEc > 0
      ? ((closedNeed / nutrientEc) * 1000) / Math.max(1, p.dilution)
      : 0;
  const stockDays =
    stockLDay > 0 ? (Math.max(0, p.stockTankM3) * 1000) / stockLDay : 0;

  const notes: CalcNote[] = [];
  notes.push({
    code: 'fert.water',
    severity: 'info',
    values: {
      reused: round(reused, 1),
      pct: round(applied > 0 ? (reused / applied) * 100 : 0),
    },
  });
  if (drainEc >= p.flushEcDsM) {
    notes.push({
      code: 'fert.drainHigh',
      severity: 'warn',
      values: { ec: round(drainEc, 1), max: p.flushEcDsM },
    });
  }
  if (rootEc > p.yieldThresholdEc) {
    notes.push({
      code: 'fert.yield',
      severity: relativeYield < 0.9 ? 'warn' : 'info',
      values: { ec: round(rootEc, 1), pct: round((1 - relativeYield) * 100) },
    });
  }
  if (flushDay !== null) {
    const severity = flushDay < 14 ? 'warn' : 'info';
    if (limitBy === 'na') {
      notes.push({
        code: 'fert.flush',
        severity,
        values: { days: flushDay, na: round(naIn * gLimit, 1) },
      });
    } else if (limitBy === 'cl') {
      notes.push({
        code: 'fert.flushCl',
        severity,
        values: { days: flushDay, cl: round(clIn * gLimit, 1) },
      });
    } else {
      notes.push({
        code: 'fert.flushEc',
        severity,
        values: { days: flushDay, ec: round(p.flushEcDsM, 1) },
      });
    }
  } else if (equilibrium !== null && reused > 0) {
    notes.push({
      code: 'fert.levels',
      severity: 'ok',
      values: {
        na: round(naIn * equilibrium, 1),
        cl: round(clIn * equilibrium, 1),
      },
    });
  }
  // A steady bleed lets less go than emptying the loop at the ceiling.
  const flushed = strategies[1];
  const bled = strategies[4];
  if (flushed.flushesYear > 0 && bled.letGoM3Year < flushed.letGoM3Year) {
    notes.push({
      code: 'fert.bleed',
      severity: 'info',
      values: {
        m3: round(bled.letGoM3Day, 1),
        saved: round(flushed.letGoM3Year - bled.letGoM3Year),
      },
    });
  }
  if (p.sourceNaMmolL > 3) {
    notes.push({ code: 'fert.saltySource', severity: 'warn' });
  }
  if (p.drainPct < 20 && p.sourceEcDsM > 1) {
    notes.push({ code: 'fert.lowDrain', severity: 'warn' });
  }
  notes.push({ code: 'fert.disinfect', severity: 'info' });

  return {
    drainM3Day: round(drain, 1),
    reusedM3Day: round(reused, 1),
    dischargedM3Day: round(discharged, 1),
    freshM3Day: round(fresh, 1),
    drainEcDsM: round(drainEc, 2),
    rootEcDsM: round(rootEc, 2),
    yieldLossPct: round((1 - relativeYield) * 100, 1),
    waterSavedPct: round(applied > 0 ? (reused / applied) * 100 : 0),
    fertiliserSavedPct: round(fertSaved),
    stockLDay: round(stockLDay),
    stockDays: round(stockDays, 1),
    flushDay,
    limitBy,
    naEquilibriumMmolL:
      equilibrium === null ? null : round(naIn * equilibrium, 1),
    clEquilibriumMmolL:
      equilibrium === null ? null : round(clIn * equilibrium, 1),
    days,
    strategies,
    notes,
  };
}

/** The loop's size: water given and drained a day, water held, m³. */
interface Loop {
  applied: number;
  drain: number;
  volume: number;
}

/**
 * Where the concentration factor g = C / C_in levels off when `letGo` m³ of
 * drain go each day: g = fresh · D / (A · let go).
 */
function levelFactor(loop: Loop, letGo: number): number {
  const fresh = loop.applied - (loop.drain - letGo);
  return (fresh * loop.drain) / (loop.applied * letGo);
}

/** The concentration factor `days` later, from `g0`, solved exactly. */
function loopFactor(
  loop: Loop,
  letGo: number,
  g0: number,
  days: number,
): number {
  const reused = loop.drain - letGo;
  if (reused <= 0) return 1;
  const fresh = loop.applied - reused;
  if (letGo <= 0) return g0 + (fresh * days) / loop.volume;
  const k = ((loop.applied / loop.drain) * letGo) / loop.volume;
  const level = levelFactor(loop, letGo);
  return level + (g0 - level) * Math.exp(-k * days);
}

interface YearCrop {
  /** EC added per step of the concentration factor, dS/m. */
  ballastPerG: number;
  nutrientEc: number;
  /** Root-zone EC with no salt build-up, dS/m. */
  rootEc: number;
  dilution: number;
  slope: number;
  threshold: number;
}

/**
 * A year of the loop, day by day: `letGo` m³ of drain go each day, and the
 * loop is emptied and refilled with fresh water when g reaches `flushAt`.
 * With `holdEc` the refill's nutrients drop as salt builds up, so the EC
 * at the dripper holds; otherwise the salt adds to it. What is let go
 * carries nutrients at the day's feed strength.
 */
function simulateYear(
  id: FlushStrategy,
  loop: Loop,
  letGo: number,
  flushAt: number,
  holdEc: boolean,
  crop: YearCrop,
): FlushStrategyResult {
  const fresh = loop.applied - (loop.drain - letGo);
  // The drain holds the salt of A m³ in D m³: the root zone averages both.
  const rootPerBallast =
    loop.drain > 0 ? (1 + loop.applied / loop.drain) / 2 : 1;
  let g = 1;
  let flushes = 0;
  let letGoM3 = 0;
  let freshM3 = 0;
  let stockM3 = 0;
  let rootSum = 0;
  let yieldSum = 0;
  let minNutrient = crop.nutrientEc;
  for (let day = 0; day < YEAR_DAYS; day++) {
    const ballast = crop.ballastPerG * (g - 1);
    const nutrient = holdEc
      ? Math.max(0, crop.nutrientEc - ballast)
      : crop.nutrientEc;
    const strength = crop.nutrientEc > 0 ? nutrient / crop.nutrientEc : 0;
    const root = holdEc ? crop.rootEc : crop.rootEc + ballast * rootPerBallast;
    rootSum += root;
    yieldSum += salinityYield(root, crop.slope, crop.threshold);
    minNutrient = Math.min(minNutrient, nutrient);
    letGoM3 += letGo;
    freshM3 += fresh;
    stockM3 += letGo * strength;
    g = loopFactor(loop, letGo, g, 1);
    if (g >= flushAt) {
      flushes++;
      letGoM3 += loop.volume;
      freshM3 += loop.volume;
      stockM3 += loop.volume * strength;
      g = 1;
    }
  }
  return {
    id,
    flushesYear: flushes,
    letGoM3Day: round(letGo, 2),
    letGoM3Year: round(letGoM3),
    freshM3Year: round(freshM3),
    stockLostLYear: round((stockM3 * 1000) / Math.max(1, crop.dilution)),
    meanRootEcDsM: round(rootSum / YEAR_DAYS, 2),
    yieldLossPct: round((1 - yieldSum / YEAR_DAYS) * 100, 1),
    minNutrientEcDsM: round(minNutrient, 2),
  };
}
