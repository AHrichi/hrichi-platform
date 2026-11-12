import { inject, Injectable } from '@angular/core';
import {
  type HostCaptureItem,
  type HostRating,
  LearningLink,
  textKey,
} from '@ah/learning/client';
import type {
  MasteryRating,
  StudyFlashcard,
  StudyQuizQuestion,
} from '@ah/products/studylm/domain';
import { type Lesson, loadBuiltInLessons } from '@ah/products/studylm/lessons';
import { StudyLmStorageService } from './studylm-storage.service';

/** Where a StudyLM card came from, as the Learning Engine names it. */
export const REVIEW_OBJECTS = {
  lessonCard: 'lesson-card',
  flashcard: 'flashcard',
  quiz: 'quiz',
} as const;

function pageLink(): string | null {
  const href = globalThis.location?.href ?? '';
  return /^https?:\/\//.test(href) ? href.slice(0, 2048) : null;
}

/** A lesson's flashcard seeds, one card each (an edited card is a new one). */
export function lessonCardItems(
  lesson: Pick<Lesson, 'id' | 'title' | 'cards'>,
  deepLink = pageLink(),
): HostCaptureItem[] {
  return lesson.cards.map((card) => ({
    text: `${card.front}\n${card.back}`,
    source: {
      app: 'studylm',
      objectType: REVIEW_OBJECTS.lessonCard,
      objectId: `${lesson.id.slice(0, 100)}:${textKey(card.front)}`,
      deepLink,
      excerpt: lesson.title.slice(0, 500),
    },
  }));
}

export function flashcardItem(
  card: Pick<StudyFlashcard, 'id' | 'front' | 'back' | 'category'>,
  deepLink: string | null = null,
): HostCaptureItem {
  return {
    text: `${card.front}\n${card.back}`,
    source: {
      app: 'studylm',
      objectType: REVIEW_OBJECTS.flashcard,
      objectId: card.id.slice(0, 120),
      deepLink,
      excerpt: card.category.slice(0, 500),
    },
  };
}

/** A quiz question as a card: the question, its right answer and why. */
export function quizItem(
  question: Pick<
    StudyQuizQuestion,
    'id' | 'question' | 'options' | 'correctIndex' | 'explanation'
  >,
  deepLink = pageLink(),
): HostCaptureItem {
  const answer = question.options[question.correctIndex] ?? '';
  return {
    text: [question.question, `Answer: ${answer}`, question.explanation]
      .filter((part) => part.trim())
      .join('\n'),
    source: {
      app: 'studylm',
      objectType: REVIEW_OBJECTS.quiz,
      objectId: question.id.slice(0, 120),
      deepLink,
      excerpt: question.question.slice(0, 500),
    },
  };
}

/**
 * StudyLM's side of the Learning Engine link (design §9, ADR-0024): what
 * StudyLM sends and reports once it is linked. Unlinked, every call does
 * nothing, and "Learn this" falls back to the hand-off.
 *
 * - A finished lesson's cards join the daily reviews.
 * - A flashcard rated "again" or a missed quiz question becomes a card, so
 *   what you get wrong comes back.
 * - Every flashcard rating and quiz answer is reported; the engine counts
 *   it as a review once that card is in the reviews.
 */
@Injectable({ providedIn: 'root' })
export class StudyLmReviews {
  private readonly link = inject(LearningLink);
  private readonly storage = inject(StudyLmStorageService);
  readonly linked = this.link.linked;
  /** The learning app has just sent the link back. */
  readonly justLinked = this.link.justLinked;

  lessonFinished(lesson: Pick<Lesson, 'id' | 'title' | 'cards'>): number {
    return this.link.send(lessonCardItems(lesson));
  }

  /**
   * Right after linking: the cards of every lesson finished before, so the
   * reviews start with what was already learnt. Each card goes once ever.
   */
  async sendFinishedLessons(): Promise<number> {
    if (!this.linked()) return 0;
    const finished = new Set(
      (await this.storage.getAllLessonProgress())
        .filter((progress) => progress.completedAt)
        .map((progress) => progress.lessonId),
    );
    if (!finished.size) return 0;
    const generated = (await this.storage.listGeneratedLessons())
      .map((record) => record.lesson)
      .filter((lesson) => finished.has(lesson.id));
    const builtIn = [...finished].some((id) => !id.startsWith('gen-'))
      ? (await loadBuiltInLessons()).filter((lesson) => finished.has(lesson.id))
      : [];
    return this.link.send(
      [...generated, ...builtIn].flatMap((lesson) =>
        lessonCardItems(lesson, null),
      ),
    );
  }

  cardRated(card: StudyFlashcard, rating: MasteryRating): void {
    if (!this.linked()) return;
    if (rating === 'again') this.link.send([flashcardItem(card)]);
    this.link.answer(REVIEW_OBJECTS.flashcard, card.id, rating as HostRating);
  }

  quizAnswered(question: StudyQuizQuestion, correct: boolean): void {
    if (!this.linked()) return;
    if (!correct) this.link.send([quizItem(question)]);
    this.link.answer(
      REVIEW_OBJECTS.quiz,
      question.id,
      correct ? 'good' : 'again',
    );
  }
}
