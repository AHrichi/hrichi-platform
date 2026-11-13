import { describe, expect, it } from 'vitest';
import { STUDYLM_COPY } from '../../i18n/studylm-copy';
import { partitionSectionActions } from './section-actions';

describe('partitionSectionActions', () => {
  const copy = STUDYLM_COPY.en.roadmap;

  it('keeps only primary CTA and study actions upfront once a section is complete', () => {
    const groups = partitionSectionActions(
      {
        section: {
          id: 'sec-1-1',
          approved: true,
          flashcardsStatus: 'ready',
          quizStatus: 'ready',
        },
        lessonSaved: true,
        lessonStatus: null,
        cardCount: 24,
        quizCount: 5,
        generatingCards: false,
        generatingQuiz: false,
        aiReady: true,
      },
      copy,
    );

    expect(groups.primary.map((a) => [a.label, a.variant])).toEqual([
      [copy.openLesson, 'primary'],
      [`${copy.studyCards} (24)`, 'secondary'],
      [`${copy.takeQuiz} (5)`, 'secondary'],
    ]);
    expect(groups.overflow.map((a) => [a.label, a.icon, a.disabled])).toEqual([
      [copy.rewriteLesson, 'refresh', false],
      [copy.regenerateFlashcards, 'refresh', false],
      [copy.regenerateQuiz, 'refresh', false],
    ]);
  });

  it('omits the overflow menu when a section has no generated content yet', () => {
    const unapproved = partitionSectionActions(
      {
        section: {
          id: 'sec-1-1',
          approved: false,
          flashcardsStatus: 'idle',
          quizStatus: 'idle',
        },
        lessonSaved: false,
        lessonStatus: null,
        cardCount: 0,
        quizCount: 0,
        generatingCards: false,
        generatingQuiz: false,
        aiReady: true,
      },
      copy,
    );

    expect(unapproved.primary.map((a) => a.label)).toEqual([
      copy.writeLesson,
      copy.generateFlashcards,
      copy.generateQuiz,
      copy.approveSection,
    ]);
    expect(unapproved.overflow).toEqual([]);
  });

  it('reflects generating and offline AI states while keeping study navigation enabled', () => {
    const groups = partitionSectionActions(
      {
        section: {
          id: 'sec-1-1',
          approved: true,
          flashcardsStatus: 'ready',
          quizStatus: 'ready',
        },
        lessonSaved: true,
        lessonStatus: 'writing',
        cardCount: 10,
        quizCount: 4,
        generatingCards: true,
        generatingQuiz: false,
        aiReady: false,
      },
      copy,
    );

    expect(groups.primary.map((a) => [a.label, a.disabled])).toEqual([
      [copy.writingLesson, false],
      [copy.generatingCards, true],
      [`${copy.takeQuiz} (4)`, false],
    ]);
    expect(groups.overflow.map((a) => [a.label, a.disabled])).toEqual([
      [copy.regenerateFlashcards, true],
      [copy.regenerateQuiz, true],
    ]);
  });

  it('keeps retry upfront and preserves study access in overflow on error with existing items', () => {
    const groups = partitionSectionActions(
      {
        section: {
          id: 'sec-1-1',
          approved: true,
          flashcardsStatus: 'error',
          quizStatus: 'idle',
        },
        lessonSaved: false,
        lessonStatus: null,
        cardCount: 8,
        quizCount: 0,
        generatingCards: false,
        generatingQuiz: false,
        aiReady: true,
      },
      copy,
    );

    expect(groups.primary.map((a) => a.label)).toEqual([
      copy.writeLesson,
      copy.retryFlashcards,
      copy.generateQuiz,
    ]);
    expect(groups.overflow.map((a) => [a.label, a.icon, a.disabled])).toEqual([
      [`${copy.studyCards} (8)`, 'open', false],
    ]);
  });
});
