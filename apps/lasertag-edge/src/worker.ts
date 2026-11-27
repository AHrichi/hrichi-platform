import {
  BODY_LIMIT_BYTES,
  type ErrorCode,
  MIN_TOKEN_SECRET_LENGTH,
} from '@ah/products/lasertag/domain';
import {
  createService,
  type LasertagService,
  ServiceError,
  simpleWebAuthnPasskeys,
} from '@ah/products/lasertag/server';
import { type D1Database, D1LasertagRepository } from './d1-repository';

/** Cloudflare's rate limit binding. */
export interface RateLimit {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export interface Env {
  readonly DB: D1Database;
  /** Signs sessions: `wrangler secret put LASERTAG_TOKEN_SECRET`, 32+ characters. */
  readonly LASERTAG_TOKEN_SECRET?: string;
  /** Lets the first manager claim a venue with no staff; unset turns it off. */
  readonly LASERTAG_BOOTSTRAP_CODE?: string;
  /** Pages allowed to call, comma-separated, exact origins. */
  readonly ALLOWED_ORIGINS: string;
  /** The passkeys' relying party: the app's domain, and its name. */
  readonly RP_ID: string;
  readonly RP_NAME: string;
  /** Every request, per IP. */
  readonly PER_IP?: RateLimit;
  /** Signing up or in, recovery and codes, per IP: guessing is slow. */
  readonly AUTH?: RateLimit;
}

export interface Deps {
  readonly log?: (line: string) => void;
  readonly now?: () => Date;
  /** Tests pass a service; the Worker builds one on D1. */
  readonly service?: LasertagService;
}

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

function origins(env: Env): string[] {
  return env.ALLOWED_ORIGINS.split(',')
    .map((o) => o.trim())
    .filter(Boolean);
}

export function isReady(env: Env): boolean {
  return (
    (env.LASERTAG_TOKEN_SECRET?.length ?? 0) >= MIN_TOKEN_SECRET_LENGTH &&
    Boolean(env.DB) &&
    Boolean(env.RP_ID)
  );
}

export function serviceFor(env: Env, now?: () => Date): LasertagService {
  return createService({
    repo: new D1LasertagRepository(env.DB),
    passkeys: simpleWebAuthnPasskeys({
      id: env.RP_ID,
      name: env.RP_NAME,
      // A passkey ceremony may only come from a page on the relying party.
      origins: origins(env).filter((o) => {
        const host = new URL(o).hostname;
        return host === env.RP_ID || host.endsWith(`.${env.RP_ID}`);
      }),
    }),
    secret: env.LASERTAG_TOKEN_SECRET ?? '',
    bootstrapCode: env.LASERTAG_BOOTSTRAP_CODE ?? null,
    now,
  });
}

const AUTH_ROUTES = new Set([
  '/v1/signup/start',
  '/v1/signup/finish',
  '/v1/signin/start',
  '/v1/signin/finish',
  '/v1/recovery/start',
  '/v1/recovery/finish',
  '/v1/me/claim',
]);

/**
 * BARQ's Worker (ADR-0033). CORS by exact origin; JSON bodies read under a
 * cap as they arrive; rate limits per IP, stricter for passkeys and codes;
 * never cached; logs carry the route, status and time, never names, badges
 * or codes. Every route is one call to the service.
 */
export async function handleRequest(
  request: Request,
  env: Env,
  deps: Deps = {},
): Promise<Response> {
  const started = Date.now();
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const allowed = origin && origins(env).includes(origin) ? origin : null;
  const cors: Record<string, string> = allowed
    ? {
        'access-control-allow-origin': allowed,
        'access-control-allow-methods': 'GET, POST, DELETE, OPTIONS',
        'access-control-allow-headers': 'content-type, authorization',
        'access-control-max-age': '86400',
        vary: 'origin',
      }
    : { vary: 'origin' };
  // Ids in paths are replaced, so logs can't link a person to a session.
  const route = `${request.method} ${url.pathname.replace(/[0-9a-f-]{36}/g, ':id')}`;
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
    code: ErrorCode,
    message: string,
    extra: Record<string, unknown> = {},
  ) => send(status, { ok: false, code, message, ...extra });

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: cors });
  }
  const ready = isReady(env);
  if (url.pathname === '/health' && request.method === 'GET') {
    return json(200, { ok: true, ready }, cors);
  }
  if (!allowed) return failure(403, 'FORBIDDEN_ORIGIN', 'Origin not allowed');
  if (!ready && !deps.service) {
    return failure(503, 'UNAVAILABLE', 'BARQ isn’t set up on this server yet');
  }

  const ip = request.headers.get('cf-connecting-ip') ?? 'unknown';
  const auth = request.method === 'POST' && AUTH_ROUTES.has(url.pathname);
  if (
    !(await allows(env.PER_IP, ip, 120, started)) ||
    (auth && !(await allows(env.AUTH, `auth:${ip}`, 20, started)))
  ) {
    return failure(429, 'RATE_LIMITED', 'Too many requests', {
      retryAfterSec: 60,
    });
  }

  const service = deps.service ?? serviceFor(env, deps.now);
  const token =
    request.headers.get('authorization')?.match(/^Bearer (\S+)$/)?.[1] ?? null;
  const body = async (): Promise<unknown> => {
    if (!request.headers.get('content-type')?.includes('application/json')) {
      throw new BadBody(400, 'Send JSON');
    }
    const declared = Number(request.headers.get('content-length') ?? '0');
    if (declared > BODY_LIMIT_BYTES) throw new BadBody(413, 'Too large');
    const text = await readCapped(request, BODY_LIMIT_BYTES);
    if (text === null) throw new BadBody(413, 'Too large');
    try {
      return JSON.parse(text) as unknown;
    } catch {
      throw new BadBody(400, 'Send JSON');
    }
  };

  try {
    const data = await dispatch(request.method, url.pathname, {
      service,
      token,
      body,
    });
    if (data === NOT_FOUND) return failure(404, 'NOT_FOUND', 'Not found');
    return send(200, { ok: true, data });
  } catch (error) {
    if (error instanceof BadBody) {
      return failure(
        error.status,
        error.status === 413 ? 'TOO_LARGE' : 'BAD_REQUEST',
        error.message,
      );
    }
    if (error instanceof ServiceError) {
      return failure(error.status, error.code, error.message, {
        ...(error.detail ? { detail: error.detail } : {}),
      });
    }
    // A crash still answers in the protocol, with CORS; the log names the
    // error, never what was sent.
    log(503, { error: error instanceof Error ? error.name : 'unknown' });
    return json(
      503,
      { ok: false, code: 'UNAVAILABLE', message: 'BARQ failed' },
      cors,
    );
  }
}

const NOT_FOUND = Symbol('not found');

async function dispatch(
  method: string,
  path: string,
  ctx: {
    service: LasertagService;
    token: string | null;
    body: () => Promise<unknown>;
  },
): Promise<unknown> {
  const { service: s, token, body } = ctx;
  const post = method === 'POST';
  const get = method === 'GET';
  const del = method === 'DELETE';
  if (post && path === '/v1/signup/start') return s.signupStart(await body());
  if (post && path === '/v1/signup/finish') return s.signupFinish(await body());
  if (post && path === '/v1/signin/start') return s.signinStart();
  if (post && path === '/v1/signin/finish') return s.signinFinish(await body());
  if (post && path === '/v1/recovery/start')
    return s.recoveryStart(await body());
  if (post && path === '/v1/recovery/finish')
    return s.recoveryFinish(await body());
  if (get && path === '/v1/me') return s.me(token);
  if (post && path === '/v1/me/claim') return s.claimGuest(token, await body());

  const venue = /^\/v1\/venues\/([a-z0-9-]{1,60})(\/[a-z-]+)?$/.exec(path);
  if (venue) {
    const [, slug, rest = ''] = venue;
    if (get && rest === '') return s.venue(token, slug);
    if (post && rest === '/staff-claim')
      return s.staffClaim(token, slug, await body());
    if (post && rest === '/recovery')
      return s.issueRecovery(token, slug, await body());
    if (post && rest === '/guests')
      return s.createGuest(token, slug, await body());
    if (get && rest === '/sessions') return s.openSessions(token, slug);
    if (post && rest === '/sessions')
      return s.openSession(token, slug, await body());
    return NOT_FOUND;
  }
  const session = /^\/v1\/sessions\/([0-9a-f-]{36})(\/[a-z]+)?$/.exec(path);
  if (session) {
    const [, id, rest = ''] = session;
    if (get && rest === '') return s.session(token, id);
    if (post && rest === '/close') return s.closeSession(token, id);
    if (post && rest === '/checkins') return s.checkIn(token, id, await body());
    return NOT_FOUND;
  }
  const checkIn = /^\/v1\/checkins\/([0-9a-f-]{36})$/.exec(path);
  if (checkIn && del) return s.release(token, checkIn[1]);
  return NOT_FOUND;
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

function json(status: number, body: unknown, headers: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'content-type': 'application/json; charset=utf-8',
      'cache-control': 'no-store',
    },
  });
}

/** The daily sweep: expired guests and abandoned ceremonies. */
export async function sweep(env: Env, deps: Deps = {}): Promise<void> {
  if (!isReady(env)) return;
  const result = await (deps.service ?? serviceFor(env, deps.now)).sweep();
  (deps.log ?? console.log)(JSON.stringify({ route: 'sweep', ...result }));
}
