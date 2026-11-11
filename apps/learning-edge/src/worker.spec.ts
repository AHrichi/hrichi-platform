import {
  FIXTURE_IDS,
  MIN_SECRET_LENGTH,
  type NudgeState,
  SERVER_TOKEN_SUBJECT,
  signDeviceToken,
} from '@ah/learning/domain';
import {
  type Env,
  handleRequest,
  handleScheduled,
  handleTelegram,
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
  async delete(key: string) {
    this.data.delete(key);
  }
  async list({ prefix, limit = 1000 }: { prefix: string; limit?: number }) {
    const names = [...this.data.keys()]
      .filter((key) => key.startsWith(prefix))
      .sort()
      .slice(0, limit);
    return { keys: names.map((name) => ({ name })) };
  }
}

function env(kv = new MemoryKv()): Env & { NUDGES: MemoryKv } {
  return {
    NUDGES: kv,
    LEARNING_TOKEN_SECRET: secret,
    TELEGRAM_BOT_TOKEN: 'bot',
    TELEGRAM_CHAT_ID: '42',
    TELEGRAM_WEBHOOK_SECRET: 'hook-secret',
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
  recap: false,
  week: null,
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

function capture() {
  const sent: { text: string }[] = [];
  const fetchFn = (async (_url: string, init?: RequestInit) => {
    sent.push(JSON.parse(String(init?.body)));
    return new Response('{}', { status: 200 });
  }) as typeof fetch;
  return { sent, fetchFn };
}

function update(
  message: Record<string, unknown>,
  { secret = 'hook-secret', updateId = 812 } = {},
) {
  return new Request('https://edge.example/telegram', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-telegram-bot-api-secret-token': secret,
    },
    body: JSON.stringify({
      update_id: updateId,
      message: {
        message_id: 5,
        date: 1_794_470_400,
        chat: { id: 42 },
        ...message,
      },
    }),
  });
}

describe('the Telegram webhook', () => {
  it('keeps the owner’s text and voice notes, and says so', async () => {
    const e = env();
    const { sent, fetchFn } = capture();
    const text = await handleTelegram(
      update({ text: 'Sunk cost: spent money that can’t come back.' }),
      e,
      () => now,
      fetchFn,
    );
    expect(text.status).toBe(200);
    const voice = await handleTelegram(
      update(
        { voice: { file_id: 'AwACAg', duration: 14, mime_type: 'audio/ogg' } },
        { updateId: 813 },
      ),
      e,
      () => now,
      fetchFn,
    );
    expect(voice.status).toBe(200);
    const stored = [...e.NUDGES.data.entries()]
      .filter(([key]) => key.startsWith('inbox:'))
      .map(([, value]) => JSON.parse(value));
    expect(stored).toEqual([
      expect.objectContaining({
        key: 'inbox:000000000812',
        updateId: 812,
        text: 'Sunk cost: spent money that can’t come back.',
        voice: null,
      }),
      expect.objectContaining({
        updateId: 813,
        text: null,
        voice: { fileId: 'AwACAg', mimeType: 'audio/ogg', seconds: 14 },
      }),
    ]);
    expect(sent.map((m) => m.text)).toEqual([
      expect.stringContaining('Got it'),
      expect.stringContaining('Got it'),
    ]);
  });

  it('keeps the first copy of an update Telegram sends twice', async () => {
    const e = env();
    const { fetchFn } = capture();
    await handleTelegram(update({ text: 'An idea' }), e, () => now, fetchFn);
    const first = e.NUDGES.data.get('inbox:000000000812');
    await handleTelegram(update({ text: 'An idea' }), e, () => now, fetchFn);
    expect(e.NUDGES.data.get('inbox:000000000812')).toBe(first);
  });

  it('refuses a wrong secret and ignores other chats', async () => {
    const e = env();
    const { sent, fetchFn } = capture();
    const wrong = await handleTelegram(
      update({ text: 'x' }, { secret: 'guess' }),
      e,
      () => now,
      fetchFn,
    );
    expect(wrong.status).toBe(404);
    const stranger = await handleTelegram(
      update({ text: 'Hello', chat: { id: 7 } }),
      e,
      () => now,
      fetchFn,
    );
    expect(stranger.status).toBe(200);
    expect([...e.NUDGES.data.keys()]).toEqual([]);
    expect(sent).toEqual([]);
    const off = await handleTelegram(
      update({ text: 'x' }),
      { ...e, TELEGRAM_WEBHOOK_SECRET: undefined },
      () => now,
      fetchFn,
    );
    expect(off.status).toBe(404);
  });

  it('answers commands with help and refuses long voice notes', async () => {
    const e = env();
    const { sent, fetchFn } = capture();
    await handleTelegram(update({ text: '/start' }), e, () => now, fetchFn);
    await handleTelegram(
      update({ voice: { file_id: 'x', duration: 300 } }, { updateId: 9 }),
      e,
      () => now,
      fetchFn,
    );
    expect([...e.NUDGES.data.keys()]).toEqual([]);
    expect(sent.map((m) => m.text)).toEqual([
      expect.stringContaining('Learning Inbox'),
      expect.stringContaining('over 2 minutes'),
    ]);
  });
});

describe('the inbox, for the API', () => {
  async function serverToken() {
    return signDeviceToken(secret, {
      deviceId: SERVER_TOKEN_SUBJECT,
      expiresAt: new Date(now.getTime() + 5 * 60_000),
    });
  }
  const request = (path: string, auth: string, init: RequestInit = {}) =>
    new Request(`https://edge.example${path}`, {
      ...init,
      headers: { authorization: `Bearer ${auth}` },
    });

  it('hands the items to the API only, and forgets acknowledged ones', async () => {
    const e = env();
    const { fetchFn } = capture();
    await handleTelegram(update({ text: 'One idea' }), e, () => now, fetchFn);
    const device = await handleRequest(
      request('/inbox', await token()),
      e,
      () => now,
    );
    expect(device.status).toBe(401);

    const pulled = await handleRequest(
      request('/inbox', await serverToken()),
      e,
      () => now,
    );
    expect(pulled.status).toBe(200);
    const { items } = (await pulled.json()) as { items: { key: string }[] };
    expect(items.map((item) => item.key)).toEqual(['inbox:000000000812']);

    const ack = await handleRequest(
      request('/inbox/ack', await serverToken(), {
        method: 'POST',
        body: JSON.stringify({ keys: ['inbox:000000000812'] }),
      }),
      e,
      () => now,
    );
    expect(ack.status).toBe(204);
    expect(e.NUDGES.data.has('inbox:000000000812')).toBe(false);
    const foreign = await handleRequest(
      request('/inbox/ack', await serverToken(), {
        method: 'POST',
        body: JSON.stringify({ keys: ['state'] }),
      }),
      e,
      () => now,
    );
    expect(foreign.status).toBe(400);
  });
});

describe('the Sunday recap', () => {
  it('goes out once on Sunday evening, with the week’s numbers', async () => {
    const e = env();
    const weekly: NudgeState = {
      ...state,
      morning: null,
      evening: null,
      recap: true,
      week: {
        start: '2026-11-09',
        days: 4,
        reviews: 30,
        kept: 2,
        teachBacks: 0,
        strong: 8,
      },
    };
    await e.NUDGES.put(
      'state',
      JSON.stringify({ state: weekly, deviceId: 'x', receivedAt: '' }),
    );
    const { sent, fetchFn } = capture();
    const sunday = new Date('2026-11-15T17:30:00Z');
    expect(await handleScheduled(e, sunday, fetchFn)).toBe('sent');
    expect(await handleScheduled(e, sunday, fetchFn)).toBe('quiet');
    expect(sent).toEqual([
      {
        chat_id: '42',
        text: expect.stringContaining('Your week: 4 days, 30 cards.'),
      },
    ]);
    expect(e.NUDGES.data.get('recap')).toBe('2026-11-09');
  });
});
