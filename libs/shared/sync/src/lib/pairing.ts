/**
 * The code that links a device to a space: 8 characters of Crockford's
 * base32 (no I, L, O or U to misread), about 40 bits, shown as `4K7Q-9XMD`.
 * It lasts ten minutes and works once; the server keeps only its hash, and
 * limits how often anyone may guess.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const PAIRING_CODE_LENGTH = 8;

/** A new code, from the platform's secure random numbers. */
export function newPairingCode(): string {
  const bytes = new Uint8Array(PAIRING_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  // 256 is a multiple of 32, so taking each byte modulo 32 is unbiased.
  return [...bytes].map((byte) => ALPHABET[byte % 32]).join('');
}

/** `4K7Q9XMD` as people read it: `4K7Q-9XMD`. */
export function formatPairingCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/**
 * A code as someone typed it: any case, spaces or dashes, and the letters
 * people mistake for digits read as those digits. Null if it can't be one.
 */
export function normalizePairingCode(typed: string): string | null {
  const code = typed
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/U/g, 'V');
  if (code.length !== PAIRING_CODE_LENGTH) return null;
  return [...code].every((char) => ALPHABET.includes(char)) ? code : null;
}

/** What the server keeps of a code: its SHA-256, in hex. */
export async function hashPairingCode(code: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`ah-sync-pairing:${code}`),
  );
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}
