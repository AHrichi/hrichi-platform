import {
  computed,
  inject,
  Injectable,
  InjectionToken,
  signal,
} from '@angular/core';
import {
  ApiError,
  browserPasskeys,
  clearSession,
  type KeyValueStore,
  LasertagApi,
  loadSession,
  type PasskeyDevice,
  PasskeyError,
  saveSession,
  type StoredSession,
} from '@ah/products/lasertag/data-access';
import type {
  ErrorDetail,
  GuestView,
  SignedIn,
  SignupStart,
} from '@ah/products/lasertag/domain';
import { SiteConfigService } from '@ah/shared/site-config';

/** The browser's passkeys; tests provide a fake. */
export const PASSKEYS = new InjectionToken<PasskeyDevice>('BARQ passkeys', {
  providedIn: 'root',
  factory: () => browserPasskeys,
});

/** Where the session is kept; `localStorage` when there is one. */
export const SESSION_STORAGE = new InjectionToken<KeyValueStore>(
  'BARQ session storage',
  {
    providedIn: 'root',
    factory: () => {
      try {
        if (globalThis.localStorage) return globalThis.localStorage;
      } catch {
        // Blocked storage: keep the session for this visit only.
      }
      const memory = new Map<string, string>();
      return {
        getItem: (key) => memory.get(key) ?? null,
        setItem: (key, value) => void memory.set(key, value),
        removeItem: (key) => void memory.delete(key),
      };
    },
  },
);

/** A failure as the screens show it: a copy key and, maybe, a detail. */
export interface Problem {
  readonly code: string;
  readonly detail?: ErrorDetail;
}

export function problemOf(error: unknown): Problem {
  if (error instanceof ApiError) {
    return {
      code: error.code,
      ...(error.detail ? { detail: error.detail } : {}),
    };
  }
  if (error instanceof PasskeyError) return { code: error.reason };
  return { code: 'generic' };
}

/**
 * The signed-in player on this device: sign-up, sign-in and recovery with a
 * passkey, then the session and badge key kept locally, so the badge works
 * offline. Every call to the server goes through `api()`.
 */
@Injectable({ providedIn: 'root' })
export class BarqSession {
  private readonly config = inject(SiteConfigService);
  private readonly passkeys = inject(PASSKEYS);
  private readonly storage = inject(SESSION_STORAGE);

  readonly session = signal<StoredSession | null>(loadSession(this.storage));
  readonly player = computed(() => this.session()?.player ?? null);
  readonly staffVenues = computed(() => this.player()?.staff ?? []);
  readonly passkeysSupported = this.passkeys.supported();
  /** False when site-config.json names no BARQ service. */
  readonly serviceOn = signal(true);

  private apiPromise?: Promise<LasertagApi>;

  api(): Promise<LasertagApi> {
    this.apiPromise ??= this.config.load().then((config) => {
      this.serviceOn.set(config.lasertagUrl !== null);
      return new LasertagApi({
        baseUrl: config.lasertagUrl,
        token: () => this.session()?.token ?? null,
      });
    });
    return this.apiPromise;
  }

  private keep(signed: SignedIn): void {
    this.session.set(saveSession(this.storage, signed));
  }

  async signUp(input: SignupStart): Promise<void> {
    const api = await this.api();
    const started = await api.signupStart(input);
    const credential = await this.passkeys.create(started.options);
    this.keep(await api.signupFinish(started.challengeId, credential));
  }

  async signIn(): Promise<void> {
    const api = await this.api();
    const started = await api.signinStart();
    const credential = await this.passkeys.get(started.options);
    this.keep(await api.signinFinish(started.challengeId, credential));
  }

  async recover(code: string): Promise<void> {
    const api = await this.api();
    const started = await api.recoveryStart(code);
    const credential = await this.passkeys.create(started.options);
    this.keep(await api.recoveryFinish(started.challengeId, credential));
  }

  /** The player and their staff roles, fresh from the server. */
  async refresh(): Promise<void> {
    const current = this.session();
    if (!current) return;
    try {
      const me = await (await this.api()).me();
      this.session.set(
        saveSession(this.storage, {
          ...current,
          player: me.player,
          badgeKey: me.badgeKey,
        }),
      );
    } catch (error) {
      // A session the server no longer accepts ends here; offline keeps it.
      if (error instanceof ApiError && error.code === 'UNAUTHORIZED') {
        this.signOut();
      }
    }
  }

  async claimGuest(code: string): Promise<GuestView> {
    return (await this.api()).claimGuest(code);
  }

  signOut(): void {
    clearSession(this.storage);
    this.session.set(null);
  }
}
