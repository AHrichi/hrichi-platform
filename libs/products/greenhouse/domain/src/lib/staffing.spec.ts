import { weekDates } from './dates';
import type { Absence, Worker } from './models';
import type { TeamDayNeed, WeeklyPlan } from './planning';
import { staffingGap, teamAvailability } from './staffing';

const WEEK = '2026-11-23';
const TUE = '2026-11-24';

function worker(id: string, teamId: string | null, active = true): Worker {
  return { id, fullName: id, teamId, badgeCode: id, active };
}

function need(date: string, teamId: string, headcount: number): TeamDayNeed {
  return { date, teamId, expectedKg: 0, workerDays: headcount, headcount };
}

/** A plan made of team headcounts only, as `planWeek` would add them up. */
function plan(teamDays: TeamDayNeed[]): WeeklyPlan {
  const days = weekDates(WEEK).map((date) => {
    const headcount = teamDays
      .filter((t) => t.date === date)
      .reduce((total, t) => total + t.headcount, 0);
    return { date, expectedKg: 0, workerDays: headcount, headcount };
  });
  return {
    weekStart: WEEK,
    entries: [],
    teamDays,
    days,
    expectedKg: 0,
    workerDays: 0,
    headcountDays: days.reduce((total, d) => total + d.headcount, 0),
    issues: [],
  };
}

describe('teamAvailability', () => {
  it('counts active workers per team, minus absences', () => {
    const workers = [
      worker('a1', 'a'),
      worker('a2', 'a'),
      worker('a3', 'a', false),
      worker('b1', 'b'),
      worker('f1', null),
    ];
    const absences: Absence[] = [
      { id: 'x', workerId: 'a2', from: TUE, to: TUE },
    ];
    const slots = teamAvailability(workers, absences, WEEK);
    expect(slots.filter((s) => s.date === WEEK)).toEqual([
      { date: WEEK, teamId: 'a', available: 2 },
      { date: WEEK, teamId: 'b', available: 1 },
      { date: WEEK, teamId: null, available: 1 },
    ]);
    expect(
      slots.find((s) => s.date === TUE && s.teamId === 'a')?.available,
    ).toBe(1);
    expect(slots).toHaveLength(21);
  });

  it('includes both ends of an absence', () => {
    const slots = teamAvailability(
      [worker('a1', 'a')],
      [{ id: 'x', workerId: 'a1', from: '2026-11-25', to: '2026-11-26' }],
      WEEK,
    );
    expect(slots.map((s) => s.date)).toEqual([
      '2026-11-23',
      TUE,
      '2026-11-27',
      '2026-11-28',
      '2026-11-29',
    ]);
  });
});

describe('staffingGap', () => {
  it('reports what HR must find once workers move between teams', () => {
    const gap = staffingGap(plan([need(WEEK, 'a', 5), need(WEEK, 'b', 2)]), [
      { date: WEEK, teamId: 'a', available: 3 },
      { date: WEEK, teamId: 'b', available: 3 },
      { date: WEEK, teamId: null, available: 0 },
    ]);
    expect(gap.days[0]).toEqual({
      date: WEEK,
      required: 7,
      available: 6,
      shortage: 1,
      surplus: 0,
      teamShortage: 2,
    });
    expect(gap.teams).toEqual([
      { date: WEEK, teamId: 'a', required: 5, available: 3, gap: -2 },
      { date: WEEK, teamId: 'b', required: 2, available: 3, gap: 1 },
    ]);
  });

  it('counts workers with no team towards the pool only', () => {
    const gap = staffingGap(plan([need(WEEK, 'a', 4)]), [
      { date: WEEK, teamId: 'a', available: 3 },
      { date: WEEK, teamId: null, available: 2 },
    ]);
    expect(gap.days[0]).toMatchObject({
      shortage: 0,
      surplus: 1,
      teamShortage: 1,
    });
  });

  it('shows a team with work and nobody as fully short', () => {
    const gap = staffingGap(plan([need(TUE, 'c', 3)]), []);
    expect(gap.days[1]).toMatchObject({
      required: 3,
      available: 0,
      shortage: 3,
    });
    expect(gap.teams).toEqual([
      { date: TUE, teamId: 'c', required: 3, available: 0, gap: -3 },
    ]);
  });

  it('adds up the week and finds the worst day', () => {
    const gap = staffingGap(plan([need(WEEK, 'a', 5), need(TUE, 'a', 8)]), [
      { date: WEEK, teamId: 'a', available: 4 },
      { date: TUE, teamId: 'a', available: 4 },
      // Outside the week: ignored.
      { date: '2026-11-30', teamId: 'a', available: 40 },
    ]);
    expect(gap.shortageDays).toBe(5);
    expect(gap.worstDay?.date).toBe(TUE);
    expect(
      gap.days.slice(2).every((d) => d.required === 0 && d.shortage === 0),
    ).toBe(true);
  });

  it('has no worst day when the week is covered', () => {
    const gap = staffingGap(plan([need(WEEK, 'a', 2)]), [
      { date: WEEK, teamId: 'a', available: 2 },
    ]);
    expect(gap.worstDay).toBeNull();
    expect(gap.shortageDays).toBe(0);
  });
});
