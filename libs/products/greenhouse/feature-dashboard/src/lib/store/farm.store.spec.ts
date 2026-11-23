import { TestBed } from '@angular/core/testing';
import {
  DemoFarmRemote,
  RemoteError,
} from '@ah/products/greenhouse/data-access';
import type { Team } from '@ah/products/greenhouse/domain';
import { DEMO_FARM_REMOTE, FarmStore } from './farm.store';

const WEEK = '2026-11-23';

/** The demo farm with no delay; `refuse` makes the next team save fail. */
class TestRemote extends DemoFarmRemote {
  refuse = false;

  constructor() {
    super(WEEK, 0);
  }

  override async saveTeam(farmId: string, team: Team): Promise<void> {
    if (this.refuse) throw new RemoteError('rejected', 'duplicate name');
    return super.saveTeam(farmId, team);
  }
}

async function openStore() {
  const remote = new TestRemote();
  TestBed.configureTestingModule({
    providers: [{ provide: DEMO_FARM_REMOTE, useValue: () => remote }],
  });
  const store = TestBed.inject(FarmStore);
  await store.start();
  await store.showWeek(WEEK);
  return { store, remote };
}

describe('FarmStore', () => {
  it('opens the demo farm as its manager when there is no server', async () => {
    const { store } = await openStore();
    expect(store.online).toBe(false);
    expect(store.phase()).toBe('ready');
    expect(store.role()).toBe('manager');
    expect(store.canEdit()).toBe(true);
    expect(store.setup().workers).toHaveLength(122);
    expect(store.currentWeek()?.weekStart).toBe(WEEK);
  });

  it('shows a change at once and keeps it on the server', async () => {
    const { store, remote } = await openStore();
    const row =
      store.currentWeek()?.plan.filter((p) => p.greenhouseId === 'gh-1') ?? [];
    const saving = store.savePlanRow(
      'gh-1',
      row.map((p) => ({ ...p, expectedKg: 10 })),
    );
    expect(store.saving()).toBe(true);
    expect(
      store
        .currentWeek()
        ?.plan.filter((p) => p.greenhouseId === 'gh-1')
        .every((p) => p.expectedKg === 10),
    ).toBe(true);
    expect(await saving).toBe(true);
    expect(store.saving()).toBe(false);
    const week = await remote.loadWeek('demo-farm', WEEK);
    expect(
      week.plan
        .filter((p) => p.greenhouseId === 'gh-1')
        .every((p) => p.expectedKg === 10),
    ).toBe(true);
  });

  it('says why a change was refused and goes back to the server’s data', async () => {
    const { store, remote } = await openStore();
    remote.refuse = true;
    const ok = await store.saveTeam({
      id: 'team-new',
      name: 'Équipe Z',
      supervisorId: null,
    });
    expect(ok).toBe(false);
    expect(store.problem()).toBe('rejected');
    await vi.waitFor(() =>
      expect(store.setup().teams.map((t) => t.id)).not.toContain('team-new'),
    );
    store.dismissProblem();
    expect(store.problem()).toBeNull();
  });

  it('copies last week’s plan into this one', async () => {
    const { store } = await openStore();
    await store.showWeek('2026-11-30');
    const before = store.currentWeek()?.plan.length ?? 0;
    expect(await store.copyLastWeek()).toBe(true);
    const plan = store.currentWeek()?.plan ?? [];
    expect(plan).toHaveLength(before);
    expect(plan.every((p) => p.weekStart === '2026-11-30')).toBe(true);
  });

  it('keeps the week the manager went to last', async () => {
    const { store } = await openStore();
    const first = store.showWeek('2026-12-07');
    const second = store.showWeek('2026-12-14');
    await Promise.all([first, second]);
    expect(store.weekStart()).toBe('2026-12-14');
    expect(store.currentWeek()?.weekStart).toBe('2026-12-14');
  });
});
