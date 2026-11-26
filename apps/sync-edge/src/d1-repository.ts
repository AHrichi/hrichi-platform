import { recordId, type StoredRecord } from '@ah/shared/sync';
import type {
  DeviceRow,
  PairingRow,
  SpaceRow,
  StoredVersion,
  SyncRepository,
  WriteRecord,
} from '@ah/shared/sync-server';

/** The part of Cloudflare's D1 binding this store uses. */
export interface D1Result<T = Record<string, unknown>> {
  readonly results?: T[];
  readonly meta?: { readonly changes?: number };
}
export interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<D1Result>;
}
export interface D1Database {
  prepare(query: string): D1PreparedStatement;
  /** Runs the statements in one transaction. */
  batch(statements: D1PreparedStatement[]): Promise<D1Result[]>;
}

interface SpaceSql {
  id: string;
  app: string;
  created_at: string;
  last_seen_at: string;
}
interface DeviceSql {
  id: string;
  space_id: string;
  name: string;
  created_at: string;
  last_seen_at: string;
  revoked_at: string | null;
}
interface RecordSql {
  kind: string;
  key: string;
  seq: number;
  updated_at: string;
  writer: string;
  deleted: number;
  data: string | null;
}

/** D1 binds at most 100 values a statement. */
const KEYS_PER_QUERY = 40;

const space = (row: SpaceSql): SpaceRow => ({
  id: row.id,
  app: row.app,
  createdAt: row.created_at,
  lastSeenAt: row.last_seen_at,
});

const device = (row: DeviceSql): DeviceRow => ({
  id: row.id,
  spaceId: row.space_id,
  name: row.name,
  createdAt: row.created_at,
  lastSeenAt: row.last_seen_at,
  revokedAt: row.revoked_at,
});

/**
 * Sync spaces in Cloudflare D1 (`migrations/0001_init.sql`). Times are
 * stored as `toISOString()` text, so comparing them as text compares the
 * instants; the service writes them that way.
 */
export class D1SyncRepository implements SyncRepository {
  constructor(private readonly db: D1Database) {}

  async createSpace(row: SpaceRow, first: DeviceRow): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          'INSERT INTO spaces (id, app, created_at, last_seen_at) VALUES (?1, ?2, ?3, ?4)',
        )
        .bind(row.id, row.app, row.createdAt, row.lastSeenAt),
      this.insertDevice(first),
    ]);
  }

  async space(id: string): Promise<SpaceRow | null> {
    const row = await this.db
      .prepare(
        'SELECT id, app, created_at, last_seen_at FROM spaces WHERE id = ?1',
      )
      .bind(id)
      .first<SpaceSql>();
    return row ? space(row) : null;
  }

  async addDevice(row: DeviceRow): Promise<void> {
    await this.insertDevice(row).run();
  }

  async device(id: string): Promise<DeviceRow | null> {
    const row = await this.db
      .prepare('SELECT * FROM devices WHERE id = ?1')
      .bind(id)
      .first<DeviceSql>();
    return row ? device(row) : null;
  }

  async devices(spaceId: string): Promise<DeviceRow[]> {
    const { results = [] } = await this.db
      .prepare(
        'SELECT * FROM devices WHERE space_id = ?1 ORDER BY created_at, id',
      )
      .bind(spaceId)
      .all<DeviceSql>();
    return results.map(device);
  }

  async seen(spaceId: string, deviceId: string, at: string): Promise<void> {
    await this.db.batch([
      this.db
        .prepare(
          'UPDATE devices SET last_seen_at = ?3 WHERE id = ?2 AND space_id = ?1',
        )
        .bind(spaceId, deviceId, at),
      this.db
        .prepare('UPDATE spaces SET last_seen_at = ?2 WHERE id = ?1')
        .bind(spaceId, at),
    ]);
  }

  async revoke(
    spaceId: string,
    deviceId: string,
    at: string,
  ): Promise<boolean> {
    const done = await this.db
      .prepare(
        'UPDATE devices SET revoked_at = COALESCE(revoked_at, ?3) WHERE id = ?2 AND space_id = ?1',
      )
      .bind(spaceId, deviceId, at)
      .run();
    return (done.meta?.changes ?? 0) > 0;
  }

  async addPairing(pairing: PairingRow): Promise<void> {
    await this.db
      .prepare(
        'INSERT INTO pairings (code_hash, space_id, created_by, expires_at) VALUES (?1, ?2, ?3, ?4)',
      )
      .bind(
        pairing.codeHash,
        pairing.spaceId,
        pairing.createdBy,
        pairing.expiresAt,
      )
      .run();
  }

  async claimPairing(
    codeHash: string,
    now: string,
  ): Promise<{ spaceId: string } | null> {
    // One statement, so two devices can't both use the same code.
    const row = await this.db
      .prepare(
        'UPDATE pairings SET used_at = ?2 WHERE code_hash = ?1 AND used_at IS NULL AND expires_at > ?2 RETURNING space_id',
      )
      .bind(codeHash, now)
      .first<{ space_id: string }>();
    return row ? { spaceId: row.space_id } : null;
  }

  async versions(
    spaceId: string,
    records: readonly { kind: string; key: string }[],
  ): Promise<Map<string, StoredVersion>> {
    const found = new Map<string, StoredVersion>();
    for (let i = 0; i < records.length; i += KEYS_PER_QUERY) {
      const chunk = records.slice(i, i + KEYS_PER_QUERY);
      const pairs = chunk.map((_, n) => `(?${2 + n * 2}, ?${3 + n * 2})`);
      const { results = [] } = await this.db
        .prepare(
          `SELECT kind, key, updated_at, writer, bytes FROM records WHERE space_id = ?1 AND (kind, key) IN (VALUES ${pairs.join(', ')})`,
        )
        .bind(spaceId, ...chunk.flatMap((r) => [r.kind, r.key]))
        .all<{
          kind: string;
          key: string;
          updated_at: string;
          writer: string;
          bytes: number;
        }>();
      for (const row of results) {
        found.set(recordId(row), {
          updatedAt: row.updated_at,
          by: row.writer,
          bytes: row.bytes,
        });
      }
    }
    return found;
  }

  async write(spaceId: string, records: readonly WriteRecord[]): Promise<void> {
    if (records.length === 0) return;
    // In one transaction: each record takes the space's next number, and
    // replaces what's stored only if it wins, so a push that raced with
    // another device's can't put an older version back.
    const statements = records.flatMap((record) => [
      this.db
        .prepare('UPDATE spaces SET seq = seq + 1 WHERE id = ?1')
        .bind(spaceId),
      this.db
        .prepare(
          `INSERT INTO records (space_id, kind, key, seq, updated_at, writer, deleted, data, bytes)
           VALUES (?1, ?2, ?3, (SELECT seq FROM spaces WHERE id = ?1), ?4, ?5, ?6, ?7, ?8)
           ON CONFLICT (space_id, kind, key) DO UPDATE SET
             seq = excluded.seq, updated_at = excluded.updated_at, writer = excluded.writer,
             deleted = excluded.deleted, data = excluded.data, bytes = excluded.bytes
           WHERE excluded.updated_at > records.updated_at
              OR (excluded.updated_at = records.updated_at AND excluded.writer > records.writer)`,
        )
        .bind(
          spaceId,
          record.kind,
          record.key,
          record.updatedAt,
          record.by,
          record.deleted ? 1 : 0,
          record.deleted ? null : JSON.stringify(record.data ?? null),
          record.bytes,
        ),
    ]);
    await this.db.batch(statements);
  }

  async pull(
    spaceId: string,
    afterSeq: number,
    limit: number,
  ): Promise<StoredRecord[]> {
    const { results = [] } = await this.db
      .prepare(
        'SELECT kind, key, seq, updated_at, writer, deleted, data FROM records WHERE space_id = ?1 AND seq > ?2 ORDER BY seq LIMIT ?3',
      )
      .bind(spaceId, afterSeq, limit)
      .all<RecordSql>();
    return results.map((row) => ({
      kind: row.kind,
      key: row.key,
      seq: row.seq,
      updatedAt: row.updated_at,
      by: row.writer,
      ...(row.deleted
        ? { deleted: true }
        : { data: JSON.parse(row.data ?? 'null') as unknown }),
    }));
  }

  async usage(spaceId: string): Promise<{ records: number; bytes: number }> {
    const row = await this.db
      .prepare(
        'SELECT COUNT(*) AS records, COALESCE(SUM(bytes), 0) AS bytes FROM records WHERE space_id = ?1',
      )
      .bind(spaceId)
      .first<{ records: number; bytes: number }>();
    return {
      records: Number(row?.records ?? 0),
      bytes: Number(row?.bytes ?? 0),
    };
  }

  async deleteSpace(spaceId: string): Promise<void> {
    await this.db.batch(
      ['records', 'pairings', 'devices']
        .map((table) =>
          this.db
            .prepare(`DELETE FROM ${table} WHERE space_id = ?1`)
            .bind(spaceId),
        )
        .concat(
          this.db.prepare('DELETE FROM spaces WHERE id = ?1').bind(spaceId),
        ),
    );
  }

  async sweep(
    now: string,
    idleBefore: string,
  ): Promise<{ pairings: number; spaces: number }> {
    const spent = await this.db
      .prepare(
        'DELETE FROM pairings WHERE used_at IS NOT NULL OR expires_at <= ?1',
      )
      .bind(now)
      .run();
    const { results: idle = [] } = await this.db
      .prepare('SELECT id FROM spaces WHERE last_seen_at < ?1')
      .bind(idleBefore)
      .all<{ id: string }>();
    for (const { id } of idle) await this.deleteSpace(id);
    return { pairings: spent.meta?.changes ?? 0, spaces: idle.length };
  }

  private insertDevice(row: DeviceRow): D1PreparedStatement {
    return this.db
      .prepare(
        'INSERT INTO devices (id, space_id, name, created_at, last_seen_at, revoked_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)',
      )
      .bind(
        row.id,
        row.spaceId,
        row.name,
        row.createdAt,
        row.lastSeenAt,
        row.revokedAt,
      );
  }
}
