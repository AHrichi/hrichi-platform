import type { LabKind } from '../../lab/model';

export interface LabKindSpec {
  /** The palette and inspector name. */
  label: string;
  /** One line for the palette button's description. */
  blurb: string;
  /** Requests per second per instance; `Infinity` for managed, unbounded services. */
  capacity: number;
  /** Databases only: reads and writes have separate budgets. */
  readCapacity?: number;
  writeCapacity?: number;
  /** p50 at zero load, in ms. */
  baseMs: number;
  /** Per instance, in abstract units. */
  cost: number;
  /** The cost does not grow with instances (managed services). */
  flatCost?: boolean;
  /** Column in the auto layout (technical-design §8). */
  tier: number;
  /** Whether the inspector offers an instances stepper. */
  scalable: boolean;
}

export const DEFAULT_HIT_RATIO = 0.8;
export const MIN_INSTANCES = 1;
export const MAX_INSTANCES = 20;
export const MIN_RPS = 10;
export const MAX_RPS = 200_000;
export const MAX_HIT_RATIO = 0.99;

/** The per-instance catalogue (technical-design §8). Numbers are teaching approximations. */
export const LAB_CATALOG: Readonly<Record<LabKind, LabKindSpec>> = {
  client: {
    label: 'Clients',
    blurb: 'Where the traffic comes from',
    capacity: Infinity,
    baseMs: 0,
    cost: 0,
    tier: 0,
    scalable: false,
  },
  cdn: {
    label: 'CDN',
    blurb: 'Serves static files from the edge',
    capacity: Infinity,
    baseMs: 15,
    cost: 2,
    flatCost: true,
    tier: 1,
    scalable: false,
  },
  'load-balancer': {
    label: 'Load balancer',
    blurb: 'Spreads requests evenly',
    capacity: 50_000,
    baseMs: 1,
    cost: 1,
    tier: 2,
    scalable: true,
  },
  server: {
    label: 'Web server',
    blurb: 'Runs the app: 1,000 rps each',
    capacity: 1_000,
    baseMs: 20,
    cost: 2,
    tier: 3,
    scalable: true,
  },
  cache: {
    label: 'Cache',
    blurb: 'Answers repeat reads from memory',
    capacity: 50_000,
    baseMs: 1,
    cost: 2,
    tier: 4,
    scalable: true,
  },
  queue: {
    label: 'Queue',
    blurb: 'Accepts writes now, applies them later',
    capacity: 100_000,
    baseMs: 2,
    cost: 1,
    tier: 4,
    scalable: true,
  },
  database: {
    label: 'Database',
    blurb: '3,000 reads and 1,000 writes a second',
    capacity: 3_000,
    readCapacity: 3_000,
    writeCapacity: 1_000,
    baseMs: 8,
    cost: 4,
    tier: 5,
    scalable: true,
  },
  replica: {
    label: 'Read replica',
    blurb: 'A read-only copy: 3,000 reads each',
    capacity: 3_000,
    baseMs: 8,
    cost: 3,
    tier: 5,
    scalable: true,
  },
  worker: {
    label: 'Worker',
    blurb: 'Drains the queue: 400 messages a second',
    capacity: 400,
    baseMs: 30,
    cost: 1,
    tier: 5,
    scalable: true,
  },
  storage: {
    label: 'Object storage',
    blurb: 'Holds files; never runs out',
    capacity: Infinity,
    baseMs: 40,
    cost: 1,
    tier: 5,
    scalable: false,
  },
};

/** Palette order: roughly left to right through a request. */
export const LAB_KINDS: readonly LabKind[] = [
  'client',
  'cdn',
  'load-balancer',
  'server',
  'cache',
  'queue',
  'database',
  'replica',
  'worker',
  'storage',
];
