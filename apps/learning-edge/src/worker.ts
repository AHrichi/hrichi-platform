import * as v from 'valibot';
import {
  type EdgeDevice,
  EdgeDevicesSyncSchema,
  EDGE_INBOX_PAGE,
  EdgeInboxAckSchema,
  type EdgeInboxItem,
  type EdgeRevocation,
  EdgeRevocationAckSchema,
  inboxKey,
  LIMITS,
  type NudgeLog,
  type NudgeState,
  NudgeStateSchema,
  ngswPayload,
  nudgeDue,
  nudgePush,
  PUSH_MAX_SUBSCRIPTIONS,
  type PushApp,
  PushEndpointSchema,
  type PushMessage,
  PushRegistrationSchema,
  pushKey,
  recapDue,
  SERVER_TOKEN_SUBJECT,
  type StoredPushSubscription,
  type StudyReminderState,
  StudyReminderStateSchema,
  studyReminderDue,
  TELEGRAM_VOICE_MAX_SECONDS,
  verifyDeviceToken,
} from '@ah/learning/domain';
import { sendPush, type VapidKeys } from './web-push';

/** The slice of Workers KV this Worker uses. */
export interface KvStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  delete(key: string): Promise<void>;
  list(options: {
    prefix: string;
    limit?: number;
  }): Promise<{ keys: { name: string }[] }>;
}

export interface Env {
  NUDGES: KvStore;
  /** The API's LEARNING_TOKEN_SECRET: device tokens are checked here too. */
  LEARNING_TOKEN_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  /**
   * The webhook's `secret_token` (setWebhook): Telegram sends it back in a
   * header on every update. Unset, the webhook is off.
   */
  TELEGRAM_WEBHOOK_SECRET?: string;
  /** Comma-separated origins allowed to call the Worker from a page. */
  ALLOWED_ORIGINS: string;
  /**
   * Web Push (VAPID, base64url). Unset, push is off and only Telegram is
   * used. `learning-setup.mjs --push` generates and stores them.
   */
  VAPID_PUBLIC_KEY?: string;
  VAPID_PRIVATE_KEY?: string;
  /** The contact push services see; a `mailto:` or `https:` URL. */
  VAPID_SUBJECT?: string;
  /**
   * Only when StudyLM's tokens use their own secret: by default the API
   * signs them with LEARNING_TOKEN_SECRET too.
   */
  STUDYLM_TOKEN_SECRET?: string;
}

type Fetch = typeof fetch;

const STATE_KEY = 'state';
const LOG_KEY = 'log';
/** The Monday of the last week a recap went out for. */
const RECAP_KEY = 'recap';
const DEVICES_KEY = 'devices';
const revokedKey = (deviceId: string) => `revoked:${deviceId}`;
const revokeKey = (deviceId: string) => `revoke:${deviceId}`;
/** StudyLM's study reminder state and the local date it last went out. */
const STUDY_STATE_KEY = 'studylm:state';
const STUDY_LOG_KEY = 'studylm:log';
/** Telegram updates are small; anything bigger isn't one. */
const MAX_UPDATE_BYTES = 64 * 1024;

interface StoredState {
  state: NudgeState;
  deviceId: string;
  receivedAt: string;
}

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('origin') ?? '';
  const allowed = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  return allowed.includes(origin)
    ? {
        'access-control-allow-origin': origin,
        'access-control-allow-methods': 'GET, PUT, POST, DELETE, OPTIONS',
        'access-control-allow-headers': 'authorization, content-type',
        'access-control-max-age': '86400',
        vary: 'origin',
      }
    : {};
}

function json(body: unknown, status: number, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json', ...headers },
  });
}

/**
 * `PUT /state`: a paired device sends the nudge state (design §10). The
 * token is checked with the shared secret and no database; the newest
 * state wins, whichever device sent it. Revoked devices can still send it
 * until their token expires: at worst they move a reminder time.
 */
export async function handleRequest(
  request: Request,
  env: Env,
  now: () => Date = () => new Date(),
  fetchFn: Fetch = (input, init) => fetch(input, init),
): Promise<Response> {
  const cors = corsHeaders(request, env);
  const url = new URL(request.url);
  if (request.method === 'OPTIONS')
    return new Response(null, { status: 204, headers: cors });
  if (url.pathname === '/health') return json({ status: 'ok' }, 200, cors);
  if (url.pathname === '/telegram' && request.method === 'POST') {
    return handleTelegram(request, env, now);
  }
  if (url.pathname === '/inbox' && request.method === 'GET') {
    return handleInbox(request, env, now);
  }
  if (url.pathname === '/inbox/ack' && request.method === 'POST') {
    return handleAck(request, env, now);
  }
  if (url.pathname === '/devices' && request.method === 'PUT') {
    return handlePutDevices(request, env, now);
  }
  if (url.pathname === '/revocations' && request.method === 'GET') {
    return handleRevocations(request, env, now);
  }
  if (url.pathname === '/revocations/ack' && request.method === 'POST') {
    return handleRevocationsAck(request, env, now);
  }
  if (url.pathname === '/push/key' && request.method === 'GET') {
    return json({ publicKey: vapidKeys(env)?.publicKey ?? null }, 200, cors);
  }
  if (url.pathname === '/push/subscription') {
    if (request.method === 'PUT') {
      return handlePushRegister(request, env, now, cors);
    }
    if (request.method === 'DELETE') {
      return handlePushUnregister(request, env, now, cors);
    }
  }
  if (url.pathname === '/push/test' && request.method === 'POST') {
    return handlePushTest(request, env, now, cors, fetchFn);
  }
  if (url.pathname === '/studylm/state' && request.method === 'PUT') {
    return handleStudyState(request, env, now, cors);
  }
  if (url.pathname !== '/state' || request.method !== 'PUT') {
    return json({ message: 'Not found.' }, 404, cors);
  }

  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const claims = token
    ? await verifyDeviceToken(env.LEARNING_TOKEN_SECRET, token, now())
    : null;
  if (!claims)
    return json({ message: 'This device is not paired.' }, 401, cors);
  if (await env.NUDGES.get(revokedKey(claims.deviceId))) {
    return json({ message: 'This device was revoked.' }, 401, cors);
  }

  const text = await request.text();
  if (text.length > 4096) return json({ message: 'Too large.' }, 413, cors);
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return json({ message: 'Send JSON.' }, 400, cors);
  }
  const parsed = v.safeParse(NudgeStateSchema, body);
  if (!parsed.success) {
    return json(
      { message: 'The nudge state does not match the contract.' },
      400,
      cors,
    );
  }
  const stored: StoredState = {
    state: parsed.output,
    deviceId: claims.deviceId,
    receivedAt: now().toISOString(),
  };
  await env.NUDGES.put(STATE_KEY, JSON.stringify(stored));
  return new Response(null, { status: 204, headers: cors });
}

async function sendTelegram(
  env: Env,
  fetchFn: Fetch,
  text: string,
  replyTo?: number,
): Promise<void> {
  const response = await fetchFn(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        chat_id: env.TELEGRAM_CHAT_ID,
        text,
        ...(replyTo ? { reply_parameters: { message_id: replyTo } } : {}),
      }),
    },
  );
  if (!response.ok) throw new Error(`Telegram answered ${response.status}`);
}

/**
 * The Cron Trigger, every 15 minutes: send a nudge when `nudgeDue` says so
 * and the Sunday recap when `recapDue` does, to Telegram and to every
 * device with push on, and remember each, so a nudge goes out at most once
 * a day per kind and the recap once a week. StudyLM's study reminder goes
 * out by push only, once a day, when `studyReminderDue` says so.
 */
export async function handleScheduled(
  env: Env,
  now: Date,
  fetchFn: Fetch = (input, init) => fetch(input, init),
): Promise<'sent' | 'quiet' | 'no-state'> {
  const stored = await env.NUDGES.get(STATE_KEY);
  const studyText = await env.NUDGES.get(STUDY_STATE_KEY);
  if (!stored && !studyText) return 'no-state';
  let sentAny = false;

  if (stored) {
    const { state } = JSON.parse(stored) as StoredState;
    const recap = recapDue(state, await env.NUDGES.get(RECAP_KEY), now);
    if (recap) {
      await deliver(
        env,
        fetchFn,
        recap.text,
        nudgePush('recap', recap.text),
        now,
      );
      await env.NUDGES.put(RECAP_KEY, recap.week);
      sentAny = true;
    }

    const logText = await env.NUDGES.get(LOG_KEY);
    const log = logText ? (JSON.parse(logText) as NudgeLog) : null;
    const due = nudgeDue(state, log, now);
    if (due) {
      await deliver(env, fetchFn, due.text, nudgePush(due.kind, due.text), now);
      const sent = log?.localDate === due.localDate ? log.sent : [];
      await env.NUDGES.put(
        LOG_KEY,
        JSON.stringify({ localDate: due.localDate, sent: [...sent, due.kind] }),
      );
      sentAny = true;
    }
  }

  if (studyText) {
    const study = JSON.parse(studyText) as { state: StudyReminderState };
    const due = studyReminderDue(
      study.state,
      await env.NUDGES.get(STUDY_LOG_KEY),
      now,
    );
    if (due) {
      // Remembered even when no device took it: a reminder is never retried.
      await pushAll(env, 'studylm', due.message, now, fetchFn);
      await env.NUDGES.put(STUDY_LOG_KEY, due.localDate);
      sentAny = true;
    }
  }
  return sentAny ? 'sent' : 'quiet';
}

/**
 * A nudge or the recap goes to Telegram and push both. It counts as sent
 * when either channel took it; when every channel fails, the error is
 * thrown and the next cron run tries again.
 */
async function deliver(
  env: Env,
  fetchFn: Fetch,
  text: string,
  message: PushMessage,
  now: Date,
): Promise<void> {
  let telegramError: unknown = null;
  if (env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID) {
    try {
      await sendTelegram(env, fetchFn, text);
    } catch (error) {
      telegramError = error;
    }
  }
  const pushed = await pushAll(env, 'learning', message, now, fetchFn);
  if (telegramError && pushed === 0) throw telegramError;
}

function vapidKeys(env: Env): VapidKeys | null {
  if (!env.VAPID_PUBLIC_KEY || !env.VAPID_PRIVATE_KEY) return null;
  return {
    publicKey: env.VAPID_PUBLIC_KEY,
    privateKey: env.VAPID_PRIVATE_KEY,
    subject:
      env.VAPID_SUBJECT || 'https://product-learning.ahmed-hrichi.workers.dev',
  };
}

async function readSubscriptions(
  kv: KvStore,
  app: PushApp,
): Promise<{ key: string; value: StoredPushSubscription }[]> {
  const listed = await kv.list({ prefix: `push:${app}:`, limit: 100 });
  const found: { key: string; value: StoredPushSubscription }[] = [];
  for (const { name } of listed.keys) {
    const raw = await kv.get(name);
    if (!raw) continue;
    try {
      found.push({
        key: name,
        value: JSON.parse(raw) as StoredPushSubscription,
      });
    } catch {
      await kv.delete(name);
    }
  }
  return found;
}

/**
 * Sends one message to every device of `app` with push on, and forgets the
 * subscriptions the push service says are gone. Returns how many took it.
 */
async function pushAll(
  env: Env,
  app: PushApp,
  message: PushMessage,
  now: Date,
  fetchFn: Fetch,
): Promise<number> {
  const keys = vapidKeys(env);
  if (!keys) return 0;
  let delivered = 0;
  for (const { key, value } of await readSubscriptions(env.NUDGES, app)) {
    try {
      const result = await sendPush(
        value.subscription,
        ngswPayload(message),
        keys,
        { now, topic: message.tag },
        fetchFn,
      );
      if (result.ok) delivered++;
      else if (result.gone) await env.NUDGES.delete(key);
    } catch {
      // One broken subscription doesn't stop the others.
    }
  }
  return delivered;
}

/**
 * The device behind a request for `app`: a paired learning device, or a
 * StudyLM device (its sync token or its Learning Engine link token). Never
 * the API's own token, never a revoked device.
 */
async function deviceFor(
  request: Request,
  env: Env,
  now: () => Date,
  app: PushApp,
): Promise<string | null> {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return null;
  const secrets = [env.LEARNING_TOKEN_SECRET];
  if (app === 'studylm' && env.STUDYLM_TOKEN_SECRET) {
    secrets.push(env.STUDYLM_TOKEN_SECRET);
  }
  for (const secret of secrets) {
    const claims = await verifyDeviceToken(secret, token, now());
    if (!claims || claims.deviceId === SERVER_TOKEN_SUBJECT) continue;
    if (await env.NUDGES.get(revokedKey(claims.deviceId))) return null;
    return claims.deviceId;
  }
  return null;
}

/** Reads a small JSON body, or answers why not. */
async function readBody(
  request: Request,
  cors: Record<string, string>,
): Promise<{ body: unknown } | { response: Response }> {
  const text = await request.text();
  if (text.length > 4096) {
    return { response: json({ message: 'Too large.' }, 413, cors) };
  }
  try {
    return { body: JSON.parse(text) };
  } catch {
    return { response: json({ message: 'Send JSON.' }, 400, cors) };
  }
}

const notPaired = (cors: Record<string, string>) =>
  json({ message: 'This device is not paired.' }, 401, cors);
const noPush = (cors: Record<string, string>) =>
  json({ message: 'Push is not set up on the Worker.' }, 503, cors);

/** `PUT /push/subscription`: this device wants notifications for `app`. */
async function handlePushRegister(
  request: Request,
  env: Env,
  now: () => Date,
  cors: Record<string, string>,
): Promise<Response> {
  if (!vapidKeys(env)) return noPush(cors);
  const read = await readBody(request, cors);
  if ('response' in read) return read.response;
  const parsed = v.safeParse(PushRegistrationSchema, read.body);
  if (!parsed.success) {
    return json({ message: 'Send { app, subscription }.' }, 400, cors);
  }
  const { app, subscription } = parsed.output;
  const deviceId = await deviceFor(request, env, now, app);
  if (!deviceId) return notPaired(cors);

  const key = await pushKey(app, subscription.endpoint);
  // At most PUSH_MAX_SUBSCRIPTIONS per app: the oldest make room.
  const others = (await readSubscriptions(env.NUDGES, app))
    .filter((entry) => entry.key !== key)
    .sort((a, b) => a.value.createdAt.localeCompare(b.value.createdAt));
  const extra = others.length - (PUSH_MAX_SUBSCRIPTIONS - 1);
  for (const old of others.slice(0, Math.max(0, extra))) {
    await env.NUDGES.delete(old.key);
  }
  const stored: StoredPushSubscription = {
    app,
    deviceId,
    subscription,
    createdAt: now().toISOString(),
  };
  await env.NUDGES.put(key, JSON.stringify(stored));
  return new Response(null, { status: 204, headers: cors });
}

/** `DELETE /push/subscription`: no more notifications on this device. */
async function handlePushUnregister(
  request: Request,
  env: Env,
  now: () => Date,
  cors: Record<string, string>,
): Promise<Response> {
  const read = await readBody(request, cors);
  if ('response' in read) return read.response;
  const parsed = v.safeParse(PushEndpointSchema, read.body);
  if (!parsed.success) {
    return json({ message: 'Send { app, endpoint }.' }, 400, cors);
  }
  const { app, endpoint } = parsed.output;
  if (!(await deviceFor(request, env, now, app))) return notPaired(cors);
  await env.NUDGES.delete(await pushKey(app, endpoint));
  return new Response(null, { status: 204, headers: cors });
}

/** `POST /push/test`: one notification to this device, to see it works. */
async function handlePushTest(
  request: Request,
  env: Env,
  now: () => Date,
  cors: Record<string, string>,
  fetchFn: Fetch,
): Promise<Response> {
  const keys = vapidKeys(env);
  if (!keys) return noPush(cors);
  const read = await readBody(request, cors);
  if ('response' in read) return read.response;
  const parsed = v.safeParse(PushEndpointSchema, read.body);
  if (!parsed.success) {
    return json({ message: 'Send { app, endpoint }.' }, 400, cors);
  }
  const { app, endpoint } = parsed.output;
  if (!(await deviceFor(request, env, now, app))) return notPaired(cors);
  const key = await pushKey(app, endpoint);
  const raw = await env.NUDGES.get(key);
  if (!raw) {
    return json({ message: 'Turn notifications on first.' }, 404, cors);
  }
  const { subscription } = JSON.parse(raw) as StoredPushSubscription;
  const result = await sendPush(
    subscription,
    ngswPayload({
      title: 'Notifications are on ✓',
      body:
        app === 'learning'
          ? 'Your Daily Set reminders will arrive here.'
          : 'Your study reminders will arrive here.',
      url: app === 'learning' ? '/today' : '/roadmap',
      tag: `${app}-test`,
    }),
    keys,
    { now: now(), ttlSeconds: 600 },
    fetchFn,
  );
  if (result.ok) return new Response(null, { status: 204, headers: cors });
  if (result.gone) await env.NUDGES.delete(key);
  return json(
    { message: `The push service answered ${result.status}.` },
    502,
    cors,
  );
}

/** `PUT /studylm/state`: what StudyLM's daily reminder needs. */
async function handleStudyState(
  request: Request,
  env: Env,
  now: () => Date,
  cors: Record<string, string>,
): Promise<Response> {
  if (!(await deviceFor(request, env, now, 'studylm'))) return notPaired(cors);
  const read = await readBody(request, cors);
  if ('response' in read) return read.response;
  const parsed = v.safeParse(StudyReminderStateSchema, read.body);
  if (!parsed.success) {
    return json(
      { message: 'The study state does not match the contract.' },
      400,
      cors,
    );
  }
  await env.NUDGES.put(
    STUDY_STATE_KEY,
    JSON.stringify({ state: parsed.output, receivedAt: now().toISOString() }),
  );
  return new Response(null, { status: 204, headers: cors });
}

/** Compares two strings in time that doesn't depend on where they differ. */
function sameSecret(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  let diff = left.length ^ right.length;
  for (let i = 0; i < Math.max(left.length, right.length); i++) {
    diff |= (left[i] ?? 0) ^ (right[i] ?? 0);
  }
  return diff === 0;
}

/** The parts of a Telegram update this Worker reads. */
interface TelegramUpdate {
  update_id?: number;
  message?: {
    message_id: number;
    date: number;
    chat?: { id: number | string };
    text?: string;
    caption?: string;
    voice?: { file_id: string; duration: number; mime_type?: string };
  };
}

const HELP =
  'Send me an idea, a quote or a voice note (up to 2 minutes), or forward a message. It goes to your Learning Inbox, where the AI explains it. Commands: /devices, /revoke <number or id>.';

/**
 * `POST /telegram`, the bot's webhook (design §9). Only updates carrying
 * the webhook secret are read, and only messages from the owner's chat are
 * kept; everything else gets a 200 so Telegram doesn't retry it. A voice
 * note is kept as its `file_id`; the audio stays with Telegram until the
 * API fetches it.
 */
export async function handleTelegram(
  request: Request,
  env: Env,
  now: () => Date = () => new Date(),
  fetchFn: Fetch = (input, init) => fetch(input, init),
): Promise<Response> {
  const secret = env.TELEGRAM_WEBHOOK_SECRET ?? '';
  const given = request.headers.get('x-telegram-bot-api-secret-token') ?? '';
  if (!secret || !sameSecret(given, secret)) {
    return json({ message: 'Not found.' }, 404, {});
  }
  const text = await request.text();
  if (text.length > MAX_UPDATE_BYTES) return json({ ok: true }, 200, {});
  let update: TelegramUpdate;
  try {
    update = JSON.parse(text) as TelegramUpdate;
  } catch {
    return json({ ok: true }, 200, {});
  }
  const message = update.message;
  if (
    !message ||
    typeof update.update_id !== 'number' ||
    String(message.chat?.id ?? '') !== env.TELEGRAM_CHAT_ID
  ) {
    return json({ ok: true }, 200, {});
  }
  const reply = (body: string) =>
    sendTelegram(env, fetchFn, body, message.message_id).catch(() => {
      // The reply is a courtesy: the message is stored either way.
    });

  const words = (message.text ?? message.caption ?? '').trim();
  if (!message.voice && (words.startsWith('/') || !words)) {
    const command = words.split(/\s+/)[0]?.split('@')[0]?.toLowerCase() ?? '';
    if (command === '/devices') {
      await reply(await formatDevicesList(env.NUDGES));
      return json({ ok: true }, 200, {});
    }
    if (command === '/revoke') {
      const target = words
        .slice(words.toLowerCase().indexOf('/revoke') + '/revoke'.length)
        .trim();
      await reply(await revokeFromTelegram(env.NUDGES, target, now()));
      return json({ ok: true }, 200, {});
    }
    await reply(HELP);
    return json({ ok: true }, 200, {});
  }
  if (message.voice && message.voice.duration > TELEGRAM_VOICE_MAX_SECONDS) {
    await reply('That voice note is over 2 minutes. Send a shorter one.');
    return json({ ok: true }, 200, {});
  }

  const key = inboxKey(update.update_id);
  // Telegram may deliver an update twice: the first copy wins.
  if (!(await env.NUDGES.get(key))) {
    const item: EdgeInboxItem = {
      key,
      id: crypto.randomUUID(),
      updateId: update.update_id,
      at: new Date(
        Number.isFinite(message.date) ? message.date * 1000 : now().getTime(),
      ).toISOString(),
      text: words ? words.slice(0, LIMITS.captureText) : null,
      voice: message.voice
        ? {
            fileId: message.voice.file_id.slice(0, 256),
            mimeType: message.voice.mime_type?.startsWith('audio/')
              ? message.voice.mime_type.slice(0, 64)
              : 'audio/ogg',
            seconds: Math.max(0, Math.round(message.voice.duration)),
          }
        : null,
    };
    await env.NUDGES.put(key, JSON.stringify(item));
  }
  await reply('Got it ✓ It will be in your Learning Inbox shortly.');
  return json({ ok: true }, 200, {});
}

/** The API's own token: signed with the shared secret, for the server's id. */
async function isServer(request: Request, env: Env, now: () => Date) {
  const header = request.headers.get('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  const claims = token
    ? await verifyDeviceToken(env.LEARNING_TOKEN_SECRET, token, now())
    : null;
  return claims?.deviceId === SERVER_TOKEN_SUBJECT;
}

/** `GET /inbox`: the API pulls what Telegram brought, oldest first. */
export async function handleInbox(
  request: Request,
  env: Env,
  now: () => Date = () => new Date(),
): Promise<Response> {
  if (!(await isServer(request, env, now))) {
    return json({ message: 'Only the API reads the inbox.' }, 401, {});
  }
  const listed = await env.NUDGES.list({
    prefix: 'inbox:',
    limit: EDGE_INBOX_PAGE,
  });
  const items: EdgeInboxItem[] = [];
  for (const { name } of listed.keys) {
    const value = await env.NUDGES.get(name);
    if (value) items.push(JSON.parse(value) as EdgeInboxItem);
  }
  return json({ items }, 200, {});
}

/** `POST /inbox/ack`: the API has made these into captures. */
export async function handleAck(
  request: Request,
  env: Env,
  now: () => Date = () => new Date(),
): Promise<Response> {
  if (!(await isServer(request, env, now))) {
    return json({ message: 'Only the API reads the inbox.' }, 401, {});
  }
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ message: 'Send JSON.' }, 400, {});
  }
  const parsed = v.safeParse(EdgeInboxAckSchema, body);
  if (!parsed.success) return json({ message: 'Send { keys }.' }, 400, {});
  for (const key of parsed.output.keys) await env.NUDGES.delete(key);
  return new Response(null, { status: 204 });
}

async function readDevices(kv: KvStore): Promise<EdgeDevice[]> {
  const raw = await kv.get(DEVICES_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as EdgeDevice[];
  } catch {
    return [];
  }
}

async function formatDevicesList(kv: KvStore): Promise<string> {
  const active = (await readDevices(kv)).filter((d) => !d.revokedAt);
  if (!active.length) return 'No active paired devices or linked apps.';
  const lines = active.map((d, i) => {
    const kind = d.host ? ` (${d.host})` : '';
    const date = d.pairedAt.slice(0, 10);
    return `${i + 1}. ${d.name}${kind} — paired ${date} [${d.id.slice(0, 8)}]`;
  });
  return [
    'Paired devices and linked apps:',
    ...lines,
    'Send /revoke <number or id> to revoke one.',
  ].join('\n');
}

async function revokeFromTelegram(
  kv: KvStore,
  arg: string,
  at: Date,
): Promise<string> {
  if (!arg) return 'Usage: /revoke <number or id> (send /devices to list).';
  const devices = await readDevices(kv);
  const active = devices.filter((d) => !d.revokedAt);
  let target: EdgeDevice | undefined;
  if (/^\d+$/.test(arg)) {
    target = active[Number(arg) - 1];
  } else {
    const needle = arg.toLowerCase();
    const matches = active.filter(
      (d) =>
        d.id.toLowerCase() === needle || d.id.toLowerCase().startsWith(needle),
    );
    if (matches.length > 1) {
      return 'More than one device matches that prefix. Send the number from /devices or the full id.';
    }
    target = matches[0];
  }
  if (!target) {
    return 'No active device matched that. Send /devices to list them.';
  }
  const revokedAt = at.toISOString();
  await kv.put(revokedKey(target.id), revokedAt);
  const revocation: EdgeRevocation = {
    key: revokeKey(target.id),
    deviceId: target.id,
    revokedAt,
  };
  await kv.put(revocation.key, JSON.stringify(revocation));
  const updated = devices.map((d) =>
    d.id === target.id ? { ...d, revokedAt } : d,
  );
  await kv.put(DEVICES_KEY, JSON.stringify(updated));
  return `Revoked ${target.name} ✓`;
}

/** `PUT /devices`: the API mirrors active and revoked device state to KV. */
async function handlePutDevices(
  request: Request,
  env: Env,
  now: () => Date,
): Promise<Response> {
  if (!(await isServer(request, env, now))) {
    return json({ message: 'Only the API updates devices.' }, 401, {});
  }
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ message: 'Send JSON.' }, 400, {});
  }
  const parsed = v.safeParse(EdgeDevicesSyncSchema, body);
  if (!parsed.success) {
    return json({ message: 'The devices payload is invalid.' }, 400, {});
  }
  await env.NUDGES.put(DEVICES_KEY, JSON.stringify(parsed.output.devices));
  for (const device of parsed.output.devices) {
    if (device.revokedAt) {
      await env.NUDGES.put(revokedKey(device.id), device.revokedAt);
    } else {
      await env.NUDGES.delete(revokedKey(device.id));
    }
  }
  return new Response(null, { status: 204 });
}

/** `GET /revocations`: the API pulls Telegram-triggered revocations. */
async function handleRevocations(
  request: Request,
  env: Env,
  now: () => Date,
): Promise<Response> {
  if (!(await isServer(request, env, now))) {
    return json({ message: 'Only the API reads revocations.' }, 401, {});
  }
  const listed = await env.NUDGES.list({ prefix: 'revoke:', limit: 100 });
  const revocations: EdgeRevocation[] = [];
  for (const { name } of listed.keys) {
    const value = await env.NUDGES.get(name);
    if (value) revocations.push(JSON.parse(value) as EdgeRevocation);
  }
  return json({ revocations }, 200, {});
}

/** `POST /revocations/ack`: the API has revoked these devices in MongoDB. */
async function handleRevocationsAck(
  request: Request,
  env: Env,
  now: () => Date,
): Promise<Response> {
  if (!(await isServer(request, env, now))) {
    return json({ message: 'Only the API acknowledges revocations.' }, 401, {});
  }
  let body: unknown;
  try {
    body = JSON.parse(await request.text());
  } catch {
    return json({ message: 'Send JSON.' }, 400, {});
  }
  const parsed = v.safeParse(EdgeRevocationAckSchema, body);
  if (!parsed.success) return json({ message: 'Send { keys }.' }, 400, {});
  for (const key of parsed.output.keys) await env.NUDGES.delete(key);
  return new Response(null, { status: 204 });
}
