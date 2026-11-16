import type {
  CycleConfidence,
  CyclePeriodEntry,
  CyclePhase,
  CyclePrediction,
} from '../models/wellbeing.models';
import { daysBetween, isoDayToMs, msToIsoDay } from './wellbeing';

/**
 * Cycle predictions from dates the partner entered herself (or agreed to share).
 * Nothing here reads chat content: mood is only overlaid on these phases for display.
 */
export const CYCLE_DEFAULTS = {
  cycleDays: 28,
  periodDays: 5,
  premenstrualDays: 5,
  /** Gaps outside this range are treated as a missed entry, not a real cycle. */
  minCycleDays: 15,
  maxCycleDays: 60,
} as const;

const DAY_MS = 86_400_000;

function addDays(iso: string, days: number): string {
  return msToIsoDay(isoDayToMs(iso) + days * DAY_MS);
}

function isIsoDay(value: string | undefined): value is string {
  return (
    !!value &&
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(isoDayToMs(value))
  );
}

/** Valid entries, unique by start, oldest first. */
export function normalizeCyclePeriods(
  periods: readonly CyclePeriodEntry[],
): CyclePeriodEntry[] {
  const byStart = new Map<string, CyclePeriodEntry>();
  for (const p of periods) {
    if (!isIsoDay(p.start)) continue;
    const end = isIsoDay(p.end) && p.end >= p.start ? p.end : undefined;
    byStart.set(p.start, end ? { start: p.start, end } : { start: p.start });
  }
  return Array.from(byStart.values()).sort((a, b) =>
    a.start.localeCompare(b.start),
  );
}

function stdDev(values: readonly number[]): number {
  if (values.length < 2) return 0;
  const m = values.reduce((a, b) => a + b, 0) / values.length;
  return Math.sqrt(
    values.reduce((s, v) => s + (v - m) ** 2, 0) / (values.length - 1),
  );
}

export function predictCycle(
  periods: readonly CyclePeriodEntry[],
  todayIso: string = msToIsoDay(Date.now()),
): CyclePrediction {
  const entries = normalizeCyclePeriods(periods);
  const gaps: number[] = [];
  for (let i = 1; i < entries.length; i++) {
    const gap = daysBetween(entries[i - 1].start, entries[i].start);
    if (
      gap >= CYCLE_DEFAULTS.minCycleDays &&
      gap <= CYCLE_DEFAULTS.maxCycleDays
    ) {
      gaps.push(gap);
    }
  }
  const lengths = entries
    .filter((e) => e.end)
    .map((e) => daysBetween(e.start, e.end as string) + 1)
    .filter((n) => n >= 1 && n <= 14);

  const averageCycleDays = gaps.length
    ? Math.round(gaps.reduce((a, b) => a + b, 0) / gaps.length)
    : CYCLE_DEFAULTS.cycleDays;
  const averagePeriodDays = lengths.length
    ? Math.round(lengths.reduce((a, b) => a + b, 0) / lengths.length)
    : CYCLE_DEFAULTS.periodDays;
  const variabilityDays = Math.round(stdDev(gaps) * 10) / 10;

  let confidence: CycleConfidence = 'none';
  if (entries.length > 0) confidence = 'low';
  if (gaps.length >= 2 && variabilityDays <= 7) confidence = 'medium';
  if (gaps.length >= 3 && variabilityDays <= 3) confidence = 'high';

  if (entries.length === 0) {
    return {
      averageCycleDays,
      averagePeriodDays,
      basedOnCycles: 0,
      variabilityDays,
      confidence,
      nextStart: null,
      nextEnd: null,
      premenstrualStart: null,
    };
  }

  const last = entries[entries.length - 1];
  let nextStart = addDays(last.start, averageCycleDays);
  // Roll forward past today so the card always shows an upcoming window.
  while (
    nextStart < todayIso &&
    daysBetween(nextStart, todayIso) >= averagePeriodDays
  ) {
    nextStart = addDays(nextStart, averageCycleDays);
  }

  return {
    averageCycleDays,
    averagePeriodDays,
    basedOnCycles: gaps.length,
    variabilityDays,
    confidence,
    nextStart,
    nextEnd: addDays(nextStart, averagePeriodDays - 1),
    premenstrualStart: addDays(nextStart, -CYCLE_DEFAULTS.premenstrualDays),
  };
}

/** Phase of a calendar day, from recorded entries first, then the prediction. */
export function cyclePhaseForDate(
  dateIso: string,
  periods: readonly CyclePeriodEntry[],
  prediction: CyclePrediction,
): CyclePhase {
  const entries = normalizeCyclePeriods(periods);
  for (const e of entries) {
    const end = e.end ?? addDays(e.start, prediction.averagePeriodDays - 1);
    if (dateIso >= e.start && dateIso <= end) return 'period';
  }
  for (const e of entries) {
    const before = daysBetween(dateIso, e.start);
    if (before > 0 && before <= CYCLE_DEFAULTS.premenstrualDays) {
      return 'premenstrual';
    }
  }
  if (
    prediction.nextStart &&
    prediction.nextEnd &&
    prediction.premenstrualStart
  ) {
    if (dateIso >= prediction.nextStart && dateIso <= prediction.nextEnd) {
      return 'predicted_period';
    }
    if (
      dateIso >= prediction.premenstrualStart &&
      dateIso < prediction.nextStart
    ) {
      return 'premenstrual';
    }
  }
  return 'other';
}

/** Tags each date with its cycle phase, for shading the mood chart. */
export function overlayCyclePhases(
  dates: readonly string[],
  periods: readonly CyclePeriodEntry[],
  prediction: CyclePrediction,
): Record<string, CyclePhase> {
  const out: Record<string, CyclePhase> = {};
  for (const d of dates) out[d] = cyclePhaseForDate(d, periods, prediction);
  return out;
}
