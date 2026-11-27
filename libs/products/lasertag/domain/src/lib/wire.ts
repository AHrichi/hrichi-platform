import * as v from 'valibot';
import type { CheckInProblem, PlaySession, Wearer } from './checkin';
import type { NameProblem } from './players';
import type { ArenaMap, Gear, Lang, Venue } from './venue';

/**
 * What the app and `lasertag-edge` say to each other. Every body is JSON
 * under `BODY_LIMIT_BYTES`; every answer is `{ ok: true, data }` or
 * `{ ok: false, code, message, detail? }`. The schemas check shape only;
 * the service checks meaning (handles, ages, codes).
 */
export const BODY_LIMIT_BYTES = 32 * 1024;

const shortText = (max: number) => v.pipe(v.string(), v.maxLength(max));
const LangSchema = v.picklist(['ar', 'fr', 'en']);

export const SignupStartSchema = v.object({
  handle: shortText(80),
  displayName: shortText(120),
  birthYear: v.pipe(v.number(), v.integer()),
  language: LangSchema,
  country: v.picklist(['TN']),
});
export type SignupStart = v.InferOutput<typeof SignupStartSchema>;

/** A WebAuthn response as `@simplewebauthn/browser` returns it. */
const CredentialSchema = v.looseObject({
  id: shortText(1024),
  rawId: shortText(1024),
  type: v.literal('public-key'),
  response: v.looseObject({}),
});

export const CeremonyFinishSchema = v.object({
  challengeId: shortText(64),
  credential: CredentialSchema,
});
export type CeremonyFinish = v.InferOutput<typeof CeremonyFinishSchema>;

export const CodeSchema = v.object({ code: shortText(40) });
export type CodeBody = v.InferOutput<typeof CodeSchema>;

export const RecoveryIssueSchema = v.object({ handle: shortText(80) });
export const GuestCreateSchema = v.object({ nickname: shortText(80) });
export const SessionOpenSchema = v.object({ mapId: shortText(64) });

/** A check-in names the wearer by badge scan or guest id, and the vest. */
export const CheckInSchema = v.object({
  badge: v.optional(shortText(200)),
  guestId: v.optional(shortText(64)),
  gear: shortText(200),
});
export type CheckInBody = v.InferOutput<typeof CheckInSchema>;

export type ErrorCode =
  | 'BAD_REQUEST'
  | 'TOO_LARGE'
  | 'FORBIDDEN_ORIGIN'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'UNAVAILABLE'
  | 'HANDLE_INVALID'
  | 'HANDLE_TAKEN'
  | 'NAME_INVALID'
  | 'AGE_INVALID'
  | 'GUARDIAN_REQUIRED'
  | 'CHALLENGE_EXPIRED'
  | 'PASSKEY_FAILED'
  | 'BADGE_INVALID'
  | 'CODE_INVALID'
  | 'GEAR_UNKNOWN'
  | 'CHECKIN_REFUSED';

export type ErrorDetail = NameProblem | CheckInProblem;

export interface Failure {
  readonly ok: false;
  readonly code: ErrorCode;
  readonly message: string;
  readonly detail?: ErrorDetail;
  readonly retryAfterSec?: number;
}
export interface Success<T> {
  readonly ok: true;
  readonly data: T;
}
export type Answer<T> = Success<T> | Failure;

export type StaffRole = 'manager' | 'game-master';

export interface PlayerView {
  readonly id: string;
  readonly handle: string;
  readonly displayName: string;
  readonly language: Lang;
  readonly minor: boolean;
  readonly createdAt: string;
  readonly staff: readonly {
    readonly venue: string;
    readonly role: StaffRole;
  }[];
}

export interface SignedIn {
  readonly token: string;
  readonly expiresAt: string;
  readonly player: PlayerView;
  /** The badge key (base64url): the device makes the rotating QR with it. */
  readonly badgeKey: string;
}

/** The start of a passkey ceremony: options for the browser, and its id. */
export interface CeremonyStarted {
  readonly challengeId: string;
  /** `PublicKeyCredentialCreationOptionsJSON` or `…RequestOptionsJSON`. */
  readonly options: Record<string, unknown>;
}

export interface GuestView {
  readonly id: string;
  readonly nickname: string;
  readonly expiresAt: string;
  readonly claimedBy: string | null;
}

export interface GuestCreated {
  readonly guest: GuestView;
  /** Shown once, on screen or paper: `4K7Q9-XMD2B`. */
  readonly claimCode: string;
}

export interface RecoveryIssued {
  readonly code: string;
  readonly expiresAt: string;
}

export interface VenueView {
  readonly venue: Venue;
  readonly maps: readonly ArenaMap[];
  readonly gear: readonly Gear[];
}

export interface RosterEntry {
  readonly checkInId: string;
  readonly wearer: Wearer;
  /** The handle, or the guest's nickname. */
  readonly name: string;
  readonly vest: string;
  readonly blaster: string | null;
  readonly at: string;
}

export interface SessionView {
  readonly session: PlaySession;
  readonly roster: readonly RosterEntry[];
}

/** The routes, so the app and the Worker can't drift apart. */
export const ROUTES = {
  health: '/health',
  signupStart: '/v1/signup/start',
  signupFinish: '/v1/signup/finish',
  signinStart: '/v1/signin/start',
  signinFinish: '/v1/signin/finish',
  recoveryStart: '/v1/recovery/start',
  recoveryFinish: '/v1/recovery/finish',
  me: '/v1/me',
  claimGuest: '/v1/me/claim',
  /** `/v1/venues/:slug…` */
  venue: (slug: string) => `/v1/venues/${encodeURIComponent(slug)}`,
  staffClaim: (slug: string) =>
    `/v1/venues/${encodeURIComponent(slug)}/staff-claim`,
  recoveryIssue: (slug: string) =>
    `/v1/venues/${encodeURIComponent(slug)}/recovery`,
  guests: (slug: string) => `/v1/venues/${encodeURIComponent(slug)}/guests`,
  sessions: (slug: string) => `/v1/venues/${encodeURIComponent(slug)}/sessions`,
  session: (id: string) => `/v1/sessions/${encodeURIComponent(id)}`,
  sessionClose: (id: string) => `/v1/sessions/${encodeURIComponent(id)}/close`,
  checkIns: (id: string) => `/v1/sessions/${encodeURIComponent(id)}/checkins`,
  checkIn: (id: string) => `/v1/checkins/${encodeURIComponent(id)}`,
} as const;

/** The first venue: the warehouse the owner will rent (ADR-0033). */
export const FIRST_VENUE_SLUG = 'barq-warehouse';
