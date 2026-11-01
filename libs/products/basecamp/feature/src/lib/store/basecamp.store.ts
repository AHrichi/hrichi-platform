import { computed, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  type Forecast,
  type GearItem,
  packingFor,
  type PackingItem,
  progress,
  resizePacking,
  sampleTrip,
  type Trip,
  tripDays,
  weatherAdditions,
  withNewId,
} from '@ah/products/basecamp/domain';
import { type NightPlan, tripNights, withClouds } from '../nights/night-plan';
import { BasecampDbService } from '../services/basecamp-db.service';
import { WeatherService } from '../services/weather.service';

export type ForecastState = 'idle' | 'loading' | 'ready' | 'failed';

export interface BasecampState {
  trips: Trip[];
  gear: GearItem[];
  activeTripId: string | null;
  isLoading: boolean;
  forecast: Forecast | null;
  forecastState: ForecastState;
  /** How many packing items the last forecast added, to say so once. */
  weatherAdded: number;
}

const initialState: BasecampState = {
  trips: [],
  gear: [],
  activeTripId: null,
  isLoading: true,
  forecast: null,
  forecastState: 'idle',
  weatherAdded: 0,
};

/** A forecast younger than this is shown without asking again. */
const FRESH_MS = 3 * 3_600_000;

export function newId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function today(): string {
  const now = new Date();
  return new Date(now.getTime() - now.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 10);
}

/** The fields a trip form edits. */
export type TripDraft = Pick<
  Trip,
  'name' | 'type' | 'start' | 'nights' | 'campsite' | 'people' | 'notes'
>;

export const BasecampStore = signalStore(
  { providedIn: 'root' },
  withState<BasecampState>(initialState),
  withComputed((store) => {
    const activeTrip = computed<Trip | null>(() => {
      const trips = store.trips();
      return (
        trips.find((t) => t.id === store.activeTripId()) ?? trips[0] ?? null
      );
    });
    const forecastDays = computed(() => {
      const trip = activeTrip();
      const forecast = store.forecast();
      return trip && forecast
        ? tripDays(forecast.days, trip.start, trip.nights)
        : [];
    });
    // The sky only depends on the place and the dates: ticking a packing
    // item changes the trip, but must not redo the astronomy.
    const nightsKey = computed(() => {
      const trip = activeTrip();
      return trip
        ? [trip.campsite.lat, trip.campsite.lng, trip.start, trip.nights].join(
            '|',
          )
        : '';
    });
    const plans = computed(() => {
      const key = nightsKey();
      if (!key) return [];
      const [lat, lng, start, count] = key.split('|');
      return tripNights(Number(lat), Number(lng), start, Number(count));
    });
    /** Every night of the open trip, scored, with the forecast's clouds. */
    const nights = computed<(NightPlan & { finalScore: number })[]>(() => {
      const clouds = new Map(
        (store.forecast()?.days ?? []).map((d) => [d.date, d.cloudPct]),
      );
      return plans().map((night) => ({
        ...night,
        finalScore: withClouds(night.score, clouds.get(night.date) ?? null),
      }));
    });
    const bestNight = computed(() =>
      nights().reduce<(NightPlan & { finalScore: number }) | null>(
        (best, night) =>
          !best || night.finalScore > best.finalScore ? night : best,
        null,
      ),
    );
    const packingProgress = computed(() =>
      progress(activeTrip()?.packing ?? []),
    );
    return { activeTrip, forecastDays, nights, bestNight, packingProgress };
  }),
  withMethods((store) => {
    const db = inject(BasecampDbService);
    const weather = inject(WeatherService);

    async function save(trip: Trip): Promise<void> {
      const stamped = { ...trip, updatedAt: new Date().toISOString() };
      patchState(store, {
        trips: store.trips().map((t) => (t.id === stamped.id ? stamped : t)),
      });
      await db.saveTrip(stamped);
    }

    async function add(trip: Trip): Promise<void> {
      patchState(store, {
        trips: [...store.trips(), trip].sort((a, b) =>
          a.start.localeCompare(b.start),
        ),
      });
      await db.saveTrip(trip);
      await open(trip.id);
    }

    async function open(id: string): Promise<void> {
      db.lastTripId = id;
      patchState(store, {
        activeTripId: id,
        forecast: await db.forecast(id),
        forecastState: 'idle',
        weatherAdded: 0,
      });
    }

    function patchPacking(
      update: (packing: PackingItem[]) => PackingItem[],
    ): Promise<void> {
      const trip = store.activeTrip();
      return trip
        ? save({ ...trip, packing: update(trip.packing) })
        : Promise.resolve();
    }

    const party = (trip: Pick<Trip, 'people' | 'nights' | 'type'>) => ({
      people: Math.max(1, trip.people.length),
      nights: trip.nights,
      type: trip.type,
    });

    /** Trips from a file or a link: copies, never overwriting one here. */
    async function bringIn(incoming: Trip[]): Promise<Trip[]> {
      const ids = new Set(store.trips().map((t) => t.id));
      const added = incoming.map((t) =>
        ids.has(t.id) ? withNewId(t, newId('trip')) : t,
      );
      for (const trip of added) await db.saveTrip(trip);
      patchState(store, {
        trips: [...store.trips(), ...added].sort((a, b) =>
          a.start.localeCompare(b.start),
        ),
      });
      return added;
    }

    return {
      async load(): Promise<void> {
        patchState(store, { isLoading: true });
        const [trips, gear] = await Promise.all([db.trips(), db.gear()]);
        patchState(store, { trips, gear, isLoading: false });
        const last = db.lastTripId;
        const first = trips.find((t) => t.id === last) ?? trips[0];
        if (first) await open(first.id);
      },

      open,

      /** The sample trip, named in the reader's language. */
      async loadSample(name?: string): Promise<void> {
        await add(sampleTrip(today(), () => newId('s'), name));
      },

      async create(draft: TripDraft): Promise<void> {
        const now = new Date().toISOString();
        await add({
          ...draft,
          id: newId('trip'),
          packing: packingFor(party(draft), () => newId('item')),
          createdAt: now,
          updatedAt: now,
        });
      },

      /** Saves the form; the list follows a change of party or length. */
      async update(id: string, draft: TripDraft): Promise<void> {
        const trip = store.trips().find((t) => t.id === id);
        if (!trip) return;
        const ids = new Set(draft.people.map((p) => p.id));
        const moved =
          trip.campsite.lat !== draft.campsite.lat ||
          trip.campsite.lng !== draft.campsite.lng;
        await save({
          ...trip,
          ...draft,
          packing: resizePacking(trip.packing, party(draft)).map((p) =>
            p.personId && !ids.has(p.personId) ? { ...p, personId: null } : p,
          ),
        });
        if (moved && store.activeTripId() === id) {
          patchState(store, { forecast: null, forecastState: 'idle' });
        }
      },

      async remove(id: string): Promise<void> {
        await db.deleteTrip(id);
        const trips = store.trips().filter((t) => t.id !== id);
        patchState(store, { trips });
        if (store.activeTripId() === id) {
          patchState(store, { activeTripId: null, forecast: null });
          if (trips[0]) await open(trips[0].id);
        }
      },

      setPacked(itemId: string, packed: boolean): Promise<void> {
        return patchPacking((list) =>
          list.map((p) => (p.id === itemId ? { ...p, packed } : p)),
        );
      },

      assign(itemId: string, personId: string | null): Promise<void> {
        return patchPacking((list) =>
          list.map((p) => (p.id === itemId ? { ...p, personId } : p)),
        );
      },

      setQuantity(itemId: string, quantity: number): Promise<void> {
        return patchPacking((list) =>
          list.map((p) =>
            p.id === itemId ? { ...p, quantity: Math.max(1, quantity) } : p,
          ),
        );
      },

      addItem(item: Pick<PackingItem, 'label' | 'category' | 'quantity'>) {
        return patchPacking((list) => [
          ...list,
          {
            ...item,
            id: newId('item'),
            packed: false,
            personId: null,
            source: 'custom',
          },
        ]);
      },

      removeItem(itemId: string): Promise<void> {
        return patchPacking((list) => list.filter((p) => p.id !== itemId));
      },

      rebuildPacking(): Promise<void> {
        const trip = store.activeTrip();
        if (!trip) return Promise.resolve();
        const fresh = packingFor(party(trip), () => newId('item'));
        return save({
          ...trip,
          packing: [
            ...fresh,
            ...weatherAdditions(fresh, store.forecastDays(), party(trip), () =>
              newId('item'),
            ),
          ],
        });
      },

      /**
       * The open trip's forecast: the saved one while it is fresh, else a
       * new one. Items the weather calls for join the packing list.
       */
      async loadForecast(force = false): Promise<void> {
        const trip = store.activeTrip();
        if (!trip) return;
        const saved = store.forecast();
        const fresh =
          saved &&
          saved.lat === trip.campsite.lat &&
          saved.lng === trip.campsite.lng &&
          Date.now() - Date.parse(saved.fetchedAt) < FRESH_MS;
        if (fresh && !force) {
          patchState(store, { forecastState: 'ready' });
          return;
        }
        patchState(store, { forecastState: 'loading' });
        const forecast = await weather.forecast(
          trip.campsite.lat,
          trip.campsite.lng,
        );
        if (store.activeTrip()?.id !== trip.id) return;
        if (!forecast) {
          // Offline: the saved forecast, if any, still shows.
          patchState(store, { forecastState: saved ? 'ready' : 'failed' });
          return;
        }
        await db.saveForecast(trip.id, forecast);
        patchState(store, { forecast, forecastState: 'ready' });
        const current = store.activeTrip();
        if (!current) return;
        const extra = weatherAdditions(
          current.packing,
          tripDays(forecast.days, current.start, current.nights),
          party(current),
          () => newId('item'),
        );
        if (extra.length) {
          await save({ ...current, packing: [...current.packing, ...extra] });
          patchState(store, { weatherAdded: extra.length });
        }
      },

      async saveGear(item: GearItem): Promise<void> {
        const exists = store.gear().some((g) => g.id === item.id);
        patchState(store, {
          gear: (exists
            ? store.gear().map((g) => (g.id === item.id ? item : g))
            : [...store.gear(), item]
          ).sort((a, b) => a.name.localeCompare(b.name)),
        });
        await db.saveGear(item);
      },

      async deleteGear(id: string): Promise<void> {
        patchState(store, { gear: store.gear().filter((g) => g.id !== id) });
        await db.deleteGear(id);
      },

      /** A shared trip becomes the user's own copy, and opens. */
      async importTrip(trip: Trip): Promise<Trip> {
        const [added] = await bringIn([trip]);
        await open(added.id);
        return added;
      },

      /** A backup's trips come in as copies; gear is merged by id. */
      async restore(trips: Trip[], gear: GearItem[]): Promise<void> {
        await bringIn(trips);
        for (const item of gear) await db.saveGear(item);
        const mine = new Map(store.gear().map((g) => [g.id, g]));
        for (const item of gear) mine.set(item.id, item);
        patchState(store, {
          gear: [...mine.values()].sort((a, b) => a.name.localeCompare(b.name)),
        });
        if (!store.activeTripId() && store.trips()[0]) {
          await open(store.trips()[0].id);
        }
      },
    };
  }),
);
