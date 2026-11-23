import type {
  Greenhouse,
  HygieneCheck,
  HygieneItem,
  Team,
  Worker,
  WorkLog,
} from '@ah/products/greenhouse/domain';
import Dexie, { type Table } from 'dexie';

/**
 * Where a work log stands between the phone and the server:
 * - `pending`: saved on the phone, waiting for a signal;
 * - `synced`: the server has it;
 * - `rejected`: the server refused it for good (say, a worker deleted
 *   meanwhile). It stays on the phone so the supervisor can see why.
 */
export type LogStatus = 'pending' | 'synced' | 'rejected';

/** What the next sync must do with a pending log. */
export type LogOp = 'create' | 'update';

export interface LogRow extends WorkLog {
  farmId: string;
  status: LogStatus;
  /** Set while `pending`. An edit to a synced log is an `update`. */
  op: LogOp | null;
  /**
   * Bumped on every local save. A sync marks a log synced only if it hasn't
   * changed since it was sent, so an edit made mid-sync is never lost.
   */
  rev: number;
  /** Failed sync attempts since the last success, for backing off. */
  attempts: number;
  /** Why the server refused it, when `rejected`. */
  error: string | null;
}

/**
 * A hygiene check on the phone. It syncs like a work log; once signed, the
 * phone refuses changes, as the server does.
 */
export interface CheckRow extends HygieneCheck {
  farmId: string;
  status: LogStatus;
  rev: number;
  attempts: number;
  error: string | null;
}

/** A photo taken for a check, kept on the phone until it is uploaded. */
export interface PhotoRow {
  /** Its path in the `hygiene-photos` bucket: `<farm>/<check>/<id>.jpg`. */
  path: string;
  checkId: string;
  itemId: string;
  blob: Blob;
  uploaded: 0 | 1;
}

/** The farm as the phone last saw it, for scanning badges offline. */
export interface Roster {
  farmId: string;
  greenhouses: Greenhouse[];
  teams: Team[];
  workers: Worker[];
  /** The farm's hygiene checklist, inactive items included. */
  hygieneItems: HygieneItem[];
  /** When it was downloaded (ISO instant). */
  fetchedAt: string;
}

export interface MetaRow {
  key: string;
  value: unknown;
}

/**
 * The field app's IndexedDB database. The feature passes the name in
 * (`databaseName()` from `@ah/platform/storage`), so the portfolio demo
 * opens `ah-demo-greenhouse-field` and never a supervisor's real data.
 */
export class FieldDatabase extends Dexie {
  logs!: Table<LogRow, string>;
  greenhouses!: Table<Greenhouse, string>;
  teams!: Table<Team, string>;
  workers!: Table<Worker, string>;
  meta!: Table<MetaRow, string>;
  hygieneItems!: Table<HygieneItem, string>;
  checks!: Table<CheckRow, string>;
  photos!: Table<PhotoRow, string>;

  constructor(name: string) {
    super(name);
    this.version(1).stores({
      logs: 'id, status, date, [date+greenhouseId]',
      greenhouses: 'id',
      teams: 'id',
      workers: 'id, badgeCode',
      meta: 'key',
    });
    // G5: hygiene checks, and their photos until they are uploaded.
    this.version(2).stores({
      hygieneItems: 'id',
      checks: 'id, status, date, [date+greenhouseId]',
      photos: 'path, checkId, uploaded',
    });
  }
}

export const META_FARM_ID = 'farmId';
export const META_ROSTER_FETCHED_AT = 'rosterFetchedAt';
export const META_LAST_SYNC_AT = 'lastSyncAt';
