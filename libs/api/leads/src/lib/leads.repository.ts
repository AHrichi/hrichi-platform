import type { ChannelName, Lead, NewLead } from './lead';

export const LEADS_REPOSITORY = Symbol('LEADS_REPOSITORY');

export interface LeadsRepository {
  findByIdempotencyKey(key: string): Promise<Lead | null>;
  /** Stores the lead unless one with the same idempotency key exists. */
  insertIfNew(lead: NewLead): Promise<{ lead: Lead; created: boolean }>;
  /**
   * Atomically takes one due delivery for `channel` and leases it for
   * `leaseMs`, so a second worker (or n8n's backstop) skips it.
   */
  claimDue(
    channel: ChannelName,
    now: Date,
    leaseMs: number,
  ): Promise<Lead | null>;
  markSent(id: string, channel: ChannelName, now: Date): Promise<void>;
  /** Records a failed attempt; `nextAttemptAt: null` means give up. */
  markFailed(
    id: string,
    channel: ChannelName,
    attempts: number,
    error: string,
    nextAttemptAt: Date | null,
  ): Promise<void>;
}
