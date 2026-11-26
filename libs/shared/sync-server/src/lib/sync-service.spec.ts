import type { SyncRecord, SyncResult } from '@ah/shared/sync';
import { describe, expect, it } from 'vitest';
import { runSyncRepositoryContract } from '../testing';
import { InMemorySyncRepository } from './memory-repository';
import { type SyncOutcome, SyncService } from './sync-service';

runSyncRepositoryContract('memory', async () => new InMemorySyncRepository());

const SECRET = 's'.repeat(40);
const SPEC = {
  app: 'demo',
  kinds: { item: { maxBytes: 200 }, note: { maxBytes: 2000 } },
};

function setup(quota?: { records?: number; bytes?: number }) {
  let now = new Date('2026-11-26T10:00:00.000Z');
  let ids = 0;
  const service = new SyncService({
    repository: new InMemorySyncRepository(),
    secret: SECRET,
    specs: [SPEC],
    now: () => now,
    newId: () => `00000000-0000-4000-8000-${String(++ids).padStart(12, '0')}`,
    quota,
  });
  return {
    service,
    tick: (ms: number) => (now = new Date(now.getTime() + ms)),
    at: () => now.toISOString(),
  };
}

function ok<T>(outcome: SyncOutcome<T>): T {
  if (!outcome.body || !(outcome.body as { ok: boolean }).ok) {
    throw new Error(JSON.stringify(outcome.body));
  }
  return outcome.body as T;
}

async function twoDevices() {
  const state = setup();
  const phone = ok(
    await state.service.createSpace({ v: 1, app: 'demo', deviceName: 'Phone' }),
  );
  const { code } = ok(await state.service.startPairing(phone.token));
  const laptop = ok(
    await state.service.claim({
      v: 1,
      app: 'demo',
      code: code.toLowerCase(),
      deviceName: ' Laptop ',
    }),
  );
  return { ...state, phone, laptop };
}

const item = (
  key: string,
  by: string,
  updatedAt: string,
  data: unknown = { key },
): SyncRecord => ({ kind: 'item', key, by, updatedAt, data });

describe('SyncService', () => {
  it('starts a space, and links a second device with a one-use code', async () => {
    const { service, phone, laptop } = await twoDevices();
    expect(laptop.spaceId).toBe(phone.spaceId);
    expect(laptop.deviceId).not.toBe(phone.deviceId);
    const { devices } = ok(await service.devices(laptop.token));
    expect(devices.map((d) => [d.name, d.current])).toEqual([
      ['Phone', false],
      ['Laptop', true],
    ]);
  });

  it('refuses a code twice, late, mistyped or for another app', async () => {
    const { service, tick } = setup();
    const phone = ok(
      await service.createSpace({ v: 1, app: 'demo', deviceName: 'Phone' }),
    );
    const first = ok(await service.startPairing(phone.token));
    const claim = (code: string, app = 'demo') =>
      service.claim({ v: 1, app, code, deviceName: 'Other' });
    expect((await claim(first.code, 'other-app')).body).toMatchObject({
      code: 'CODE_INVALID',
    });
    // A wrong app used the code up: a new one is needed.
    expect((await claim(first.code)).body).toMatchObject({
      code: 'CODE_INVALID',
    });
    const second = ok(await service.startPairing(phone.token));
    expect((await claim('ZZZZ-ZZZZ')).body).toMatchObject({
      code: 'CODE_INVALID',
    });
    expect((await claim('not a code')).body).toMatchObject({
      code: 'CODE_INVALID',
    });
    tick(11 * 60_000);
    expect((await claim(second.code)).body).toMatchObject({
      code: 'CODE_INVALID',
    });
    expect(
      (await service.createSpace({ v: 1, app: 'nope', deviceName: 'X' })).body,
    ).toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('hands one device’s edits to the other, the later edit winning', async () => {
    const { service, phone, laptop, tick } = await twoDevices();
    const pushed = ok(
      await service.sync(phone.token, {
        v: 1,
        cursor: 0,
        push: [
          item('a', phone.deviceId, '2026-11-26T10:00:00.000Z'),
          item('b', phone.deviceId, '2026-11-26T10:00:00.000Z'),
        ],
      }),
    );
    expect(pushed.rejected).toEqual([]);
    expect(pushed.pull.map((r) => r.key)).toEqual(['a', 'b']);
    expect(pushed.usage).toMatchObject({ records: 2 });

    tick(60_000);
    const pulled = ok(
      await service.sync(laptop.token, { v: 1, cursor: 0, push: [] }),
    );
    expect(pulled.pull.map((r) => [r.key, r.by])).toEqual([
      ['a', phone.deviceId],
      ['b', phone.deviceId],
    ]);
    expect(pulled.more).toBe(false);

    // The laptop edits a; the phone's older edit of a arrives later.
    const later = ok(
      await service.sync(laptop.token, {
        v: 1,
        cursor: pulled.cursor,
        push: [
          item('a', laptop.deviceId, '2026-11-26T10:01:00.000Z', { v: 2 }),
        ],
      }),
    );
    expect(later.pull.map((r) => r.data)).toEqual([{ v: 2 }]);
    const stale = ok(
      await service.sync(phone.token, {
        v: 1,
        cursor: pushed.cursor,
        push: [
          item('a', phone.deviceId, '2026-11-26T10:00:30.000Z', { v: 'x' }),
        ],
      }),
    );
    expect(stale.rejected).toEqual([
      expect.objectContaining({ key: 'a', reason: 'stale' }),
    ]);
    expect(stale.pull.map((r) => r.data)).toEqual([{ v: 2 }]);
  });

  it('refuses records it can’t keep, and says why', async () => {
    const { service, phone, laptop } = await twoDevices();
    const result = ok(
      await service.sync(phone.token, {
        v: 1,
        cursor: 0,
        push: [
          {
            ...item('k', phone.deviceId, '2026-11-26T10:00:00.000Z'),
            kind: 'other',
          },
          item('spoof', laptop.deviceId, '2026-11-26T10:00:00.000Z'),
          item('list', phone.deviceId, '2026-11-26T10:00:00.000Z', [1, 2]),
          {
            ...item('gone', phone.deviceId, '2026-11-26T10:00:00.000Z'),
            deleted: true,
          },
          item('future', phone.deviceId, '2026-11-26T10:06:00.000Z'),
          item('big', phone.deviceId, '2026-11-26T10:00:00.000Z', {
            text: 'x'.repeat(300),
          }),
          {
            kind: 'item',
            key: 'deleted',
            by: phone.deviceId,
            updatedAt: '2026-11-26T10:00:00.000Z',
            deleted: true,
          },
        ],
      }),
    );
    expect(result.rejected.map((r) => [r.key, r.reason])).toEqual([
      ['k', 'invalid'],
      ['spoof', 'invalid'],
      ['list', 'invalid'],
      ['gone', 'invalid'],
      ['future', 'clock_ahead'],
      ['big', 'too_large'],
    ]);
    expect(result.pull.map((r) => [r.key, r.deleted])).toEqual([
      ['deleted', true],
    ]);
  });

  it('keeps a space within its quota, and lets deletions through', async () => {
    const { service } = setup({ records: 2 });
    const phone = ok(
      await service.createSpace({ v: 1, app: 'demo', deviceName: 'Phone' }),
    );
    const t = '2026-11-26T10:00:00.000Z';
    const result = ok(
      await service.sync(phone.token, {
        v: 1,
        cursor: 0,
        push: [
          item('a', phone.deviceId, t),
          item('b', phone.deviceId, t),
          item('c', phone.deviceId, t),
        ],
      }),
    );
    expect(result.rejected).toEqual([
      expect.objectContaining({ key: 'c', reason: 'quota' }),
    ]);
    expect(result.usage).toMatchObject({ records: 2, maxRecords: 2 });
    const freed = ok(
      await service.sync(phone.token, {
        v: 1,
        cursor: result.cursor,
        push: [
          {
            kind: 'item',
            key: 'a',
            by: phone.deviceId,
            updatedAt: '2026-11-26T10:00:01.000Z',
            deleted: true,
          },
        ],
      }),
    );
    expect(freed.rejected).toEqual([]);
  });

  it('pulls a long history in rounds', async () => {
    const { service, phone, laptop } = await twoDevices();
    for (let round = 0; round < 5; round++) {
      ok(
        await service.sync(phone.token, {
          v: 1,
          cursor: 0,
          push: Array.from({ length: 50 }, (_, i) =>
            item(`r${round}-${i}`, phone.deviceId, '2026-11-26T10:00:00.000Z'),
          ),
        }),
      );
    }
    const first: SyncResult = ok(
      await service.sync(laptop.token, { v: 1, cursor: 0, push: [] }),
    );
    expect(first.pull).toHaveLength(200);
    expect(first.more).toBe(true);
    const second = ok(
      await service.sync(laptop.token, {
        v: 1,
        cursor: first.cursor,
        push: [],
      }),
    );
    expect(second.pull).toHaveLength(50);
    expect(second.more).toBe(false);
  });

  it('unlinks a device at once, and deletes the cloud copy', async () => {
    const { service, phone, laptop } = await twoDevices();
    ok(await service.revoke(phone.token, laptop.deviceId));
    expect(
      (await service.sync(laptop.token, { v: 1, cursor: 0, push: [] })).body,
    ).toMatchObject({ code: 'REVOKED' });
    expect(ok(await service.devices(phone.token)).devices).toHaveLength(1);
    expect(
      (
        await service.revoke(
          phone.token,
          '00000000-0000-4000-8000-999999999999',
        )
      ).body,
    ).toMatchObject({ code: 'NOT_FOUND' });

    ok(await service.deleteSpace(phone.token));
    expect(
      (await service.sync(phone.token, { v: 1, cursor: 0, push: [] })).body,
    ).toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('refuses a missing or forged token', async () => {
    const { service, phone } = await twoDevices();
    expect((await service.devices(null)).status).toBe(401);
    expect((await service.devices(`${phone.token}x`)).status).toBe(401);
    expect(
      (await service.sync(phone.token, { v: 1, cursor: -1, push: [] })).body,
    ).toMatchObject({ code: 'BAD_REQUEST' });
  });

  it('renews a token that nears its end', async () => {
    const { service, phone, tick } = await twoDevices();
    expect(
      ok(await service.sync(phone.token, { v: 1, cursor: 0, push: [] })).token,
    ).toBeUndefined();
    tick(160 * 86_400_000);
    const renewed = ok(
      await service.sync(phone.token, { v: 1, cursor: 0, push: [] }),
    ).token;
    expect(renewed).toMatch(/^s1\./);
    tick(30 * 86_400_000);
    // The old one has expired; the renewed one still works.
    expect(
      (await service.sync(phone.token, { v: 1, cursor: 0, push: [] })).status,
    ).toBe(401);
    expect(
      (await service.sync(renewed ?? '', { v: 1, cursor: 0, push: [] })).status,
    ).toBe(200);
  });

  it('cleans up spent codes and idle spaces each day', async () => {
    const { service, phone, tick } = await twoDevices();
    ok(await service.startPairing(phone.token));
    tick(366 * 86_400_000);
    expect(await service.sweep()).toEqual({ pairings: 2, spaces: 1 });
  });
});
