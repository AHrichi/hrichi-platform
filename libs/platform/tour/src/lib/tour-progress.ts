import type { TourDefinition, TourOutcome } from './tour.model';

/** What is kept once a tour ends. */
export interface TourRecord {
  readonly v: 1;
  readonly version: number;
  readonly status: TourOutcome;
  readonly at: string;
}

type KeyValueStore = Pick<Storage, 'getItem' | 'setItem'>;

/**
 * Where a tour's progress is kept. The portfolio's demo of an app keeps its
 * own (as its database does), so trying the demo never hides the tour from
 * someone who then opens the app itself.
 */
export function tourKey(definition: TourDefinition, demo: boolean): string {
  return `${demo ? 'ah-demo.' : ''}ah.tour.${definition.app}.${definition.id}`;
}

/**
 * Progress on this device only: never synced, never in backups. Storage
 * that is blocked or full (private modes) falls back to memory, so a tour
 * still ends properly; it is simply offered again next time.
 */
export class TourProgress {
  private readonly memory = new Map<string, string>();

  constructor(private readonly storage: KeyValueStore | null) {}

  read(key: string): TourRecord | null {
    let raw: string | null = this.memory.get(key) ?? null;
    try {
      raw = this.storage?.getItem(key) ?? raw;
    } catch {
      // Blocked storage: what memory holds, if anything.
    }
    return parse(raw);
  }

  write(key: string, record: TourRecord): void {
    const raw = JSON.stringify(record);
    this.memory.set(key, raw);
    try {
      this.storage?.setItem(key, raw);
    } catch {
      // Blocked or full: memory keeps it for this visit.
    }
  }
}

function parse(raw: string | null): TourRecord | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<TourRecord>;
    const statuses: readonly string[] = ['finished', 'skipped', 'dismissed'];
    if (
      value.v === 1 &&
      typeof value.version === 'number' &&
      typeof value.status === 'string' &&
      statuses.includes(value.status) &&
      typeof value.at === 'string'
    ) {
      return value as TourRecord;
    }
  } catch {
    // Not ours, or damaged: as if never seen.
  }
  return null;
}

/** localStorage, or null where reading it throws (some private modes). */
export function browserStorage(): KeyValueStore | null {
  try {
    return typeof localStorage === 'undefined' ? null : localStorage;
  } catch {
    return null;
  }
}
