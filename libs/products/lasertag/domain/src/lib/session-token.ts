import { fromBase64Url, hmac, hmacVerify, isId, toBase64Url } from './crypto';

/**
 * A signed-in player's token: `b1.<playerId>.<expiry>.<sig>`, the expiry in
 * epoch seconds and `sig` the base64url HMAC-SHA-256 of the rest. The
 * server checks it with its secret and no lookup.
 */
export const SESSION_VERSION = 'b1';
export const MIN_TOKEN_SECRET_LENGTH = 32;
/** Signed in for 60 days, renewed in the last 15. */
export const SESSION_DAYS = 60;
export const SESSION_RENEW_DAYS = 15;

export interface SessionClaims {
  readonly playerId: string;
  readonly expiresAt: Date;
}

function checkSecret(secret: string): void {
  if (secret.length < MIN_TOKEN_SECRET_LENGTH) {
    throw new Error(
      `The token secret needs at least ${MIN_TOKEN_SECRET_LENGTH} characters`,
    );
  }
}

export async function signSession(
  secret: string,
  claims: SessionClaims,
): Promise<string> {
  checkSecret(secret);
  if (!isId(claims.playerId)) throw new Error('The player id must be a UUID');
  const expiry = Math.floor(claims.expiresAt.getTime() / 1000);
  const payload = `${SESSION_VERSION}.${claims.playerId}.${expiry}`;
  return `${payload}.${toBase64Url(await hmac(secret, payload))}`;
}

/** The token's claims when its signature holds and it hasn't expired. */
export async function verifySession(
  secret: string,
  token: string,
  now: Date,
): Promise<SessionClaims | null> {
  checkSecret(secret);
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== SESSION_VERSION) return null;
  const [version, playerId, expiryText, signatureText] = parts;
  if (!isId(playerId) || !/^\d{1,12}$/.test(expiryText)) return null;
  const signature = fromBase64Url(signatureText);
  if (!signature) return null;
  const valid = await hmacVerify(
    secret,
    `${version}.${playerId}.${expiryText}`,
    signature,
  );
  if (!valid) return null;
  const expiresAt = new Date(Number(expiryText) * 1000);
  return expiresAt.getTime() > now.getTime() ? { playerId, expiresAt } : null;
}

/** When a new session made `now` expires. */
export function sessionExpiry(now: Date): Date {
  return new Date(now.getTime() + SESSION_DAYS * 86_400_000);
}

/** True in the last days of a session, when the app should renew it. */
export function shouldRenew(claims: SessionClaims, now: Date): boolean {
  return (
    claims.expiresAt.getTime() - now.getTime() < SESSION_RENEW_DAYS * 86_400_000
  );
}
