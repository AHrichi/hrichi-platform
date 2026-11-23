import { sampleFarm } from '@ah/products/greenhouse/domain';
import {
  buildWeekView,
  type ReportCopy,
  shortageReport,
  withExpectedKg,
} from './week-view';

const WEEK = '2026-11-23';
const farm = sampleFarm(WEEK);

function view(entries = farm.plan) {
  return buildWeekView({
    weekStart: WEEK,
    greenhouses: farm.greenhouses,
    workers: farm.workers,
    absences: farm.absences,
    history: farm.history,
    entries,
  });
}

const copy: ReportCopy = {
  subject: 'Workers needed, week of {date}',
  heading: 'Workers needed, week of {date}',
  line: '{day}: short by {n} ({required} needed, {available} available)',
  total: 'Total: {n} worker-days',
  none: 'No shortage this week.',
};
const format = { day: (d: string) => d, num: (n: number) => String(n) };

describe('buildWeekView', () => {
  it('has a row per greenhouse with a cell per day', () => {
    const { rows } = view();
    expect(rows).toHaveLength(8);
    expect(rows[0]?.cells).toHaveLength(7);
    expect(rows[0]?.teamIds).toEqual(['team-a1']);
    // Sunday is off in the sample.
    expect(rows[0]?.cells[6]).toMatchObject({
      date: '2026-11-29',
      expectedKg: null,
      workerDays: null,
    });
    expect(rows[0]?.cells[0]?.expectedKg).toBe(4000);
    expect(rows[0]?.workerDays).toBeGreaterThan(0);
  });

  it('agrees with the plan totals', () => {
    const { rows, plan } = view();
    const kg = rows.reduce((total, r) => total + r.expectedKg, 0);
    expect(kg).toBe(plan.expectedKg);
  });
});

describe('withExpectedKg', () => {
  const change = {
    weekStart: WEEK,
    greenhouseId: 'gh-1',
    day: 3 as const,
    expectedKg: 6000,
    hoursPerDay: 8,
  };

  it('changes one greenhouse-day and leaves the rest', () => {
    const next = withExpectedKg(farm.plan, change);
    expect(next).toHaveLength(farm.plan.length);
    expect(
      next.find((e) => e.greenhouseId === 'gh-1' && e.day === 3)?.expectedKg,
    ).toBe(6000);
    expect(
      farm.plan.find((e) => e.greenhouseId === 'gh-1' && e.day === 3)
        ?.expectedKg,
    ).not.toBe(6000);
  });

  it('plans an empty day with the greenhouse’s usual team', () => {
    const next = withExpectedKg(farm.plan, { ...change, day: 7 });
    expect(next.at(-1)).toMatchObject({
      day: 7,
      teamId: 'team-a1',
      expectedKg: 6000,
    });
  });

  it('raises the headcount the gap reports', () => {
    const before = view().gap.days[2]?.required ?? 0;
    const after =
      view(withExpectedKg(farm.plan, change)).gap.days[2]?.required ?? 0;
    expect(after).toBeGreaterThan(before);
  });
});

describe('shortageReport', () => {
  it('lists each short day and the total', () => {
    const { gap } = view();
    const report = shortageReport(gap, copy, format);
    expect(report.subject).toBe('Workers needed, week of 2026-11-23');
    const short = gap.days.filter((d) => d.shortage > 0);
    expect(short.length).toBeGreaterThan(0);
    for (const day of short) {
      expect(report.body).toContain(
        `${day.date}: short by ${day.shortage} (${day.required} needed, ${day.available} available)`,
      );
    }
    expect(report.body.endsWith(`Total: ${gap.shortageDays} worker-days`)).toBe(
      true,
    );
  });

  it('says so when nobody is missing', () => {
    const empty = view(farm.plan.map((e) => ({ ...e, expectedKg: 0 })));
    expect(shortageReport(empty.gap, copy, format).body).toBe(
      'Workers needed, week of 2026-11-23\n\nNo shortage this week.',
    );
  });
});
