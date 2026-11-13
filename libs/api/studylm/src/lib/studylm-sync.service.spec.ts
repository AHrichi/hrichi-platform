import { verifyDeviceToken } from '@ah/learning/domain';
import {
  emptyStudyLmPush,
  type SyncedGeneratedLessonRecord,
  type SyncedLessonProgressRecord,
  type SyncedSubjectRecord,
} from '@ah/products/studylm/domain';
import { StudyLmSyncService } from './studylm-sync.service';
import { InMemoryStudyLmRepository } from './testing/in-memory-studylm.repository';

const SECRET = 'a-test-secret-that-is-at-least-32-chars';
const NOW = new Date('2026-11-13T12:00:00.000Z');
const FAR_EXPIRY = new Date('2027-05-01T00:00:00.000Z');
const DEVICE_A = {
  deviceId: '11111111-1111-4111-8111-111111111111',
  tokenExpiresAt: FAR_EXPIRY,
};
const DEVICE_B = {
  deviceId: '22222222-2222-4222-8222-222222222222',
  tokenExpiresAt: FAR_EXPIRY,
};

function sampleSubject(
  overrides: Partial<SyncedSubjectRecord> = {},
): SyncedSubjectRecord {
  return {
    id: 'subj-1',
    title: 'Distributed Systems',
    sources: [],
    overview: null,
    flashcards: [],
    quizQuestions: [],
    createdAt: '2026-11-13T10:00:00.000Z',
    updatedAt: '2026-11-13T10:05:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

function sampleLesson(
  overrides: Partial<SyncedGeneratedLessonRecord> = {},
): SyncedGeneratedLessonRecord {
  return {
    id: 'gen-subj-1-sec-1',
    subjectId: 'subj-1',
    sectionId: 'sec-1',
    draft: { tier: 'intermediate', provider: 'groq', blocks: {} },
    lesson: {
      id: 'gen-subj-1-sec-1',
      title: 'Raft Consensus',
      sections: [],
    },
    generatedAt: '2026-11-13T10:06:00.000Z',
    updatedAt: '2026-11-13T10:06:00.000Z',
    deletedAt: null,
    ...overrides,
  };
}

describe('StudyLmSyncService', () => {
  it('syncs subjects, generated lessons, progress, and settings across devices', async () => {
    const repo = new InMemoryStudyLmRepository();
    const service = new StudyLmSyncService(repo, SECRET, () => NOW);
    const progress: SyncedLessonProgressRecord = {
      lessonId: 'gen-subj-1-sec-1',
      steps: { v1: 3 },
      checks: { c1: { answer: 'leader', correct: true } },
      completedAt: '2026-11-13T10:15:00.000Z',
      updatedAt: '2026-11-13T10:15:00.000Z',
    };

    const pushReply = await service.sync(DEVICE_A, {
      cursor: 0,
      push: {
        subjects: [sampleSubject()],
        lessons: [sampleLesson()],
        progress: [progress],
        settings: [
          {
            key: 'activeSubjectId',
            value: 'subj-1',
            updatedAt: '2026-11-13T10:16:00.000Z',
          },
        ],
      },
    });
    expect(pushReply.pull).toEqual([]);
    expect(pushReply.cursor).toBe(4);
    expect(pushReply.more).toBe(false);

    const pullReply = await service.sync(DEVICE_B, {
      cursor: 0,
      push: emptyStudyLmPush(),
    });
    expect(pullReply.cursor).toBe(4);
    expect(pullReply.pull.map((r) => r.kind)).toEqual([
      'subject',
      'lesson',
      'progress',
      'setting',
    ]);
    expect(pullReply.pull[1]?.data).toMatchObject({
      id: 'gen-subj-1-sec-1',
      lesson: { title: 'Raft Consensus' },
    });
  });

  it('rejects future timestamps and renews expiring device tokens', async () => {
    const repo = new InMemoryStudyLmRepository();
    const service = new StudyLmSyncService(repo, SECRET, () => NOW);
    const reply = await service.sync(
      {
        deviceId: DEVICE_A.deviceId,
        tokenExpiresAt: new Date(NOW.getTime() + 5 * 24 * 60 * 60_000),
      },
      {
        cursor: 0,
        push: {
          ...emptyStudyLmPush(),
          lessons: [
            sampleLesson({
              updatedAt: '2026-11-13T13:00:00.000Z',
            }),
          ],
        },
      },
    );
    expect(reply.rejected).toEqual([
      { kind: 'lesson', id: 'gen-subj-1-sec-1', reason: 'clock_ahead' },
    ]);
    expect(reply.renewedToken).toBeDefined();
    const renewedToken = reply.renewedToken?.token ?? '';
    const claims = await verifyDeviceToken(SECRET, renewedToken, NOW);
    expect(claims?.deviceId).toBe(DEVICE_A.deviceId);
  });
});
