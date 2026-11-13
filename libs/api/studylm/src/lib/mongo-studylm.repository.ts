import { type Collection, type Db, MongoServerError } from 'mongodb';
import type {
  StudyLmSyncKind,
  StudyLmSyncRecordOfKind,
} from '@ah/products/studylm/domain';
import type {
  StoredStudyLmRecord,
  StudyLmDevice,
  StudyLmPairing,
  StudyLmPutOutcome,
  StudyLmRepository,
} from './studylm.repository';

const DUPLICATE_KEY = 11000;

interface StudyLmRecordDocument {
  _id: string;
  kind: StudyLmSyncKind;
  id: string;
  seq: number;
  by: string;
  updatedAt: string;
  updatedAtMs: number;
  data: StudyLmSyncRecordOfKind[StudyLmSyncKind];
}

type DeviceDocument = Omit<StudyLmDevice, 'id'> & { _id: string };
type PairingDocument = Omit<StudyLmPairing, 'id'> & { _id: string };
interface CounterDocument {
  _id: string;
  value: number;
}

function toRecord(doc: StudyLmRecordDocument): StoredStudyLmRecord {
  const { kind, id, seq, by, updatedAt, data } = doc;
  return { kind, id, seq, by, updatedAt, data } as StoredStudyLmRecord;
}

function toDocument(record: StoredStudyLmRecord): StudyLmRecordDocument {
  return {
    _id: `${record.kind}:${record.id}`,
    ...record,
    updatedAtMs: Date.parse(record.updatedAt),
  };
}

function toDevice({ _id, ...device }: DeviceDocument): StudyLmDevice {
  return { id: _id, ...device };
}

export class MongoStudyLmRepository implements StudyLmRepository {
  private readonly records: Collection<StudyLmRecordDocument>;
  private readonly devices: Collection<DeviceDocument>;
  private readonly pairings: Collection<PairingDocument>;
  private readonly counters: Collection<CounterDocument>;

  constructor(db: Db) {
    this.records = db.collection('studylm_records');
    this.devices = db.collection('studylm_devices');
    this.pairings = db.collection('studylm_pairings');
    this.counters = db.collection('studylm_counters');
  }

  async ensureIndexes(): Promise<void> {
    await this.records.createIndexes([
      { key: { seq: 1 }, name: 'seq', unique: true },
      { key: { kind: 1, id: 1 }, name: 'kind_id' },
    ]);
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
    if (!counter) throw new Error('StudyLM sequence counter was not returned');
    return counter.value;
  }

  async putRecord<K extends StudyLmSyncKind>(
    record: StoredStudyLmRecord<K>,
  ): Promise<StudyLmPutOutcome> {
    const document = toDocument(record as StoredStudyLmRecord);
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
      if (error instanceof MongoServerError && error.code === DUPLICATE_KEY) {
        return 'kept';
      }
      throw error;
    }
  }

  async changesSince(
    cursor: number,
    limit: number,
  ): Promise<StoredStudyLmRecord[]> {
    const docs = await this.records
      .find({ seq: { $gt: cursor } })
      .sort({ seq: 1 })
      .limit(limit)
      .toArray();
    return docs.map(toRecord);
  }

  async getRecord<K extends StudyLmSyncKind>(
    kind: K,
    id: string,
  ): Promise<StoredStudyLmRecord<K> | null> {
    const found = await this.records.findOne({ _id: `${kind}:${id}` });
    return found ? (toRecord(found) as StoredStudyLmRecord<K>) : null;
  }

  async createDevice({ id, ...device }: StudyLmDevice): Promise<void> {
    await this.devices.insertOne({ _id: id, ...device });
  }

  async findDevice(id: string): Promise<StudyLmDevice | null> {
    const found = await this.devices.findOne({ _id: id });
    return found ? toDevice(found) : null;
  }

  async listDevices(): Promise<StudyLmDevice[]> {
    const docs = await this.devices.find().sort({ pairedAt: 1 }).toArray();
    return docs.map(toDevice);
  }

  async revokeDevice(id: string, at: Date): Promise<boolean> {
    const res = await this.devices.updateOne(
      { _id: id, revokedAt: null },
      { $set: { revokedAt: at } },
    );
    return res.modifiedCount === 1;
  }

  async touchDevice(id: string, at: Date): Promise<void> {
    await this.devices.updateOne({ _id: id }, { $set: { lastSeenAt: at } });
  }

  async createPairing({ id, ...pairing }: StudyLmPairing): Promise<void> {
    await this.pairings.insertOne({ _id: id, ...pairing });
  }

  async findPairing(id: string): Promise<StudyLmPairing | null> {
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
