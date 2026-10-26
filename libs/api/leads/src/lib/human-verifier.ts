export const HUMAN_VERIFIER = Symbol('HUMAN_VERIFIER');

export type Verification = 'passed' | 'failed' | 'unavailable';

export interface HumanVerifier {
  verify(token: string, ip?: string): Promise<Verification>;
}

/**
 * Cloudflare Turnstile. An explicit "not human" verdict rejects the lead; if
 * Cloudflare can't be reached the lead is kept and flagged instead, because a
 * lost lead costs more than an occasional unverified one.
 */
export class TurnstileVerifier implements HumanVerifier {
  constructor(
    private readonly secret: string,
    private readonly fetchFn: typeof fetch = fetch,
  ) {}

  async verify(token: string, ip?: string): Promise<Verification> {
    const body = new URLSearchParams({ secret: this.secret, response: token });
    if (ip) {
      body.set('remoteip', ip);
    }
    try {
      const response = await this.fetchFn(
        'https://challenges.cloudflare.com/turnstile/v0/siteverify',
        { method: 'POST', body, signal: AbortSignal.timeout(5000) },
      );
      if (!response.ok) {
        return 'unavailable';
      }
      const result = (await response.json()) as { success?: boolean };
      return result.success === true ? 'passed' : 'failed';
    } catch {
      return 'unavailable';
    }
  }
}
