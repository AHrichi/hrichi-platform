import { computed } from '@angular/core';
import {
  activeShowers,
  equatorialVector,
  gmst,
  type Place,
  rotate,
  skyAt,
  sunDirection,
} from '@ah/labs/sky/domain';
import type { Night } from '@ah/shared/api-client';
import type { EarthFrame, SkyFrame } from '@ah/three/scenes/sky';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withProps,
  withState,
} from '@ngrx/signals';

export const speeds = [0, 1, 60, 600, 3600] as const;
export type Speed = (typeof speeds)[number];

export interface SkyLayers {
  constellations: boolean;
  labels: boolean;
  milkyWay: boolean;
}

export type Locating = 'idle' | 'asking' | 'denied' | 'unavailable';

/** The night planner (ADR-0017): off when no API is configured here. */
export interface Planner {
  status: 'off' | 'loading' | 'waking' | 'ready' | 'unavailable';
  nights: Night[];
}

interface SkyLabState {
  place: Place;
  view: 'earth' | 'sky';
  /** Compass direction the sky view faces, degrees. */
  facing: number;
  speed: Speed;
  /** Simulated time = anchorTime + (wall clock − anchorWall) × speed. */
  anchorTime: number;
  anchorWall: number;
  layers: SkyLayers;
  /** `star:12`, `planet:Mars`, `moon`, `sun`, `constellation:Ori` or null. */
  selected: string | null;
  /** Wall clock, refreshed every second, so the page's text follows the sky. */
  tick: number;
  locating: Locating;
  planner: Planner;
}

/** The sky at one moment, shaped for the scene. */
export function skyFrame(place: Place, time: number): SkyFrame {
  const date = new Date(time);
  const sky = skyAt(date, place);
  return {
    time,
    equatorialToLocal: sky.equatorialToLocal,
    sun: { direction: sky.sun.direction, altitude: sky.sun.altitude },
    moon: {
      direction: sky.moon.direction,
      altitude: sky.moon.altitude,
      illumination: sky.moon.illumination,
    },
    planets: sky.planets.map(({ name, direction, magnitude }) => ({
      name,
      direction,
      magnitude,
    })),
    showers: activeShowers(date).map(({ shower, rate }) => ({
      name: shower.name,
      radiant: rotate(
        sky.equatorialToLocal,
        equatorialVector(shower.ra, shower.dec),
      ),
      rate,
    })),
  };
}

/** The globe's Earth at one moment. */
export function earthFrame(time: number): EarthFrame {
  const date = new Date(time);
  return { gmst: gmst(date), sun: sunDirection(date) };
}

/**
 * The Sky lab's state (ADR-0016): where, when and how fast, what the view
 * shows, and what's selected. Time runs on a simulated clock that the scene
 * reads on every frame.
 */
export const SkyLabStore = signalStore(
  withState<SkyLabState>({
    place: {
      name: 'Tunis, Tunisia',
      lat: 36.8065,
      lon: 10.1815,
      timeZone: 'Africa/Tunis',
    },
    view: 'earth',
    facing: 180,
    speed: 1,
    anchorTime: Date.now(),
    anchorWall: Date.now(),
    layers: { constellations: true, labels: true, milkyWay: true },
    selected: null,
    tick: Date.now(),
    locating: 'idle',
    planner: { status: 'off', nights: [] },
  }),
  withProps((store) => ({
    /** Simulated "now", ms; cheap, so the scene calls it on every frame. */
    clock: (): number =>
      store.anchorTime() + (Date.now() - store.anchorWall()) * store.speed(),
  })),
  withComputed((store) => ({
    /** The simulated time as of the last tick, for the page's text. */
    time: computed(() => {
      store.tick();
      return store.clock();
    }),
    /** A new function per place, so the scene recomputes when the place changes. */
    skyAt: computed(() => {
      const place = store.place();
      return (time: number) => skyFrame(place, time);
    }),
    playing: computed(() => store.speed() !== 0),
  })),
  withMethods((store) => {
    /** Restarts the clock from `time` at `speed`. */
    const anchor = (time: number, speed: Speed) =>
      patchState(store, {
        anchorTime: time,
        anchorWall: Date.now(),
        speed,
        tick: Date.now(),
      });
    return {
      setPlace(place: Place): void {
        patchState(store, {
          place,
          selected: null,
          // South is where the planets and the Moon cross, north of the equator.
          facing: place.lat >= 0 ? 180 : 0,
        });
      },
      setView(view: 'earth' | 'sky'): void {
        patchState(store, { view });
      },
      face(azimuth: number): void {
        patchState(store, { facing: azimuth });
      },
      setSpeed(speed: Speed): void {
        anchor(store.clock(), speed);
      },
      setTime(time: number): void {
        anchor(time, store.speed());
      },
      /** Live: real time, running at real speed. */
      now(): void {
        anchor(Date.now(), 1);
      },
      toggleLayer(layer: keyof SkyLayers): void {
        patchState(store, {
          layers: { ...store.layers(), [layer]: !store.layers()[layer] },
        });
      },
      select(id: string | null): void {
        patchState(store, { selected: id });
      },
      tickNow(): void {
        patchState(store, { tick: Date.now() });
      },
      setLocating(locating: Locating): void {
        patchState(store, { locating });
      },
      /** A new place's nights are on their way; the old ones no longer apply. */
      plannerLoading(): void {
        patchState(store, { planner: { status: 'loading', nights: [] } });
      },
      plannerWaking(): void {
        patchState(store, {
          planner: { ...store.planner(), status: 'waking' },
        });
      },
      plannerReady(nights: Night[]): void {
        patchState(store, { planner: { status: 'ready', nights } });
      },
      plannerUnavailable(): void {
        patchState(store, { planner: { status: 'unavailable', nights: [] } });
      },
    };
  }),
);
