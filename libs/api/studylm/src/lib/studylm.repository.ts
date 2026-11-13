import type {
  StudyLmSyncKind,
  StudyLmSyncRecordOfKind,
} from '@ah/products/studylm/domain';

export const STUDYLM_REPOSITORY = Symbol('STUDYLM_REPOSITORY');

export interface StoredStudyLmRecord<
  K extends StudyLmSyncKind = StudyLmSyncKind,
> {
  kind: K;
  id: string;
  /** Monotonically increasing change-feed position for incremental pulls. */
  seq: number;
  by: string;
  updatedAt: string;
  data: StudyLmSyncRecordOfKind[K];
}

export interface StudyLmDevice {
  id: string;
  name: string;
  pairedAt: Date;
  lastSeenAt: Date | null;
  revokedAt: Date | null;
}

export interface StudyLmPairing {
  id: string;
  deviceName: string;
  codeHash: string;
  expiresAt: Date;
  attempts: number;
}

export type StudyLmPutOutcome = 'stored' | 'kept';

export interface StudyLmRepository {
  nextSeq(): Promise<number>;
  putRecord<K extends StudyLmSyncKind>(
    record: StoredStudyLmRecord<K>,
  ): Promise<StudyLmPutOutcome>;
  changesSince(cursor: number, limit: number): Promise<StoredStudyLmRecord[]>;
  getRecord<K extends StudyLmSyncKind>(
    kind: K,
    id: string,
  ): Promise<StoredStudyLmRecord<K> | null>;

  createDevice(device: StudyLmDevice): Promise<void>;
  findDevice(id: string): Promise<StudyLmDevice | null>;
  listDevices(): Promise<StudyLmDevice[]>;
  revokeDevice(id: string, at: Date): Promise<boolean>;
  touchDevice(id: string, at: Date): Promise<void>;

  createPairing(pairing: StudyLmPairing): Promise<void>;
  findPairing(id: string): Promise<StudyLmPairing | null>;
  recordFailedAttempt(id: string): Promise<number>;
  deletePairing(id: string): Promise<void>;
}
