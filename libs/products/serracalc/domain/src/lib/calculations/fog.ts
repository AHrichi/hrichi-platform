import { COOLING_RULES } from '../data/targets.data';
import type {
  CalcNote,
  CoolingAdvice,
  CoolingStrategy,
  FogParams,
  FogResult,
  VentilationParams,
} from '../models/serra.models';
import {
  AIR_CP,
  AIR_DENSITY,
  GRAVITY,
  humidityRatio,
  LATENT_HEAT,
  round,
  saturationVapourKpa,
  vpdKpa,
  wetBulbC,
} from '../utils/physics';
import { VENT_CD, VENT_CW, ventilation } from './cooling';

const PRESSURE_KPA = 101.325;

/** Relative humidity of air at a temperature holding x kg of water per kg. */
export function rhFromRatio(tC: number, x: number): number {
  const e = (x * PRESSURE_KPA) / (0.622 + x);
  return (100 * e) / saturationVapourKpa(tC);
}

interface Balance {
  insideC: number;
  rhPct: number;
  flowM3s: number;
}

/**
 * Steady state of a fogged house with its vents open. Heat: the sun's
 * sensible share in, the air and the cover carrying heat out, the fog's
 * evaporation taking λ·E: T_in = T_out + (S − λE) / (ρ·cp·G + U·A). Water:
 * x_in = x_out + (E + crop) / (ρ·G). The vents' flow G follows Boulard and
 * Baille from the opening, the wind and the temperature difference.
 */
function balance(p: FogParams, evaporatedKgS: number): Balance {
  const tau = clamp01(p.transmissionPct / 100);
  const shade = clamp01(p.shadingPct / 100);
  const et = clamp01(p.evapotranspirationPct / 100);
  const sunInside =
    tau * (1 - shade) * Math.max(0, p.radiationWm2) * p.floorAreaM2;
  const sensible = sunInside * (1 - et);
  const cropKgS = (sunInside * et) / LATENT_HEAT;
  const ua = Math.max(0, p.uValue) * p.coverAreaM2;
  const ventArea = (Math.max(0.5, p.ventPct) / 100) * p.floorAreaM2;
  const xOut = humidityRatio(p.outsideC, p.outsideRhPct);
  let dT = 3;
  let flow = 0;
  let inside = p.outsideC;
  for (let i = 0; i < 12; i++) {
    const drive = Math.sqrt(
      2 *
        GRAVITY *
        (Math.max(0.5, Math.abs(dT)) / (p.outsideC + 273.15)) *
        (Math.max(0.1, p.ventOpeningM) / 4) +
        VENT_CW * Math.max(0, p.windMs) ** 2,
    );
    flow = VENT_CD * (ventArea / 2) * drive;
    inside =
      p.outsideC +
      (sensible - LATENT_HEAT * evaporatedKgS) /
        (AIR_DENSITY * AIR_CP * flow + ua);
    dT = inside - p.outsideC;
  }
  const xIn = xOut + (evaporatedKgS + cropKgS) / (AIR_DENSITY * flow);
  return { insideC: inside, rhPct: rhFromRatio(inside, xIn), flowM3s: flow };
}

/**
 * High-pressure fogging. The nozzles spray q = n × L/h; the controller
 * pauses between bursts so the inside air stays under the humidity cap,
 * which sets the on/off cycle. Water a day: W = q × A × t / 10⁶ with q in
 * g/m²·min and t the minutes of fog.
 */
export function fogCooling(p: FogParams): FogResult {
  const nozzles = Math.max(
    0,
    Math.ceil((p.floorAreaM2 / 100) * Math.max(0, p.nozzlesPer100M2)),
  );
  const sprayKgS = (nozzles * Math.max(0, p.nozzleLh)) / 3600;
  const fogGm2Min =
    (nozzles * Math.max(0, p.nozzleLh) * 1000) /
    60 /
    Math.max(1, p.floorAreaM2);
  const ventOnly = balance(p, 0);

  // Fog as much as the cap allows: full spray if the air stays under it,
  // otherwise the evaporation that brings the inside air to the cap.
  let evaporated = sprayKgS;
  let state = balance(p, sprayKgS);
  let rhLimited = false;
  if (sprayKgS > 0 && state.rhPct > p.maxRhPct) {
    rhLimited = true;
    let low = 0;
    let high = sprayKgS;
    for (let i = 0; i < 40; i++) {
      const mid = (low + high) / 2;
      if (balance(p, mid).rhPct > p.maxRhPct) high = mid;
      else low = mid;
    }
    evaporated = low;
    state = balance(p, low);
  }
  if (ventOnly.rhPct > p.maxRhPct) {
    // Already over the cap without fog: no fogging at all.
    evaporated = 0;
    state = ventOnly;
  }

  const duty = sprayKgS > 0 ? evaporated / sprayKgS : 0;
  const onS = Math.max(5, p.onS);
  const offS = duty > 0 && duty < 1 ? (onS * (1 - duty)) / duty : 0;
  const waterM3Day =
    (sprayKgS * duty * 3600 * Math.max(0, p.hoursPerDay)) / 1000;
  const outsideRh = Math.min(100, Math.max(0, p.outsideRhPct));

  const notes: CalcNote[] = [];
  notes.push({
    code: 'fog.cooling',
    severity: p.outsideC - state.insideC >= 5 ? 'ok' : 'info',
    values: {
      inside: round(state.insideC, 1),
      drop: round(p.outsideC - state.insideC, 1),
      rh: round(state.rhPct),
    },
  });
  if (evaporated === 0 && ventOnly.rhPct > p.maxRhPct) {
    notes.push({ code: 'fog.tooHumid', severity: 'warn' });
  } else if (!rhLimited && nozzles > 0) {
    notes.push({ code: 'fog.moreNozzles', severity: 'info' });
  }
  if (rhLimited && duty > 0) {
    notes.push({
      code: 'fog.cycle',
      severity: 'info',
      values: { on: round(onS), off: round(offS), rh: p.maxRhPct },
    });
  }
  if (p.pressureBar < 40) {
    notes.push({ code: 'fog.lowPressure', severity: 'warn' });
  } else {
    notes.push({ code: 'fog.droplets', severity: 'info' });
  }
  if (p.ventPct > 20) {
    notes.push({ code: 'fog.trimVents', severity: 'info' });
  }
  notes.push({ code: 'fog.waterQuality', severity: 'info' });

  return {
    wetBulbC: round(wetBulbC(p.outsideC, outsideRh), 1),
    ventOnlyC: round(ventOnly.insideC, 1),
    insideC: round(state.insideC, 1),
    insideRhPct: round(state.rhPct),
    rhRisePct: round(state.rhPct - outsideRh),
    vpdKpa: round(vpdKpa(state.insideC, state.rhPct), 2),
    fogGm2Min: round(fogGm2Min, 1),
    meanGm2Min: round(fogGm2Min * duty, 1),
    onS: round(onS),
    offS: round(offS),
    dutyPct: round(duty * 100),
    waterM3Day: round(waterM3Day, 1),
    waterLm2Day: round((waterM3Day * 1000) / Math.max(1, p.floorAreaM2), 1),
    airFlowM3h: round(state.flowM3s * 3600),
    nozzles,
    padWaterM3Day: round(
      (waterM3Day * COOLING_RULES.padWaterGm2Min) /
        COOLING_RULES.fogWaterGm2Min,
      1,
    ),
    rhLimited,
    notes,
  };
}

/** What the advisor needs on top of the ventilation inputs. */
export interface CoolingAdviceParams extends VentilationParams {
  outsideRhPct: number;
  /** Length of the house, the run a pad-and-fan system would cool, m. */
  houseLengthM: number;
}

/**
 * The cooling strategy for a hot afternoon. Vents that would need more than
 * the roof can open, or an outside hotter than COOLING_RULES.hotOutsideC,
 * call for shade and evaporative cooling instead of bigger vents: fog in
 * long or large houses, pads where the run from pad to fan is short.
 */
export function coolingAdvice(p: CoolingAdviceParams): CoolingAdvice {
  const rules = COOLING_RULES;
  const vents = ventilation(p);
  const shadePct = Math.max(p.shadingPct, rules.shadePct);
  const shaded = ventilation({ ...p, shadingPct: shadePct });
  const hot = p.outsideC >= rules.hotOutsideC;
  const tooMuchVent = vents.ventPct > rules.ventLimitPct;

  let strategy: CoolingStrategy;
  if (!hot && !tooMuchVent) {
    strategy = vents.ventPct > 20 ? 'ventsAndShade' : 'vents';
  } else if (!hot && shaded.ventPct <= rules.ventLimitPct) {
    strategy = 'ventsAndShade';
  } else {
    strategy =
      p.houseLengthM > rules.padMaxLengthM ? 'shadeAndFog' : 'shadeAndPad';
  }

  const fog = fogCooling({
    outsideC: p.outsideC,
    outsideRhPct: p.outsideRhPct,
    floorAreaM2: p.floorAreaM2,
    coverAreaM2: p.coverAreaM2,
    volumeM3: p.volumeM3,
    uValue: p.uValue,
    radiationWm2: p.radiationWm2,
    transmissionPct: p.transmissionPct,
    shadingPct: shadePct,
    evapotranspirationPct: p.evapotranspirationPct,
    ventPct: rules.fogVentPct,
    ventOpeningM: p.ventOpeningM,
    windMs: p.windMs,
    nozzlesPer100M2: 27,
    nozzleLh: 5.4,
    pressureBar: 70,
    onS: 60,
    maxRhPct: rules.fogMaxRhPct,
    hoursPerDay: 8,
  });
  const wetBulb = wetBulbC(p.outsideC, p.outsideRhPct);
  const padOutlet = p.outsideC - 0.8 * (p.outsideC - wetBulb);

  const notes: CalcNote[] = [];
  if (tooMuchVent) {
    notes.push({
      code: 'advice.notBuildable',
      severity: 'error',
      values: {
        pct: vents.ventPct,
        limit: rules.ventLimitPct,
        flow: round(vents.flowM3h / 1e6, 1),
      },
    });
  }
  notes.push({
    code: `advice.${strategy}`,
    severity: strategy === 'vents' ? 'ok' : 'info',
    values: {
      shade: shadePct,
      pct: shaded.ventPct,
      inside: fog.insideC,
      pad: round(padOutlet, 1),
      length: round(p.houseLengthM),
    },
  });
  if (hot && p.outsideRhPct > rules.padMaxOutsideRhPct) {
    notes.push({ code: 'advice.humid', severity: 'warn' });
  }

  return {
    strategy,
    ventPct: vents.ventPct,
    shadedVentPct: shaded.ventPct,
    shadePct,
    fogInsideC: fog.insideC,
    padOutletC: round(padOutlet, 1),
    notes,
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
