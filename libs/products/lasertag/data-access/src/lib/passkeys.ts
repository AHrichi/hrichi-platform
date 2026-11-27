import {
  browserSupportsWebAuthn,
  startAuthentication,
  startRegistration,
} from '@simplewebauthn/browser';

export type PasskeyFailure = 'unsupported' | 'cancelled' | 'failed';

export class PasskeyError extends Error {
  constructor(readonly reason: PasskeyFailure) {
    super(`Passkey ${reason}`);
    this.name = 'PasskeyError';
  }
}

/**
 * The browser's side of a passkey: make one, or use one. Behind an interface
 * so screens can be tested without a real authenticator.
 */
export interface PasskeyDevice {
  supported(): boolean;
  create(options: Record<string, unknown>): Promise<unknown>;
  get(options: Record<string, unknown>): Promise<unknown>;
}

/** The user closed the browser's dialog, or the time ran out. */
function reasonOf(error: unknown): PasskeyFailure {
  const name = error instanceof Error ? error.name : '';
  return name === 'NotAllowedError' || name === 'AbortError'
    ? 'cancelled'
    : 'failed';
}

export const browserPasskeys: PasskeyDevice = {
  supported: () => browserSupportsWebAuthn(),
  async create(options) {
    if (!browserSupportsWebAuthn()) throw new PasskeyError('unsupported');
    try {
      return await startRegistration({
        optionsJSON: options as unknown as Parameters<
          typeof startRegistration
        >[0]['optionsJSON'],
      });
    } catch (error) {
      throw new PasskeyError(reasonOf(error));
    }
  },
  async get(options) {
    if (!browserSupportsWebAuthn()) throw new PasskeyError('unsupported');
    try {
      return await startAuthentication({
        optionsJSON: options as unknown as Parameters<
          typeof startAuthentication
        >[0]['optionsJSON'],
      });
    } catch (error) {
      throw new PasskeyError(reasonOf(error));
    }
  },
};
