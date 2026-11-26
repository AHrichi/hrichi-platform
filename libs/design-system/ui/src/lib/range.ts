/**
 * Number helpers shared by the range controls (stepper, dial, thermometer,
 * ruler): snapping to the step, decimals, the keyboard contract, the
 * geometry of the round faces and a buzz under the finger.
 */

import { numberAttribute } from '@angular/core';

/**
 * For `min` and `max` inputs. Signal Forms binds them as well, and may bind
 * undefined, which keeps the default; a string attribute is parsed.
 */
export function bound(fallback: number): (value: unknown) => number {
  return (value) => numberAttribute(value, fallback);
}

/** A value's limits and grid. */
export interface RangeSpec {
  readonly min: number;
  readonly max: number;
  readonly step: number;
}

/** Decimals a number is written with: 1 → 0, 0.5 → 1, 0.25 → 2, 1e-3 → 3. */
export function decimalsOf(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const [digits, exponent] = String(Math.abs(value)).split('e');
  const point = digits.indexOf('.');
  const fraction = point < 0 ? 0 : digits.length - point - 1;
  return Math.max(0, fraction - Number(exponent ?? 0));
}

/**
 * The value clamped to min..max and moved to the nearest step counted from
 * min, rounded so 0.1 steps never show 0.30000000000000004.
 */
export function snapTo(value: number, { min, max, step }: RangeSpec): number {
  const clamped = Math.min(max, Math.max(min, value));
  const snapped =
    step > 0 ? min + Math.round((clamped - min) / step) * step : clamped;
  const digits = Math.max(decimalsOf(step), decimalsOf(min));
  return Number(Math.min(max, snapped).toFixed(digits));
}

/**
 * The next round number up or down, for ranges too wide for single steps:
 * 12 345 goes up to 13 000 and down to 12 000, 0.37 to 0.38 and 0.36. The
 * nudge is a tenth of the value's order of magnitude, at least one step.
 */
export function nextRound(
  value: number,
  direction: 1 | -1,
  step: number,
): number {
  const magnitude = Math.max(Math.abs(value), step * 10);
  const size = Math.max(
    step,
    10 ** (Math.floor(Math.log10(magnitude) + 1e-9) - 1),
  );
  const units = value / size;
  const next =
    direction > 0 ? Math.floor(units + 1e-9) + 1 : Math.ceil(units - 1e-9) - 1;
  return Number(
    (next * size).toFixed(Math.max(decimalsOf(size), decimalsOf(step))),
  );
}

/**
 * The slider keyboard contract (WAI-ARIA slider pattern): Up and Right add a
 * step, Down and Left take one off, Page Up and Page Down move `page` (a
 * tenth of the range by default, at least a step), Home and End go to the
 * ends. `mirrored` swaps Left and Right, for a horizontal control laid out
 * right to left. Returns the new value, unsnapped, or null for other keys.
 */
export function valueForKey(
  key: string,
  value: number,
  { min, max, step }: RangeSpec,
  { mirrored = false, page }: { mirrored?: boolean; page?: number } = {},
): number | null {
  const big =
    page ?? Math.max(step, Math.round((max - min) / 10 / step) * step);
  const forward = mirrored ? 'ArrowLeft' : 'ArrowRight';
  const back = mirrored ? 'ArrowRight' : 'ArrowLeft';
  switch (key) {
    case 'ArrowUp':
    case forward:
      return value + step;
    case 'ArrowDown':
    case back:
      return value - step;
    case 'PageUp':
      return value + big;
    case 'PageDown':
      return value - big;
    case 'Home':
      return min;
    case 'End':
      return max;
    default:
      return null;
  }
}

/**
 * Where a point sits on a half-moon gauge, from its offset to the centre
 * (y grows upwards): 0 at the left end, 1 at the right, the nearest end for
 * points below the centre line.
 */
export function gaugeFraction(dx: number, dy: number): number {
  const angle = Math.atan2(dy, dx);
  if (angle < 0) return dx < 0 ? 0 : 1;
  return 1 - angle / Math.PI;
}

/**
 * Where a point sits around a clock face, from its offset to the centre
 * (y grows upwards): 0 at the top, growing clockwise, just under 1 before
 * the top again.
 */
export function clockFraction(dx: number, dy: number): number {
  const turn = Math.atan2(dx, dy) / (2 * Math.PI);
  return turn < 0 ? turn + 1 : turn;
}

/**
 * A short buzz under the finger, where the device has one: an end reached,
 * a mark passed. Mouse and pen stay silent, and so does reduced motion.
 */
export function buzz(event: PointerEvent, reduced: boolean, ms = 6): void {
  if (event.pointerType === 'touch' && !reduced) {
    navigator.vibrate?.(ms);
  }
}

/**
 * Keeps a drag's moves coming to the element, even off it. Harmless when the
 * pointer is already gone (the browser throws then).
 */
export function capture(element: Element, pointerId: number): void {
  try {
    element.setPointerCapture?.(pointerId);
  } catch {
    // Released already: this press simply won't drag.
  }
}
