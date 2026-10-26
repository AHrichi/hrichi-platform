import {
  DeliveryService,
  initialDelivery,
  retryDelaysMs,
} from './delivery.service';
import type { NewLead } from './lead';
import { FakeChannel } from './testing/fakes';
import { InMemoryLeadsRepository } from './testing/in-memory-leads.repository';

function newLead(now: Date, channels: FakeChannel[]): NewLead {
  return {
    idempotencyKey: crypto.randomUUID(),
    name: 'Ada',
    email: 'ada@example.com',
    message: 'Hello',
    intent: 'project',
    humanCheck: 'passed',
    createdAt: now,
    delivery: initialDelivery(channels, now),
  };
}

describe('DeliveryService', () => {
  it('marks channels that are not configured as disabled', () => {
    const delivery = initialDelivery(
      [new FakeChannel('telegram'), new FakeChannel('n8n', false)],
      new Date(),
    );

    expect(delivery.telegram.status).toBe('pending');
    expect(delivery.n8n.status).toBe('disabled');
  });

  it('retries with backoff on each sweep and gives up after the last delay', async () => {
    const repository = new InMemoryLeadsRepository();
    const n8n = new FakeChannel('n8n');
    n8n.failWith = 'offline';
    let now = new Date('2026-10-26T00:00:00Z');
    const service = new DeliveryService(repository, [n8n], () => now);
    const { lead } = await repository.insertIfNew(newLead(now, [n8n]));

    for (const delay of retryDelaysMs) {
      expect(await service.sweep()).toBe(1);
      const state = repository.leads.get(lead.id)?.delivery.n8n;
      expect(state?.nextAttemptAt.getTime()).toBe(now.getTime() + delay);
      // Not due yet: nothing to do until the backoff has passed.
      expect(await service.sweep()).toBe(0);
      now = new Date(now.getTime() + delay);
    }

    expect(await service.sweep()).toBe(1);
    expect(repository.leads.get(lead.id)?.delivery.n8n).toMatchObject({
      status: 'failed',
      attempts: retryDelaysMs.length + 1,
    });
    expect(await service.sweep()).toBe(0);
  });

  it('delivers on a later sweep once the channel recovers', async () => {
    const repository = new InMemoryLeadsRepository();
    const telegram = new FakeChannel('telegram');
    telegram.failWith = 'offline';
    let now = new Date('2026-10-26T00:00:00Z');
    const service = new DeliveryService(repository, [telegram], () => now);
    const { lead } = await repository.insertIfNew(newLead(now, [telegram]));

    await service.sweep();
    telegram.failWith = null;
    now = new Date(now.getTime() + retryDelaysMs[0]);
    await service.sweep();

    expect(repository.leads.get(lead.id)?.delivery.telegram).toMatchObject({
      status: 'sent',
      attempts: 2,
    });
    expect(telegram.sent).toHaveLength(1);
  });

  it('skips deliveries leased by another worker', async () => {
    const repository = new InMemoryLeadsRepository();
    const telegram = new FakeChannel('telegram');
    const now = new Date('2026-10-26T00:00:00Z');
    await repository.insertIfNew(newLead(now, [telegram]));

    await repository.claimDue('telegram', now, 60_000);
    const service = new DeliveryService(repository, [telegram], () => now);

    expect(await service.sweep()).toBe(0);
  });
});
