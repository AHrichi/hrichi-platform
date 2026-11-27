import { fromBase64Url, hmac, isId, toBase64Url } from './crypto';

/**
 * The player's QR badge. It changes every 30 seconds, so a screenshot shown
 * by someone else stops working within a minute and a half:
 * `B1.<playerId>.<step>.<mac>`, where `step` counts 30-second windows since
 * the epoch and `mac` is the first 12 bytes of HMAC-SHA-256 of the rest
 * under the player's own badge key.
 *
 * The key is 32 random bytes the server makes once per player and hands to
 * the player's devices at sign-in, so the badge works offline. Staff scan it;
 * the server (later the venue hub) checks it with the same key.
 */
export const BADGE_VERSION = 'B1';
export const BADGE_STEP_SECONDS = 30;
/** Steps either side of now still accepted: a slow scan, a clock a bit off. */
export const BADGE_TOLERANCE_STEPS = 1;
const MAC_BYTES = 12;
export const BADGE_KEY_BYTES = 32;

export function badgeStep(now: Date): number {
  return Math.floor(now.getTime() / 1000 / BADGE_STEP_SECONDS);
}

/** Seconds until the badge on screen changes. */
export function secondsUntilNextBadge(now: Date): number {
  const elapsed = (now.getTime() / 1000) % BADGE_STEP_SECONDS;
  return Math.ceil(BADGE_STEP_SECONDS - elapsed);
}

function keyBytes(badgeKey: string): Uint8Array<ArrayBuffer> {
  const bytes = fromBase64Url(badgeKey);
  if (!bytes || bytes.length !== BADGE_KEY_BYTES) {
    throw new Error('A badge key is 32 bytes in base64url');
  }
  return bytes;
}

export async function badgeToken(
  badgeKey: string,
  playerId: string,
  now: Date,
): Promise<string> {
  if (!isId(playerId)) throw new Error('The player id must be a UUID');
  const payload = `${BADGE_VERSION}.${playerId}.${badgeStep(now)}`;
  const mac = (await hmac(keyBytes(badgeKey), payload)).slice(0, MAC_BYTES);
  return `${payload}.${toBase64Url(mac)}`;
}

export interface BadgeParts {
  readonly playerId: string;
  readonly step: number;
  readonly mac: Uint8Array<ArrayBuffer>;
}

/** The badge's parts, or null if the text isn't a BARQ badge at all. */
export function parseBadge(text: string): BadgeParts | null {
  const parts = text.trim().split('.');
  if (parts.length !== 4 || parts[0] !== BADGE_VERSION) return null;
  const [, playerId, stepText, macText] = parts;
  if (!isId(playerId) || !/^\d{1,12}$/.test(stepText)) return null;
  const mac = fromBase64Url(macText);
  if (!mac || mac.length !== MAC_BYTES) return null;
  return { playerId, step: Number(stepText), mac };
}

/**
 * True when the badge was made with `badgeKey` within the tolerance of now.
 * HMAC is recomputed rather than verified, because only a prefix of it is
 * carried; the comparison still runs in constant time.
 */
export async function verifyBadge(
  badge: BadgeParts,
  badgeKey: string,
  now: Date,
): Promise<boolean> {
  if (Math.abs(badge.step - badgeStep(now)) > BADGE_TOLERANCE_STEPS) {
    return false;
  }
  const payload = `${BADGE_VERSION}.${badge.playerId}.${badge.step}`;
  const expected = (await hmac(keyBytes(badgeKey), payload)).slice(
    0,
    MAC_BYTES,
  );
  let difference = 0;
  for (let i = 0; i < MAC_BYTES; i++) difference |= expected[i] ^ badge.mac[i];
  return difference === 0;
}
