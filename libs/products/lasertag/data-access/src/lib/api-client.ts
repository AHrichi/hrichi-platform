import {
  type Answer,
  type CeremonyStarted,
  type CheckInBody,
  type ErrorCode,
  type ErrorDetail,
  type GuestCreated,
  type GuestView,
  type PlayerView,
  type RecoveryIssued,
  ROUTES,
  type SessionView,
  type SignedIn,
  type SignupStart,
  type VenueView,
} from '@ah/products/lasertag/domain';

/** Why a call failed: the server's code, or that it couldn't be reached. */
export type ApiErrorCode = ErrorCode | 'OFFLINE';

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    readonly status: number,
    message: string,
    readonly detail?: ErrorDetail,
    readonly retryAfterSec?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiOptions {
  /** `lasertagUrl` from site-config.json; null when the service is off. */
  readonly baseUrl: string | null;
  /** The signed-in player's token, read at each call. */
  readonly token?: () => string | null;
  readonly fetch?: typeof fetch;
  /** A call that hangs this long counts as offline. */
  readonly timeoutMs?: number;
}

/** BARQ's API, one method per route of `lasertag-edge`. */
export class LasertagApi {
  private readonly fetcher: typeof fetch;

  constructor(private readonly options: ApiOptions) {
    this.fetcher = options.fetch ?? globalThis.fetch.bind(globalThis);
  }

  get available(): boolean {
    return this.options.baseUrl !== null;
  }

  private async call<T>(
    method: string,
    path: string,
    body?: unknown,
  ): Promise<T> {
    const base = this.options.baseUrl;
    if (!base) throw new ApiError('UNAVAILABLE', 0, 'BARQ’s service is off');
    const token = this.options.token?.() ?? null;
    const controller = new AbortController();
    const timer = setTimeout(
      () => controller.abort(),
      this.options.timeoutMs ?? 15_000,
    );
    let response: Response;
    try {
      response = await this.fetcher(`${base.replace(/\/+$/, '')}${path}`, {
        method,
        signal: controller.signal,
        headers: {
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
      });
    } catch {
      throw new ApiError('OFFLINE', 0, 'BARQ can’t be reached');
    } finally {
      clearTimeout(timer);
    }
    let answer: Answer<T>;
    try {
      answer = (await response.json()) as Answer<T>;
    } catch {
      throw new ApiError('UNAVAILABLE', response.status, 'Unexpected answer');
    }
    if (answer.ok) return answer.data;
    throw new ApiError(
      answer.code,
      response.status,
      answer.message,
      answer.detail,
      answer.retryAfterSec,
    );
  }

  signupStart(body: SignupStart) {
    return this.call<CeremonyStarted>('POST', ROUTES.signupStart, body);
  }
  signupFinish(challengeId: string, credential: unknown) {
    return this.call<SignedIn>('POST', ROUTES.signupFinish, {
      challengeId,
      credential,
    });
  }
  signinStart() {
    return this.call<CeremonyStarted>('POST', ROUTES.signinStart, {});
  }
  signinFinish(challengeId: string, credential: unknown) {
    return this.call<SignedIn>('POST', ROUTES.signinFinish, {
      challengeId,
      credential,
    });
  }
  recoveryStart(code: string) {
    return this.call<CeremonyStarted>('POST', ROUTES.recoveryStart, { code });
  }
  recoveryFinish(challengeId: string, credential: unknown) {
    return this.call<SignedIn>('POST', ROUTES.recoveryFinish, {
      challengeId,
      credential,
    });
  }
  me() {
    return this.call<{ player: PlayerView; badgeKey: string }>(
      'GET',
      ROUTES.me,
    );
  }
  claimGuest(code: string) {
    return this.call<GuestView>('POST', ROUTES.claimGuest, { code });
  }
  staffClaim(venue: string, code: string) {
    return this.call<PlayerView>('POST', ROUTES.staffClaim(venue), { code });
  }
  venue(venue: string) {
    return this.call<VenueView>('GET', ROUTES.venue(venue));
  }
  issueRecovery(venue: string, handle: string) {
    return this.call<RecoveryIssued>('POST', ROUTES.recoveryIssue(venue), {
      handle,
    });
  }
  createGuest(venue: string, nickname: string) {
    return this.call<GuestCreated>('POST', ROUTES.guests(venue), { nickname });
  }
  openSessions(venue: string) {
    return this.call<SessionView[]>('GET', ROUTES.sessions(venue));
  }
  openSession(venue: string, mapId: string) {
    return this.call<SessionView>('POST', ROUTES.sessions(venue), { mapId });
  }
  session(id: string) {
    return this.call<SessionView>('GET', ROUTES.session(id));
  }
  closeSession(id: string) {
    return this.call<SessionView>('POST', ROUTES.sessionClose(id), {});
  }
  checkIn(sessionId: string, body: CheckInBody) {
    return this.call<SessionView>('POST', ROUTES.checkIns(sessionId), body);
  }
  release(checkInId: string) {
    return this.call<SessionView>('DELETE', ROUTES.checkIn(checkInId));
  }
}
