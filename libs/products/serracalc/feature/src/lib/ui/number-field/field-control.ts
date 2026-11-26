/**
 * How a number field is set besides typing, so each kind of value gets a
 * control that suits it (all from `@ah/ui`):
 *
 * - `dial`: a half-moon gauge, for a share (a percentage up to 100);
 * - `thermometer`: a temperature in °C, coloured from cold to hot;
 * - `ruler`: a tape to swipe, for a measured value on a bounded scale;
 * - `stepper`: − and +, for a count, or for a range far too wide to swipe
 *   (an area, a price), where it jumps between round numbers;
 * - `chips`: a handful of whole values, one tap each;
 * - `hours`, `weeks`: a clock face for an hour of the day or a week of the
 *   year, which wrap round.
 */
export type FieldControl =
  'dial' | 'thermometer' | 'ruler' | 'stepper' | 'chips' | 'hours' | 'weeks';

/** Past this many steps a tape is too long to swipe. */
export const LONGEST_SCALE = 600;
/** Whole values up to this many steps apart are counted with − and +. */
const COUNT_STEPS = 60;
/** Up to this many choices show as chips. */
const MOST_CHIPS = 5;

/** The control a field gets, unless its spec names one. */
export function controlFor(spec: {
  readonly unit: string;
  readonly min: number;
  readonly max: number;
  readonly step: number;
  readonly control?: FieldControl;
}): FieldControl {
  if (spec.control) return spec.control;
  const steps = Math.round((spec.max - spec.min) / spec.step);
  const whole = Number.isInteger(spec.step) && Number.isInteger(spec.min);
  if (spec.unit === '%' && spec.min >= 0 && spec.max <= 100) return 'dial';
  if (spec.unit === '°C') return 'thermometer';
  if (whole && steps < MOST_CHIPS) return 'chips';
  if (whole && steps <= COUNT_STEPS) return 'stepper';
  if (steps > LONGEST_SCALE) return 'stepper';
  return 'ruler';
}
