import { InjectionToken } from '@angular/core';
import type { StoredRecord, SyncRecord } from '@ah/shared/sync';

/**
 * Where an app's synced data lives on the device. The app writes a record
 * to its outbox in the same transaction as the change it stands for, so
 * no edit is ever lost between the two.
 */
export interface SyncLocalStore {
  /** Changes not pushed yet, oldest first. */
  outbox(): Promise<SyncRecord[]>;
  /**
   * Takes records off the outbox, unless edited again since (a different
   * `updatedAt`): the newer edit still has to go.
   */
  acknowledge(
    records: readonly { kind: string; key: string; updatedAt: string }[],
  ): Promise<void>;
  /** Saves records other devices wrote (each newer than any edit here). */
  apply(records: readonly StoredRecord[]): Promise<void>;
  /**
   * Queues everything the app holds, each record with the time it was
   * last changed, written by `deviceId`: when this device joins a space.
   */
  queueAll(deviceId: string): Promise<void>;
  /** Empties the outbox: sync is off on this device. */
  clearOutbox(): Promise<void>;
}

export interface SyncSetup {
  /** The app's id, as its sync spec names it. */
  readonly app: string;
  readonly local: SyncLocalStore;
  /** After pulled records are saved, so the app shows them (any tab). */
  readonly onPulled?: () => void;
  /** Where this device's sync state is kept (`syncStateKey(app)`). */
  readonly stateKey?: string;
}

export const SYNC_SETUP = new InjectionToken<SyncSetup>('SYNC_SETUP');

/**
 * - `off`: not in a space.
 * - `unavailable`: no sync server configured, or it isn't set up yet.
 * - `syncing`, `synced`: as they say.
 * - `offline`: no connection; it syncs when one comes back.
 * - `waiting`: the server asked to wait (busy, or a failure): it retries.
 * - `attention`: something only the owner can fix (the clock, the space
 *   full); `problem` says what.
 * - `removed`: another device unlinked this one; its data stays here.
 */
export type SyncStatus =
  | 'off'
  | 'unavailable'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'waiting'
  | 'attention'
  | 'removed';

/** What `attention` is about. */
export type SyncProblem = 'clock' | 'full' | 'too_large';

/** This device's place in a space, kept on the device. */
export interface SyncState {
  readonly spaceId: string;
  readonly deviceId: string;
  readonly token: string;
  /** The highest `seq` pulled. */
  readonly cursor: number;
  readonly lastSyncAt: string | null;
}

/** Where a device's sync state is kept (localStorage). */
export function syncStateKey(app: string): string {
  return `ah.sync.${app}`;
}

/**
 * This device's sync state (at `syncStateKey(app)`), read fresh: an app's storage layer asks for
 * the device id when it saves, so every tab writes the outbox once sync is
 * on, even a tab opened before.
 */
export function readSyncState(key: string): SyncState | null {
  try {
    const raw = localStorage.getItem(key);
    const state = raw ? (JSON.parse(raw) as SyncState) : null;
    return state && typeof state.deviceId === 'string' && state.token
      ? state
      : null;
  } catch {
    return null;
  }
}

export function writeSyncState(key: string, state: SyncState | null): void {
  try {
    if (state) localStorage.setItem(key, JSON.stringify(state));
    else localStorage.removeItem(key);
  } catch {
    // Blocked storage: sync lasts as long as the page.
  }
}
