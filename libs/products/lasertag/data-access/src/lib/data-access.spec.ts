import { ApiError, LasertagApi } from './api-client';
import {
  clearSession,
  type KeyValueStore,
  loadSession,
  saveSession,
} from './session-store';

const PLAYER = {
  id: '6f1c2c4e-1b9a-4c1e-8f43-2d6c9a5b7e10',
  handle: 'nour_7',
  displayName: 'Nour',
  language: 'ar',
  minor: false,
  createdAt: '2026-11-27T00:00:00.000Z',
  staff: [],
};

/** A fetch that answers like lasertag-edge for the routes these tests use. */
function serviceFetch() {
  const calls: { url: string; init?: RequestInit }[] = [];
  const reply = (status: number, body: unknown) =>
    new Response(JSON.stringify(body), { status });
  const fetcher = (async (url: string, init?: RequestInit) => {
    calls.push({ url, init });
    const path = new URL(url).pathname;
    const body = init?.body ? JSON.parse(String(init.body)) : {};
    const auth = (init?.headers as Record<string, string> | undefined)?.[
      'authorization'
    ];
    if (path === '/v1/signup/start') {
      return /^[a-z]/i.test(body.handle)
        ? reply(200, {
            ok: true,
            data: { challengeId: 'c1', options: { challenge: 'x' } },
          })
        : reply(422, {
            ok: false,
            code: 'HANDLE_INVALID',
            message: 'This handle can’t be used',
            detail: 'characters',
          });
    }
    if (path === '/v1/signup/finish') {
      return reply(200, {
        ok: true,
        data: {
          token: 'b1.token',
          expiresAt: '2027-01-26T00:00:00.000Z',
          player: PLAYER,
          badgeKey: 'key',
        },
      });
    }
    return auth === 'Bearer b1.token'
      ? reply(200, { ok: true, data: { player: PLAYER, badgeKey: 'key' } })
      : reply(401, {
          ok: false,
          code: 'UNAUTHORIZED',
          message: 'Sign in first',
        });
  }) as unknown as typeof fetch;
  return { fetcher, calls };
}

describe('LasertagApi', () => {
  it('runs a sign-up and sends the token afterwards', async () => {
    const { fetcher, calls } = serviceFetch();
    let token: string | null = null;
    const api = new LasertagApi({
      baseUrl: 'http://edge.test/',
      token: () => token,
      fetch: fetcher,
    });
    const started = await api.signupStart({
      handle: 'nour_7',
      displayName: 'Nour',
      birthYear: 2001,
      language: 'ar',
      country: 'TN',
    });
    const signed = await api.signupFinish(started.challengeId, {
      id: 'cred-1',
      response: {},
    });
    token = signed.token;
    const me = await api.me();
    expect(me.player.handle).toBe('nour_7');
    expect(calls[0].url).toBe('http://edge.test/v1/signup/start');
    expect(
      (calls[2].init?.headers as Record<string, string>)['authorization'],
    ).toBe(`Bearer ${signed.token}`);
  });

  it('turns refusals into ApiErrors with the code and detail', async () => {
    const { fetcher } = serviceFetch();
    const api = new LasertagApi({
      baseUrl: 'http://edge.test',
      fetch: fetcher,
    });
    const error = await api
      .signupStart({
        handle: '7up',
        displayName: 'X',
        birthYear: 2001,
        language: 'en',
        country: 'TN',
      })
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      code: 'HANDLE_INVALID',
      detail: 'characters',
      status: 422,
    });
  });

  it('says offline when the network fails, and unavailable when off', async () => {
    const api = new LasertagApi({
      baseUrl: 'http://edge.test',
      fetch: (async () => {
        throw new TypeError('Failed to fetch');
      }) as unknown as typeof fetch,
    });
    await expect(api.me()).rejects.toMatchObject({ code: 'OFFLINE' });
    const off = new LasertagApi({ baseUrl: null });
    expect(off.available).toBe(false);
    await expect(off.me()).rejects.toMatchObject({ code: 'UNAVAILABLE' });
  });
});

describe('the stored session', () => {
  const memory = (): KeyValueStore & { data: Map<string, string> } => {
    const data = new Map<string, string>();
    return {
      data,
      getItem: (k) => data.get(k) ?? null,
      setItem: (k, v) => void data.set(k, v),
      removeItem: (k) => void data.delete(k),
    };
  };
  const session = {
    token: 'b1.x',
    expiresAt: '2027-01-01T00:00:00.000Z',
    badgeKey: 'k',
    player: {
      id: 'p',
      handle: 'nour_7',
      displayName: 'Nour',
      language: 'ar' as const,
      minor: false,
      createdAt: '2026-11-27T00:00:00.000Z',
      staff: [],
    },
  };

  it('round-trips and is forgotten when expired or damaged', () => {
    const store = memory();
    saveSession(store, session);
    expect(loadSession(store, new Date('2026-12-01'))?.player.handle).toBe(
      'nour_7',
    );
    expect(loadSession(store, new Date('2027-02-01'))).toBeNull();
    expect(store.data.size).toBe(0);
    store.setItem('barq.session.v1', '{nope');
    expect(loadSession(store)).toBeNull();
    saveSession(store, session);
    clearSession(store);
    expect(loadSession(store, new Date('2026-12-01'))).toBeNull();
  });
});
