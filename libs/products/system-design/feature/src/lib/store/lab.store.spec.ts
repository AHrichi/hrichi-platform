import 'fake-indexeddb/auto';
import { TestBed } from '@angular/core/testing';
import {
  SystemDesignDatabase,
  SystemDesignLocalStore,
} from '@ah/products/system-design/data-access';
import { LAB_CHALLENGES } from '@ah/products/system-design/domain';
import {
  clampTraffic,
  LAB_SAVE_DEBOUNCE_MS,
  LabStore,
  SANDBOX_ID,
  SANDBOX_TRAFFIC,
  statusOf,
} from './lab.store';
import { SystemDesignRuntime } from './system-design-runtime';

function setup() {
  const db = new SystemDesignDatabase(`sd-lab-${Math.random()}`);
  const local = new SystemDesignLocalStore(db);
  TestBed.configureTestingModule({
    providers: [
      LabStore,
      {
        provide: SystemDesignRuntime,
        useValue: { open: () => Promise.resolve(local) },
      },
    ],
  });
  return { db, local, store: TestBed.inject(LabStore) };
}

describe('LabStore', () => {
  it('opens a challenge at its starter and judges it at the challenge traffic', async () => {
    const { db, store } = setup();
    await store.open('first-users');

    expect(store.ready()).toBe(true);
    expect(store.challenge()?.id).toBe('first-users');
    expect(store.design()).toEqual(LAB_CHALLENGES[0].starter);
    expect(store.effectiveTraffic().rps).toBe(800);
    expect(store.result().p95).toBeCloseTo(281.9, 1);
    expect(store.check()?.solved).toBe(false);
    expect(store.scene().nodes).toHaveLength(3);
    db.close();
  });

  it('solves first-users with a load balancer and a second server, then autosaves', async () => {
    const { db, local, store } = setup();
    await store.open('first-users');

    const lb = store.add('load-balancer');
    expect(lb).toBe('load-balancer-1');
    expect(store.selectedId()).toBe('load-balancer-1');
    store.add('server');

    expect(store.check()?.solved).toBe(true);
    expect(store.check()?.goals.map((g) => g.met)).toEqual([true, true]);
    expect(store.result().cost).toBe(9);

    expect(await local.getDesign('first-users')).toBeUndefined();
    await new Promise((r) => setTimeout(r, LAB_SAVE_DEBOUNCE_MS + 100));
    const row = await local.getDesign('first-users');
    expect(row?.design.nodes.map((n) => n.id)).toContain('server-2');
    expect(row?.traffic).toBeUndefined();
    expect(statusOf('first-users', row?.design)).toBe('solved');

    // Reopening restores the saved design.
    await store.open('launch-day');
    await store.open('first-users');
    expect(store.design().nodes).toHaveLength(5);
    db.close();
  });

  it('edits the selected node: instances, hit ratio, links, failure and delete', async () => {
    const { db, store } = setup();
    await store.open(SANDBOX_ID);

    store.select('server-1');
    store.setInstances(3);
    expect(store.selectedNode()?.instances).toBe(3);
    expect(store.selectedResult()?.capacity).toBe(3000);

    const cache = store.add('cache');
    store.setHitRatio(0.5);
    expect(store.selectedNode()?.hitRatio).toBe(0.5);
    expect(store.selectedLinks()).toEqual([
      { from: 'server-1', to: cache, other: 'Web server', direction: 'from' },
    ]);

    store.unlink('server-1', cache);
    expect(store.selectedLinks()).toEqual([]);
    store.select('server-1');
    expect(store.connectTargets().map((t) => t.id)).toEqual([cache]);
    store.connectTo(cache);
    expect(store.design().links).toContainEqual({
      from: 'server-1',
      to: cache,
    });

    store.select('database-1');
    store.setDown(true);
    expect(store.result().problems).toContain(
      'Database is down, so its requests fail.',
    );
    store.removeSelected();
    expect(store.selectedId()).toBeNull();
    expect(store.design().nodes.map((n) => n.id)).not.toContain('database-1');
    db.close();
  });

  it('changes traffic only in the sandbox, clamped to the controls', async () => {
    const { db, local, store } = setup();
    await store.open('first-users');
    store.setTraffic({ rps: 50_000 });
    expect(store.effectiveTraffic().rps).toBe(800);

    await store.open(SANDBOX_ID);
    store.setTraffic({ rps: 5_000_000, readRatio: 2 });
    expect(store.traffic()).toEqual({
      rps: 200_000,
      readRatio: 1,
      staticRatio: 0,
    });
    await store.flush();
    expect((await local.getDesign(SANDBOX_ID))?.traffic?.rps).toBe(200_000);

    store.reset();
    expect(store.traffic()).toEqual(SANDBOX_TRAFFIC);
    db.close();
  });

  it('resets a challenge to its starter', async () => {
    const { db, store } = setup();
    await store.open('launch-day');
    store.add('cache');
    store.reset();
    expect(store.design()).toEqual(LAB_CHALLENGES[1].starter);
    expect(store.selectedId()).toBeNull();
    db.close();
  });

  it('clamps traffic and reports statuses', () => {
    expect(clampTraffic({ rps: 1, readRatio: -1, staticRatio: 0.5 })).toEqual({
      rps: 10,
      readRatio: 0,
      staticRatio: 0.5,
    });
    expect(statusOf('first-users', undefined)).toBe('new');
    expect(statusOf('first-users', LAB_CHALLENGES[0].starter)).toBe('started');
    expect(statusOf('nope', LAB_CHALLENGES[0].starter)).toBe('new');
  });
});
