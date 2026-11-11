import type { LearningLocalStore } from '@ah/learning/data-access';
import {
  type Concept,
  draftConceptFrom,
  GOLDEN_CONCEPTS,
  type GoldenConcept,
  localDateOf,
  type ReviewEvent,
  type Topic,
} from '@ah/learning/domain';

/**
 * The portfolio's demo (design §9): its own database (`ah-demo-learning`),
 * filled once with the golden concepts and a month of reviews, so the
 * streak, tiers and Daily Set look like real use. It never syncs, pairs or
 * calls the AI.
 */
export const DEMO_SEEDED = 'demo-seeded';
/** Kept for the demo's captures, which turn into these instead of AI output. */
export const DEMO_DRAFTS = 2;

const DAY = 86_400_000;
/** Review gaps after each success: a typical spacing ladder. */
const GAPS = [1, 3, 7, 14];

function hueOf(name: string): number {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) % 360;
  return hash;
}

export function demoGolden(): readonly GoldenConcept[] {
  return GOLDEN_CONCEPTS.slice(0, GOLDEN_CONCEPTS.length - DEMO_DRAFTS);
}

/** The golden concepts the demo's captures turn into, in order. */
export function demoDraftSource(index: number): GoldenConcept {
  const spare = GOLDEN_CONCEPTS.slice(GOLDEN_CONCEPTS.length - DEMO_DRAFTS);
  return spare[index % spare.length];
}

export async function seedDemo(
  local: LearningLocalStore,
  timeZone: string,
  now = new Date(),
): Promise<void> {
  if (await local.getMeta<boolean>(DEMO_SEEDED)) return;

  const topics = new Map<string, Topic>();
  for (const golden of GOLDEN_CONCEPTS) {
    if (topics.has(golden.topic)) continue;
    const topic = await local.saveTopic({
      id: crypto.randomUUID(),
      updatedAt: now.toISOString(),
      deletedAt: null,
      name: golden.topic,
      parentId: null,
      hue: hueOf(golden.topic),
    });
    topics.set(golden.topic, topic);
  }

  const start = now.getTime() - 32 * DAY;
  const byDay = new Map<string, ReviewEvent[]>();
  const golden = demoGolden();
  for (const [i, item] of golden.entries()) {
    const kept = new Date(start + i * DAY);
    const concept: Concept = {
      ...draftConceptFrom({
        title: item.title,
        type: item.type,
        topicId: topics.get(item.topic)?.id ?? null,
        span: item.span,
        captureId: crypto.randomUUID(),
        explained: item.explained,
        now: kept,
      }),
      status: 'active',
      confirmedAt: kept.toISOString(),
      sources: [],
    };
    await local.saveConcept(concept);

    // Reviews on a spacing ladder; one in four misses its second review.
    let at = kept.getTime() + DAY;
    for (let step = 0; at < now.getTime() - DAY / 2; step++) {
      const prompt = concept.prompts[step % concept.prompts.length];
      const rating: ReviewEvent['rating'] =
        step === 1 && i % 4 === 0 ? 'again' : step === 2 ? 'hard' : 'good';
      const when = new Date(at + (i % 5) * 3_600_000);
      const event: ReviewEvent = {
        id: crypto.randomUUID(),
        conceptId: concept.id,
        promptId: prompt.id,
        sessionId: crypto.randomUUID(),
        at: when.toISOString(),
        localDate: localDateOf(when, timeZone),
        rating,
        answer: null,
        ms: 4000 + ((i * 1700 + step * 900) % 9000),
      };
      const day = byDay.get(event.localDate) ?? [];
      day.push(event);
      byDay.set(event.localDate, day);
      at +=
        (rating === 'again' ? 1 : GAPS[Math.min(step, GAPS.length - 1)]) * DAY;
    }
  }

  // One finished set per day for the last 12 days: a streak to show.
  const today = localDateOf(now, timeZone);
  for (let back = 12; back >= 1; back--) {
    const date = new Date(now.getTime() - back * DAY);
    const localDate = localDateOf(date, timeZone);
    if (localDate >= today) continue;
    const sessionId = crypto.randomUUID();
    const events = (byDay.get(localDate) ?? []).map((event) => ({
      ...event,
      sessionId,
    }));
    byDay.set(localDate, events);
    await local.saveSession({
      id: sessionId,
      updatedAt: date.toISOString(),
      deletedAt: null,
      localDate,
      kind: 'daily',
      planned: events.map((event) => ({
        conceptId: event.conceptId,
        promptId: event.promptId,
      })),
      lighter: false,
      startedAt: date.toISOString(),
      completedAt: new Date(date.getTime() + 4 * 60_000).toISOString(),
    });
  }
  for (const events of byDay.values()) {
    for (const event of events) await local.appendEvent(event);
  }
  await local.setMeta(DEMO_SEEDED, true);
}
