/**
 * Coordinates: Earth radii, in an Earth-centred inertial frame mapped to
 * three.js axes with the pole up: (x, y, z)ECI → (x, z, −y).
 */
export interface OrbitFrame {
  /** Simulated time of these positions, ms since 1970. */
  time: number;
  /** x, y, z per satellite; (0, 0, 0) for one that couldn't be propagated. */
  positions: Float32Array;
  /** Greenwich sidereal angle at `time`, radians. */
  gmst: number;
  /** Unit vector to the Sun, same axes as `positions`. */
  sun: [number, number, number];
}

/** A catalog being propagated somewhere else (a Web Worker). */
export interface OrbitFeed {
  count: number;
  /** Orbit class per satellite: 0 LEO, 1 MEO, 2 GEO, 3 HEO. */
  classes: Uint8Array;
  /** Group per satellite, 0–4 (a bit in `groupMask`). */
  groups: Uint8Array;
  /** Called with each new frame; returns an unsubscribe function. */
  subscribe(listener: (frame: OrbitFrame) => void): () => void;
}

export interface OrbitGlobeParams {
  feed: OrbitFeed | null;
  /** Simulated "now", ms; read on every frame to interpolate and turn the Earth. */
  clock: () => number;
  /** Index into the feed, or null. */
  selected: number | null;
  /** One orbit of the selected satellite, same axes, closed loop. */
  path: Float32Array | null;
  /** Bit i shows group i. */
  groupMask: number;
  /** No automatic camera motion (prefers-reduced-motion). */
  reducedMotion: boolean;
}
