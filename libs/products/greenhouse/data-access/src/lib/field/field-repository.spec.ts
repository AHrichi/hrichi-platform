import 'fake-indexeddb/auto';
import {
  type HygieneCheck,
  sampleFarm,
  sampleHygieneItems,
  type WorkLog,
} from '@ah/products/greenhouse/domain';
import { FieldDatabase, type Roster } from './field-database';
import {
  FieldRepository,
  photoPath,
  SignedCheckError,
} from './field-repository';

const farm = sampleFarm('2026-11-23');
const roster: Roster = {
  farmId: 'farm-1',
  fetchedAt: '2026-11-23T06:00:00.000Z',
  greenhouses: farm.greenhouses,
  teams: farm.teams,
  workers: farm.workers.map((w) =>
    // One worker left, and one badge stored in lower case.
    w.id === 'w-2'
      ? { ...w, active: false }
      : w.id === 'w-3'
        ? { ...w, badgeCode: 'gh-0003' }
        : w,
  ),
  hygieneItems: sampleHygieneItems(),
};

const check = (over: Partial<HygieneCheck> = {}): HygieneCheck => ({
  id: 'check-1',
  date: '2026-11-23',
  greenhouseId: 'gh-1',
  supervisorId: 'sup-1',
  answers: [],
  signedAt: null,
  ...over,
});

function log(id: string, partial: Partial<WorkLog> = {}): WorkLog {
  return {
    id,
    date: '2026-11-23',
    workerId: 'w-1',
    teamId: 'team-a',
    greenhouseId: 'gh-1',
    kg: 300,
    crates: 25,
    rejectedCrates: 0,
    hours: 8,
    recordedAt: '2026-11-23T09:00:00.000Z',
    syncedAt: null,
    ...partial,
  };
}

let dbCount = 0;
let db: FieldDatabase;
let repo: FieldRepository;

beforeEach(() => {
  // Dexie keeps the first indexedDB it sees: a fresh name per test instead.
  db = new FieldDatabase(`repo-test-${++dbCount}`);
  repo = new FieldRepository(db);
});

afterEach(() => db.close());

describe('FieldRepository', () => {
  it('has no roster before the first download', async () => {
    expect(await repo.roster()).toBeNull();
  });

  it('replaces the cached roster as a whole', async () => {
    await repo.saveRoster(roster);
    await repo.saveRoster({ ...roster, workers: roster.workers.slice(0, 5) });
    const cached = await repo.roster();
    expect(cached?.farmId).toBe('farm-1');
    expect(cached?.workers).toHaveLength(5);
    expect(cached?.greenhouses).toHaveLength(8);
  });

  it('finds active workers by badge, however the code is written', async () => {
    await repo.saveRoster(roster);
    expect((await repo.workerByBadge('badge:gh-0001'))?.id).toBe('w-1');
    expect((await repo.workerByBadge('GH-0003'))?.id).toBe('w-3');
    expect(await repo.workerByBadge('GH-0002')).toBeNull();
    expect(await repo.workerByBadge('GH-9999')).toBeNull();
    expect(await repo.workerByBadge('  ')).toBeNull();
  });

  it('lists a greenhouse’s day newest first and counts by status', async () => {
    await repo.addLog(
      'farm-1',
      log('a', { recordedAt: '2026-11-23T09:00:00Z' }),
    );
    await repo.addLog(
      'farm-1',
      log('b', { recordedAt: '2026-11-23T11:00:00Z' }),
    );
    await repo.addLog('farm-1', log('c', { greenhouseId: 'gh-2' }));
    await repo.addLog('farm-1', log('d', { date: '2026-11-24' }));
    expect((await repo.logsFor('2026-11-23', 'gh-1')).map((r) => r.id)).toEqual(
      ['b', 'a'],
    );
    expect(await repo.logsOn('2026-11-23')).toHaveLength(3);
    expect(await repo.countByStatus()).toEqual({
      pending: 4,
      synced: 0,
      rejected: 0,
    });
  });

  it('deletes only entries the server never accepted', async () => {
    await repo.addLog('farm-1', log('a'));
    await repo.addLog('farm-1', log('b'));
    await db.logs.update('b', {
      status: 'synced',
      syncedAt: '2026-11-23T12:00:00Z',
      op: null,
    });
    expect(await repo.deleteLog('a')).toBe(true);
    expect(await repo.deleteLog('b')).toBe(false);
    expect(await repo.deleteLog('missing')).toBe(false);
    expect((await db.logs.toArray()).map((r) => r.id)).toEqual(['b']);
  });

  it('gives a refused entry another chance once it is fixed', async () => {
    await repo.addLog('farm-1', log('a'));
    await db.logs.update('a', {
      status: 'rejected',
      error: 'bad',
      attempts: 3,
    });
    expect(await repo.updateLog('a', { hours: 7 })).toMatchObject({
      status: 'pending',
      op: 'create',
      hours: 7,
      error: null,
      attempts: 0,
      rev: 2,
    });
    await expect(repo.updateLog('missing', { hours: 7 })).rejects.toThrow();
  });

  it('keeps the checklist with the roster', async () => {
    await repo.saveRoster(roster);
    expect((await repo.roster())?.hygieneItems).toHaveLength(8);
  });

  it('saves a check until it is signed, then refuses changes', async () => {
    const first = await repo.saveCheck('farm-1', check());
    expect(first).toMatchObject({ status: 'pending', rev: 1 });
    const answer = { itemId: 'hyg-1', ok: true, photoPaths: [] };
    await repo.saveCheck('farm-1', check({ answers: [answer] }));
    expect(await repo.checkFor('2026-11-23', 'gh-1')).toMatchObject({
      rev: 2,
      answers: [answer],
    });
    await repo.saveCheck('farm-1', check({ signedAt: '2026-11-23T08:00:00Z' }));
    await expect(repo.saveCheck('farm-1', check())).rejects.toBeInstanceOf(
      SignedCheckError,
    );
    expect(await repo.countChecks()).toEqual({
      pending: 1,
      synced: 0,
      rejected: 0,
    });
  });

  it('keeps photos on the phone under their bucket path', async () => {
    const path = photoPath('farm-1', 'check-1');
    expect(path).toMatch(/^farm-1\/check-1\/[0-9a-f-]{36}\.jpg$/);
    const blob = new Blob(['jpeg'], { type: 'image/jpeg' });
    await repo.addPhoto({ path, checkId: 'check-1', itemId: 'hyg-1', blob });
    expect(await repo.photo(path)).not.toBeNull();
    await repo.deletePhoto(path);
    expect(await repo.photo(path)).toBeNull();
  });

  it('forgets the farm on sign-out, but never with entries waiting', async () => {
    await repo.saveRoster(roster);
    await repo.addLog('farm-1', log('a'));
    expect(await repo.clearAccount()).toBe(false);
    expect(await repo.roster()).not.toBeNull();

    await db.logs.update('a', { status: 'synced', op: null });
    expect(await repo.clearAccount()).toBe(true);
    expect(await repo.roster()).toBeNull();
    expect(await db.logs.count()).toBe(0);
    expect(await repo.lastSyncAt()).toBeNull();
  });

  it('never forgets a check that waits to be sent', async () => {
    await repo.saveRoster(roster);
    await repo.saveCheck('farm-1', check());
    expect(await repo.clearAccount()).toBe(false);
    await db.checks.update('check-1', { status: 'synced' });
    expect(await repo.clearAccount()).toBe(true);
    expect(await db.checks.count()).toBe(0);
  });
});
