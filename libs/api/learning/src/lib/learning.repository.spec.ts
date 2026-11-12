import { MongoClient } from 'mongodb';
import { FIXTURE_IDS, sampleConcept, sampleEvent } from '@ah/learning/domain';
import type { LearningRepository, StoredRecord } from './learning.repository';
import { MongoLearningRepository } from './mongo-learning.repository';
import { InMemoryLearningRepository } from './testing/in-memory-learning.repository';

/**
 * One contract, two implementations. The Mongo run needs MONGODB_TEST_URI
 * (CI starts a MongoDB service container); it is skipped otherwise.
 */
function contract(
  name: string,
  make: () => Promise<{
    repository: LearningRepository;
    done: () => Promise<void>;
  }>,
) {
  describe(name, () => {
    let repository: LearningRepository;
    let done: () => Promise<void>;

    beforeEach(async () => {
      ({ repository, done } = await make());
    });
    afterEach(() => done());

    const conceptVersion = (
      seq: number,
      updatedAt: string,
      by: string = FIXTURE_IDS.deviceA,
    ): StoredRecord<'concept'> => ({
      kind: 'concept',
      id: FIXTURE_IDS.concept,
      seq,
      by,
      updatedAt,
      data: sampleConcept({ updatedAt, title: `v${seq}` }),
    });

    it('hands out increasing sequence numbers', async () => {
      const first = await repository.nextSeq();
      expect(await repository.nextSeq()).toBe(first + 1);
    });

    it('keeps the version that wins, as instants and then by writer', async () => {
      expect(
        await repository.putMutable(conceptVersion(1, '2026-11-11T08:00:00Z')),
      ).toBe('stored');
      expect(
        await repository.putMutable(conceptVersion(2, '2026-11-11T07:00:00Z')),
      ).toBe('kept');
      // 09:30+01:00 is 08:30Z: later, though it sorts earlier as text.
      expect(
        await repository.putMutable(
          conceptVersion(3, '2026-11-11T09:30:00+01:00'),
        ),
      ).toBe('stored');
      // Same instant: the larger writer id wins.
      expect(
        await repository.putMutable(
          conceptVersion(4, '2026-11-11T08:30:00Z', FIXTURE_IDS.deviceB),
        ),
      ).toBe('stored');
      expect(
        await repository.putMutable(
          conceptVersion(5, '2026-11-11T08:30:00Z', FIXTURE_IDS.deviceA),
        ),
      ).toBe('kept');

      const changes = await repository.changesSince(0, 10);
      expect(changes.map((record) => [record.seq, record.data])).toEqual([
        [4, expect.objectContaining({ title: 'v4' })],
      ]);
    });

    it('stores an append-only record once and pages the feed', async () => {
      const event: StoredRecord<'event'> = {
        kind: 'event',
        id: FIXTURE_IDS.event,
        seq: 7,
        by: FIXTURE_IDS.deviceA,
        updatedAt: sampleEvent().at,
        data: sampleEvent(),
      };
      expect(await repository.putAppendOnly(event)).toBe('stored');
      expect(await repository.putAppendOnly({ ...event, seq: 8 })).toBe('kept');
      await repository.putMutable(conceptVersion(9, '2026-11-11T08:00:00Z'));

      expect((await repository.changesSince(0, 1)).map((r) => r.seq)).toEqual([
        7,
      ]);
      expect((await repository.changesSince(7, 10)).map((r) => r.seq)).toEqual([
        9,
      ]);
      expect(
        (await repository.recordsOfKind('event')).map((r) => r.id),
      ).toEqual([FIXTURE_IDS.event]);
      expect(
        (await repository.recordsOfKind('concept')).map((r) => r.data.title),
      ).toEqual(['v9']);
    });

    it('tells a host app’s link from a device', async () => {
      const pairedAt = new Date('2026-11-11T08:00:00Z');
      await repository.createDevice({
        id: FIXTURE_IDS.deviceB,
        name: 'StudyLM on Chrome',
        host: 'studylm',
        pairedAt,
        lastSeenAt: null,
        revokedAt: null,
      });
      expect((await repository.findDevice(FIXTURE_IDS.deviceB))?.host).toBe(
        'studylm',
      );
      expect((await repository.listDevices()).map((d) => d.host)).toEqual([
        'studylm',
      ]);
    });

    it('keeps devices and pairings', async () => {
      const pairedAt = new Date('2026-11-11T08:00:00Z');
      await repository.createDevice({
        id: FIXTURE_IDS.deviceA,
        name: 'Phone',
        host: null,
        pairedAt,
        lastSeenAt: null,
        revokedAt: null,
      });
      await repository.touchDevice(FIXTURE_IDS.deviceA, pairedAt);
      expect(
        (await repository.findDevice(FIXTURE_IDS.deviceA))?.lastSeenAt,
      ).toEqual(pairedAt);
      expect(await repository.revokeDevice(FIXTURE_IDS.deviceA, pairedAt)).toBe(
        true,
      );
      expect(await repository.revokeDevice(FIXTURE_IDS.deviceA, pairedAt)).toBe(
        false,
      );

      await repository.createPairing({
        id: FIXTURE_IDS.session,
        deviceName: 'Laptop',
        codeHash: 'ab',
        expiresAt: new Date('2099-01-01T00:00:00Z'),
        attempts: 0,
      });
      expect(await repository.recordFailedAttempt(FIXTURE_IDS.session)).toBe(1);
      expect(await repository.recordFailedAttempt(FIXTURE_IDS.session)).toBe(2);
      await repository.deletePairing(FIXTURE_IDS.session);
      expect(await repository.findPairing(FIXTURE_IDS.session)).toBeNull();
    });
  });
}

contract('InMemoryLearningRepository', async () => ({
  repository: new InMemoryLearningRepository(),
  done: async () => undefined,
}));

const uri = process.env['MONGODB_TEST_URI'];
describe.skipIf(!uri)('with MongoDB', () => {
  contract('MongoLearningRepository', async () => {
    const client = await MongoClient.connect(uri as string);
    const db = client.db(
      `learning_test_${Date.now()}_${Math.random().toString(36).slice(2)}`,
    );
    const repository = new MongoLearningRepository(db);
    await repository.ensureIndexes();
    return {
      repository,
      done: async () => {
        await db.dropDatabase();
        await client.close();
      },
    };
  });
});
