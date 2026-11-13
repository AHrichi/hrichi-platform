import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import Dexie from 'dexie';
import { Injector, runInInjectionContext } from '@angular/core';
import * as v from 'valibot';
import { APP_MODE, type AppMode } from '@ah/platform/app-mode';
import {
  StudyLmSyncRequestSchema,
  type StudySubject,
} from '@ah/products/studylm/domain';
import {
  type GeneratedLessonRecord,
  StudyLmDatabase,
  StudyLmStorageService,
} from './studylm-storage.service';

const SUBJECT: StudySubject = {
  id: 'subj_graphs',
  title: 'Graphs',
  sources: [],
  overview: null,
  flashcards: [],
  quizQuestions: [],
  createdAt: '2026-10-01T08:00:00.000Z',
};

const GENERATED_LESSON: GeneratedLessonRecord = {
  id: 'gen-subj_graphs-sec-1',
  subjectId: 'subj_graphs',
  sectionId: 'sec-1',
  draft: {
    outline: {
      title: 'BFS Traversal',
      minutes: 6,
      objectives: ['Understand level-order traversal'],
      sections: [],
    },
    tier: 'beginner',
    blocks: {},
    provider: 'groq',
  },
  lesson: {
    id: 'gen-subj_graphs-sec-1',
    title: 'BFS Traversal',
    tier: 'beginner',
    minutes: 6,
    objectives: ['Understand level-order traversal'],
    sections: [],
  },
  generatedAt: '2026-10-02T09:00:00.000Z',
};

function storage(mode: AppMode): StudyLmStorageService {
  const injector = Injector.create({
    providers: [{ provide: APP_MODE, useValue: mode }],
  });
  return runInInjectionContext(injector, () => new StudyLmStorageService());
}

async function names(): Promise<string[]> {
  return (await indexedDB.databases()).map((db) => db.name ?? '').sort();
}

beforeEach(() => {
  // Every test starts on an origin with no databases.
  const factory = new IDBFactory();
  Object.assign(globalThis, { indexedDB: factory });
  Object.assign(Dexie.dependencies, { indexedDB: factory });
});

describe('StudyLmStorageService', () => {
  it('keeps subjects in StudyLM’s own database when standalone', async () => {
    await storage('standalone').saveSubject(SUBJECT);
    expect(await names()).toEqual(['StudyLmDatabase']);
  });

  it('gives the portfolio’s demo a database of its own and never queues sync outbox', async () => {
    const service = storage('embedded-demo');
    await service.saveSubject(SUBJECT);
    expect(await names()).toEqual(['ah-demo-studylm']);
    expect(await service.getSubject(SUBJECT.id)).toEqual(SUBJECT);
    const batch = await service.readOutboxBatch();
    expect(batch.acknowledged).toEqual([]);
  });

  it('keeps the subjects a browser saved in the portfolio before', async () => {
    const before = new StudyLmDatabase();
    await before.subjects.put(SUBJECT);
    before.close();

    expect(await storage('embedded-demo').getAllSubjects()).toEqual([SUBJECT]);
    expect(await names()).toEqual(['StudyLmDatabase']);
  });

  it('keeps lesson progress across visits', async () => {
    const progress = {
      lessonId: 'binary-search',
      steps: { 'search-array': 3 },
      checks: { 'first-guess': { answer: 2, correct: true } },
      completedAt: null,
      updatedAt: '2026-11-02T10:00:00.000Z',
    };
    await storage('embedded-demo').saveLessonProgress(progress);
    // A new visit opens the same database afresh.
    expect(
      await storage('embedded-demo').getLessonProgress('binary-search'),
    ).toEqual(progress);
  });

  it('backfills pre-existing local subjects and generated lessons for first-time sync', async () => {
    const v3 = new StudyLmDatabase();
    await v3.subjects.put(SUBJECT);
    await v3.lessons.put(GENERATED_LESSON);
    v3.close();

    const service = storage('standalone');
    await service.enqueueExistingForSync('2026-11-13T12:00:00.000Z');
    const batch = await service.readOutboxBatch();
    expect(batch.push.subjects).toHaveLength(1);
    expect(batch.push.lessons).toHaveLength(1);
    expect(batch.push.lessons[0]?.id).toBe(GENERATED_LESSON.id);

    // Calling backfill again does not re-queue already tracked entries.
    await service.acknowledgeOutbox(batch.acknowledged);
    await service.enqueueExistingForSync('2026-11-13T12:05:00.000Z');
    expect((await service.readOutboxBatch()).acknowledged).toEqual([]);
  });

  it('applies pulled subjects/lessons/deletions and preserves newer in-flight local edits', async () => {
    const service = storage('standalone');
    await service.saveSubject(SUBJECT, { now: '2026-11-13T10:00:00.000Z' });
    const snapshot = await service.readOutboxBatch();

    // User edits again while the first snapshot is still being acknowledged.
    await service.saveSubject(
      { ...SUBJECT, title: 'Graphs (Edited)' },
      { now: '2026-11-13T10:01:00.000Z' },
    );
    await service.acknowledgeOutbox(snapshot.acknowledged);
    const remaining = await service.readOutboxBatch();
    expect(remaining.push.subjects).toHaveLength(1);
    expect(remaining.push.subjects[0]?.title).toBe('Graphs (Edited)');

    const applied = await service.applySyncPull([
      {
        kind: 'lesson',
        id: GENERATED_LESSON.id,
        seq: 1,
        by: 'device-b',
        updatedAt: '2026-11-13T11:00:00.000Z',
        data: {
          id: GENERATED_LESSON.id,
          subjectId: GENERATED_LESSON.subjectId,
          sectionId: GENERATED_LESSON.sectionId,
          draft: GENERATED_LESSON.draft as unknown as Record<string, unknown>,
          lesson: GENERATED_LESSON.lesson as unknown as Record<string, unknown>,
          generatedAt: GENERATED_LESSON.generatedAt,
          updatedAt: '2026-11-13T11:00:00.000Z',
          deletedAt: null,
        },
      },
      // Older remote subject must not overwrite newer local edit.
      {
        kind: 'subject',
        id: SUBJECT.id,
        seq: 2,
        by: 'device-b',
        updatedAt: '2026-11-13T09:59:00.000Z',
        data: {
          ...SUBJECT,
          title: 'Stale Graphs',
          updatedAt: '2026-11-13T09:59:00.000Z',
          deletedAt: null,
        },
      },
    ]);

    expect(applied.lessonsChanged).toBe(true);
    expect(applied.subjectsChanged).toBe(false);
    expect(await service.getGeneratedLesson(GENERATED_LESSON.id)).toEqual(
      GENERATED_LESSON,
    );
    expect((await service.getSubject(SUBJECT.id))?.title).toBe(
      'Graphs (Edited)',
    );
  });

  it('normalizes legacy or pre-queued syncOutbox records so batches always match the sync contract', async () => {
    const db = new StudyLmDatabase();
    await db.syncOutbox.put({
      key: 'progress:gen-step-minus-one',
      kind: 'progress',
      id: 'gen-step-minus-one',
      updatedAt: '2026-11-13T12:00:00.000Z',
      data: {
        lessonId: 'gen-step-minus-one',
        steps: { visual: -1 },
        checks: { c1: { answer: undefined, correct: true } },
        completedAt: null,
        updatedAt: '2026-11-13T12:00:00.000Z',
      },
    });
    db.close();

    const service = storage('standalone');
    const batch = await service.readOutboxBatch();
    const parsed = v.safeParse(StudyLmSyncRequestSchema, {
      cursor: 0,
      push: batch.push,
    });
    expect(parsed.success).toBe(true);
    expect(batch.push.progress[0]?.steps).toEqual({ visual: -1 });
  });
});
