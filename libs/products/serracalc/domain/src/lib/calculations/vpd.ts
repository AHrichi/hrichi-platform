import { stageTargets, vpdBandsFor, VPD_LIMITS } from '../data/targets.data';
import type {
  CalcNote,
  VpdAction,
  VpdPair,
  VpdParams,
  VpdResult,
  VpdStatus,
} from '../models/serra.models';
import {
  dewPointC,
  humidityRatio,
  round,
  saturationVapourKpa,
  vpdKpa,
} from '../utils/physics';

/** Water vapour's gas constant, J/(kg·K). */
const R_VAPOUR = 461.5;

/** Water in saturated air at a temperature, g/m³. */
export function saturatedGm3(tC: number): number {
  return ((saturationVapourKpa(tC) * 1000) / (R_VAPOUR * (tC + 273.15))) * 1000;
}

/** The relative humidity that gives a VPD at a temperature, or null. */
export function rhForVpd(tC: number, vpd: number): number | null {
  const es = saturationVapourKpa(tC);
  if (vpd >= es || vpd < 0) return null;
  return 100 * (1 - vpd / es);
}

/** Temperatures the "same VPD, other air" table shows. */
export const PAIR_TEMPERATURES = [15, 20, 25, 30, 35] as const;

/**
 * The air the crop stands in: VPD = e_s(T) × (1 − RH/100) with Tetens'
 * e_s (FAO-56), the dew point, the water the air holds and can still take,
 * and what to do about it for the crop's stage and the light.
 */
export function vpdCheck(p: VpdParams): VpdResult {
  const targets = stageTargets(p.crop, p.stage);
  const { band, ideal } = vpdBandsFor(targets, p.light);
  const temperatureBand = p.light === 'night' ? targets.nightC : targets.dayC;
  const vpd = vpdKpa(p.airC, p.rhPct);
  const dew = dewPointC(p.airC, p.rhPct);
  const saturated = saturatedGm3(p.airC);
  const absolute = saturated * (Math.min(100, Math.max(0, p.rhPct)) / 100);
  const xIn = humidityRatio(p.airC, p.rhPct);
  const xOut = humidityRatio(p.outsideC, p.outsideRhPct);

  let status: VpdStatus = 'good';
  let action: VpdAction = 'hold';
  if (vpd < band.min) {
    status = 'tooWet';
    if (xOut >= xIn) {
      action = 'heat';
    } else {
      action =
        p.airC < temperatureBand.min + 1 || p.outsideC < p.airC - 5
          ? 'heatAndVent'
          : 'ventilate';
    }
  } else if (vpd > band.max) {
    status = 'tooDry';
    action = p.airC > temperatureBand.max ? 'coolAndHumidify' : 'humidify';
  }

  const middle = (ideal.min + ideal.max) / 2;
  const pairs: VpdPair[] = [];
  for (const t of PAIR_TEMPERATURES) {
    const rh = rhForVpd(t, middle);
    if (rh !== null && rh <= 98) pairs.push({ airC: t, rhPct: round(rh) });
  }

  const notes: CalcNote[] = [];
  const values = {
    vpd: round(vpd, 2),
    min: band.min,
    max: band.max,
  };
  notes.push({
    code: `vpd.${status}`,
    severity: status === 'good' ? 'ok' : 'warn',
    values,
  });
  if (vpd < VPD_LIMITS.disease) {
    notes.push({ code: 'vpd.disease', severity: 'error' });
  } else if (vpd >= VPD_LIMITS.arid) {
    notes.push({ code: 'vpd.arid', severity: 'error' });
  } else if (vpd > VPD_LIMITS.wilting) {
    notes.push({ code: 'vpd.wilting', severity: 'error' });
  }
  if (p.airC < temperatureBand.min) {
    notes.push({
      code: 'vpd.cold',
      severity: 'warn',
      values: { min: temperatureBand.min },
    });
  } else if (p.airC > temperatureBand.max) {
    notes.push({
      code: 'vpd.hot',
      severity: 'warn',
      values: { max: temperatureBand.max },
    });
  }
  if (status === 'tooWet' && xOut >= xIn) {
    notes.push({ code: 'vpd.outsideWetter', severity: 'info' });
  }
  notes.push({
    code: 'vpd.samePairs',
    severity: 'info',
    values: { vpd: round(middle, 2) },
  });

  return {
    vpdKpa: round(vpd, 2),
    dewPointC: round(dew, 1),
    absoluteGm3: round(absolute, 1),
    headroomGm3: round(saturated - absolute, 1),
    insideGkg: round(xIn * 1000, 1),
    outsideGkg: round(xOut * 1000, 1),
    status,
    ideal: vpd >= ideal.min && vpd <= ideal.max,
    action,
    band,
    idealBand: ideal,
    temperatureBand,
    rhBand: targets.rhPct,
    pairs,
    notes,
  };
}
