import { describe, expect, it } from 'vitest';
import * as FIELDS from '../../screens/fields';
import type { FieldSpec } from '../field-grid/field-grid';
import { controlFor } from './field-control';

const field = (unit: string, min: number, max: number, step: number) => ({
  unit,
  min,
  max,
  step,
});

describe('controlFor', () => {
  it('gives each kind of value a control that suits it', () => {
    expect(controlFor(field('%', 50, 95, 1))).toBe('dial');
    expect(controlFor(field('°C', -25, 20, 0.5))).toBe('thermometer');
    expect(controlFor(field('', 1, 4, 1))).toBe('chips');
    expect(controlFor(field('', 1, 60, 1))).toBe('stepper');
    expect(controlFor(field('m', 1.5, 12, 0.1))).toBe('ruler');
    // Too wide to swipe: an area, a price.
    expect(controlFor(field('m²', 10, 200000, 10))).toBe('stepper');
    expect(controlFor(field('TND/kWh', 0, 50, 0.01))).toBe('stepper');
    // A percentage over 100 (a heat pump's COP) is no share: a tape.
    expect(controlFor(field('%', 50, 600, 5))).toBe('ruler');
  });

  it('lets a spec choose, for hours of the day and weeks of the year', () => {
    expect(controlFor({ ...field('h', 0, 23, 1), control: 'hours' })).toBe(
      'hours',
    );
  });

  it('uses every kind of control somewhere in SerraCalc', () => {
    const specs = Object.values(FIELDS).filter(Array.isArray) as FieldSpec[][];
    const used = new Set(specs.flat().map(controlFor));
    expect([...used].sort()).toEqual([
      'chips',
      'dial',
      'hours',
      'ruler',
      'stepper',
      'thermometer',
      'weeks',
    ]);
  });
});
