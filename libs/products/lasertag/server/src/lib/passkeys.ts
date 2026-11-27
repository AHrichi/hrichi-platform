import {
  generateAuthenticationOptions,
  generateRegistrationOptions,
  verifyAuthenticationResponse,
  verifyRegistrationResponse,
} from '@simplewebauthn/server';
import { fromBase64Url, toBase64Url } from '@ah/products/lasertag/domain';

/** A passkey as the store keeps it. */
export interface StoredPasskey {
  readonly id: string;
  readonly publicKey: string;
  readonly counter: number;
  readonly transports: readonly string[];
}

export interface Ceremony {
  /** Sent to the browser as is. */
  readonly options: Record<string, unknown>;
  /** Kept on the server until the browser answers. */
  readonly challenge: string;
}

/**
 * The WebAuthn checks, behind a port so the service's tests can run without
 * a browser. The real one is `simpleWebAuthnPasskeys`.
 */
export interface PasskeyVerifier {
  registrationOptions(user: {
    readonly id: string;
    readonly handle: string;
    readonly displayName: string;
    readonly exclude: readonly string[];
  }): Promise<Ceremony>;
  verifyRegistration(
    credential: unknown,
    challenge: string,
  ): Promise<StoredPasskey | null>;
  authenticationOptions(): Promise<Ceremony>;
  /** The new signature counter, or null if the answer doesn't hold. */
  verifyAuthentication(
    credential: unknown,
    challenge: string,
    stored: StoredPasskey,
  ): Promise<number | null>;
}

export interface RelyingParty {
  /** The site's domain, e.g. `barq.example` or `localhost`. */
  readonly id: string;
  readonly name: string;
  /** Pages that may run the ceremony, exact origins. */
  readonly origins: readonly string[];
}

const TIMEOUT_MS = 120_000;

/**
 * Passkeys through `@simplewebauthn/server` (MIT), which runs on Workers.
 * Discoverable credentials (the phone offers the right account itself) and
 * no attestation: we need a key, not the maker of the authenticator.
 */
export function simpleWebAuthnPasskeys(rp: RelyingParty): PasskeyVerifier {
  const origins = [...rp.origins];
  return {
    async registrationOptions(user) {
      const options = await generateRegistrationOptions({
        rpName: rp.name,
        rpID: rp.id,
        userName: user.handle,
        userDisplayName: user.displayName,
        userID: new TextEncoder().encode(user.id),
        timeout: TIMEOUT_MS,
        attestationType: 'none',
        excludeCredentials: user.exclude.map((id) => ({ id })),
        authenticatorSelection: {
          residentKey: 'required',
          userVerification: 'preferred',
        },
      });
      return {
        options: options as unknown as Record<string, unknown>,
        challenge: options.challenge,
      };
    },

    async verifyRegistration(credential, challenge) {
      try {
        const result = await verifyRegistrationResponse({
          response: credential as Parameters<
            typeof verifyRegistrationResponse
          >[0]['response'],
          expectedChallenge: challenge,
          expectedOrigin: origins,
          expectedRPID: rp.id,
          requireUserVerification: false,
        });
        if (!result.verified) return null;
        const { credential: made } = result.registrationInfo;
        return {
          id: made.id,
          publicKey: toBase64Url(made.publicKey),
          counter: made.counter,
          transports: made.transports ?? [],
        };
      } catch {
        return null;
      }
    },

    async authenticationOptions() {
      const options = await generateAuthenticationOptions({
        rpID: rp.id,
        timeout: TIMEOUT_MS,
        userVerification: 'preferred',
      });
      return {
        options: options as unknown as Record<string, unknown>,
        challenge: options.challenge,
      };
    },

    async verifyAuthentication(credential, challenge, stored) {
      const publicKey = fromBase64Url(stored.publicKey);
      if (!publicKey) return null;
      try {
        const result = await verifyAuthenticationResponse({
          response: credential as Parameters<
            typeof verifyAuthenticationResponse
          >[0]['response'],
          expectedChallenge: challenge,
          expectedOrigin: origins,
          expectedRPID: rp.id,
          requireUserVerification: false,
          credential: {
            id: stored.id,
            publicKey,
            counter: stored.counter,
            transports: stored.transports as never,
          },
        });
        return result.verified ? result.authenticationInfo.newCounter : null;
      } catch {
        return null;
      }
    },
  };
}
