import type { Crop, Greenhouse, PlanEntry } from './models';
import { headcountFor, planWeek, requiredWorkerDays } from './planning';
import type { Rate, RateTable } from './productivity';

const WEEK = '2026-11-23';

const greenhouses: Greenhouse[] = [
  {
    id: 'gh-1',
    name: 'S1',
    areaM2: 1,
    crop: 'tomato',
    kgPerCrate: 12,
    active: true,
  },
  {
    id: 'gh-2',
    name: 'S2',
    areaM2: 1,
    crop: 'tomato',
    kgPerCrate: 12,
    active: true,
  },
  {
    id: 'gh-3',
    name: 'S3',
    areaM2: 1,
    crop: 'cherry-tomato',
    kgPerCrate: 6,
    active: true,
  },
  {
    id: 'gh-off',
    name: 'Off',
    areaM2: 1,
    crop: 'tomato',
    kgPerCrate: 12,
    active: false,
  },
];

/** Fixed rates: team a picks 50 kg/h of tomatoes, everything else is 25. */
const rates: RateTable = {
  rate(teamId: string, crop: Crop): Rate {
    return teamId === 'a' && crop === 'tomato'
      ? { kgPerHour: 50, source: 'team-crop', hours: 100 }
      : { kgPerHour: 25, source: 'farm-default', hours: 0 };
  },
};

function entry(partial: Partial<PlanEntry>): PlanEntry {
  return {
    weekStart: WEEK,
    day: 1,
    greenhouseId: 'gh-1',
    teamId: 'a',
    expectedKg: 1000,
    hoursPerDay: 8,
    ...partial,
  };
}

describe('requiredWorkerDays', () => {
  it('is expected kg over kg per hour times hours per day', () => {
    // 1000 kg / (50 kg/h × 8 h) = 2.5 worker-days.
    expect(requiredWorkerDays(1000, 50, 8)).toBe(2.5);
    expect(requiredWorkerDays(0, 50, 8)).toBe(0);
  });

  it('refuses inputs that would make the answer meaningless', () => {
    expect(() => requiredWorkerDays(-1, 50, 8)).toThrow(RangeError);
    expect(() => requiredWorkerDays(1000, 0, 8)).toThrow(RangeError);
    expect(() => requiredWorkerDays(1000, 50, 0)).toThrow(RangeError);
    expect(() => requiredWorkerDays(1000, 50, 13)).toThrow(RangeError);
    expect(() => requiredWorkerDays(Number.NaN, 50, 8)).toThrow(RangeError);
  });
});

describe('headcountFor', () => {
  it('rounds part of a worker up to a whole one', () => {
    expect(headcountFor(2.01)).toBe(3);
    expect(headcountFor(3)).toBe(3);
    expect(headcountFor(0)).toBe(0);
  });

  it('ignores floating-point noise', () => {
    // 0.1 + 0.2 is 0.30000000000000004; three of them must not need 2 people.
    expect(headcountFor((0.1 + 0.2) * (10 / 3))).toBe(1);
  });
});

describe('planWeek', () => {
  it('plans each entry with its team rate on its crop', () => {
    const plan = planWeek({
      weekStart: WEEK,
      entries: [entry({}), entry({ greenhouseId: 'gh-3', expectedKg: 500 })],
      greenhouses,
      rates,
    });
    expect(
      plan.entries.map((e) => [e.date, e.crop, e.rate.kgPerHour, e.workerDays]),
    ).toEqual([
      ['2026-11-23', 'tomato', 50, 2.5],
      ['2026-11-23', 'cherry-tomato', 25, 2.5],
    ]);
  });

  it('rounds up per team and day, not per greenhouse', () => {
    // 1.5 + 1.5 worker-days in two greenhouses: team a needs 3 people, not 4.
    const plan = planWeek({
      weekStart: WEEK,
      entries: [
        entry({ greenhouseId: 'gh-1', expectedKg: 600 }),
        entry({ greenhouseId: 'gh-2', expectedKg: 600 }),
        entry({ greenhouseId: 'gh-3', teamId: 'b', expectedKg: 100 }),
      ],
      greenhouses,
      rates,
    });
    expect(plan.teamDays).toEqual([
      {
        date: WEEK,
        teamId: 'a',
        expectedKg: 1200,
        workerDays: 3,
        headcount: 3,
      },
      {
        date: WEEK,
        teamId: 'b',
        expectedKg: 100,
        workerDays: 0.5,
        headcount: 1,
      },
    ]);
    expect(plan.days[0]).toEqual({
      date: WEEK,
      expectedKg: 1300,
      workerDays: 3.5,
      headcount: 4,
    });
  });

  it('always returns seven days, Monday first', () => {
    const plan = planWeek({
      weekStart: WEEK,
      entries: [entry({ day: 3 })],
      greenhouses,
      rates,
    });
    expect(plan.days.map((d) => d.headcount)).toEqual([0, 0, 3, 0, 0, 0, 0]);
    expect(plan.days[6]?.date).toBe('2026-11-29');
    expect(plan.expectedKg).toBe(1000);
    expect(plan.workerDays).toBe(2.5);
    expect(plan.headcountDays).toBe(3);
  });

  it('reports bad entries and plans the rest', () => {
    const bad = [
      entry({ greenhouseId: 'gh-x' }),
      entry({ greenhouseId: 'gh-off' }),
      entry({ weekStart: '2026-11-30' }),
      entry({ expectedKg: -5 }),
      entry({ hoursPerDay: 14 }),
    ];
    const plan = planWeek({
      weekStart: WEEK,
      entries: [entry({}), ...bad, entry({ expectedKg: 2000 })],
      greenhouses,
      rates,
    });
    expect(plan.entries).toHaveLength(1);
    expect(plan.issues.map((i) => i.kind)).toEqual([
      'unknown-greenhouse',
      'inactive-greenhouse',
      'other-week',
      'invalid-kg',
      'invalid-hours',
      'duplicate',
    ]);
  });

  it('lets two teams share a greenhouse on the same day', () => {
    const plan = planWeek({
      weekStart: WEEK,
      entries: [entry({}), entry({ teamId: 'b' })],
      greenhouses,
      rates,
    });
    expect(plan.issues).toEqual([]);
    expect(plan.teamDays.map((t) => [t.teamId, t.headcount])).toEqual([
      ['a', 3],
      ['b', 5],
    ]);
  });

  it('only plans weeks that start on a Monday', () => {
    expect(() =>
      planWeek({ weekStart: '2026-11-24', entries: [], greenhouses, rates }),
    ).toThrow(RangeError);
  });
});
