import type {
  AppendOnlyKind,
  MutableKind,
  RecordKind,
  RecordOfKind,
} from '@ah/learning/domain';

export const LEARNING_REPOSITORY = Symbol('LEARNING_REPOSITORY');

/** One stored version of a synced record. */
export interface StoredRecord<K extends RecordKind = RecordKind> {
  kind: K;
  id: string;
  /** Position in the change feed; the sync cursor counts these. */
  seq: number;
  /** The device that wrote this version. */
  by: string;
  updatedAt: string;
  data: RecordOfKind[K];
}

export interface Device {
  id: string;
  name: string;
  /**
   * Null for a paired device. A host app's link (design §9) names the app:
   * its token reaches only the host routes, never sync.
   */
  host: string | null;
  pairedAt: Date;
  lastSeenAt: Date | null;
  revokedAt: Date | null;
}

export interface Pairing {
  id: string;
  deviceName: string;
  /** SHA-256 of the pairing id and the code; the code itself is never stored. */
  codeHash: string;
  expiresAt: Date;
  attempts: number;
}

export type PutOutcome = 'stored' | 'kept';

/**
 * Storage for the Learning Engine. The Mongo and in-memory versions share
 * these semantics, and the same spec runs against both.
 */
export interface LearningRepository {
  /** The next sequence number; numbers are never reused. */
  nextSeq(): Promise<number>;
  /**
   * Stores a mutable record if it beats the stored version (incomingWins):
   * `kept` means the stored version stays.
   */
  putMutable<K extends MutableKind>(
    record: StoredRecord<K>,
  ): Promise<PutOutcome>;
  /** Stores a field-group merged concept if its stored seq still matches. */
  putMergedConcept(
    record: StoredRecord<'concept'>,
    expectedSeq: number,
  ): Promise<PutOutcome>;
  /** Stores an append-only record once; `kept` means it was there already. */
  putAppendOnly<K extends AppendOnlyKind>(
    record: StoredRecord<K>,
  ): Promise<PutOutcome>;
  /** Records with `seq > cursor`, oldest first. */
  changesSince(cursor: number, limit: number): Promise<StoredRecord[]>;
  /** The stored version of one record. */
  getRecord<K extends RecordKind>(
    kind: K,
    id: string,
  ): Promise<StoredRecord<K> | null>;
  /** Records of a kind whose `data.status` is one of `statuses`, oldest first. */
  findByStatus<K extends 'capture' | 'concept'>(
    kind: K,
    statuses: readonly string[],
    limit: number,
  ): Promise<StoredRecord<K>[]>;
  /** Every live (not deleted) topic. */
  liveTopics(): Promise<StoredRecord<'topic'>[]>;
  /** Every stored record of a kind, deleted ones too (a host's progress). */
  recordsOfKind<K extends RecordKind>(kind: K): Promise<StoredRecord<K>[]>;

  createDevice(device: Device): Promise<void>;
  findDevice(id: string): Promise<Device | null>;
  listDevices(): Promise<Device[]>;
  revokeDevice(id: string, at: Date): Promise<boolean>;
  touchDevice(id: string, at: Date): Promise<void>;

  createPairing(pairing: Pairing): Promise<void>;
  findPairing(id: string): Promise<Pairing | null>;
  /** Counts a wrong code and returns the attempts so far. */
  recordFailedAttempt(id: string): Promise<number>;
  deletePairing(id: string): Promise<void>;
}
