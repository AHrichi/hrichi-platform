import {
  MIN_SYNC_SECRET_LENGTH,
  SYNC_LIMITS,
  type SyncAppSpec,
  type SyncErrorCode,
} from '@ah/shared/sync';
import { type SyncOutcome, SyncService } from '@ah/shared/sync-server';
import { SERRA_SYNC } from '@ah/products/serracalc/domain';
import { type D1Database, D1SyncRepository } from './d1-repository';

/** Cloudflare's rate limit binding. */
export interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  readonly DB: D1Database;
  /** Signs device tokens: `wrangler secret put SYNC_TOKEN_SECRET`. */
  readonly SYNC_TOKEN_SECRET?: string;
  /** The pages allowed to call, comma-separated, exactly. */
  readonly ALLOWED_ORIGINS: string;
  /** Every request, per IP. */
  readonly PER_IP?: RateLimit;
  /** Starting a space and using a code, per IP: guessing codes is slow. */
  readonly JOIN?: RateLimit;
}

export interface Deps {
  readonly log?: (line: string) => void;
  /** Tests pass a clock and a store; the Worker uses D1 and the time. */
  readonly now?: () => Date;
  readonly service?: SyncService;
}

/** The apps this server syncs for. */
export const SPECS: readonly SyncAppSpec[] = [SERRA_SYNC];

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

/** A rate limit binding's answer, or this isolate's own count if it fails. */
async function allows(
  binding: RateLimit | undefined,
  key: string,
  limit: number,
  now: number,
): Promise<boolean> {
  if (binding) {
    try {
      return (await binding.limit({ key })).success;
    } catch {
      // The binding is down: count here rather than turn people away.
    }
  }
  return fallbackLimit(key, limit, now);
}

/**
 * The sync Worker (ADR-0032): sync spaces for the platform's apps, kept in
 * D1. CORS by exact origin; JSON bodies read under a cap as they arrive;
 * rate limits per IP, stricter for starting a space and using a code;
 * replies never cached; logs carry the route, status and time, never the
 * records. Every route is a call to `SyncService`.
 */
export async function handleRequest(
  request: Request,
  env: Env,
  deps: Deps = {},
): Promise<Response> {
  const started = Date.now();
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const allowed =
    origin &&
    env.ALLOWED_ORIGINS.split(',')
      .map((o) => o.trim())
      .includes(origin)
      ? origin
      : null;
  const cors: Record<string, string> = allowed
    ? {
        'access-control-allow-origin': allowed,
        'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
        'access-control-allow-headers': 'content-type, authorization',
        'access-control-max-age': '86400',
        vary: 'origin',
      }
    : { vary: 'origin' };
  const route = `${request.method} ${url.pathname.replace(/\/devices\/[^/]+$/, '/devices/:id')}`;
  const log = (status: number, extra: Record<string, unknown> = {}) =>
    (deps.log ?? console.log)(
      JSON.stringify({ route, status, ms: Date.now() - started, ...extra }),
    );
  const send = (status: number, body: unknown) => {
    log(status);
    return json(status, body, cors);
  };
  const failure = (
    status: number,
    code: SyncErrorCode,
    message: string,
    retryAfterSec?: number,
  ) =>
    send(status, {
      v: 1,
      ok: false,
      code,
      message,
      ...(retryAfterSec !== undefined ? { retryAfterSec } : {}),
    });

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  const ready =
    (env.SYNC_TOKEN_SECRET?.length ?? 0) >= MIN_SYNC_SECRET_LENGTH &&
    Boolean(env.DB);
  if (url.pathname === '/health' && request.method === 'GET') {
    return json(200, { ok: true, ready }, cors);
  }
  if (!allowed) return failure(403, 'FORBIDDEN_ORIGIN', 'Origin not allowed');
  if (!ready && !deps.service) {
    return failure(503, 'UNAVAILABLE', 'Sync isn’t set up on this server yet');
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const joining =
    request.method === 'POST' &&
    (url.pathname === '/v1/spaces' || url.pathname === '/v1/pairings/claim');
  if (
    !(await allows(env.PER_IP, ip, 60, started)) ||
    (joining && !(await allows(env.JOIN, `join:${ip}`, 6, started)))
  ) {
    return failure(429, 'RATE_LIMITED', 'Too many requests', 60);
  }

  const service =
    deps.service ??
    new SyncService({
      repository: new D1SyncRepository(env.DB),
      secret: env.SYNC_TOKEN_SECRET ?? '',
      specs: SPECS,
      now: deps.now,
    });
  const token =
    request.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1] ?? null;

  const body = async (): Promise<unknown> => {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      throw new BadBody(400, 'Send JSON');
    }
    const declared = Number(request.headers.get('content-length') ?? '0');
    if (declared > SYNC_LIMITS.bodyBytes) throw new BadBody(413, 'Too large');
    const text = await readCapped(request, SYNC_LIMITS.bodyBytes);
    if (text === null) throw new BadBody(413, 'Too large');
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new BadBody(400, 'Send JSON');
    }
  };

  try {
    let outcome: SyncOutcome<unknown> | null = null;
    const { pathname } = url;
    const deviceRoute = pathname.match(/^\/v1\/devices\/([0-9a-f-]{36})$/);
    if (request.method === 'POST' && pathname === '/v1/spaces') {
      outcome = await service.createSpace(await body());
    } else if (request.method === 'POST' && pathname === '/v1/pairings') {
      outcome = await service.startPairing(token);
    } else if (request.method === 'POST' && pathname === '/v1/pairings/claim') {
      outcome = await service.claim(await body());
    } else if (request.method === 'GET' && pathname === '/v1/devices') {
      outcome = await service.devices(token);
    } else if (request.method === 'DELETE' && deviceRoute) {
      outcome = await service.revoke(token, deviceRoute[1]);
    } else if (
      request.method === 'DELETE' &&
      pathname === '/v1/spaces/current'
    ) {
      outcome = await service.deleteSpace(token);
    } else if (request.method === 'POST' && pathname === '/v1/sync') {
      outcome = await service.sync(token, await body());
    }
    if (!outcome) return failure(404, 'NOT_FOUND', 'Not found');
    return send(outcome.status, outcome.body);
  } catch (error) {
    if (error instanceof BadBody) {
      return failure(
        error.status,
        error.status === 413 ? 'TOO_LARGE' : 'BAD_REQUEST',
        error.message,
      );
    }
    // A crash still answers in the protocol, with CORS; the log names the
    // error, never the records.
    log(503, { error: error instanceof Error ? error.name : 'unknown' });
    return json(
      503,
      { v: 1, ok: false, code: 'UNAVAILABLE', message: 'Sync failed' },
      cors,
    );
  }
}

class BadBody extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
  }
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

/** The daily clean-up: spent codes, and spaces idle for a year. */
export async function sweep(env: Env, deps: Deps = {}): Promise<void> {
  if ((env.SYNC_TOKEN_SECRET?.length ?? 0) < MIN_SYNC_SECRET_LENGTH) return;
  const service =
    deps.service ??
    new SyncService({
      repository: new D1SyncRepository(env.DB),
      secret: env.SYNC_TOKEN_SECRET ?? '',
      specs: SPECS,
      now: deps.now,
    });
  const swept = await service.sweep();
  (deps.log ?? console.log)(JSON.stringify({ route: 'cron sweep', ...swept }));
}
