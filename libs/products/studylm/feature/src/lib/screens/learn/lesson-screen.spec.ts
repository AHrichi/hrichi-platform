import '@angular/compiler';
import {
  Injector,
  PendingTasks,
  signal,
  ɵChangeDetectionScheduler,
  ɵEffectScheduler,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import type { Lesson } from '@ah/products/studylm/lessons';
import { APP_MODE } from '@ah/platform/app-mode';
import { PreferencesStore } from '@ah/shared/state';
import { LessonGenerationService } from '../../services/lesson-generation.service';
import { StudyLmReviews } from '../../services/studylm-reviews.service';
import { StudyLmStorageService } from '../../services/studylm-storage.service';
import { StudyLmScreens } from '../../shell/studylm-screens';
import { StudyLmStore } from '../../store/studylm.store';
import { LessonScreen } from './lesson-screen';

type LessonScreenTestable = {
  save(progress: {
    steps: Record<string, number>;
    checks: Record<string, { answer: unknown; correct: boolean }>;
    completedAt: string | null;
  }): void;
  data: { value: ReturnType<typeof signal<unknown>> };
};

describe('LessonScreen check reporting', () => {
  const sampleLesson: Lesson = {
    id: 'bfs',
    title: 'Breadth-First Search',
    tier: 'beginner',
    minutes: 10,
    objectives: ['Traverse graphs level by level'],
    sections: [
      {
        id: 'sec-1',
        title: 'Basics',
        blocks: [
          {
            id: 'chk-1',
            kind: 'quiz',
            question: 'Which structure drives BFS?',
            code: null,
            options: ['Stack', 'Queue'],
            correct: [1],
            explanation: 'FIFO visits nearest neighbors first.',
          },
          {
            id: 'chk-2',
            kind: 'predict',
            question: 'Distance to root?',
            options: ['0', '1'],
            answer: 0,
            expected: null,
            reveal: null,
            explanation: 'Start vertex is 0 hops away.',
          },
        ],
      },
    ],
    cards: [],
  };

  function setup(
    initialChecks: Record<string, { answer: unknown; correct: boolean }> = {},
  ) {
    const saveLessonProgress = vi.fn().mockResolvedValue(undefined);
    const lessonCheckAnswered = vi.fn();
    const lessonFinished = vi.fn().mockReturnValue(0);
    const noop = () => undefined;

    const injector = Injector.create({
      providers: [
        { provide: ɵChangeDetectionScheduler, useValue: { notify: noop } },
        { provide: ɵEffectScheduler, useValue: { add: noop } },
        { provide: PendingTasks, useValue: { add: () => noop } },
        { provide: APP_MODE, useValue: 'standalone' },
        { provide: Title, useValue: { setTitle: vi.fn() } },
        {
          provide: ActivatedRoute,
          useValue: {
            paramMap: of({
              get: (k: string) => (k === 'lessonId' ? 'bfs' : null),
            }),
          },
        },
        {
          provide: StudyLmStorageService,
          useValue: {
            saveLessonProgress,
            getGeneratedLesson: vi.fn().mockResolvedValue(null),
            getLessonProgress: vi.fn().mockResolvedValue(null),
          },
        },
        {
          provide: LessonGenerationService,
          useValue: { jobs: signal({}), jobFor: () => null },
        },
        {
          provide: StudyLmStore,
          useValue: { activeSubject: signal(null) },
        },
        {
          provide: StudyLmScreens,
          useValue: { go: vi.fn() },
        },
        {
          provide: PreferencesStore,
          useValue: { language: signal('en') },
        },
        {
          provide: StudyLmReviews,
          useValue: {
            lessonCheckAnswered,
            lessonFinished,
          },
        },
        LessonScreen,
      ],
    });

    const screen = injector.get(
      LessonScreen,
    ) as unknown as LessonScreenTestable;
    screen.data = {
      value: signal({
        id: 'bfs',
        lesson: sampleLesson,
        draft: null,
        progress: {
          lessonId: 'bfs',
          steps: {},
          checks: initialChecks,
          completedAt: null,
          updatedAt: '2026-11-12T08:00:00.000Z',
        },
      }),
    };

    return { screen, saveLessonProgress, lessonCheckAnswered, lessonFinished };
  }

  it('reports newly answered checks once per correctness state and ignores initial progress', () => {
    const { screen, saveLessonProgress, lessonCheckAnswered, lessonFinished } =
      setup({ 'chk-1': { answer: 1, correct: true } });

    // Visual step change alone re-emits initial checks; chk-1 must not be re-reported.
    screen.save({
      steps: { v1: 2 },
      checks: { 'chk-1': { answer: 1, correct: true } },
      completedAt: null,
    });
    expect(saveLessonProgress).toHaveBeenCalledTimes(1);
    expect(lessonCheckAnswered).not.toHaveBeenCalled();

    // New check chk-2 answered wrongly -> reported once.
    screen.save({
      steps: { v1: 2 },
      checks: {
        'chk-1': { answer: 1, correct: true },
        'chk-2': { answer: 1, correct: false },
      },
      completedAt: null,
    });
    expect(lessonCheckAnswered).toHaveBeenCalledTimes(1);
    expect(lessonCheckAnswered).toHaveBeenLastCalledWith(
      sampleLesson,
      expect.objectContaining({ id: 'chk-2' }),
      false,
    );

    // Another visual step change -> still 1 call.
    screen.save({
      steps: { v1: 3 },
      checks: {
        'chk-1': { answer: 1, correct: true },
        'chk-2': { answer: 1, correct: false },
      },
      completedAt: null,
    });
    expect(lessonCheckAnswered).toHaveBeenCalledTimes(1);

    // Retrying chk-2 and passing flips correctness -> reported again, plus lessonFinished on completion.
    screen.save({
      steps: { v1: 3 },
      checks: {
        'chk-1': { answer: 1, correct: true },
        'chk-2': { answer: 0, correct: true },
      },
      completedAt: '2026-11-12T08:05:00.000Z',
    });
    expect(lessonCheckAnswered).toHaveBeenCalledTimes(2);
    expect(lessonCheckAnswered).toHaveBeenLastCalledWith(
      sampleLesson,
      expect.objectContaining({ id: 'chk-2' }),
      true,
    );
    expect(lessonFinished).toHaveBeenCalledWith(sampleLesson);
  });
});
