import { describe, expect, it } from 'vitest';
import { ticks } from './month-ticks';

describe('month-bars axis', () => {
  it('reaches at least the tallest bar', () => {
    // 14.4 in steps of 5: the axis must go to 15, not stop at 10.
    expect(ticks(0, 14.4)).toEqual([0, 5, 10, 15]);
    expect(ticks(0, 1.9).at(-1)).toBeGreaterThanOrEqual(1.9);
  });

  it('stops on a round top that equals the tallest bar', () => {
    expect(ticks(0, 10)).toEqual([0, 2.5, 5, 7.5, 10]);
  });

  it('starts below zero when bars float from a negative low', () => {
    const t = ticks(-5, 30);
    expect(t[0]).toBeLessThanOrEqual(-5);
    expect(t.at(-1)).toBeGreaterThanOrEqual(30);
  });
});
