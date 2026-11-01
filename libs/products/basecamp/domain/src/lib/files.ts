import {
  PACKING_CATEGORIES,
  TRIP_TYPES,
  type GearItem,
  type PackingItem,
  type Trip,
} from './models';

/** A Basecamp backup file: every trip and the gear. */
export interface BasecampBackup {
  app: 'basecamp';
  version: 1;
  exportedAt: string;
  trips: Trip[];
  gear: GearItem[];
}

/** One trip, as a share link carries it. */
export interface SharedTrip {
  app: 'basecamp-trip';
  version: 1;
  trip: Trip;
}

export type FileError = 'notJson' | 'notBasecamp' | 'newerVersion' | 'empty';

const isText = (v: unknown): v is string => typeof v === 'string';
const isNumber = (v: unknown): v is number =>
  typeof v === 'number' && Number.isFinite(v);

function isPackingItem(value: unknown): value is PackingItem {
  const p = value as Partial<PackingItem> | null;
  return (
    typeof p === 'object' &&
    p !== null &&
    isText(p.id) &&
    (isText(p.key) || isText(p.label)) &&
    PACKING_CATEGORIES.includes(p.category as PackingItem['category']) &&
    isNumber(p.quantity) &&
    typeof p.packed === 'boolean'
  );
}

/** A trip with the expected shape; its damaged packing items are dropped. */
export function asTrip(value: unknown): Trip | null {
  const t = value as Partial<Trip> | null;
  if (
    typeof t !== 'object' ||
    t === null ||
    !isText(t.id) ||
    !t.id ||
    !isText(t.name) ||
    !TRIP_TYPES.includes(t.type as Trip['type']) ||
    !isText(t.start) ||
    !/^\d{4}-\d{2}-\d{2}$/.test(t.start) ||
    !isNumber(t.nights) ||
    !isNumber(t.campsite?.lat) ||
    !isNumber(t.campsite?.lng) ||
    !Array.isArray(t.people) ||
    !Array.isArray(t.packing)
  ) {
    return null;
  }
  const people = t.people.filter(
    (p): p is Trip['people'][number] => isText(p?.id) && isText(p?.name),
  );
  const ids = new Set(people.map((p) => p.id));
  return {
    id: t.id,
    name: t.name,
    type: t.type as Trip['type'],
    start: t.start,
    nights: Math.min(14, Math.max(1, Math.round(t.nights))),
    campsite: {
      lat: t.campsite.lat,
      lng: t.campsite.lng,
      name: isText(t.campsite.name) ? t.campsite.name : '',
    },
    people,
    packing: t.packing.filter(isPackingItem).map((p) => ({
      ...p,
      personId: p.personId && ids.has(p.personId) ? p.personId : null,
      source: p.source ?? 'custom',
    })),
    notes: isText(t.notes) ? t.notes : '',
    createdAt: isText(t.createdAt) ? t.createdAt : new Date(0).toISOString(),
    updatedAt: isText(t.updatedAt) ? t.updatedAt : new Date(0).toISOString(),
  };
}

function isGear(value: unknown): value is GearItem {
  const g = value as Partial<GearItem> | null;
  return (
    typeof g === 'object' &&
    g !== null &&
    isText(g.id) &&
    isText(g.name) &&
    PACKING_CATEGORIES.includes(g.category as GearItem['category'])
  );
}

function parse(text: string): unknown | FileError {
  try {
    return JSON.parse(text);
  } catch {
    return 'notJson';
  }
}

export function createBackup(
  trips: readonly Trip[],
  gear: readonly GearItem[],
  now = new Date(),
): string {
  const backup: BasecampBackup = {
    app: 'basecamp',
    version: 1,
    exportedAt: now.toISOString(),
    trips: [...trips],
    gear: [...gear],
  };
  return JSON.stringify(backup, null, 2);
}

export function backupFileName(now = new Date()): string {
  return `basecamp-backup-${now.toISOString().slice(0, 10)}.json`;
}

export type BackupRead =
  { trips: Trip[]; gear: GearItem[]; skipped: number } | { error: FileError };

/** Reads a backup; damaged trips are left out and counted. */
export function readBackup(text: string): BackupRead {
  const data = parse(text);
  if (data === 'notJson') return { error: 'notJson' };
  const backup = data as Partial<BasecampBackup> | null;
  if (backup?.app !== 'basecamp' || !Array.isArray(backup.trips)) {
    return { error: 'notBasecamp' };
  }
  if (!isNumber(backup.version) || backup.version > 1) {
    return { error: 'newerVersion' };
  }
  const trips = backup.trips.map(asTrip).filter((t): t is Trip => !!t);
  const gear = (Array.isArray(backup.gear) ? backup.gear : []).filter(isGear);
  if (!trips.length && !gear.length) return { error: 'empty' };
  return { trips, gear, skipped: backup.trips.length - trips.length };
}

/** The text a share link carries for one trip. */
export function shareText(trip: Trip): string {
  const shared: SharedTrip = { app: 'basecamp-trip', version: 1, trip };
  return JSON.stringify(shared);
}

/** A trip from a share link's text, or why it can't be read. */
export function readShared(
  text: string,
): { trip: Trip } | { error: FileError } {
  const data = parse(text);
  if (data === 'notJson') return { error: 'notJson' };
  const shared = data as Partial<SharedTrip> | null;
  if (shared?.app !== 'basecamp-trip') return { error: 'notBasecamp' };
  if (!isNumber(shared.version) || shared.version > 1) {
    return { error: 'newerVersion' };
  }
  const trip = asTrip(shared.trip);
  return trip ? { trip } : { error: 'empty' };
}

/**
 * A trip brought in from a file or a link gets a new id when one with its
 * id is already here, so nothing is ever overwritten.
 */
export function withNewId(trip: Trip, id: string): Trip {
  return { ...trip, id };
}
