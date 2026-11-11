import type { Concept, ReviewEvent, Topic } from '../records';

/**
 * Valid records for tests in every learning lib. Ids are fixed UUIDs, so a
 * failing assertion names a record you can find.
 */
export const FIXTURE_IDS = {
  topic: '0b6f0c30-0000-4000-8000-000000000001',
  concept: '0b6f0c30-0000-4000-8000-000000000002',
  prompt: '0b6f0c30-0000-4000-8000-000000000003',
  session: '0b6f0c30-0000-4000-8000-000000000004',
  event: '0b6f0c30-0000-4000-8000-000000000005',
  deviceA: '0b6f0c30-0000-4000-8000-00000000000a',
  deviceB: '0b6f0c30-0000-4000-8000-00000000000b',
} as const;

export function sampleTopic(overrides: Partial<Topic> = {}): Topic {
  return {
    id: FIXTURE_IDS.topic,
    updatedAt: '2026-11-11T08:00:00.000Z',
    deletedAt: null,
    name: 'Economics',
    parentId: null,
    hue: 140,
    ...overrides,
  };
}

export function sampleConcept(overrides: Partial<Concept> = {}): Concept {
  return {
    id: FIXTURE_IDS.concept,
    updatedAt: '2026-11-11T08:00:00.000Z',
    deletedAt: null,
    topicId: FIXTURE_IDS.topic,
    title: 'Opportunity cost',
    type: 'definition',
    status: 'active',
    explanation: {
      essence:
        'The value of the best alternative you give up when you make a choice.',
      simple: null,
      analogy: 'Choosing pizza means not having the burger you also wanted.',
      misconception: null,
      ownWords: null,
      by: 'user',
    },
    prompts: [
      {
        id: FIXTURE_IDS.prompt,
        type: 'free_recall',
        question: 'What is opportunity cost?',
        answer:
          'The value of the next best alternative given up when choosing.',
        options: null,
        keyPoints: ['next best alternative', 'given up by choosing'],
        retired: false,
      },
    ],
    sources: [],
    confirmedAt: '2026-11-11T08:00:00.000Z',
    createdAt: '2026-11-11T08:00:00.000Z',
    ...overrides,
  };
}

export function sampleEvent(overrides: Partial<ReviewEvent> = {}): ReviewEvent {
  return {
    id: FIXTURE_IDS.event,
    conceptId: FIXTURE_IDS.concept,
    promptId: FIXTURE_IDS.prompt,
    sessionId: FIXTURE_IDS.session,
    at: '2026-11-12T07:30:00.000Z',
    localDate: '2026-11-12',
    rating: 'good',
    answer: null,
    ms: 8200,
    ...overrides,
  };
}
