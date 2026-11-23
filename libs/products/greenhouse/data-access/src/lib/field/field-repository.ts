import type {
  HygieneCheck,
  IsoDate,
  Worker,
  WorkLog,
} from '@ah/products/greenhouse/domain';
import { newId, normalizeBadge } from '@ah/products/greenhouse/domain';
import {
  type CheckRow,
  type FieldDatabase,
  type LogRow,
  type LogStatus,
  META_FARM_ID,
  META_LAST_SYNC_AT,
  META_ROSTER_FETCHED_AT,
  type PhotoRow,
  type Roster,
} from './field-database';

/** Where a new photo for a check goes in the bucket (RLS reads the farm). */
export function photoPath(farmId: string, checkId: string): string {
  return `${farmId}/${checkId}/${newId()}.jpg`;
}

/** Thrown when something tries to change a signed check. */
export class SignedCheckError extends Error {
  constructor(id: string) {
    super(`Hygiene check ${id} is signed and can't change`);
    this.name = 'SignedCheckError';
  }
}

/** Reads and writes on the phone. Nothing here touches the network. */
export class FieldRepository {
  constructor(private readonly db: FieldDatabase) {}

  /** Replaces the cached farm with a fresh download, in one transaction. */
  async saveRoster(roster: Roster): Promise<void> {
    const { db } = this;
    await db.transaction(
      'rw',
      [db.greenhouses, db.teams, db.workers, db.hygieneItems, db.meta],
      async () => {
        await Promise.all([
          db.greenhouses.clear(),
          db.teams.clear(),
          db.workers.clear(),
          db.hygieneItems.clear(),
        ]);
        await Promise.all([
          db.greenhouses.bulkPut(roster.greenhouses),
          db.teams.bulkPut(roster.teams),
          db.hygieneItems.bulkPut(roster.hygieneItems),
          // Badges are looked up as normalised codes.
          db.workers.bulkPut(
            roster.workers.map((w) => ({
              ...w,
              badgeCode: normalizeBadge(w.badgeCode),
            })),
          ),
          db.meta.bulkPut([
            { key: META_FARM_ID, value: roster.farmId },
            { key: META_ROSTER_FETCHED_AT, value: roster.fetchedAt },
          ]),
        ]);
      },
    );
  }

  /** The cached farm, or null before the first download. */
  async roster(): Promise<Roster | null> {
    const { db } = this;
    const [farmId, fetchedAt] = await Promise.all([
      this.meta<string>(META_FARM_ID),
      this.meta<string>(META_ROSTER_FETCHED_AT),
    ]);
    if (!farmId || !fetchedAt) return null;
    const [greenhouses, teams, workers, hygieneItems] = await Promise.all([
      db.greenhouses.toArray(),
      db.teams.toArray(),
      db.workers.toArray(),
      db.hygieneItems.toArray(),
    ]);
    return { farmId, fetchedAt, greenhouses, teams, workers, hygieneItems };
  }

  /** The active worker with this badge, from the cache. */
  async workerByBadge(raw: string): Promise<Worker | null> {
    const code = normalizeBadge(raw);
    if (!code) return null;
    const worker = await this.db.workers
      .where('badgeCode')
      .equals(code)
      .first();
    return worker?.active ? worker : null;
  }

  /** Saves a new entry; it waits for the next sync. */
  async addLog(farmId: string, log: WorkLog): Promise<LogRow> {
    const row: LogRow = {
      ...log,
      farmId,
      syncedAt: null,
      status: 'pending',
      op: 'create',
      rev: 1,
      attempts: 0,
      error: null,
    };
    await this.db.logs.add(row);
    return row;
  }

  /**
   * Saves changes to an entry. A synced entry becomes a pending `update`; a
   * rejected one gets another chance.
   */
  async updateLog(
    id: string,
    changes: Partial<
      Pick<WorkLog, 'kg' | 'crates' | 'rejectedCrates' | 'hours'>
    >,
  ): Promise<LogRow> {
    return this.db.transaction('rw', this.db.logs, async () => {
      const row = await this.db.logs.get(id);
      if (!row) throw new Error(`No work log ${id}`);
      const next: LogRow = {
        ...row,
        ...changes,
        status: 'pending',
        // Never accepted yet: still a create. Otherwise the server has it.
        op: row.syncedAt === null ? 'create' : 'update',
        rev: row.rev + 1,
        attempts: 0,
        error: null,
      };
      await this.db.logs.put(next);
      return next;
    });
  }

  /**
   * Deletes an entry the server never saw. Synced entries stay: only a
   * manager can delete them, on the server.
   */
  async deleteLog(id: string): Promise<boolean> {
    return this.db.transaction('rw', this.db.logs, async () => {
      const row = await this.db.logs.get(id);
      if (!row || row.syncedAt !== null) return false;
      await this.db.logs.delete(id);
      return true;
    });
  }

  /** A day's entries in one greenhouse, newest first. */
  async logsFor(date: IsoDate, greenhouseId: string): Promise<LogRow[]> {
    const rows = await this.db.logs
      .where('[date+greenhouseId]')
      .equals([date, greenhouseId])
      .toArray();
    return rows.sort((a, b) => b.recordedAt.localeCompare(a.recordedAt));
  }

  async logsOn(date: IsoDate): Promise<LogRow[]> {
    return this.db.logs.where('date').equals(date).toArray();
  }

  async countByStatus(): Promise<Record<LogRow['status'], number>> {
    const [pending, synced, rejected] = await Promise.all([
      this.db.logs.where('status').equals('pending').count(),
      this.db.logs.where('status').equals('synced').count(),
      this.db.logs.where('status').equals('rejected').count(),
    ]);
    return { pending, synced, rejected };
  }

  // Hygiene checks ---------------------------------------------------------

  /** A greenhouse's check on a day, if one was started on this phone. */
  async checkFor(
    date: IsoDate,
    greenhouseId: string,
  ): Promise<CheckRow | null> {
    return (
      (await this.db.checks
        .where('[date+greenhouseId]')
        .equals([date, greenhouseId])
        .first()) ?? null
    );
  }

  async checksOn(date: IsoDate): Promise<CheckRow[]> {
    return this.db.checks.where('date').equals(date).toArray();
  }

  /**
   * Saves a check as it stands; it waits for the next sync. Throws a
   * `SignedCheckError` if the phone already has it signed.
   */
  async saveCheck(farmId: string, check: HygieneCheck): Promise<CheckRow> {
    return this.db.transaction('rw', this.db.checks, async () => {
      const current = await this.db.checks.get(check.id);
      if (current?.signedAt) throw new SignedCheckError(check.id);
      const row: CheckRow = {
        ...check,
        farmId,
        status: 'pending',
        rev: (current?.rev ?? 0) + 1,
        attempts: 0,
        error: null,
      };
      await this.db.checks.put(row);
      return row;
    });
  }

  /** Keeps a photo on the phone until the sync uploads it. */
  async addPhoto(photo: Omit<PhotoRow, 'uploaded'>): Promise<void> {
    await this.db.photos.put({ ...photo, uploaded: 0 });
  }

  /** The photo's image, while the phone still has it. */
  async photo(path: string): Promise<Blob | null> {
    return (await this.db.photos.get(path))?.blob ?? null;
  }

  /** Forgets a photo taken off an answer (an uploaded copy stays). */
  async deletePhoto(path: string): Promise<void> {
    await this.db.photos.delete(path);
  }

  async countChecks(): Promise<Record<LogStatus, number>> {
    const [pending, synced, rejected] = await Promise.all([
      this.db.checks.where('status').equals('pending').count(),
      this.db.checks.where('status').equals('synced').count(),
      this.db.checks.where('status').equals('rejected').count(),
    ]);
    return { pending, synced, rejected };
  }

  async lastSyncAt(): Promise<string | null> {
    return (await this.meta<string>(META_LAST_SYNC_AT)) ?? null;
  }

  /**
   * Forgets the farm when its supervisor signs out, so the next person on
   * this phone starts clean. Refuses while entries or checks wait to be
   * sent: they would go out under someone else's name.
   */
  async clearAccount(): Promise<boolean> {
    const { db } = this;
    return db.transaction(
      'rw',
      [
        db.logs,
        db.greenhouses,
        db.teams,
        db.workers,
        db.meta,
        db.hygieneItems,
        db.checks,
        db.photos,
      ],
      async () => {
        const waiting = await Promise.all([
          db.logs.where('status').equals('pending').count(),
          db.checks.where('status').equals('pending').count(),
        ]);
        if (waiting.some((n) => n > 0)) return false;
        await Promise.all([
          db.logs.clear(),
          db.greenhouses.clear(),
          db.teams.clear(),
          db.workers.clear(),
          db.meta.clear(),
          db.hygieneItems.clear(),
          db.checks.clear(),
          db.photos.clear(),
        ]);
        return true;
      },
    );
  }

  private async meta<T>(key: string): Promise<T | undefined> {
    return (await this.db.meta.get(key))?.value as T | undefined;
  }
}
