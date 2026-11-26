/**
 * A device's token (ADR-0032): `s1.<spaceId>.<deviceId>.<expiry>.<sig>`,
 * the expiry in epoch seconds and `sig` the base64url HMAC-SHA-256 of the
 * rest. The server checks it with its secret and no lookup; revoking a
 * device is a flag the server checks too. Only Web Crypto is used, which
 * browsers, Node and Workers all have.
 */
export const SYNC_TOKEN_VERSION = 's1';
export const MIN_SYNC_SECRET_LENGTH = 32;

export interface SyncTokenClaims {
  readonly spaceId: string;
  readonly deviceId: string;
  readonly expiresAt: Date;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const encoder = new TextEncoder();

function toBase64Url(bytes: ArrayBuffer): string {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]+$/.test(text)) return null;
  try {
    const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

function hmacKey(secret: string): Promise<CryptoKey> {
  if (secret.length < MIN_SYNC_SECRET_LENGTH) {
    throw new Error(
      `The sync token secret needs at least ${MIN_SYNC_SECRET_LENGTH} characters`,
    );
  }
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
}

export async function signSyncToken(
  secret: string,
  claims: SyncTokenClaims,
): Promise<string> {
  if (!UUID.test(claims.spaceId) || !UUID.test(claims.deviceId)) {
    throw new Error('The space and device ids must be UUIDs');
  }
  const expiry = Math.floor(claims.expiresAt.getTime() / 1000);
  const payload = `${SYNC_TOKEN_VERSION}.${claims.spaceId}.${claims.deviceId}.${expiry}`;
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(secret),
    encoder.encode(payload),
  );
  return `${payload}.${toBase64Url(signature)}`;
}

/** The token's claims when its signature holds and it hasn't expired. */
export async function verifySyncToken(
  secret: string,
  token: string,
  now: Date,
): Promise<SyncTokenClaims | null> {
  const parts = token.split('.');
  if (parts.length !== 5 || parts[0] !== SYNC_TOKEN_VERSION) return null;
  const [version, spaceId, deviceId, expiryText, signatureText] = parts;
  if (!UUID.test(spaceId) || !UUID.test(deviceId)) return null;
  if (!/^\d{1,12}$/.test(expiryText)) return null;
  const signature = fromBase64Url(signatureText);
  if (!signature) return null;
  // subtle.verify compares in constant time.
  const valid = await crypto.subtle.verify(
    'HMAC',
    await hmacKey(secret),
    signature,
    encoder.encode(`${version}.${spaceId}.${deviceId}.${expiryText}`),
  );
  if (!valid) return null;
  const expiresAt = new Date(Number(expiryText) * 1000);
  return expiresAt.getTime() > now.getTime()
    ? { spaceId, deviceId, expiresAt }
    : null;
}
