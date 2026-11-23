import { parseNumber, stepValue } from './numbers';

describe('parseNumber', () => {
  it('reads Latin and Arabic-Indic digits, with a point or a comma', () => {
    expect(parseNumber('12')).toBe(12);
    expect(parseNumber(' 7,5 ')).toBe(7.5);
    expect(parseNumber('٧٫٥')).toBe(7.5);
    expect(parseNumber('١٢٠')).toBe(120);
    expect(parseNumber('۳۴')).toBe(34);
    expect(parseNumber('8.')).toBe(8);
    expect(parseNumber('.5')).toBe(0.5);
  });

  it('tells empty from not-a-number', () => {
    expect(parseNumber('')).toBeNull();
    expect(parseNumber('   ')).toBeNull();
    expect(parseNumber('12kg')).toBeNaN();
    expect(parseNumber('1.2.3')).toBeNaN();
  });
});

describe('stepValue', () => {
  const bounds = { min: 0, max: 12 };

  it('steps from empty as if from zero, within bounds', () => {
    expect(stepValue(null, 1, bounds)).toBe(1);
    expect(stepValue(0, -1, bounds)).toBe(0);
    expect(stepValue(11.5, 1, bounds)).toBe(12);
    expect(stepValue(Number.NaN, 0.5, bounds)).toBe(0.5);
  });

  it('keeps half hours exact', () => {
    expect(stepValue(7.5, 0.5, bounds)).toBe(8);
    expect(stepValue(0.1, 0.2, bounds)).toBe(0.3);
  });
});
