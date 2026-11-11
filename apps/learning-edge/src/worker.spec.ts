import {
  FIXTURE_IDS,
  MIN_SECRET_LENGTH,
  type NudgeState,
  signDeviceToken,
} from '@ah/learning/domain';
import {
  type Env,
  handleRequest,
  handleScheduled,
  type KvStore,
} from './worker';

const secret = 'e'.repeat(MIN_SECRET_LENGTH);
const now = new Date('2026-11-12T07:10:00Z'); // 08:10 in Paris

class MemoryKv implements KvStore {
  readonly data = new Map<string, string>();
  async get(key: string) {
    return this.data.get(key) ?? null;
  }
  async put(key: string, value: string) {
    this.data.set(key, value);
  }
}

function env(kv = new MemoryKv()): Env & { NUDGES: MemoryKv } {
  return {
    NUDGES: kv,
    LEARNING_TOKEN_SECRET: secret,
    TELEGRAM_BOT_TOKEN: 'bot',
    TELEGRAM_CHAT_ID: '42',
    ALLOWED_ORIGINS: 'https://learning.example, http://localhost:4311',
  };
}

const state: NudgeState = {
  timeZone: 'Europe/Paris',
  morning: '08:00',
  evening: '20:30',
  setSize: 7,
  streak: 4,
  doneDate: null,
  vacationUntil: null,
};

async function token() {
  return signDeviceToken(secret, {
    deviceId: FIXTURE_IDS.deviceA,
    expiresAt: new Date('2027-05-01T00:00:00Z'),
  });
}

function put(
  body: unknown,
  auth: string | null,
  origin = 'https://learning.example',
) {
  return new Request('https://edge.example/state', {
    method: 'PUT',
    headers: {
      origin,
      'content-type': 'application/json',
      ...(auth ? { authorization: `Bearer ${auth}` } : {}),
    },
    body: JSON.stringify(body),
  });
}

describe('PUT /state', () => {
  it('stores the state from a paired device, with CORS for the app', async () => {
    const e = env();
    const response = await handleRequest(
      put(state, await token()),
      e,
      () => now,
    );
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe(
      'https://learning.example',
    );
    expect(JSON.parse(e.NUDGES.data.get('state') ?? '{}')).toMatchObject({
      state,
      deviceId: FIXTURE_IDS.deviceA,
    });
  });

  it('refuses unpaired devices and bad states, and allows no other origin', async () => {
    const e = env();
    expect((await handleRequest(put(state, null), e, () => now)).status).toBe(
      401,
    );
    expect(
      (await handleRequest(put(state, 'v1.x.1.y'), e, () => now)).status,
    ).toBe(401);
    expect(
      (
        await handleRequest(
          put({ ...state, morning: '25:00' }, await token()),
          e,
          () => now,
        )
      ).status,
    ).toBe(400);
    const other = await handleRequest(
      put(state, await token(), 'https://evil.example'),
      e,
      () => now,
    );
    expect(other.headers.get('access-control-allow-origin')).toBeNull();
  });

  it('answers preflight and health, and 404 elsewhere', async () => {
    const e = env();
    const preflight = await handleRequest(
      new Request('https://edge.example/state', {
        method: 'OPTIONS',
        headers: { origin: 'http://localhost:4311' },
      }),
      e,
    );
    expect(preflight.status).toBe(204);
    expect(preflight.headers.get('access-control-allow-methods')).toContain(
      'PUT',
    );
    expect(
      (await handleRequest(new Request('https://edge.example/health'), e))
        .status,
    ).toBe(200);
    expect(
      (await handleRequest(new Request('https://edge.example/other'), e))
        .status,
    ).toBe(404);
  });
});

describe('the cron', () => {
  function telegram() {
    const sent: unknown[] = [];
    const fetchFn = (async (_url: string, init?: RequestInit) => {
      sent.push(JSON.parse(String(init?.body)));
      return new Response('{}', { status: 200 });
    }) as typeof fetch;
    return { sent, fetchFn };
  }

  it('sends the morning nudge once, then stays quiet', async () => {
    const e = env();
    await e.NUDGES.put(
      'state',
      JSON.stringify({ state, deviceId: 'x', receivedAt: '' }),
    );
    const { sent, fetchFn } = telegram();
    expect(await handleScheduled(e, now, fetchFn)).toBe('sent');
    expect(sent).toEqual([
      { chat_id: '42', text: expect.stringContaining('7 cards') },
    ]);
    expect(
      await handleScheduled(e, new Date('2026-11-12T07:25:00Z'), fetchFn),
    ).toBe('quiet');
    expect(JSON.parse(e.NUDGES.data.get('log') ?? '{}')).toEqual({
      localDate: '2026-11-12',
      sent: ['morning'],
    });
  });

  it('does nothing without a state, and keeps the log when Telegram fails', async () => {
    const e = env();
    expect(await handleScheduled(e, now)).toBe('no-state');
    await e.NUDGES.put(
      'state',
      JSON.stringify({ state, deviceId: 'x', receivedAt: '' }),
    );
    const failing = (async () =>
      new Response('', { status: 502 })) as unknown as typeof fetch;
    await expect(handleScheduled(e, now, failing)).rejects.toThrow(
      'Telegram answered 502',
    );
    expect(e.NUDGES.data.has('log')).toBe(false);
  });
});
