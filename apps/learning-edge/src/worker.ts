import * as v from 'valibot';
import {
  type NudgeLog,
  type NudgeState,
  NudgeStateSchema,
  nudgeDue,
  verifyDeviceToken,
} from '@ah/learning/domain';

/** The slice of Workers KV this Worker uses. */
export interface KvStore {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
}

export interface Env {
  NUDGES: KvStore;
  /** The API's LEARNING_TOKEN_SECRET: device tokens are checked here too. */
  LEARNING_TOKEN_SECRET: string;
  TELEGRAM_BOT_TOKEN: string;
  TELEGRAM_CHAT_ID: string;
  /** Comma-separated origins allowed to send the nudge state. */
  ALLOWED_ORIGINS: string;
}

type Fetch = typeof fetch;

const STATE_KEY = 'state';
const LOG_KEY = 'log';

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

/**
 * The Cron Trigger, every 15 minutes: send a nudge when `nudgeDue` says so,
 * and remember it, so each kind goes out at most once a day.
 */
export async function handleScheduled(
  env: Env,
  now: Date,
  fetchFn: Fetch = (input, init) => fetch(input, init),
): Promise<'sent' | 'quiet' | 'no-state'> {
  const stored = await env.NUDGES.get(STATE_KEY);
  if (!stored) return 'no-state';
  const { state } = JSON.parse(stored) as StoredState;
  const logText = await env.NUDGES.get(LOG_KEY);
  const log = logText ? (JSON.parse(logText) as NudgeLog) : null;
  const due = nudgeDue(state, log, now);
  if (!due) return 'quiet';

  const response = await fetchFn(
    `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: due.text }),
    },
  );
  if (!response.ok) throw new Error(`Telegram answered ${response.status}`);
  const sent = log?.localDate === due.localDate ? log.sent : [];
  await env.NUDGES.put(
    LOG_KEY,
    JSON.stringify({ localDate: due.localDate, sent: [...sent, due.kind] }),
  );
  return 'sent';
}
