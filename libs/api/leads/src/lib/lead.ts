import type { LeadIntent, LeadRequest } from '@ah/shared/contracts';

/** Where a lead is delivered after it is stored. */
export type ChannelName = 'telegram' | 'n8n';

/** Delivery state per channel; together they form the outbox (ADR-0010). */
export interface Delivery {
  /** pending: due or retrying; sent; failed: gave up; disabled: not configured. */
  status: 'pending' | 'sent' | 'failed' | 'disabled';
  attempts: number;
  nextAttemptAt: Date;
  /** Set while a worker holds the delivery, so no one else sends it. */
  leaseUntil?: Date;
  lastError?: string;
  sentAt?: Date;
}

/** Result of the human check; `unavailable` keeps the lead but flags it. */
export type HumanCheck = 'passed' | 'unavailable';

export interface Lead {
  id: string;
  idempotencyKey: string;
  name: string;
  email: string;
  message: string;
  intent: LeadIntent;
  audience?: LeadRequest['audience'];
  humanCheck: HumanCheck;
  createdAt: Date;
  delivery: Record<ChannelName, Delivery>;
}

export type NewLead = Omit<Lead, 'id'>;
