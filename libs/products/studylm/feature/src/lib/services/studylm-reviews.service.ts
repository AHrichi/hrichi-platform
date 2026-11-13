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
import {
  type Block,
  type Lesson,
  loadBuiltInLessons,
} from '@ah/products/studylm/lessons';
import { StudyLmStorageService } from './studylm-storage.service';

/** Where a StudyLM card came from, as the Learning Engine names it. */
export const REVIEW_OBJECTS = {
  lessonCard: 'lesson-card',
  lessonCheck: 'lesson-check',
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

function checkPromptAndAnswer(block: Block): {
  question: string;
  answer: string;
} | null {
  switch (block.kind) {
    case 'quiz':
      return {
        question: block.question,
        answer:
          block.correct
            .map((i) => block.options[i])
            .filter(Boolean)
            .join('; ') || block.explanation,
      };
    case 'predict':
      return {
        question: block.question,
        answer:
          block.expected ??
          (block.answer !== null ? block.options?.[block.answer] : null) ??
          block.explanation,
      };
    case 'self-explain':
      return {
        question: block.prompt,
        answer: block.modelAnswer,
      };
    case 'order-steps':
      return {
        question: block.prompt,
        answer: block.items.map((item) => item.text).join(' -> '),
      };
    case 'categorize': {
      const catMap = new Map(block.categories.map((c) => [c.id, c.label]));
      return {
        question: block.prompt,
        answer: block.items
          .map(
            (item) =>
              `${item.text}: ${catMap.get(item.category) ?? item.category}`,
          )
          .join('; '),
      };
    }
    case 'parsons':
      return {
        question: block.prompt,
        answer: block.lines.map((line) => line.code).join('\n'),
      };
    case 'predict-output':
      return {
        question: `Predict output (${block.language}):\n${block.code}`,
        answer: block.expected,
      };
    case 'cloze': {
      const answer = block.blanks
        .map((b, index) => `${index + 1}. ${b.answers[0] ?? ''}`)
        .join('; ');
      return {
        question: block.text,
        answer: answer || block.explanation || '',
      };
    }
    default:
      return null;
  }
}

/** A lesson check block turned into a review card with its reference answer. */
export function lessonCheckItem(
  lesson: Pick<Lesson, 'id' | 'title'>,
  block: Block,
  deepLink = pageLink(),
): HostCaptureItem {
  const qa = checkPromptAndAnswer(block);
  const question = qa?.question.trim() || `${lesson.title} (${block.id})`;
  const answer = qa?.answer.trim() || '';
  const text = (answer ? `${question}\n\n${answer}` : question).slice(0, 4000);
  return {
    text,
    source: {
      app: 'studylm',
      objectType: REVIEW_OBJECTS.lessonCheck,
      objectId: `${lesson.id.slice(0, 75)}:${block.id.slice(0, 44)}`,
      deepLink,
      excerpt: `${lesson.title}: ${question}`.slice(0, 500),
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

  /** Report a lesson check answer, sending missed checks to daily review. */
  lessonCheckAnswered(
    lesson: Pick<Lesson, 'id' | 'title'>,
    block: Block,
    correct: boolean,
  ): void {
    if (!this.linked()) return;
    const item = lessonCheckItem(lesson, block);
    if (!correct) this.link.send([item]);
    this.link.answer(
      REVIEW_OBJECTS.lessonCheck,
      item.source.objectId,
      correct ? 'good' : 'again',
    );
  }

  /** Report a flashcard rating, sending missed cards to daily review. */
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
