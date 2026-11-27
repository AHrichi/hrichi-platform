import type {
  ArenaMap,
  CheckIn,
  CountryCode,
  Gear,
  Lang,
  PlaySession,
  StaffRole,
  Venue,
} from '@ah/products/lasertag/domain';

/** Rows as the service sees them; a store maps them to its own tables. */
export interface PlayerRow {
  readonly id: string;
  readonly handle: string;
  /** The handle folded for comparison (`handleKey`), unique. */
  readonly handleKey: string;
  readonly displayName: string;
  readonly language: Lang;
  readonly country: CountryCode;
  readonly birthYear: number;
  readonly minor: boolean;
  /** 32 random bytes, base64url: the key of the player's rotating badge. */
  readonly badgeKey: string;
  readonly createdAt: string;
}

export interface PasskeyRow {
  /** The credential id, base64url, as the browser reports it. */
  readonly id: string;
  readonly playerId: string;
  readonly publicKey: string;
  readonly counter: number;
  readonly transports: readonly string[];
  readonly createdAt: string;
  readonly lastUsedAt: string | null;
}

export type ChallengeKind = 'signup' | 'signin' | 'recovery';

/** A passkey ceremony under way: used once, then gone. */
export interface ChallengeRow {
  readonly id: string;
  readonly kind: ChallengeKind;
  readonly challenge: string;
  readonly expiresAt: string;
  /** JSON: the sign-up draft, or the recovery's player and code hash. */
  readonly data: string | null;
}

export interface StaffRow {
  readonly venueId: string;
  readonly playerId: string;
  readonly role: StaffRole;
  readonly since: string;
}

export interface GuestRow {
  readonly id: string;
  readonly venueId: string;
  readonly nickname: string;
  readonly claimHash: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly claimedBy: string | null;
}

export interface RecoveryRow {
  readonly hash: string;
  readonly playerId: string;
  readonly venueId: string;
  readonly issuedBy: string;
  readonly expiresAt: string;
  readonly usedAt: string | null;
}

export interface AuditRow {
  readonly at: string;
  readonly venueId: string | null;
  readonly actorId: string;
  readonly action: string;
  readonly subjectId: string | null;
}

/**
 * Everything the service needs from a store. Each method is one atomic
 * step; the uniqueness rules (handles, one active check-in per vest and per
 * wearer) live in the store, so two staff phones can't both win a race.
 */
export interface LasertagRepository {
  insertPlayer(row: PlayerRow): Promise<'ok' | 'handle-taken'>;
  playerById(id: string): Promise<PlayerRow | null>;
  playerByHandleKey(key: string): Promise<PlayerRow | null>;

  insertPasskey(row: PasskeyRow): Promise<void>;
  passkeyById(id: string): Promise<PasskeyRow | null>;
  passkeysOf(playerId: string): Promise<readonly PasskeyRow[]>;
  touchPasskey(id: string, counter: number, at: string): Promise<void>;

  putChallenge(row: ChallengeRow): Promise<void>;
  /** Returns the challenge and deletes it, so it can't be used twice. */
  takeChallenge(id: string): Promise<ChallengeRow | null>;
  deleteChallengesBefore(at: string): Promise<number>;

  venueBySlug(slug: string): Promise<Venue | null>;
  venueById(id: string): Promise<Venue | null>;
  mapsOf(venueId: string): Promise<readonly ArenaMap[]>;
  gearOf(venueId: string): Promise<readonly Gear[]>;

  staffRole(venueId: string, playerId: string): Promise<StaffRole | null>;
  staffOf(
    playerId: string,
  ): Promise<
    readonly { readonly venueSlug: string; readonly role: StaffRole }[]
  >;
  staffCount(venueId: string): Promise<number>;
  addStaff(row: StaffRow): Promise<void>;

  insertGuest(row: GuestRow): Promise<void>;
  guestById(id: string): Promise<GuestRow | null>;
  guestByClaimHash(hash: string): Promise<GuestRow | null>;
  /** Marks the guest claimed and moves their check-ins to the player. */
  claimGuest(guestId: string, playerId: string): Promise<boolean>;
  /** Unclaimed guests past their date, with their check-ins. */
  deleteExpiredGuests(at: string): Promise<number>;

  insertRecovery(row: RecoveryRow): Promise<void>;
  recoveryByHash(hash: string): Promise<RecoveryRow | null>;
  /** Marks the code used if it still can be; false if it was already. */
  useRecovery(hash: string, at: string): Promise<boolean>;

  insertSession(row: PlaySession): Promise<void>;
  sessionById(id: string): Promise<PlaySession | null>;
  openSessionsOf(venueId: string): Promise<readonly PlaySession[]>;
  /** Closes the session and releases its check-ins. */
  closeSession(id: string, at: string): Promise<void>;

  checkInsOf(sessionId: string): Promise<readonly CheckIn[]>;
  checkInById(id: string): Promise<CheckIn | null>;
  /** 'conflict' when the vest or the wearer is already checked in. */
  insertCheckIn(row: CheckIn): Promise<'ok' | 'conflict'>;
  releaseCheckIn(id: string, at: string): Promise<boolean>;
  /** True while the wearer has gear in any session. */
  hasActiveCheckIn(wearer: CheckIn['wearer']): Promise<boolean>;

  audit(row: AuditRow): Promise<void>;
}
