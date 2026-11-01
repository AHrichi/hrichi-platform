/**
 * A pole's lean as read by a phone held upright with its back flat on the
 * pole and its screen facing the user: degrees to the user's right (+) or
 * left (−), and away from the user (+) or towards them (−).
 */
export interface LeanReading {
  sideways: number;
  away: number;
}

const DEG = 180 / Math.PI;

/**
 * Lean from the gravity vector (DeviceMotionEvent.accelerationIncludingGravity,
 * device axes: x to the right of the screen, y to its top, z out of it).
 * Reading gravity directly avoids the gimbal lock that makes the orientation
 * angles (beta, gamma) jump around when the phone stands upright. iOS reports
 * the opposite signs to Android, so the vector is turned to have y up first.
 * Returns null when the phone is not roughly upright.
 */
export function gravityToLean(
  x: number,
  y: number,
  z: number,
): LeanReading | null {
  const sign = y < 0 ? -1 : 1;
  const [gx, gy, gz] = [x * sign, y * sign, z * sign];
  const magnitude = Math.hypot(gx, gy, gz);
  // More than about 25° off vertical: not held against a pole.
  if (magnitude < 1 || gy / magnitude < Math.cos(25 / DEG)) {
    return null;
  }
  return {
    // Tipping the phone's top to the right sends gravity towards −x.
    sideways: -Math.atan2(gx, gy) * DEG,
    // Tipping its top away from the user tilts the screen up: gravity on +z.
    away: Math.atan2(gz, gy) * DEG,
  };
}

/**
 * The reversal method: side B is read from the opposite side of the pole,
 * where the true lean shows with the opposite sign while the phone's own
 * error (and the taper of a conical pole) shows with the same sign. Half the
 * difference keeps the lean and cancels both. The result is in side A's frame.
 */
export function combineSides(a: LeanReading, b: LeanReading): LeanReading {
  return {
    sideways: (a.sideways - b.sideways) / 2,
    away: (a.away - b.away) / 2,
  };
}

/**
 * The lean as north (+)/south (−) and east (+)/west (−) components, given the
 * compass bearing the user faced (towards the pole) on side A.
 */
export function leanToCompass(
  lean: LeanReading,
  facingDegrees: number,
): { north: number; east: number } {
  const f = facingDegrees / DEG;
  return {
    north: lean.away * Math.cos(f) - lean.sideways * Math.sin(f),
    east: lean.away * Math.sin(f) + lean.sideways * Math.cos(f),
  };
}
