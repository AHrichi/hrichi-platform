/**
 * The observer's frame, as the scene draws it: x east, y up (zenith), z south.
 * The camera's default −z looks north.
 */
export type Vec3 = [number, number, number];

/** The sky at one moment; the host computes it (astronomy-engine). */
export interface SkyFrame {
  /** ms since 1970. */
  time: number;
  /** J2000 equatorial → observer frame, row-major 3×3. */
  equatorialToLocal: number[];
  sun: { direction: Vec3; altitude: number };
  moon: { direction: Vec3; altitude: number; illumination: number };
  planets: { name: string; direction: Vec3; magnitude: number }[];
  /** Active meteor showers: radiant direction and current rate (ZHR). */
  showers: { name: string; radiant: Vec3; rate: number }[];
}

/**
 * The Earth at one moment, for the globe: the Greenwich sidereal angle and
 * the direction of the Sun, inertial axes with z towards the north pole.
 */
export interface EarthFrame {
  gmst: number;
  sun: Vec3;
}

/** A name drawn on the sky at a fixed J2000 position. */
export interface SkyLabel {
  /** `constellation:Ori` or `star:12`, as `select` reports them. */
  id: string;
  text: string;
  ra: number;
  dec: number;
}

export interface SkySceneParams {
  /** Simulated time, ms; read on every frame. */
  clock: () => number;
  skyAt: (time: number) => SkyFrame;
  earthAt: (time: number) => EarthFrame;
  /** Where the observer stands, degrees. */
  spot: { lat: number; lon: number };
  view: 'earth' | 'sky';
  /** Compass direction to face in the sky, degrees; a change turns the view. */
  facing: number;
  layers: { constellations: boolean; labels: boolean; milkyWay: boolean };
  labels: readonly SkyLabel[];
  /** The selected object's id, highlighted. */
  selected: string | null;
  /** Time is running, so the sky moves on every frame. */
  playing: boolean;
  /** No camera flights, twinkling, flicker or meteors (prefers-reduced-motion). */
  reducedMotion: boolean;
}
