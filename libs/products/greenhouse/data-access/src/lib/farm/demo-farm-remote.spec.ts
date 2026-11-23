import { DEMO_FARM_ID, DemoFarmRemote } from './demo-farm-remote';

const WEEK = '2026-11-23';

describe('DemoFarmRemote', () => {
  const remote = () => new DemoFarmRemote(WEEK, 0);

  it('serves the sample farm with the visitor as manager', async () => {
    const demo = remote();
    expect(await demo.farms()).toEqual([
      { farmId: DEMO_FARM_ID, farmName: 'Demo farm', role: 'manager' },
    ]);
    const setup = await demo.loadSetup();
    expect(setup.greenhouses).toHaveLength(8);
    expect(setup.workers).toHaveLength(122);
    expect(setup.members.filter((m) => m.role === 'supervisor')).toHaveLength(
      8,
    );
    expect(setup.members.find((m) => m.userId === 'sup-1')?.fullName).toBe(
      'Supervisor A1',
    );
  });

  it('keeps plan changes per week, over the sample', async () => {
    const demo = remote();
    const week = await demo.loadWeek(DEMO_FARM_ID, WEEK);
    const friday = week.plan.find(
      (p) => p.day === 5 && p.greenhouseId === 'gh-1',
    );
    if (!friday) throw new Error('No Friday cell for A1');
    const row = week.plan.filter((p) => p.greenhouseId === 'gh-1');
    await demo.savePlanRow(
      DEMO_FARM_ID,
      WEEK,
      'gh-1',
      row.map((p) => (p === friday ? { ...p, expectedKg: 1 } : p)),
    );
    const again = await demo.loadWeek(DEMO_FARM_ID, WEEK);
    expect(again.plan).toHaveLength(week.plan.length);
    expect(
      again.plan.find((p) => p.day === 5 && p.greenhouseId === 'gh-1')
        ?.expectedKg,
    ).toBe(1);
    const next = await demo.loadWeek(DEMO_FARM_ID, '2026-11-30');
    expect(next.plan.every((p) => p.expectedKg !== 1)).toBe(true);
  });

  it('adds and removes absences that touch the week', async () => {
    const demo = remote();
    const before = (await demo.loadWeek(DEMO_FARM_ID, WEEK)).absences;
    const first = before[0];
    if (!first) throw new Error('The sample week has no absences');
    await demo.saveAbsence(DEMO_FARM_ID, {
      id: 'new',
      workerId: 'w-2',
      from: '2026-11-22',
      to: '2026-11-23',
    });
    await demo.deleteAbsence(DEMO_FARM_ID, first.id);
    const after = (await demo.loadWeek(DEMO_FARM_ID, WEEK)).absences;
    expect(after.map((a) => a.id)).toContain('new');
    expect(after.map((a) => a.id)).not.toContain(first.id);
    expect(after).toHaveLength(before.length);
    // An absence the week before doesn't show.
    expect(
      (await demo.loadWeek(DEMO_FARM_ID, '2026-11-30')).absences.map(
        (a) => a.id,
      ),
    ).not.toContain('new');
  });

  it('frees a deleted team’s workers', async () => {
    const demo = remote();
    await demo.deleteTeam(DEMO_FARM_ID, 'team-a1');
    const setup = await demo.loadSetup();
    expect(setup.teams.map((t) => t.id)).not.toContain('team-a1');
    expect(setup.workers.filter((w) => w.teamId === null)).toHaveLength(21);
  });
});
