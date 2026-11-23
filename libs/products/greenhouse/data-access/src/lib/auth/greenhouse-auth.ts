import { InjectionToken, inject, signal } from '@angular/core';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { type SignInError, signInErrorOf } from './sign-in-error';

/** The Supabase project an app talks to in standalone mode. */
export interface GreenhouseSupabaseConfig {
  url: string;
  /** The project's public anon key; row-level security does the guarding. */
  anonKey: string;
}

/**
 * Null (the default) means no server. The field app keeps entries on the
 * phone; the dashboard shows the demo farm.
 */
export const GREENHOUSE_SUPABASE =
  new InjectionToken<GreenhouseSupabaseConfig | null>('GREENHOUSE_SUPABASE', {
    providedIn: 'root',
    factory: () => null,
  });

export interface GreenhouseAccount {
  id: string;
  email: string;
}

function accountOf(session: Session | null): GreenhouseAccount | null {
  const user = session?.user;
  return user ? { id: user.id, email: user.email ?? '' } : null;
}

/** Why making an account failed, or that it needs its email confirmed. */
export type SignUpResult = SignInError | 'confirm-email' | null;

/**
 * A Supabase session kept in localStorage, so an app signed in once stays
 * signed in offline; the token refreshes itself whenever there is a
 * network. supabase-js is loaded only when the app has a server. Each app
 * keeps its session under its own key.
 */
export abstract class GreenhouseAuth {
  private readonly config = inject(GREENHOUSE_SUPABASE);
  private client: Promise<SupabaseClient> | null = null;

  protected abstract readonly storageKey: string;

  /** Whether this build talks to a server at all. */
  readonly enabled = this.config !== null;
  readonly account = signal<GreenhouseAccount | null>(null);

  getClient(): Promise<SupabaseClient> {
    const config = this.config;
    if (!config) throw new Error('No Supabase project is configured');
    this.client ??= import('@supabase/supabase-js').then(({ createClient }) => {
      const client = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storageKey: this.storageKey,
        },
      });
      client.auth.onAuthStateChange((_event, session) => {
        this.account.set(accountOf(session));
      });
      return client;
    });
    return this.client;
  }

  /** The stored session, if any. Needs no network. */
  async restore(): Promise<GreenhouseAccount | null> {
    const client = await this.getClient();
    const { data } = await client.auth.getSession();
    const account = accountOf(data.session);
    this.account.set(account);
    return account;
  }

  async signIn(email: string, password: string): Promise<SignInError | null> {
    try {
      const client = await this.getClient();
      const { data, error } = await client.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (error) return signInErrorOf(error);
      this.account.set(accountOf(data.session));
      return null;
    } catch (error) {
      return signInErrorOf(error as Error);
    }
  }

  /**
   * Makes an account. With email confirmation on (the hosted project),
   * there is no session until the person follows the link in their email.
   */
  async signUp(email: string, password: string): Promise<SignUpResult> {
    try {
      const client = await this.getClient();
      const { data, error } = await client.auth.signUp({
        email: email.trim(),
        password,
      });
      if (error) return signInErrorOf(error);
      if (!data.session) return 'confirm-email';
      this.account.set(accountOf(data.session));
      return null;
    } catch (error) {
      return signInErrorOf(error as Error);
    }
  }

  /** Signs out on this device only, which works offline too. */
  async signOut(): Promise<void> {
    const client = await this.getClient();
    await client.auth.signOut({ scope: 'local' });
    this.account.set(null);
  }
}
