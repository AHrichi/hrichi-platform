import { DOCUMENT, isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { Routes } from '@angular/router';
import { FederationStore, type RemoteFailure } from './federation.store';
import {
  REMOTE_EXPOSES,
  type RemoteCapability,
  type RemoteMeta,
  type RemoteMetaModule,
  type RemoteRoutesModule,
} from './remote-contract';
import { REMOTE_LOADER } from './remote-loader';
import { RemoteUnavailable } from './remote-unavailable';

export interface FederatedRoutesOptions {
  /** Defaults to `./routes`, the key every remote exposes. */
  exposedModule?: string;
  /** Show the fallback when the remote takes longer than this. */
  timeoutMs?: number;
}

class TimeoutError extends Error {}
class ContractError extends Error {}

/**
 * `loadChildren` for a remote. It never rejects: a remote that is down, slow,
 * breaks the contract or needs a browser feature that's missing renders
 * `RemoteUnavailable` instead of crashing the shell. Every attempt is
 * recorded in `FederationStore` for the Federation Inspector (ADR-0012).
 */
export function federatedRoutes(
  remoteName: string,
  {
    exposedModule = REMOTE_EXPOSES.routes,
    timeoutMs = 10_000,
  }: FederatedRoutesOptions = {},
): () => Promise<Routes> {
  return async () => {
    if (typeof (globalThis as any).ngDevMode === 'undefined') {
      (globalThis as any).ngDevMode = false;
    }
    // Remote routes render on the client only, so prerendering never fetches a remote.
    if (isPlatformServer(inject(PLATFORM_ID))) {
      return [];
    }
    const loadRemoteModule = inject(REMOTE_LOADER);
    const store = inject(FederationStore);
    const window = inject(DOCUMENT).defaultView as Window;
    const now = () => window.performance.now();
    const fallback: Routes = [
      { path: '**', component: RemoteUnavailable, data: { remoteName } },
    ];

    store.recordStart(remoteName, now());
    let meta: RemoteMeta | null = null;
    try {
      const [routes, metaModule] = await withTimeout(
        Promise.all([
          loadRemoteModule<RemoteRoutesModule>(remoteName, exposedModule),
          loadRemoteModule<RemoteMetaModule>(remoteName, REMOTE_EXPOSES.meta),
        ]),
        timeoutMs,
        remoteName,
      );
      meta = metaModule?.remoteMeta ?? null;
      if (!meta || !Array.isArray(routes?.remoteRoutes)) {
        throw new ContractError(
          `Remote "${remoteName}" must export remoteRoutes from ${exposedModule} and remoteMeta from ${REMOTE_EXPOSES.meta}`,
        );
      }
      const missing = meta.capabilities.filter(
        (capability) => !supports(window, capability),
      );
      if (missing.length > 0) {
        store.recordFailure(
          remoteName,
          { kind: 'capability', missing },
          now(),
          meta,
        );
        return fallback;
      }
      store.recordLoaded(remoteName, meta, now());
      return routes.remoteRoutes;
    } catch (error) {
      console.error(
        `[federation] remote "${remoteName}" is unavailable`,
        error,
      );
      store.recordFailure(remoteName, describe(error), now(), meta);
      return fallback;
    }
  };
}

function describe(error: unknown): RemoteFailure {
  const message = error instanceof Error ? error.message : String(error);
  if (error instanceof TimeoutError) {
    return { kind: 'timeout', message };
  }
  if (error instanceof ContractError) {
    return { kind: 'contract', message };
  }
  return { kind: 'error', message };
}

/** Whether this browser can run a remote that declares `capability`. */
export function supports(
  window: Window,
  capability: RemoteCapability,
): boolean {
  switch (capability) {
    case 'webgl': {
      if (!('WebGL2RenderingContext' in window)) {
        return false;
      }
      // The constructor exists even when the GPU is blocklisted; try it.
      const gl = window.document.createElement('canvas').getContext('webgl2');
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
      return gl !== null;
    }
    case 'worker':
      return 'Worker' in window;
    case 'indexeddb':
      return 'indexedDB' in window;
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  remoteName: string,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new TimeoutError(`Remote "${remoteName}" timed out after ${ms} ms`),
        ),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
