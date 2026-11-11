/**
 * Device tokens (design §11): `v1.<deviceId>.<expiry in epoch seconds>.<sig>`,
 * where `sig` is base64url HMAC-SHA-256 over the first three parts.
 *
 * They are stateless, so Nest and the edge Worker can both check one with
 * the shared secret and no database. Revocation is a separate list. Only
 * Web Crypto is used, which Node, browsers and Workers all provide.
 */
export const TOKEN_VERSION = 'v1';
export const MIN_SECRET_LENGTH = 32;

export interface DeviceTokenClaims {
  deviceId: string;
  expiresAt: Date;
}

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
  if (secret.length < MIN_SECRET_LENGTH) {
    throw new Error(
      `The device-token secret needs at least ${MIN_SECRET_LENGTH} characters`,
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

export async function signDeviceToken(
  secret: string,
  claims: DeviceTokenClaims,
): Promise<string> {
  if (!/^[0-9a-f-]{36}$/i.test(claims.deviceId)) {
    throw new Error('The device id must be a UUID');
  }
  const expiry = Math.floor(claims.expiresAt.getTime() / 1000);
  const payload = `${TOKEN_VERSION}.${claims.deviceId}.${expiry}`;
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(secret),
    encoder.encode(payload),
  );
  return `${payload}.${toBase64Url(signature)}`;
}

/** The token's claims when its signature holds and it hasn't expired. */
export async function verifyDeviceToken(
  secret: string,
  token: string,
  now: Date,
): Promise<DeviceTokenClaims | null> {
  const parts = token.split('.');
  if (parts.length !== 4 || parts[0] !== TOKEN_VERSION) return null;
  const [version, deviceId, expiryText, signatureText] = parts;
  if (!/^\d{1,12}$/.test(expiryText)) return null;
  const signature = fromBase64Url(signatureText);
  if (!signature) return null;
  // subtle.verify compares in constant time.
  const valid = await crypto.subtle.verify(
    'HMAC',
    await hmacKey(secret),
    signature,
    encoder.encode(`${version}.${deviceId}.${expiryText}`),
  );
  if (!valid) return null;
  const expiresAt = new Date(Number(expiryText) * 1000);
  return expiresAt.getTime() > now.getTime() ? { deviceId, expiresAt } : null;
}
