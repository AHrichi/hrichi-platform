/**
 * Why a sign-in failed, in terms a supervisor can act on:
 * - `invalid`: wrong email or password;
 * - `unconfirmed`: the account's email was never confirmed;
 * - `offline`: no network (the first sign-in needs one);
 * - `other`: anything else; try again later.
 */
export type SignInError = 'invalid' | 'unconfirmed' | 'offline' | 'other';

/** The parts of a Supabase `AuthError` (or a thrown fetch error) we read. */
export interface AuthFailure {
  name?: string;
  message?: string;
  status?: number;
  code?: string;
}

export function signInErrorOf(error: AuthFailure | null): SignInError | null {
  if (!error) return null;
  const message = error.message ?? '';
  if (
    error.name === 'AuthRetryableFetchError' ||
    error.status === 0 ||
    /failed to fetch|networkerror|fetch failed|load failed/i.test(message)
  ) {
    return 'offline';
  }
  if (
    error.code === 'invalid_credentials' ||
    /invalid login credentials/i.test(message)
  ) {
    return 'invalid';
  }
  if (
    error.code === 'email_not_confirmed' ||
    /email not confirmed/i.test(message)
  ) {
    return 'unconfirmed';
  }
  return 'other';
}
