import { Collection, MongoServerError, ObjectId } from 'mongodb';
import type { ChannelName, Lead, NewLead } from './lead';
import type { LeadsRepository } from './leads.repository';

type LeadDocument = NewLead & { _id: ObjectId };

const duplicateKey = 11000;

function toLead({ _id, ...rest }: LeadDocument): Lead {
  return { id: _id.toHexString(), ...rest };
}

export class MongoLeadsRepository implements LeadsRepository {
  constructor(private readonly leads: Collection<LeadDocument>) {}

  /** The unique index is what makes retried submissions idempotent. */
  async ensureIndexes(): Promise<void> {
    await this.leads.createIndexes([
      {
        key: { idempotencyKey: 1 },
        unique: true,
        name: 'idempotencyKey_unique',
      },
      {
        key: {
          'delivery.telegram.status': 1,
          'delivery.telegram.nextAttemptAt': 1,
        },
        name: 'telegram_due',
      },
      {
        key: { 'delivery.n8n.status': 1, 'delivery.n8n.nextAttemptAt': 1 },
        name: 'n8n_due',
      },
    ]);
  }

  async findByIdempotencyKey(key: string): Promise<Lead | null> {
    const found = await this.leads.findOne({ idempotencyKey: key });
    return found ? toLead(found) : null;
  }

  async insertIfNew(lead: NewLead): Promise<{ lead: Lead; created: boolean }> {
    const document: LeadDocument = { _id: new ObjectId(), ...lead };
    try {
      await this.leads.insertOne(document);
      return { lead: toLead(document), created: true };
    } catch (error) {
      if (!(error instanceof MongoServerError) || error.code !== duplicateKey) {
        throw error;
      }
      const existing = await this.leads.findOne({
        idempotencyKey: lead.idempotencyKey,
      });
      if (!existing) {
        throw error;
      }
      return { lead: toLead(existing), created: false };
    }
  }

  async claimDue(
    channel: ChannelName,
    now: Date,
    leaseMs: number,
  ): Promise<Lead | null> {
    const path = `delivery.${channel}`;
    const claimed = await this.leads.findOneAndUpdate(
      {
        [`${path}.status`]: 'pending',
        [`${path}.nextAttemptAt`]: { $lte: now },
        $or: [
          { [`${path}.leaseUntil`]: { $exists: false } },
          { [`${path}.leaseUntil`]: { $lte: now } },
        ],
      },
      { $set: { [`${path}.leaseUntil`]: new Date(now.getTime() + leaseMs) } },
      { sort: { [`${path}.nextAttemptAt`]: 1 }, returnDocument: 'after' },
    );
    return claimed ? toLead(claimed) : null;
  }

  async markSent(id: string, channel: ChannelName, now: Date): Promise<void> {
    const path = `delivery.${channel}`;
    await this.leads.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: { [`${path}.status`]: 'sent', [`${path}.sentAt`]: now },
        $inc: { [`${path}.attempts`]: 1 },
        $unset: { [`${path}.leaseUntil`]: '', [`${path}.lastError`]: '' },
      },
    );
  }

  async markFailed(
    id: string,
    channel: ChannelName,
    attempts: number,
    error: string,
    nextAttemptAt: Date | null,
  ): Promise<void> {
    const path = `delivery.${channel}`;
    await this.leads.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          [`${path}.status`]: nextAttemptAt ? 'pending' : 'failed',
          [`${path}.attempts`]: attempts,
          [`${path}.lastError`]: error.slice(0, 500),
          ...(nextAttemptAt
            ? { [`${path}.nextAttemptAt`]: nextAttemptAt }
            : {}),
        },
        $unset: { [`${path}.leaseUntil`]: '' },
      },
    );
  }
}
