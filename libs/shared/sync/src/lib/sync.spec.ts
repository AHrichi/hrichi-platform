import * as v from 'valibot';
import { describe, expect, it } from 'vitest';
import { syncSpecProblems } from './app-spec';
import {
  formatPairingCode,
  hashPairingCode,
  newPairingCode,
  normalizePairingCode,
} from './pairing';
import { compareRevisions, incomingWins } from './record';
import { signSyncToken, verifySyncToken } from './token';
import { SyncRequestSchema } from './wire';

const SECRET = 'x'.repeat(40);
const SPACE = '6f1d2c3b-4a59-4e6f-8a7b-9c0d1e2f3a4b';
const DEVICE = '0a1b2c3d-4e5f-4a6b-8c7d-9e0f1a2b3c4d';
const NOW = new Date('2026-11-26T12:00:00.000Z');

describe('a device’s token', () => {
  it('names its space and device until it expires', async () => {
    const expiresAt = new Date('2027-05-01T00:00:00.000Z');
    const token = await signSyncToken(SECRET, {
      spaceId: SPACE,
      deviceId: DEVICE,
      expiresAt,
    });
    expect(token).toMatch(/^s1\.[0-9a-f-]{36}\.[0-9a-f-]{36}\.\d+\.[\w-]+$/);
    expect(await verifySyncToken(SECRET, token, NOW)).toEqual({
      spaceId: SPACE,
      deviceId: DEVICE,
      expiresAt,
    });
    expect(
      await verifySyncToken(SECRET, token, new Date('2027-05-02T00:00:00Z')),
    ).toBeNull();
  });

  it('is refused when changed, or signed with another secret', async () => {
    const token = await signSyncToken(SECRET, {
      spaceId: SPACE,
      deviceId: DEVICE,
      expiresAt: new Date('2027-01-01T00:00:00Z'),
    });
    const other = DEVICE.replace('0a1b', '9a1b');
    expect(
      await verifySyncToken(SECRET, token.replace(DEVICE, other), NOW),
    ).toBeNull();
    expect(await verifySyncToken('y'.repeat(40), token, NOW)).toBeNull();
    expect(await verifySyncToken(SECRET, 'v1.a.b.c', NOW)).toBeNull();
    await expect(
      signSyncToken('short', {
        spaceId: SPACE,
        deviceId: DEVICE,
        expiresAt: NOW,
      }),
    ).rejects.toThrow(/32/);
  });
});

describe('the code that links a device', () => {
  it('is 8 characters people can read back', () => {
    const codes = Array.from({ length: 200 }, newPairingCode);
    for (const code of codes) {
      expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{8}$/);
      expect(normalizePairingCode(code)).toBe(code);
    }
    expect(new Set(codes).size).toBe(200);
    expect(formatPairingCode('4K7Q9XMD')).toBe('4K7Q-9XMD');
  });

  it('forgives case, spaces, dashes and look-alike letters', () => {
    expect(normalizePairingCode(' 4k7q-9xmd ')).toBe('4K7Q9XMD');
    expect(normalizePairingCode('OIL0-ABCD')).toBe('0110ABCD');
    expect(normalizePairingCode('4K7Q-9XM')).toBeNull();
    expect(normalizePairingCode('4K7Q-9XM!')).toBeNull();
  });

  it('is kept only as a hash', async () => {
    const hash = await hashPairingCode('4K7Q9XMD');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashPairingCode('4K7Q9XMD')).toBe(hash);
    expect(await hashPairingCode('4K7Q9XME')).not.toBe(hash);
  });
});

describe('which version wins', () => {
  it('is the later edit, then the larger device id', () => {
    const a = { updatedAt: '2026-11-26T10:00:00.000Z', by: 'a' };
    const b = { updatedAt: '2026-11-26T10:00:01.000Z', by: 'a' };
    expect(compareRevisions(a, b)).toBe(-1);
    expect(incomingWins(a, b)).toBe(true);
    expect(incomingWins(b, a)).toBe(false);
    expect(incomingWins(a, { ...a, by: 'b' })).toBe(true);
    expect(incomingWins(a, a)).toBe(false);
    expect(incomingWins(null, a)).toBe(true);
  });
});

describe('a sync request', () => {
  const record = {
    kind: 'project',
    key: 'gh_1',
    updatedAt: '2026-11-26T10:00:00.000Z',
    by: DEVICE,
    data: { title: 'North' },
  };

  it('carries records with a kind, a key, a time and their device', () => {
    expect(
      v.safeParse(SyncRequestSchema, { v: 1, cursor: 0, push: [record] })
        .success,
    ).toBe(true);
    for (const broken of [
      { ...record, kind: 'Project' },
      { ...record, key: '' },
      { ...record, updatedAt: '26/11/2026' },
      { ...record, by: 'phone' },
      { ...record, extra: true },
    ]) {
      expect(
        v.safeParse(SyncRequestSchema, { v: 1, cursor: 0, push: [broken] })
          .success,
      ).toBe(false);
    }
    expect(
      v.safeParse(SyncRequestSchema, {
        v: 1,
        cursor: 0,
        push: Array.from({ length: 51 }, () => record),
      }).success,
    ).toBe(false);
  });
});

describe('an app’s spec', () => {
  it('names slug kinds of a size the server takes', () => {
    expect(
      syncSpecProblems({ app: 'demo', kinds: { item: { maxBytes: 1000 } } }),
    ).toEqual([]);
    expect(
      syncSpecProblems({
        app: 'Demo',
        kinds: { Item: { maxBytes: 0 } },
      }),
    ).toHaveLength(3);
  });
});
