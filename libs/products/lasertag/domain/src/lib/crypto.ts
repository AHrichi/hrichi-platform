/**
 * The few cryptographic helpers BARQ needs, on Web Crypto only, which
 * browsers, Node and Workers all have: base64url, HMAC-SHA-256, SHA-256 and
 * secure random bytes.
 */
const encoder = new TextEncoder();

export function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  const view = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let binary = '';
  for (const byte of view) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

export function fromBase64Url(text: string): Uint8Array<ArrayBuffer> | null {
  if (!/^[A-Za-z0-9_-]*$/.test(text)) return null;
  try {
    const binary = atob(text.replaceAll('-', '+').replaceAll('_', '/'));
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return bytes;
  } catch {
    return null;
  }
}

export function randomBytes(length: number): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function hmacKey(
  key: string | Uint8Array<ArrayBuffer>,
  usages: KeyUsage[],
): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    typeof key === 'string' ? encoder.encode(key) : key,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    usages,
  );
}

/** HMAC-SHA-256 of `message` under `key`. */
export async function hmac(
  key: string | Uint8Array<ArrayBuffer>,
  message: string,
): Promise<Uint8Array<ArrayBuffer>> {
  const signature = await crypto.subtle.sign(
    'HMAC',
    await hmacKey(key, ['sign']),
    encoder.encode(message),
  );
  return new Uint8Array(signature);
}

/** Checks an HMAC in constant time (Web Crypto's verify does). */
export async function hmacVerify(
  key: string | Uint8Array<ArrayBuffer>,
  message: string,
  signature: Uint8Array<ArrayBuffer>,
): Promise<boolean> {
  return crypto.subtle.verify(
    'HMAC',
    await hmacKey(key, ['verify']),
    signature,
    encoder.encode(message),
  );
}

/** SHA-256 in hex, with a label so one hash can't stand in for another. */
export async function sha256Hex(label: string, value: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    encoder.encode(`${label}:${value}`),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Every BARQ id is a UUID made on the device or the server. */
export function newId(): string {
  return crypto.randomUUID();
}

export function isId(value: unknown): value is string {
  return typeof value === 'string' && UUID.test(value);
}
