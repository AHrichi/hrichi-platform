import * as v from 'valibot';
import {
  emptyStudyLmPush,
  incomingStudyLmWins,
  isStudyLmFutureTimestamp,
  isSyncedSettingKey,
  normalizeStudyLmRecord,
  StudyLmPairingConfirmSchema,
  StudyLmPairingStartSchema,
  StudyLmSyncRequestSchema,
} from './sync.model';

describe('StudyLM sync domain contracts', () => {
  it('validates pairing payloads', () => {
    expect(
      v.parse(StudyLmPairingStartSchema, { deviceName: '  Work Laptop  ' }),
    ).toEqual({ deviceName: 'Work Laptop' });
    expect(
      v.safeParse(StudyLmPairingStartSchema, { deviceName: '' }).success,
    ).toBe(false);
    expect(
      v.safeParse(StudyLmPairingConfirmSchema, { code: '123456' }).success,
    ).toBe(true);
    expect(
      v.safeParse(StudyLmPairingConfirmSchema, { code: 'abc123' }).success,
    ).toBe(false);
  });

  it('validates full sync push payloads and rejects invalid settings keys', () => {
    const valid = v.safeParse(StudyLmSyncRequestSchema, {
      cursor: 0,
      push: {
        ...emptyStudyLmPush(),
        subjects: [
          {
            id: 'subj-1',
            title: 'Distributed Systems',
            sources: [],
            overview: null,
            flashcards: [],
            quizQuestions: [],
            createdAt: '2026-11-13T10:00:00.000Z',
            updatedAt: '2026-11-13T10:05:00.000Z',
            deletedAt: null,
          },
        ],
        lessons: [
          {
            id: 'gen-subj-1-sec-1',
            subjectId: 'subj-1',
            sectionId: 'sec-1',
            draft: { tier: 'intermediate', blocks: {} },
            lesson: {
              id: 'gen-subj-1-sec-1',
              title: 'Consensus',
              sections: [],
            },
            generatedAt: '2026-11-13T10:06:00.000Z',
            updatedAt: '2026-11-13T10:06:00.000Z',
          },
        ],
        progress: [
          {
            lessonId: 'gen-subj-1-sec-1',
            steps: { visual: 2 },
            checks: { check1: { answer: 0, correct: true } },
            completedAt: null,
            updatedAt: '2026-11-13T10:07:00.000Z',
          },
        ],
        settings: [
          {
            key: 'activeSubjectId',
            value: 'subj-1',
            updatedAt: '2026-11-13T10:05:00.000Z',
          },
        ],
      },
    });
    expect(valid.success).toBe(true);

    const badSetting = v.safeParse(StudyLmSyncRequestSchema, {
      cursor: 0,
      push: {
        ...emptyStudyLmPush(),
        settings: [
          {
            key: 'studylm_n8n_config',
            value: { mode: 'local' },
            updatedAt: '2026-11-13T10:05:00.000Z',
          },
        ],
      },
    });
    expect(badSetting.success).toBe(false);
    expect(isSyncedSettingKey('activeSubjectId')).toBe(true);
    expect(isSyncedSettingKey('studylm_n8n_config')).toBe(false);
  });

  it('compares versions chronologically with writer tie-break and checks clock skew', () => {
    expect(
      incomingStudyLmWins(
        { updatedAt: '2026-11-13T09:00:00.000Z', by: 'device-a' },
        { updatedAt: '2026-11-13T10:30:00+02:00', by: 'device-b' },
      ),
    ).toBe(false);
    expect(
      incomingStudyLmWins(
        { updatedAt: '2026-11-13T09:00:00.000Z', by: 'device-a' },
        { updatedAt: '2026-11-13T09:00:00.000Z', by: 'device-b' },
      ),
    ).toBe(true);
    expect(
      isStudyLmFutureTimestamp(
        '2026-11-13T10:10:00.000Z',
        new Date('2026-11-13T10:00:00.000Z'),
      ),
    ).toBe(true);
    expect(
      isStudyLmFutureTimestamp(
        '2026-11-13T10:02:00.000Z',
        new Date('2026-11-13T10:00:00.000Z'),
      ),
    ).toBe(false);
  });

  it('accepts StepTimeline -1 indices, omitted optional answers/overviews, and normalizes legacy records', () => {
    const legacySubject = normalizeStudyLmRecord(
      'subject',
      'subj-legacy',
      {
        id: 'subj-legacy',
        title: 'Legacy Subject',
        flashcards: [{ front: 'Q', back: 'A' }],
      },
      '2026-11-13T10:00:00.000Z',
    );
    const legacyProgress = normalizeStudyLmRecord(
      'progress',
      'gen-legacy',
      {
        lessonId: 'gen-legacy',
        steps: { v1: -1, v2: 1.9, bad: 'NaN' },
        checks: { c1: { correct: true } },
      },
      '2026-11-13T10:00:00.000Z',
    );

    const parsed = v.safeParse(StudyLmSyncRequestSchema, {
      cursor: 0,
      push: {
        ...emptyStudyLmPush(),
        subjects: [legacySubject],
        progress: [legacyProgress],
      },
    });
    expect(parsed.success).toBe(true);
    expect(legacyProgress.steps).toEqual({ v1: -1, v2: 1 });
    expect(legacyProgress.checks['c1']?.answer).toBeNull();
  });
});
