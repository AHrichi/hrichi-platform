import 'fake-indexeddb/auto';
import '@angular/compiler';
import { Injector, PLATFORM_ID } from '@angular/core';
import { IDBFactory } from 'fake-indexeddb';
import { SAMPLE_PROJECTS } from '@ah/products/serracalc/domain';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SerraDbService, STALL_MS } from './serra-db.service';

const NAME = 'serracalc_db_v1';

function service(): SerraDbService {
  return Injector.create({
    providers: [SerraDbService, { provide: PLATFORM_ID, useValue: 'browser' }],
  }).get(SerraDbService);
}

/** Another tab's connection, as an older or newer SerraCalc opens it. */
function openTab(version: number): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(NAME, version);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains('projects')) {
        request.result.createObjectStore('projects', { keyPath: 'id' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

describe('SerraDbService, with SerraCalc open in another tab', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
  });

  it('says an older tab holds the database, then opens once it lets go', async () => {
    // Version 1 never closes for an upgrade: builds before this didn't.
    const old = await openTab(1);
    const db = service();
    let projects: unknown[] | null = null;
    void db.getAllProjects().then((p) => (projects = p));

    await vi.waitFor(() => expect(db.state()).toBe('blocked'));
    expect(projects).toBeNull();

    old.close();
    await vi.waitFor(() => expect(projects).toEqual([]));
    expect(db.state()).toBe('ok');
  });

  it('lets a newer tab upgrade, then asks for a reload and stops saving', async () => {
    const db = service();
    await db.saveProject(structuredClone(SAMPLE_PROJECTS[0]));
    expect(db.state()).toBe('ok');

    // The newer tab (a version past this build's) isn't blocked: this one
    // closes its connection.
    const newer = await openTab(4);
    expect(newer.version).toBe(4);
    expect(db.state()).toBe('replaced');
    await expect(
      db.saveProject(structuredClone(SAMPLE_PROJECTS[1])),
    ).rejects.toThrow();
    newer.close();
  });
});

/**
 * Makes opens wait with no event at all, as in a browser whose queue is
 * stuck behind another request. The returned function lets them through.
 */
function holdOpens(): () => void {
  const factory = globalThis.indexedDB;
  const open = factory.open.bind(factory);
  const waiting: (() => void)[] = [];
  vi.spyOn(factory, 'open').mockImplementation((name, version) => {
    const request = {} as IDBOpenDBRequest;
    waiting.push(() => {
      const real = open(name, version);
      Object.defineProperty(request, 'result', { get: () => real.result });
      real.onupgradeneeded = (e) => request.onupgradeneeded?.call(real, e);
      real.onblocked = (e) => request.onblocked?.call(real, e);
      real.onsuccess = (e) => request.onsuccess?.call(real, e);
      real.onerror = (e) => request.onerror?.call(real, e);
    });
    return request;
  });
  return () => waiting.splice(0).forEach((go) => go());
}

describe('SerraDbService, when the browser doesn’t answer', () => {
  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    // fake-indexeddb runs on setImmediate, which stays real.
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('says so after a few seconds, and clears it once the open answers', async () => {
    const release = holdOpens();
    const db = service();
    let projects: unknown[] | null = null;
    void db.getAllProjects().then((p) => (projects = p));

    await vi.advanceTimersByTimeAsync(STALL_MS - 1);
    expect(db.state()).toBe('ok');
    await vi.advanceTimersByTimeAsync(1);
    expect(db.state()).toBe('stalled');
    expect(projects).toBeNull();

    release();
    await vi.waitFor(() => expect(projects).toEqual([]));
    expect(db.state()).toBe('ok');
  });

  it('stays quiet when the open answers in time', async () => {
    const db = service();
    await db.getAllProjects();
    await vi.advanceTimersByTimeAsync(STALL_MS * 2);
    expect(db.state()).toBe('ok');
  });

  it('keeps the clearer "another tab" notice when that is the reason', async () => {
    const old = await openTab(1);
    const db = service();
    const opened = db.getAllProjects();
    await vi.waitFor(() => expect(db.state()).toBe('blocked'));

    await vi.advanceTimersByTimeAsync(STALL_MS * 2);
    expect(db.state()).toBe('blocked');
    old.close();
    await expect(opened).resolves.toEqual([]);
  });
});

describe('SerraDbService, with cloud sync on', () => {
  const DEVICE = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
  const OTHER = '9a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
  const stored = new Map<string, string>();

  beforeEach(() => {
    globalThis.indexedDB = new IDBFactory();
    stored.clear();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => stored.get(key) ?? null,
      setItem: (key: string, value: string) => stored.set(key, value),
      removeItem: (key: string) => stored.delete(key),
    });
  });
  afterEach(() => vi.unstubAllGlobals());

  const turnOn = () =>
    stored.set(
      'ah.sync.serracalc',
      JSON.stringify({
        spaceId: 'aaaaaaaa-0000-4000-8000-000000000001',
        deviceId: DEVICE,
        token: 's1.x',
        cursor: 0,
        lastSyncAt: null,
      }),
    );
  const kinds = async (db: SerraDbService) =>
    (await db.syncOutbox()).map(
      (r) => `${r.kind} ${r.key}${r.deleted ? ' (deleted)' : ''}`,
    );

  it('writes no outbox while sync is off', async () => {
    const db = service();
    await db.saveProject(structuredClone(SAMPLE_PROJECTS[0]));
    expect(await db.syncOutbox()).toEqual([]);
    expect(db.outboxChanged()).toBe(0);
  });

  it('puts each change in the outbox with the project, as this device’s', async () => {
    turnOn();
    const db = service();
    const sample = structuredClone(SAMPLE_PROJECTS[0]);
    await db.saveProject(sample);
    const first = await db.syncOutbox();
    expect(first[0]).toMatchObject({
      kind: 'project',
      key: sample.id,
      by: DEVICE,
    });
    expect(first.length).toBe(1 + sample.calculations.length);
    expect(db.outboxChanged()).toBe(1);

    await db.syncAcknowledge(first);
    expect(await db.syncOutbox()).toEqual([]);

    await db.saveProject({ ...sample, title: 'Renamed' });
    expect(await kinds(db)).toEqual([`project ${sample.id}`]);
    await db.deleteProject(sample.id);
    expect((await kinds(db)).sort()).toEqual(
      [
        `project ${sample.id} (deleted)`,
        ...sample.calculations.map(
          (c) => `calculation ${sample.id}:${c.id} (deleted)`,
        ),
      ].sort(),
    );
  });

  it('keeps an edit made after a push in the outbox', async () => {
    turnOn();
    const db = service();
    const sample = structuredClone(SAMPLE_PROJECTS[0]);
    await db.saveProject(sample);
    const pushed = await db.syncOutbox();
    await new Promise((resolve) => setTimeout(resolve, 5));
    await db.saveProject({ ...sample, title: 'Edited again' });
    await db.syncAcknowledge(pushed);
    expect(await kinds(db)).toEqual([`project ${sample.id}`]);
  });

  it('saves other devices’ records, and queues everything on joining', async () => {
    turnOn();
    const db = service();
    const sample = structuredClone(SAMPLE_PROJECTS[1]);
    const { calculations, ...meta } = sample;
    await db.syncApply([
      {
        kind: 'project',
        key: sample.id,
        seq: 1,
        updatedAt: sample.updatedAt,
        by: OTHER,
        data: meta,
      },
      ...calculations.map((c, i) => ({
        kind: 'calculation',
        key: `${sample.id}:${c.id}`,
        seq: 2 + i,
        updatedAt: sample.updatedAt,
        by: OTHER,
        data: c,
      })),
    ]);
    const [got] = await db.getAllProjects();
    expect(got.title).toBe(sample.title);
    expect(got.calculations.map((c) => c.id).sort()).toEqual(
      calculations.map((c) => c.id).sort(),
    );
    // Applying other devices' records queues nothing.
    expect(await db.syncOutbox()).toEqual([]);

    await db.syncQueueAll(DEVICE);
    const queued = await db.syncOutbox();
    expect(queued).toHaveLength(1 + calculations.length);
    expect(queued.every((r) => r.updatedAt === sample.updatedAt)).toBe(true);
    await db.syncClearOutbox();
    expect(await db.syncOutbox()).toEqual([]);
  });
});
