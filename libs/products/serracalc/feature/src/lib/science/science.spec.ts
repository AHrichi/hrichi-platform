import { describe, expect, it } from 'vitest';
import {
  INPUT_METHODS,
  INSTRUMENTS,
  PHENOMENA,
  phenomenaFor,
} from '@ah/products/serracalc/domain';
import { EN } from '../i18n/copy.en';
import * as FIELDS from '../screens/fields';
import { fieldInfo } from './field-info';

/** Every field key the calculators show, from their specs. */
function allFieldKeys(): string[] {
  const keys = new Set<string>(['electricityPrice', 'gasPrice', 'co2Price']);
  for (const value of Object.values(FIELDS)) {
    if (Array.isArray(value)) {
      for (const spec of value) keys.add(spec.key);
    }
  }
  keys.add(FIELDS.fuelPriceField('').key);
  return [...keys];
}

describe('the Science links', () => {
  it('says how to get every number a calculator asks for', () => {
    const missing = allFieldKeys().filter((key) => !INPUT_METHODS[key]);
    expect(missing).toEqual([]);
  });

  it('names a phenomenon and copy for every field’s advice', () => {
    for (const key of allFieldKeys()) {
      const info = fieldInfo(EN, key, key, 'heatLoss');
      expect(info?.topic, key).not.toBeNull();
      expect(info?.method.length, key).toBeGreaterThan(0);
    }
  });

  it('links each phenomenon to real fields, topics and instruments', () => {
    const ids = new Set(PHENOMENA.map((p) => p.id));
    for (const p of PHENOMENA) {
      for (const key of p.inputs) {
        expect(INPUT_METHODS[key], `${p.id} → ${key}`).toBeDefined();
      }
      for (const id of p.related)
        expect(ids.has(id), `${p.id} → ${id}`).toBe(true);
      expect(EN.science.topics[p.id].title.length).toBeGreaterThan(0);
    }
    for (const method of Object.values(INPUT_METHODS)) {
      if (method.instrument) {
        expect(INSTRUMENTS).toContain(method.instrument);
      }
    }
  });

  it('finds the phenomena behind a screen and its tab', () => {
    expect(phenomenaFor('cooling', 'fog')).toEqual(['fogging']);
    expect(phenomenaFor('heating', 'peak')).toEqual(['heatLoss', 'airLeakage']);
    expect(phenomenaFor('calendar')).toEqual(['cropCalendar']);
  });
});
