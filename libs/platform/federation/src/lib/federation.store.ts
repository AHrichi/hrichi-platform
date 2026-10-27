import { computed } from '@angular/core';
import {
  patchState,
  signalStore,
  type,
  withComputed,
  withMethods,
} from '@ngrx/signals';
import {
  entityConfig,
  setEntity,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import type { RemoteCapability, RemoteMeta } from './remote-contract';

export type RemoteLoadStatus = 'loading' | 'loaded' | 'failed';

/** Why a remote ended up on its fallback page. */
export type RemoteFailure =
  | { kind: 'error'; message: string }
  | { kind: 'timeout'; message: string }
  | { kind: 'contract'; message: string }
  | { kind: 'capability'; missing: RemoteCapability[] };

export interface RemoteLoad {
  name: string;
  status: RemoteLoadStatus;
  /** `performance.now()` when the load started. */
  startedAt: number;
  durationMs: number | null;
  meta: RemoteMeta | null;
  failure: RemoteFailure | null;
}

const remoteLoads = entityConfig({
  entity: type<RemoteLoad>(),
  selectId: (load) => load.name,
});

/**
 * Every remote the shell has tried to load, with timing and metadata
 * (ADR-0012). `federatedRoutes()` writes it; the Federation Inspector reads it.
 */
export const FederationStore = signalStore(
  { providedIn: 'root' },
  withEntities(remoteLoads),
  withComputed(({ entities }) => ({
    failed: computed(() =>
      entities().filter((load) => load.status === 'failed'),
    ),
  })),
  withMethods((store) => ({
    recordStart(name: string, startedAt: number): void {
      const load: RemoteLoad = {
        name,
        status: 'loading',
        startedAt,
        durationMs: null,
        meta: null,
        failure: null,
      };
      patchState(store, setEntity(load, remoteLoads));
    },
    recordLoaded(name: string, meta: RemoteMeta, finishedAt: number): void {
      patchState(
        store,
        updateEntity(
          {
            id: name,
            changes: (load): Partial<RemoteLoad> => ({
              status: 'loaded',
              meta,
              durationMs: finishedAt - load.startedAt,
            }),
          },
          remoteLoads,
        ),
      );
    },
    recordFailure(
      name: string,
      failure: RemoteFailure,
      finishedAt: number,
      meta: RemoteMeta | null = null,
    ): void {
      patchState(
        store,
        updateEntity(
          {
            id: name,
            changes: (load): Partial<RemoteLoad> => ({
              status: 'failed',
              failure,
              meta,
              durationMs: finishedAt - load.startedAt,
            }),
          },
          remoteLoads,
        ),
      );
    },
  })),
);
