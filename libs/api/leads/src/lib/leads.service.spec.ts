import { ForbiddenException } from '@nestjs/common';
import { DeliveryService } from './delivery.service';
import { LeadsService } from './leads.service';
import { FakeChannel, FakeVerifier, leadRequest } from './testing/fakes';
import { InMemoryLeadsRepository } from './testing/in-memory-leads.repository';

function setup() {
  const repository = new InMemoryLeadsRepository();
  const telegram = new FakeChannel('telegram');
  const n8n = new FakeChannel('n8n');
  const verifier = new FakeVerifier();
  const channels = [telegram, n8n];
  const now = new Date('2026-10-26T12:00:00Z');
  const service = new LeadsService(
    repository,
    verifier,
    new DeliveryService(repository, channels, () => now),
    channels,
    () => now,
  );
  return { service, repository, telegram, n8n, verifier };
}

describe('LeadsService', () => {
  it('stores the lead, then delivers it to every channel', async () => {
    const { service, repository, telegram, n8n } = setup();

    const response = await service.create(leadRequest(), '203.0.113.7');

    expect(response.status).toBe('accepted');
    const stored = repository.leads.get(response.id);
    expect(stored?.delivery.telegram.status).toBe('sent');
    expect(stored?.delivery.n8n.status).toBe('sent');
    expect(telegram.sent).toHaveLength(1);
    expect(n8n.sent[0].email).toBe('ada@example.com');
  });

  it('stores a retried submission once and delivers it once', async () => {
    const { service, repository, telegram } = setup();

    const first = await service.create(leadRequest());
    const retry = await service.create(leadRequest());

    expect(retry.id).toBe(first.id);
    expect(repository.leads.size).toBe(1);
    expect(telegram.sent).toHaveLength(1);
  });

  it('answers a retry of a stored lead without verifying its spent token again', async () => {
    const { service, repository, verifier } = setup();
    const first = await service.create(leadRequest());
    // Turnstile rejects reused tokens; a retry must not depend on it.
    verifier.result = 'failed';

    const retry = await service.create(leadRequest());

    expect(retry.id).toBe(first.id);
    expect(repository.leads.size).toBe(1);
  });

  it('keeps the lead when a channel is down, for the outbox to retry', async () => {
    const { service, repository, n8n } = setup();
    n8n.failWith = 'n8n answered 502';

    const { id } = await service.create(leadRequest());

    const delivery = repository.leads.get(id)?.delivery.n8n;
    expect(delivery).toMatchObject({
      status: 'pending',
      attempts: 1,
      lastError: 'n8n answered 502',
    });
    expect(delivery?.nextAttemptAt.toISOString()).toBe(
      '2026-10-26T12:01:00.000Z',
    );
  });

  it('rejects a failed human check without storing anything', async () => {
    const { service, repository, verifier } = setup();
    verifier.result = 'failed';

    await expect(service.create(leadRequest())).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(repository.leads.size).toBe(0);
  });

  it('keeps the lead, flagged, when Turnstile is unreachable', async () => {
    const { service, repository, verifier } = setup();
    verifier.result = 'unavailable';

    const { id } = await service.create(leadRequest());

    expect(repository.leads.get(id)?.humanCheck).toBe('unavailable');
  });

  it('answers the honeypot like a success but stores nothing', async () => {
    const { service, repository, telegram } = setup();

    const response = await service.create(
      leadRequest({ website: 'spam.example' }),
    );

    expect(response.status).toBe('accepted');
    expect(repository.leads.size).toBe(0);
    expect(telegram.sent).toHaveLength(0);
  });
});
