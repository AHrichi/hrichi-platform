import { type CaptureItem, textKey } from '@ah/learning/client';
import type { Lesson, LessonMeta } from '@ah/products/system-design/domain';

/** How the Learning Engine names a System Design card's origin. */
export const SD_REVIEW_APP = 'system-design';
export const SD_REVIEW_OBJECTS = { lessonCard: 'lesson-card' } as const;

/** At most this many cards go to the engine in one hand-off. */
export const MAX_REVIEW_ITEMS = 10;

/**
 * The current page as a deep link, or `null` when it isn't an absolute
 * `http(s)` URL (the engine drops anything else).
 */
export function pageLink(
  href: string = globalThis.location?.href ?? '',
): string | null {
  return /^https?:\/\//.test(href) ? href.slice(0, 2048) : null;
}

/**
 * A lesson's review cards as Learning Engine captures (technical-design §7),
 * one per card, capped at {@link MAX_REVIEW_ITEMS}. Same shape as StudyLM's
 * `lessonCardItems()`, written here because products never import each other.
 */
export function lessonReviewItems(
  lesson: Pick<Lesson, 'id' | 'cards'>,
  meta: Pick<LessonMeta, 'title'>,
  deepLink: string | null = pageLink(),
): CaptureItem[] {
  return lesson.cards.slice(0, MAX_REVIEW_ITEMS).map((card) => ({
    text: `${card.front}\n${card.back}`,
    source: {
      app: SD_REVIEW_APP,
      objectType: SD_REVIEW_OBJECTS.lessonCard,
      objectId: `${lesson.id}:${textKey(card.front)}`,
      deepLink,
      excerpt: meta.title,
    },
  }));
}
