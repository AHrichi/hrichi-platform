import { inject, InjectionToken } from '@angular/core';
import type { SyncFailure } from '@ah/shared/sync';
import { SiteConfigService } from '@ah/shared/site-config';

/** No answer: offline, the server unreachable, or no sync server set up. */
export interface SyncNoAnswer {
  readonly ok: false;
  readonly code: 'OFFLINE' | 'NOT_CONFIGURED';
}

export type SyncReply<T> = T | SyncFailure | SyncNoAnswer;

/** One call to the sync server; never throws. */
export interface SyncTransport {
  call<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    options?: { token?: string; body?: unknown },
  ): Promise<SyncReply<T>>;
}

const TIMEOUT_MS = 20_000;

/** The sync Worker at `syncUrl` from site-config.json; swappable in tests. */
export const SYNC_TRANSPORT = new InjectionToken<SyncTransport>(
  'SYNC_TRANSPORT',
  {
    providedIn: 'root',
    factory: () => {
      const config = inject(SiteConfigService);
      return {
        async call<T>(
          method: 'GET' | 'POST' | 'DELETE',
          path: string,
          options: { token?: string; body?: unknown } = {},
        ): Promise<SyncReply<T>> {
          const url = (await config.load()).syncUrl;
          if (!url) return { ok: false, code: 'NOT_CONFIGURED' };
          try {
            const response = await fetch(`${url.replace(/\/$/, '')}${path}`, {
              method,
              headers: {
                ...(options.body !== undefined
                  ? { 'content-type': 'application/json' }
                  : {}),
                ...(options.token
                  ? { authorization: `Bearer ${options.token}` }
                  : {}),
              },
              body:
                options.body === undefined
                  ? undefined
                  : JSON.stringify(options.body),
              signal: AbortSignal.timeout(TIMEOUT_MS),
            });
            const body = (await response.json()) as unknown;
            return typeof body === 'object' && body !== null && 'ok' in body
              ? (body as SyncReply<T>)
              : { ok: false, code: 'OFFLINE' };
          } catch {
            return { ok: false, code: 'OFFLINE' };
          }
        },
      };
    },
  },
);
