import {
  incomingStudyLmWins,
  type StudyLmSyncKind,
} from '@ah/products/studylm/domain';
import type {
  StoredStudyLmRecord,
  StudyLmDevice,
  StudyLmPairing,
  StudyLmPutOutcome,
  StudyLmRepository,
} from '../studylm.repository';

export class InMemoryStudyLmRepository implements StudyLmRepository {
  readonly records = new Map<string, StoredStudyLmRecord>();
  readonly devices = new Map<string, StudyLmDevice>();
  readonly pairings = new Map<string, StudyLmPairing>();
  private seq = 0;

  async nextSeq(): Promise<number> {
    return ++this.seq;
  }

  async putRecord<K extends StudyLmSyncKind>(
    record: StoredStudyLmRecord<K>,
  ): Promise<StudyLmPutOutcome> {
    const key = `${record.kind}:${record.id}`;
    const current = this.records.get(key);
    if (!incomingStudyLmWins(current, record)) return 'kept';
    this.records.set(key, structuredClone(record) as StoredStudyLmRecord);
    return 'stored';
  }

  async changesSince(
    cursor: number,
    limit: number,
  ): Promise<StoredStudyLmRecord[]> {
    return [...this.records.values()]
      .filter((r) => r.seq > cursor)
      .sort((a, b) => a.seq - b.seq)
      .slice(0, limit)
      .map((r) => structuredClone(r));
  }

  async getRecord<K extends StudyLmSyncKind>(
    kind: K,
    id: string,
  ): Promise<StoredStudyLmRecord<K> | null> {
    const found = this.records.get(`${kind}:${id}`);
    return found ? (structuredClone(found) as StoredStudyLmRecord<K>) : null;
  }

  async createDevice(device: StudyLmDevice): Promise<void> {
    this.devices.set(device.id, structuredClone(device));
  }

  async findDevice(id: string): Promise<StudyLmDevice | null> {
    const found = this.devices.get(id);
    return found ? structuredClone(found) : null;
  }

  async listDevices(): Promise<StudyLmDevice[]> {
    return [...this.devices.values()]
      .sort((a, b) => a.pairedAt.getTime() - b.pairedAt.getTime())
      .map((d) => structuredClone(d));
  }

  async revokeDevice(id: string, at: Date): Promise<boolean> {
    const found = this.devices.get(id);
    if (!found || found.revokedAt) return false;
    found.revokedAt = at;
    return true;
  }

  async touchDevice(id: string, at: Date): Promise<void> {
    const found = this.devices.get(id);
    if (found) found.lastSeenAt = at;
  }

  async createPairing(pairing: StudyLmPairing): Promise<void> {
    this.pairings.set(pairing.id, structuredClone(pairing));
  }

  async findPairing(id: string): Promise<StudyLmPairing | null> {
    const found = await this.pairings.get(id);
    return found ? structuredClone(found) : null;
  }

  async recordFailedAttempt(id: string): Promise<number> {
    const found = this.pairings.get(id);
    if (!found) return Number.POSITIVE_INFINITY;
    found.attempts += 1;
    return found.attempts;
  }

  async deletePairing(id: string): Promise<void> {
    this.pairings.delete(id);
  }
}
