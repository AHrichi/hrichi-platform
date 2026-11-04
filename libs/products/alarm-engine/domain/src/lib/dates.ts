/**
 * Robust date utilities for YYYY-MM-DD date strings without UTC/local time shift bugs.
 */

export function parseYmd(dateStr: string): {
  year: number;
  month: number;
  day: number;
} {
  const parts = dateStr.split('-').map((p) => parseInt(p, 10));
  if (parts.length !== 3 || parts.some(isNaN)) {
    const today = new Date();
    return {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    };
  }
  return { year: parts[0], month: parts[1], day: parts[2] };
}

export function formatYmd(year: number, month: number, day: number): string {
  const y = String(year).padStart(4, '0');
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function todayYmd(): string {
  const now = new Date();
  return formatYmd(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

export function addDays(dateStr: string, days: number): string {
  const { year, month, day } = parseYmd(dateStr);
  // Using UTC date to avoid DST leaps
  const utcDate = new Date(Date.UTC(year, month - 1, day));
  utcDate.setUTCDate(utcDate.getUTCDate() + days);
  return formatYmd(
    utcDate.getUTCFullYear(),
    utcDate.getUTCMonth() + 1,
    utcDate.getUTCDate(),
  );
}

export function getWeekdayName(
  dateStr: string,
):
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday'
  | 'Sunday' {
  const { year, month, day } = parseYmd(dateStr);
  const date = new Date(year, month - 1, day);
  const days = [
    'Sunday',
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
  ] as const;
  return days[date.getDay()];
}

export function calculateSpacedRepetitionDates(studyDate: string): {
  d3Date: string;
  d7Date: string;
  d14Date: string;
} {
  return {
    d3Date: addDays(studyDate, 3),
    d7Date: addDays(studyDate, 7),
    d14Date: addDays(studyDate, 14),
  };
}

/**
 * Returns true if candidateDate is <= asOfDate.
 */
export function isDateOnOrBefore(
  candidateDate: string,
  asOfDate: string,
): boolean {
  return candidateDate.localeCompare(asOfDate) <= 0;
}

export function formatNiceDate(dateStr: string): string {
  const { year, month, day } = parseYmd(dateStr);
  const date = new Date(year, month - 1, day);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}
