import {
  encryptPayload,
  fromBase64Url,
  generateVapidKeys,
  type PushTarget,
  sendPush,
  toBase64Url,
  vapidAuthorization,
} from './web-push';

const encoder = new TextEncoder();
type Bytes = Uint8Array<ArrayBuffer>;

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

async function hkdf(
  salt: Uint8Array,
  ikm: Uint8Array,
  info: Uint8Array,
  n: number,
) {
  const prk = await hmac(salt, ikm);
  return (await hmac(prk, concat(info, new Uint8Array([1])))).slice(0, n);
}

/** A browser's side of a subscription: what the push service hands it. */
async function browserSubscription() {
  const pair = (await crypto.subtle.generateKey(
    { name: 'ECDH', namedCurve: 'P-256' },
    true,
    ['deriveBits'],
  )) as CryptoKeyPair;
  const publicRaw = new Uint8Array(
    (await crypto.subtle.exportKey('raw', pair.publicKey)) as ArrayBuffer,
  );
  const auth = crypto.getRandomValues(new Uint8Array(16));
  const target: PushTarget = {
    endpoint: 'https://push.example.test/send/abc',
    keys: { p256dh: toBase64Url(publicRaw), auth: toBase64Url(auth) },
  };
  return { pair, publicRaw, auth, target };
}

/** What the browser does on receipt (RFC 8291 §3.4, the reverse). */
async function decrypt(
  body: Uint8Array,
  ua: Awaited<ReturnType<typeof browserSubscription>>,
): Promise<string> {
  const salt = body.slice(0, 16);
  const recordSize = new DataView(body.buffer, body.byteOffset).getUint32(16);
  expect(recordSize).toBe(4096);
  const idLength = body[20];
  const asPublic = body.slice(21, 21 + idLength);
  const ciphertext = body.slice(21 + idLength);
  const asKey = await crypto.subtle.importKey(
    'raw',
    asPublic,
    { name: 'ECDH', namedCurve: 'P-256' },
    false,
    [],
  );
  const shared = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: 'ECDH', public: asKey },
      ua.pair.privateKey,
      256,
    ),
  );
  const ikm = await hkdf(
    ua.auth,
    shared,
    concat(encoder.encode('WebPush: info\0'), ua.publicRaw, asPublic),
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
    'decrypt',
  ]);
  const plain = new Uint8Array(
    await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: nonce },
      key,
      ciphertext,
    ),
  );
  expect(plain[plain.length - 1]).toBe(2);
  return new TextDecoder().decode(plain.slice(0, -1));
}

describe('web push', () => {
  it('encrypts a payload the browser can decrypt (RFC 8291)', async () => {
    const ua = await browserSubscription();
    const payload = JSON.stringify({ notification: { title: 'Hi ☕' } });
    const body = await encryptPayload(ua.target, payload);
    expect(await decrypt(body, ua)).toBe(payload);
  });

  it('signs a VAPID JWT for the endpoint’s origin that verifies', async () => {
    const keys = {
      ...(await generateVapidKeys()),
      subject: 'https://app.example.test',
    };
    expect(fromBase64Url(keys.publicKey)).toHaveLength(65);
    const now = new Date('2026-11-16T10:00:00Z');
    const header = await vapidAuthorization(
      'https://fcm.googleapis.com/fcm/send/xyz',
      keys,
      now,
    );
    const match = /^vapid t=([^.]+)\.([^.]+)\.([^,]+), k=(.+)$/.exec(header);
    expect(match).not.toBeNull();
    const [, head, claims, signature, k] = match as RegExpExecArray;
    expect(k).toBe(keys.publicKey);
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(claims)));
    expect(payload).toEqual({
      aud: 'https://fcm.googleapis.com',
      exp: now.getTime() / 1000 + 12 * 3600,
      sub: 'https://app.example.test',
    });
    const publicKey = await crypto.subtle.importKey(
      'raw',
      fromBase64Url(keys.publicKey),
      { name: 'ECDSA', namedCurve: 'P-256' },
      false,
      ['verify'],
    );
    expect(
      await crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        publicKey,
        fromBase64Url(signature),
        encoder.encode(`${head}.${claims}`),
      ),
    ).toBe(true);
  });

  it('posts to the endpoint and reports gone subscriptions', async () => {
    const ua = await browserSubscription();
    const keys = { ...(await generateVapidKeys()), subject: 'https://a.test' };
    const calls: { url: string; init: RequestInit }[] = [];
    let status = 201;
    const fetchFn = (async (url: string, init: RequestInit) => {
      calls.push({ url, init });
      return new Response(null, { status });
    }) as typeof fetch;
    const now = new Date();
    expect(
      await sendPush(
        ua.target,
        '{"a":1}',
        keys,
        { now, topic: 'learning-nudge' },
        fetchFn,
      ),
    ).toEqual({ ok: true });
    const headers = calls[0].init.headers as Record<string, string>;
    expect(calls[0].url).toBe(ua.target.endpoint);
    expect(headers['content-encoding']).toBe('aes128gcm');
    expect(headers['topic']).toBe('learning-nudge');
    expect(headers['authorization']).toMatch(/^vapid t=/);
    expect(await decrypt(calls[0].init.body as Uint8Array, ua)).toBe('{"a":1}');

    status = 410;
    expect(await sendPush(ua.target, '{}', keys, { now }, fetchFn)).toEqual({
      ok: false,
      gone: true,
      status: 410,
    });
    status = 500;
    expect(await sendPush(ua.target, '{}', keys, { now }, fetchFn)).toEqual({
      ok: false,
      gone: false,
      status: 500,
    });
  });
});
