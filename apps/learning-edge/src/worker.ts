import * as v from 'valibot';
import {
  EDGE_INBOX_PAGE,
  EdgeInboxAckSchema,
  type EdgeInboxItem,
  inboxKey,
  LIMITS,
  type NudgeLog,
  type NudgeState,
  NudgeStateSchema,
  nudgeDue,
  recapDue,
  SERVER_TOKEN_SUBJECT,
  TELEGRAM_VOICE_MAX_SECONDS,
  verifyDeviceToken,
} from '@ah/learning/domain';

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
  /** Comma-separated origins allowed to send the nudge state. */
  ALLOWED_ORIGINS: string;
}

type Fetch = typeof fetch;

const STATE_KEY = 'state';
const LOG_KEY = 'log';
/** The Monday of the last week a recap went out for. */
const RECAP_KEY = 'recap';
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
        'access-control-allow-methods': 'PUT, OPTIONS',
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
 * and the Sunday recap when `recapDue` does, and remember each, so a nudge
 * goes out at most once a day per kind and the recap once a week.
 */
export async function handleScheduled(
  env: Env,
  now: Date,
  fetchFn: Fetch = (input, init) => fetch(input, init),
): Promise<'sent' | 'quiet' | 'no-state'> {
  const stored = await env.NUDGES.get(STATE_KEY);
  if (!stored) return 'no-state';
  const { state } = JSON.parse(stored) as StoredState;
  let sentAny = false;

  const recap = recapDue(state, await env.NUDGES.get(RECAP_KEY), now);
  if (recap) {
    await sendTelegram(env, fetchFn, recap.text);
    await env.NUDGES.put(RECAP_KEY, recap.week);
    sentAny = true;
  }

  const logText = await env.NUDGES.get(LOG_KEY);
  const log = logText ? (JSON.parse(logText) as NudgeLog) : null;
  const due = nudgeDue(state, log, now);
  if (due) {
    await sendTelegram(env, fetchFn, due.text);
    const sent = log?.localDate === due.localDate ? log.sent : [];
    await env.NUDGES.put(
      LOG_KEY,
      JSON.stringify({ localDate: due.localDate, sent: [...sent, due.kind] }),
    );
    sentAny = true;
  }
  return sentAny ? 'sent' : 'quiet';
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
  'Send me an idea, a quote or a voice note (up to 2 minutes), or forward a message. It goes to your Learning Inbox, where the AI explains it.';

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
