import { SERRA_ASSISTANT } from '@ah/products/serracalc/domain';
import {
  ASSISTANT_LIMITS,
  type ChatErrorCode,
  type ChatResponse,
  compileProfile,
} from '@ah/shared/assistant';
import {
  buildLadder,
  type ChatLog,
  handleChat,
  type WorkersAiBinding,
} from '@ah/shared/assistant-engine';

/** A Workers rate-limit binding (`ratelimits` in wrangler.jsonc). */
export interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  readonly AI?: WorkersAiBinding;
  readonly PER_IP?: RateLimit;
  readonly GLOBAL?: RateLimit;
  readonly GROQ_API_KEY?: string;
  readonly GEMINI_API_KEY?: string;
  readonly OLLAMA_URL?: string;
  readonly LADDER: string;
  readonly ALLOWED_ORIGINS: string;
}

export interface Deps {
  readonly fetch?: typeof fetch;
  /** One line of metadata per request; never what was said. */
  readonly log?: (line: string) => void;
}

/** Every product this Worker serves, compiled once when it starts. */
const PROFILES = new Map(
  [SERRA_ASSISTANT].map((profile) => [profile.id, compileProfile(profile)]),
);

/**
 * Without the rate-limit bindings (a plan without them, or tests), a
 * per-isolate window: weaker, but never none.
 */
const fallbackWindow = new Map<string, number[]>();
function fallbackLimit(key: string, limit: number, now: number): boolean {
  const recent = (fallbackWindow.get(key) ?? []).filter(
    (t) => now - t < 60_000,
  );
  if (recent.length >= limit) {
    fallbackWindow.set(key, recent);
    return false;
  }
  recent.push(now);
  fallbackWindow.set(key, recent);
  if (fallbackWindow.size > 5_000) fallbackWindow.clear();
  return true;
}

export async function handleRequest(
  request: Request,
  env: Env,
  deps: Deps = {},
): Promise<Response> {
  const started = Date.now();
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const allowed = allowedOrigin(origin, env);
  const cors: Record<string, string> = allowed
    ? {
        'access-control-allow-origin': allowed,
        'access-control-allow-methods': 'POST, GET, OPTIONS',
        'access-control-allow-headers': 'content-type',
        'access-control-max-age': '86400',
        vary: 'origin',
      }
    : { vary: 'origin' };
  const log = (status: number, extra: Partial<ChatLog> = {}) =>
    (deps.log ?? console.log)(
      JSON.stringify({
        route: url.pathname,
        status,
        ms: Date.now() - started,
        ...extra,
      }),
    );

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  if (url.pathname === '/health' && request.method === 'GET') {
    const { ladder, skipped } = buildLadder(env.LADDER, env);
    return json(200, { ok: true, models: ladder.labels, skipped }, cors);
  }
  if (url.pathname !== '/v1/chat' || request.method !== 'POST') {
    return json(404, { message: 'Not found.' }, cors);
  }

  const failure = (
    status: number,
    code: ChatErrorCode,
    message: string,
    retryAfterSec?: number,
  ) => {
    log(status);
    const body: ChatResponse = {
      v: 1,
      ok: false,
      code,
      message,
      ...(retryAfterSec !== undefined ? { retryAfterSec } : {}),
    };
    return json(status, body, {
      ...cors,
      ...(retryAfterSec !== undefined
        ? { 'retry-after': String(retryAfterSec) }
        : {}),
    });
  };

  if (!allowed) return failure(403, 'FORBIDDEN_ORIGIN', 'Origin not allowed');
  if (!request.headers.get('content-type')?.includes('application/json')) {
    return failure(400, 'BAD_REQUEST', 'Send JSON');
  }
  const declared = Number(request.headers.get('content-length') ?? '0');
  if (declared > ASSISTANT_LIMITS.bodyBytes) {
    return failure(413, 'TOO_LARGE', 'Request too large');
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const perIp = env.PER_IP
    ? (await env.PER_IP.limit({ key: ip })).success
    : fallbackLimit(ip, 8, started);
  const overall = env.GLOBAL
    ? (await env.GLOBAL.limit({ key: 'all' })).success
    : fallbackLimit('all', 60, started);
  if (!perIp || !overall) {
    return failure(429, 'RATE_LIMITED', 'Too many requests', 60);
  }

  const text = await readCapped(request, ASSISTANT_LIMITS.bodyBytes);
  if (text === null) return failure(413, 'TOO_LARGE', 'Request too large');
  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return failure(400, 'BAD_REQUEST', 'Send JSON');
  }

  const { ladder } = buildLadder(env.LADDER, env, deps.fetch);
  const outcome = await handleChat(body, {
    profiles: PROFILES,
    ladder,
    log: (entry) => log(entry.status, entry),
  });
  const retry: Record<string, string> =
    outcome.body.ok === false && outcome.body.retryAfterSec !== undefined
      ? { 'retry-after': String(outcome.body.retryAfterSec) }
      : {};
  return json(outcome.status, outcome.body, { ...cors, ...retry });
}

function allowedOrigin(origin: string | null, env: Env): string | null {
  if (!origin) return null;
  const list = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim());
  return list.includes(origin) ? origin : null;
}

/** The body as text, or null past `cap` bytes: read as it arrives. */
async function readCapped(
  request: Request,
  cap: number,
): Promise<string | null> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > cap) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const all = new Uint8Array(size);
  let at = 0;
  for (const chunk of chunks) {
    all.set(chunk, at);
    at += chunk.byteLength;
  }
  return new TextDecoder().decode(all);
}

function json(
  status: number,
  body: unknown,
  headers: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
      ...headers,
    },
  });
}
