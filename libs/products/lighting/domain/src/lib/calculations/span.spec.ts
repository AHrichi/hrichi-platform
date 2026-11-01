import type { SpanCalculationParams } from '../models/lighting.models';
import { calculateSpan, changeOfState, CONDUCTORS } from './span';

const base: SpanCalculationParams = {
  spanMeters: 35,
  conductor: 'abc_4x16',
  everydayTensionPct: 12,
  windZone: 2,
  poleRole: 'intermediate',
  deviationDegrees: 0,
  poleHeightMeters: 8,
  attachmentHeightMeters: 7.5,
  poleNominalLoadDaN: 250,
  requiredClearanceMeters: 6,
};

describe('Overhead span (sag and tension)', () => {
  it('keeps the tension when nothing changes', () => {
    expect(changeOfState(1200, 3, 3, 40, 3.8e6, 0)).toBeCloseTo(1200, 3);
  });

  it('slackens when hot and tightens when cold or loaded', () => {
    const h0 = 1200;
    expect(changeOfState(h0, 3, 3, 40, 3.8e6, 35)).toBeLessThan(h0);
    expect(changeOfState(h0, 3, 3, 40, 3.8e6, -20)).toBeGreaterThan(h0);
    expect(changeOfState(h0, 3, 5, 40, 3.8e6, 0)).toBeGreaterThan(h0);
  });

  it('gives the parabolic sag at the everyday tension', () => {
    const r = calculateSpan(base);
    const w = CONDUCTORS.abc_4x16.massKgPerM * 9.81;
    const h = 0.12 * CONDUCTORS.abc_4x16.breakingLoadDaN * 10;
    expect(r.sagEverydayMeters).toBeCloseTo((w * 35 * 35) / (8 * h), 2);
    expect(r.sagHotMeters).toBeGreaterThan(r.sagEverydayMeters);
  });

  it('passes a usual street span and finds a longer limit', () => {
    const r = calculateSpan(base);
    expect(r.isCompliant).toBe(true);
    expect(r.maxSpanMeters).toBeGreaterThan(35);
    expect(r.limitingFactor).not.toBeNull();
    expect(r.notes.some((n) => n.code === 'span.ok')).toBe(true);
  });

  it('loads a terminal pole far more than an intermediate one', () => {
    const line = calculateSpan(base);
    const end = calculateSpan({ ...base, poleRole: 'terminal' });
    const angle = calculateSpan({
      ...base,
      poleRole: 'angle',
      deviationDegrees: 30,
    });
    expect(end.poleLoadDaN).toBeGreaterThan(angle.poleLoadDaN);
    expect(angle.poleLoadDaN).toBeGreaterThan(line.poleLoadDaN);
  });

  it('fails a terminal pole too weak for the wire', () => {
    const r = calculateSpan({
      ...base,
      conductor: 'abc_3x70_54',
      everydayTensionPct: 15,
      poleRole: 'terminal',
      poleNominalLoadDaN: 100,
    });
    expect(r.meetsPole).toBe(false);
    expect(r.notes.some((n) => n.code === 'span.poleOver')).toBe(true);
  });

  it('fails the ground clearance on a long, slack span', () => {
    const r = calculateSpan({
      ...base,
      spanMeters: 80,
      everydayTensionPct: 6,
      attachmentHeightMeters: 6.5,
    });
    expect(r.meetsClearance).toBe(false);
    expect(r.clearanceMeters).toBeLessThan(6);
  });
});
