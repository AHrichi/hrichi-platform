import type { FarmPerformance } from '@ah/products/greenhouse/data-access';
import { EMPTY_TOTALS, type WorkTotals } from '@ah/products/greenhouse/domain';
import { buildPerformanceView } from './performance-view';

const sums = (kg: number, hours: number): WorkTotals => ({
  ...EMPTY_TOTALS,
  kg,
  hours,
  crates: kg / 10,
  labourCost: hours * 2.5,
  paidHours: hours,
});

const performance: FarmPerformance = {
  from: '2026-11-09',
  to: '2026-11-23',
  teamWeeks: [
    { weekStart: '2026-11-09', teamId: 'a', ...sums(800, 20) },
    { weekStart: '2026-11-16', teamId: 'a', ...sums(1000, 20) },
    { weekStart: '2026-11-16', teamId: 'b', ...sums(600, 20) },
  ],
  workers: [
    { workerId: 'w1', days: 4, ...sums(1200, 30) },
    { workerId: 'w2', days: 1, ...sums(300, 8) },
    { workerId: 'w3', days: 3, ...sums(900, 30) },
  ],
  targets: [{ weekStart: '2026-01-05', costPerKgTarget: 0.06, kgTarget: 2000 }],
};

const teams = [
  { id: 'a', name: 'Équipe A', supervisorId: null },
  { id: 'b', name: 'Équipe B', supervisorId: null },
];
const worker = (id: string, teamId: string) => ({
  id,
  fullName: id.toUpperCase(),
  teamId,
  badgeCode: `GH-${id}`,
  active: true,
});
const workers = [worker('w1', 'a'), worker('w2', 'a'), worker('w3', 'b')];

describe('buildPerformanceView', () => {
  it('totals the farm, week by week, against the target in force', () => {
    const view = buildPerformanceView({
      performance,
      teams,
      workers,
      metric: 'kgPerHour',
      team: null,
    });
    expect(view.weeks).toEqual(['2026-11-09', '2026-11-16']);
    expect([view.firstDay, view.lastDay]).toEqual(['2026-11-09', '2026-11-22']);
    expect(view.total.kg).toBe(2400);
    expect(view.trend.map((p) => p.totals.kg)).toEqual([800, 1600]);
    expect(view.target?.costPerKgTarget).toBe(0.06);
    expect(view.bestWeekRate).toBe(40);
    expect(view.teams.map((t) => [t.item.name, t.place])).toEqual([
      ['Équipe A', 1],
      ['Équipe B', 2],
    ]);
    // w2's 8 hours are too few to rank.
    expect(view.workers.map((w) => w.item.workerId)).toEqual(['w1', 'w3']);
    expect(view.unrankedWorkers).toBe(1);
  });

  it('narrows the totals and workers to one team, but ranks every team', () => {
    const view = buildPerformanceView({
      performance,
      teams,
      workers,
      metric: 'kgPerHour',
      team: 'b',
    });
    expect(view.total.kg).toBe(600);
    expect(view.trend.map((p) => p.totals.kg)).toEqual([0, 600]);
    expect(view.teams).toHaveLength(2);
    expect(view.workers.map((w) => w.item.name)).toEqual(['W3']);
  });
});
