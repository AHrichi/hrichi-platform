import type { Omm } from '@ah/labs/orbit/domain';

/** Live numbers for the selected satellite. */
export interface Telemetry {
  index: number;
  latitude: number;
  longitude: number;
  altitudeKm: number;
  speedKmS: number;
}

export type ToWorker =
  /** Replace the catalog being propagated. */
  | { type: 'catalog'; satellites: Omm[] }
  /** Positions of every satellite at `time` (ms), plus the selected one's telemetry. */
  | { type: 'frame'; time: number; selected: number | null }
  /** One orbit of satellite `index`, starting at `time`. */
  | { type: 'path'; index: number; time: number };

export type FromWorker =
  | {
      type: 'catalog';
      count: number;
      /** 0 LEO, 1 MEO, 2 GEO, 3 HEO. */
      classes: Uint8Array;
      /** Index into satelliteGroups. */
      groups: Uint8Array;
    }
  | {
      type: 'frame';
      time: number;
      positions: Float32Array;
      gmst: number;
      sun: [number, number, number];
      telemetry: Telemetry | null;
    }
  | { type: 'path'; index: number; positions: Float32Array };
