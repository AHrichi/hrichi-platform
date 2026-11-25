import type {
  CalcNote,
  FertigationDay,
  FertigationParams,
  FertigationResult,
  RoParams,
  RoResult,
} from '../models/serra.models';
import { round } from '../utils/physics';

/** mg/L of dissolved salt per dS/m of EC, for desalinated water. */
export const MG_L_PER_DS_M = 640;
/** EC added by 1 mmol/L of sodium chloride, dS/m. */
export const EC_PER_MMOL_NACL = 0.12;
/** Days of the loop the chart shows. */
const LOOP_DAYS = 120;

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
 * hardly goes into the crop, so it builds up in the loop of volume V:
 * V·dC/dt = C_in·fresh − C·let go. Fully closed, it climbs straight to the
 * limit in t = V (C_lim − C_0) / (C_in · fresh); with some drain let go it
 * levels off at C_in · fresh / let go. Yield: 1 − slope × (EC_root − 2.0).
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

  // Sodium in the solution fed to the crop. The crop drinks water but leaves
  // the sodium, so the drain holds C·A/D; what is let go carries it out:
  // V·dC/dt = C_in·fresh − C·(A/D)·let go, solved exactly day by day.
  const volume = Math.max(0.1, p.systemM3);
  const cIn = Math.max(0, p.sourceNaMmolL);
  const nutrientEc = Math.max(0, p.targetEcDsM - p.sourceEcDsM);
  const ecAt = (na: number) => p.targetEcDsM + (na - cIn) * EC_PER_MMOL_NACL;
  // The EC ceiling as sodium; whichever limit comes first.
  const naAtFlushEc = cIn + (p.flushEcDsM - p.targetEcDsM) / EC_PER_MMOL_NACL;
  const limit = Math.min(p.naLimitMmolL, naAtFlushEc);
  const k = drain > 0 ? ((applied / drain) * discharged) / volume : 0;
  const equilibrium =
    k > 0 ? (cIn * fresh * drain) / (applied * discharged) : null;
  const naAt = (t: number) =>
    equilibrium !== null
      ? equilibrium + (cIn - equilibrium) * Math.exp(-k * t)
      : cIn + (cIn * fresh * t) / volume;
  let flushDay: number | null = null;
  if (reused > 0 && cIn * fresh > 0) {
    if (limit <= cIn) flushDay = 0;
    else if (equilibrium === null)
      flushDay = Math.ceil((volume * (limit - cIn)) / (cIn * fresh));
    else if (equilibrium > limit)
      flushDay = Math.ceil(
        Math.log((equilibrium - cIn) / (equilibrium - limit)) / k,
      );
  }
  const days: FertigationDay[] = [];
  for (let day = 0; day <= LOOP_DAYS; day += 2) {
    const na = naAt(day);
    days.push({ day, naMmolL: round(na, 2), feedEcDsM: round(ecAt(na), 2) });
  }

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
    notes.push({
      code: 'fert.flush',
      severity: flushDay < 14 ? 'warn' : 'info',
      values: { days: flushDay, na: round(limit, 1) },
    });
  } else if (equilibrium !== null && reused > 0 && discharged > 0) {
    notes.push({
      code: 'fert.levels',
      severity: 'ok',
      values: { na: round(equilibrium, 1) },
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
    naEquilibriumMmolL: equilibrium === null ? null : round(equilibrium, 1),
    days,
    notes,
  };
}
