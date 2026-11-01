import {
  type FileError,
  readShared,
  shareText,
  type Trip,
} from '@ah/products/basecamp/domain';

/** The URL fragment that carries a shared trip: `#trip=…`. */
export const SHARE_PREFIX = 'trip=';

function toBase64Url(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function fromBase64Url(text: string): Uint8Array {
  const base64 = text.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64 + '='.repeat((4 - (base64.length % 4)) % 4));
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

async function pipe(
  bytes: Uint8Array,
  stream: CompressionStream | DecompressionStream,
): Promise<Uint8Array> {
  const out = new Blob([bytes as BlobPart]).stream().pipeThrough(stream);
  return new Uint8Array(await new Response(out).arrayBuffer());
}

/**
 * A trip packed into a URL fragment: JSON, deflated, base64url. Browsers
 * never send the fragment to a server, so the trip goes only where the
 * link goes. A weekend for three is about 1.5 kB, well within URL limits.
 */
export async function encodeTrip(trip: Trip): Promise<string> {
  const json = new TextEncoder().encode(shareText(trip));
  const packed = await pipe(json, new CompressionStream('deflate-raw'));
  return SHARE_PREFIX + toBase64Url(packed);
}

/** The trip in a `#trip=…` fragment, or why it can't be read. */
export async function decodeTrip(
  fragment: string,
): Promise<{ trip: Trip } | { error: FileError }> {
  const data = fragment.replace(/^#/, '');
  if (!data.startsWith(SHARE_PREFIX)) return { error: 'notBasecamp' };
  try {
    const bytes = fromBase64Url(data.slice(SHARE_PREFIX.length));
    const json = await pipe(bytes, new DecompressionStream('deflate-raw'));
    return readShared(new TextDecoder().decode(json));
  } catch {
    return { error: 'notJson' };
  }
}
