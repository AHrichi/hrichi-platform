import * as v from 'valibot';
import { AGE_POLICIES, signupAge, youngestAge } from './age';
import {
  BADGE_STEP_SECONDS,
  badgeCode,
  badgeStep,
  badgeToken,
  parseBadge,
  parseTypedBadge,
  secondsUntilNextBadge,
  verifyBadge,
  verifyBadgeCode,
} from './badge';
import { type CheckIn, checkInProblem, type PlaySession } from './checkin';
import { formatCode, hashCode, newCode, normalizeCode } from './codes';
import { newId, randomBytes, toBase64Url } from './crypto';
import { cleanName, handleKey, handleProblem, nameProblem } from './players';
import {
  sessionExpiry,
  shouldRenew,
  signSession,
  verifySession,
} from './session-token';
import {
  type Gear,
  gearQr,
  mapSize,
  normalizeGearLabel,
  parseGearScan,
} from './venue';
import { CheckInSchema, SignupStartSchema } from './wire';

const SECRET = 'a-test-secret-that-is-long-enough-for-hmac';
const NOW = new Date('2026-11-27T12:00:00Z');

describe('codes', () => {
  it('makes 10 readable characters and shows them in two halves', () => {
    const code = newCode();
    expect(code).toMatch(/^[0-9A-HJKMNP-TV-Z]{10}$/);
    expect(formatCode('4K7Q9XMD2B')).toBe('4K7Q9-XMD2B');
  });

  it('reads a code however it was typed', () => {
    expect(normalizeCode('4k7q9-xmd2b')).toBe('4K7Q9XMD2B');
    expect(normalizeCode(' 4K7Q9 XMD2B ')).toBe('4K7Q9XMD2B');
    // O, I, L and U are read as the characters people meant.
    expect(normalizeCode('OOOOO-IIIII')).toBe('0000011111');
    expect(normalizeCode('4K7Q9')).toBeNull();
    expect(normalizeCode('4K7Q9-XMD2!')).toBeNull();
  });

  it('hashes a code per kind, so a claim code is never a recovery code', async () => {
    const claim = await hashCode('guest-claim', '4K7Q9XMD2B');
    expect(claim).toMatch(/^[0-9a-f]{64}$/);
    expect(await hashCode('recovery', '4K7Q9XMD2B')).not.toBe(claim);
  });
});

describe('session tokens', () => {
  const playerId = newId();

  it('round-trips and expires', async () => {
    const expiresAt = sessionExpiry(NOW);
    const token = await signSession(SECRET, { playerId, expiresAt });
    expect(token.startsWith('b1.')).toBe(true);
    const claims = await verifySession(SECRET, token, NOW);
    expect(claims?.playerId).toBe(playerId);
    expect(
      await verifySession(SECRET, token, new Date(expiresAt.getTime() + 1000)),
    ).toBeNull();
  });

  it('refuses a changed token or another secret', async () => {
    const token = await signSession(SECRET, {
      playerId,
      expiresAt: sessionExpiry(NOW),
    });
    const other = newId();
    expect(
      await verifySession(SECRET, token.replace(playerId, other), NOW),
    ).toBeNull();
    expect(await verifySession(`${SECRET}x`, token, NOW)).toBeNull();
    expect(await verifySession(SECRET, 'b1.nope', NOW)).toBeNull();
  });

  it('refuses a short secret', async () => {
    await expect(
      signSession('short', { playerId, expiresAt: NOW }),
    ).rejects.toThrow(/32/);
  });

  it('asks for renewal in the last 15 days', () => {
    const fresh = { playerId, expiresAt: sessionExpiry(NOW) };
    expect(shouldRenew(fresh, NOW)).toBe(false);
    const late = { playerId, expiresAt: new Date(NOW.getTime() + 86_400_000) };
    expect(shouldRenew(late, NOW)).toBe(true);
  });
});

describe('badges', () => {
  const playerId = newId();
  const key = toBase64Url(randomBytes(32));

  it('changes every 30 seconds', async () => {
    const a = await badgeToken(key, playerId, NOW);
    const b = await badgeToken(
      key,
      playerId,
      new Date(NOW.getTime() + BADGE_STEP_SECONDS * 1000),
    );
    expect(a).not.toBe(b);
    expect(a).toMatch(/^B1\.[0-9a-f-]{36}\.\d+\.[A-Za-z0-9_-]{16}$/);
  });

  it('is accepted within one step either side, and not after', async () => {
    const badge = parseBadge(await badgeToken(key, playerId, NOW));
    expect(badge).not.toBeNull();
    if (!badge) return;
    const at = (seconds: number) => new Date(NOW.getTime() + seconds * 1000);
    expect(await verifyBadge(badge, key, NOW)).toBe(true);
    expect(await verifyBadge(badge, key, at(30))).toBe(true);
    expect(await verifyBadge(badge, key, at(-30))).toBe(true);
    expect(await verifyBadge(badge, key, at(65))).toBe(false);
  });

  it('refuses another key or a changed badge', async () => {
    const token = await badgeToken(key, playerId, NOW);
    const badge = parseBadge(token);
    if (!badge) throw new Error('parse');
    const other = toBase64Url(randomBytes(32));
    expect(await verifyBadge(badge, other, NOW)).toBe(false);
    const someoneElse = parseBadge(token.replace(playerId, newId()));
    if (!someoneElse) throw new Error('parse');
    expect(await verifyBadge(someoneElse, key, NOW)).toBe(false);
    expect(parseBadge('hello')).toBeNull();
    expect(parseBadge(gearQr(newId()))).toBeNull();
  });

  it('gives a six-digit code that follows the badge', async () => {
    const code = await badgeCode(key, playerId, NOW);
    expect(code).toMatch(/^[0-9]{6}$/);
    expect(await verifyBadgeCode(code, key, playerId, NOW)).toBe(true);
    expect(
      await verifyBadgeCode(
        code,
        key,
        playerId,
        new Date(NOW.getTime() + 90_000),
      ),
    ).toBe(false);
    expect(
      await verifyBadgeCode(code, toBase64Url(randomBytes(32)), playerId, NOW),
    ).toBe(false);
    expect(parseTypedBadge('@nour_7 482 193')).toEqual({
      handle: 'nour_7',
      code: '482193',
    });
    expect(parseTypedBadge('nour_7 4821')).toBeNull();
  });

  it('says how long the badge on screen has left', () => {
    const start = new Date(badgeStep(NOW) * BADGE_STEP_SECONDS * 1000);
    expect(secondsUntilNextBadge(start)).toBe(30);
    expect(secondsUntilNextBadge(new Date(start.getTime() + 29_500))).toBe(1);
  });
});

describe('names', () => {
  it('accepts Latin or Arabic handles', () => {
    expect(handleProblem('nour_7')).toBeNull();
    expect(handleProblem('أمين')).toBeNull();
    expect(handleProblem('Sniper99')).toBeNull();
  });

  it('refuses short, long, odd, mixed-script and reserved handles', () => {
    expect(handleProblem('ab')).toBe('too-short');
    expect(handleProblem('a'.repeat(21))).toBe('too-long');
    expect(handleProblem('7nour')).toBe('characters');
    expect(handleProblem('nour 7')).toBe('characters');
    expect(handleProblem('nourأمين')).toBe('characters');
    expect(handleProblem('BARQ')).toBe('reserved');
    expect(handleProblem('Admin')).toBe('reserved');
  });

  it('compares handles without case or Arabic letter variants', () => {
    expect(handleKey('Nour')).toBe(handleKey('nour'));
    expect(handleKey('أمين')).toBe(handleKey('امين'));
    expect(handleKey('مُنى')).toBe(handleKey('مني'));
  });

  it('cleans display names and refuses hidden direction marks', () => {
    expect(cleanName('  Nour   Ben  Ali ')).toBe('Nour Ben Ali');
    expect(nameProblem('Nour', 1, 30)).toBeNull();
    expect(nameProblem('a\u202Eb', 1, 30)).toBe('characters');
    expect(nameProblem(' ', 1, 30)).toBe('too-short');
  });
});

describe('age', () => {
  const tn = AGE_POLICIES.TN;

  it('takes the youngest age a birth year allows', () => {
    expect(youngestAge(2013, NOW)).toBe(12);
  });

  it('asks for a guardian under 13 and marks minors under 18', () => {
    expect(signupAge(2013, tn, NOW)).toBe('guardian-required');
    expect(signupAge(2012, tn, NOW)).toBe('minor');
    expect(signupAge(2008, tn, NOW)).toBe('minor');
    expect(signupAge(2007, tn, NOW)).toBe('adult');
  });

  it('refuses impossible years', () => {
    expect(signupAge(2027, tn, NOW)).toBe('invalid');
    expect(signupAge(1900, tn, NOW)).toBe('invalid');
    expect(signupAge(2000.5, tn, NOW)).toBe('invalid');
  });
});

describe('venue and gear', () => {
  it('uses a placeholder size until the map is measured', () => {
    const map = {
      id: newId(),
      venueId: newId(),
      name: 'Warehouse',
      indoor: true,
    };
    expect(mapSize({ ...map, size: null })).toEqual({
      widthM: 30,
      lengthM: 20,
      measured: false,
    });
    expect(mapSize({ ...map, size: { widthM: 42, lengthM: 18 } })).toEqual({
      widthM: 42,
      lengthM: 18,
      measured: true,
    });
  });

  it('reads gear stickers and typed labels', () => {
    const id = newId();
    expect(parseGearScan(gearQr(id))).toEqual({ by: 'id', gearId: id });
    expect(parseGearScan('v7')).toEqual({ by: 'label', label: 'V-07' });
    expect(parseGearScan('B - 112')).toEqual({ by: 'label', label: 'B-112' });
    expect(parseGearScan('BG1.not-an-id')).toBeNull();
    expect(normalizeGearLabel('X-07')).toBeNull();
    expect(normalizeGearLabel('V-0')).toBeNull();
  });
});

describe('check-in rules', () => {
  const venueId = newId();
  const session: PlaySession = {
    id: newId(),
    venueId,
    mapId: newId(),
    openedAt: NOW.toISOString(),
    closedAt: null,
    capacity: 2,
  };
  const vest = (status: Gear['status'] = 'ready'): Gear => ({
    id: newId(),
    venueId,
    kind: 'vest',
    label: 'V-01',
    pairedWith: null,
    status,
  });
  const nour = { kind: 'player', id: newId() } as const;
  const guest = { kind: 'guest', id: newId() } as const;
  const on = (wearer: CheckIn['wearer'], vestId: string): CheckIn => ({
    id: newId(),
    sessionId: session.id,
    wearer,
    vestId,
    blasterId: null,
    at: NOW.toISOString(),
    releasedAt: null,
  });

  it('lets a free wearer take a free, ready vest', () => {
    expect(checkInProblem(session, [], nour, vest())).toBeNull();
  });

  it('refuses a wearer twice, a vest twice, and a full session', () => {
    const v1 = vest();
    const v2 = vest();
    const v3 = vest();
    expect(checkInProblem(session, [on(nour, v1.id)], nour, v2)).toBe(
      'already-checked-in',
    );
    expect(checkInProblem(session, [on(nour, v1.id)], guest, v1)).toBe(
      'vest-in-use',
    );
    expect(
      checkInProblem(
        session,
        [on(nour, v1.id), on({ kind: 'guest', id: newId() }, v2.id)],
        guest,
        v3,
      ),
    ).toBe('session-full');
  });

  it('frees the wearer and the vest once released', () => {
    const v1 = vest();
    const released = { ...on(nour, v1.id), releasedAt: NOW.toISOString() };
    expect(checkInProblem(session, [released], nour, v1)).toBeNull();
  });

  it('refuses a closed session, a blaster, and gear on charge', () => {
    expect(
      checkInProblem(
        { ...session, closedAt: NOW.toISOString() },
        [],
        nour,
        vest(),
      ),
    ).toBe('session-closed');
    expect(
      checkInProblem(session, [], nour, { ...vest(), kind: 'blaster' }),
    ).toBe('not-a-vest');
    expect(checkInProblem(session, [], nour, vest('charging'))).toBe(
      'gear-not-ready',
    );
  });
});

describe('wire schemas', () => {
  it('checks the sign-up body shape', () => {
    const ok = v.safeParse(SignupStartSchema, {
      handle: 'nour_7',
      displayName: 'Nour',
      birthYear: 2001,
      language: 'ar',
      country: 'TN',
    });
    expect(ok.success).toBe(true);
    expect(
      v.safeParse(SignupStartSchema, {
        handle: 'nour_7',
        displayName: 'Nour',
        birthYear: '2001',
        language: 'de',
        country: 'TN',
      }).success,
    ).toBe(false);
  });

  it('caps text lengths', () => {
    expect(v.safeParse(CheckInSchema, { gear: 'x'.repeat(201) }).success).toBe(
      false,
    );
  });
});
