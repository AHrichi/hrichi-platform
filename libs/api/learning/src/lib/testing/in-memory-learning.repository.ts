import {
  type AppendOnlyKind,
  incomingWins,
  type MutableKind,
  type RecordKind,
} from '@ah/learning/domain';
import type {
  Device,
  LearningRepository,
  Pairing,
  PutOutcome,
  StoredRecord,
} from '../learning.repository';

/** Same semantics as MongoLearningRepository, for tests and local runs. */
export class InMemoryLearningRepository implements LearningRepository {
  readonly records = new Map<string, StoredRecord>();
  readonly devices = new Map<string, Device>();
  readonly pairings = new Map<string, Pairing>();
  private seq = 0;

  async nextSeq(): Promise<number> {
    return ++this.seq;
  }

  async putMutable<K extends MutableKind>(
    record: StoredRecord<K>,
  ): Promise<PutOutcome> {
    const key = `${record.kind}:${record.id}`;
    const current = this.records.get(key);
    if (!incomingWins(current, record)) return 'kept';
    this.records.set(key, structuredClone(record) as StoredRecord);
    return 'stored';
  }

  async putAppendOnly<K extends AppendOnlyKind>(
    record: StoredRecord<K>,
  ): Promise<PutOutcome> {
    const key = `${record.kind}:${record.id}`;
    if (this.records.has(key)) return 'kept';
    this.records.set(key, structuredClone(record) as StoredRecord);
    return 'stored';
  }

  async changesSince(cursor: number, limit: number): Promise<StoredRecord[]> {
    return [...this.records.values()]
      .filter((record) => record.seq > cursor)
      .sort((a, b) => a.seq - b.seq)
      .slice(0, limit)
      .map((record) => structuredClone(record));
  }

  async getRecord<K extends RecordKind>(
    kind: K,
    id: string,
  ): Promise<StoredRecord<K> | null> {
    const record = this.records.get(`${kind}:${id}`);
    return record ? (structuredClone(record) as StoredRecord<K>) : null;
  }

  async findByStatus<K extends 'capture' | 'concept'>(
    kind: K,
    statuses: readonly string[],
    limit: number,
  ): Promise<StoredRecord<K>[]> {
    return [...this.records.values()]
      .filter(
        (record) =>
          record.kind === kind &&
          statuses.includes((record.data as { status: string }).status),
      )
      .sort((a, b) => a.seq - b.seq)
      .slice(0, limit)
      .map((record) => structuredClone(record) as StoredRecord<K>);
  }

  async liveTopics(): Promise<StoredRecord<'topic'>[]> {
    return [...this.records.values()]
      .filter((record) => record.kind === 'topic')
      .map((record) => structuredClone(record) as StoredRecord<'topic'>)
      .filter((record) => !record.data.deletedAt);
  }

  async recordsOfKind<K extends RecordKind>(
    kind: K,
  ): Promise<StoredRecord<K>[]> {
    return [...this.records.values()]
      .filter((record) => record.kind === kind)
      .sort((a, b) => a.seq - b.seq)
      .map((record) => structuredClone(record) as StoredRecord<K>);
  }

  async createDevice(device: Device): Promise<void> {
    this.devices.set(device.id, structuredClone(device));
  }

  async findDevice(id: string): Promise<Device | null> {
    const device = this.devices.get(id);
    return device ? structuredClone(device) : null;
  }

  async listDevices(): Promise<Device[]> {
    return [...this.devices.values()]
      .sort((a, b) => a.pairedAt.getTime() - b.pairedAt.getTime())
      .map((device) => structuredClone(device));
  }

  async revokeDevice(id: string, at: Date): Promise<boolean> {
    const device = this.devices.get(id);
    if (!device || device.revokedAt) return false;
    device.revokedAt = at;
    return true;
  }

  async touchDevice(id: string, at: Date): Promise<void> {
    const device = this.devices.get(id);
    if (device) device.lastSeenAt = at;
  }

  async createPairing(pairing: Pairing): Promise<void> {
    this.pairings.set(pairing.id, structuredClone(pairing));
  }

  async findPairing(id: string): Promise<Pairing | null> {
    const pairing = this.pairings.get(id);
    return pairing ? structuredClone(pairing) : null;
  }

  async recordFailedAttempt(id: string): Promise<number> {
    const pairing = this.pairings.get(id);
    if (!pairing) return Number.POSITIVE_INFINITY;
    pairing.attempts += 1;
    return pairing.attempts;
  }

  async deletePairing(id: string): Promise<void> {
    this.pairings.delete(id);
  }
}
