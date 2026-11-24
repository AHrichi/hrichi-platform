/**
 * Join codes as people type and read them (ADR-0026). The database makes
 * them: 8 characters from an alphabet without 0/O and 1/I, so a code read
 * aloud or copied from a photo of a screen comes out right.
 */

export const JOIN_CODE_LENGTH = 8;

const VALID = /^[A-HJ-NP-Z2-9]{8}$/;

/**
 * What someone typed, as the database stores it: upper case, without
 * spaces or dashes. `null` when it can't be a code, so the form can say so
 * before asking the server.
 */
export function cleanJoinCode(text: string): string | null {
  const clean = text.replace(/[^a-z0-9]/gi, '').toUpperCase();
  return VALID.test(clean) ? clean : null;
}

/** `ABCD-EFGH`: easier to read out and to copy by eye. */
export function formatJoinCode(code: string): string {
  return code.length === JOIN_CODE_LENGTH
    ? `${code.slice(0, 4)}-${code.slice(4)}`
    : code;
}

/** Whether a code still works at `now`. */
export function joinCodeLive(
  expiresAt: string,
  now: Date = new Date(),
): boolean {
  return Date.parse(expiresAt) > now.getTime();
}
