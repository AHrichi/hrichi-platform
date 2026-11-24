import type { WorkLog } from './models';
import {
  costPerKg,
  costStatus,
  EMPTY_TOTALS,
  kgPerHour,
  lastWeeks,
  payCoverage,
  rank,
  rejectionRate,
  summarizeLogs,
  targetFor,
  type TeamWeekTotals,
  teamTotals,
  weeklyTrend,
  type WorkTotals,
} from './performance';

const totals = (over: Partial<WorkTotals>): WorkTotals => ({
  ...EMPTY_TOTALS,
  ...over,
});

function log(over: Partial<WorkLog>): WorkLog {
  return {
    id: 'l',
    date: '2026-11-16',
    workerId: 'w-1',
    teamId: 'team-a',
    greenhouseId: 'gh-1',
    kg: 360,
    crates: 52,
    rejectedCrates: 1,
    hours: 8,
    recordedAt: '2026-11-16T15:00:00.000Z',
    syncedAt: null,
    ...over,
  };
}

describe('rates', () => {
  it('divides totals, and gives null when there is nothing to divide by', () => {
    const t = totals({ kg: 900, hours: 20, crates: 100, rejectedCrates: 4 });
    expect(kgPerHour(t)).toBe(45);
    expect(rejectionRate(t)).toBe(0.04);
    expect(kgPerHour(EMPTY_TOTALS)).toBeNull();
    expect(rejectionRate(EMPTY_TOTALS)).toBeNull();
  });

  it('prices only the hours whose pay is known', () => {
    // 10 of 20 hours paid at 2.5 TND: 25 TND for half the 900 kg.
    const t = totals({ kg: 900, hours: 20, labourCost: 25, paidHours: 10 });
    expect(costPerKg(t)).toBeCloseTo(25 / 450);
    expect(payCoverage(t)).toBe(0.5);
    expect(costPerKg(totals({ kg: 900, hours: 20 }))).toBeNull();
    expect(payCoverage(EMPTY_TOTALS)).toBe(1);
  });
});

describe('rank', () => {
  const rows = [
    {
      id: 'slow',
      ...totals({ kg: 600, hours: 20, crates: 90, rejectedCrates: 9 }),
    },
    {
      id: 'fast',
      ...totals({ kg: 1000, hours: 20, crates: 140, rejectedCrates: 1 }),
    },
    {
      id: 'same',
      ...totals({ kg: 1000, hours: 20, crates: 140, rejectedCrates: 7 }),
    },
    { id: 'new', ...totals({ kg: 500, hours: 4, crates: 70 }) },
  ];

  it('puts the best first, shares places on ties, and leaves out thin history', () => {
    const ranked = rank(rows, 'kgPerHour');
    expect(ranked.map((r) => [r.item.id, r.place])).toEqual([
      ['fast', 1],
      ['same', 1],
      ['slow', 3],
    ]);
  });

  it('ranks rejections and cost lowest first', () => {
    expect(rank(rows, 'rejectionRate').map((r) => r.item.id)).toEqual([
      'fast',
      'same',
      'slow',
    ]);
    expect(rank(rows, 'costPerKg')).toEqual([]);
  });
});

describe('weeks and targets', () => {
  it('lists the whole weeks before this one, oldest first', () => {
    expect(lastWeeks('2026-11-25', 3)).toEqual([
      '2026-11-02',
      '2026-11-09',
      '2026-11-16',
    ]);
  });

  it('keeps a target until the next one is set', () => {
    const targets = [
      { weekStart: '2026-11-09', costPerKgTarget: 0.08, kgTarget: 1000 },
      { weekStart: '2026-11-02', costPerKgTarget: 0.09, kgTarget: 900 },
    ];
    expect(targetFor(targets, '2026-10-26')).toBeNull();
    expect(targetFor(targets, '2026-11-02')?.costPerKgTarget).toBe(0.09);
    expect(targetFor(targets, '2026-11-23')?.costPerKgTarget).toBe(0.08);
  });

  it('says whether a week met its cost target', () => {
    const target = {
      weekStart: '2026-11-02',
      costPerKgTarget: 0.08,
      kgTarget: 0,
    };
    const cheap = totals({
      kg: 1000,
      hours: 20,
      labourCost: 50,
      paidHours: 20,
    });
    const dear = totals({ kg: 500, hours: 20, labourCost: 50, paidHours: 20 });
    expect(costStatus(cheap, target)).toBe('met');
    expect(costStatus(dear, target)).toBe('missed');
    expect(costStatus(dear, null)).toBe('none');
  });

  it('fills a trend with empty weeks, for the farm or one team', () => {
    const rows: TeamWeekTotals[] = [
      {
        weekStart: '2026-11-09',
        teamId: 'a',
        ...totals({ kg: 100, hours: 2 }),
      },
      { weekStart: '2026-11-09', teamId: 'b', ...totals({ kg: 50, hours: 2 }) },
    ];
    const weeks = ['2026-11-02', '2026-11-09'];
    expect(weeklyTrend(rows, weeks, []).map((p) => p.totals.kg)).toEqual([
      0, 150,
    ]);
    expect(weeklyTrend(rows, weeks, [], 'b').map((p) => p.totals.kg)).toEqual([
      0, 50,
    ]);
    expect(teamTotals(rows).get('a')?.kg).toBe(100);
  });
});

describe('summarizeLogs', () => {
  it('totals logs per week and team, and per worker, at current pay', () => {
    const { teamWeeks, workers } = summarizeLogs(
      [
        log({ id: '1' }),
        log({ id: '2', date: '2026-11-17' }),
        log({ id: '3', date: '2026-11-23', workerId: 'w-2', teamId: null }),
      ],
      [{ workerId: 'w-1', hourlyRate: 2.5 }],
    );
    expect(teamWeeks).toEqual([
      {
        weekStart: '2026-11-16',
        teamId: 'team-a',
        kg: 720,
        hours: 16,
        crates: 104,
        rejectedCrates: 2,
        labourCost: 40,
        paidHours: 16,
      },
      {
        weekStart: '2026-11-23',
        teamId: null,
        kg: 360,
        hours: 8,
        crates: 52,
        rejectedCrates: 1,
        labourCost: 0,
        paidHours: 0,
      },
    ]);
    expect(workers.find((w) => w.workerId === 'w-1')).toMatchObject({
      days: 2,
      kg: 720,
      labourCost: 40,
    });
  });
});
