import data from '../generated/snapshot.json';

/**
 * Mean orbital elements in CCSDS OMM form, as CelesTrak publishes them and
 * satellite.js reads them (`json2satrec`). The Orbit API serves the same shape.
 */
export interface Omm {
  OBJECT_NAME: string;
  OBJECT_ID: string;
  /** UTC, ISO-8601 without a zone. */
  EPOCH: string;
  /** Revolutions per day. */
  MEAN_MOTION: number;
  ECCENTRICITY: number;
  /** Degrees. */
  INCLINATION: number;
  RA_OF_ASC_NODE: number;
  ARG_OF_PERICENTER: number;
  MEAN_ANOMALY: number;
  EPHEMERIS_TYPE: number;
  CLASSIFICATION_TYPE: string;
  NORAD_CAT_ID: number;
  ELEMENT_SET_NO: number;
  REV_AT_EPOCH: number;
  BSTAR: number;
  MEAN_MOTION_DOT: number;
  MEAN_MOTION_DDOT: number;
}

export interface Snapshot {
  fetchedAt: string;
  source: string;
  satellites: Omm[];
}

/**
 * The brightest satellites (CelesTrak's "visual" group), committed by
 * tools/scripts/orbit-snapshot.mjs. The lab renders these at once, while
 * the free-tier API wakes up.
 */
export const bundledSnapshot = data as Snapshot;
