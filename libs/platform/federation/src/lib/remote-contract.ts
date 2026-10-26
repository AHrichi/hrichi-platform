import { Routes } from '@angular/router';

/** Browser features a remote needs; the shell can show a fallback when one is missing. */
export type RemoteCapability = 'webgl' | 'indexeddb' | 'worker';

/** Metadata every remote exposes as `./meta` (read by the Federation Inspector). */
export interface RemoteMeta {
  id: string;
  title: string;
  version: string;
  capabilities: readonly RemoteCapability[];
}

/** The exposed keys every remote must provide in its `federation.config.mjs`. */
export const REMOTE_EXPOSES = {
  routes: './routes',
  meta: './meta',
} as const;

/** Shape of a remote's `./routes` module. */
export interface RemoteRoutesModule {
  remoteRoutes: Routes;
}

/** Shape of a remote's `./meta` module. */
export interface RemoteMetaModule {
  remoteMeta: RemoteMeta;
}
