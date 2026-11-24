import type {
  CalcNote,
  PadFanParams,
  PadFanResult,
  SolarLoadParams,
  VentilationParams,
  VentilationResult,
} from '../models/serra.models';
import {
  AIR_CP,
  AIR_DENSITY,
  GRAVITY,
  LATENT_HEAT,
  round,
  wetBulbC,
} from '../utils/physics';

/** Vent discharge coefficient and wind pressure coefficient (roof vents). */
export const VENT_CD = 0.65;
export const VENT_CW = 0.1;

/**
 * The sunlight that ends up heating the air: τ × (1 − shade) × Rg × floor,
 * less the share the crop spends on transpiration.
 */
export function solarLoadW(p: SolarLoadParams): number {
  const tau = clamp01(p.transmissionPct / 100);
  const shade = clamp01(p.shadingPct / 100);
  const evaporated = clamp01(p.evapotranspirationPct / 100);
  return (
    tau *
    (1 - shade) *
    Math.max(0, p.radiationWm2) *
    p.floorAreaM2 *
    (1 - evaporated)
  );
}

/**
 * Air needed to hold the house at most ΔT above outside on a sunny day:
 * G = (Q_sun − U·A·ΔT) / (ρ·cp·ΔT). The vent opening for natural
 * ventilation follows Boulard & Baille (1995):
 * G = Cd·(A/2)·√(2g·(ΔT/T)·(h/4) + Cw·u²).
 */
export function ventilation(p: VentilationParams): VentilationResult {
  const rise = Math.max(0.5, p.maxRiseK);
  const solar = solarLoadW(p);
  const conduction = Math.max(0, p.uValue) * p.coverAreaM2 * rise;
  const net = Math.max(0, solar - conduction);
  const flow = net / (AIR_DENSITY * AIR_CP * rise);
  const flowM3h = flow * 3600;
  const outsideK = p.outsideC + 273.15;
  const drive = Math.sqrt(
    2 * GRAVITY * (rise / outsideK) * (Math.max(0.1, p.ventOpeningM) / 4) +
      VENT_CW * Math.max(0, p.windMs) ** 2,
  );
  const ventArea = (2 * flow) / (VENT_CD * drive);
  const ventPct = (ventArea / Math.max(1, p.floorAreaM2)) * 100;
  const ach = flowM3h / Math.max(1, p.volumeM3);
  const fans =
    flowM3h > 0 ? Math.ceil(flowM3h / Math.max(1000, p.fanCapacityM3h)) : 0;

  const notes: CalcNote[] = [];
  if (net === 0) {
    notes.push({ code: 'vent.coverEnough', severity: 'ok' });
  } else {
    if (ventPct <= 20) {
      notes.push({
        code: 'vent.naturalOk',
        severity: 'ok',
        values: { pct: round(ventPct, 1) },
      });
    } else if (ventPct <= 30) {
      notes.push({
        code: 'vent.naturalTight',
        severity: 'warn',
        values: { pct: round(ventPct, 1) },
      });
    } else {
      notes.push({
        code: 'vent.naturalShort',
        severity: 'error',
        values: { pct: round(ventPct, 1) },
      });
    }
    if (ach > 60) {
      notes.push({
        code: 'vent.extreme',
        severity: 'warn',
        values: { ach: round(ach) },
      });
    }
  }
  if (p.outsideC >= 30) {
    notes.push({ code: 'vent.hotOutside', severity: 'info' });
  }
  if (p.shadingPct === 0 && net > 0) {
    notes.push({ code: 'vent.tryShade', severity: 'info' });
  }

  return {
    solarLoadW: round(solar),
    conductionW: round(conduction),
    netLoadW: round(net),
    flowM3s: round(flow, 2),
    flowM3h: round(flowM3h),
    airChangesPerHour: round(ach, 1),
    flowPerM2: round(flowM3h / Math.max(1, p.floorAreaM2), 1),
    ventAreaM2: round(ventArea, 1),
    ventPct: round(ventPct, 1),
    fans,
    notes,
  };
}

/**
 * Fan-and-pad cooling. Air leaves the wet pad at T − η·(T − Tw), warms by
 * ΔT on its way to the fans, and the fans move G = Q / (ρ·cp·ΔT). The cover
 * adds U·A·(T_out − T_in) when outside is hotter. Water evaporated:
 * ρ·G·cp·(T − T_pad) / λ.
 */
export function padAndFan(p: PadFanParams): PadFanResult {
  const wetBulb = wetBulbC(p.outsideC, p.outsideRhPct);
  const eta = clamp01(p.padEfficiencyPct / 100);
  const padOutlet = p.outsideC - eta * (p.outsideC - wetBulb);
  const rise = Math.max(0.5, p.riseK);
  const exhaust = padOutlet + rise;
  const meanInside = padOutlet + rise / 2;
  const solar = solarLoadW(p);
  const cover =
    Math.max(0, p.uValue) * p.coverAreaM2 * (p.outsideC - meanInside);
  const net = Math.max(0, solar + cover);
  const flow = net / (AIR_DENSITY * AIR_CP * rise);
  const flowM3h = flow * 3600;
  const fans =
    flowM3h > 0 ? Math.ceil(flowM3h / Math.max(1000, p.fanCapacityM3h)) : 0;
  const padArea = flow / Math.max(0.3, p.padFaceVelocityMs);
  const padLength = padArea / Math.max(0.3, p.padHeightM);
  const evaporationKgS =
    (AIR_DENSITY * flow * AIR_CP * (p.outsideC - padOutlet)) / LATENT_HEAT;
  const evaporationLh = evaporationKgS * 3600;
  const waterPerDay = (evaporationLh * Math.max(0, p.hoursPerDay) * 1.1) / 1000;

  const notes: CalcNote[] = [];
  notes.push({
    code: 'pad.cooling',
    severity: p.outsideC - padOutlet >= 6 ? 'ok' : 'info',
    values: {
      drop: round(p.outsideC - padOutlet, 1),
      exhaust: round(exhaust, 1),
    },
  });
  if (p.outsideRhPct > 60) {
    notes.push({ code: 'pad.humid', severity: 'warn' });
  }
  if (p.padToFanM > 50) {
    notes.push({
      code: 'pad.tooLong',
      severity: 'warn',
      values: { m: round(p.padToFanM) },
    });
  }
  if (p.padFaceVelocityMs > 1.8) {
    notes.push({ code: 'pad.fastFace', severity: 'warn' });
  }
  notes.push({ code: 'pad.waterQuality', severity: 'info' });

  return {
    wetBulbC: round(wetBulb, 1),
    padOutletC: round(padOutlet, 1),
    exhaustC: round(exhaust, 1),
    meanInsideC: round(meanInside, 1),
    netLoadW: round(net),
    flowM3h: round(flowM3h),
    fans,
    padAreaM2: round(padArea, 1),
    padLengthM: round(padLength, 1),
    evaporationLh: round(evaporationLh),
    waterM3PerDay: round(waterPerDay, 1),
    notes,
  };
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}
