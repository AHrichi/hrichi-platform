import { randomUUID } from 'node:crypto';
import type { ChannelName, Lead, NewLead } from '../lead';
import type { LeadsRepository } from '../leads.repository';

/** Same semantics as MongoLeadsRepository, for tests and local runs. */
export class InMemoryLeadsRepository implements LeadsRepository {
  readonly leads = new Map<string, Lead>();

  async findByIdempotencyKey(key: string): Promise<Lead | null> {
    const found = [...this.leads.values()].find(
      (stored) => stored.idempotencyKey === key,
    );
    return found ? structuredClone(found) : null;
  }

  async insertIfNew(lead: NewLead): Promise<{ lead: Lead; created: boolean }> {
    const existing = [...this.leads.values()].find(
      (stored) => stored.idempotencyKey === lead.idempotencyKey,
    );
    if (existing) {
      return { lead: structuredClone(existing), created: false };
    }
    const stored: Lead = { id: randomUUID(), ...structuredClone(lead) };
    this.leads.set(stored.id, stored);
    return { lead: structuredClone(stored), created: true };
  }

  async claimDue(
    channel: ChannelName,
    now: Date,
    leaseMs: number,
  ): Promise<Lead | null> {
    const due = [...this.leads.values()]
      .filter(({ delivery }) => {
        const d = delivery[channel];
        return (
          d.status === 'pending' &&
          d.nextAttemptAt <= now &&
          (!d.leaseUntil || d.leaseUntil <= now)
        );
      })
      .sort(
        (a, b) =>
          a.delivery[channel].nextAttemptAt.getTime() -
          b.delivery[channel].nextAttemptAt.getTime(),
      )[0];
    if (!due) {
      return null;
    }
    due.delivery[channel].leaseUntil = new Date(now.getTime() + leaseMs);
    return structuredClone(due);
  }

  async markSent(id: string, channel: ChannelName, now: Date): Promise<void> {
    const d = this.require(id).delivery[channel];
    Object.assign(d, { status: 'sent', sentAt: now, attempts: d.attempts + 1 });
    delete d.leaseUntil;
    delete d.lastError;
  }

  async markFailed(
    id: string,
    channel: ChannelName,
    attempts: number,
    error: string,
    nextAttemptAt: Date | null,
  ): Promise<void> {
    const d = this.require(id).delivery[channel];
    d.status = nextAttemptAt ? 'pending' : 'failed';
    d.attempts = attempts;
    d.lastError = error;
    if (nextAttemptAt) {
      d.nextAttemptAt = nextAttemptAt;
    }
    delete d.leaseUntil;
  }

  private require(id: string): Lead {
    const lead = this.leads.get(id);
    if (!lead) {
      throw new Error(`No lead ${id}`);
    }
    return lead;
  }
}
