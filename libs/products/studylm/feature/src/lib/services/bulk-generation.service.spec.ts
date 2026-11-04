import '@angular/compiler';
import { Injector, signal } from '@angular/core';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import type { RoadmapSection, StudySubject } from '@ah/products/studylm/domain';
import type { Lesson } from '@ah/products/studylm/lessons';
import { BulkGenerationService } from './bulk-generation.service';
import { LessonGenerationService } from './lesson-generation.service';
import { StudyLmStore } from '../store/studylm.store';

describe('BulkGenerationService', () => {
  let service: BulkGenerationService;
  let mockLessonService: {
    generateLesson: ReturnType<typeof vi.fn>;
    idFor: ReturnType<typeof vi.fn>;
    saved: ReturnType<typeof signal<Set<string>>>;
  };
  let mockStore: {
    activeSubject: ReturnType<typeof signal<StudySubject | null>>;
    allSections: ReturnType<typeof signal<RoadmapSection[]>>;
  };

  const dummySubject: StudySubject = {
    id: 'sub-1',
    title: 'TypeScript Deep Dive',
    sources: [],
    overview: null,
    createdAt: '2026-01-01',
    flashcards: [],
    quizQuestions: [],
  };

  const dummySection1: RoadmapSection = {
    id: 'sec-1',
    code: 'TS-01',
    title: 'Generics Fundamentals',
    summary: 'Learn generics',
    subtopics: ['type variables', 'constraints'],
    difficultyTier: 'beginner',
    officialDocs: [],
    flashcardsStatus: 'idle',
    quizStatus: 'idle',
    approved: true,
  };

  const dummySection2: RoadmapSection = {
    id: 'sec-2',
    code: 'TS-02',
    title: 'Conditional Types',
    summary: 'Learn conditionals',
    subtopics: ['infer', 'distributive'],
    difficultyTier: 'advanced',
    officialDocs: [],
    flashcardsStatus: 'idle',
    quizStatus: 'idle',
    approved: true,
  };

  beforeEach(() => {
    mockLessonService = {
      generateLesson: vi.fn().mockResolvedValue({
        id: 'lesson-1',
        title: 'Mock Lesson',
        tier: 'beginner',
        minutes: 10,
        objectives: [],
        sections: [],
      } as unknown as Lesson),
      idFor: vi.fn((sub, sec) => `${sub.id}-${sec.id}`),
      saved: signal(new Set<string>()),
    };

    mockStore = {
      activeSubject: signal(dummySubject),
      allSections: signal([dummySection1, dummySection2]),
    };

    const injector = Injector.create({
      providers: [
        { provide: LessonGenerationService, useValue: mockLessonService },
        { provide: StudyLmStore, useValue: mockStore },
        BulkGenerationService,
      ],
    });

    service = injector.get(BulkGenerationService);
  });

  it('computes pendingSections excluding already saved lessons', () => {
    expect(service.pendingSections()).toHaveLength(2);

    mockLessonService.saved.set(new Set(['sub-1-sec-1']));
    expect(service.pendingSections()).toHaveLength(1);
    expect(service.pendingSections()[0].id).toBe('sec-2');
  });

  it('bulk generates lessons for all pending sections in batches', async () => {
    const result = await service.bulkGenerateLessons({
      batchSize: 2,
      maxRetries: 1,
      retryDelayMs: 5,
    });

    expect(result.succeeded).toHaveLength(2);
    expect(result.failed).toHaveLength(0);
    expect(mockLessonService.generateLesson).toHaveBeenCalledTimes(2);
    expect(service.statusMessage()).toContain(
      'Successfully generated all 2 lessons',
    );
    expect(service.isGenerating()).toBe(false);
  });

  it('retries when an error occurs during lesson generation', async () => {
    let callCount = 0;
    mockLessonService.generateLesson.mockImplementation(async () => {
      callCount++;
      if (callCount === 1) {
        throw new Error('Network timeout');
      }
      return { id: 'mock' } as unknown as Lesson;
    });

    const result = await service.bulkGenerateLessons({
      sections: [dummySection1],
      maxRetries: 2,
      retryDelayMs: 5,
    });

    expect(result.succeeded).toHaveLength(1);
    expect(result.failed).toHaveLength(0);
    expect(callCount).toBe(2);
    expect(service.retryingCount()).toBe(1);
  });

  it('can be cancelled during bulk generation', async () => {
    mockLessonService.generateLesson.mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(
            () =>
              resolve({
                id: 'mock',
              } as unknown as Lesson),
            50,
          );
        }),
    );

    const promise = service.bulkGenerateLessons({
      sections: [dummySection1, dummySection2],
      batchSize: 1,
    });

    service.cancel();
    const result = await promise;

    expect(result.cancelled).toBe(true);
    expect(service.statusMessage()).toContain('cancelled');
  });
});
