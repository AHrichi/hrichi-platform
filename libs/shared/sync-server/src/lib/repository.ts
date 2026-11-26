import type { Revision, StoredRecord, SyncRecord } from '@ah/shared/sync';

export interface SpaceRow {
  readonly id: string;
  readonly app: string;
  readonly createdAt: string;
  readonly lastSeenAt: string;
}

export interface DeviceRow {
  readonly id: string;
  readonly spaceId: string;
  readonly name: string;
  readonly createdAt: string;
  readonly lastSeenAt: string;
  readonly revokedAt: string | null;
}

export interface PairingRow {
  /** The code's hash: the code itself is never kept. */
  readonly codeHash: string;
  readonly spaceId: string;
  readonly createdBy: string;
  readonly expiresAt: string;
}

/** A record to write, with the size of its data. */
export interface WriteRecord extends SyncRecord {
  readonly bytes: number;
}

/** A stored version's revision and size, to decide and to count. */
export interface StoredVersion extends Revision {
  readonly bytes: number;
}

/**
 * Where sync spaces are kept: D1 in the Worker, memory in tests. Every
 * adapter passes `runSyncRepositoryContract`, so another database (Turso,
 * Postgres, Mongo) is one adapter and that suite away.
 *
 * Every method that takes a `spaceId` touches that space only.
 */
export interface SyncRepository {
  /** A new space with its first device. */
  createSpace(space: SpaceRow, device: DeviceRow): Promise<void>;
  space(id: string): Promise<SpaceRow | null>;
  addDevice(device: DeviceRow): Promise<void>;
  device(id: string): Promise<DeviceRow | null>;
  devices(spaceId: string): Promise<DeviceRow[]>;
  /** Notes that a device synced. */
  seen(spaceId: string, deviceId: string, at: string): Promise<void>;
  /** False if the device isn't in the space. */
  revoke(spaceId: string, deviceId: string, at: string): Promise<boolean>;
  addPairing(pairing: PairingRow): Promise<void>;
  /** Uses a code once, if it hasn't expired: its space, or null. */
  claimPairing(
    codeHash: string,
    now: string,
  ): Promise<{ spaceId: string } | null>;
  /** The stored versions of these records, by `recordId`. */
  versions(
    spaceId: string,
    records: readonly { kind: string; key: string }[],
  ): Promise<Map<string, StoredVersion>>;
  /**
   * Stores each record, unless a version that wins over it is stored by
   * then (another device's push in between): never an older over a newer.
   * Each stored record takes the space's next `seq`, in order.
   */
  write(spaceId: string, records: readonly WriteRecord[]): Promise<void>;
  /** Records after `afterSeq`, in order, at most `limit`. */
  pull(
    spaceId: string,
    afterSeq: number,
    limit: number,
  ): Promise<StoredRecord[]>;
  usage(spaceId: string): Promise<{ records: number; bytes: number }>;
  /** The space, its devices, codes and records. */
  deleteSpace(spaceId: string): Promise<void>;
  /** Removes used and expired codes, and spaces idle since `idleBefore`. */
  sweep(
    now: string,
    idleBefore: string,
  ): Promise<{ pairings: number; spaces: number }>;
}
