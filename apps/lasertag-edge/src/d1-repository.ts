import type {
  ArenaMap,
  CheckIn,
  CountryCode,
  Currency,
  Gear,
  GearKind,
  GearStatus,
  Lang,
  PlaySession,
  StaffRole,
  Venue,
} from '@ah/products/lasertag/domain';
import type {
  AuditRow,
  ChallengeKind,
  ChallengeRow,
  GuestRow,
  LasertagRepository,
  PasskeyRow,
  PlayerRow,
  RecoveryRow,
  StaffRow,
} from '@ah/products/lasertag/server';

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

interface PlayerSql {
  id: string;
  handle: string;
  handle_key: string;
  display_name: string;
  language: Lang;
  country: CountryCode;
  birth_year: number;
  minor: number;
  badge_key: string;
  created_at: string;
}
interface PasskeySql {
  id: string;
  player_id: string;
  public_key: string;
  counter: number;
  transports: string;
  created_at: string;
  last_used_at: string | null;
}
interface VenueSql {
  id: string;
  slug: string;
  name: string;
  city: string;
  country: CountryCode;
  timezone: string;
  currency: Currency;
}
interface MapSql {
  id: string;
  venue_id: string;
  name: string;
  indoor: number;
  width_m: number | null;
  length_m: number | null;
}
interface GearSql {
  id: string;
  venue_id: string;
  kind: GearKind;
  label: string;
  paired_with: string | null;
  status: GearStatus;
}
interface GuestSql {
  id: string;
  venue_id: string;
  nickname: string;
  claim_hash: string;
  created_at: string;
  expires_at: string;
  claimed_by: string | null;
}
interface RecoverySql {
  hash: string;
  player_id: string;
  venue_id: string;
  issued_by: string;
  expires_at: string;
  used_at: string | null;
}
interface SessionSql {
  id: string;
  venue_id: string;
  map_id: string;
  opened_at: string;
  closed_at: string | null;
  capacity: number;
}
interface CheckInSql {
  id: string;
  session_id: string;
  wearer_kind: 'player' | 'guest';
  wearer_id: string;
  vest_id: string;
  blaster_id: string | null;
  at: string;
  released_at: string | null;
}

const player = (r: PlayerSql): PlayerRow => ({
  id: r.id,
  handle: r.handle,
  handleKey: r.handle_key,
  displayName: r.display_name,
  language: r.language,
  country: r.country,
  birthYear: r.birth_year,
  minor: r.minor === 1,
  badgeKey: r.badge_key,
  createdAt: r.created_at,
});
const passkey = (r: PasskeySql): PasskeyRow => ({
  id: r.id,
  playerId: r.player_id,
  publicKey: r.public_key,
  counter: r.counter,
  transports: JSON.parse(r.transports) as string[],
  createdAt: r.created_at,
  lastUsedAt: r.last_used_at,
});
const venue = (r: VenueSql): Venue => ({
  id: r.id,
  slug: r.slug,
  name: r.name,
  city: r.city,
  country: r.country,
  timezone: r.timezone,
  currency: r.currency,
});
const arenaMap = (r: MapSql): ArenaMap => ({
  id: r.id,
  venueId: r.venue_id,
  name: r.name,
  indoor: r.indoor === 1,
  size:
    r.width_m !== null && r.length_m !== null
      ? { widthM: r.width_m, lengthM: r.length_m }
      : null,
});
const gearRow = (r: GearSql): Gear => ({
  id: r.id,
  venueId: r.venue_id,
  kind: r.kind,
  label: r.label,
  pairedWith: r.paired_with,
  status: r.status,
});
const guest = (r: GuestSql): GuestRow => ({
  id: r.id,
  venueId: r.venue_id,
  nickname: r.nickname,
  claimHash: r.claim_hash,
  createdAt: r.created_at,
  expiresAt: r.expires_at,
  claimedBy: r.claimed_by,
});
const recovery = (r: RecoverySql): RecoveryRow => ({
  hash: r.hash,
  playerId: r.player_id,
  venueId: r.venue_id,
  issuedBy: r.issued_by,
  expiresAt: r.expires_at,
  usedAt: r.used_at,
});
const session = (r: SessionSql): PlaySession => ({
  id: r.id,
  venueId: r.venue_id,
  mapId: r.map_id,
  openedAt: r.opened_at,
  closedAt: r.closed_at,
  capacity: r.capacity,
});
const checkIn = (r: CheckInSql): CheckIn => ({
  id: r.id,
  sessionId: r.session_id,
  wearer: { kind: r.wearer_kind, id: r.wearer_id },
  vestId: r.vest_id,
  blasterId: r.blaster_id,
  at: r.at,
  releasedAt: r.released_at,
});

const isUnique = (error: unknown) =>
  error instanceof Error && /UNIQUE constraint failed/i.test(error.message);

/** BARQ's data in D1, with the rules the service relies on. */
export class D1LasertagRepository implements LasertagRepository {
  constructor(private readonly db: D1Database) {}

  private async all<T>(sql: string, ...values: unknown[]): Promise<T[]> {
    return (
      (
        await this.db
          .prepare(sql)
          .bind(...values)
          .all<T>()
      ).results ?? []
    );
  }
  private first<T>(sql: string, ...values: unknown[]): Promise<T | null> {
    return this.db
      .prepare(sql)
      .bind(...values)
      .first<T>();
  }
  private async changes(sql: string, ...values: unknown[]): Promise<number> {
    const result = await this.db
      .prepare(sql)
      .bind(...values)
      .run();
    return result.meta?.changes ?? 0;
  }

  async insertPlayer(row: PlayerRow): Promise<'ok' | 'handle-taken'> {
    try {
      await this.changes(
        `INSERT INTO players (id, handle, handle_key, display_name, language, country, birth_year, minor, badge_key, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        row.id,
        row.handle,
        row.handleKey,
        row.displayName,
        row.language,
        row.country,
        row.birthYear,
        row.minor ? 1 : 0,
        row.badgeKey,
        row.createdAt,
      );
      return 'ok';
    } catch (error) {
      if (isUnique(error)) return 'handle-taken';
      throw error;
    }
  }
  async playerById(id: string) {
    const r = await this.first<PlayerSql>(
      'SELECT * FROM players WHERE id = ?',
      id,
    );
    return r ? player(r) : null;
  }
  async playerByHandleKey(key: string) {
    const r = await this.first<PlayerSql>(
      'SELECT * FROM players WHERE handle_key = ?',
      key,
    );
    return r ? player(r) : null;
  }

  async insertPasskey(row: PasskeyRow) {
    await this.changes(
      `INSERT INTO passkeys (id, player_id, public_key, counter, transports, created_at, last_used_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      row.id,
      row.playerId,
      row.publicKey,
      row.counter,
      JSON.stringify(row.transports),
      row.createdAt,
      row.lastUsedAt,
    );
  }
  async passkeyById(id: string) {
    const r = await this.first<PasskeySql>(
      'SELECT * FROM passkeys WHERE id = ?',
      id,
    );
    return r ? passkey(r) : null;
  }
  async passkeysOf(playerId: string) {
    return (
      await this.all<PasskeySql>(
        'SELECT * FROM passkeys WHERE player_id = ? ORDER BY created_at',
        playerId,
      )
    ).map(passkey);
  }
  async touchPasskey(id: string, counter: number, at: string) {
    await this.changes(
      'UPDATE passkeys SET counter = ?, last_used_at = ? WHERE id = ?',
      counter,
      at,
      id,
    );
  }

  async putChallenge(row: ChallengeRow) {
    await this.changes(
      'INSERT INTO challenges (id, kind, challenge, expires_at, data) VALUES (?, ?, ?, ?, ?)',
      row.id,
      row.kind,
      row.challenge,
      row.expiresAt,
      row.data,
    );
  }
  async takeChallenge(id: string): Promise<ChallengeRow | null> {
    // DELETE … RETURNING: two answers for one challenge can't both get it.
    const r = await this.first<{
      id: string;
      kind: ChallengeKind;
      challenge: string;
      expires_at: string;
      data: string | null;
    }>('DELETE FROM challenges WHERE id = ? RETURNING *', id);
    return r
      ? {
          id: r.id,
          kind: r.kind,
          challenge: r.challenge,
          expiresAt: r.expires_at,
          data: r.data,
        }
      : null;
  }
  deleteChallengesBefore(at: string) {
    return this.changes('DELETE FROM challenges WHERE expires_at < ?', at);
  }

  async venueBySlug(slug: string) {
    const r = await this.first<VenueSql>(
      'SELECT * FROM venues WHERE slug = ?',
      slug,
    );
    return r ? venue(r) : null;
  }
  async venueById(id: string) {
    const r = await this.first<VenueSql>(
      'SELECT * FROM venues WHERE id = ?',
      id,
    );
    return r ? venue(r) : null;
  }
  async mapsOf(venueId: string) {
    return (
      await this.all<MapSql>(
        'SELECT * FROM maps WHERE venue_id = ? ORDER BY name',
        venueId,
      )
    ).map(arenaMap);
  }
  async gearOf(venueId: string) {
    return (
      await this.all<GearSql>(
        'SELECT * FROM gear WHERE venue_id = ? ORDER BY label',
        venueId,
      )
    ).map(gearRow);
  }

  async staffRole(venueId: string, playerId: string) {
    const r = await this.first<{ role: StaffRole }>(
      'SELECT role FROM venue_staff WHERE venue_id = ? AND player_id = ?',
      venueId,
      playerId,
    );
    return r?.role ?? null;
  }
  async staffOf(playerId: string) {
    return (
      await this.all<{ slug: string; role: StaffRole }>(
        `SELECT v.slug, s.role FROM venue_staff s JOIN venues v ON v.id = s.venue_id
         WHERE s.player_id = ? ORDER BY v.slug`,
        playerId,
      )
    ).map((r) => ({ venueSlug: r.slug, role: r.role }));
  }
  async staffCount(venueId: string) {
    const r = await this.first<{ n: number }>(
      'SELECT COUNT(*) AS n FROM venue_staff WHERE venue_id = ?',
      venueId,
    );
    return r?.n ?? 0;
  }
  async addStaff(row: StaffRow) {
    await this.changes(
      'INSERT OR IGNORE INTO venue_staff (venue_id, player_id, role, since) VALUES (?, ?, ?, ?)',
      row.venueId,
      row.playerId,
      row.role,
      row.since,
    );
  }

  async insertGuest(row: GuestRow) {
    await this.changes(
      `INSERT INTO guests (id, venue_id, nickname, claim_hash, created_at, expires_at, claimed_by)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      row.id,
      row.venueId,
      row.nickname,
      row.claimHash,
      row.createdAt,
      row.expiresAt,
      row.claimedBy,
    );
  }
  async guestById(id: string) {
    const r = await this.first<GuestSql>(
      'SELECT * FROM guests WHERE id = ?',
      id,
    );
    return r ? guest(r) : null;
  }
  async guestByClaimHash(hash: string) {
    const r = await this.first<GuestSql>(
      'SELECT * FROM guests WHERE claim_hash = ?',
      hash,
    );
    return r ? guest(r) : null;
  }
  async claimGuest(guestId: string, playerId: string) {
    const [claimed] = await this.db.batch([
      this.db
        .prepare(
          'UPDATE guests SET claimed_by = ? WHERE id = ? AND claimed_by IS NULL',
        )
        .bind(playerId, guestId),
      // Only moves anything if the first statement claimed the guest: once
      // claimed, the guest's check-ins already name a player.
      this.db
        .prepare(
          `UPDATE checkins SET wearer_kind = 'player', wearer_id = ?
           WHERE wearer_kind = 'guest' AND wearer_id = ?`,
        )
        .bind(playerId, guestId),
    ]);
    return (claimed.meta?.changes ?? 0) > 0;
  }
  async deleteExpiredGuests(at: string) {
    const [, removed] = await this.db.batch([
      this.db
        .prepare(
          `DELETE FROM checkins WHERE wearer_kind = 'guest' AND wearer_id IN
           (SELECT id FROM guests WHERE claimed_by IS NULL AND expires_at < ?)`,
        )
        .bind(at),
      this.db
        .prepare(
          'DELETE FROM guests WHERE claimed_by IS NULL AND expires_at < ?',
        )
        .bind(at),
    ]);
    return removed.meta?.changes ?? 0;
  }

  async insertRecovery(row: RecoveryRow) {
    await this.changes(
      `INSERT INTO recoveries (hash, player_id, venue_id, issued_by, expires_at, used_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      row.hash,
      row.playerId,
      row.venueId,
      row.issuedBy,
      row.expiresAt,
      row.usedAt,
    );
  }
  async recoveryByHash(hash: string) {
    const r = await this.first<RecoverySql>(
      'SELECT * FROM recoveries WHERE hash = ?',
      hash,
    );
    return r ? recovery(r) : null;
  }
  async useRecovery(hash: string, at: string) {
    return (
      (await this.changes(
        'UPDATE recoveries SET used_at = ? WHERE hash = ? AND used_at IS NULL AND expires_at > ?',
        at,
        hash,
        at,
      )) === 1
    );
  }

  async insertSession(row: PlaySession) {
    await this.changes(
      `INSERT INTO play_sessions (id, venue_id, map_id, opened_at, closed_at, capacity)
       VALUES (?, ?, ?, ?, ?, ?)`,
      row.id,
      row.venueId,
      row.mapId,
      row.openedAt,
      row.closedAt,
      row.capacity,
    );
  }
  async sessionById(id: string) {
    const r = await this.first<SessionSql>(
      'SELECT * FROM play_sessions WHERE id = ?',
      id,
    );
    return r ? session(r) : null;
  }
  async openSessionsOf(venueId: string) {
    return (
      await this.all<SessionSql>(
        'SELECT * FROM play_sessions WHERE venue_id = ? AND closed_at IS NULL ORDER BY opened_at DESC',
        venueId,
      )
    ).map(session);
  }
  async closeSession(id: string, at: string) {
    await this.db.batch([
      this.db
        .prepare(
          'UPDATE play_sessions SET closed_at = ? WHERE id = ? AND closed_at IS NULL',
        )
        .bind(at, id),
      this.db
        .prepare(
          'UPDATE checkins SET released_at = ? WHERE session_id = ? AND released_at IS NULL',
        )
        .bind(at, id),
    ]);
  }

  async checkInsOf(sessionId: string) {
    return (
      await this.all<CheckInSql>(
        'SELECT * FROM checkins WHERE session_id = ? ORDER BY at, id',
        sessionId,
      )
    ).map(checkIn);
  }
  async checkInById(id: string) {
    const r = await this.first<CheckInSql>(
      'SELECT * FROM checkins WHERE id = ?',
      id,
    );
    return r ? checkIn(r) : null;
  }
  async insertCheckIn(row: CheckIn): Promise<'ok' | 'conflict'> {
    try {
      await this.changes(
        `INSERT INTO checkins (id, session_id, wearer_kind, wearer_id, vest_id, blaster_id, at, released_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        row.id,
        row.sessionId,
        row.wearer.kind,
        row.wearer.id,
        row.vestId,
        row.blasterId,
        row.at,
        row.releasedAt,
      );
      return 'ok';
    } catch (error) {
      if (isUnique(error)) return 'conflict';
      throw error;
    }
  }
  async releaseCheckIn(id: string, at: string) {
    return (
      (await this.changes(
        'UPDATE checkins SET released_at = ? WHERE id = ? AND released_at IS NULL',
        at,
        id,
      )) === 1
    );
  }

  async audit(row: AuditRow) {
    await this.changes(
      'INSERT INTO audit_log (at, venue_id, actor_id, action, subject_id) VALUES (?, ?, ?, ?, ?)',
      row.at,
      row.venueId,
      row.actorId,
      row.action,
      row.subjectId,
    );
  }
}
