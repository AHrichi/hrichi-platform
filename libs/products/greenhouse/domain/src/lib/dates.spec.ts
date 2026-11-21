import {
  addDays,
  dateOfWeekday,
  daysBetween,
  isIsoDate,
  isWeekStart,
  startOfWeek,
  todayOnFarm,
  weekDates,
  weekdayOf,
} from './dates';

describe('dates', () => {
  it('accepts only real calendar days', () => {
    expect(isIsoDate('2026-11-23')).toBe(true);
    expect(isIsoDate('2028-02-29')).toBe(true);
    expect(isIsoDate('2026-02-29')).toBe(false);
    expect(isIsoDate('2026-11-23T10:00')).toBe(false);
    expect(isIsoDate(20261123)).toBe(false);
  });

  it('adds days across months and years', () => {
    expect(addDays('2026-12-30', 3)).toBe('2027-01-02');
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28');
    expect(daysBetween('2026-11-23', '2026-11-30')).toBe(7);
  });

  it('numbers weekdays from Monday', () => {
    expect(weekdayOf('2026-11-23')).toBe(1);
    expect(weekdayOf('2026-11-29')).toBe(7);
    expect(startOfWeek('2026-11-29')).toBe('2026-11-23');
    expect(startOfWeek('2026-11-23')).toBe('2026-11-23');
    expect(isWeekStart('2026-11-24')).toBe(false);
  });

  it('lists a week and finds its days', () => {
    expect(weekDates('2026-11-23')).toEqual([
      '2026-11-23',
      '2026-11-24',
      '2026-11-25',
      '2026-11-26',
      '2026-11-27',
      '2026-11-28',
      '2026-11-29',
    ]);
    expect(dateOfWeekday('2026-11-23', 5)).toBe('2026-11-27');
    expect(() => weekDates('2026-11-24')).toThrow(RangeError);
  });

  it('reads today on the farm clock, not the device clock', () => {
    // 23:30 UTC is already the next day in Tunis (UTC+1).
    expect(todayOnFarm(new Date('2026-11-22T23:30:00Z'))).toBe('2026-11-23');
    expect(todayOnFarm(new Date('2026-11-22T22:30:00Z'))).toBe('2026-11-22');
  });

  it('throws on a malformed date instead of guessing', () => {
    expect(() => addDays('23/11/2026', 1)).toThrow(RangeError);
  });
});
