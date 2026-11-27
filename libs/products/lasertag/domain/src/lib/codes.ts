import { sha256Hex } from './crypto';

/**
 * Codes people read aloud or type: Crockford's base32 (no I, L, O or U to
 * misread). A guest's claim code is 10 characters (50 bits), shown as
 * `4K7Q9-XMD2B`; a recovery code the same. The server keeps only a hash.
 */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
export const CODE_LENGTH = 10;

export type CodeKind = 'guest-claim' | 'recovery';

/** A new code, from the platform's secure random numbers. */
export function newCode(length = CODE_LENGTH): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  // 256 is a multiple of 32, so a byte modulo 32 is unbiased.
  return [...bytes].map((byte) => ALPHABET[byte % 32]).join('');
}

/** `4K7Q9XMD2B` as people read it: `4K7Q9-XMD2B`. */
export function formatCode(code: string): string {
  const half = Math.ceil(code.length / 2);
  return `${code.slice(0, half)}-${code.slice(half)}`;
}

/**
 * A code as someone typed it: any case, spaces or dashes, and the letters
 * mistaken for digits read as those digits. Null if it can't be one.
 */
export function normalizeCode(
  typed: string,
  length = CODE_LENGTH,
): string | null {
  const code = typed
    .toUpperCase()
    .replace(/[\s-]/g, '')
    .replace(/O/g, '0')
    .replace(/[IL]/g, '1')
    .replace(/U/g, 'V');
  if (code.length !== length) return null;
  return [...code].every((char) => ALPHABET.includes(char)) ? code : null;
}

/** What the server keeps of a code. */
export function hashCode(kind: CodeKind, code: string): Promise<string> {
  return sha256Hex(`barq-${kind}`, code);
}
