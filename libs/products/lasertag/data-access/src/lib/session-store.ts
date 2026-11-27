import type { PlayerView, SignedIn } from '@ah/products/lasertag/domain';

/** What the device keeps of a signed-in player. */
export interface StoredSession {
  readonly token: string;
  readonly expiresAt: string;
  readonly player: PlayerView;
  readonly badgeKey: string;
}

export const SESSION_STORAGE_KEY = 'barq.session.v1';

/** The part of `localStorage` this needs. */
export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function isSession(value: unknown, now: Date): value is StoredSession {
  if (typeof value !== 'object' || value === null) return false;
  const v = value as Record<string, unknown>;
  const player = v['player'] as Record<string, unknown> | null;
  return (
    typeof v['token'] === 'string' &&
    typeof v['badgeKey'] === 'string' &&
    typeof v['expiresAt'] === 'string' &&
    new Date(v['expiresAt']).getTime() > now.getTime() &&
    typeof player === 'object' &&
    player !== null &&
    typeof player['id'] === 'string' &&
    typeof player['handle'] === 'string'
  );
}

/** The stored session, or null if there is none, it's damaged or expired. */
export function loadSession(
  store: KeyValueStore,
  now = new Date(),
  key = SESSION_STORAGE_KEY,
): StoredSession | null {
  try {
    const raw = store.getItem(key);
    const value: unknown = raw ? JSON.parse(raw) : null;
    if (isSession(value, now)) return value;
    if (raw) store.removeItem(key);
  } catch {
    // Damaged or blocked storage: signed out.
  }
  return null;
}

export function saveSession(
  store: KeyValueStore,
  signed: SignedIn | StoredSession,
  key = SESSION_STORAGE_KEY,
): StoredSession {
  const session: StoredSession = {
    token: signed.token,
    expiresAt: signed.expiresAt,
    player: signed.player,
    badgeKey: signed.badgeKey,
  };
  try {
    store.setItem(key, JSON.stringify(session));
  } catch {
    // Private mode or full: the session lasts this visit.
  }
  return session;
}

export function clearSession(store: KeyValueStore, key = SESSION_STORAGE_KEY) {
  try {
    store.removeItem(key);
  } catch {
    // Nothing to clear.
  }
}
