// JIT for the injectables the service's dependencies declare.
import '@angular/compiler';
import { Injector, signal } from '@angular/core';
import { LearningLink } from '@ah/learning/client';
import type {
  StudyFlashcard,
  StudyQuizQuestion,
} from '@ah/products/studylm/domain';
import { StudyLmStorageService } from './studylm-storage.service';
import {
  lessonCardItems,
  quizItem,
  StudyLmReviews,
} from './studylm-reviews.service';

const lesson = {
  id: 'gen-js-event-loop',
  title: 'The event loop',
  cards: [
    { type: 'fact' as const, front: 'What runs first?', back: 'Microtasks.' },
    { type: 'fact' as const, front: 'What is a task?', back: 'A callback.' },
  ],
};

const card: StudyFlashcard = {
  id: 'fc-1',
  tier: 'beginner',
  front: 'What does BFS use?',
  back: 'A queue.',
  sourceCitation: '',
  category: 'Graphs',
  masteryCount: 0,
};

const question: StudyQuizQuestion = {
  id: 'q-1',
  tier: 'beginner',
  question: 'Which structure does BFS use?',
  options: ['A stack', 'A queue', 'A heap', 'A set'],
  correctIndex: 1,
  explanation: 'It visits nodes in the order found.',
  sourceCitation: '',
};

function setup(linked: boolean) {
  const sent: string[][] = [];
  const answers: string[] = [];
  const link = {
    linked: signal(linked),
    justLinked: signal(false),
    send: (items: { source: { objectType: string; objectId: string } }[]) => {
      sent.push(
        items.map((i) => `${i.source.objectType}:${i.source.objectId}`),
      );
      return items.length;
    },
    answer: (objectType: string, objectId: string, rating: string) => {
      answers.push(`${objectType}:${objectId}:${rating}`);
    },
  };
  const storage = {
    getAllLessonProgress: async () => [
      { lessonId: 'gen-js-event-loop', completedAt: '2026-11-10T08:00:00Z' },
      { lessonId: 'bfs', completedAt: '2026-11-11T08:00:00Z' },
      { lessonId: 'recursion', completedAt: null },
    ],
    listGeneratedLessons: async () => [{ lesson }],
  };
  const reviews = Injector.create({
    providers: [
      { provide: LearningLink, useValue: link },
      { provide: StudyLmStorageService, useValue: storage },
      StudyLmReviews,
    ],
  }).get(StudyLmReviews);
  return { reviews, sent, answers };
}

describe('StudyLM cards for the Learning Engine', () => {
  it('gives each lesson card its own stable identity', () => {
    const items = lessonCardItems(lesson, null);
    expect(items.map((item) => item.text)).toEqual([
      'What runs first?\nMicrotasks.',
      'What is a task?\nA callback.',
    ]);
    const ids = items.map((item) => item.source.objectId);
    expect(new Set(ids).size).toBe(2);
    expect(ids[0]).toMatch(/^gen-js-event-loop:[0-9a-f]{8}$/);
    expect(lessonCardItems(lesson, null)[0].source.objectId).toBe(ids[0]);
    expect(items[0].source).toMatchObject({
      app: 'studylm',
      objectType: 'lesson-card',
      excerpt: 'The event loop',
    });
  });

  it('turns a quiz question into a card with its right answer', () => {
    expect(quizItem(question, null)).toEqual({
      text: 'Which structure does BFS use?\nAnswer: A queue\nIt visits nodes in the order found.',
      source: {
        app: 'studylm',
        objectType: 'quiz',
        objectId: 'q-1',
        deepLink: null,
        excerpt: 'Which structure does BFS use?',
      },
    });
  });
});

describe('StudyLmReviews', () => {
  it('does nothing while StudyLM is not linked', () => {
    const { reviews, sent, answers } = setup(false);
    reviews.cardRated(card, 'again');
    reviews.quizAnswered(question, false);
    expect(sent).toEqual([]);
    expect(answers).toEqual([]);
  });

  it('reports every rating, and sends a card rated "again"', () => {
    const { reviews, sent, answers } = setup(true);
    reviews.cardRated(card, 'good');
    reviews.cardRated(card, 'again');
    expect(answers).toEqual(['flashcard:fc-1:good', 'flashcard:fc-1:again']);
    expect(sent).toEqual([['flashcard:fc-1']]);
  });

  it('sends a missed quiz question, and counts right answers as good', () => {
    const { reviews, sent, answers } = setup(true);
    reviews.quizAnswered(question, false);
    reviews.quizAnswered(question, true);
    expect(sent).toEqual([['quiz:q-1']]);
    expect(answers).toEqual(['quiz:q-1:again', 'quiz:q-1:good']);
  });

  it('sends the cards of lessons finished before linking', async () => {
    const { reviews, sent } = setup(true);
    expect(await reviews.sendFinishedLessons()).toBeGreaterThan(2);
    const keys = sent.flat();
    expect(keys.filter((k) => k.includes('gen-js-event-loop'))).toHaveLength(2);
    expect(keys.some((k) => k.startsWith('lesson-card:bfs:'))).toBe(true);
    expect(keys.some((k) => k.startsWith('lesson-card:recursion:'))).toBe(
      false,
    );
  });
});
