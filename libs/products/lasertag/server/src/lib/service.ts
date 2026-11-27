import * as v from 'valibot';
import {
  AGE_POLICIES,
  BADGE_KEY_BYTES,
  type CeremonyFinish,
  CeremonyFinishSchema,
  type CeremonyStarted,
  type CheckIn,
  type CheckInBody,
  CheckInSchema,
  checkInProblem,
  cleanName,
  CodeSchema,
  DISPLAY_NAME_MAX,
  type ErrorCode,
  type ErrorDetail,
  formatCode,
  type Gear,
  guestExpiresAt,
  GuestCreateSchema,
  type GuestCreated,
  type GuestView,
  handleKey,
  handleProblem,
  hashCode,
  isId,
  NICKNAME_MAX,
  NICKNAME_MIN,
  nameProblem,
  newCode,
  newId,
  normalizeCode,
  parseBadge,
  parseGearScan,
  parseTypedBadge,
  type PlaySession,
  type PlayerView,
  randomBytes,
  sha256Hex,
  RecoveryIssueSchema,
  type RecoveryIssued,
  type RosterEntry,
  SessionOpenSchema,
  type SessionView,
  sessionExpiry,
  type SignedIn,
  signSession,
  signupAge,
  type SignupStart,
  SignupStartSchema,
  toBase64Url,
  type VenueView,
  verifyBadge,
  verifyBadgeCode,
  verifySession,
  type Wearer,
} from '@ah/products/lasertag/domain';
import type { PasskeyVerifier } from './passkeys';
import type {
  ChallengeKind,
  GuestRow,
  LasertagRepository,
  PlayerRow,
} from './repository';

/** A refusal the Worker turns into `{ ok: false, code, message }`. */
export class ServiceError extends Error {
  constructor(
    readonly code: ErrorCode,
    readonly status: number,
    message: string,
    readonly detail?: ErrorDetail,
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

function fail(
  code: ErrorCode,
  status: number,
  message: string,
  detail?: ErrorDetail,
): never {
  throw new ServiceError(code, status, message, detail);
}

export interface ServiceDeps {
  readonly repo: LasertagRepository;
  readonly passkeys: PasskeyVerifier;
  /** Signs session tokens: 32 characters or more. */
  readonly secret: string;
  /** Lets the first person claim a venue that has no staff yet; null: off. */
  readonly bootstrapCode: string | null;
  readonly now?: () => Date;
}

/** A ceremony has five minutes between options and answer. */
const CEREMONY_MS = 5 * 60_000;
/** A recovery code from staff lasts a day. */
const RECOVERY_MS = 24 * 3_600_000;

interface SignupDraft {
  readonly playerId: string;
  readonly handle: string;
  readonly displayName: string;
  readonly birthYear: number;
  readonly language: SignupStart['language'];
  readonly country: SignupStart['country'];
}

interface RecoveryDraft {
  readonly playerId: string;
  readonly hash: string;
}

function parse<S extends v.GenericSchema>(
  schema: S,
  body: unknown,
): v.InferOutput<S> {
  const result = v.safeParse(schema, body);
  if (!result.success) fail('BAD_REQUEST', 400, 'The request is malformed');
  return result.output;
}

/**
 * BARQ's service: every endpoint as a plain function, so the Worker, a test
 * or another host can call it. Staff actions check the caller's role at the
 * venue; everything a person typed is checked here, not trusted from the app.
 */
export function createService(deps: ServiceDeps) {
  const { repo, passkeys } = deps;
  const now = deps.now ?? (() => new Date());

  async function signedIn(player: PlayerRow): Promise<SignedIn> {
    const expiresAt = sessionExpiry(now());
    return {
      token: await signSession(deps.secret, { playerId: player.id, expiresAt }),
      expiresAt: expiresAt.toISOString(),
      player: await view(player),
      badgeKey: player.badgeKey,
    };
  }

  async function view(player: PlayerRow): Promise<PlayerView> {
    const staff = await repo.staffOf(player.id);
    return {
      id: player.id,
      handle: player.handle,
      displayName: player.displayName,
      language: player.language,
      minor: player.minor,
      createdAt: player.createdAt,
      staff: staff.map((s) => ({ venue: s.venueSlug, role: s.role })),
    };
  }

  async function startCeremony(
    kind: ChallengeKind,
    challenge: string,
    data: unknown,
  ): Promise<string> {
    const id = newId();
    await repo.putChallenge({
      id,
      kind,
      challenge,
      expiresAt: new Date(now().getTime() + CEREMONY_MS).toISOString(),
      data: data === null ? null : JSON.stringify(data),
    });
    return id;
  }

  async function takeCeremony(kind: ChallengeKind, body: CeremonyFinish) {
    const row = isId(body.challengeId)
      ? await repo.takeChallenge(body.challengeId)
      : null;
    if (!row || row.kind !== kind || row.expiresAt <= now().toISOString()) {
      fail('CHALLENGE_EXPIRED', 410, 'Start again: this request expired');
    }
    return row;
  }

  /** The signed-in player, or 401. */
  async function caller(token: string | null): Promise<PlayerRow> {
    const claims = token
      ? await verifySession(deps.secret, token, now())
      : null;
    const player = claims ? await repo.playerById(claims.playerId) : null;
    if (!player) fail('UNAUTHORIZED', 401, 'Sign in first');
    return player;
  }

  /** The venue, if the caller works there. */
  async function staffVenue(token: string | null, slug: string) {
    const player = await caller(token);
    const venue = await repo.venueBySlug(slug);
    if (!venue) fail('NOT_FOUND', 404, 'No such venue');
    const role = await repo.staffRole(venue.id, player.id);
    if (!role) fail('FORBIDDEN', 403, 'Only the venue’s staff can do this');
    return { player, venue, role };
  }

  async function staffSession(token: string | null, sessionId: string) {
    const session = isId(sessionId) ? await repo.sessionById(sessionId) : null;
    if (!session) fail('NOT_FOUND', 404, 'No such session');
    const venue = await repo.venueById(session.venueId);
    if (!venue) fail('NOT_FOUND', 404, 'No such venue');
    const staff = await staffVenue(token, venue.slug);
    return { ...staff, session };
  }

  async function sessionView(session: PlaySession): Promise<SessionView> {
    const [checkIns, gear] = await Promise.all([
      repo.checkInsOf(session.id),
      repo.gearOf(session.venueId),
    ]);
    const label = new Map(gear.map((g) => [g.id, g.label]));
    const roster: RosterEntry[] = [];
    for (const c of checkIns.filter((c) => !c.releasedAt)) {
      let name = '?';
      if (c.wearer.kind === 'player') {
        const player = await repo.playerById(c.wearer.id);
        name = player ? `@${player.handle}` : '?';
      } else {
        const guest = await repo.guestById(c.wearer.id);
        name = guest?.nickname ?? '?';
      }
      roster.push({
        checkInId: c.id,
        wearer: c.wearer,
        name,
        vest: label.get(c.vestId) ?? '?',
        blaster: c.blasterId ? (label.get(c.blasterId) ?? '?') : null,
        at: c.at,
      });
    }
    return { session, roster };
  }

  function guestView(guest: GuestRow): GuestView {
    return {
      id: guest.id,
      nickname: guest.nickname,
      expiresAt: guest.expiresAt,
      claimedBy: guest.claimedBy,
    };
  }

  async function wearerFrom(
    body: CheckInBody,
    venueId: string,
  ): Promise<Wearer> {
    const typed = body.badge ? parseTypedBadge(body.badge) : null;
    if (typed) {
      const player = await repo.playerByHandleKey(handleKey(typed.handle));
      if (
        !player ||
        !(await verifyBadgeCode(typed.code, player.badgeKey, player.id, now()))
      ) {
        fail(
          'BADGE_INVALID',
          422,
          'This code isn’t valid: ask for the current one',
        );
      }
      return { kind: 'player', id: player.id };
    }
    if (body.badge) {
      const badge = parseBadge(body.badge);
      const player = badge ? await repo.playerById(badge.playerId) : null;
      if (
        !badge ||
        !player ||
        !(await verifyBadge(badge, player.badgeKey, now()))
      ) {
        fail(
          'BADGE_INVALID',
          422,
          'This badge isn’t valid: ask for a fresh one',
        );
      }
      return { kind: 'player', id: player.id };
    }
    if (body.guestId) {
      const guest = isId(body.guestId)
        ? await repo.guestById(body.guestId)
        : null;
      if (!guest || guest.venueId !== venueId) {
        fail('NOT_FOUND', 404, 'No such guest');
      }
      if (guest.claimedBy) return { kind: 'player', id: guest.claimedBy };
      if (guest.expiresAt <= now().toISOString()) {
        fail('NOT_FOUND', 404, 'This guest has expired');
      }
      return { kind: 'guest', id: guest.id };
    }
    return fail('BAD_REQUEST', 400, 'Scan a badge or pick a guest');
  }

  function vestFrom(scan: string, gear: readonly Gear[]): Gear {
    const target = parseGearScan(scan);
    const found = target
      ? gear.find((g) =>
          target.by === 'id'
            ? g.id === target.gearId
            : g.label === target.label,
        )
      : undefined;
    if (!found)
      return fail('GEAR_UNKNOWN', 404, 'No such vest or blaster here');
    // A blaster's sticker works too: its vest is the one to wear.
    if (found.kind === 'blaster' && found.pairedWith) {
      const vest = gear.find((g) => g.id === found.pairedWith);
      if (vest) return vest;
    }
    return found;
  }

  return {
    async signupStart(body: unknown): Promise<CeremonyStarted> {
      const input = parse(SignupStartSchema, body);
      const handle = input.handle.normalize('NFKC');
      const handleIssue = handleProblem(handle);
      if (handleIssue) {
        fail('HANDLE_INVALID', 422, 'This handle can’t be used', handleIssue);
      }
      const displayName = cleanName(input.displayName);
      const nameIssue = nameProblem(displayName, 1, DISPLAY_NAME_MAX);
      if (nameIssue) fail('NAME_INVALID', 422, 'Check the name', nameIssue);
      const age = signupAge(
        input.birthYear,
        AGE_POLICIES[input.country],
        now(),
      );
      if (age === 'invalid') fail('AGE_INVALID', 422, 'Check the birth year');
      if (age === 'guardian-required') {
        fail('GUARDIAN_REQUIRED', 403, 'A guardian must create this account');
      }
      if (await repo.playerByHandleKey(handleKey(handle))) {
        fail('HANDLE_TAKEN', 409, 'This handle is taken');
      }
      const draft: SignupDraft = {
        playerId: newId(),
        handle,
        displayName,
        birthYear: input.birthYear,
        language: input.language,
        country: input.country,
      };
      const ceremony = await passkeys.registrationOptions({
        id: draft.playerId,
        handle,
        displayName,
        exclude: [],
      });
      const challengeId = await startCeremony(
        'signup',
        ceremony.challenge,
        draft,
      );
      return { challengeId, options: ceremony.options };
    },

    async signupFinish(body: unknown): Promise<SignedIn> {
      const input = parse(CeremonyFinishSchema, body);
      const row = await takeCeremony('signup', input);
      const draft = JSON.parse(row.data ?? 'null') as SignupDraft;
      const made = await passkeys.verifyRegistration(
        input.credential,
        row.challenge,
      );
      if (!made) fail('PASSKEY_FAILED', 401, 'The passkey wasn’t accepted');
      const at = now().toISOString();
      const player: PlayerRow = {
        id: draft.playerId,
        handle: draft.handle,
        handleKey: handleKey(draft.handle),
        displayName: draft.displayName,
        language: draft.language,
        country: draft.country,
        birthYear: draft.birthYear,
        minor:
          signupAge(draft.birthYear, AGE_POLICIES[draft.country], now()) ===
          'minor',
        badgeKey: toBase64Url(randomBytes(BADGE_KEY_BYTES)),
        createdAt: at,
      };
      if ((await repo.insertPlayer(player)) === 'handle-taken') {
        fail('HANDLE_TAKEN', 409, 'This handle was just taken');
      }
      await repo.insertPasskey({
        ...made,
        playerId: player.id,
        createdAt: at,
        lastUsedAt: at,
      });
      return signedIn(player);
    },

    async signinStart(): Promise<CeremonyStarted> {
      const ceremony = await passkeys.authenticationOptions();
      const challengeId = await startCeremony(
        'signin',
        ceremony.challenge,
        null,
      );
      return { challengeId, options: ceremony.options };
    },

    async signinFinish(body: unknown): Promise<SignedIn> {
      const input = parse(CeremonyFinishSchema, body);
      const row = await takeCeremony('signin', input);
      const stored = await repo.passkeyById(input.credential.id);
      if (!stored) fail('PASSKEY_FAILED', 401, 'This passkey isn’t known here');
      const counter = await passkeys.verifyAuthentication(
        input.credential,
        row.challenge,
        stored,
      );
      if (counter === null) {
        fail('PASSKEY_FAILED', 401, 'The passkey wasn’t accepted');
      }
      await repo.touchPasskey(stored.id, counter, now().toISOString());
      const player = await repo.playerById(stored.playerId);
      if (!player) fail('PASSKEY_FAILED', 401, 'This passkey isn’t known here');
      return signedIn(player);
    },

    async recoveryStart(body: unknown): Promise<CeremonyStarted> {
      const code = normalizeCode(parse(CodeSchema, body).code);
      if (!code) fail('CODE_INVALID', 422, 'This code isn’t valid');
      const hash = await hashCode('recovery', code);
      const recovery = await repo.recoveryByHash(hash);
      if (
        !recovery ||
        recovery.usedAt ||
        recovery.expiresAt <= now().toISOString()
      ) {
        fail('CODE_INVALID', 422, 'This code isn’t valid');
      }
      const player = await repo.playerById(recovery.playerId);
      if (!player) fail('CODE_INVALID', 422, 'This code isn’t valid');
      const existing = await repo.passkeysOf(player.id);
      const ceremony = await passkeys.registrationOptions({
        id: player.id,
        handle: player.handle,
        displayName: player.displayName,
        exclude: existing.map((p) => p.id),
      });
      const draft: RecoveryDraft = { playerId: player.id, hash: hash };
      const challengeId = await startCeremony(
        'recovery',
        ceremony.challenge,
        draft,
      );
      return { challengeId, options: ceremony.options };
    },

    async recoveryFinish(body: unknown): Promise<SignedIn> {
      const input = parse(CeremonyFinishSchema, body);
      const row = await takeCeremony('recovery', input);
      const draft = JSON.parse(row.data ?? 'null') as RecoveryDraft;
      const made = await passkeys.verifyRegistration(
        input.credential,
        row.challenge,
      );
      if (!made) fail('PASSKEY_FAILED', 401, 'The passkey wasn’t accepted');
      const at = now().toISOString();
      if (!(await repo.useRecovery(draft.hash, at))) {
        fail('CODE_INVALID', 422, 'This code was already used');
      }
      const player = await repo.playerById(draft.playerId);
      if (!player) fail('CODE_INVALID', 422, 'This code isn’t valid');
      await repo.insertPasskey({
        ...made,
        playerId: player.id,
        createdAt: at,
        lastUsedAt: at,
      });
      await repo.audit({
        at,
        venueId: null,
        actorId: player.id,
        action: 'recovery.used',
        subjectId: player.id,
      });
      return signedIn(player);
    },

    async me(token: string | null) {
      const player = await caller(token);
      return { player: await view(player), badgeKey: player.badgeKey };
    },

    async claimGuest(token: string | null, body: unknown): Promise<GuestView> {
      const player = await caller(token);
      const code = normalizeCode(parse(CodeSchema, body).code);
      const guest = code
        ? await repo.guestByClaimHash(await hashCode('guest-claim', code))
        : null;
      if (!guest || guest.claimedBy || guest.expiresAt <= now().toISOString()) {
        fail('CODE_INVALID', 422, 'This code isn’t valid');
      }
      // Stats are claimed after the game: while the guest wears gear, the
      // check-in can't move to a player who may be playing too.
      if (await repo.hasActiveCheckIn({ kind: 'guest', id: guest.id })) {
        fail('GUEST_PLAYING', 409, 'Claim after the game');
      }
      if (!(await repo.claimGuest(guest.id, player.id))) {
        fail('CODE_INVALID', 422, 'This code was already used');
      }
      return guestView({ ...guest, claimedBy: player.id });
    },

    async staffClaim(token: string | null, slug: string, body: unknown) {
      const player = await caller(token);
      const venue = await repo.venueBySlug(slug);
      if (!venue) fail('NOT_FOUND', 404, 'No such venue');
      const typed = parse(CodeSchema, body).code;
      // Hashes compared, so the time taken says nothing about the code.
      const matches =
        deps.bootstrapCode !== null &&
        deps.bootstrapCode.length >= 12 &&
        (await sha256Hex('barq-bootstrap', typed)) ===
          (await sha256Hex('barq-bootstrap', deps.bootstrapCode));
      if (!matches || (await repo.staffCount(venue.id)) > 0) {
        fail('FORBIDDEN', 403, 'This venue can’t be claimed');
      }
      const at = now().toISOString();
      await repo.addStaff({
        venueId: venue.id,
        playerId: player.id,
        role: 'manager',
        since: at,
      });
      await repo.audit({
        at,
        venueId: venue.id,
        actorId: player.id,
        action: 'staff.bootstrap',
        subjectId: player.id,
      });
      return view(player);
    },

    async venue(token: string | null, slug: string): Promise<VenueView> {
      const { venue } = await staffVenue(token, slug);
      const [maps, gear] = await Promise.all([
        repo.mapsOf(venue.id),
        repo.gearOf(venue.id),
      ]);
      return { venue, maps, gear };
    },

    async issueRecovery(
      token: string | null,
      slug: string,
      body: unknown,
    ): Promise<RecoveryIssued> {
      const { player: staff, venue } = await staffVenue(token, slug);
      const handle = parse(RecoveryIssueSchema, body).handle.replace(/^@/, '');
      const player = await repo.playerByHandleKey(handleKey(handle));
      if (!player) fail('NOT_FOUND', 404, 'No player with this handle');
      const code = newCode();
      const at = now();
      const expiresAt = new Date(at.getTime() + RECOVERY_MS).toISOString();
      await repo.insertRecovery({
        hash: await hashCode('recovery', code),
        playerId: player.id,
        venueId: venue.id,
        issuedBy: staff.id,
        expiresAt,
        usedAt: null,
      });
      await repo.audit({
        at: at.toISOString(),
        venueId: venue.id,
        actorId: staff.id,
        action: 'recovery.issued',
        subjectId: player.id,
      });
      return { code: formatCode(code), expiresAt };
    },

    async createGuest(
      token: string | null,
      slug: string,
      body: unknown,
    ): Promise<GuestCreated> {
      const { venue } = await staffVenue(token, slug);
      const nickname = cleanName(parse(GuestCreateSchema, body).nickname);
      const issue = nameProblem(nickname, NICKNAME_MIN, NICKNAME_MAX);
      if (issue) fail('NAME_INVALID', 422, 'Check the nickname', issue);
      const code = newCode();
      const created = now();
      const guest: GuestRow = {
        id: newId(),
        venueId: venue.id,
        nickname,
        claimHash: await hashCode('guest-claim', code),
        createdAt: created.toISOString(),
        expiresAt: guestExpiresAt(created).toISOString(),
        claimedBy: null,
      };
      await repo.insertGuest(guest);
      return { guest: guestView(guest), claimCode: formatCode(code) };
    },

    async openSession(
      token: string | null,
      slug: string,
      body: unknown,
    ): Promise<SessionView> {
      const { venue } = await staffVenue(token, slug);
      const { mapId } = parse(SessionOpenSchema, body);
      const maps = await repo.mapsOf(venue.id);
      if (!maps.some((m) => m.id === mapId)) {
        fail('NOT_FOUND', 404, 'No such map here');
      }
      const gear = await repo.gearOf(venue.id);
      const session: PlaySession = {
        id: newId(),
        venueId: venue.id,
        mapId,
        openedAt: now().toISOString(),
        closedAt: null,
        capacity: gear.filter((g) => g.kind === 'vest' && g.status === 'ready')
          .length,
      };
      await repo.insertSession(session);
      return sessionView(session);
    },

    async openSessions(token: string | null, slug: string) {
      const { venue } = await staffVenue(token, slug);
      const sessions = await repo.openSessionsOf(venue.id);
      return Promise.all(sessions.map(sessionView));
    },

    async session(token: string | null, id: string): Promise<SessionView> {
      const { session } = await staffSession(token, id);
      return sessionView(session);
    },

    async closeSession(token: string | null, id: string): Promise<SessionView> {
      const { session } = await staffSession(token, id);
      const at = now().toISOString();
      if (!session.closedAt) await repo.closeSession(session.id, at);
      return sessionView((await repo.sessionById(session.id)) ?? session);
    },

    async checkIn(
      token: string | null,
      sessionId: string,
      body: unknown,
    ): Promise<SessionView> {
      const { session } = await staffSession(token, sessionId);
      const input = parse(CheckInSchema, body);
      const wearer = await wearerFrom(input, session.venueId);
      const vest = vestFrom(input.gear, await repo.gearOf(session.venueId));
      const problem = checkInProblem(
        session,
        await repo.checkInsOf(session.id),
        wearer,
        vest,
      );
      if (problem) fail('CHECKIN_REFUSED', 409, 'Check-in refused', problem);
      const checkIn: CheckIn = {
        id: newId(),
        sessionId: session.id,
        wearer,
        vestId: vest.id,
        blasterId: vest.pairedWith,
        at: now().toISOString(),
        releasedAt: null,
      };
      if ((await repo.insertCheckIn(checkIn)) === 'conflict') {
        // Another phone took the vest or the wearer a moment ago.
        const again = checkInProblem(
          session,
          await repo.checkInsOf(session.id),
          wearer,
          vest,
        );
        fail(
          'CHECKIN_REFUSED',
          409,
          'Check-in refused',
          again ?? 'vest-in-use',
        );
      }
      return sessionView(session);
    },

    async release(
      token: string | null,
      checkInId: string,
    ): Promise<SessionView> {
      const checkIn = isId(checkInId)
        ? await repo.checkInById(checkInId)
        : null;
      if (!checkIn) fail('NOT_FOUND', 404, 'No such check-in');
      const { session } = await staffSession(token, checkIn.sessionId);
      await repo.releaseCheckIn(checkIn.id, now().toISOString());
      return sessionView(session);
    },

    /** The daily sweep: expired guests and abandoned ceremonies. */
    async sweep() {
      const at = now().toISOString();
      return {
        guests: await repo.deleteExpiredGuests(at),
        challenges: await repo.deleteChallengesBefore(at),
      };
    },
  };
}

export type LasertagService = ReturnType<typeof createService>;
