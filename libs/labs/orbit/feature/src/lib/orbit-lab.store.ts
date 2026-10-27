import { computed, signal } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';
import type { Pass } from '@ah/shared/api-client';
import {
  bundledSnapshot,
  cities,
  defaultCity,
  groupOf,
  type Omm,
  orbitShape,
  type SatelliteGroup,
  satelliteGroups,
} from '@ah/labs/orbit/domain';
import type { OrbitFeed } from '@ah/three/scenes/orbit-globe';
import type { OrbitApi } from './orbit-api';
import type { Propagation } from './propagation/propagation';
import type { Telemetry } from './propagation/protocol';

export type Speed = 1 | 60 | 600;
/** off: no API configured · waking: asleep or starting · ready · unavailable: gave up */
export type ApiStatus = 'off' | 'waking' | 'ready' | 'unavailable';

export interface PassesState {
  status: 'idle' | 'loading' | 'waking' | 'ready' | 'error';
  /** `${noradId}|${city}` the passes belong to. */
  key: string | null;
  passes: Pass[];
}

const ISS = 25544;
const allGroups = (1 << satelliteGroups.length) - 1;
/** Worker frames per second, per speed: fast time needs shorter chords. */
const frameMs: Record<Speed, number> = { 1: 1000, 60: 500, 600: 250 };

/**
 * The Orbit lab's state (ADR-0014). Plain, serialisable state lives in
 * `withState`; typed arrays and the propagation feed sit in `withProps`,
 * because NgRx freezes state in development and typed arrays can't be frozen.
 */
export const OrbitLabStore = signalStore(
  withState({
    source: 'snapshot' as 'snapshot' | 'live',
    fetchedAt: bundledSnapshot.fetchedAt,
    api: 'off' as ApiStatus,
    selectedId: ISS as number | null,
    groupMask: allGroups,
    speed: 1 as Speed,
    cityName: defaultCity(undefined).name,
    query: '',
    passes: { status: 'idle', key: null, passes: [] } as PassesState,
  }),
  withProps(() => ({
    catalog: signal<Omm[]>(bundledSnapshot.satellites),
    feed: signal<OrbitFeed | null>(null),
    path: signal<Float32Array | null>(null),
    telemetry: signal<Telemetry | null>(null),
  })),
  withComputed((store) => {
    const indexById = computed(
      () => new Map(store.catalog().map((s, i) => [s.NORAD_CAT_ID, i])),
    );
    const selectedIndex = computed(() => {
      const id = store.selectedId();
      return id === null ? null : (indexById().get(id) ?? null);
    });
    const selected = computed(() => {
      const index = selectedIndex();
      return index === null ? null : store.catalog()[index];
    });
    return {
      count: computed(() => store.catalog().length),
      selectedIndex,
      selected,
      shape: computed(() => {
        const elements = selected();
        return elements ? orbitShape(elements) : null;
      }),
      selectedGroup: computed<SatelliteGroup | null>(() => {
        const elements = selected();
        return elements
          ? groupOf(elements, orbitShape(elements).orbitClass)
          : null;
      }),
      city: computed(
        () => cities.find((c) => c.name === store.cityName()) ?? cities[0],
      ),
      /** Up to 8 matches by name or NORAD number. */
      results: computed(() => {
        const query = store.query().trim().toUpperCase();
        if (query.length < 2) {
          return [];
        }
        const byNumber = Number(query);
        return store
          .catalog()
          .filter(
            (s) =>
              s.NORAD_CAT_ID === byNumber ||
              s.OBJECT_NAME.toUpperCase().includes(query),
          )
          .slice(0, 8);
      }),
    };
  }),
  withMethods((store) => {
    let propagation: Propagation | null = null;
    let api: OrbitApi | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;
    let passesRequest: AbortController | null = null;
    // Simulated time runs at `speed` from (wallStart, simStart).
    let wallStart = performance.now();
    let simStart = Date.now();

    const clock = () =>
      simStart + (performance.now() - wallStart) * store.speed();

    function requestPath(): void {
      const index = store.selectedIndex();
      store.path.set(null);
      if (propagation && index !== null) {
        propagation.requestPath(index, clock());
      }
    }

    function tick(): void {
      const step = frameMs[store.speed()];
      // Ask for the frame one step ahead, so the globe always interpolates
      // between a frame in the past and one in the future.
      propagation?.requestFrame(
        clock() + step * store.speed(),
        store.selectedIndex(),
      );
      timer = setTimeout(tick, step);
    }

    async function loadPasses(): Promise<void> {
      const id = store.selectedId();
      const city = store.city();
      const key = `${id}|${city.name}`;
      if (!api || id === null || store.passes().key === key) {
        return;
      }
      passesRequest?.abort();
      passesRequest = new AbortController();
      patchState(store, { passes: { status: 'loading', key, passes: [] } });
      try {
        const response = await api.passes(id, city, {
          signal: passesRequest.signal,
          onWaking: () =>
            patchState(store, {
              passes: { status: 'waking', key, passes: [] },
            }),
        });
        patchState(store, {
          passes: { status: 'ready', key, passes: response.passes },
        });
      } catch (error) {
        if (
          (error as Error).name !== 'AbortError' &&
          store.passes().key === key
        ) {
          patchState(store, { passes: { status: 'error', key, passes: [] } });
        }
      }
    }

    function select(id: number | null): void {
      patchState(store, { selectedId: id, query: '' });
      store.telemetry.set(null);
      requestPath();
      void loadPasses();
    }

    return {
      clock,
      select,
      /** Starts propagation from the snapshot, then switches to the live catalog. */
      async start(
        worker: Propagation,
        orbitApi: OrbitApi | null,
      ): Promise<void> {
        propagation = worker;
        api = orbitApi;
        const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
        patchState(store, {
          cityName: defaultCity(timeZone).name,
          api: api ? 'waking' : 'off',
        });
        worker.load(store.catalog());
        tick();
        if (!api) {
          return;
        }
        void loadPasses();
        try {
          const live = await api.catalog();
          store.catalog.set(live.satellites as Omm[]);
          patchState(store, {
            source: 'live',
            fetchedAt: live.fetchedAt,
            api: 'ready',
          });
          worker.load(live.satellites as Omm[]);
        } catch {
          // The snapshot stays; the status line says the live data didn't come.
          patchState(store, { api: 'unavailable' });
        }
      },
      /** The worker indexed a catalog; the globe can attach to it. */
      catalogReady(feed: OrbitFeed): void {
        store.feed.set(feed);
        requestPath();
      },
      selectIndex(index: number | null): void {
        const elements = index === null ? null : store.catalog()[index];
        select(elements ? elements.NORAD_CAT_ID : null);
      },
      /** A path arrived from the worker; ignore it if the selection moved on. */
      pathReady(index: number, positions: Float32Array): void {
        if (index === store.selectedIndex()) {
          store.path.set(positions);
        }
      },
      setQuery(query: string): void {
        patchState(store, { query });
      },
      setCity(cityName: string): void {
        patchState(store, { cityName });
        void loadPasses();
      },
      setSpeed(speed: Speed): void {
        // Keep the simulated "now" continuous across the change.
        simStart = clock();
        wallStart = performance.now();
        patchState(store, { speed });
      },
      toggleGroup(group: SatelliteGroup): void {
        patchState(store, {
          groupMask: store.groupMask() ^ (1 << satelliteGroups.indexOf(group)),
        });
      },
      stop(): void {
        if (timer) {
          clearTimeout(timer);
        }
        passesRequest?.abort();
        propagation?.dispose();
        propagation = null;
      },
    };
  }),
);
