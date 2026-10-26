import { InjectionToken, Provider } from '@angular/core';

/**
 * Same signature as `loadRemoteModule` on the Native Federation result, so the
 * browser can pass it straight through without this lib importing the runtime.
 */
export type RemoteLoader = <TModule = unknown>(
  remoteName: string,
  exposedModule: string,
) => Promise<TModule>;

export const REMOTE_LOADER = new InjectionToken<RemoteLoader>('REMOTE_LOADER');

/** The part of `NativeFederationResult` the shell depends on. */
export interface FederationHandle {
  loadRemoteModule: RemoteLoader;
}

/**
 * Provides the browser loader from the `initFederation` result. When init
 * failed (`undefined`), every load rejects and routes show their fallback.
 */
export function provideRemoteLoader(
  federation: FederationHandle | undefined,
): Provider {
  const loader: RemoteLoader = federation
    ? <TModule>(remoteName: string, exposedModule: string) =>
        federation.loadRemoteModule<TModule>(remoteName, exposedModule)
    : () => Promise.reject(new Error('Native Federation is not initialized'));

  return { provide: REMOTE_LOADER, useValue: loader };
}
