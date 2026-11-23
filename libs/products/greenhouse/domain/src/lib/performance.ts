import { addDays, type IsoDate, startOfWeek } from './dates';
import type { WeeklyTarget, WorkLog, WorkerPay } from './models';

/**
 * How well the farm picks, and what it costs: kg per worker-hour, the share
 * of crates rejected, and labour cost per accepted kg against the target.
 *
 * Every rate is a ratio of totals (all kg over all hours), never an average
 * of rates, so a long day weighs more than a short one.
 */
export interface WorkTotals {
  /** Accepted kg. */
  kg: number;
  hours: number;
  crates: number;
  rejectedCrates: number;
  /** TND: hours times each worker's hourly rate, where it is known. */
  labourCost: number;
  /** The hours whose worker has a rate; the cost covers only these. */
  paidHours: number;
}

/** A team's work in one week (Monday). `teamId` null: workers in no team. */
export interface TeamWeekTotals extends WorkTotals {
  weekStart: IsoDate;
  teamId: string | null;
}

/** One worker's work over a period. */
export interface WorkerTotals extends WorkTotals {
  workerId: string;
  /** Days with at least one entry. */
  days: number;
}

export const EMPTY_TOTALS: Readonly<WorkTotals> = {
  kg: 0,
  hours: 0,
  crates: 0,
  rejectedCrates: 0,
  labourCost: 0,
  paidHours: 0,
};

export function addTotals(a: WorkTotals, b: WorkTotals): WorkTotals {
  return {
    kg: a.kg + b.kg,
    hours: a.hours + b.hours,
    crates: a.crates + b.crates,
    rejectedCrates: a.rejectedCrates + b.rejectedCrates,
    labourCost: a.labourCost + b.labourCost,
    paidHours: a.paidHours + b.paidHours,
  };
}

export function sumTotals(rows: readonly WorkTotals[]): WorkTotals {
  return rows.reduce<WorkTotals>(addTotals, { ...EMPTY_TOTALS });
}

/** Accepted kg per worker-hour; null with no hours. */
export function kgPerHour(t: WorkTotals): number | null {
  return t.hours > 0 ? t.kg / t.hours : null;
}

/** Rejected crates over all crates (0 to 1); null with no crates. */
export function rejectionRate(t: WorkTotals): number | null {
  return t.crates > 0 ? t.rejectedCrates / t.crates : null;
}

/**
 * TND per accepted kg, counting only the hours whose pay is known (and the
 * kg picked in them, pro rata). Null with no paid hours or no kg.
 */
export function costPerKg(t: WorkTotals): number | null {
  if (!(t.paidHours > 0) || !(t.kg > 0) || !(t.hours > 0)) return null;
  return t.labourCost / (t.kg * Math.min(1, t.paidHours / t.hours));
}

/** The share of hours with a known rate (0 to 1); 1 with no hours. */
export function payCoverage(t: WorkTotals): number {
  return t.hours > 0 ? Math.min(1, t.paidHours / t.hours) : 1;
}

export type Metric = 'kgPerHour' | 'rejectionRate' | 'costPerKg';

export const METRICS: readonly Metric[] = [
  'kgPerHour',
  'rejectionRate',
  'costPerKg',
];

const MEASURE: Record<Metric, (t: WorkTotals) => number | null> = {
  kgPerHour,
  rejectionRate,
  costPerKg,
};

/** Whether a higher value is better (kg/h) or worse (rejections, cost). */
export const HIGHER_IS_BETTER: Record<Metric, boolean> = {
  kgPerHour: true,
  rejectionRate: false,
  costPerKg: false,
};

export function measure(metric: Metric, t: WorkTotals): number | null {
  return MEASURE[metric](t);
}

export interface Ranked<T> {
  item: T;
  value: number;
  /** 1 for the best; ties share a place. */
  place: number;
}

/** Fewer logged hours than this and a rate says more about luck than skill. */
export const DEFAULT_RANK_MIN_HOURS = 16;

/**
 * Rows ordered best first by `metric`. Rows with fewer than `minHours`
 * logged hours, or no value (no crates, no pay), are left out.
 */
export function rank<T extends WorkTotals>(
  rows: readonly T[],
  metric: Metric,
  minHours = DEFAULT_RANK_MIN_HOURS,
): Ranked<T>[] {
  const sign = HIGHER_IS_BETTER[metric] ? -1 : 1;
  const ranked = rows
    .filter((row) => row.hours >= minHours)
    .map((item) => ({ item, value: MEASURE[metric](item) }))
    .filter((r): r is { item: T; value: number } => r.value !== null)
    .sort((a, b) => sign * (a.value - b.value));
  let place = 0;
  return ranked.map((r, i) => {
    if (i === 0 || r.value !== ranked[i - 1]?.value) place = i + 1;
    return { ...r, place };
  });
}

/** The Mondays of the `weeks` whole weeks before `today`'s week, oldest first. */
export function lastWeeks(today: IsoDate, weeks: number): IsoDate[] {
  const thisWeek = startOfWeek(today);
  return Array.from({ length: weeks }, (_, i) =>
    addDays(thisWeek, -7 * (weeks - i)),
  );
}

export interface WeekPoint {
  weekStart: IsoDate;
  totals: WorkTotals;
  target: WeeklyTarget | null;
}

/**
 * One point per week in `weeks` (missing weeks are empty), for every team
 * or only `teamId`'s, each with the target in force that week.
 */
export function weeklyTrend(
  rows: readonly TeamWeekTotals[],
  weeks: readonly IsoDate[],
  targets: readonly WeeklyTarget[],
  teamId?: string,
): WeekPoint[] {
  return weeks.map((weekStart) => ({
    weekStart,
    totals: sumTotals(
      rows.filter(
        (r) =>
          r.weekStart === weekStart &&
          (teamId === undefined || r.teamId === teamId),
      ),
    ),
    target: targetFor(targets, weekStart),
  }));
}

/** Each team's totals over every week given. */
export function teamTotals(
  rows: readonly TeamWeekTotals[],
): Map<string | null, WorkTotals> {
  const byTeam = new Map<string | null, WorkTotals>();
  for (const row of rows) {
    byTeam.set(
      row.teamId,
      addTotals(byTeam.get(row.teamId) ?? { ...EMPTY_TOTALS }, row),
    );
  }
  return byTeam;
}

/**
 * The target in force in a week: the latest one set on or before it. A
 * target holds until the manager sets another, so changing it never
 * rewrites the weeks before.
 */
export function targetFor(
  targets: readonly WeeklyTarget[],
  weekStart: IsoDate,
): WeeklyTarget | null {
  let found: WeeklyTarget | null = null;
  for (const t of targets) {
    if (t.weekStart <= weekStart && (!found || t.weekStart > found.weekStart)) {
      found = t;
    }
  }
  return found;
}

export type TargetStatus = 'met' | 'missed' | 'none';

/** Whether a week's cost per kg stayed at or under its target. */
export function costStatus(
  t: WorkTotals,
  target: WeeklyTarget | null,
): TargetStatus {
  const cost = costPerKg(t);
  if (cost === null || !target) return 'none';
  return cost <= target.costPerKgTarget ? 'met' : 'missed';
}

/**
 * Work logs (single workers' entries) to the weekly team totals and the
 * worker totals the server sends, priced at each worker's current rate.
 * The demo farm and the tests use it; the server does the same in SQL.
 */
export function summarizeLogs(
  logs: readonly WorkLog[],
  pay: readonly WorkerPay[],
): { teamWeeks: TeamWeekTotals[]; workers: WorkerTotals[] } {
  const rateOf = new Map(pay.map((p) => [p.workerId, p.hourlyRate]));
  const teamWeeks = new Map<string, TeamWeekTotals>();
  const workers = new Map<string, WorkerTotals>();
  const workerDates = new Map<string, Set<IsoDate>>();

  for (const log of logs) {
    const rate = rateOf.get(log.workerId);
    const totals: WorkTotals = {
      kg: log.kg,
      hours: log.hours,
      crates: log.crates,
      rejectedCrates: log.rejectedCrates,
      labourCost: rate === undefined ? 0 : log.hours * rate,
      paidHours: rate === undefined ? 0 : log.hours,
    };
    const weekStart = startOfWeek(log.date);
    const key = `${weekStart}|${log.teamId ?? ''}`;
    const week = teamWeeks.get(key);
    teamWeeks.set(key, {
      weekStart,
      teamId: log.teamId,
      ...addTotals(week ?? EMPTY_TOTALS, totals),
    });
    const dates = workerDates.get(log.workerId) ?? new Set<IsoDate>();
    dates.add(log.date);
    workerDates.set(log.workerId, dates);
    workers.set(log.workerId, {
      workerId: log.workerId,
      days: dates.size,
      ...addTotals(workers.get(log.workerId) ?? EMPTY_TOTALS, totals),
    });
  }

  return {
    teamWeeks: [...teamWeeks.values()].sort(
      (a, b) =>
        a.weekStart.localeCompare(b.weekStart) ||
        (a.teamId ?? '').localeCompare(b.teamId ?? ''),
    ),
    workers: [...workers.values()],
  };
}
