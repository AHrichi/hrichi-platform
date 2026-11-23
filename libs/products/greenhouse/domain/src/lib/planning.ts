import { dateOfWeekday, type IsoDate, isWeekStart, weekDates } from './dates';
import type { Crop, Greenhouse, PlanEntry } from './models';
import type { Rate, RateTable } from './productivity';

/** The longest picking day a plan may ask for. */
export const MAX_SHIFT_HOURS = 12;

/** Rounding noise below this is ignored before rounding headcounts up. */
const EPSILON = 1e-9;

export type PlanIssueKind =
  | 'unknown-greenhouse'
  | 'inactive-greenhouse'
  | 'other-week'
  | 'invalid-kg'
  | 'invalid-hours'
  | 'duplicate';

export interface PlanIssue {
  kind: PlanIssueKind;
  entry: PlanEntry;
}

export interface PlannedEntry extends PlanEntry {
  date: IsoDate;
  crop: Crop;
  rate: Rate;
  /** Fractional: 2.4 means two full days and part of a third. */
  workerDays: number;
}

/** What one team must cover on one day, across its greenhouses. */
export interface TeamDayNeed {
  date: IsoDate;
  teamId: string;
  expectedKg: number;
  workerDays: number;
  /** Workers to bring in: the worker-days rounded up. */
  headcount: number;
}

export interface DayNeed {
  date: IsoDate;
  expectedKg: number;
  workerDays: number;
  /** The sum of the teams' headcounts, since a team is staffed whole. */
  headcount: number;
}

export interface WeeklyPlan {
  weekStart: IsoDate;
  /** The entries that could be planned, in input order. */
  entries: PlannedEntry[];
  /** Sorted by date, then team id. */
  teamDays: TeamDayNeed[];
  /** Always seven days, Monday first, including days with nothing planned. */
  days: DayNeed[];
  expectedKg: number;
  workerDays: number;
  /** The days' headcounts added up: the worker-days to hire for. */
  headcountDays: number;
  /** Entries left out of the plan, and why. */
  issues: PlanIssue[];
}

/**
 * `required = expectedKg / (kgPerHour × hoursPerDay)`: the worker-days it
 * takes to pick `expectedKg` at a given rate and day length.
 */
export function requiredWorkerDays(
  expectedKg: number,
  kgPerHour: number,
  hoursPerDay: number,
): number {
  if (!(expectedKg >= 0) || !Number.isFinite(expectedKg)) {
    throw new RangeError(`Expected kg must be 0 or more, not ${expectedKg}`);
  }
  if (!(kgPerHour > 0) || !Number.isFinite(kgPerHour)) {
    throw new RangeError(`A rate must be above 0 kg/h, not ${kgPerHour}`);
  }
  if (!(hoursPerDay > 0) || hoursPerDay > MAX_SHIFT_HOURS) {
    throw new RangeError(
      `Hours per day must be above 0 and at most ${MAX_SHIFT_HOURS}, not ${hoursPerDay}`,
    );
  }
  return expectedKg / (kgPerHour * hoursPerDay);
}

/** Worker-days rounded up to whole people: 2.01 needs 3, 2.0000000001 needs 2. */
export function headcountFor(workerDays: number): number {
  return Math.max(0, Math.ceil(workerDays - EPSILON));
}

function issueOf(
  entry: PlanEntry,
  weekStart: IsoDate,
  greenhouse: Greenhouse | undefined,
): PlanIssueKind | null {
  if (entry.weekStart !== weekStart) return 'other-week';
  if (!greenhouse) return 'unknown-greenhouse';
  if (!greenhouse.active) return 'inactive-greenhouse';
  if (!(entry.expectedKg >= 0) || !Number.isFinite(entry.expectedKg)) {
    return 'invalid-kg';
  }
  if (!(entry.hoursPerDay > 0) || entry.hoursPerDay > MAX_SHIFT_HOURS) {
    return 'invalid-hours';
  }
  return null;
}

/**
 * Turns a week of expected harvests into the labour it needs: worker-days
 * per entry, headcount per team and day, and the week's totals. Each entry
 * uses its team's picking rate on that greenhouse's crop.
 *
 * Invalid entries don't throw: they are reported in `issues` and left out,
 * so the manager can still see the rest of the week.
 */
export function planWeek(input: {
  weekStart: IsoDate;
  entries: readonly PlanEntry[];
  greenhouses: readonly Greenhouse[];
  rates: RateTable;
}): WeeklyPlan {
  const { weekStart } = input;
  if (!isWeekStart(weekStart)) {
    throw new RangeError(`A week starts on a Monday, not ${weekStart}`);
  }
  const greenhouses = new Map(input.greenhouses.map((g) => [g.id, g]));
  const seen = new Set<string>();
  const entries: PlannedEntry[] = [];
  const issues: PlanIssue[] = [];

  for (const entry of input.entries) {
    const greenhouse = greenhouses.get(entry.greenhouseId);
    const key = `${entry.weekStart}|${entry.day}|${entry.greenhouseId}|${entry.teamId}`;
    // What's wrong with the entry itself first; a repeat only if it's valid.
    const kind =
      issueOf(entry, weekStart, greenhouse) ??
      (seen.has(key) ? 'duplicate' : null);
    if (kind || !greenhouse) {
      issues.push({ kind: kind ?? 'unknown-greenhouse', entry });
      continue;
    }
    seen.add(key);
    const rate = input.rates.rate(entry.teamId, greenhouse.crop);
    entries.push({
      ...entry,
      date: dateOfWeekday(weekStart, entry.day),
      crop: greenhouse.crop,
      rate,
      workerDays: requiredWorkerDays(
        entry.expectedKg,
        rate.kgPerHour,
        entry.hoursPerDay,
      ),
    });
  }

  const byTeamDay = new Map<string, TeamDayNeed>();
  for (const entry of entries) {
    const key = `${entry.date}|${entry.teamId}`;
    const need = byTeamDay.get(key) ?? {
      date: entry.date,
      teamId: entry.teamId,
      expectedKg: 0,
      workerDays: 0,
      headcount: 0,
    };
    need.expectedKg += entry.expectedKg;
    need.workerDays += entry.workerDays;
    byTeamDay.set(key, need);
  }
  const teamDays = [...byTeamDay.values()]
    .map((need) => ({ ...need, headcount: headcountFor(need.workerDays) }))
    .sort((a, b) =>
      a.date === b.date
        ? a.teamId.localeCompare(b.teamId)
        : a.date.localeCompare(b.date),
    );

  const days = weekDates(weekStart).map((date): DayNeed => {
    const needs = teamDays.filter((need) => need.date === date);
    return {
      date,
      expectedKg: sum(needs.map((n) => n.expectedKg)),
      workerDays: sum(needs.map((n) => n.workerDays)),
      headcount: sum(needs.map((n) => n.headcount)),
    };
  });

  return {
    weekStart,
    entries,
    teamDays,
    days,
    expectedKg: sum(days.map((d) => d.expectedKg)),
    workerDays: sum(days.map((d) => d.workerDays)),
    headcountDays: sum(days.map((d) => d.headcount)),
    issues,
  };
}

function sum(values: readonly number[]): number {
  return values.reduce((total, value) => total + value, 0);
}
