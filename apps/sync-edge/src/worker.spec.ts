import { describe, expect, it } from 'vitest';
import { sqliteD1 } from '../tests/sqlite-d1';
import type { D1Database } from './d1-repository';
import { type Env, handleRequest, type RateLimit, sweep } from './worker';

const ORIGIN = 'https://product-serracalc.ahmed-hrichi.workers.dev';
const SECRET = 'a-local-secret-that-is-long-enough-1234';
const allow: RateLimit = { limit: async () => ({ success: true }) };
const deny: RateLimit = { limit: async () => ({ success: false }) };

function env(overrides: Partial<Env> = {}): Env {
  return {
    DB: sqliteD1(),
    SYNC_TOKEN_SECRET: SECRET,
    ALLOWED_ORIGINS: `${ORIGIN},http://localhost:4314`,
    PER_IP: allow,
    JOIN: allow,
    ...overrides,
  };
}

function request(
  method: string,
  path: string,
  options: { body?: unknown; token?: string; origin?: string } = {},
): Request {
  const headers: Record<string, string> = {
    origin: options.origin ?? ORIGIN,
  };
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (options.token) headers['authorization'] = `Bearer ${options.token}`;
  return new Request(`https://sync-edge.example${path}`, {
    method,
    headers,
    body:
      options.body === undefined
        ? undefined
        : typeof options.body === 'string'
          ? options.body
          : JSON.stringify(options.body),
  });
}

async function call(
  e: Env,
  method: string,
  path: string,
  options: Parameters<typeof request>[2] = {},
  lines: string[] = [],
) {
  const response = await handleRequest(request(method, path, options), e, {
    log: (line) => lines.push(line),
    now: () => new Date('2026-11-26T10:00:00.000Z'),
  });
  return {
    status: response.status,
    headers: response.headers,
    body: (await response.json()) as Record<string, unknown> & {
      [key: string]: never;
    },
  };
}

describe('the sync Worker', () => {
  it('links two devices and hands one’s records to the other', async () => {
    const e = env();
    const lines: string[] = [];
    const phone = await call(
      e,
      'POST',
      '/v1/spaces',
      {
        body: { v: 1, app: 'serracalc', deviceName: 'Phone' },
      },
      lines,
    );
    expect(phone.status).toBe(200);
    expect(phone.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(phone.headers.get('cache-control')).toBe('no-store');
    const phoneToken = phone.body['token'] as unknown as string;
    const phoneId = phone.body['deviceId'] as unknown as string;

    const pairing = await call(e, 'POST', '/v1/pairings', {
      token: phoneToken,
    });
    const code = pairing.body['code'] as unknown as string;
    expect(code).toMatch(/^[0-9A-Z]{4}-[0-9A-Z]{4}$/);
    const laptop = await call(e, 'POST', '/v1/pairings/claim', {
      body: { v: 1, app: 'serracalc', code, deviceName: 'Laptop' },
    });
    expect(laptop.body['spaceId']).toBe(phone.body['spaceId']);
    const laptopToken = laptop.body['token'] as unknown as string;

    const pushed = await call(
      e,
      'POST',
      '/v1/sync',
      {
        token: phoneToken,
        body: {
          v: 1,
          cursor: 0,
          push: [
            {
              kind: 'project',
              key: 'gh_1',
              updatedAt: '2026-11-26T09:59:00.000Z',
              by: phoneId,
              data: { title: 'Secret farm name' },
            },
          ],
        },
      },
      lines,
    );
    expect(pushed.body).toMatchObject({ ok: true, rejected: [] });
    const pulled = await call(e, 'POST', '/v1/sync', {
      token: laptopToken,
      body: { v: 1, cursor: 0, push: [] },
    });
    expect(pulled.body['pull']).toEqual([
      expect.objectContaining({
        key: 'gh_1',
        data: { title: 'Secret farm name' },
      }),
    ]);

    const devices = await call(e, 'GET', '/v1/devices', { token: laptopToken });
    expect(devices.body['devices']).toHaveLength(2);
    expect(
      (
        await call(e, 'DELETE', `/v1/devices/${laptop.body['deviceId']}`, {
          token: phoneToken,
        })
      ).status,
    ).toBe(200);
    expect(
      (
        await call(e, 'POST', '/v1/sync', {
          token: laptopToken,
          body: { v: 1, cursor: 0, push: [] },
        })
      ).body,
    ).toMatchObject({ code: 'REVOKED' });
    expect(
      (await call(e, 'DELETE', '/v1/spaces/current', { token: phoneToken }))
        .status,
    ).toBe(200);

    // Logs name the route and status, never what was synced.
    expect(lines.join('\n')).toContain('"route":"POST /v1/sync"');
    expect(lines.join('\n')).not.toContain('Secret farm name');
  });

  it('answers CORS for its pages only', async () => {
    const preflight = await handleRequest(
      request('OPTIONS', '/v1/sync'),
      env(),
    );
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-headers')).toContain(
      'authorization',
    );
    const other = await call(env(), 'POST', '/v1/spaces', {
      origin: 'https://evil.example',
      body: { v: 1, app: 'serracalc', deviceName: 'X' },
    });
    expect(other).toMatchObject({
      status: 403,
      body: { code: 'FORBIDDEN_ORIGIN' },
    });
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('says when it isn’t set up yet', async () => {
    const bare = env({ SYNC_TOKEN_SECRET: undefined });
    expect((await call(bare, 'GET', '/health')).body).toEqual({
      ok: true,
      ready: false,
    });
    expect((await call(env(), 'GET', '/health')).body).toEqual({
      ok: true,
      ready: true,
    });
    expect(
      (
        await call(bare, 'POST', '/v1/spaces', {
          body: { v: 1, app: 'serracalc', deviceName: 'X' },
        })
      ).body,
    ).toMatchObject({ code: 'UNAVAILABLE' });
  });

  it('limits how often anyone starts a space or tries a code', async () => {
    const limited = await call(
      env({ JOIN: deny }),
      'POST',
      '/v1/pairings/claim',
      {
        body: { v: 1, app: 'serracalc', code: 'AAAA-AAAA', deviceName: 'X' },
      },
    );
    expect(limited).toMatchObject({
      status: 429,
      body: { code: 'RATE_LIMITED' },
    });
    // Syncing isn't held back by the stricter limit.
    expect(
      (await call(env({ JOIN: deny }), 'GET', '/v1/devices')).body,
    ).toMatchObject({ code: 'UNAUTHORIZED' });
  });

  it('refuses a body that isn’t JSON or is too large, and unknown routes', async () => {
    expect(
      (await call(env(), 'POST', '/v1/spaces', { body: '{oops' })).body,
    ).toMatchObject({ code: 'BAD_REQUEST' });
    expect(
      (await call(env(), 'POST', '/v1/spaces', { body: 'x'.repeat(1_100_000) }))
        .body,
    ).toMatchObject({ code: 'TOO_LARGE' });
    expect((await call(env(), 'GET', '/v1/nothing')).status).toBe(404);
  });

  it('answers a crash in the protocol, with CORS', async () => {
    const broken: D1Database = {
      prepare: () => {
        throw new TypeError('D1 is down');
      },
      batch: async () => {
        throw new TypeError('D1 is down');
      },
    };
    const lines: string[] = [];
    const crashed = await call(
      env({ DB: broken }),
      'POST',
      '/v1/spaces',
      {
        body: { v: 1, app: 'serracalc', deviceName: 'X' },
      },
      lines,
    );
    expect(crashed).toMatchObject({
      status: 503,
      body: { code: 'UNAVAILABLE' },
    });
    expect(crashed.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(lines[0]).toContain('"error":"TypeError"');
  });

  it('sweeps each day', async () => {
    const lines: string[] = [];
    await sweep(env(), { log: (line) => lines.push(line) });
    expect(lines).toEqual(['{"route":"cron sweep","pairings":0,"spaces":0}']);
  });
});
