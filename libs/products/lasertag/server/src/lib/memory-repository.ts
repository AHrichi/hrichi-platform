import type {
  ArenaMap,
  CheckIn,
  Gear,
  PlaySession,
  StaffRole,
  Venue,
} from '@ah/products/lasertag/domain';
import { FIRST_GEAR, FIRST_MAP, FIRST_VENUE } from './first-venue';
import type {
  AuditRow,
  ChallengeRow,
  GuestRow,
  LasertagRepository,
  PasskeyRow,
  PlayerRow,
  RecoveryRow,
  StaffRow,
} from './repository';

export interface MemorySeed {
  readonly venues: readonly Venue[];
  readonly maps: readonly ArenaMap[];
  readonly gear: readonly Gear[];
}

export const FIRST_VENUE_SEED: MemorySeed = {
  venues: [FIRST_VENUE],
  maps: [FIRST_MAP],
  gear: FIRST_GEAR,
};

/** A store in memory, for tests and local tools. Same rules as D1's. */
export class MemoryRepository implements LasertagRepository {
  private readonly players = new Map<string, PlayerRow>();
  private readonly passkeys = new Map<string, PasskeyRow>();
  private readonly challenges = new Map<string, ChallengeRow>();
  private readonly venues: Venue[];
  private readonly maps: ArenaMap[];
  private readonly gear: Gear[];
  private readonly staff: StaffRow[] = [];
  private readonly guests = new Map<string, GuestRow>();
  private readonly recoveries = new Map<string, RecoveryRow>();
  private readonly sessions = new Map<string, PlaySession>();
  private checkIns: CheckIn[] = [];
  readonly audits: AuditRow[] = [];

  constructor(seed: MemorySeed = FIRST_VENUE_SEED) {
    this.venues = [...seed.venues];
    this.maps = [...seed.maps];
    this.gear = [...seed.gear];
  }

  async insertPlayer(row: PlayerRow): Promise<'ok' | 'handle-taken'> {
    for (const player of this.players.values()) {
      if (player.handleKey === row.handleKey) return 'handle-taken';
    }
    this.players.set(row.id, row);
    return 'ok';
  }
  async playerById(id: string) {
    return this.players.get(id) ?? null;
  }
  async playerByHandleKey(key: string) {
    for (const player of this.players.values()) {
      if (player.handleKey === key) return player;
    }
    return null;
  }

  async insertPasskey(row: PasskeyRow) {
    this.passkeys.set(row.id, row);
  }
  async passkeyById(id: string) {
    return this.passkeys.get(id) ?? null;
  }
  async passkeysOf(playerId: string) {
    return [...this.passkeys.values()].filter((p) => p.playerId === playerId);
  }
  async touchPasskey(id: string, counter: number, at: string) {
    const row = this.passkeys.get(id);
    if (row) this.passkeys.set(id, { ...row, counter, lastUsedAt: at });
  }

  async putChallenge(row: ChallengeRow) {
    this.challenges.set(row.id, row);
  }
  async takeChallenge(id: string) {
    const row = this.challenges.get(id) ?? null;
    this.challenges.delete(id);
    return row;
  }
  async deleteChallengesBefore(at: string) {
    let removed = 0;
    for (const [id, row] of this.challenges) {
      if (row.expiresAt < at) {
        this.challenges.delete(id);
        removed++;
      }
    }
    return removed;
  }

  async venueBySlug(slug: string) {
    return this.venues.find((v) => v.slug === slug) ?? null;
  }
  async venueById(id: string) {
    return this.venues.find((v) => v.id === id) ?? null;
  }
  async mapsOf(venueId: string) {
    return this.maps.filter((m) => m.venueId === venueId);
  }
  async gearOf(venueId: string) {
    return this.gear
      .filter((g) => g.venueId === venueId)
      .sort((a, b) => a.label.localeCompare(b.label));
  }

  async staffRole(
    venueId: string,
    playerId: string,
  ): Promise<StaffRole | null> {
    return (
      this.staff.find((s) => s.venueId === venueId && s.playerId === playerId)
        ?.role ?? null
    );
  }
  async staffOf(playerId: string) {
    return this.staff
      .filter((s) => s.playerId === playerId)
      .map((s) => ({
        venueSlug: this.venues.find((v) => v.id === s.venueId)?.slug ?? '',
        role: s.role,
      }));
  }
  async staffCount(venueId: string) {
    return this.staff.filter((s) => s.venueId === venueId).length;
  }
  async addStaff(row: StaffRow) {
    if (!(await this.staffRole(row.venueId, row.playerId)))
      this.staff.push(row);
  }

  async insertGuest(row: GuestRow) {
    this.guests.set(row.id, row);
  }
  async guestById(id: string) {
    return this.guests.get(id) ?? null;
  }
  async guestByClaimHash(hash: string) {
    for (const guest of this.guests.values()) {
      if (guest.claimHash === hash) return guest;
    }
    return null;
  }
  async claimGuest(guestId: string, playerId: string) {
    const guest = this.guests.get(guestId);
    if (!guest || guest.claimedBy) return false;
    this.guests.set(guestId, { ...guest, claimedBy: playerId });
    this.checkIns = this.checkIns.map((c) =>
      c.wearer.kind === 'guest' && c.wearer.id === guestId
        ? { ...c, wearer: { kind: 'player', id: playerId } }
        : c,
    );
    return true;
  }
  async deleteExpiredGuests(at: string) {
    let removed = 0;
    for (const [id, guest] of this.guests) {
      if (!guest.claimedBy && guest.expiresAt < at) {
        this.guests.delete(id);
        this.checkIns = this.checkIns.filter(
          (c) => !(c.wearer.kind === 'guest' && c.wearer.id === id),
        );
        removed++;
      }
    }
    return removed;
  }

  async insertRecovery(row: RecoveryRow) {
    this.recoveries.set(row.hash, row);
  }
  async recoveryByHash(hash: string) {
    return this.recoveries.get(hash) ?? null;
  }
  async useRecovery(hash: string, at: string) {
    const row = this.recoveries.get(hash);
    if (!row || row.usedAt || row.expiresAt <= at) return false;
    this.recoveries.set(hash, { ...row, usedAt: at });
    return true;
  }

  async insertSession(row: PlaySession) {
    this.sessions.set(row.id, row);
  }
  async sessionById(id: string) {
    return this.sessions.get(id) ?? null;
  }
  async openSessionsOf(venueId: string) {
    return [...this.sessions.values()]
      .filter((s) => s.venueId === venueId && !s.closedAt)
      .sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  }
  async closeSession(id: string, at: string) {
    const session = this.sessions.get(id);
    if (!session) return;
    this.sessions.set(id, { ...session, closedAt: at });
    this.checkIns = this.checkIns.map((c) =>
      c.sessionId === id && !c.releasedAt ? { ...c, releasedAt: at } : c,
    );
  }

  async checkInsOf(sessionId: string) {
    return this.checkIns
      .filter((c) => c.sessionId === sessionId)
      .sort((a, b) => a.at.localeCompare(b.at));
  }
  async checkInById(id: string) {
    return this.checkIns.find((c) => c.id === id) ?? null;
  }
  async insertCheckIn(row: CheckIn): Promise<'ok' | 'conflict'> {
    const clash = this.checkIns.some(
      (c) =>
        c.sessionId === row.sessionId &&
        !c.releasedAt &&
        (c.vestId === row.vestId ||
          (c.wearer.kind === row.wearer.kind && c.wearer.id === row.wearer.id)),
    );
    if (clash) return 'conflict';
    this.checkIns.push(row);
    return 'ok';
  }
  async releaseCheckIn(id: string, at: string) {
    const index = this.checkIns.findIndex((c) => c.id === id && !c.releasedAt);
    if (index < 0) return false;
    this.checkIns[index] = { ...this.checkIns[index], releasedAt: at };
    return true;
  }

  async hasActiveCheckIn(wearer: CheckIn['wearer']) {
    return this.checkIns.some(
      (c) =>
        !c.releasedAt &&
        c.wearer.kind === wearer.kind &&
        c.wearer.id === wearer.id,
    );
  }

  async audit(row: AuditRow) {
    this.audits.push(row);
  }
}
