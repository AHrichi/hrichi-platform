import * as v from 'valibot';
import { SYNC_LIMITS } from './limits';
import { type StoredRecord, SyncRecordSchema } from './record';

/** Which app a space is for: its records follow that app's spec. */
export const SyncAppIdSchema = v.pipe(
  v.string(),
  v.regex(/^[a-z][a-z0-9-]{0,31}$/),
);

const DeviceNameSchema = v.pipe(
  v.string(),
  v.trim(),
  v.minLength(1),
  v.maxLength(SYNC_LIMITS.deviceNameChars),
);

/** `POST /v1/spaces`: this device starts a space. */
export const CreateSpaceRequestSchema = v.strictObject({
  v: v.literal(1),
  app: SyncAppIdSchema,
  deviceName: DeviceNameSchema,
});
export type CreateSpaceRequest = v.InferOutput<typeof CreateSpaceRequestSchema>;

/** `POST /v1/pairings/claim`: this device joins with another's code. */
export const ClaimRequestSchema = v.strictObject({
  v: v.literal(1),
  app: SyncAppIdSchema,
  code: v.pipe(v.string(), v.maxLength(20)),
  deviceName: DeviceNameSchema,
});
export type ClaimRequest = v.InferOutput<typeof ClaimRequestSchema>;

/** `POST /v1/sync`: what changed here since the last round, and the cursor. */
export const SyncRequestSchema = v.strictObject({
  v: v.literal(1),
  /** The highest `seq` this device has pulled. */
  cursor: v.pipe(v.number(), v.integer(), v.minValue(0)),
  push: v.pipe(v.array(SyncRecordSchema), v.maxLength(SYNC_LIMITS.pushRecords)),
});
export type SyncRequest = v.InferOutput<typeof SyncRequestSchema>;

/** A device, as the list of linked devices shows it. */
export interface SyncDevice {
  readonly id: string;
  readonly name: string;
  readonly createdAt: string;
  readonly lastSeenAt: string;
  /** The device asking. */
  readonly current: boolean;
}

/** Why a pushed record wasn't kept. */
export type SyncRejection =
  /** The server holds a later version: pull it. */
  | 'stale'
  /** The device's clock is too far ahead. */
  | 'clock_ahead'
  /** Too large, or the space is full. */
  | 'too_large'
  | 'quota'
  /** A kind the app doesn't sync, or data that isn't an object. */
  | 'invalid';

export type SyncErrorCode =
  | 'BAD_REQUEST'
  | 'TOO_LARGE'
  | 'FORBIDDEN_ORIGIN'
  | 'UNAUTHORIZED'
  /** This device was removed from its space. */
  | 'REVOKED'
  | 'NOT_FOUND'
  /** The code is wrong, used or expired. */
  | 'CODE_INVALID'
  | 'RATE_LIMITED'
  | 'UNAVAILABLE';

export interface SyncFailure {
  readonly v: 1;
  readonly ok: false;
  readonly code: SyncErrorCode;
  readonly message: string;
  readonly retryAfterSec?: number;
}

/** A space joined: who this device is, and how it proves it. */
export interface SyncJoined {
  readonly v: 1;
  readonly ok: true;
  readonly spaceId: string;
  readonly deviceId: string;
  readonly token: string;
}

export interface SyncPairing {
  readonly v: 1;
  readonly ok: true;
  /** As people read it: `4K7Q-9XMD`. */
  readonly code: string;
  readonly expiresAt: string;
}

export interface SyncDevices {
  readonly v: 1;
  readonly ok: true;
  readonly devices: readonly SyncDevice[];
}

export interface SyncUsage {
  readonly records: number;
  readonly bytes: number;
  readonly maxRecords: number;
  readonly maxBytes: number;
}

export interface SyncResult {
  readonly v: 1;
  readonly ok: true;
  /** Pull from here next time. */
  readonly cursor: number;
  /** Versions written after the request's cursor, its own included. */
  readonly pull: readonly StoredRecord[];
  /** More to pull: ask again with the new cursor. */
  readonly more: boolean;
  /** Pushed records not kept, and why; the others were kept. */
  readonly rejected: readonly {
    readonly kind: string;
    readonly key: string;
    readonly updatedAt: string;
    readonly reason: SyncRejection;
  }[];
  readonly usage: SyncUsage;
  /** A fresh token, when this one nears its expiry. */
  readonly token?: string;
}

export interface SyncDone {
  readonly v: 1;
  readonly ok: true;
}

export type SyncResponse<T> = T | SyncFailure;
