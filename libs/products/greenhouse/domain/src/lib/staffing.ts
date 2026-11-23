import { type IsoDate, weekDates } from './dates';
import type { Absence, Worker } from './models';
import type { WeeklyPlan } from './planning';

/** How many workers a team has on one day. `teamId` null: not in a team. */
export interface TeamAvailability {
  date: IsoDate;
  teamId: string | null;
  available: number;
}

export interface TeamDayGap {
  date: IsoDate;
  teamId: string | null;
  required: number;
  available: number;
  /** `available − required`: below 0 the team is short. */
  gap: number;
}

export interface DayGap {
  date: IsoDate;
  required: number;
  available: number;
  /**
   * Workers the farm must find from outside: what's missing once workers
   * move between teams. This is what HR has to hire.
   */
  shortage: number;
  /** Workers left over once every team is covered. */
  surplus: number;
  /**
   * The teams' shortages added up, before anyone moves. When it's above
   * `shortage`, the manager can close the difference by moving workers.
   */
  teamShortage: number;
}

export interface StaffingGap {
  weekStart: IsoDate;
  /** Seven days, Monday first. */
  days: DayGap[];
  /** Every team with work or workers on a day, sorted by date then team. */
  teams: TeamDayGap[];
  /** The week's shortages added up, in worker-days. */
  shortageDays: number;
  /** The day with the largest shortage (the first, on a tie); null if none. */
  worstDay: DayGap | null;
}

/**
 * Who can work each day of the week: every active worker, minus those with
 * an absence covering that day, grouped by team.
 */
export function teamAvailability(
  workers: readonly Worker[],
  absences: readonly Absence[],
  weekStart: IsoDate,
): TeamAvailability[] {
  const away = new Map<string, Absence[]>();
  for (const absence of absences) {
    away.set(absence.workerId, [
      ...(away.get(absence.workerId) ?? []),
      absence,
    ]);
  }
  const result: TeamAvailability[] = [];
  for (const date of weekDates(weekStart)) {
    const byTeam = new Map<string | null, number>();
    for (const worker of workers) {
      if (!worker.active) continue;
      const absent = (away.get(worker.id) ?? []).some(
        (a) => a.from <= date && date <= a.to,
      );
      if (absent) continue;
      byTeam.set(worker.teamId, (byTeam.get(worker.teamId) ?? 0) + 1);
    }
    for (const [teamId, available] of byTeam) {
      result.push({ date, teamId, available });
    }
  }
  return result.sort(byDateThenTeam);
}

/**
 * Required against available headcount, per team and per day. A day's
 * shortage pools every team's workers (workers can move between teams);
 * `teamShortage` shows the gaps before anyone moves.
 */
export function staffingGap(
  plan: WeeklyPlan,
  availability: readonly TeamAvailability[],
): StaffingGap {
  const teams = new Map<string, TeamDayGap>();
  const row = (date: IsoDate, teamId: string | null): TeamDayGap => {
    const key = `${date}|${teamId ?? ''}`;
    let gap = teams.get(key);
    if (!gap) {
      gap = { date, teamId, required: 0, available: 0, gap: 0 };
      teams.set(key, gap);
    }
    return gap;
  };
  for (const need of plan.teamDays) {
    row(need.date, need.teamId).required += need.headcount;
  }
  for (const slot of availability) {
    if (slot.available > 0) {
      row(slot.date, slot.teamId).available += slot.available;
    }
  }
  const teamGaps = [...teams.values()]
    .map((t) => ({ ...t, gap: t.available - t.required }))
    .filter((t) => plan.days.some((d) => d.date === t.date))
    .sort(byDateThenTeam);

  const days = plan.days.map((day): DayGap => {
    const rows = teamGaps.filter((t) => t.date === day.date);
    const required = day.headcount;
    const available = rows.reduce((total, t) => total + t.available, 0);
    return {
      date: day.date,
      required,
      available,
      shortage: Math.max(0, required - available),
      surplus: Math.max(0, available - required),
      teamShortage: rows.reduce((total, t) => total + Math.max(0, -t.gap), 0),
    };
  });

  const worstDay = days.reduce<DayGap | null>(
    (worst, day) =>
      day.shortage > 0 && day.shortage > (worst?.shortage ?? 0) ? day : worst,
    null,
  );

  return {
    weekStart: plan.weekStart,
    days,
    teams: teamGaps,
    shortageDays: days.reduce((total, d) => total + d.shortage, 0),
    worstDay,
  };
}

function byDateThenTeam(
  a: { date: IsoDate; teamId: string | null },
  b: { date: IsoDate; teamId: string | null },
): number {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  // Workers with no team come last.
  if (a.teamId === b.teamId) return 0;
  if (a.teamId === null) return 1;
  if (b.teamId === null) return -1;
  return a.teamId.localeCompare(b.teamId);
}
