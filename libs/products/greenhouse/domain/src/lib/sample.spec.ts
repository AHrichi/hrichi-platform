import { addDays } from './dates';
import { planWeek } from './planning';
import { buildRateTable, DEFAULT_KG_PER_HOUR } from './productivity';
import { sampleFarm } from './sample';
import { staffingGap, teamAvailability } from './staffing';
import { findWorkerByBadge } from './work-log';

const WEEK = '2026-11-23';

describe('sampleFarm', () => {
  const farm = sampleFarm(WEEK);

  it('is the same farm every time for the same week', () => {
    expect(sampleFarm(WEEK)).toEqual(farm);
    // Any day of the week gives that week's farm.
    expect(sampleFarm('2026-11-26')).toEqual(farm);
  });

  it('has three teams of twelve and two floaters, with unique badges', () => {
    expect(farm.workers).toHaveLength(38);
    expect(new Set(farm.workers.map((w) => w.badgeCode)).size).toBe(38);
    expect(farm.workers.filter((w) => w.teamId === null)).toHaveLength(2);
    expect(findWorkerByBadge(farm.workers, 'gh-0007')?.teamId).toBe('team-a');
  });

  it('keeps four weeks of history before the week, Sundays off', () => {
    const dates = new Set(farm.history.map((log) => log.date));
    expect(dates.size).toBe(24);
    expect([...dates].every((d) => d < WEEK && d >= addDays(WEEK, -28))).toBe(
      true,
    );
    expect(farm.history.every((log) => log.syncedAt !== null)).toBe(true);
  });

  it('plans a week that runs short on Friday', () => {
    const rates = buildRateTable(farm.history, farm.greenhouses, {
      from: addDays(WEEK, -28),
      to: WEEK,
      cropDefaults: DEFAULT_KG_PER_HOUR,
      farmDefault: 25,
    });
    const plan = planWeek({
      weekStart: WEEK,
      entries: farm.plan,
      greenhouses: farm.greenhouses,
      rates,
    });
    expect(plan.issues).toEqual([]);
    expect(plan.entries.every((e) => e.rate.source === 'team-crop')).toBe(true);
    expect(plan.days[6]?.headcount).toBe(0);
    expect(farm.target.kgTarget).toBe(plan.expectedKg);

    const gap = staffingGap(
      plan,
      teamAvailability(farm.workers, farm.absences, WEEK),
    );
    expect(gap.worstDay?.date).toBe('2026-11-27');
    expect(gap.days[0]?.shortage).toBe(0);
  });
});
