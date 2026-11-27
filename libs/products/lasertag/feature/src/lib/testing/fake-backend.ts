import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import {
  type KeyValueStore,
  type PasskeyDevice,
  PasskeyError,
} from '@ah/products/lasertag/data-access';
import { FIRST_VENUE_SLUG } from '@ah/products/lasertag/domain';
import {
  createService,
  type LasertagService,
  MemoryRepository,
  ServiceError,
} from '@ah/products/lasertag/server';
import {
  fakeCredential,
  fakePasskeys,
} from '@ah/products/lasertag/server/testing';
import { SiteConfigService } from '@ah/shared/site-config';
import { LASERTAG_ROUTES } from '../lasertag.routes';
import { PASSKEYS, SESSION_STORAGE } from '../state/barq-session';

export const BOOTSTRAP = 'test-warehouse-claim';
const BASE = 'http://edge.test';

/**
 * The real service in memory behind `fetch`, as lasertag-edge would answer,
 * and a passkey device that echoes the server's challenge. Screens run
 * against the same rules as production, without a network or a browser
 * authenticator.
 */
export function fakeBackend() {
  const passkeys = fakePasskeys();
  const service = createService({
    repo: new MemoryRepository(),
    passkeys,
    secret: 'a-test-secret-that-is-long-enough-for-hmac',
    bootstrapCode: BOOTSTRAP,
  });
  let credentialCount = 0;
  const device: PasskeyDevice & { cancelNext: boolean } = {
    cancelNext: false,
    supported: () => true,
    async create() {
      if (device.cancelNext) {
        device.cancelNext = false;
        throw new PasskeyError('cancelled');
      }
      credentialCount += 1;
      return fakeCredential(
        `cred-${credentialCount}`,
        passkeys.lastChallenge(),
      );
    },
    async get() {
      return fakeCredential('cred-1', passkeys.lastChallenge());
    },
  };
  const fetcher = async (url: string, init?: RequestInit) => {
    const path = new URL(url).pathname;
    const method = init?.method ?? 'GET';
    const body = init?.body ? JSON.parse(String(init.body)) : undefined;
    const auth = (init?.headers as Record<string, string> | undefined)?.[
      'authorization'
    ];
    const token = auth?.startsWith('Bearer ') ? auth.slice(7) : null;
    try {
      return answer(200, {
        ok: true,
        data: await route(service, method, path, body, token),
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        return answer(error.status, {
          ok: false,
          code: error.code,
          message: error.message,
          ...(error.detail ? { detail: error.detail } : {}),
        });
      }
      throw error;
    }
  };
  const memory = new Map<string, string>();
  const storage: KeyValueStore = {
    getItem: (key) => memory.get(key) ?? null,
    setItem: (key, value) => void memory.set(key, value),
    removeItem: (key) => void memory.delete(key),
  };
  return { service, passkeys, device, fetcher, storage };
}

function answer(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), { status });
}

async function route(
  s: LasertagService,
  method: string,
  path: string,
  body: unknown,
  token: string | null,
): Promise<unknown> {
  const slug = FIRST_VENUE_SLUG;
  const venue = `/v1/venues/${slug}`;
  const session = /^\/v1\/sessions\/([0-9a-f-]{36})(\/[a-z]+)?$/.exec(path);
  if (path === '/v1/signup/start') return s.signupStart(body);
  if (path === '/v1/signup/finish') return s.signupFinish(body);
  if (path === '/v1/signin/start') return s.signinStart();
  if (path === '/v1/signin/finish') return s.signinFinish(body);
  if (path === '/v1/recovery/start') return s.recoveryStart(body);
  if (path === '/v1/recovery/finish') return s.recoveryFinish(body);
  if (path === '/v1/me') return s.me(token);
  if (path === '/v1/me/claim') return s.claimGuest(token, body);
  if (path === venue) return s.venue(token, slug);
  if (path === `${venue}/staff-claim`) return s.staffClaim(token, slug, body);
  if (path === `${venue}/recovery`) return s.issueRecovery(token, slug, body);
  if (path === `${venue}/guests`) return s.createGuest(token, slug, body);
  if (path === `${venue}/sessions`) {
    return method === 'GET'
      ? s.openSessions(token, slug)
      : s.openSession(token, slug, body);
  }
  if (session && !session[2]) return s.session(token, session[1]);
  if (session?.[2] === '/close') return s.closeSession(token, session[1]);
  if (session?.[2] === '/checkins') return s.checkIn(token, session[1], body);
  const release = /^\/v1\/checkins\/([0-9a-f-]{36})$/.exec(path);
  if (release) return s.release(token, release[1]);
  throw new ServiceError('NOT_FOUND', 404, `No route ${method} ${path}`);
}

/** TestBed with BARQ's routes, the fake backend and a site config naming it. */
export function setupBarq() {
  const backend = fakeBackend();
  vi.stubGlobal('fetch', backend.fetcher);
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      provideRouter(LASERTAG_ROUTES),
      { provide: PASSKEYS, useValue: backend.device },
      { provide: SESSION_STORAGE, useValue: backend.storage },
      {
        provide: SiteConfigService,
        useValue: { load: async () => ({ lasertagUrl: BASE }) },
      },
    ],
  });
  return backend;
}
