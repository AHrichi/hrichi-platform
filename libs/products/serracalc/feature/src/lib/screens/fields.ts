import type { FieldSpec } from '../ui/field-grid/field-grid';

/** Number fields by calculator: unit, range and step. Labels come from copy. */
function spec(
  key: string,
  unit: string,
  min: number,
  max: number,
  step: number,
): FieldSpec {
  return { key, unit, min, max, step };
}

const floor = spec('floorAreaM2', 'm²', 10, 200000, 10);
const cover = spec('coverAreaM2', 'm²', 10, 300000, 10);
const volume = spec('volumeM3', 'm³', 10, 1500000, 10);
const uValue = spec('uValue', 'W/m²·K', 1, 10, 0.1);
const transmission = spec('transmissionPct', '%', 30, 95, 1);
const shading = spec('shadingPct', '%', 0, 80, 1);
const outside = spec('outsideC', '°C', 0, 48, 0.5);
const fan = spec('fanCapacityM3h', 'm³/h', 5000, 60000, 500);

export const GREENHOUSE_FIELDS: readonly FieldSpec[] = [
  spec('spans', '', 1, 60, 1),
  spec('spanWidthM', 'm', 3, 16, 0.1),
  spec('lengthM', 'm', 5, 400, 1),
  spec('gutterHeightM', 'm', 1, 8, 0.1),
  spec('ridgeHeightM', 'm', 1.5, 12, 0.1),
];

export const ENVELOPE_FIELDS: readonly FieldSpec[] = [
  floor,
  cover,
  volume,
  spec('perimeterM', 'm', 10, 5000, 1),
  uValue,
  spec('airChangesPerHour', '/h', 0.2, 5, 0.05),
  spec('screenSavingPct', '%', 0, 70, 1),
];

export const PEAK_FIELDS: readonly FieldSpec[] = [
  spec('insideC', '°C', 0, 30, 0.5),
  spec('outsideDesignC', '°C', -25, 20, 0.5),
  spec('marginPct', '%', 0, 50, 1),
];

export const YEAR_FIELDS: readonly FieldSpec[] = [
  spec('nightSetC', '°C', 0, 30, 0.5),
  spec('daySetC', '°C', 0, 35, 0.5),
  transmission,
  spec('solarGainPct', '%', 0, 80, 1),
  spec('efficiencyPct', '%', 50, 600, 5),
];

export function fuelPriceField(unit: string): FieldSpec {
  return spec('fuelPrice', unit, 0, 50, 0.01);
}

export const HOT_WATER_FIELDS: readonly FieldSpec[] = [
  spec('heatDemandKw', 'kW', 0, 20000, 1),
  spec('supplyC', '°C', 20, 95, 1),
  spec('returnC', '°C', 15, 90, 1),
  spec('airC', '°C', 5, 30, 0.5),
  floor,
  spec('loopLengthM', 'm', 10, 500, 1),
  spec('pumpHeadM', 'm', 1, 60, 0.5),
  spec('pumpEfficiencyPct', '%', 20, 90, 1),
  spec('annualHeatKwh', 'kWh', 0, 50000000, 100),
];

export const SOLAR_FIELDS: readonly FieldSpec[] = [
  floor,
  cover,
  volume,
  uValue,
  spec('radiationWm2', 'W/m²', 100, 1100, 10),
  transmission,
  shading,
  spec('evapotranspirationPct', '%', 0, 80, 1),
];

export const VENTILATION_FIELDS: readonly FieldSpec[] = [
  outside,
  spec('maxRiseK', 'K', 1, 10, 0.5),
  spec('windMs', 'm/s', 0, 10, 0.5),
  spec('ventOpeningM', 'm', 0.2, 3, 0.1),
  fan,
];

export const PAD_FAN_FIELDS: readonly FieldSpec[] = [
  outside,
  spec('outsideRhPct', '%', 5, 90, 1),
  spec('padEfficiencyPct', '%', 50, 95, 1),
  spec('riseK', 'K', 1, 10, 0.5),
  spec('padFaceVelocityMs', 'm/s', 0.5, 2.5, 0.05),
  spec('padHeightM', 'm', 0.5, 3, 0.1),
  spec('padToFanM', 'm', 10, 150, 1),
  fan,
  spec('hoursPerDay', 'h', 1, 24, 1),
];

export const DEMAND_FIELDS: readonly FieldSpec[] = [
  floor,
  spec('cropAreaPct', '%', 50, 100, 1),
  transmission,
  shading,
  spec('transpirationPct', '%', 30, 90, 1),
  spec('canopyPct', '%', 10, 100, 5),
  spec('drainPct', '%', 0, 60, 1),
];

export const IRRIGATION_FIELDS: readonly FieldSpec[] = [
  spec('plantsPerM2', '/m²', 0.5, 40, 0.1),
  spec('emittersPerPlant', '', 1, 4, 1),
  spec('emitterLh', 'L/h', 0.5, 8, 0.1),
  spec('shotMl', 'mL', 20, 500, 10),
  spec('pumpM3h', 'm³/h', 1, 200, 1),
];

export const RAIN_FIELDS: readonly FieldSpec[] = [
  spec('catchmentM2', 'm²', 0, 200000, 10),
  spec('runoffPct', '%', 50, 95, 1),
  spec('basinM3', 'm³', 0, 50000, 10),
];

export const LIGHT_FIELDS: readonly FieldSpec[] = [
  spec('targetDli', 'mol/m²·d', 5, 40, 1),
  spec('maxDli', 'mol/m²·d', 10, 50, 1),
  spec('lampHours', 'h', 2, 20, 1),
  spec('efficacyUmolJ', 'µmol/J', 1, 4, 0.1),
  spec('fixtureW', 'W', 50, 2000, 10),
  floor,
  transmission,
  spec('co2KgPerKwh', 'kg/kWh', 0, 1.2, 0.01),
];

export const CO2_FIELDS: readonly FieldSpec[] = [
  spec('targetPpm', 'ppm', 400, 1500, 10),
  spec('outsidePpm', 'ppm', 380, 500, 5),
  spec('airChangesPerHour', '/h', 0.2, 20, 0.1),
  spec('uptakeGm2h', 'g/m²·h', 0, 8, 0.5),
  spec('hoursPerDay', 'h', 1, 14, 1),
  spec('daysPerYear', 'd', 30, 365, 5),
  spec('burnerEfficiencyPct', '%', 50, 100, 1),
  floor,
  volume,
];

export const HUMIDITY_FIELDS: readonly FieldSpec[] = [
  spec('insideC', '°C', 5, 30, 0.5),
  spec('insideRhPct', '%', 50, 98, 1),
  spec('outsideC', '°C', -20, 30, 0.5),
  spec('outsideRhPct', '%', 20, 100, 1),
  spec('transpirationGm2h', 'g/m²·h', 0, 80, 1),
  spec('nightHours', 'h', 6, 16, 0.5),
  floor,
  volume,
  uValue,
];

export const FOG_FIELDS: readonly FieldSpec[] = [
  spec('outsideC', '°C', 20, 50, 0.5),
  spec('outsideRhPct', '%', 5, 95, 1),
  spec('ventPct', '%', 1, 40, 1),
  spec('ventOpeningM', 'm', 0.2, 3, 0.1),
  spec('windMs', 'm/s', 0, 10, 0.5),
  spec('nozzlesPer100M2', '/100 m²', 0, 80, 1),
  spec('nozzleLh', 'L/h', 1, 15, 0.1),
  spec('pressureBar', 'bar', 5, 120, 5),
  spec('onS', 's', 10, 300, 5),
  spec('maxRhPct', '%', 50, 95, 1),
  spec('hoursPerDay', 'h', 1, 16, 0.5),
];

export const VPD_FIELDS: readonly FieldSpec[] = [
  spec('airC', '°C', 5, 45, 0.5),
  spec('rhPct', '%', 5, 99, 1),
  spec('outsideC', '°C', -10, 50, 0.5),
  spec('outsideRhPct', '%', 5, 100, 1),
];

export const CALENDAR_FIELDS: readonly FieldSpec[] = [
  spec('plantingWeek', '', 1, 52, 1),
  spec('nurseryWeeks', '', 0, 12, 1),
  spec('vegetativeWeeks', '', 1, 12, 1),
  spec('floweringWeeks', '', 1, 16, 1),
  spec('cropWeeks', '', 8, 52, 1),
  spec('nightSetC', '°C', 0, 25, 0.5),
  spec('ventilateAboveC', '°C', 15, 35, 0.5),
  spec('coolAboveC', '°C', 20, 45, 0.5),
  spec('maxDli', 'mol/m²·d', 5, 60, 1),
  transmission,
];

/** A price field in the project's currency, per its unit. */
export function priceField(key: string, unit: string): FieldSpec {
  return spec(key, unit, 0, 50, 0.01);
}

/** Copies the listed keys of `from` into a new object. */
export function pick<T extends object, K extends keyof T>(
  from: T,
  keys: readonly K[],
): Pick<T, K> {
  const out = {} as Pick<T, K>;
  for (const key of keys) out[key] = from[key];
  return out;
}
