import type { IsoDate, Worker, WorkLog } from '@ah/products/greenhouse/domain';
import { normalizeBadge } from '@ah/products/greenhouse/domain';
import {
  type FieldDatabase,
  type LogRow,
  META_FARM_ID,
  META_LAST_SYNC_AT,
  META_ROSTER_FETCHED_AT,
  type Roster,
} from './field-database';

/** Reads and writes on the phone. Nothing here touches the network. */
export class FieldRepository {
  constructor(private readonly db: FieldDatabase) {}

  /** Replaces the cached farm with a fresh download, in one transaction. */
  async saveRoster(roster: Roster): Promise<void> {
    const { db } = this;
    await db.transaction(
      'rw',
      [db.greenhouses, db.teams, db.workers, db.meta],
      async () => {
        await Promise.all([
          db.greenhouses.clear(),
          db.teams.clear(),
          db.workers.clear(),
        ]);
        await Promise.all([
          db.greenhouses.bulkPut(roster.greenhouses),
          db.teams.bulkPut(roster.teams),
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
    const [greenhouses, teams, workers] = await Promise.all([
      db.greenhouses.toArray(),
      db.teams.toArray(),
      db.workers.toArray(),
    ]);
    return { farmId, fetchedAt, greenhouses, teams, workers };
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

  async lastSyncAt(): Promise<string | null> {
    return (await this.meta<string>(META_LAST_SYNC_AT)) ?? null;
  }

  private async meta<T>(key: string): Promise<T | undefined> {
    return (await this.db.meta.get(key))?.value as T | undefined;
  }
}
