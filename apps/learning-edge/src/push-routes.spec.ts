import {
  FIXTURE_IDS,
  MIN_SECRET_LENGTH,
  type NudgeState,
  SERVER_TOKEN_SUBJECT,
  signDeviceToken,
} from '@ah/learning/domain';
import { generateVapidKeys, toBase64Url } from './web-push';
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

function env(): Env & { NUDGES: MemoryKv } {
  return {
    NUDGES: new MemoryKv(),
    LEARNING_TOKEN_SECRET: secret,
    TELEGRAM_BOT_TOKEN: 'bot',
    TELEGRAM_CHAT_ID: '42',
    ALLOWED_ORIGINS: 'https://learning.example, http://localhost:4307',
  };
}

async function pushEnv() {
  const e = env();
  const keys = await generateVapidKeys();
  e.VAPID_PUBLIC_KEY = keys.publicKey;
  e.VAPID_PRIVATE_KEY = keys.privateKey;
  return e;
}

const token = (deviceId: string = FIXTURE_IDS.deviceA) =>
  signDeviceToken(secret, {
    deviceId,
    expiresAt: new Date('2027-05-01T00:00:00Z'),
  });

async function subscription(name: string) {
  const pair = (await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  )) as CryptoKeyPair;
  return {
    endpoint: `https://push.example.test/send/${name}`,
    keys: {
      p256dh: toBase64Url(
        (await crypto.subtle.exportKey('raw', pair.publicKey)) as ArrayBuffer,
      ),
      auth: toBase64Url(crypto.getRandomValues(new Uint8Array(16))),
    },
  };
}

function call(
  method: string,
  path: string,
  body: unknown,
  auth: string | null,
  origin = 'https://learning.example',
) {
  return new Request(`https://edge.example${path}`, {
    method,
    headers: {
      origin,
      'content-type': 'application/json',
      ...(auth ? { authorization: `Bearer ${auth}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

/** A fake network: Telegram and push services, recorded. */
function network(pushStatus = 201, telegramStatus = 200) {
  const calls: string[] = [];
  const fetchFn = (async (url: string) => {
    calls.push(url);
    return new Response('{}', {
      status: url.includes('telegram') ? telegramStatus : pushStatus,
    });
  }) as unknown as typeof fetch;
  return { calls, fetchFn };
}

const pushKeys = (e: { NUDGES: MemoryKv }) =>
  [...e.NUDGES.data.keys()].filter((key) => key.startsWith('push:'));

async function subscribe(
  e: Env,
  app: 'learning' | 'studylm',
  name: string,
  auth?: string,
) {
  return handleRequest(
    call(
      'PUT',
      '/push/subscription',
      { app, subscription: await subscription(name) },
      auth ?? (await token()),
    ),
    e,
    () => now,
  );
}

describe('push routes', () => {
  it('hands out the public key, null until push is set up', async () => {
    const off = await handleRequest(
      call('GET', '/push/key', undefined, null),
      env(),
    );
    expect(await off.json()).toEqual({ publicKey: null });
    const e = await pushEnv();
    const on = await handleRequest(
      call('GET', '/push/key', undefined, null),
      e,
    );
    expect(await on.json()).toEqual({ publicKey: e.VAPID_PUBLIC_KEY });
    expect(on.headers.get('access-control-allow-origin')).toBe(
      'https://learning.example',
    );
  });

  it('registers, tests and removes a paired device’s subscription', async () => {
    const e = await pushEnv();
    const sub = await subscription('one');
    const body = { app: 'learning', subscription: sub };
    expect(
      (await handleRequest(call('PUT', '/push/subscription', body, null), e))
        .status,
    ).toBe(401);
    expect(
      (
        await handleRequest(
          call('PUT', '/push/subscription', body, await token()),
          e,
        )
      ).status,
    ).toBe(204);
    const [key] = pushKeys(e);
    expect(JSON.parse(e.NUDGES.data.get(key) ?? '{}')).toMatchObject({
      app: 'learning',
      deviceId: FIXTURE_IDS.deviceA,
      subscription: sub,
    });

    const { calls, fetchFn } = network();
    const endpoint = { app: 'learning', endpoint: sub.endpoint };
    const test = await handleRequest(
      call('POST', '/push/test', endpoint, await token()),
      e,
      () => now,
      fetchFn,
    );
    expect(test.status).toBe(204);
    expect(calls).toEqual([sub.endpoint]);

    const del = await handleRequest(
      call('DELETE', '/push/subscription', endpoint, await token()),
      e,
    );
    expect(del.status).toBe(204);
    expect(pushKeys(e)).toEqual([]);
  });

  it('says so when push is not set up', async () => {
    const e = env();
    expect((await subscribe(e, 'learning', 'x')).status).toBe(503);
  });

  it('refuses the API’s own token and revoked devices', async () => {
    const e = await pushEnv();
    const server = await signDeviceToken(secret, {
      deviceId: SERVER_TOKEN_SUBJECT,
      expiresAt: new Date('2027-01-01T00:00:00Z'),
    });
    expect((await subscribe(e, 'studylm', 'a', server)).status).toBe(401);
    await e.NUDGES.put(`revoked:${FIXTURE_IDS.deviceA}`, '2026-11-01');
    expect((await subscribe(e, 'studylm', 'b')).status).toBe(401);
  });

  it('accepts StudyLM tokens signed with their own secret', async () => {
    const e = await pushEnv();
    e.STUDYLM_TOKEN_SECRET = 's'.repeat(MIN_SECRET_LENGTH);
    const own = await signDeviceToken(e.STUDYLM_TOKEN_SECRET, {
      deviceId: FIXTURE_IDS.deviceB,
      expiresAt: new Date('2027-05-01T00:00:00Z'),
    });
    expect((await subscribe(e, 'studylm', 'c', own)).status).toBe(204);
    // Never for the learning app.
    expect((await subscribe(e, 'learning', 'd', own)).status).toBe(401);
  });

  it('keeps at most ten subscriptions per app, dropping the oldest', async () => {
    const e = await pushEnv();
    for (let n = 0; n < 12; n++) {
      await handleRequest(
        call(
          'PUT',
          '/push/subscription',
          { app: 'learning', subscription: await subscription(`s${n}`) },
          await token(),
        ),
        e,
        () => new Date(now.getTime() + n * 1000),
      );
    }
    const kept = pushKeys(e).map(
      (key) => JSON.parse(e.NUDGES.data.get(key) ?? '{}').subscription.endpoint,
    );
    expect(kept).toHaveLength(10);
    expect(kept).not.toContain('https://push.example.test/send/s0');
    expect(kept).toContain('https://push.example.test/send/s11');
  });
});

describe('push in the cron', () => {
  const putState = (e: Env) =>
    e.NUDGES.put(
      'state',
      JSON.stringify({ state, deviceId: 'x', receivedAt: '' }),
    );

  it('sends a nudge to Telegram and push, and forgets gone subscriptions', async () => {
    const e = await pushEnv();
    await putState(e);
    await subscribe(e, 'learning', '1');
    await subscribe(e, 'learning', '2');
    await subscribe(e, 'studylm', '3');
    const { calls, fetchFn } = network(410);
    expect(await handleScheduled(e, now, fetchFn)).toBe('sent');
    expect(calls.filter((url) => url.includes('telegram'))).toHaveLength(1);
    expect(calls.filter((url) => url.includes('push.example'))).toEqual([
      expect.stringMatching(/\/[12]$/),
      expect.stringMatching(/\/[12]$/),
    ]);
    // Both learning subscriptions were gone; StudyLM's is untouched.
    expect(pushKeys(e)).toEqual([expect.stringMatching(/^push:studylm:/)]);
  });

  it('counts a nudge as sent when push took it and Telegram failed', async () => {
    const e = await pushEnv();
    await putState(e);
    await subscribe(e, 'learning', 'ok');
    const { fetchFn } = network(201, 502);
    expect(await handleScheduled(e, now, fetchFn)).toBe('sent');
    expect(JSON.parse(e.NUDGES.data.get('log') ?? '{}').sent).toEqual([
      'morning',
    ]);
  });

  it('still throws when every channel failed, so the next run retries', async () => {
    const e = await pushEnv();
    await putState(e);
    await subscribe(e, 'learning', 'down');
    const { fetchFn } = network(500, 502);
    await expect(handleScheduled(e, now, fetchFn)).rejects.toThrow(
      'Telegram answered 502',
    );
    expect(e.NUDGES.data.has('log')).toBe(false);
  });

  it('sends StudyLM’s reminder once a day, to StudyLM devices only', async () => {
    const e = await pushEnv();
    const studyToken = await token(FIXTURE_IDS.deviceB);
    const studyState = {
      timeZone: 'Europe/Paris',
      at: '08:00',
      studiedDate: null,
      next: { title: 'Functions & Scope', url: '/learn/abc', minutes: 12 },
      shakyCards: 2,
    };
    const put = await handleRequest(
      call(
        'PUT',
        '/studylm/state',
        studyState,
        studyToken,
        'http://localhost:4307',
      ),
      e,
    );
    expect(put.status).toBe(204);
    expect(put.headers.get('access-control-allow-origin')).toBe(
      'http://localhost:4307',
    );
    const bad = await handleRequest(
      call('PUT', '/studylm/state', { ...studyState, at: '25:00' }, studyToken),
      e,
    );
    expect(bad.status).toBe(400);

    await subscribe(e, 'studylm', 'study', studyToken);
    await subscribe(e, 'learning', 'learn');
    const { calls, fetchFn } = network();
    // No learning state: only the StudyLM reminder goes out.
    expect(await handleScheduled(e, now, fetchFn)).toBe('sent');
    expect(calls).toEqual(['https://push.example.test/send/study']);
    expect(e.NUDGES.data.get('studylm:log')).toBe('2026-11-12');
    expect(
      await handleScheduled(e, new Date('2026-11-12T07:40:00Z'), fetchFn),
    ).toBe('quiet');
    expect(calls).toHaveLength(1);
  });
});
