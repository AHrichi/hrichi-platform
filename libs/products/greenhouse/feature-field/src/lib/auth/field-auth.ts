import { Injectable, inject, signal } from '@angular/core';
import type { Session, SupabaseClient } from '@supabase/supabase-js';
import { GREENHOUSE_SUPABASE } from '../field-config';
import { type SignInError, signInErrorOf } from './sign-in-error';

export interface FieldAccount {
  id: string;
  email: string;
}

function accountOf(session: Session | null): FieldAccount | null {
  const user = session?.user;
  return user ? { id: user.id, email: user.email ?? '' } : null;
}

/**
 * The supervisor's Supabase session. supabase-js keeps it in localStorage,
 * so a phone signed in once stays signed in offline; the token refreshes
 * itself whenever there is a network. The client is loaded only when the
 * app has a server to talk to.
 */
@Injectable({ providedIn: 'root' })
export class FieldAuth {
  private readonly config = inject(GREENHOUSE_SUPABASE);
  private client: Promise<SupabaseClient> | null = null;

  /** Whether this build talks to a server at all. */
  readonly enabled = this.config !== null;
  readonly account = signal<FieldAccount | null>(null);

  getClient(): Promise<SupabaseClient> {
    const config = this.config;
    if (!config) throw new Error('No Supabase project is configured');
    this.client ??= import('@supabase/supabase-js').then(({ createClient }) => {
      const client = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false,
          storageKey: 'greenhouse-field-auth',
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
  async restore(): Promise<FieldAccount | null> {
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

  /** Signs out on this phone only, which works offline too. */
  async signOut(): Promise<void> {
    const client = await this.getClient();
    await client.auth.signOut({ scope: 'local' });
    this.account.set(null);
  }
}
