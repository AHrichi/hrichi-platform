import {
  emptyPush,
  FIXTURE_IDS,
  MIN_SECRET_LENGTH,
  sampleConcept,
  sampleEvent,
  sampleTeachBack,
  sampleTopic,
  SYNC_LIMITS,
  type SyncRequest,
  verifyDeviceToken,
} from '@ah/learning/domain';
import { SyncService } from './sync.service';
import { InMemoryLearningRepository } from './testing/in-memory-learning.repository';

const secret = 's'.repeat(MIN_SECRET_LENGTH);
const now = new Date('2026-11-11T09:00:00Z');
const farExpiry = new Date('2027-05-01T00:00:00Z');
const deviceA = { deviceId: FIXTURE_IDS.deviceA, tokenExpiresAt: farExpiry };
const deviceB = { deviceId: FIXTURE_IDS.deviceB, tokenExpiresAt: farExpiry };

function setup() {
  const repository = new InMemoryLearningRepository();
  const service = new SyncService(repository, secret, () => now);
  return { repository, service };
}

function push(
  cursor: number,
  changes: Partial<SyncRequest['push']>,
): SyncRequest {
  return { cursor, push: { ...emptyPush(), ...changes } };
}

describe('SyncService', () => {
  it('carries a concept from one device to another', async () => {
    const { service } = setup();
    const first = await service.sync(
      deviceA,
      push(0, { topics: [sampleTopic()], concepts: [sampleConcept()] }),
    );
    // A doesn't get its own writes back.
    expect(first.pull).toEqual([]);
    expect(first.cursor).toBe(2);

    const second = await service.sync(deviceB, push(0, {}));
    expect(second.pull.map((record) => [record.kind, record.by])).toEqual([
      ['topic', FIXTURE_IDS.deviceA],
      ['concept', FIXTURE_IDS.deviceA],
    ]);
    expect(second.pull[1].data).toEqual(sampleConcept());
    expect(second.cursor).toBe(2);
    expect(second.more).toBe(false);
  });

  it('keeps the newest edit whichever device syncs last', async () => {
    const { service, repository } = setup();
    await service.sync(deviceA, push(0, { concepts: [sampleConcept()] }));

    const newer = sampleConcept({
      title: 'Opportunity cost (edited on B)',
      updatedAt: '2026-11-11T08:30:00.000Z',
    });
    const older = sampleConcept({
      title: 'Opportunity cost (edited on A, offline)',
      updatedAt: '2026-11-11T08:10:00.000Z',
    });
    await service.sync(deviceB, push(1, { concepts: [newer] }));
    const fromA = await service.sync(deviceA, push(1, { concepts: [older] }));

    // A's older edit lost, and A receives B's version.
    expect(fromA.pull).toHaveLength(1);
    expect(fromA.pull[0].data).toMatchObject({
      title: 'Opportunity cost (edited on B)',
    });
    const stored = repository.records.get(`concept:${FIXTURE_IDS.concept}`);
    expect(stored?.by).toBe(FIXTURE_IDS.deviceB);
  });

  it('stores an event once however often it is pushed', async () => {
    const { service, repository } = setup();
    await service.sync(deviceA, push(0, { events: [sampleEvent()] }));
    const retry = await service.sync(
      deviceA,
      push(0, { events: [sampleEvent({ rating: 'again' })] }),
    );
    expect(repository.records.size).toBe(1);
    // The retry sees the first copy (it wasn't written by this request).
    expect(retry.pull[0].data).toMatchObject({ rating: 'good' });
  });

  it('carries a teach-back to the other device, once', async () => {
    const { service, repository } = setup();
    await service.sync(deviceA, push(0, { teachbacks: [sampleTeachBack()] }));
    await service.sync(deviceA, push(0, { teachbacks: [sampleTeachBack()] }));
    expect(repository.records.size).toBe(1);
    const pulled = await service.sync(deviceB, push(0, {}));
    expect(pulled.pull).toEqual([
      expect.objectContaining({ kind: 'teachback', by: FIXTURE_IDS.deviceA }),
    ]);
  });

  it('refuses versions stamped far in the future', async () => {
    const { service, repository } = setup();
    const response = await service.sync(
      deviceA,
      push(0, {
        concepts: [sampleConcept({ updatedAt: '2026-11-11T10:00:00.000Z' })],
      }),
    );
    expect(response.rejected).toEqual([
      { kind: 'concept', id: FIXTURE_IDS.concept, reason: 'clock_ahead' },
    ]);
    expect(repository.records.size).toBe(0);
  });

  it('pages a long feed and resumes from the cursor', async () => {
    const { service } = setup();
    const events = Array.from({ length: SYNC_LIMITS.pull + 5 }, (_, i) =>
      sampleEvent({ id: crypto.randomUUID(), ms: i }),
    );
    await service.sync(deviceA, push(0, { events }));

    const page1 = await service.sync(deviceB, push(0, {}));
    expect(page1.pull).toHaveLength(SYNC_LIMITS.pull);
    expect(page1.more).toBe(true);
    const page2 = await service.sync(deviceB, push(page1.cursor, {}));
    expect(page2.pull).toHaveLength(5);
    expect(page2.more).toBe(false);
  });

  it('runs concurrent syncs one after another', async () => {
    const { service } = setup();
    const [a, b] = await Promise.all([
      service.sync(deviceA, push(0, { topics: [sampleTopic()] })),
      service.sync(deviceB, push(0, {})),
    ]);
    expect(a.cursor).toBe(1);
    // B ran after A had written, so it sees the topic.
    expect(b.pull).toHaveLength(1);
  });

  it('renews a token that runs out within 30 days', async () => {
    const { service } = setup();
    const soon = {
      deviceId: FIXTURE_IDS.deviceA,
      tokenExpiresAt: new Date('2026-11-20T00:00:00Z'),
    };
    const renewed = (await service.sync(soon, push(0, {}))).renewedToken;
    expect(renewed).not.toBeNull();
    const claims = await verifyDeviceToken(secret, renewed?.token ?? '', now);
    expect(claims?.deviceId).toBe(FIXTURE_IDS.deviceA);
    expect((await service.sync(deviceA, push(0, {}))).renewedToken).toBeNull();
  });
});
