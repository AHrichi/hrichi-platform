import { describe, expect, it } from 'vitest';
import {
  addDays,
  calculateSpacedRepetitionDates,
  getWeekdayName,
  isDateOnOrBefore,
  parseYmd,
} from './dates';

describe('dates utilities', () => {
  it('parses and formats dates correctly without timezone shifting', () => {
    const parsed = parseYmd('2026-11-02');
    expect(parsed).toEqual({ year: 2026, month: 11, day: 2 });
  });

  it('adds days across months and leap boundaries cleanly', () => {
    expect(addDays('2026-11-02', 1)).toBe('2026-11-03');
    expect(addDays('2026-11-28', 5)).toBe('2026-12-03');
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
  });

  it('calculates D-3, D-7, and D-14 spaced repetition dates', () => {
    const dates = calculateSpacedRepetitionDates('2026-11-01');
    expect(dates.d3Date).toBe('2026-11-04');
    expect(dates.d7Date).toBe('2026-11-08');
    expect(dates.d14Date).toBe('2026-11-15');
  });

  it('determines weekdays correctly', () => {
    // 2026-11-02 is a Monday
    expect(getWeekdayName('2026-11-02')).toBe('Monday');
    expect(getWeekdayName('2026-11-03')).toBe('Tuesday');
    expect(getWeekdayName('2026-11-04')).toBe('Wednesday');
    expect(getWeekdayName('2026-11-05')).toBe('Thursday');
    expect(getWeekdayName('2026-11-06')).toBe('Friday');
    expect(getWeekdayName('2026-11-07')).toBe('Saturday');
    expect(getWeekdayName('2026-11-08')).toBe('Sunday');
  });

  it('checks isDateOnOrBefore accurately', () => {
    expect(isDateOnOrBefore('2026-11-01', '2026-11-02')).toBe(true);
    expect(isDateOnOrBefore('2026-11-02', '2026-11-02')).toBe(true);
    expect(isDateOnOrBefore('2026-11-03', '2026-11-02')).toBe(false);
  });
});
