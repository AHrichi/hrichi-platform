import type { FarmPerformance } from '@ah/products/greenhouse/data-access';
import {
  addDays,
  DEFAULT_RANK_MIN_HOURS,
  type IsoDate,
  kgPerHour,
  type Metric,
  rank,
  type Ranked,
  sumTotals,
  type Team,
  targetFor,
  teamTotals,
  type WeeklyTarget,
  weeklyTrend,
  type WeekPoint,
  type Worker,
  type WorkTotals,
} from '@ah/products/greenhouse/domain';

export interface TeamRow extends WorkTotals {
  teamId: string | null;
  name: string | null;
}

export interface WorkerRow extends WorkTotals {
  workerId: string;
  name: string;
  badgeCode: string;
  teamId: string | null;
  days: number;
}

export interface PerformanceView {
  weeks: IsoDate[];
  /** The period's first Monday and last Sunday. */
  firstDay: IsoDate;
  lastDay: IsoDate;
  /** Every week together, for the team chosen (or the farm). */
  total: WorkTotals;
  /** The target in force in the last week. */
  target: WeeklyTarget | null;
  trend: WeekPoint[];
  /** The best kg/h of any week in the trend, for the bars. */
  bestWeekRate: number;
  teams: Ranked<TeamRow>[];
  workers: Ranked<WorkerRow>[];
  /** Workers who picked, but too few hours to rank. */
  unrankedWorkers: number;
}

export interface PerformanceInput {
  performance: FarmPerformance;
  teams: readonly Team[];
  workers: readonly Worker[];
  metric: Metric;
  /** A team id, or null for the whole farm. */
  team: string | null;
  minHours?: number;
}

/**
 * What the performance screen shows: the period's totals and trend for the
 * farm or one team, teams ranked, and workers ranked within the team. A
 * worker counts in the team they are in now.
 */
export function buildPerformanceView({
  performance,
  teams,
  workers,
  metric,
  team,
  minHours = DEFAULT_RANK_MIN_HOURS,
}: PerformanceInput): PerformanceView {
  const weeks: IsoDate[] = [];
  for (let w = performance.from; w < performance.to; w = addDays(w, 7)) {
    weeks.push(w);
  }
  const teamWeeks = performance.teamWeeks.filter(
    (row) => team === null || row.teamId === team,
  );
  const trend = weeklyTrend(
    performance.teamWeeks,
    weeks,
    performance.targets,
    team ?? undefined,
  );

  const teamName = new Map(teams.map((t) => [t.id, t.name]));
  const teamRows = [...teamTotals(performance.teamWeeks)].map(
    ([teamId, totals]): TeamRow => ({
      teamId,
      name: teamId === null ? null : (teamName.get(teamId) ?? null),
      ...totals,
    }),
  );

  const roster = new Map(workers.map((w) => [w.id, w]));
  const workerRows = performance.workers
    .map((totals): WorkerRow | null => {
      const worker = roster.get(totals.workerId);
      if (!worker || (team !== null && worker.teamId !== team)) return null;
      return {
        ...totals,
        name: worker.fullName,
        badgeCode: worker.badgeCode,
        teamId: worker.teamId,
      };
    })
    .filter((row): row is WorkerRow => row !== null);
  const rankedWorkers = rank(workerRows, metric, minHours);

  return {
    weeks,
    firstDay: performance.from,
    lastDay: addDays(performance.to, -1),
    total: sumTotals(teamWeeks),
    target: targetFor(performance.targets, weeks.at(-1) ?? performance.from),
    trend,
    bestWeekRate: Math.max(0, ...trend.map((p) => kgPerHour(p.totals) ?? 0)),
    teams: rank(teamRows, metric, minHours),
    workers: rankedWorkers,
    unrankedWorkers: workerRows.filter((w) => w.hours > 0 && w.hours < minHours)
      .length,
  };
}
