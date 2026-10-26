import { MongoClient, type Db } from 'mongodb';
import { initialDelivery } from './delivery.service';
import { MongoLeadsRepository } from './mongo-leads.repository';
import { FakeChannel } from './testing/fakes';

/**
 * Runs against a real MongoDB when MONGODB_TEST_URI is set (CI starts one as
 * a service container); skipped otherwise.
 */
const uri = process.env['MONGODB_TEST_URI'];

describe.skipIf(!uri)('MongoLeadsRepository (MongoDB)', () => {
  let client: MongoClient;
  let db: Db;
  let repository: MongoLeadsRepository;
  const now = new Date('2026-10-26T12:00:00Z');
  const channels = [new FakeChannel('telegram'), new FakeChannel('n8n')];
  const lead = (key: string) => ({
    idempotencyKey: key,
    name: 'Ada',
    email: 'ada@example.com',
    message: 'Hello',
    intent: 'role' as const,
    humanCheck: 'passed' as const,
    createdAt: now,
    delivery: initialDelivery(channels, now),
  });

  beforeAll(async () => {
    client = await MongoClient.connect(uri as string);
    db = client.db(`leads_test_${Date.now()}`);
    repository = new MongoLeadsRepository(db.collection('leads'));
    await repository.ensureIndexes();
  });

  // Each test starts empty, so one test's due deliveries can't be claimed by another.
  beforeEach(async () => {
    await db.collection('leads').deleteMany({});
  });

  afterAll(async () => {
    await db.dropDatabase();
    await client.close();
  });

  it('stores a lead once per idempotency key', async () => {
    const first = await repository.insertIfNew(lead('key-1'));
    const again = await repository.insertIfNew(lead('key-1'));

    expect(first.created).toBe(true);
    expect(again).toMatchObject({
      created: false,
      lead: { id: first.lead.id },
    });
  });

  it('claims a due delivery atomically, once, until the lease expires', async () => {
    const { lead: stored } = await repository.insertIfNew(lead('key-2'));

    const claims = await Promise.all(
      Array.from({ length: 5 }, () => repository.claimDue('n8n', now, 60_000)),
    );
    const winners = claims.filter((claim) => claim?.id === stored.id);

    expect(winners).toHaveLength(1);
    expect(await repository.claimDue('n8n', now, 60_000)).toBeNull();
    const later = new Date(now.getTime() + 61_000);
    expect((await repository.claimDue('n8n', later, 60_000))?.id).toBe(
      stored.id,
    );
  });

  it('records sends and failures', async () => {
    const { lead: stored } = await repository.insertIfNew(lead('key-3'));

    await repository.markSent(stored.id, 'telegram', now);
    await repository.markFailed(stored.id, 'n8n', 1, 'offline', null);

    const saved = await db
      .collection('leads')
      .findOne({ idempotencyKey: 'key-3' });
    expect(saved?.['delivery'].telegram).toMatchObject({
      status: 'sent',
      attempts: 1,
    });
    expect(saved?.['delivery'].n8n).toMatchObject({
      status: 'failed',
      attempts: 1,
      lastError: 'offline',
    });
  });
});
