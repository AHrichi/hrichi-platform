import { isPlatformServer } from '@angular/common';
import { inject, PLATFORM_ID } from '@angular/core';
import { Routes } from '@angular/router';
import { REMOTE_EXPOSES, RemoteRoutesModule } from './remote-contract';
import { REMOTE_LOADER } from './remote-loader';
import { RemoteUnavailable } from './remote-unavailable';

export interface FederatedRoutesOptions {
  /** Defaults to `./routes`, the key every remote exposes. */
  exposedModule?: string;
  /** Show the fallback when the remote takes longer than this. */
  timeoutMs?: number;
}

/**
 * `loadChildren` for a remote. It never rejects: a remote that is down, slow
 * or breaks the contract renders `RemoteUnavailable` instead of crashing the shell.
 */
export function federatedRoutes(
  remoteName: string,
  {
    exposedModule = REMOTE_EXPOSES.routes,
    timeoutMs = 10_000,
  }: FederatedRoutesOptions = {},
): () => Promise<Routes> {
  return async () => {
    // Remote routes render on the client only, so prerendering never fetches a remote.
    if (isPlatformServer(inject(PLATFORM_ID))) {
      return [];
    }
    const loadRemoteModule = inject(REMOTE_LOADER);

    try {
      const module = await withTimeout(
        loadRemoteModule<RemoteRoutesModule>(remoteName, exposedModule),
        timeoutMs,
        remoteName,
      );
      if (!Array.isArray(module?.remoteRoutes)) {
        throw new Error(
          `Remote "${remoteName}" does not export remoteRoutes from ${exposedModule}`,
        );
      }
      return module.remoteRoutes;
    } catch (error) {
      console.error(
        `[federation] remote "${remoteName}" is unavailable`,
        error,
      );
      return [
        { path: '**', component: RemoteUnavailable, data: { remoteName } },
      ];
    }
  };
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
        reject(new Error(`Remote "${remoteName}" timed out after ${ms} ms`)),
      ms,
    );
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}
