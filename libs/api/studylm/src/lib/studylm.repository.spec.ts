import { MongoClient } from 'mongodb';
import type { SyncedSubjectRecord } from '@ah/products/studylm/domain';
import { MongoStudyLmRepository } from './mongo-studylm.repository';
import type {
  StoredStudyLmRecord,
  StudyLmRepository,
} from './studylm.repository';
import { InMemoryStudyLmRepository } from './testing/in-memory-studylm.repository';

function subjectRecord(
  seq: number,
  updatedAt: string,
  by = 'device-a',
  title = `Subject v${seq}`,
): StoredStudyLmRecord<'subject'> {
  const data: SyncedSubjectRecord = {
    id: 'subj-1',
    title,
    sources: [],
    overview: null,
    flashcards: [],
    quizQuestions: [],
    createdAt: '2026-11-10T08:00:00.000Z',
    updatedAt,
    deletedAt: null,
  };
  return { kind: 'subject', id: 'subj-1', seq, by, updatedAt, data };
}

function contract(
  name: string,
  make: () => Promise<{
    repository: StudyLmRepository;
    done: () => Promise<void>;
  }>,
) {
  describe(name, () => {
    let repository: StudyLmRepository;
    let done: () => Promise<void>;

    beforeEach(async () => {
      ({ repository, done } = await make());
    });
    afterEach(() => done());

    it('issues monotonic sequence numbers', async () => {
      const first = await repository.nextSeq();
      expect(await repository.nextSeq()).toBe(first + 1);
    });

    it('keeps the winning version across timestamps and device tie-breaks', async () => {
      expect(
        await repository.putRecord(
          subjectRecord(1, '2026-11-13T08:00:00.000Z', 'device-a'),
        ),
      ).toBe('stored');
      expect(
        await repository.putRecord(
          subjectRecord(2, '2026-11-13T07:00:00.000Z', 'device-b'),
        ),
      ).toBe('kept');
      expect(
        await repository.putRecord(
          subjectRecord(3, '2026-11-13T10:30:00+02:00', 'device-a'),
        ),
      ).toBe('stored');
      expect(
        await repository.putRecord(
          subjectRecord(4, '2026-11-13T08:30:00.000Z', 'device-b'),
        ),
      ).toBe('stored');
      expect(
        await repository.putRecord(
          subjectRecord(5, '2026-11-13T08:30:00.000Z', 'device-a'),
        ),
      ).toBe('kept');

      const changes = await repository.changesSince(0, 10);
      expect(changes).toHaveLength(1);
      expect(changes[0]?.seq).toBe(4);
      expect(changes[0]?.data).toMatchObject({ title: 'Subject v4' });
    });

    it('manages paired devices and temporary pairing attempts', async () => {
      const now = new Date('2026-11-13T12:00:00.000Z');
      await repository.createPairing({
        id: 'pair-1',
        deviceName: 'Phone',
        codeHash: 'hash',
        expiresAt: new Date(now.getTime() + 60_000),
        attempts: 0,
      });
      expect(await repository.recordFailedAttempt('pair-1')).toBe(1);
      await repository.deletePairing('pair-1');
      expect(await repository.findPairing('pair-1')).toBeNull();

      await repository.createDevice({
        id: 'dev-1',
        name: 'Phone',
        pairedAt: now,
        lastSeenAt: null,
        revokedAt: null,
      });
      expect(await repository.revokeDevice('dev-1', now)).toBe(true);
      expect(await repository.revokeDevice('dev-1', now)).toBe(false);
    });
  });
}

contract('InMemoryStudyLmRepository', async () => ({
  repository: new InMemoryStudyLmRepository(),
  done: async () => undefined,
}));

const mongoUri = process.env['MONGODB_TEST_URI'];
if (mongoUri) {
  contract('MongoStudyLmRepository', async () => {
    const client = await MongoClient.connect(mongoUri);
    const db = client.db(
      `studylm_test_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    );
    const repository = new MongoStudyLmRepository(db);
    await repository.ensureIndexes();
    return {
      repository,
      done: async () => {
        await db.dropDatabase();
        await client.close();
      },
    };
  });
}
