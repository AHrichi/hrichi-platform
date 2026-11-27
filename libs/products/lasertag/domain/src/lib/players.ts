/**
 * Players' names. A **handle** is unique and shows on leaderboards
 * (`@nour_7`); a **display name** is free text. Handles may use Latin or
 * Arabic letters, digits and `_`, start with a letter, and are unique after
 * folding case and Arabic letter variants, so `Nour` and `nour`, or `أمين`
 * and `امين`, can't both exist.
 */
export const HANDLE_MIN = 3;
export const HANDLE_MAX = 20;
export const DISPLAY_NAME_MAX = 30;
export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

export type NameProblem = 'too-short' | 'too-long' | 'characters' | 'reserved';

const LATIN = 'a-zA-Z';
// Arabic letters U+0621–U+064A, plus Persian/Urdu letters common in names.
const ARABIC = '\\u0621-\\u064A\\u0671-\\u06D3';
const HANDLE = new RegExp(`^[${LATIN}${ARABIC}][${LATIN}${ARABIC}0-9_]*$`);
const ONE_SCRIPT_LATIN = new RegExp(`[${LATIN}]`);
const ONE_SCRIPT_ARABIC = new RegExp(`[${ARABIC}]`);

/** Names nobody may take: they would pass for the venue or the app. */
const RESERVED = new Set([
  'barq',
  'admin',
  'staff',
  'guest',
  'support',
  'moderator',
  'system',
  'venue',
  'official',
  'برق',
]);

/**
 * The form handles are compared in: lower case, Arabic diacritics and the
 * tatweel removed, alef and yeh variants folded.
 */
export function handleKey(handle: string): string {
  return handle
    .normalize('NFKC')
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')
    .replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627')
    .replace(/\u0649/g, '\u064A');
}

export function handleProblem(handle: string): NameProblem | null {
  const text = handle.normalize('NFKC');
  if (text.length < HANDLE_MIN) return 'too-short';
  if (text.length > HANDLE_MAX) return 'too-long';
  if (!HANDLE.test(text)) return 'characters';
  // One script per handle: mixing them makes look-alikes easy.
  if (ONE_SCRIPT_LATIN.test(text) && ONE_SCRIPT_ARABIC.test(text)) {
    return 'characters';
  }
  return RESERVED.has(handleKey(text)) ? 'reserved' : null;
}

/** Control characters and bidi overrides, which could disguise a name. */
// eslint-disable-next-line no-control-regex
const UNSAFE = /[\u0000-\u001F\u007F\u202A-\u202E\u2066-\u2069\u200B-\u200F]/;

/** Trimmed free text, or a problem. Used for display names and nicknames. */
export function nameProblem(
  name: string,
  min: number,
  max: number,
): NameProblem | null {
  const text = name.normalize('NFKC').trim();
  if (text.length < min) return 'too-short';
  if (text.length > max) return 'too-long';
  if (UNSAFE.test(text)) return 'characters';
  return null;
}

export function cleanName(name: string): string {
  return name.normalize('NFKC').trim().replace(/\s+/g, ' ');
}
