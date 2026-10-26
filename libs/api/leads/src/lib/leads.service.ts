import { randomUUID } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import type { LeadRequest, LeadResponse } from '@ah/shared/contracts';
import type { LeadChannel } from './channels';
import { DeliveryService, initialDelivery } from './delivery.service';
import type { HumanVerifier } from './human-verifier';
import type { LeadsRepository } from './leads.repository';

export class LeadsService {
  constructor(
    private readonly repository: LeadsRepository,
    private readonly verifier: HumanVerifier,
    private readonly delivery: DeliveryService,
    private readonly channels: readonly LeadChannel[],
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /**
   * Stores the lead first (so it can't be lost), then tries every channel
   * once; anything that fails is retried by the outbox sweep.
   */
  async create(input: LeadRequest, ip?: string): Promise<LeadResponse> {
    if (input.website) {
      // Honeypot filled in: answer like a success, store nothing.
      return { id: randomUUID(), status: 'accepted' };
    }
    // A retry of a lead we already stored: Turnstile tokens are single-use, so
    // verifying again would fail. The stored lead was verified when it arrived.
    const existing = await this.repository.findByIdempotencyKey(
      input.idempotencyKey,
    );
    if (existing) {
      return { id: existing.id, status: 'accepted' };
    }
    const verification = await this.verifier.verify(input.turnstileToken, ip);
    if (verification === 'failed') {
      throw new ForbiddenException('Human verification failed');
    }
    const now = this.clock();
    const { lead, created } = await this.repository.insertIfNew({
      idempotencyKey: input.idempotencyKey,
      name: input.name.trim(),
      email: input.email.trim(),
      message: input.message.trim(),
      intent: input.intent,
      audience: input.audience,
      humanCheck: verification,
      createdAt: now,
      delivery: initialDelivery(this.channels, now),
    });
    if (created) {
      await this.delivery.deliverNew(lead);
    }
    return { id: lead.id, status: 'accepted' };
  }
}
