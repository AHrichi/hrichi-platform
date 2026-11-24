import { describe, expect, it } from 'vitest';
import { clamp, snap, stepByKey, stepDigits } from './svg-drag';

describe('Drawing handles', () => {
  it('snaps to the step without float noise', () => {
    expect(snap(0.30000000000000004, 0.1)).toBe(0.3);
    expect(snap(4.26, 0.5)).toBe(4.5);
    expect(snap(63.4, 1)).toBe(63);
    expect(snap(1.237, 0.05)).toBe(1.25);
  });

  it('knows how many decimals a step shows', () => {
    expect(stepDigits(1)).toBe(0);
    expect(stepDigits(10)).toBe(0);
    expect(stepDigits(0.5)).toBe(1);
    expect(stepDigits(0.1)).toBe(1);
    expect(stepDigits(0.05)).toBe(2);
  });

  it('clamps to the range', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
    expect(clamp(12, 0, 10)).toBe(10);
    expect(clamp(4, 0, 10)).toBe(4);
  });

  it('steps with the arrow keys, ten at a time with Shift', () => {
    expect(stepByKey('ArrowUp', false, 6.3, 0.1, 1.5, 12)).toBe(6.4);
    expect(stepByKey('ArrowRight', false, 6.3, 0.1, 1.5, 12)).toBe(6.4);
    expect(stepByKey('ArrowDown', true, 6.3, 0.1, 1.5, 12)).toBe(5.3);
    expect(stepByKey('ArrowLeft', false, 1.5, 0.1, 1.5, 12)).toBe(1.5);
    expect(stepByKey('Enter', false, 6.3, 0.1, 1.5, 12)).toBeNull();
  });

  it('turns up and down round for a depth', () => {
    expect(stepByKey('ArrowDown', false, 2, 1, 0, 10, true)).toBe(3);
    expect(stepByKey('ArrowUp', false, 2, 1, 0, 10, true)).toBe(1);
  });
});
