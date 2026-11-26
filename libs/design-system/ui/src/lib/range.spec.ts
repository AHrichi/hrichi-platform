import { describe, expect, it } from 'vitest';
import {
  clockFraction,
  decimalsOf,
  gaugeFraction,
  nextRound,
  snapTo,
  valueForKey,
} from './range';

const PERCENT = { min: 0, max: 100, step: 1 };

describe('range helpers', () => {
  it('counts the decimals a step is written with', () => {
    expect([1, 0.5, 0.25, 0.001, 1e-7, 10].map(decimalsOf)).toEqual([
      0, 1, 2, 3, 7, 0,
    ]);
  });

  it('snaps to the step from min, inside the range, without float dust', () => {
    expect(snapTo(0.30000000000000004, { min: 0, max: 1, step: 0.1 })).toBe(
      0.3,
    );
    expect(snapTo(6.34, { min: 1.5, max: 12, step: 0.1 })).toBe(6.3);
    expect(snapTo(13, { min: 1.5, max: 12, step: 0.1 })).toBe(12);
    expect(snapTo(-4, PERCENT)).toBe(0);
    // Counted from min: 5, 10, 15… from 5 in steps of 5.
    expect(snapTo(12, { min: 5, max: 50, step: 5 })).toBe(10);
  });

  it('nudges to the next round number, a tenth of the order of magnitude', () => {
    expect(nextRound(12345, 1, 10)).toBe(13000);
    expect(nextRound(12345, -1, 10)).toBe(12000);
    expect(nextRound(13000, 1, 10)).toBe(14000);
    expect(nextRound(0.37, 1, 0.01)).toBe(0.38);
    expect(nextRound(0, 1, 0.01)).toBe(0.01);
    expect(nextRound(950, -1, 1)).toBe(940);
  });

  it('follows the slider keyboard contract', () => {
    const keys = ['ArrowUp', 'ArrowRight', 'ArrowDown', 'ArrowLeft'];
    expect(keys.map((key) => valueForKey(key, 50, PERCENT))).toEqual([
      51, 51, 49, 49,
    ]);
    expect(valueForKey('PageUp', 50, PERCENT)).toBe(60);
    expect(valueForKey('PageDown', 50, PERCENT, { page: 25 })).toBe(25);
    expect(valueForKey('Home', 50, PERCENT)).toBe(0);
    expect(valueForKey('End', 50, PERCENT)).toBe(100);
    expect(valueForKey('Tab', 50, PERCENT)).toBeNull();
  });

  it('swaps Left and Right for a mirrored control', () => {
    expect(valueForKey('ArrowLeft', 50, PERCENT, { mirrored: true })).toBe(51);
    expect(valueForKey('ArrowRight', 50, PERCENT, { mirrored: true })).toBe(49);
    expect(valueForKey('ArrowUp', 50, PERCENT, { mirrored: true })).toBe(51);
  });

  it('reads a half-moon gauge from the left end over the top to the right', () => {
    expect(gaugeFraction(-10, 0)).toBeCloseTo(0);
    expect(gaugeFraction(0, 10)).toBeCloseTo(0.5);
    expect(gaugeFraction(10, 0)).toBeCloseTo(1);
    // Below the centre line: the nearest end.
    expect(gaugeFraction(-3, -5)).toBe(0);
    expect(gaugeFraction(3, -5)).toBe(1);
  });

  it('reads a clock face clockwise from the top', () => {
    expect(clockFraction(0, 10)).toBeCloseTo(0);
    expect(clockFraction(10, 0)).toBeCloseTo(0.25);
    expect(clockFraction(0, -10)).toBeCloseTo(0.5);
    expect(clockFraction(-10, 0)).toBeCloseTo(0.75);
  });
});
