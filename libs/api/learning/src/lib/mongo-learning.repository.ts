import { type Collection, type Db, MongoServerError } from 'mongodb';
import type {
  AppendOnlyKind,
  MutableKind,
  RecordKind,
  RecordOfKind,
} from '@ah/learning/domain';
import type {
  Device,
  LearningRepository,
  Pairing,
  PutOutcome,
  StoredRecord,
} from './learning.repository';

const duplicateKey = 11000;

/** `_id` is `<kind>:<id>`, so one collection holds every kind. */
interface RecordDocument {
  _id: string;
  kind: RecordKind;
  id: string;
  seq: number;
  by: string;
  updatedAt: string;
  /** `updatedAt` as an instant, so versions compare as times, not strings. */
  updatedAtMs: number;
  data: RecordOfKind[RecordKind];
}

type DeviceDocument = Omit<Device, 'id'> & { _id: string };
type PairingDocument = Omit<Pairing, 'id'> & { _id: string };
interface CounterDocument {
  _id: string;
  value: number;
}

function toRecord(document: RecordDocument): StoredRecord {
  const { kind, id, seq, by, updatedAt, data } = document;
  return { kind, id, seq, by, updatedAt, data } as StoredRecord;
}

function toDocument(record: StoredRecord): RecordDocument {
  return {
    _id: `${record.kind}:${record.id}`,
    ...record,
    updatedAtMs: Date.parse(record.updatedAt),
  };
}

export class MongoLearningRepository implements LearningRepository {
  private readonly records: Collection<RecordDocument>;
  private readonly devices: Collection<DeviceDocument>;
  private readonly pairings: Collection<PairingDocument>;
  private readonly counters: Collection<CounterDocument>;

  constructor(db: Db) {
    this.records = db.collection('learning_records');
    this.devices = db.collection('learning_devices');
    this.pairings = db.collection('learning_pairings');
    this.counters = db.collection('learning_counters');
  }

  async ensureIndexes(): Promise<void> {
    await this.records.createIndexes([
      { key: { seq: 1 }, name: 'seq', unique: true },
      { key: { kind: 1, id: 1 }, name: 'kind_id' },
      { key: { kind: 1, 'data.status': 1, seq: 1 }, name: 'kind_status' },
    ]);
    // Expired pairings disappear on their own.
    await this.pairings.createIndexes([
      { key: { expiresAt: 1 }, name: 'expires', expireAfterSeconds: 0 },
    ]);
  }

  async nextSeq(): Promise<number> {
    const counter = await this.counters.findOneAndUpdate(
      { _id: 'records' },
      { $inc: { value: 1 } },
      { upsert: true, returnDocument: 'after' },
    );
    if (!counter) throw new Error('The sequence counter was not returned');
    return counter.value;
  }

  /**
   * One atomic upsert: the filter only matches a stored version the
   * incoming one beats (incomingWins). When the stored version wins, the
   * filter matches nothing, the upsert tries to insert the same `_id`, and
   * the duplicate-key error means "kept".
   */
  async putMutable<K extends MutableKind>(
    record: StoredRecord<K>,
  ): Promise<PutOutcome> {
    const document = toDocument(record as StoredRecord);
    try {
      await this.records.updateOne(
        {
          _id: document._id,
          $or: [
            { updatedAtMs: { $lt: document.updatedAtMs } },
            { updatedAtMs: document.updatedAtMs, by: { $lt: document.by } },
          ],
        },
        { $set: document },
        { upsert: true },
      );
      return 'stored';
    } catch (error) {
      if (error instanceof MongoServerError && error.code === duplicateKey) {
        return 'kept';
      }
      throw error;
    }
  }

  async putAppendOnly<K extends AppendOnlyKind>(
    record: StoredRecord<K>,
  ): Promise<PutOutcome> {
    try {
      await this.records.insertOne(toDocument(record as StoredRecord));
      return 'stored';
    } catch (error) {
      if (error instanceof MongoServerError && error.code === duplicateKey) {
        return 'kept';
      }
      throw error;
    }
  }

  async changesSince(cursor: number, limit: number): Promise<StoredRecord[]> {
    const documents = await this.records
      .find({ seq: { $gt: cursor } })
      .sort({ seq: 1 })
      .limit(limit)
      .toArray();
    return documents.map(toRecord);
  }

  async getRecord<K extends RecordKind>(
    kind: K,
    id: string,
  ): Promise<StoredRecord<K> | null> {
    const found = await this.records.findOne({ _id: `${kind}:${id}` });
    return found ? (toRecord(found) as StoredRecord<K>) : null;
  }

  async findByStatus<K extends 'capture' | 'concept'>(
    kind: K,
    statuses: readonly string[],
    limit: number,
  ): Promise<StoredRecord<K>[]> {
    const found = await this.records
      .find({ kind, 'data.status': { $in: [...statuses] } })
      .sort({ seq: 1 })
      .limit(limit)
      .toArray();
    return found.map((document) => toRecord(document) as StoredRecord<K>);
  }

  async liveTopics(): Promise<StoredRecord<'topic'>[]> {
    const found = await this.records
      .find({ kind: 'topic', 'data.deletedAt': null })
      .toArray();
    return found.map((document) => toRecord(document) as StoredRecord<'topic'>);
  }

  async createDevice({ id, ...device }: Device): Promise<void> {
    await this.devices.insertOne({ _id: id, ...device });
  }

  async findDevice(id: string): Promise<Device | null> {
    const found = await this.devices.findOne({ _id: id });
    if (!found) return null;
    const { _id, ...device } = found;
    return { id: _id, ...device };
  }

  async listDevices(): Promise<Device[]> {
    const found = await this.devices.find().sort({ pairedAt: 1 }).toArray();
    return found.map(({ _id, ...device }) => ({ id: _id, ...device }));
  }

  async revokeDevice(id: string, at: Date): Promise<boolean> {
    const result = await this.devices.updateOne(
      { _id: id, revokedAt: null },
      { $set: { revokedAt: at } },
    );
    return result.modifiedCount === 1;
  }

  async touchDevice(id: string, at: Date): Promise<void> {
    await this.devices.updateOne({ _id: id }, { $set: { lastSeenAt: at } });
  }

  async createPairing({ id, ...pairing }: Pairing): Promise<void> {
    await this.pairings.insertOne({ _id: id, ...pairing });
  }

  async findPairing(id: string): Promise<Pairing | null> {
    const found = await this.pairings.findOne({ _id: id });
    if (!found) return null;
    const { _id, ...pairing } = found;
    return { id: _id, ...pairing };
  }

  async recordFailedAttempt(id: string): Promise<number> {
    const updated = await this.pairings.findOneAndUpdate(
      { _id: id },
      { $inc: { attempts: 1 } },
      { returnDocument: 'after' },
    );
    return updated ? updated.attempts : Number.POSITIVE_INFINITY;
  }

  async deletePairing(id: string): Promise<void> {
    await this.pairings.deleteOne({ _id: id });
  }
}
