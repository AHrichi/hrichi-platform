/**
 * Web Push from a Worker, with Web Crypto only (no Node `web-push`):
 *
 * - VAPID (RFC 8292): an ES256 JWT for the push service's origin, signed
 *   with the Worker's private key, sent with its public key.
 * - Message encryption (RFC 8291, `aes128gcm` from RFC 8188): an ephemeral
 *   ECDH key, HKDF from the subscription's `auth` secret, one record.
 *
 * Keys are base64url: the public key is the raw uncompressed P-256 point
 * (65 bytes, what `PushManager.subscribe` takes as `applicationServerKey`),
 * the private key its 32-byte scalar `d`.
 */

export interface VapidKeys {
  publicKey: string;
  privateKey: string;
  /** A `mailto:` or `https:` contact for the push service. */
  subject: string;
}

export interface PushTarget {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

export type PushResult =
  | { ok: true }
  /** The subscription is gone (404/410): forget it. */
  | { ok: false; gone: true; status: number }
  | { ok: false; gone: false; status: number };

type Fetch = typeof fetch;
type Bytes = Uint8Array<ArrayBuffer>;

const encoder = new TextEncoder();

export function toBase64Url(bytes: ArrayBuffer | Uint8Array): string {
  let binary = '';
  for (const byte of new Uint8Array(bytes)) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/, '');
}

export function fromBase64Url(text: string): Bytes {
  const base64 = text
    .replaceAll('-', '+')
    .replaceAll('_', '/')
    .replace(/=+$/, '');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function concat(...parts: Uint8Array[]): Bytes {
  const out = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    out.set(part, offset);
    offset += part.length;
  }
  return out;
}

async function hmac(key: Uint8Array, data: Uint8Array): Promise<Bytes> {
  const imported = await crypto.subtle.importKey(
    'raw',
    key as Bytes,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  return new Uint8Array(
    await crypto.subtle.sign('HMAC', imported, data as Bytes),
  );
}

/** HKDF with one block of output (≤ 32 bytes), all RFC 8291 needs. */
async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Bytes> {
  const prk = await hmac(salt, ikm);
  const okm = await hmac(prk, concat(info, new Uint8Array([1])));
  return okm.slice(0, length);
}

function vapidPrivateKey(keys: VapidKeys): Promise<CryptoKey> {
  const point = fromBase64Url(keys.publicKey);
  if (point.length !== 65 || point[0] !== 4) {
    throw new Error('The VAPID public key must be an uncompressed P-256 point');
  }
  return crypto.subtle.importKey(
    'jwk',
    {
      kty: 'EC',
      crv: 'P-256',
      d: keys.privateKey,
      x: toBase64Url(point.slice(1, 33)),
      y: toBase64Url(point.slice(33, 65)),
      ext: true,
    },
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign'],
  );
}

/** The `Authorization: vapid t=…, k=…` header for one endpoint. */
export async function vapidAuthorization(
  endpoint: string,
  keys: VapidKeys,
  now: Date,
): Promise<string> {
  const header = toBase64Url(
    encoder.encode(JSON.stringify({ typ: 'JWT', alg: 'ES256' })),
  );
  const claims = toBase64Url(
    encoder.encode(
      JSON.stringify({
        aud: new URL(endpoint).origin,
        // Push services accept at most 24 hours.
        exp: Math.floor(now.getTime() / 1000) + 12 * 60 * 60,
        sub: keys.subject,
      }),
    ),
  );
  const unsigned = `${header}.${claims}`;
  // Web Crypto's ECDSA signature is already r‖s, the form JWS wants.
  const signature = await crypto.subtle.sign(
    { name: 'ECDSA', hash: 'SHA-256' },
    await vapidPrivateKey(keys),
    encoder.encode(unsigned),
  );
  return `vapid t=${unsigned}.${toBase64Url(signature)}, k=${keys.publicKey}`;
}

/** RFC 8291: the encrypted body for one subscription. */
export async function encryptPayload(
  target: PushTarget,
  payload: string,
  // Injectable for tests; random in production.
  salt: Bytes = crypto.getRandomValues(new Uint8Array(16)),
): Promise<Bytes> {
  const uaPublic = fromBase64Url(target.keys.p256dh);
  const authSecret = fromBase64Url(target.keys.auth);
  const local = (await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  )) as CryptoKeyPair;
  const asPublic = new Uint8Array(
    (await crypto.subtle.exportKey('raw', local.publicKey)) as ArrayBuffer,
  );
  const uaKey = await crypto.subtle.importKey(
    'raw',
    uaPublic,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: uaKey },
      local.privateKey,
      256,
    ),
  );
  const ikm = await hkdf(
    authSecret,
    shared,
    concat(encoder.encode('WebPush: info\0'), uaPublic, asPublic),
    32,
  );
  const cek = await hkdf(
    salt,
    ikm,
    encoder.encode('Content-Encoding: aes128gcm\0'),
    16,
  );
  const nonce = await hkdf(
    salt,
    ikm,
    encoder.encode('Content-Encoding: nonce\0'),
    12,
  );
  const key = await crypto.subtle.importKey('raw', cek, 'AES-GCM', false, [
    'encrypt',
  ]);
  // One record: the payload, then the last-record delimiter 0x02.
  const plaintext = concat(encoder.encode(payload), new Uint8Array([2]));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce }, key, plaintext),
  );
  const recordSize = new Uint8Array(4);
  new DataView(recordSize.buffer).setUint32(0, 4096);
  return concat(
    salt,
    recordSize,
    new Uint8Array([asPublic.length]),
    asPublic,
    ciphertext,
  );
}

/** Sends one push message; never throws for an HTTP answer. */
export async function sendPush(
  target: PushTarget,
  payload: string,
  keys: VapidKeys,
  options: { now: Date; ttlSeconds?: number; topic?: string },
  fetchFn: Fetch = (input, init) => fetch(input, init),
): Promise<PushResult> {
  const body = await encryptPayload(target, payload);
  const headers: Record<string, string> = {
    authorization: await vapidAuthorization(target.endpoint, keys, options.now),
    'content-encoding': 'aes128gcm',
    'content-type': 'application/octet-stream',
    ttl: String(options.ttlSeconds ?? 6 * 60 * 60),
    urgency: 'normal',
  };
  // A topic collapses an unread message with a newer one of the same kind.
  if (options.topic && /^[A-Za-z0-9_-]{1,32}$/.test(options.topic)) {
    headers['topic'] = options.topic;
  }
  const response = await fetchFn(target.endpoint, {
    method: 'POST',
    headers,
    body,
  });
  if (response.ok) return { ok: true };
  return {
    ok: false,
    gone: response.status === 404 || response.status === 410,
    status: response.status,
  };
}

/** A new VAPID key pair, for the setup script. */
export async function generateVapidKeys(): Promise<{
  publicKey: string;
  privateKey: string;
}> {
  const pair = (await crypto.subtle.generateKey(
    { name: 'ECDSA', namedCurve: 'P-256' },
    true,
    ['sign', 'verify'],
  )) as CryptoKeyPair;
  const raw = (await crypto.subtle.exportKey(
    'raw',
    pair.publicKey,
  )) as ArrayBuffer;
  const jwk = await crypto.subtle.exportKey('jwk', pair.privateKey);
  return { publicKey: toBase64Url(raw), privateKey: jwk.d ?? '' };
}
