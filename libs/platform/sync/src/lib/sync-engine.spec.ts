import {
  createEnvironmentInjector,
  EnvironmentInjector,
  provideZonelessChangeDetection,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { recordId, type StoredRecord, type SyncRecord } from '@ah/shared/sync';
import { InMemorySyncRepository, SyncService } from '@ah/shared/sync-server';
import { webcrypto } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { SyncLocalStore } from './sync.model';
import { deviceKind, provideSync, SyncEngine } from './sync-engine';
import {
  SYNC_TRANSPORT,
  type SyncReply,
  type SyncTransport,
} from './sync-transport';

// jsdom's crypto has no `subtle`; the server in this process signs with it.
if (!globalThis.crypto?.subtle) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    configurable: true,
  });
}

const SPEC = { app: 'demo', kinds: { item: { maxBytes: 1000 } } };

/** An app's data and outbox, in memory: records by kind and key. */
class MemoryLocal implements SyncLocalStore {
  readonly items = new Map<string, SyncRecord>();
  readonly box = new Map<string, SyncRecord>();
  deviceId = '';

  edit(key: string, data: object, at = new Date().toISOString()): void {
    const record = {
      kind: 'item',
      key,
      updatedAt: at,
      by: this.deviceId,
      data,
    };
    this.items.set(recordId(record), record);
    if (this.deviceId) this.box.set(recordId(record), record);
  }

  data(): Record<string, unknown> {
    return Object.fromEntries(
      [...this.items.values()].map((r) => [r.key, r.data]),
    );
  }

  async outbox(): Promise<SyncRecord[]> {
    return [...this.box.values()];
  }
  async acknowledge(
    records: readonly { kind: string; key: string; updatedAt: string }[],
  ): Promise<void> {
    for (const record of records) {
      const held = this.box.get(recordId(record));
      if (held && Date.parse(held.updatedAt) === Date.parse(record.updatedAt)) {
        this.box.delete(recordId(record));
      }
    }
  }
  async apply(records: readonly StoredRecord[]): Promise<void> {
    for (const stored of records) {
      const record: SyncRecord = {
        kind: stored.kind,
        key: stored.key,
        updatedAt: stored.updatedAt,
        by: stored.by,
        ...(stored.deleted ? { deleted: true } : { data: stored.data }),
      };
      this.items.set(recordId(record), record);
    }
  }
  async queueAll(deviceId: string): Promise<void> {
    this.deviceId = deviceId;
    for (const item of this.items.values()) {
      this.box.set(recordId(item), { ...item, by: deviceId });
    }
  }
  async clearOutbox(): Promise<void> {
    this.box.clear();
    this.deviceId = '';
  }
}

/** The sync server, in this process, as the transport reaches it. */
function serverTransport(service: SyncService) {
  let before: (() => void) | null = null;
  const transport: SyncTransport & { beforeReply(hook: () => void): void } = {
    beforeReply(hook) {
      before = hook;
    },
    async call<T>(
      method: string,
      path: string,
      options: { token?: string; body?: unknown } = {},
    ): Promise<SyncReply<T>> {
      const token = options.token ?? null;
      const device = path.match(/^\/v1\/devices\/(.+)$/)?.[1];
      const outcome =
        method === 'POST' && path === '/v1/spaces'
          ? await service.createSpace(options.body)
          : method === 'POST' && path === '/v1/pairings'
            ? await service.startPairing(token)
            : method === 'POST' && path === '/v1/pairings/claim'
              ? await service.claim(options.body)
              : method === 'GET' && path === '/v1/devices'
                ? await service.devices(token)
                : method === 'DELETE' && device
                  ? await service.revoke(token, device)
                  : method === 'DELETE' && path === '/v1/spaces/current'
                    ? await service.deleteSpace(token)
                    : await service.sync(token, options.body);
      const hook = before;
      before = null;
      hook?.();
      return outcome.body as SyncReply<T>;
    },
  };
  return transport;
}

/** Each test's devices, stopped after it (their timers and channels). */
const injectors: EnvironmentInjector[] = [];

function device(
  name: string,
  transport: SyncTransport,
): { engine: SyncEngine; local: MemoryLocal } {
  const local = new MemoryLocal();
  const injector = createEnvironmentInjector(
    [
      provideSync(() => ({
        app: 'demo',
        local,
        stateKey: `test.sync.${name}`,
      })),
      { provide: SYNC_TRANSPORT, useValue: transport },
    ],
    TestBed.inject(EnvironmentInjector),
  );
  injectors.push(injector);
  return { engine: injector.get(SyncEngine), local };
}

function setup() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  const service = new SyncService({
    repository: new InMemorySyncRepository(),
    secret: 'k'.repeat(40),
    specs: [SPEC],
  });
  const transport = serverTransport(service);
  return {
    service,
    transport,
    device: (name: string) => device(name, transport),
  };
}

async function linked() {
  const state = setup();
  const phone = state.device('phone');
  const laptop = state.device('laptop');
  phone.local.edit('north', { title: 'North' }, '2026-11-26T10:00:00.000Z');
  laptop.local.edit('south', { title: 'South' }, '2026-11-26T10:00:00.000Z');
  expect((await phone.engine.turnOn('Phone')).ok).toBe(true);
  const pairing = await phone.engine.linkCode();
  if (!pairing.ok) throw new Error('no code');
  expect((await laptop.engine.join(pairing.code, 'Laptop')).ok).toBe(true);
  await phone.engine.syncNow();
  return { ...state, phone, laptop };
}

describe('SyncEngine', () => {
  beforeEach(() => localStorage.clear());
  afterEach(() => {
    for (const injector of injectors.splice(0)) injector.destroy();
    localStorage.clear();
  });

  it('links two devices, and each ends up with both’s data', async () => {
    const { phone, laptop } = await linked();
    expect(phone.local.data()).toEqual({
      north: { title: 'North' },
      south: { title: 'South' },
    });
    expect(laptop.local.data()).toEqual(phone.local.data());
    expect(phone.local.box.size).toBe(0);
    expect(phone.engine.status()).toBe('synced');
    expect(phone.engine.usage()).toMatchObject({ records: 2 });
    expect(phone.engine.lastSyncAt()).not.toBeNull();
  });

  it('keeps the later of two edits made apart', async () => {
    const { phone, laptop } = await linked();
    phone.local.edit('north', { title: 'North A' }, '2026-11-26T11:00:00.000Z');
    laptop.local.edit(
      'north',
      { title: 'North B' },
      '2026-11-26T12:00:00.000Z',
    );
    await laptop.engine.syncNow();
    await phone.engine.syncNow();
    await laptop.engine.syncNow();
    expect(phone.local.data()['north']).toEqual({ title: 'North B' });
    expect(laptop.local.data()['north']).toEqual({ title: 'North B' });
  });

  it('keeps an edit made while a pull was on its way', async () => {
    const { phone, laptop, transport } = await linked();
    phone.local.edit('north', { title: 'Older' }, '2026-11-26T11:00:00.000Z');
    await phone.engine.syncNow();
    // The laptop's reader edits north as the older version arrives.
    transport.beforeReply(() =>
      laptop.local.edit(
        'north',
        { title: 'Newer' },
        '2026-11-26T11:30:00.000Z',
      ),
    );
    await laptop.engine.syncNow();
    expect(laptop.local.data()['north']).toEqual({ title: 'Newer' });
    await laptop.engine.syncNow();
    await phone.engine.syncNow();
    expect(phone.local.data()['north']).toEqual({ title: 'Newer' });
  });

  it('sends a long outbox in rounds', async () => {
    const { phone, laptop } = await linked();
    for (let i = 0; i < 120; i++) {
      phone.local.edit(`k${i}`, { i }, '2026-11-26T11:00:00.000Z');
    }
    await phone.engine.syncNow();
    expect(phone.local.box.size).toBe(0);
    await laptop.engine.syncNow();
    expect(Object.keys(laptop.local.data())).toHaveLength(122);
  });

  it('holds back what a fast clock wrote, and says so', async () => {
    const { phone } = await linked();
    phone.local.edit('later', { x: 1 }, '2027-01-01T00:00:00.000Z');
    await phone.engine.syncNow();
    expect(phone.engine.status()).toBe('attention');
    expect(phone.engine.problem()).toBe('clock');
    expect(phone.local.box.size).toBe(1);
  });

  it('stops on a device removed elsewhere, keeping its data', async () => {
    const { phone, laptop } = await linked();
    const laptopId = laptop.engine.deviceId() ?? '';
    expect((await phone.engine.removeDevice(laptopId)).ok).toBe(true);
    laptop.local.edit('west', { title: 'West' });
    await laptop.engine.syncNow();
    expect(laptop.engine.status()).toBe('removed');
    expect(laptop.engine.on()).toBe(false);
    expect(laptop.local.box.size).toBe(0);
    expect(laptop.local.data()['west']).toEqual({ title: 'West' });
    const left = await phone.engine.devices();
    expect(left.ok && left.devices.map((d) => d.name)).toEqual(['Phone']);
  });

  it('turns off here, or deletes the cloud copy', async () => {
    const { phone, laptop } = await linked();
    await laptop.engine.turnOffHere();
    expect(laptop.engine.status()).toBe('off');
    expect(localStorage.getItem('test.sync.laptop')).toBeNull();
    expect((await phone.engine.deleteCloudCopy()).ok).toBe(true);
    expect(phone.engine.on()).toBe(false);
    expect(phone.local.data()['north']).toEqual({ title: 'North' });
  });

  it('refuses a wrong code and stays off', async () => {
    const { device: make } = setup();
    const other = make('other');
    const reply = await other.engine.join('ZZZZ-ZZZZ', 'Other');
    expect(reply).toMatchObject({ ok: false, code: 'CODE_INVALID' });
    expect(other.engine.on()).toBe(false);
  });

  it('says when no sync server is set up, or the server can’t be reached', async () => {
    const { phone } = await linked();
    const stubbed = (code: 'NOT_CONFIGURED' | 'OFFLINE') =>
      device('stub', {
        call: async () => ({ ok: false, code }),
      });
    localStorage.setItem(
      'test.sync.stub',
      localStorage.getItem('test.sync.phone') ?? '',
    );
    const unset = stubbed('NOT_CONFIGURED');
    await unset.engine.syncNow();
    expect(unset.engine.status()).toBe('unavailable');
    const away = stubbed('OFFLINE');
    await away.engine.syncNow();
    expect(away.engine.status()).toBe('waiting');
    expect(phone.engine.on()).toBe(true);
  });

  it('names a device from its browser', () => {
    expect(deviceKind('Mozilla/5.0 (Linux; Android 15; Pixel 9)')).toBe(
      'android',
    );
    expect(deviceKind('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0)')).toBe(
      'iphone',
    );
    expect(deviceKind('Mozilla/5.0 (Windows NT 10.0; Win64; x64)')).toBe(
      'windows',
    );
    expect(deviceKind('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5)')).toBe(
      'mac',
    );
    expect(deviceKind('curl/8')).toBe('other');
  });
});
