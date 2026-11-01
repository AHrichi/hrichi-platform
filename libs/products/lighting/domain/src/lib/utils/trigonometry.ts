/**
 * Calculates distance to object base using phone tilt angle (pitch down) and user eye height.
 * D = eyeHeight / tan(pitchDownRadians)
 *
 * @param pitchDownDegrees Angle tilted downward from horizontal (degrees, > 0)
 * @param eyeHeightMeters Height of phone from ground level (typically 1.50m - 1.75m)
 */
export function calculateDistanceToTargetBase(
  pitchDownDegrees: number,
  eyeHeightMeters = 1.65,
): number {
  if (pitchDownDegrees <= 1.0) {
    return 99.9; // virtually parallel to horizon
  }
  const rad = (Math.min(88, pitchDownDegrees) * Math.PI) / 180;
  const distance = eyeHeightMeters / Math.tan(rad);
  return parseFloat(distance.toFixed(1));
}

/**
 * Calculates total height of a pole using measured ground distance, user eye height,
 * and pitch angle tilted upward towards the pole head.
 * H = distance * tan(pitchUpRadians) + eyeHeight
 */
export function calculatePoleHeightFromAngle(
  groundDistanceMeters: number,
  pitchUpDegrees: number,
  eyeHeightMeters = 1.65,
): number {
  if (pitchUpDegrees <= 0) {
    return eyeHeightMeters;
  }
  const rad = (Math.min(85, pitchUpDegrees) * Math.PI) / 180;
  const height = groundDistanceMeters * Math.tan(rad) + eyeHeightMeters;
  return parseFloat(height.toFixed(1));
}

/**
 * A pole's distance and height from two sightings with the phone held at eye
 * height: first down to the pole's base, then up to its top.
 *
 *   distance = eyeHeight / tan(baseDepression)
 *   height   = distance × tan(topElevation) + eyeHeight
 */
export function measurePoleHeight(
  eyeHeightMeters: number,
  baseDepressionDegrees: number,
  topElevationDegrees: number,
): { distanceMeters: number; heightMeters: number } {
  const distanceMeters = calculateDistanceToTargetBase(
    baseDepressionDegrees,
    eyeHeightMeters,
  );
  return {
    distanceMeters,
    heightMeters: calculatePoleHeightFromAngle(
      distanceMeters,
      topElevationDegrees,
      eyeHeightMeters,
    ),
  };
}

/**
 * Calculates distance in meters between two GPS coordinates using the Haversine formula.
 */
export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3; // Earth radius in meters
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaPhi = ((lat2 - lat1) * Math.PI) / 180;
  const deltaLambda = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) *
      Math.cos(phi2) *
      Math.sin(deltaLambda / 2) *
      Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return parseFloat((R * c).toFixed(1));
}
