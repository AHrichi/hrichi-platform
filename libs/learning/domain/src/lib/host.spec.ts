import * as v from 'valibot';
import {
  HostAnswersRequestSchema,
  HostCapturesRequestSchema,
  hostCapture,
  hostCaptureId,
  hostProgress,
  hostReviewEvents,
  hostSessionId,
  nameUuid,
} from './host';
import {
  CaptureSchema,
  ReviewEventSchema,
  type ReviewSession,
} from './records';
import {
  FIXTURE_IDS,
  sampleCapture,
  sampleConcept,
  sampleEvent,
} from './testing/fixtures';

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-8[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const now = new Date('2026-11-12T10:00:00.000Z');
const source = {
  app: 'studylm',
  objectType: 'flashcard',
  objectId: 'fc-1',
  deepLink: 'https://product-studylm.ahmed-hrichi.workers.dev/flashcards',
  excerpt: 'What does BFS use for its frontier?',
};
const answer = {
  id: '3f0c4d1e-9a6b-4c1d-8e2f-1a2b3c4d5e6f',
  objectType: 'flashcard',
  objectId: 'fc-1',
  rating: 'good' as const,
  at: '2026-11-12T09:30:00.000Z',
  ms: 4200,
};

describe('derived ids', () => {
  it('are stable UUIDs, different for different names', async () => {
    const a = await hostCaptureId('studylm', 'flashcard', 'fc-1');
    expect(a).toMatch(UUID);
    expect(await hostCaptureId('studylm', 'flashcard', 'fc-1')).toBe(a);
    expect(await hostCaptureId('studylm', 'flashcard', 'fc-2')).not.toBe(a);
    expect(await hostCaptureId('studylm', 'quiz', 'fc-1')).not.toBe(a);
    expect(await nameUuid('x')).toMatch(UUID);
  });

  it('give a host one session per day', async () => {
    const monday = await hostSessionId('studylm', '2026-11-09');
    expect(await hostSessionId('studylm', '2026-11-09')).toBe(monday);
    expect(await hostSessionId('studylm', '2026-11-10')).not.toBe(monday);
  });
});

describe('the request schemas', () => {
  it('accept a host card and refuse one without a source', () => {
    expect(
      v.safeParse(HostCapturesRequestSchema, {
        items: [{ text: 'BFS uses a queue.', source }],
      }).success,
    ).toBe(true);
    expect(
      v.safeParse(HostCapturesRequestSchema, {
        items: [{ text: 'BFS uses a queue.', source: null }],
      }).success,
    ).toBe(false);
    expect(v.safeParse(HostCapturesRequestSchema, { items: [] }).success).toBe(
      false,
    );
  });

  it('check the time zone and the answers', () => {
    const ok = { timeZone: 'Europe/Paris', answers: [answer] };
    expect(v.safeParse(HostAnswersRequestSchema, ok).success).toBe(true);
    expect(
      v.safeParse(HostAnswersRequestSchema, { ...ok, timeZone: 'Mars/Base' })
        .success,
    ).toBe(false);
    expect(
      v.safeParse(HostAnswersRequestSchema, {
        ...ok,
        answers: [{ ...answer, rating: 'perfect' }],
      }).success,
    ).toBe(false);
  });
});

describe('a host capture', () => {
  it('is a valid queued capture that skips triage, with the host as source', () => {
    const capture = hostCapture({
      id: FIXTURE_IDS.capture,
      app: 'studylm',
      text: '  BFS uses a queue.  ',
      source: { ...source, app: 'somebody-else' },
      now,
    });
    expect(v.safeParse(CaptureSchema, capture).success).toBe(true);
    expect(capture).toMatchObject({
      modality: 'host',
      status: 'queued',
      force: true,
      text: 'BFS uses a queue.',
      source: { app: 'studylm', objectId: 'fc-1' },
    });
  });
});

describe('answers from a host', () => {
  const concept = sampleConcept();

  it('become one review event per concept in review, on the learner’s day', async () => {
    const events = await hostReviewEvents({
      app: 'studylm',
      answer: { ...answer, at: '2026-11-12T02:30:00.000Z' },
      concepts: [concept],
      timeZone: 'Europe/Paris',
      now,
    });
    expect(events).toHaveLength(1);
    const [event] = events;
    expect(v.safeParse(ReviewEventSchema, event).success).toBe(true);
    expect(event).toMatchObject({
      conceptId: concept.id,
      promptId: FIXTURE_IDS.prompt,
      rating: 'good',
      // 03:30 in Paris is before the 04:00 day start: yesterday.
      localDate: '2026-11-11',
      sessionId: await hostSessionId('studylm', '2026-11-11'),
    });
  });

  it('count once: a retry derives the same event id', async () => {
    const input = {
      app: 'studylm',
      answer,
      concepts: [concept],
      timeZone: 'UTC',
      now,
    };
    const [first] = await hostReviewEvents(input);
    const [again] = await hostReviewEvents(input);
    expect(again.id).toBe(first.id);
  });

  it('skip drafts, removed concepts, retired prompts, and old or future answers', async () => {
    const base = { app: 'studylm', timeZone: 'UTC', now };
    const none = async (
      overrides: Partial<Parameters<typeof hostReviewEvents>[0]>,
    ) =>
      (
        await hostReviewEvents({
          ...base,
          answer,
          concepts: [concept],
          ...overrides,
        })
      ).length;
    expect(await none({ concepts: [sampleConcept({ status: 'draft' })] })).toBe(
      0,
    );
    expect(
      await none({
        concepts: [sampleConcept({ deletedAt: now.toISOString() })],
      }),
    ).toBe(0);
    expect(
      await none({
        concepts: [
          sampleConcept({
            prompts: concept.prompts.map((p) => ({ ...p, retired: true })),
          }),
        ],
      }),
    ).toBe(0);
    expect(
      await none({ answer: { ...answer, at: '2026-12-01T00:00:00.000Z' } }),
    ).toBe(0);
    expect(
      await none({ answer: { ...answer, at: '2026-09-01T00:00:00.000Z' } }),
    ).toBe(0);
  });
});

describe('a host’s progress', () => {
  const kept = sampleConcept();
  const draft = sampleConcept({
    id: '0b6f0c30-0000-4000-8000-0000000000d1',
    status: 'draft',
  });
  const captures = [
    sampleCapture({
      id: '0b6f0c30-0000-4000-8000-0000000000c1',
      source,
      modality: 'host',
      status: 'ready',
      conceptIds: [kept.id],
      capturedAt: '2026-11-10T08:00:00.000Z',
    }),
    sampleCapture({
      id: '0b6f0c30-0000-4000-8000-0000000000c2',
      source: { ...source, objectId: 'fc-2' },
      modality: 'host',
      status: 'ready',
      conceptIds: [draft.id],
      capturedAt: '2026-11-11T08:00:00.000Z',
    }),
    sampleCapture({
      id: '0b6f0c30-0000-4000-8000-0000000000c3',
      source: { ...source, objectId: 'fc-3' },
      modality: 'host',
      status: 'queued',
      capturedAt: '2026-11-12T08:00:00.000Z',
    }),
    // Another app's card is not this host's.
    sampleCapture({
      id: '0b6f0c30-0000-4000-8000-0000000000c4',
      source: { ...source, app: 'telegram' },
    }),
  ];
  const set: ReviewSession = {
    id: FIXTURE_IDS.session,
    updatedAt: now.toISOString(),
    deletedAt: null,
    localDate: '2026-11-12',
    kind: 'daily',
    planned: [{ conceptId: kept.id, promptId: FIXTURE_IDS.prompt }],
    lighter: false,
    startedAt: now.toISOString(),
    completedAt: null,
  };

  it('lists the host’s cards newest first, with stages and tiers', () => {
    const progress = hostProgress({
      app: 'studylm',
      captures,
      concepts: [kept, draft],
      events: [
        sampleEvent({
          at: '2026-11-11T08:00:00.000Z',
          localDate: '2026-11-11',
          id: '0b6f0c30-0000-4000-8000-0000000000e1',
        }),
        sampleEvent(),
      ],
      sessions: [set],
      timeZone: 'UTC',
      now,
    });
    expect(progress.localDate).toBe('2026-11-12');
    expect(progress.items.map((item) => [item.objectId, item.stage])).toEqual([
      ['fc-3', 'waiting'],
      ['fc-2', 'draft'],
      ['fc-1', 'reviewing'],
    ]);
    // Two good answers a day apart: stability past 3 days.
    expect(progress.items[2].tier).toBe('leaf');
    expect(progress.items[2].due).toMatch(/^2026-11-\d\d$/);
    expect(progress.tiers).toEqual({
      seed: 0,
      sprout: 0,
      leaf: 1,
      bloom: 0,
      golden: 0,
    });
    expect(progress.streak).toEqual({
      current: 2,
      longest: 2,
      todayCounted: true,
    });
    expect(progress.today).toEqual({ total: 1, done: 1, finished: false });
    expect(progress.conceptsInReview).toBe(1);
  });

  it('shows a removed card as removed, and no set before one starts', () => {
    const progress = hostProgress({
      app: 'studylm',
      captures: [{ ...captures[0], deletedAt: now.toISOString() }],
      concepts: [kept],
      events: [],
      sessions: [],
      timeZone: 'UTC',
      now,
    });
    expect(progress.items[0]).toMatchObject({ stage: 'removed', tier: null });
    expect(progress.today).toBeNull();
    expect(progress.tiers.seed).toBe(1);
  });
});
