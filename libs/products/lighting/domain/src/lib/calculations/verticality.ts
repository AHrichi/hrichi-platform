import {
  CompassDirection,
  VerticalityCheckResult,
  VerticalityParams,
} from '../models/lighting.models';

/**
 * Standard EN 40-3 allows a maximum vertical deviation of 1.0° (or 15 mm per meter of height).
 */
export const MAX_ALLOWABLE_TILT_DEGREES = 1.0;

/**
 * Evaluates pole verticality (plumb) against EN 40 standards and computes corrective nut turn adjustments.
 */
export function checkPoleVerticality(
  params: VerticalityParams,
): VerticalityCheckResult {
  const tilt = parseFloat(Math.abs(params.measuredTiltDegrees).toFixed(2));
  const H = Math.max(3, params.poleHeightMeters);
  const boltPitchMm = params.anchorBoltPitchMm ?? (H >= 8 ? 300 : 200);

  // Linear deviation at the luminaire head (mm):
  // delta = H * 1000 * tan(tilt in radians)
  const tiltRad = (tilt * Math.PI) / 180;
  const displacementAtTipMm = Math.round(H * 1000 * Math.tan(tiltRad));

  let status: 'perfect' | 'acceptable' | 'rejected_deviation';
  let isCompliant = true;

  if (tilt <= 0.4) {
    status = 'perfect';
  } else if (tilt <= MAX_ALLOWABLE_TILT_DEGREES) {
    status = 'acceptable';
  } else {
    status = 'rejected_deviation';
    isCompliant = false;
  }

  // Sizing the leveling nut adjustment:
  // Baseplate height correction required on the low/high side:
  // delta_h = BoltPitch * tan(tilt)
  const heightCorrectionMm = parseFloat(
    (boltPitchMm * Math.tan(tiltRad)).toFixed(1),
  );
  // Thread pitch for standard M20/M24 bolts is ~2.5mm per turn:
  const threadPitchMm = 2.5;
  const nutTurns = parseFloat((heightCorrectionMm / threadPitchMm).toFixed(1));

  const OPPOSITE: Record<CompassDirection, CompassDirection> = {
    N: 'S',
    NE: 'SW',
    E: 'W',
    SE: 'NW',
    S: 'N',
    SW: 'NE',
    W: 'E',
    NW: 'SE',
  };
  const leanSide = params.measuredDirection ?? 'S';
  const correction =
    status === 'perfect'
      ? null
      : {
          leanSide,
          raiseSide: OPPOSITE[leanSide],
          heightMm: heightCorrectionMm,
          turns: nutTurns,
        };

  return {
    tiltDegrees: tilt,
    maxAllowableTiltDegrees: MAX_ALLOWABLE_TILT_DEGREES,
    displacementAtTipMm,
    isCompliant,
    status,
    correction,
  };
}
