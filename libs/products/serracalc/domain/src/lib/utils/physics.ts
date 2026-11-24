/** Physical constants and air/water properties used across the calculators. */

/** Density of air near 20 °C at sea level, kg/m³. */
export const AIR_DENSITY = 1.2;
/** Specific heat of air, J/(kg·K). */
export const AIR_CP = 1005;
/** ρ·cp of air per m³/h, W per (m³/h)·K: 1.2 × 1005 / 3600 ≈ 0.335. */
export const AIR_W_PER_M3H_K = (AIR_DENSITY * AIR_CP) / 3600;
/** Water: kWh per m³ per K (4.186 MJ/m³K ÷ 3.6). */
export const WATER_KWH_PER_M3_K = 1.163;
/** Latent heat of vaporisation near 25 °C, J/kg (FAO-56 uses 2.45 MJ/kg). */
export const LATENT_HEAT = 2.45e6;
/** Stefan–Boltzmann constant, W/(m²·K⁴). */
export const STEFAN_BOLTZMANN = 5.67e-8;
export const GRAVITY = 9.81;

/** Saturation vapour pressure, kPa (Tetens, as FAO-56 eq. 11). */
export function saturationVapourKpa(tC: number): number {
  return 0.6108 * Math.exp((17.27 * tC) / (tC + 237.3));
}

/** Vapour pressure deficit, kPa. */
export function vpdKpa(tC: number, rhPct: number): number {
  return saturationVapourKpa(tC) * (1 - clampPct(rhPct) / 100);
}

/** Dew point, °C (inverse of Tetens). */
export function dewPointC(tC: number, rhPct: number): number {
  const e = saturationVapourKpa(tC) * (Math.max(1, clampPct(rhPct)) / 100);
  const a = Math.log(e / 0.6108);
  return (237.3 * a) / (17.27 - a);
}

/**
 * Wet-bulb temperature from dry bulb and relative humidity at sea level,
 * Stull (2011): within about ±0.3 °C for RH 5–99 % and −20…50 °C.
 */
export function wetBulbC(tC: number, rhPct: number): number {
  const rh = Math.min(99, Math.max(5, rhPct));
  return (
    tC * Math.atan(0.151977 * Math.sqrt(rh + 8.313659)) +
    Math.atan(tC + rh) -
    Math.atan(rh - 1.676331) +
    0.00391838 * rh ** 1.5 * Math.atan(0.023101 * rh) -
    4.686035
  );
}

/** Hours of daylight on a day of the year at a latitude (FAO-56 eq. 24, 34). */
export function dayLengthHours(latitudeDeg: number, dayOfYear: number): number {
  const phi = (latitudeDeg * Math.PI) / 180;
  const declination = 0.409 * Math.sin((2 * Math.PI * dayOfYear) / 365 - 1.39);
  const x = -Math.tan(phi) * Math.tan(declination);
  const omega = Math.acos(Math.min(1, Math.max(-1, x)));
  return (24 / Math.PI) * omega;
}

/** Day of the year in the middle of a month (0-based month). */
export function midMonthDay(month: number): number {
  return [17, 47, 75, 105, 135, 162, 198, 228, 258, 288, 318, 344][month];
}

function clampPct(value: number): number {
  return Math.min(100, Math.max(0, value));
}

export function round(value: number, digits = 0): number {
  const k = 10 ** digits;
  return Math.round(value * k) / k;
}
