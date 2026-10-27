const DEG = Math.PI / 180;

function julianDate(date: Date): number {
  return date.getTime() / 86_400_000 + 2_440_587.5;
}

/**
 * Greenwich mean sidereal time in radians (IAU 1982, as in Vallado and
 * satellite.js): the angle that turns inertial coordinates into Earth-fixed ones.
 */
export function gmst(date: Date): number {
  const t = (julianDate(date) - 2_451_545) / 36_525;
  const seconds =
    -6.2e-6 * t * t * t +
    0.093104 * t * t +
    (876_600 * 3600 + 8_640_184.812866) * t +
    67_310.54841;
  const radians = ((seconds * DEG) / 240) % (2 * Math.PI);
  return radians < 0 ? radians + 2 * Math.PI : radians;
}

/**
 * Unit vector from the Earth to the Sun in inertial (equator of date)
 * coordinates. The Astronomical Almanac's low-precision formula: about 0.01°,
 * plenty to draw the day/night line.
 */
export function sunDirection(date: Date): [number, number, number] {
  const n = julianDate(date) - 2_451_545;
  const meanLongitude = (280.46 + 0.9856474 * n) * DEG;
  const meanAnomaly = (357.528 + 0.9856003 * n) * DEG;
  const longitude =
    meanLongitude +
    (1.915 * Math.sin(meanAnomaly) + 0.02 * Math.sin(2 * meanAnomaly)) * DEG;
  const obliquity = (23.439 - 4e-7 * n) * DEG;
  return [
    Math.cos(longitude),
    Math.cos(obliquity) * Math.sin(longitude),
    Math.sin(obliquity) * Math.sin(longitude),
  ];
}

/** Latitude and longitude (degrees) where the Sun is overhead. */
export function subsolarPoint(date: Date): { lat: number; lon: number } {
  const [x, y, z] = sunDirection(date);
  const rightAscension = Math.atan2(y, x);
  let lon = (rightAscension - gmst(date)) / DEG;
  lon = ((((lon + 180) % 360) + 360) % 360) - 180;
  return { lat: Math.asin(z) / DEG, lon };
}
