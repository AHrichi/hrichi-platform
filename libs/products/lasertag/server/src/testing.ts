import { newId } from '@ah/products/lasertag/domain';
import { FIRST_GEAR, FIRST_MAP, FIRST_VENUE } from './lib/first-venue';
import type { Ceremony, PasskeyVerifier, StoredPasskey } from './lib/passkeys';
import type { LasertagRepository, PlayerRow } from './lib/repository';

/**
 * A passkey verifier for tests. A "credential" is
 * `{ id, rawId, type: 'public-key', response: { challenge, signCount? } }`:
 * it passes when it echoes the challenge, which is what a real
 * authenticator's signature proves.
 */
export function fakePasskeys(): PasskeyVerifier & {
  readonly lastChallenge: () => string;
} {
  let last = '';
  const ceremony = (): Ceremony => {
    last = `challenge-${newId()}`;
    return { options: { challenge: last }, challenge: last };
  };
  const echo = (credential: unknown, challenge: string) => {
    const c = credential as {
      id?: string;
      response?: { challenge?: string; signCount?: number };
    };
    return c.response?.challenge === challenge && c.id ? c : null;
  };
  return {
    lastChallenge: () => last,
    async registrationOptions() {
      return ceremony();
    },
    async verifyRegistration(credential, challenge) {
      const c = echo(credential, challenge);
      return c?.id
        ? {
            id: c.id,
            publicKey: 'fake-key',
            counter: 0,
            transports: ['internal'],
          }
        : null;
    },
    async authenticationOptions() {
      return ceremony();
    },
    async verifyAuthentication(credential, challenge, stored: StoredPasskey) {
      const c = echo(credential, challenge);
      if (!c || c.id !== stored.id) return null;
      return c.response?.signCount ?? stored.counter + 1;
    },
  };
}

/** What a browser would send back for the last ceremony. */
export function fakeCredential(
  id: string,
  challenge: string,
  signCount?: number,
) {
  return {
    id,
    rawId: id,
    type: 'public-key' as const,
    response: { challenge, ...(signCount === undefined ? {} : { signCount }) },
  };
}

type Suite = (name: string, body: () => void) => void;
type Test = (name: string, body: () => Promise<void>) => void;
interface Expect {
  (value: unknown): {
    toBe(expected: unknown): void;
    toEqual(expected: unknown): void;
    toBeNull(): void;
    toHaveLength(length: number): void;
  };
}

const player = (overrides: Partial<PlayerRow> = {}): PlayerRow => ({
  id: newId(),
  handle: 'nour_7',
  handleKey: 'nour_7',
  displayName: 'Nour',
  language: 'ar',
  country: 'TN',
  birthYear: 2001,
  minor: false,
  badgeKey: 'k'.repeat(43),
  createdAt: '2026-11-27T10:00:00.000Z',
  ...overrides,
});

/**
 * What every store must do, for the memory store and the D1 store alike.
 * Pass the test runner's functions so this file doesn't import one.
 */
export function runRepositoryContract(
  name: string,
  make: () => Promise<LasertagRepository> | LasertagRepository,
  { describe, it, expect }: { describe: Suite; it: Test; expect: Expect },
): void {
  describe(`${name} repository contract`, () => {
    it('keeps handles unique by key', async () => {
      const repo = await make();
      expect(await repo.insertPlayer(player())).toBe('ok');
      expect(await repo.insertPlayer(player({ handle: 'NOUR_7' }))).toBe(
        'handle-taken',
      );
      const found = await repo.playerByHandleKey('nour_7');
      expect(found?.displayName).toBe('Nour');
    });

    it('stores passkeys and their counters', async () => {
      const repo = await make();
      const p = player();
      await repo.insertPlayer(p);
      await repo.insertPasskey({
        id: 'cred-1',
        playerId: p.id,
        publicKey: 'pk',
        counter: 0,
        transports: ['internal', 'hybrid'],
        createdAt: p.createdAt,
        lastUsedAt: null,
      });
      await repo.touchPasskey('cred-1', 5, '2026-11-27T11:00:00.000Z');
      const stored = await repo.passkeyById('cred-1');
      expect(stored?.counter).toBe(5);
      expect(stored?.transports).toEqual(['internal', 'hybrid']);
      expect(await repo.passkeysOf(p.id)).toHaveLength(1);
    });

    it('gives a challenge out once', async () => {
      const repo = await make();
      const row = {
        id: newId(),
        kind: 'signin' as const,
        challenge: 'c',
        expiresAt: '2026-11-27T10:05:00.000Z',
        data: null,
      };
      await repo.putChallenge(row);
      expect(await repo.takeChallenge(row.id)).toEqual(row);
      expect(await repo.takeChallenge(row.id)).toBeNull();
    });

    it('has the first venue with its map and 24 pieces of gear', async () => {
      const repo = await make();
      const venue = await repo.venueBySlug(FIRST_VENUE.slug);
      expect(venue).toEqual(FIRST_VENUE);
      expect(await repo.mapsOf(FIRST_VENUE.id)).toEqual([FIRST_MAP]);
      const gear = await repo.gearOf(FIRST_VENUE.id);
      expect(gear).toEqual(
        [...FIRST_GEAR].sort((a, b) => a.label.localeCompare(b.label)),
      );
    });

    it('lets a guest be claimed once, and moves their check-ins', async () => {
      const repo = await make();
      const p = player();
      await repo.insertPlayer(p);
      const guestId = newId();
      await repo.insertGuest({
        id: guestId,
        venueId: FIRST_VENUE.id,
        nickname: 'Rayen',
        claimHash: 'h1',
        createdAt: '2026-11-27T10:00:00.000Z',
        expiresAt: '2026-12-27T10:00:00.000Z',
        claimedBy: null,
      });
      const sessionId = newId();
      await repo.insertSession({
        id: sessionId,
        venueId: FIRST_VENUE.id,
        mapId: FIRST_MAP.id,
        openedAt: '2026-11-27T10:00:00.000Z',
        closedAt: null,
        capacity: 12,
      });
      await repo.insertCheckIn({
        id: newId(),
        sessionId,
        wearer: { kind: 'guest', id: guestId },
        vestId: FIRST_GEAR[0].id,
        blasterId: FIRST_GEAR[1].id,
        at: '2026-11-27T10:01:00.000Z',
        releasedAt: null,
      });
      expect((await repo.guestByClaimHash('h1'))?.id).toBe(guestId);
      expect(await repo.claimGuest(guestId, p.id)).toBe(true);
      expect(await repo.claimGuest(guestId, p.id)).toBe(false);
      const [moved] = await repo.checkInsOf(sessionId);
      expect(moved.wearer).toEqual({ kind: 'player', id: p.id });
    });

    it('deletes unclaimed guests once expired', async () => {
      const repo = await make();
      await repo.insertGuest({
        id: newId(),
        venueId: FIRST_VENUE.id,
        nickname: 'Old',
        claimHash: 'h2',
        createdAt: '2026-10-01T10:00:00.000Z',
        expiresAt: '2026-10-31T10:00:00.000Z',
        claimedBy: null,
      });
      expect(await repo.deleteExpiredGuests('2026-11-27T10:00:00.000Z')).toBe(
        1,
      );
      expect(await repo.guestByClaimHash('h2')).toBeNull();
    });

    it('uses a recovery code once, and not after it expires', async () => {
      const repo = await make();
      const p = player();
      await repo.insertPlayer(p);
      const base = {
        playerId: p.id,
        venueId: FIRST_VENUE.id,
        issuedBy: p.id,
        usedAt: null,
      };
      await repo.insertRecovery({
        ...base,
        hash: 'r1',
        expiresAt: '2026-11-28T10:00:00.000Z',
      });
      await repo.insertRecovery({
        ...base,
        hash: 'r2',
        expiresAt: '2026-11-26T10:00:00.000Z',
      });
      const at = '2026-11-27T10:00:00.000Z';
      expect(await repo.useRecovery('r1', at)).toBe(true);
      expect(await repo.useRecovery('r1', at)).toBe(false);
      expect(await repo.useRecovery('r2', at)).toBe(false);
    });

    it('allows one active check-in per vest and per wearer', async () => {
      const repo = await make();
      const sessionId = newId();
      await repo.insertSession({
        id: sessionId,
        venueId: FIRST_VENUE.id,
        mapId: FIRST_MAP.id,
        openedAt: '2026-11-27T10:00:00.000Z',
        closedAt: null,
        capacity: 12,
      });
      const base = {
        sessionId,
        blasterId: null,
        at: '2026-11-27T10:01:00.000Z',
        releasedAt: null,
      };
      const first = {
        ...base,
        id: newId(),
        wearer: { kind: 'guest' as const, id: newId() },
        vestId: FIRST_GEAR[0].id,
      };
      expect(await repo.insertCheckIn(first)).toBe('ok');
      expect(
        await repo.insertCheckIn({
          ...base,
          id: newId(),
          wearer: { kind: 'guest', id: newId() },
          vestId: FIRST_GEAR[0].id,
        }),
      ).toBe('conflict');
      expect(
        await repo.insertCheckIn({
          ...base,
          id: newId(),
          wearer: first.wearer,
          vestId: FIRST_GEAR[2].id,
        }),
      ).toBe('conflict');
      expect(
        await repo.releaseCheckIn(first.id, '2026-11-27T10:30:00.000Z'),
      ).toBe(true);
      expect(
        await repo.insertCheckIn({
          ...base,
          id: newId(),
          wearer: first.wearer,
          vestId: FIRST_GEAR[0].id,
        }),
      ).toBe('ok');
    });

    it('closes a session and releases what is still checked in', async () => {
      const repo = await make();
      const sessionId = newId();
      await repo.insertSession({
        id: sessionId,
        venueId: FIRST_VENUE.id,
        mapId: FIRST_MAP.id,
        openedAt: '2026-11-27T10:00:00.000Z',
        closedAt: null,
        capacity: 12,
      });
      await repo.insertCheckIn({
        id: newId(),
        sessionId,
        wearer: { kind: 'guest', id: newId() },
        vestId: FIRST_GEAR[0].id,
        blasterId: null,
        at: '2026-11-27T10:01:00.000Z',
        releasedAt: null,
      });
      expect(await repo.openSessionsOf(FIRST_VENUE.id)).toHaveLength(1);
      await repo.closeSession(sessionId, '2026-11-27T11:00:00.000Z');
      expect(await repo.openSessionsOf(FIRST_VENUE.id)).toHaveLength(0);
      const [released] = await repo.checkInsOf(sessionId);
      expect(released.releasedAt).toBe('2026-11-27T11:00:00.000Z');
    });

    it('records staff roles', async () => {
      const repo = await make();
      const p = player();
      await repo.insertPlayer(p);
      expect(await repo.staffCount(FIRST_VENUE.id)).toBe(0);
      await repo.addStaff({
        venueId: FIRST_VENUE.id,
        playerId: p.id,
        role: 'manager',
        since: p.createdAt,
      });
      expect(await repo.staffRole(FIRST_VENUE.id, p.id)).toBe('manager');
      expect(await repo.staffOf(p.id)).toEqual([
        { venueSlug: FIRST_VENUE.slug, role: 'manager' },
      ]);
    });
  });
}
