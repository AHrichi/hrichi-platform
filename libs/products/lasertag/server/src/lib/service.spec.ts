import {
  badgeToken,
  FIRST_VENUE_SLUG,
  gearQr,
} from '@ah/products/lasertag/domain';
import {
  fakeCredential,
  fakePasskeys,
  runRepositoryContract,
} from '../testing';
import { FIRST_GEAR, FIRST_MAP } from './first-venue';
import { MemoryRepository } from './memory-repository';
import { createService, ServiceError } from './service';

runRepositoryContract('memory', () => new MemoryRepository(), {
  describe,
  it,
  expect,
});

const SECRET = 'a-test-secret-that-is-long-enough-for-hmac';
const BOOTSTRAP = 'open-sesame-warehouse';

function setup() {
  let clock = new Date('2026-11-27T10:00:00Z');
  const repo = new MemoryRepository();
  const passkeys = fakePasskeys();
  const service = createService({
    repo,
    passkeys,
    secret: SECRET,
    bootstrapCode: BOOTSTRAP,
    now: () => clock,
  });
  const advance = (ms: number) => {
    clock = new Date(clock.getTime() + ms);
  };

  async function signUp(handle = 'nour_7', birthYear = 2001) {
    const started = await service.signupStart({
      handle,
      displayName: 'Nour',
      birthYear,
      language: 'ar',
      country: 'TN',
    });
    return service.signupFinish({
      challengeId: started.challengeId,
      credential: fakeCredential(`cred-${handle}`, passkeys.lastChallenge()),
    });
  }

  async function manager() {
    const boss = await signUp('boss_1');
    await service.staffClaim(boss.token, FIRST_VENUE_SLUG, { code: BOOTSTRAP });
    return boss;
  }

  return {
    service,
    repo,
    passkeys,
    advance,
    signUp,
    manager,
    now: () => clock,
  };
}

/** The service's refusal code, or 'resolved'. */
async function refusal(promise: Promise<unknown>) {
  try {
    await promise;
    return 'resolved';
  } catch (error) {
    if (error instanceof ServiceError) {
      return error.detail ? `${error.code}:${error.detail}` : error.code;
    }
    throw error;
  }
}

describe('sign-up and sign-in with a passkey', () => {
  it('creates a player, a badge key and a session', async () => {
    const { service, signUp } = setup();
    const signed = await signUp();
    expect(signed.player.handle).toBe('nour_7');
    expect(signed.player.minor).toBe(false);
    expect(signed.badgeKey).toMatch(/^[A-Za-z0-9_-]{43}$/);
    const me = await service.me(signed.token);
    expect(me.player.id).toBe(signed.player.id);
  });

  it('marks minors and refuses under-13s without a guardian', async () => {
    const { service, signUp } = setup();
    expect((await signUp('rayen_16', 2009)).player.minor).toBe(true);
    expect(
      await refusal(
        service.signupStart({
          handle: 'small_one',
          displayName: 'S',
          birthYear: 2014,
          language: 'fr',
          country: 'TN',
        }),
      ),
    ).toBe('GUARDIAN_REQUIRED');
  });

  it('refuses bad, reserved and taken handles, and bad bodies', async () => {
    const { service, signUp } = setup();
    const start = (handle: string) =>
      service.signupStart({
        handle,
        displayName: 'X',
        birthYear: 2000,
        language: 'en',
        country: 'TN',
      });
    expect(await refusal(start('7up'))).toBe('HANDLE_INVALID:characters');
    expect(await refusal(start('barq'))).toBe('HANDLE_INVALID:reserved');
    await signUp('nour_7');
    expect(await refusal(start('Nour_7'))).toBe('HANDLE_TAKEN');
    expect(await refusal(service.signupStart({ handle: 3 }))).toBe(
      'BAD_REQUEST',
    );
  });

  it('loses a race for a handle cleanly', async () => {
    const { service, passkeys } = setup();
    const body = {
      displayName: 'A',
      birthYear: 2000,
      language: 'en',
      country: 'TN',
    } as const;
    const first = await service.signupStart({ ...body, handle: 'same_name' });
    const firstChallenge = passkeys.lastChallenge();
    const second = await service.signupStart({ ...body, handle: 'same_name' });
    await service.signupFinish({
      challengeId: second.challengeId,
      credential: fakeCredential('cred-b', passkeys.lastChallenge()),
    });
    expect(
      await refusal(
        service.signupFinish({
          challengeId: first.challengeId,
          credential: fakeCredential('cred-a', firstChallenge),
        }),
      ),
    ).toBe('HANDLE_TAKEN');
  });

  it('uses a ceremony once and within five minutes', async () => {
    const { service, passkeys, advance } = setup();
    const body = {
      handle: 'late_one',
      displayName: 'L',
      birthYear: 2000,
      language: 'en',
      country: 'TN',
    } as const;
    const started = await service.signupStart(body);
    advance(6 * 60_000);
    expect(
      await refusal(
        service.signupFinish({
          challengeId: started.challengeId,
          credential: fakeCredential('c', passkeys.lastChallenge()),
        }),
      ),
    ).toBe('CHALLENGE_EXPIRED');
    const again = await service.signupStart(body);
    const finish = {
      challengeId: again.challengeId,
      credential: fakeCredential('c2', passkeys.lastChallenge()),
    };
    await service.signupFinish(finish);
    expect(await refusal(service.signupFinish(finish))).toBe(
      'CHALLENGE_EXPIRED',
    );
  });

  it('signs in with a known passkey only', async () => {
    const { service, passkeys, signUp } = setup();
    const signed = await signUp();
    const started = await service.signinStart();
    const back = await service.signinFinish({
      challengeId: started.challengeId,
      credential: fakeCredential('cred-nour_7', passkeys.lastChallenge()),
    });
    expect(back.player.id).toBe(signed.player.id);

    const other = await service.signinStart();
    expect(
      await refusal(
        service.signinFinish({
          challengeId: other.challengeId,
          credential: fakeCredential('cred-unknown', passkeys.lastChallenge()),
        }),
      ),
    ).toBe('PASSKEY_FAILED');
  });

  it('refuses a forged or missing session', async () => {
    const { service } = setup();
    expect(await refusal(service.me(null))).toBe('UNAUTHORIZED');
    expect(await refusal(service.me('b1.forged.1.x'))).toBe('UNAUTHORIZED');
  });
});

describe('staff', () => {
  it('lets the first person claim an empty venue with the code, once', async () => {
    const { service, signUp } = setup();
    const a = await signUp('first_one');
    const b = await signUp('second_one');
    expect(
      await refusal(
        service.staffClaim(a.token, FIRST_VENUE_SLUG, {
          code: 'wrong-code-here',
        }),
      ),
    ).toBe('FORBIDDEN');
    const view = await service.staffClaim(a.token, FIRST_VENUE_SLUG, {
      code: BOOTSTRAP,
    });
    expect(view.staff).toEqual([{ venue: FIRST_VENUE_SLUG, role: 'manager' }]);
    expect(
      await refusal(
        service.staffClaim(b.token, FIRST_VENUE_SLUG, { code: BOOTSTRAP }),
      ),
    ).toBe('FORBIDDEN');
  });

  it('shows the venue to staff only', async () => {
    const { service, signUp, manager } = setup();
    const player = await signUp();
    expect(await refusal(service.venue(player.token, FIRST_VENUE_SLUG))).toBe(
      'FORBIDDEN',
    );
    const boss = await manager();
    const venue = await service.venue(boss.token, FIRST_VENUE_SLUG);
    expect(venue.gear).toHaveLength(24);
    expect(venue.maps[0].size).toBeNull();
  });
});

describe('guests', () => {
  it('creates a guest with a claim code that a player can use once', async () => {
    const { service, signUp, manager } = setup();
    const boss = await manager();
    const created = await service.createGuest(boss.token, FIRST_VENUE_SLUG, {
      nickname: '  Rayen  ',
    });
    expect(created.guest.nickname).toBe('Rayen');
    expect(created.claimCode).toMatch(/^[0-9A-Z]{5}-[0-9A-Z]{5}$/);

    const player = await signUp();
    const claimed = await service.claimGuest(player.token, {
      code: created.claimCode.toLowerCase(),
    });
    expect(claimed.claimedBy).toBe(player.player.id);
    expect(
      await refusal(
        service.claimGuest(player.token, { code: created.claimCode }),
      ),
    ).toBe('CODE_INVALID');
  });

  it('refuses odd nicknames and expired codes', async () => {
    const { service, signUp, manager, advance } = setup();
    const boss = await manager();
    expect(
      await refusal(
        service.createGuest(boss.token, FIRST_VENUE_SLUG, { nickname: 'x' }),
      ),
    ).toBe('NAME_INVALID:too-short');
    const created = await service.createGuest(boss.token, FIRST_VENUE_SLUG, {
      nickname: 'Late',
    });
    advance(31 * 86_400_000);
    const player = await signUp();
    expect(
      await refusal(
        service.claimGuest(player.token, { code: created.claimCode }),
      ),
    ).toBe('CODE_INVALID');
    expect((await service.sweep()).guests).toBe(1);
  });
});

describe('sessions and check-in', () => {
  async function ready() {
    const s = setup();
    const boss = await s.manager();
    const opened = await s.service.openSession(boss.token, FIRST_VENUE_SLUG, {
      mapId: FIRST_MAP.id,
    });
    return { ...s, boss, sessionId: opened.session.id, opened };
  }

  it('opens a session sized by the ready vests', async () => {
    const { opened } = await ready();
    expect(opened.session.capacity).toBe(12);
    expect(opened.roster).toEqual([]);
  });

  it('checks in a player by badge and a guest by id, with their gear', async () => {
    const { service, boss, sessionId, signUp, now } = await ready();
    const nour = await signUp();
    const badge = await badgeToken(nour.badgeKey, nour.player.id, now());
    let view = await service.checkIn(boss.token, sessionId, {
      badge,
      gear: gearQr(FIRST_GEAR[0].id),
    });
    expect(view.roster[0]).toMatchObject({
      name: '@nour_7',
      vest: 'V-01',
      blaster: 'B-01',
    });

    const guest = await service.createGuest(boss.token, FIRST_VENUE_SLUG, {
      nickname: 'Rayen',
    });
    // A blaster's label works too: the paired vest is the one worn.
    view = await service.checkIn(boss.token, sessionId, {
      guestId: guest.guest.id,
      gear: 'b2',
    });
    expect(view.roster[1]).toMatchObject({ name: 'Rayen', vest: 'V-02' });
  });

  it('refuses a stale badge, a vest in use and a second check-in', async () => {
    const { service, boss, sessionId, signUp, now, advance } = await ready();
    const nour = await signUp();
    const old = await badgeToken(nour.badgeKey, nour.player.id, now());
    advance(120_000);
    expect(
      await refusal(
        service.checkIn(boss.token, sessionId, { badge: old, gear: 'V-01' }),
      ),
    ).toBe('BADGE_INVALID');

    const fresh = await badgeToken(nour.badgeKey, nour.player.id, now());
    await service.checkIn(boss.token, sessionId, {
      badge: fresh,
      gear: 'V-01',
    });
    expect(
      await refusal(
        service.checkIn(boss.token, sessionId, { badge: fresh, gear: 'V-03' }),
      ),
    ).toBe('CHECKIN_REFUSED:already-checked-in');

    const guest = await service.createGuest(boss.token, FIRST_VENUE_SLUG, {
      nickname: 'Rayen',
    });
    expect(
      await refusal(
        service.checkIn(boss.token, sessionId, {
          guestId: guest.guest.id,
          gear: 'v1',
        }),
      ),
    ).toBe('CHECKIN_REFUSED:vest-in-use');
    expect(
      await refusal(
        service.checkIn(boss.token, sessionId, {
          guestId: guest.guest.id,
          gear: 'V-99',
        }),
      ),
    ).toBe('GEAR_UNKNOWN');
  });

  it('releases gear, and closing a session releases everyone', async () => {
    const { service, boss, sessionId, now, signUp } = await ready();
    const nour = await signUp();
    const badge = await badgeToken(nour.badgeKey, nour.player.id, now());
    const view = await service.checkIn(boss.token, sessionId, {
      badge,
      gear: 'V-01',
    });
    const released = await service.release(
      boss.token,
      view.roster[0].checkInId,
    );
    expect(released.roster).toEqual([]);

    await service.checkIn(boss.token, sessionId, { badge, gear: 'V-01' });
    const closed = await service.closeSession(boss.token, sessionId);
    expect(closed.session.closedAt).not.toBeNull();
    expect(closed.roster).toEqual([]);
    expect(await service.openSessions(boss.token, FIRST_VENUE_SLUG)).toEqual(
      [],
    );
  });

  it('keeps players who are not staff out of sessions', async () => {
    const { service, sessionId, signUp } = await ready();
    const nour = await signUp();
    expect(await refusal(service.session(nour.token, sessionId))).toBe(
      'FORBIDDEN',
    );
  });
});

describe('recovery', () => {
  it('lets staff give a code that registers a new passkey, once', async () => {
    const { service, passkeys, signUp, manager, repo } = setup();
    const boss = await manager();
    const nour = await signUp();
    const issued = await service.issueRecovery(boss.token, FIRST_VENUE_SLUG, {
      handle: '@Nour_7',
    });
    const started = await service.recoveryStart({ code: issued.code });
    const back = await service.recoveryFinish({
      challengeId: started.challengeId,
      credential: fakeCredential('cred-new-phone', passkeys.lastChallenge()),
    });
    expect(back.player.id).toBe(nour.player.id);
    expect(await repo.passkeysOf(nour.player.id)).toHaveLength(2);
    expect(await refusal(service.recoveryStart({ code: issued.code }))).toBe(
      'CODE_INVALID',
    );
    expect(repo.audits.map((a) => a.action)).toEqual([
      'staff.bootstrap',
      'recovery.issued',
      'recovery.used',
    ]);
  });
});
