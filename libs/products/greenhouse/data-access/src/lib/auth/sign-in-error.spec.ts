import { signInErrorOf } from './sign-in-error';

describe('signInErrorOf', () => {
  it('is null when sign-in worked', () => {
    expect(signInErrorOf(null)).toBeNull();
  });

  it('spots a missing network before anything else', () => {
    expect(
      signInErrorOf({
        name: 'AuthRetryableFetchError',
        message: 'Failed to fetch',
        status: 0,
      }),
    ).toBe('offline');
    expect(signInErrorOf({ message: 'TypeError: Load failed' })).toBe(
      'offline',
    );
  });

  it('tells wrong credentials from an unconfirmed email', () => {
    expect(
      signInErrorOf({
        status: 400,
        code: 'invalid_credentials',
        message: 'Invalid login credentials',
      }),
    ).toBe('invalid');
    expect(
      signInErrorOf({ status: 400, message: 'Invalid login credentials' }),
    ).toBe('invalid');
    expect(
      signInErrorOf({
        status: 400,
        code: 'email_not_confirmed',
        message: 'Email not confirmed',
      }),
    ).toBe('unconfirmed');
  });

  it('calls anything else a problem to retry later', () => {
    expect(signInErrorOf({ status: 500, message: 'Database error' })).toBe(
      'other',
    );
    expect(
      signInErrorOf({ status: 429, code: 'over_request_rate_limit' }),
    ).toBe('other');
  });
});
