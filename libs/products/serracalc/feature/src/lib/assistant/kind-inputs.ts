import {
  type CalcContext,
  type CalcKind,
  CLIMATES,
  COVER_IDS,
  CROP_IDS,
  defaultAnnualHeating,
  defaultCalendar,
  defaultCo2,
  defaultCoolingYear,
  defaultCropWater,
  defaultEconomics,
  defaultEnergyHub,
  defaultFertigation,
  defaultFog,
  defaultHeatLoss,
  defaultHeatReuse,
  defaultHotWater,
  defaultHumidity,
  defaultLight,
  defaultPadFan,
  defaultRainwater,
  defaultRo,
  defaultSolarPv,
  defaultVentilation,
  defaultVpd,
  FUEL_IDS,
  PIPE_IDS,
  SCREEN_IDS,
} from '@ah/products/serracalc/domain';
import type { FieldSpec } from '../ui/field-grid/field-grid';
import {
  CALENDAR_FIELDS,
  CO2_FIELDS,
  COOLING_YEAR_FIELDS,
  costField,
  DEMAND_FIELDS,
  ECONOMICS_FIELDS,
  ENERGY_FIELDS,
  ENVELOPE_FIELDS,
  FERTIGATION_FIELDS,
  FOG_FIELDS,
  fuelPriceField,
  HOT_WATER_FIELDS,
  HUMIDITY_FIELDS,
  IRRIGATION_FIELDS,
  LIGHT_FIELDS,
  moneyField,
  PAD_FAN_FIELDS,
  PEAK_FIELDS,
  priceField,
  PV_FIELDS,
  RAIN_FIELDS,
  REUSE_FIELDS,
  RO_FIELDS,
  SOLAR_FIELDS,
  VENTILATION_FIELDS,
  VPD_FIELDS,
  YEAR_FIELDS,
} from '../screens/fields';

/** A calculator's inputs: its defaults, and the fields its screen shows. */
interface KindInputs {
  readonly defaults: (ctx: CalcContext) => object;
  /** The fields, with prices in the project's currency. */
  readonly fields: (currency: string) => readonly FieldSpec[];
}

/** The same fields as each calculator's screen, so ranges agree. */
export const KIND_INPUTS: Readonly<Record<CalcKind, KindInputs>> = {
  heatPeak: {
    defaults: defaultHeatLoss,
    fields: () => [...ENVELOPE_FIELDS, ...PEAK_FIELDS],
  },
  heatYear: {
    defaults: defaultAnnualHeating,
    fields: (c) => [...ENVELOPE_FIELDS, ...YEAR_FIELDS, fuelPriceField(c)],
  },
  hotWater: { defaults: defaultHotWater, fields: () => HOT_WATER_FIELDS },
  ventilation: {
    defaults: defaultVentilation,
    fields: () => [...SOLAR_FIELDS, ...VENTILATION_FIELDS],
  },
  padFan: {
    defaults: defaultPadFan,
    fields: () => [...SOLAR_FIELDS, ...PAD_FAN_FIELDS],
  },
  fog: {
    defaults: defaultFog,
    fields: () => [...SOLAR_FIELDS, ...FOG_FIELDS],
  },
  cropWater: {
    defaults: defaultCropWater,
    fields: () => [...DEMAND_FIELDS, ...IRRIGATION_FIELDS],
  },
  // The Water screen saves rainwater with the crop water it starts from.
  rainwater: {
    defaults: defaultRainwater,
    fields: () => [...DEMAND_FIELDS, ...IRRIGATION_FIELDS, ...RAIN_FIELDS],
  },
  light: {
    defaults: defaultLight,
    fields: (c) => [
      ...LIGHT_FIELDS,
      priceField('electricityPrice', `${c}/kWh`),
    ],
  },
  co2: {
    defaults: defaultCo2,
    fields: (c) => [
      ...CO2_FIELDS,
      priceField('gasPrice', `${c}/m³`),
      priceField('co2Price', `${c}/kg`),
    ],
  },
  humidity: { defaults: defaultHumidity, fields: () => HUMIDITY_FIELDS },
  vpd: { defaults: defaultVpd, fields: () => VPD_FIELDS },
  calendar: { defaults: defaultCalendar, fields: () => CALENDAR_FIELDS },
  ro: {
    defaults: defaultRo,
    fields: (c) => [...RO_FIELDS, priceField('electricityPrice', `${c}/kWh`)],
  },
  fertigation: {
    defaults: defaultFertigation,
    fields: () => FERTIGATION_FIELDS,
  },
  energy: {
    defaults: defaultEnergyHub,
    fields: (c) => [
      ...ENERGY_FIELDS,
      priceField('gasPrice', `${c}/m³`),
      priceField('powerPrice', `${c}/kWh`),
    ],
  },
  heatReuse: { defaults: defaultHeatReuse, fields: () => REUSE_FIELDS },
  coolingYear: {
    defaults: defaultCoolingYear,
    fields: (c) => [
      ...COOLING_YEAR_FIELDS,
      priceField('electricityPrice', `${c}/kWh`),
    ],
  },
  solarPv: {
    defaults: defaultSolarPv,
    fields: (c) => [
      ...PV_FIELDS,
      costField('capexPerKwp', `${c}/kWp`),
      priceField('buyPrice', `${c}/kWh`),
      priceField('exportPrice', `${c}/kWh`),
    ],
  },
  economics: {
    defaults: defaultEconomics,
    fields: (c) => [
      ...ECONOMICS_FIELDS,
      moneyField('pricePerKg', `${c}/kg`, 100),
      moneyField('wagePerDay', `${c}/d`),
      moneyField('heatPricePerMwh', `${c}/MWh`),
    ],
  },
};

/** Choices a text input may take, by key (catalogue ids). */
const CHOICES: Readonly<Record<string, readonly string[]>> = {
  fuel: FUEL_IDS,
  pipe: PIPE_IDS,
  cover: COVER_IDS,
  screen: SCREEN_IDS,
  crop: CROP_IDS,
  climateId: CLIMATES.map((climate) => climate.id),
  shape: ['gable', 'venlo', 'tunnel'],
};

/** One input, as the assistant reads it (get_calculator). */
export interface InputField {
  readonly key: string;
  readonly value: number | string | boolean;
  readonly unit?: string;
  readonly min?: number;
  readonly max?: number;
  readonly choices?: readonly string[];
}

/**
 * The inputs the assistant may change: numbers that have a field on the
 * screen (with its unit and range), switches, and catalogue choices.
 * Nested settings (monthly tables, lists) stay with the screen.
 */
export function describeInputs(
  kind: CalcKind,
  inputs: object,
  currency: string,
): InputField[] {
  const specs = new Map(
    KIND_INPUTS[kind].fields(currency).map((spec) => [spec.key, spec]),
  );
  const fields: InputField[] = [];
  for (const [key, value] of Object.entries(inputs)) {
    const spec = specs.get(key);
    if (typeof value === 'number' && spec) {
      fields.push({
        key,
        value,
        unit: spec.unit,
        min: spec.min,
        max: spec.max,
      });
    } else if (typeof value === 'boolean') {
      fields.push({ key, value });
    } else if (typeof value === 'string' && CHOICES[key]) {
      fields.push({ key, value, choices: CHOICES[key] });
    }
  }
  return fields;
}

export type MergedInputs =
  | { readonly ok: true; readonly inputs: Record<string, unknown> }
  | { readonly ok: false; readonly problem: string };

/**
 * Applies `{key, value}` pairs to a calculator's inputs. Numbers must be
 * within their field's range (never clamped: a value out of range is the
 * model's mistake to correct), switches are true or false, choices come
 * from the catalogue. Anything else is refused.
 */
export function mergeInputs(
  kind: CalcKind,
  base: object,
  pairs: readonly { key: string; value: string }[],
  currency: string,
): MergedInputs {
  const editable = new Map(
    describeInputs(kind, base, currency).map((field) => [field.key, field]),
  );
  const inputs: Record<string, unknown> = { ...base };
  for (const { key, value } of pairs) {
    const field = editable.get(key);
    if (!field) {
      return {
        ok: false,
        problem: `${key} can't be set here: open the screen to change it`,
      };
    }
    if (typeof field.value === 'number') {
      const number = Number(value.trim().replace(',', '.'));
      if (!Number.isFinite(number)) {
        return { ok: false, problem: `${key}: "${value}" isn't a number` };
      }
      if (
        number < (field.min ?? -Infinity) ||
        number > (field.max ?? Infinity)
      ) {
        return {
          ok: false,
          problem:
            `${key}: ${number} is outside ${field.min}–${field.max} ${field.unit ?? ''}`.trim(),
        };
      }
      inputs[key] = number;
    } else if (typeof field.value === 'boolean') {
      const truth = value.trim().toLowerCase();
      if (!['true', 'false', 'yes', 'no', '1', '0'].includes(truth)) {
        return { ok: false, problem: `${key}: "${value}" isn't true or false` };
      }
      inputs[key] = ['true', 'yes', '1'].includes(truth);
    } else {
      if (!field.choices?.includes(value)) {
        return {
          ok: false,
          problem: `${key}: "${value}" isn't one of ${field.choices?.join(', ')}`,
        };
      }
      inputs[key] = value;
    }
  }
  return { ok: true, inputs };
}
