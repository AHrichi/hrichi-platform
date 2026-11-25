import type {
  CalcNote,
  HumidityParams,
  HumidityResult,
} from '../models/serra.models';
import {
  AIR_CP,
  AIR_DENSITY,
  dewPointC,
  humidityRatio,
  round,
  vpdKpa,
} from '../utils/physics';

/** Inside surface heat transfer coefficient of a cover, W/m²·K. */
export const COVER_INSIDE_H = 8;

/**
 * Night humidity: the water the crop gives off must leave with outside air
 * that holds less, G = E / (ρ × (x_in − x_out)), and that air must be
 * warmed to the inside temperature. The cover's inside surface sits at
 * T_in − (U / h_i) × (T_in − T_out); below the dew point it drips.
 */
export function nightHumidity(p: HumidityParams): HumidityResult {
  const dew = dewPointC(p.insideC, p.insideRhPct);
  const vpd = vpdKpa(p.insideC, p.insideRhPct);
  const surface =
    p.insideC -
    (Math.max(0, p.uValue) / COVER_INSIDE_H) * (p.insideC - p.outsideC);
  const condensation = surface < dew;
  const xIn = humidityRatio(p.insideC, p.insideRhPct);
  const xOut = humidityRatio(p.outsideC, p.outsideRhPct);
  const moisture = (Math.max(0, p.transpirationGm2h) * p.floorAreaM2) / 1000;
  const drier = xIn - xOut;
  const air = drier > 0 ? moisture / (AIR_DENSITY * drier) : null;
  const heatKw =
    air !== null
      ? (AIR_DENSITY *
          AIR_CP *
          (air / 3600) *
          Math.max(0, p.insideC - p.outsideC)) /
        1000
      : 0;

  const notes: CalcNote[] = [];
  if (vpd < 0.3) {
    notes.push({
      code: 'humidity.vpdLow',
      severity: 'warn',
      values: { vpd: round(vpd, 2) },
    });
  } else if (vpd > 1.2) {
    notes.push({
      code: 'humidity.vpdHigh',
      severity: 'warn',
      values: { vpd: round(vpd, 2) },
    });
  } else {
    notes.push({
      code: 'humidity.vpdOk',
      severity: 'ok',
      values: { vpd: round(vpd, 2) },
    });
  }
  if (condensation) {
    notes.push({
      code: 'humidity.condensation',
      severity: 'warn',
      values: { surface: round(surface, 1), dew: round(dew, 1) },
    });
  }
  if (air === null) {
    notes.push({ code: 'humidity.outsideWetter', severity: 'error' });
  } else {
    notes.push({
      code: 'humidity.heat',
      severity: 'info',
      values: {
        kw: round(heatKw),
        wm2: round((heatKw * 1000) / Math.max(1, p.floorAreaM2)),
      },
    });
  }

  return {
    vpdKpa: round(vpd, 2),
    dewPointC: round(dew, 1),
    coverSurfaceC: round(surface, 1),
    condensation,
    insideGkg: round(xIn * 1000, 1),
    outsideGkg: round(xOut * 1000, 1),
    moistureKgH: round(moisture, 1),
    airM3h: air === null ? null : round(air),
    airChangesPerHour:
      air === null ? null : round(air / Math.max(1, p.volumeM3), 2),
    heatKw: round(heatKw, 1),
    nightKwh: round(heatKw * Math.max(0, p.nightHours)),
    notes,
  };
}
