import type { SyncRecord } from '@ah/shared/sync';
import { describe, expect, it } from 'vitest';
import type {
  DeviceRow,
  SpaceRow,
  SyncRepository,
  WriteRecord,
} from './lib/repository';

/** Ids for the contract's spaces and devices. */
export const CONTRACT_IDS = {
  spaceA: 'aaaaaaaa-0000-4000-8000-000000000001',
  spaceB: 'bbbbbbbb-0000-4000-8000-000000000002',
  phone: 'cccccccc-0000-4000-8000-000000000003',
  laptop: 'dddddddd-0000-4000-8000-000000000004',
  other: 'eeeeeeee-0000-4000-8000-000000000005',
} as const;

const T0 = '2026-11-26T10:00:00.000Z';

function space(id: string, lastSeenAt = T0): SpaceRow {
  return { id, app: 'demo', createdAt: T0, lastSeenAt };
}

function device(id: string, spaceId: string, name = 'Phone'): DeviceRow {
  return {
    id,
    spaceId,
    name,
    createdAt: T0,
    lastSeenAt: T0,
    revokedAt: null,
  };
}

function rec(
  key: string,
  updatedAt: string,
  data: unknown = { key },
  by: string = CONTRACT_IDS.phone,
): WriteRecord {
  return {
    kind: 'item',
    key,
    updatedAt,
    by,
    data,
    bytes: JSON.stringify(data).length,
  };
}

const strip = (r: SyncRecord & { seq?: number }) => ({
  key: r.key,
  updatedAt: r.updatedAt,
  data: r.data,
  deleted: r.deleted ?? false,
});

/**
 * What every place sync spaces are kept must do, run against an adapter
 * (`make` returns an empty one). The in-memory store and the Worker's D1
 * store both pass it.
 */
export function runSyncRepositoryContract(
  name: string,
  make: () => Promise<SyncRepository>,
): void {
  const { spaceA, spaceB, phone, laptop, other } = CONTRACT_IDS;

  async function twoSpaces() {
    const repo = await make();
    await repo.createSpace(space(spaceA), device(phone, spaceA));
    await repo.createSpace(space(spaceB), device(other, spaceB, 'Other'));
    return repo;
  }

  describe(`${name}: the sync repository contract`, () => {
    it('keeps spaces and their devices', async () => {
      const repo = await twoSpaces();
      await repo.addDevice(device(laptop, spaceA, 'Laptop'));
      expect(await repo.space(spaceA)).toEqual(space(spaceA));
      expect(
        await repo.space('ffffffff-0000-4000-8000-000000000009'),
      ).toBeNull();
      expect((await repo.devices(spaceA)).map((d) => d.name).sort()).toEqual([
        'Laptop',
        'Phone',
      ]);
      expect(await repo.device(laptop)).toEqual(
        device(laptop, spaceA, 'Laptop'),
      );

      await repo.seen(spaceA, laptop, '2026-11-26T11:00:00.000Z');
      expect((await repo.device(laptop))?.lastSeenAt).toBe(
        '2026-11-26T11:00:00.000Z',
      );
      expect((await repo.space(spaceA))?.lastSeenAt).toBe(
        '2026-11-26T11:00:00.000Z',
      );

      expect(await repo.revoke(spaceB, laptop, T0)).toBe(false);
      expect(
        await repo.revoke(spaceA, laptop, '2026-11-26T12:00:00.000Z'),
      ).toBe(true);
      expect((await repo.device(laptop))?.revokedAt).toBe(
        '2026-11-26T12:00:00.000Z',
      );
    });

    it('uses a code once, and not after it expires', async () => {
      const repo = await twoSpaces();
      await repo.addPairing({
        codeHash: 'h1',
        spaceId: spaceA,
        createdBy: phone,
        expiresAt: '2026-11-26T10:10:00.000Z',
      });
      await repo.addPairing({
        codeHash: 'h2',
        spaceId: spaceA,
        createdBy: phone,
        expiresAt: '2026-11-26T10:10:00.000Z',
      });
      expect(await repo.claimPairing('h1', '2026-11-26T10:05:00.000Z')).toEqual(
        {
          spaceId: spaceA,
        },
      );
      expect(
        await repo.claimPairing('h1', '2026-11-26T10:06:00.000Z'),
      ).toBeNull();
      expect(
        await repo.claimPairing('h2', '2026-11-26T10:10:00.000Z'),
      ).toBeNull();
      expect(await repo.claimPairing('nope', T0)).toBeNull();
    });

    it('numbers what it stores, and hands it back in order after a cursor', async () => {
      const repo = await twoSpaces();
      await repo.write(spaceA, [
        rec('a', '2026-11-26T10:00:01.000Z'),
        rec('b', '2026-11-26T10:00:02.000Z'),
        rec('c', '2026-11-26T10:00:03.000Z'),
      ]);
      const all = await repo.pull(spaceA, 0, 10);
      expect(all.map((r) => r.key)).toEqual(['a', 'b', 'c']);
      expect(all[0].seq).toBeLessThan(all[1].seq);
      expect(all[1].seq).toBeLessThan(all[2].seq);
      expect(all[0]).toMatchObject({
        kind: 'item',
        by: phone,
        data: { key: 'a' },
      });

      expect(
        (await repo.pull(spaceA, all[0].seq, 10)).map((r) => r.key),
      ).toEqual(['b', 'c']);
      expect((await repo.pull(spaceA, 0, 2)).map((r) => r.key)).toEqual([
        'a',
        'b',
      ]);

      // A new version moves to the end of the order.
      await repo.write(spaceA, [
        rec('a', '2026-11-26T10:00:04.000Z', { v: 2 }),
      ]);
      const after = await repo.pull(spaceA, all[2].seq, 10);
      expect(after.map(strip)).toEqual([
        {
          key: 'a',
          updatedAt: '2026-11-26T10:00:04.000Z',
          data: { v: 2 },
          deleted: false,
        },
      ]);
    });

    it('never stores an older version over a newer one', async () => {
      const repo = await twoSpaces();
      await repo.write(spaceA, [
        rec('a', '2026-11-26T10:00:05.000Z', { v: 'new' }),
      ]);
      await repo.write(spaceA, [
        rec('a', '2026-11-26T10:00:01.000Z', { v: 'old' }),
      ]);
      // Same time: the larger device id wins.
      await repo.write(spaceA, [
        rec('b', '2026-11-26T10:00:05.000Z', { v: 'phone' }, phone),
      ]);
      await repo.write(spaceA, [
        rec('b', '2026-11-26T10:00:05.000Z', { v: 'laptop' }, laptop),
      ]);
      await repo.write(spaceA, [
        rec('b', '2026-11-26T10:00:05.000Z', { v: 'phone again' }, phone),
      ]);
      const held = Object.fromEntries(
        (await repo.pull(spaceA, 0, 10)).map((r) => [r.key, r.data]),
      );
      expect(held).toEqual({ a: { v: 'new' }, b: { v: 'laptop' } });
    });

    it('keeps a deletion, so other devices learn of it', async () => {
      const repo = await twoSpaces();
      await repo.write(spaceA, [rec('a', '2026-11-26T10:00:01.000Z')]);
      await repo.write(spaceA, [
        {
          kind: 'item',
          key: 'a',
          updatedAt: '2026-11-26T10:00:02.000Z',
          by: phone,
          deleted: true,
          bytes: 0,
        },
      ]);
      const [gone] = await repo.pull(spaceA, 0, 10);
      expect(gone).toMatchObject({ key: 'a', deleted: true });
      expect(gone.data ?? null).toBeNull();
      expect(await repo.usage(spaceA)).toEqual({ records: 1, bytes: 0 });
    });

    it('reports stored versions and what a space holds', async () => {
      const repo = await twoSpaces();
      await repo.write(spaceA, [
        rec('a', '2026-11-26T10:00:01.000Z', { n: 1 }),
        rec('b', '2026-11-26T10:00:02.000Z', { n: 22 }),
      ]);
      const found = await repo.versions(spaceA, [
        { kind: 'item', key: 'a' },
        { kind: 'item', key: 'z' },
      ]);
      expect([...found.values()]).toEqual([
        {
          updatedAt: '2026-11-26T10:00:01.000Z',
          by: phone,
          bytes: JSON.stringify({ n: 1 }).length,
        },
      ]);
      expect(await repo.usage(spaceA)).toEqual({
        records: 2,
        bytes:
          JSON.stringify({ n: 1 }).length + JSON.stringify({ n: 22 }).length,
      });
    });

    it('keeps every space to itself', async () => {
      const repo = await twoSpaces();
      await repo.write(spaceA, [
        rec('same', '2026-11-26T10:00:01.000Z', { of: 'A' }),
      ]);
      await repo.write(spaceB, [
        rec('same', '2026-11-26T10:00:00.000Z', { of: 'B' }, other),
      ]);
      expect((await repo.pull(spaceB, 0, 10)).map((r) => r.data)).toEqual([
        { of: 'B' },
      ]);
      expect([
        ...(
          await repo.versions(spaceB, [{ kind: 'item', key: 'same' }])
        ).values(),
      ]).toEqual([expect.objectContaining({ by: other })]);
      expect(await repo.revoke(spaceB, phone, T0)).toBe(false);
      expect((await repo.devices(spaceB)).map((d) => d.id)).toEqual([other]);

      await repo.deleteSpace(spaceA);
      expect(await repo.space(spaceA)).toBeNull();
      expect(await repo.device(phone)).toBeNull();
      expect(await repo.pull(spaceA, 0, 10)).toEqual([]);
      expect(await repo.usage(spaceA)).toEqual({ records: 0, bytes: 0 });
      expect((await repo.pull(spaceB, 0, 10)).map((r) => r.data)).toEqual([
        { of: 'B' },
      ]);
    });

    it('sweeps used and expired codes, and idle spaces', async () => {
      const repo = await make();
      await repo.createSpace(
        space(spaceA, '2025-01-01T00:00:00.000Z'),
        device(phone, spaceA),
      );
      await repo.createSpace(space(spaceB), device(other, spaceB));
      await repo.write(spaceA, [rec('a', '2025-01-01T00:00:00.000Z')]);
      for (const [hash, expiresAt] of [
        ['used', '2026-11-26T10:10:00.000Z'],
        ['expired', '2026-11-26T09:00:00.000Z'],
        ['live', '2026-11-26T10:10:00.000Z'],
      ] as const) {
        await repo.addPairing({
          codeHash: hash,
          spaceId: spaceB,
          createdBy: other,
          expiresAt,
        });
      }
      await repo.claimPairing('used', T0);
      expect(await repo.sweep(T0, '2025-11-26T10:00:00.000Z')).toEqual({
        pairings: 2,
        spaces: 1,
      });
      expect(await repo.space(spaceA)).toBeNull();
      expect(await repo.pull(spaceA, 0, 10)).toEqual([]);
      expect(await repo.claimPairing('live', T0)).toEqual({ spaceId: spaceB });
    });
  });
}
