import type { LeadChannel } from './channels';
import type { Delivery, Lead } from './lead';
import type { LeadsRepository } from './leads.repository';

/** Wait after the 1st, 2nd, … failed attempt; after the last one we give up. */
export const retryDelaysMs = [
  60_000,
  5 * 60_000,
  15 * 60_000,
  60 * 60_000,
  3 * 3_600_000,
  6 * 3_600_000,
  12 * 3_600_000,
  24 * 3_600_000,
];

const leaseMs = 60_000;

/** Initial delivery state: configured channels start pending, due now. */
export function initialDelivery(
  channels: readonly LeadChannel[],
  now: Date,
): Lead['delivery'] {
  const state = (enabled: boolean): Delivery => ({
    status: enabled ? 'pending' : 'disabled',
    attempts: 0,
    nextAttemptAt: now,
  });
  const enabled = (name: string) =>
    channels.some((channel) => channel.name === name && channel.enabled);
  return { telegram: state(enabled('telegram')), n8n: state(enabled('n8n')) };
}

/** Sends stored leads to their channels and retries failures (the outbox). */
export class DeliveryService {
  constructor(
    private readonly repository: LeadsRepository,
    private readonly channels: readonly LeadChannel[],
    private readonly clock: () => Date = () => new Date(),
  ) {}

  /** First attempt right after a lead is stored. Never throws. */
  async deliverNew(lead: Lead): Promise<void> {
    await Promise.all(
      this.channels
        .filter(
          (channel) =>
            channel.enabled && lead.delivery[channel.name].status === 'pending',
        )
        .map((channel) => this.attempt(lead, channel)),
    );
  }

  /** Retries due deliveries; returns how many attempts it made. */
  async sweep(limit = 20): Promise<number> {
    let attempts = 0;
    for (const channel of this.channels.filter((c) => c.enabled)) {
      while (attempts < limit) {
        const lead = await this.repository.claimDue(
          channel.name,
          this.clock(),
          leaseMs,
        );
        if (!lead) {
          break;
        }
        await this.attempt(lead, channel);
        attempts++;
      }
    }
    return attempts;
  }

  private async attempt(lead: Lead, channel: LeadChannel): Promise<void> {
    try {
      await channel.send(lead);
      await this.repository.markSent(lead.id, channel.name, this.clock());
    } catch (error) {
      const attempts = lead.delivery[channel.name].attempts + 1;
      const delay = retryDelaysMs[attempts - 1];
      await this.repository.markFailed(
        lead.id,
        channel.name,
        attempts,
        error instanceof Error ? error.message : String(error),
        delay === undefined ? null : new Date(this.clock().getTime() + delay),
      );
    }
  }
}
