import { badgeToken, FIRST_VENUE_SLUG } from '@ah/products/lasertag/domain';
import { createService } from '@ah/products/lasertag/server';
import {
  fakeCredential,
  fakePasskeys,
} from '@ah/products/lasertag/server/testing';
import { sqliteD1 } from '../tests/sqlite-d1';
import { D1LasertagRepository } from './d1-repository';
import { type Env, handleRequest } from './worker';

const ORIGIN = 'http://localhost:4315';
const SECRET = 'a-test-secret-that-is-long-enough-for-hmac';

function setup() {
  const db = sqliteD1();
  const env: Env = {
    DB: db,
    LASERTAG_TOKEN_SECRET: SECRET,
    LASERTAG_BOOTSTRAP_CODE: 'local-warehouse-claim',
    ALLOWED_ORIGINS: ORIGIN,
    RP_ID: 'localhost',
    RP_NAME: 'BARQ',
  };
  const passkeys = fakePasskeys();
  const lines: string[] = [];
  const service = createService({
    repo: new D1LasertagRepository(db),
    passkeys,
    secret: SECRET,
    bootstrapCode: env.LASERTAG_BOOTSTRAP_CODE ?? null,
  });
  const call = async (
    method: string,
    path: string,
    body?: unknown,
    token?: string,
    headers: Record<string, string> = {},
  ) => {
    const response = await handleRequest(
      new Request(`https://edge.test${path}`, {
        method,
        headers: {
          origin: ORIGIN,
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
          ...headers,
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      }),
      env,
      { service, log: (line) => lines.push(line) },
    );
    return {
      status: response.status,
      headers: response.headers,
      json: (await response.json()) as {
        ok: boolean;
        code?: string;
        detail?: string;
        data?: Record<string, unknown> & { [key: string]: unknown };
      },
    };
  };
  return { env, call, passkeys, lines };
}

describe('lasertag-edge', () => {
  it('answers health without an origin and says when it is ready', async () => {
    const { env } = setup();
    const response = await handleRequest(
      new Request('https://edge.test/health'),
      env,
    );
    expect(await response.json()).toEqual({ ok: true, ready: true });
    const bare = await handleRequest(new Request('https://edge.test/health'), {
      ...env,
      LASERTAG_TOKEN_SECRET: undefined,
    });
    expect(await bare.json()).toEqual({ ok: true, ready: false });
  });

  it('refuses other origins and is unavailable without a secret', async () => {
    const { env } = setup();
    const other = await handleRequest(
      new Request('https://edge.test/v1/me', {
        headers: { origin: 'https://evil.example' },
      }),
      env,
    );
    expect(other.status).toBe(403);
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
    const unset = await handleRequest(
      new Request('https://edge.test/v1/me', { headers: { origin: ORIGIN } }),
      { ...env, LASERTAG_TOKEN_SECRET: 'short' },
    );
    expect(unset.status).toBe(503);
  });

  it('answers preflight with CORS for the app', async () => {
    const { env } = setup();
    const response = await handleRequest(
      new Request('https://edge.test/v1/signup/start', {
        method: 'OPTIONS',
        headers: { origin: ORIGIN },
      }),
      env,
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(response.headers.get('access-control-allow-headers')).toContain(
      'authorization',
    );
  });

  it('signs up, signs in, and shows the player', async () => {
    const { call, passkeys } = setup();
    const start = await call('POST', '/v1/signup/start', {
      handle: 'nour_7',
      displayName: 'Nour',
      birthYear: 2001,
      language: 'ar',
      country: 'TN',
    });
    expect(start.status).toBe(200);
    const finish = await call('POST', '/v1/signup/finish', {
      challengeId: start.json.data?.['challengeId'],
      credential: fakeCredential('cred-1', passkeys.lastChallenge()),
    });
    expect(finish.status).toBe(200);
    const token = finish.json.data?.['token'] as string;
    const me = await call('GET', '/v1/me', undefined, token);
    expect((me.json.data?.['player'] as { handle: string }).handle).toBe(
      'nour_7',
    );
    expect(me.headers.get('cache-control')).toBe('no-store');
  });

  it('turns refusals into codes, with details', async () => {
    const { call } = setup();
    const bad = await call('POST', '/v1/signup/start', {
      handle: '1bad',
      displayName: 'X',
      birthYear: 2001,
      language: 'en',
      country: 'TN',
    });
    expect(bad.status).toBe(422);
    expect(bad.json).toMatchObject({
      ok: false,
      code: 'HANDLE_INVALID',
      detail: 'characters',
    });
    expect((await call('GET', '/v1/me')).status).toBe(401);
    expect((await call('GET', '/v1/nowhere')).json.code).toBe('NOT_FOUND');
  });

  it('refuses non-JSON and bodies over the cap', async () => {
    const { env } = setup();
    const notJson = await handleRequest(
      new Request('https://edge.test/v1/signup/start', {
        method: 'POST',
        headers: { origin: ORIGIN, 'content-type': 'text/plain' },
        body: 'hi',
      }),
      env,
    );
    expect(notJson.status).toBe(400);
    const huge = await handleRequest(
      new Request('https://edge.test/v1/signup/start', {
        method: 'POST',
        headers: { origin: ORIGIN, 'content-type': 'application/json' },
        body: JSON.stringify({ handle: 'x'.repeat(40_000) }),
      }),
      env,
    );
    expect(huge.status).toBe(413);
  });

  it('runs a check-in end to end over HTTP', async () => {
    const { call, passkeys, lines } = setup();
    const signUp = async (handle: string) => {
      const start = await call('POST', '/v1/signup/start', {
        handle,
        displayName: handle,
        birthYear: 1999,
        language: 'fr',
        country: 'TN',
      });
      const done = await call('POST', '/v1/signup/finish', {
        challengeId: start.json.data?.['challengeId'],
        credential: fakeCredential(`cred-${handle}`, passkeys.lastChallenge()),
      });
      return done.json.data as unknown as {
        token: string;
        badgeKey: string;
        player: { id: string };
      };
    };
    const boss = await signUp('boss_1');
    const claim = await call(
      'POST',
      `/v1/venues/${FIRST_VENUE_SLUG}/staff-claim`,
      { code: 'local-warehouse-claim' },
      boss.token,
    );
    expect(claim.status).toBe(200);
    const venue = await call(
      'GET',
      `/v1/venues/${FIRST_VENUE_SLUG}`,
      undefined,
      boss.token,
    );
    const mapId = (venue.json.data?.['maps'] as { id: string }[])[0].id;
    const opened = await call(
      'POST',
      `/v1/venues/${FIRST_VENUE_SLUG}/sessions`,
      { mapId },
      boss.token,
    );
    const sessionId = (opened.json.data?.['session'] as { id: string }).id;

    const nour = await signUp('nour_7');
    const badge = await badgeToken(nour.badgeKey, nour.player.id, new Date());
    const checked = await call(
      'POST',
      `/v1/sessions/${sessionId}/checkins`,
      { badge, gear: 'V-03' },
      boss.token,
    );
    expect(checked.status).toBe(200);
    const roster = checked.json.data?.['roster'] as {
      name: string;
      vest: string;
    }[];
    expect(roster[0]).toMatchObject({ name: '@nour_7', vest: 'V-03' });

    const again = await call(
      'POST',
      `/v1/sessions/${sessionId}/checkins`,
      { badge, gear: 'V-04' },
      boss.token,
    );
    expect(again.json).toMatchObject({
      code: 'CHECKIN_REFUSED',
      detail: 'already-checked-in',
    });
    // Logs carry routes with ids masked, never badges or names.
    const log = lines.join('\n');
    expect(log).toContain('POST /v1/sessions/:id/checkins');
    expect(log).not.toContain('nour');
    expect(log).not.toContain(sessionId);
  });
});
