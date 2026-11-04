import '@angular/compiler';
import {
  ɵChangeDetectionScheduler,
  ɵEffectScheduler,
  PendingTasks,
  Injector,
  signal,
} from '@angular/core';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { Lesson } from '@ah/products/studylm/lessons';
import type { StudySubject } from '@ah/products/studylm/domain';
import { LearnScreen } from './learn-screen';
import { StudyLmStorageService } from '../../services/studylm-storage.service';
import { StudyLmStore } from '../../store/studylm.store';
import { BulkGenerationService } from '../../services/bulk-generation.service';
import { StudyLmScreens } from '../../shell/studylm-screens';

describe('LearnScreen', () => {
  let screen: LearnScreen;
  let mockStorage: {
    getAllLessonProgress: ReturnType<typeof vi.fn>;
    listGeneratedLessons: ReturnType<typeof vi.fn>;
  };
  let mockStore: {
    subjects: ReturnType<typeof signal<StudySubject[]>>;
    activeSubject: ReturnType<typeof signal<StudySubject | null>>;
    activeSubjectId: ReturnType<typeof signal<string | null>>;
    setSelectedSection: ReturnType<typeof vi.fn>;
    setCardSectionFilter: ReturnType<typeof vi.fn>;
    setQuizSectionFilter: ReturnType<typeof vi.fn>;
  };
  let mockScreens: {
    go: ReturnType<typeof vi.fn>;
    goToSectionRoadmap: ReturnType<typeof vi.fn>;
    goToSectionFlashcards: ReturnType<typeof vi.fn>;
    goToSectionQuiz: ReturnType<typeof vi.fn>;
    goToLesson: ReturnType<typeof vi.fn>;
  };
  let mockBulk: {
    isGenerating: ReturnType<typeof signal<boolean>>;
    pendingSections: ReturnType<typeof signal<unknown[]>>;
    progress: ReturnType<typeof signal<unknown>>;
    statusMessage: ReturnType<typeof signal<string>>;
    retryingCount: ReturnType<typeof signal<number>>;
    failedItems: ReturnType<typeof signal<unknown[]>>;
    bulkGenerateLessons: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
  };

  const dummySubject: StudySubject = {
    id: 'sub-react',
    title: 'React Internals',
    sources: [],
    overview: null,
    createdAt: '2026-01-01',
    flashcards: [],
    quizQuestions: [],
  };

  const dummyGeneratedLesson: Lesson = {
    id: 'gen-react-fiber',
    title: 'Fiber Reconciler Architecture',
    tier: 'advanced',
    minutes: 15,
    objectives: ['Understand fiber nodes', 'Learn work loop'],
    sections: [
      {
        id: 's1',
        title: 'Overview',
        blocks: [
          {
            kind: 'predict',
            id: 'b1',
            question: 'What is a fiber?',
          } as unknown as Lesson['sections'][number]['blocks'][number],
        ],
      },
    ],
  };

  beforeEach(() => {
    mockStorage = {
      getAllLessonProgress: vi.fn().mockResolvedValue([
        {
          lessonId: 'gen-react-fiber',
          checks: { b1: { correct: true } },
          completedAt: '2026-02-01',
        },
      ]),
      listGeneratedLessons: vi.fn().mockResolvedValue([
        {
          id: 'gen-react-fiber',
          subjectId: 'sub-react',
          sectionId: 'sec-fiber',
          draft: {
            outline: { sections: [] },
            tier: 'advanced',
            blocks: {},
          } as unknown as import('../../services/lesson-generator').LessonDraft,
          lesson: dummyGeneratedLesson,
          generatedAt: '2026-02-01',
        },
      ]),
    };

    mockStore = {
      subjects: signal([dummySubject]),
      activeSubject: signal(dummySubject),
      activeSubjectId: signal('sub-react'),
      setSelectedSection: vi.fn(),
      setCardSectionFilter: vi.fn(),
      setQuizSectionFilter: vi.fn(),
    };

    mockBulk = {
      isGenerating: signal(false),
      pendingSections: signal([]),
      progress: signal(null),
      statusMessage: signal(''),
      retryingCount: signal(0),
      failedItems: signal([]),
      bulkGenerateLessons: vi.fn().mockResolvedValue({
        succeeded: [],
        failed: [],
        cancelled: false,
      }),
      cancel: vi.fn(),
    };

    mockScreens = {
      go: vi.fn().mockResolvedValue(true),
      goToSectionRoadmap: vi.fn().mockResolvedValue(true),
      goToSectionFlashcards: vi.fn().mockResolvedValue(true),
      goToSectionQuiz: vi.fn().mockResolvedValue(true),
      goToLesson: vi.fn().mockResolvedValue(true),
    };

    const noop = () => undefined;
    const injector = Injector.create({
      providers: [
        {
          provide: ɵChangeDetectionScheduler,
          useValue: { notify: noop },
        },
        {
          provide: ɵEffectScheduler,
          useValue: { add: noop },
        },
        {
          provide: PendingTasks,
          useValue: { add: () => noop },
        },
        { provide: StudyLmStorageService, useValue: mockStorage },
        { provide: StudyLmStore, useValue: mockStore },
        { provide: BulkGenerationService, useValue: mockBulk },
        { provide: StudyLmScreens, useValue: mockScreens },
        LearnScreen,
      ],
    });

    screen = injector.get(LearnScreen);
  });

  it('initializes with default filter and pagination values', () => {
    expect(screen.search()).toBe('');
    expect(screen.tierFilter()).toBe('all');
    expect(screen.statusFilter()).toBe('all');
    expect(screen.sourceFilter()).toBe('all');
    expect(screen.pageSize()).toBe(12);
    expect(screen.currentPage()).toBe(1);
    expect(screen.hasActiveFilters()).toBe(false);
  });

  it('updates search and resets page', () => {
    screen.currentPage.set(2);
    screen.onSearchInput({
      target: { value: 'reconciler' },
    } as unknown as Event);

    expect(screen.search()).toBe('reconciler');
    expect(screen.currentPage()).toBe(1);
    expect(screen.hasActiveFilters()).toBe(true);

    screen.clearSearch();
    expect(screen.search()).toBe('');
  });

  it('filters by difficulty tier', () => {
    screen.onTierSelect({ target: { value: 'advanced' } } as unknown as Event);
    expect(screen.tierFilter()).toBe('advanced');
    expect(screen.hasActiveFilters()).toBe(true);
  });

  it('filters by status', () => {
    screen.onStatusSelect({
      target: { value: 'completed' },
    } as unknown as Event);
    expect(screen.statusFilter()).toBe('completed');
    expect(screen.hasActiveFilters()).toBe(true);
  });

  it('filters by source and subject', () => {
    screen.onSourceSelect({
      target: { value: 'active-subject' },
    } as unknown as Event);
    expect(screen.sourceFilter()).toBe('active-subject');
    expect(screen.hasActiveFilters()).toBe(true);
  });

  it('resets all filters cleanly', () => {
    screen.search.set('query');
    screen.tierFilter.set('beginner');
    screen.statusFilter.set('in-progress');
    screen.sourceFilter.set('built-in');
    screen.currentPage.set(3);

    expect(screen.hasActiveFilters()).toBe(true);

    screen.clearFilters();

    expect(screen.search()).toBe('');
    expect(screen.tierFilter()).toBe('all');
    expect(screen.statusFilter()).toBe('all');
    expect(screen.sourceFilter()).toBe('all');
    expect(screen.currentPage()).toBe(1);
    expect(screen.hasActiveFilters()).toBe(false);
  });

  it('handles pagination navigation and page size change', () => {
    screen.onPageChange(3);
    expect(screen.currentPage()).toBe(3);

    screen.onPageSizeChange(24);
    expect(screen.pageSize()).toBe(24);
    expect(screen.currentPage()).toBe(1);
  });

  it('triggers bulk generation through BulkGenerationService', async () => {
    await screen.startBulkGeneration();
    expect(mockBulk.bulkGenerateLessons).toHaveBeenCalledWith({
      batchSize: 2,
      maxRetries: 2,
      retryDelayMs: 1200,
    });
  });

  it('cancels bulk generation when requested', () => {
    screen.cancelBulkGeneration();
    expect(mockBulk.cancel).toHaveBeenCalled();
  });

  it('navigates to roadmap section, cards, and quiz with proper state', () => {
    const mockEvent = {
      stopPropagation: vi.fn(),
      preventDefault: vi.fn(),
    } as unknown as MouseEvent;

    screen.goToSectionRoadmap(mockEvent, 'sec-fiber');
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockStore.setSelectedSection).toHaveBeenCalledWith('sec-fiber');
    expect(mockScreens.goToSectionRoadmap).toHaveBeenCalledWith('sec-fiber');

    screen.goToSectionCards(mockEvent, 'sec-fiber');
    expect(mockStore.setCardSectionFilter).toHaveBeenCalledWith('sec-fiber');
    expect(mockScreens.goToSectionFlashcards).toHaveBeenCalledWith('sec-fiber');

    screen.goToSectionQuiz(mockEvent, 'sec-fiber');
    expect(mockStore.setQuizSectionFilter).toHaveBeenCalledWith('sec-fiber');
    expect(mockScreens.goToSectionQuiz).toHaveBeenCalledWith('sec-fiber');
  });
});
