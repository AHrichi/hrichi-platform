import {
  type Absence,
  addDays,
  buildRateTable,
  DEFAULT_KG_PER_HOUR,
  type Greenhouse,
  type IsoDate,
  type PlanEntry,
  planWeek,
  type StaffingGap,
  staffingGap,
  teamAvailability,
  type WeeklyPlan,
  type Weekday,
  weekDates,
  type Worker,
  type WorkLog,
} from '@ah/products/greenhouse/domain';

/** Weeks of work logs a plan's picking rates come from. */
export const HISTORY_WEEKS = 4;
/** Kg per worker-hour to assume when a crop has no history or default. */
export const FARM_DEFAULT_KG_PER_HOUR = 25;

export interface PlanCell {
  date: IsoDate;
  day: Weekday;
  /** Null when nothing is planned for this greenhouse that day. */
  expectedKg: number | null;
  workerDays: number | null;
}

export interface GreenhouseRow {
  greenhouse: Greenhouse;
  teamIds: string[];
  cells: PlanCell[];
  expectedKg: number;
  workerDays: number;
}

export interface WeekView {
  plan: WeeklyPlan;
  gap: StaffingGap;
  rows: GreenhouseRow[];
}

/**
 * Everything the weekly plan screen shows, from the farm's data: picking
 * rates from the last four weeks of logs, the plan, the staffing gap, and
 * one row per active greenhouse with a cell per day.
 */
export function buildWeekView(input: {
  weekStart: IsoDate;
  greenhouses: readonly Greenhouse[];
  workers: readonly Worker[];
  absences: readonly Absence[];
  history: readonly WorkLog[];
  entries: readonly PlanEntry[];
}): WeekView {
  const { weekStart } = input;
  const rates = buildRateTable(input.history, input.greenhouses, {
    from: addDays(weekStart, -7 * HISTORY_WEEKS),
    to: weekStart,
    cropDefaults: DEFAULT_KG_PER_HOUR,
    farmDefault: FARM_DEFAULT_KG_PER_HOUR,
  });
  const plan = planWeek({
    weekStart,
    entries: input.entries,
    greenhouses: input.greenhouses,
    rates,
  });
  const gap = staffingGap(
    plan,
    teamAvailability(input.workers, input.absences, weekStart),
  );

  const dates = weekDates(weekStart);
  const rows = input.greenhouses
    .filter((g) => g.active)
    .map((greenhouse): GreenhouseRow => {
      const mine = plan.entries.filter((e) => e.greenhouseId === greenhouse.id);
      const cells = dates.map((date, i): PlanCell => {
        const today = mine.filter((e) => e.date === date);
        return {
          date,
          day: (i + 1) as Weekday,
          expectedKg: today.length
            ? today.reduce((total, e) => total + e.expectedKg, 0)
            : null,
          workerDays: today.length
            ? today.reduce((total, e) => total + e.workerDays, 0)
            : null,
        };
      });
      return {
        greenhouse,
        teamIds: [...new Set(mine.map((e) => e.teamId))],
        cells,
        expectedKg: mine.reduce((total, e) => total + e.expectedKg, 0),
        workerDays: mine.reduce((total, e) => total + e.workerDays, 0),
      };
    });

  return { plan, gap, rows };
}

/**
 * A copy of the plan with one greenhouse-day's expected kg changed. A day
 * with no entry gets one, picked by the greenhouse's usual team.
 */
export function withExpectedKg(
  entries: readonly PlanEntry[],
  change: {
    weekStart: IsoDate;
    greenhouseId: string;
    day: Weekday;
    expectedKg: number;
    hoursPerDay: number;
  },
): PlanEntry[] {
  const index = entries.findIndex(
    (e) => e.greenhouseId === change.greenhouseId && e.day === change.day,
  );
  if (index >= 0) {
    return entries.map((e, i) =>
      i === index ? { ...e, expectedKg: change.expectedKg } : e,
    );
  }
  const usualTeam = entries.find(
    (e) => e.greenhouseId === change.greenhouseId,
  )?.teamId;
  if (!usualTeam) return [...entries];
  return [
    ...entries,
    {
      weekStart: change.weekStart,
      day: change.day,
      greenhouseId: change.greenhouseId,
      teamId: usualTeam,
      expectedKg: change.expectedKg,
      hoursPerDay: change.hoursPerDay,
    },
  ];
}

/**
 * A greenhouse's row with one team picking every day. Days that had
 * several teams merge into one entry, as the plan allows one per team.
 */
export function withTeam(
  row: readonly PlanEntry[],
  teamId: string,
): PlanEntry[] {
  const byDay = new Map<Weekday, PlanEntry>();
  for (const entry of row) {
    const same = byDay.get(entry.day);
    byDay.set(
      entry.day,
      same
        ? { ...same, expectedKg: same.expectedKg + entry.expectedKg }
        : { ...entry, teamId },
    );
  }
  return [...byDay.values()].sort((a, b) => a.day - b.day);
}

/** The plan with every entry at these hours a day. */
export function withHours(
  entries: readonly PlanEntry[],
  hoursPerDay: number,
): PlanEntry[] {
  return entries.map((e) => ({ ...e, hoursPerDay }));
}

/** Kg picked per greenhouse and day (`greenhouseId|date`), from logs. */
export function pickedKg(logs: readonly WorkLog[]): Map<string, number> {
  const picked = new Map<string, number>();
  for (const log of logs) {
    const key = `${log.greenhouseId}|${log.date}`;
    picked.set(key, (picked.get(key) ?? 0) + log.kg);
  }
  return picked;
}

export interface ReportCopy {
  subject: string;
  heading: string;
  line: string;
  total: string;
  none: string;
}

/**
 * The shortage report HR receives, as plain text that reads the same in an
 * email, a WhatsApp message or on paper: one line per short day.
 */
export function shortageReport(
  gap: StaffingGap,
  copy: ReportCopy,
  format: { day(date: IsoDate): string; num(value: number): string },
): { subject: string; body: string } {
  const fill = (template: string, values: Record<string, string>) =>
    template.replace(/\{(\w+)\}/g, (m, key: string) => values[key] ?? m);
  const week = format.day(gap.weekStart);
  const subject = fill(copy.subject, { date: week });
  const short = gap.days.filter((d) => d.shortage > 0);
  if (short.length === 0) {
    return {
      subject,
      body: `${fill(copy.heading, { date: week })}\n\n${copy.none}`,
    };
  }
  const lines = short.map((d) =>
    fill(copy.line, {
      day: format.day(d.date),
      n: format.num(d.shortage),
      required: format.num(d.required),
      available: format.num(d.available),
    }),
  );
  return {
    subject,
    body: [
      fill(copy.heading, { date: week }),
      '',
      ...lines,
      '',
      fill(copy.total, { n: format.num(gap.shortageDays) }),
    ].join('\n'),
  };
}
