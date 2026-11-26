import { CALC_KINDS, DEFAULT_CONTEXT } from '@ah/products/serracalc/domain';
import { describe, expect, it } from 'vitest';
import { describeInputs, KIND_INPUTS, mergeInputs } from './kind-inputs';

describe('the inputs the assistant may change', () => {
  it('match each calculator’s inputs: every field is a number there', () => {
    for (const kind of CALC_KINDS) {
      const defaults = KIND_INPUTS[kind].defaults(DEFAULT_CONTEXT) as Record<
        string,
        unknown
      >;
      for (const spec of KIND_INPUTS[kind].fields('TND')) {
        expect(typeof defaults[spec.key], `${kind}.${spec.key}`).toBe('number');
      }
    }
  });

  it('leave few numbers out: most of what the screen shows can be set', () => {
    for (const kind of CALC_KINDS) {
      const defaults = KIND_INPUTS[kind].defaults(DEFAULT_CONTEXT);
      const numbers = Object.values(defaults).filter(
        (v) => typeof v === 'number',
      );
      const settable = describeInputs(kind, defaults, 'TND').filter(
        (field) => typeof field.value === 'number',
      );
      expect(settable.length, kind).toBeGreaterThanOrEqual(
        Math.ceil(numbers.length * 0.6),
      );
    }
  });

  it('describes a field with its unit and range', () => {
    const fields = describeInputs(
      'heatPeak',
      KIND_INPUTS.heatPeak.defaults(DEFAULT_CONTEXT),
      'TND',
    );
    expect(fields.find((f) => f.key === 'insideC')).toMatchObject({
      unit: '°C',
      min: 0,
      max: 30,
    });
  });

  it('sets numbers in range, refuses the rest, and never clamps', () => {
    const base = KIND_INPUTS.heatPeak.defaults(DEFAULT_CONTEXT);
    const set = mergeInputs(
      'heatPeak',
      base,
      [{ key: 'insideC', value: '17,5' }],
      'TND',
    );
    expect(set).toMatchObject({ ok: true, inputs: { insideC: 17.5 } });
    expect(
      mergeInputs('heatPeak', base, [{ key: 'insideC', value: '45' }], 'TND'),
    ).toEqual({ ok: false, problem: 'insideC: 45 is outside 0–30 °C' });
    expect(
      mergeInputs('heatPeak', base, [{ key: 'insideC', value: 'warm' }], 'TND'),
    ).toMatchObject({ ok: false });
    expect(
      mergeInputs('heatPeak', base, [{ key: 'madeUp', value: '1' }], 'TND'),
    ).toMatchObject({
      ok: false,
      problem: expect.stringContaining('open the screen'),
    });
  });

  it('takes catalogue choices by id only', () => {
    const base = KIND_INPUTS.heatYear.defaults(DEFAULT_CONTEXT) as Record<
      string,
      unknown
    >;
    expect(typeof base['fuel']).toBe('string');
    expect(
      mergeInputs(
        'heatYear',
        base,
        [{ key: 'fuel', value: 'diesel_on_fire' }],
        'TND',
      ),
    ).toMatchObject({ ok: false });
  });
});
