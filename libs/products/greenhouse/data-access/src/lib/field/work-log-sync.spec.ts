import 'fake-indexeddb/auto';
import type { WorkLog } from '@ah/products/greenhouse/domain';
import { FieldDatabase } from './field-database';
import { RemoteError } from '../remote/remote-error';
import type { FieldRemote, LogChange } from './field-remote';
import { FieldRepository } from './field-repository';
import { WorkLogSync } from './work-log-sync';

const FARM = 'farm-1';
const NOW = new Date('2026-11-23T15:00:00.000Z');

let n = 0;
function log(partial: Partial<WorkLog> = {}): WorkLog {
  n += 1;
  return {
    id: `log-${String(n).padStart(3, '0')}`,
    date: '2026-11-23',
    workerId: `w-${n}`,
    teamId: 'team-a',
    greenhouseId: 'gh-1',
    kg: 300,
    crates: 26,
    rejectedCrates: 1,
    hours: 8,
    recordedAt: `2026-11-23T08:${String(n % 60).padStart(2, '0')}:00.000Z`,
    syncedAt: null,
    ...partial,
  };
}

/** A server that records each batch and fails on demand. */
class FakeRemote implements FieldRemote {
  batches: LogChange[][] = [];
  failWith: ((batch: readonly LogChange[]) => RemoteError | null) | null = null;
  onPush: (() => Promise<void>) | null = null;

  async pushLogs(changes: readonly LogChange[]): Promise<void> {
    await this.onPush?.();
    const error = this.failWith?.(changes);
    if (error) throw error;
    this.batches.push([...changes]);
  }

  async fetchRoster(): Promise<never> {
    throw new RemoteError('server', 'not used');
  }
}

let dbCount = 0;
let db: FieldDatabase;
let repo: FieldRepository;
let remote: FakeRemote;
let sync: WorkLogSync;

beforeEach(() => {
  // Dexie keeps the first indexedDB it sees: a fresh name per test instead.
  db = new FieldDatabase(`field-test-${++dbCount}`);
  repo = new FieldRepository(db);
  remote = new FakeRemote();
  sync = new WorkLogSync(db, remote, { batchSize: 2, now: () => NOW });
});

afterEach(() => db.close());

describe('WorkLogSync', () => {
  it('sends pending logs in batches, oldest first, and marks them synced', async () => {
    const logs = [log(), log(), log()];
    for (const l of [...logs].reverse()) await repo.addLog(FARM, l);

    expect(await sync.flush()).toEqual({
      sent: 3,
      rejected: 0,
      pending: 0,
      stoppedBy: null,
    });
    expect(remote.batches.map((b) => b.map((c) => c.log.id))).toEqual([
      [logs[0]?.id, logs[1]?.id],
      [logs[2]?.id],
    ]);
    expect(remote.batches[0]?.[0]).toMatchObject({
      op: 'create',
      farmId: FARM,
    });
    const row = await db.logs.get(logs[0]?.id as string);
    expect(row).toMatchObject({
      status: 'synced',
      op: null,
      syncedAt: NOW.toISOString(),
    });
    expect(await repo.lastSyncAt()).toBe(NOW.toISOString());
  });

  it('keeps everything pending with no signal, and carries on later', async () => {
    await repo.addLog(FARM, log());
    await repo.addLog(FARM, log());
    remote.failWith = () => new RemoteError('offline', 'no signal');

    expect(await sync.flush()).toEqual({
      sent: 0,
      rejected: 0,
      pending: 2,
      stoppedBy: 'offline',
    });
    expect((await db.logs.toArray()).map((r) => r.attempts)).toEqual([1, 1]);
    expect(await repo.lastSyncAt()).toBeNull();

    remote.failWith = null;
    expect(await sync.flush()).toMatchObject({ sent: 2, pending: 0 });
    expect((await db.logs.toArray()).every((r) => r.attempts === 0)).toBe(true);
  });

  it('stops on an expired session without blaming the data', async () => {
    await repo.addLog(FARM, log());
    remote.failWith = () => new RemoteError('auth', 'JWT expired');
    expect(await sync.flush()).toMatchObject({ stoppedBy: 'auth', pending: 1 });
    expect((await db.logs.toArray())[0]?.status).toBe('pending');
  });

  it('treats an unexpected error as a server problem to retry', async () => {
    await repo.addLog(FARM, log());
    remote.onPush = async () => {
      throw new TypeError('boom');
    };
    expect(await sync.flush()).toMatchObject({
      stoppedBy: 'server',
      pending: 1,
    });
  });

  it('isolates the one entry the server refuses', async () => {
    const good = log();
    const bad = log({ workerId: 'deleted-worker' });
    await repo.addLog(FARM, good);
    await repo.addLog(FARM, bad);
    remote.failWith = (batch) =>
      batch.some((c) => c.log.workerId === 'deleted-worker')
        ? new RemoteError('rejected', 'violates foreign key constraint')
        : null;

    expect(await sync.flush()).toEqual({
      sent: 1,
      rejected: 1,
      pending: 0,
      stoppedBy: null,
    });
    expect(await db.logs.get(bad.id)).toMatchObject({
      status: 'rejected',
      error: 'violates foreign key constraint',
    });
    expect((await db.logs.get(good.id))?.status).toBe('synced');

    // Another flush leaves the refused entry alone.
    remote.batches = [];
    expect(await sync.flush()).toMatchObject({ sent: 0, rejected: 0 });
    expect(remote.batches).toEqual([]);
  });

  it('sends an edit to a synced entry as an update', async () => {
    const entry = log();
    await repo.addLog(FARM, entry);
    await sync.flush();
    await repo.updateLog(entry.id, { kg: 310 });

    expect(await db.logs.get(entry.id)).toMatchObject({
      status: 'pending',
      op: 'update',
      rev: 2,
    });
    remote.batches = [];
    await sync.flush();
    expect(remote.batches[0]?.[0]).toMatchObject({
      op: 'update',
      log: { id: entry.id, kg: 310 },
    });
  });

  it('never loses an edit made while the entry was on its way', async () => {
    const entry = log();
    await repo.addLog(FARM, entry);
    remote.onPush = async () => {
      remote.onPush = null;
      await repo.updateLog(entry.id, { kg: 999 });
    };

    expect(await sync.flush()).toMatchObject({ sent: 1, pending: 1 });
    // The server has the first version; the edit waits, as an update.
    expect(await db.logs.get(entry.id)).toMatchObject({
      status: 'pending',
      op: 'update',
      kg: 999,
      syncedAt: NOW.toISOString(),
    });
    remote.batches = [];
    await sync.flush();
    expect(remote.batches[0]?.[0]).toMatchObject({
      op: 'update',
      log: { kg: 999 },
    });
    expect((await db.logs.get(entry.id))?.status).toBe('synced');
  });

  it('picks up entries saved during a run in the same run', async () => {
    await repo.addLog(FARM, log());
    const late = log();
    remote.onPush = async () => {
      remote.onPush = null;
      await repo.addLog(FARM, late);
    };
    expect(await sync.flush()).toMatchObject({ sent: 2, pending: 0 });
  });

  it('runs one sync at a time; callers meanwhile share it', async () => {
    await repo.addLog(FARM, log());
    let release!: () => void;
    remote.onPush = () =>
      new Promise<void>((resolve) => {
        release = resolve;
      });
    const first = sync.flush();
    const second = sync.flush();
    expect(second).toBe(first);
    await new Promise((r) => setTimeout(r, 10));
    release();
    await first;
    expect(remote.batches).toHaveLength(1);
    // Once it's over, a new call starts a new run.
    const next = sync.flush();
    expect(next).not.toBe(first);
    await next;
  });
});
