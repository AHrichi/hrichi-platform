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

  it('totals twelve weeks of sample work, priced and against a target', async () => {
    const demo = remote();
    const from = '2026-08-31';
    const perf = await demo.loadPerformance(DEMO_FARM_ID, from, WEEK);
    // 12 weeks of 8 crews.
    expect(perf.teamWeeks).toHaveLength(12 * 8);
    expect(perf.teamWeeks.every((t) => t.weekStart >= from)).toBe(true);
    // Every crew worker (114), each paid.
    expect(perf.workers).toHaveLength(114);
    expect(perf.workers.every((w) => w.paidHours === w.hours)).toBe(true);
    expect(perf.targets).toHaveLength(1);
    // The last four weeks are the plan screen's history.
    const recent = perf.teamWeeks
      .filter((t) => t.weekStart >= '2026-10-26')
      .reduce((kg, t) => kg + t.kg, 0);
    const history = (await demo.loadWeek(DEMO_FARM_ID, WEEK)).history.reduce(
      (kg, l) => kg + l.kg,
      0,
    );
    expect(recent).toBeCloseTo(history, 3);
  });

  it('keeps a new target from its week on', async () => {
    const demo = remote();
    const before = (await demo.loadWeek(DEMO_FARM_ID, WEEK)).target;
    expect(before?.costPerKgTarget).toBe(0.075);
    await demo.saveTarget(DEMO_FARM_ID, {
      weekStart: WEEK,
      costPerKgTarget: 0.07,
      kgTarget: 150_000,
    });
    expect(
      (await demo.loadWeek(DEMO_FARM_ID, '2026-12-07')).target?.costPerKgTarget,
    ).toBe(0.07);
    expect(
      (await demo.loadWeek(DEMO_FARM_ID, '2026-11-16')).target?.costPerKgTarget,
    ).toBe(0.075);
  });

  it('serves today’s hygiene checks, one left undone and one half done', async () => {
    const demo = remote();
    const today = await demo.loadHygiene(DEMO_FARM_ID, WEEK);
    expect(today.items).toHaveLength(8);
    expect(today.checks).toHaveLength(7);
    expect(
      today.checks.find((c) => c.greenhouseId === 'gh-7')?.signedAt,
    ).toBeNull();
    const yesterday = await demo.loadHygiene(DEMO_FARM_ID, '2026-11-22');
    expect(yesterday.checks.every((c) => c.signedAt)).toBe(true);
    expect((await demo.loadHygiene(DEMO_FARM_ID, '2026-11-24')).checks).toEqual(
      [],
    );
  });

  it('keeps checklist changes, and draws its photos', async () => {
    const demo = remote();
    const [first] = (await demo.loadHygiene(DEMO_FARM_ID, WEEK)).items;
    if (!first) throw new Error('No sample items');
    await demo.saveHygieneItem(DEMO_FARM_ID, { ...first, active: false });
    const after = await demo.loadHygiene(DEMO_FARM_ID, WEEK);
    expect(after.items.find((i) => i.id === first.id)?.active).toBe(false);
    const urls = await demo.photoUrls(['a.jpg']);
    expect(urls.get('a.jpg')).toMatch(/^data:image\/svg\+xml,/);
  });

  it('renames a member', async () => {
    const demo = remote();
    await demo.renameMember(DEMO_FARM_ID, 'demo-hr', 'Salma (RH)');
    const setup = await demo.loadSetup();
    expect(setup.members.find((m) => m.userId === 'demo-hr')?.fullName).toBe(
      'Salma (RH)',
    );
  });

  it('frees a deleted team’s workers', async () => {
    const demo = remote();
    await demo.deleteTeam(DEMO_FARM_ID, 'team-a1');
    const setup = await demo.loadSetup();
    expect(setup.teams.map((t) => t.id)).not.toContain('team-a1');
    expect(setup.workers.filter((w) => w.teamId === null)).toHaveLength(21);
  });

  it('makes join codes that work once, and can be withdrawn', async () => {
    const demo = remote();
    const code = await demo.createJoinCode(DEMO_FARM_ID, 'hr', 'Hana');
    expect(code).toMatchObject({ fullName: 'Hana', role: 'hr' });
    expect(code.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
    expect((await demo.loadSetup()).joinCodes).toEqual([code]);

    const typed = `${code.code.slice(0, 4).toLowerCase()}-${code.code.slice(4)}`;
    expect(await demo.joinFarm(typed)).toBe(DEMO_FARM_ID);
    await expect(demo.joinFarm(code.code)).rejects.toMatchObject({
      kind: 'rejected',
    });

    const other = await demo.createJoinCode(DEMO_FARM_ID, 'supervisor', 'Sami');
    await demo.withdrawJoinCode(DEMO_FARM_ID, other.code);
    expect((await demo.loadSetup()).joinCodes).toEqual([]);
  });
});
