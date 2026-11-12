import * as v from 'valibot';
import { isValidTimeZone, localDateOf } from './local-date';
import { isFromTheFuture } from './merge';
import {
  type Capture,
  type Concept,
  LIMITS,
  RATINGS,
  type Rating,
  type ReviewEvent,
  type ReviewSession,
  SourceRefSchema,
} from './records';
import {
  dueDateOf,
  type MasteryTier,
  memoryOf,
  retrievability,
  tierOf,
} from './schedule/memory';
import { computeStreak, countedDays } from './schedule/streak';

/**
 * Linked hosts (design §9): a host app such as StudyLM, on its own origin,
 * sends cards, reports answers and reads progress through the API with a
 * host token. These are the request schemas the API validates with, and
 * the pure rules behind each route. The matching types for host apps are
 * in `@ah/learning/contracts` (host.ts); the API checks they agree.
 */
export const HOST_RULES = {
  captures: 20,
  answers: 100,
  /** Older answers (from a host's outbox) are not counted. */
  answerAgeDays: 30,
  items: 1000,
  name: 40,
  /** Recall below this is "wilting" (design §5.3). */
  wiltingBelow: 0.8,
} as const;

const required = (max: number) =>
  v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(max));

/** A host app's id; the API checks it against the known hosts. */
const HostAppSchema = v.pipe(v.string(), v.regex(/^[a-z][a-z0-9-]{1,39}$/));

export const HostLinkRequestSchema = v.strictObject({
  app: HostAppSchema,
  name: required(HOST_RULES.name),
});

export const HostCapturesRequestSchema = v.strictObject({
  items: v.pipe(
    v.array(
      v.strictObject({
        text: required(LIMITS.captureText),
        // The card's identity; the API replaces `app` with the token's.
        source: SourceRefSchema,
      }),
    ),
    v.minLength(1),
    v.maxLength(HOST_RULES.captures),
  ),
});

export const HostAnswerSchema = v.strictObject({
  id: v.pipe(v.string(), v.uuid()),
  objectType: required(40),
  objectId: required(120),
  rating: v.picklist(RATINGS),
  at: v.pipe(v.string(), v.isoTimestamp()),
  ms: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(3_600_000)),
});

export const TimeZoneSchema = v.pipe(
  v.string(),
  v.maxLength(64),
  v.check(isValidTimeZone, 'That is not a time zone.'),
);

export const HostAnswersRequestSchema = v.strictObject({
  timeZone: TimeZoneSchema,
  answers: v.pipe(
    v.array(HostAnswerSchema),
    v.minLength(1),
    v.maxLength(HOST_RULES.answers),
  ),
});

export type HostLinkRequestBody = v.InferOutput<typeof HostLinkRequestSchema>;
export type HostCapturesRequestBody = v.InferOutput<
  typeof HostCapturesRequestSchema
>;
export type HostAnswerBody = v.InferOutput<typeof HostAnswerSchema>;
export type HostAnswersRequestBody = v.InferOutput<
  typeof HostAnswersRequestSchema
>;

/**
 * A UUID made from a name (SHA-256, the RFC 9562 version 8 layout), so the
 * server and every device derive the same id for the same thing. Web
 * Crypto only, which Node, browsers and Workers all have.
 */
export async function nameUuid(name: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(name),
  );
  const bytes = new Uint8Array(digest).slice(0, 16);
  bytes[6] = (bytes[6] & 0x0f) | 0x80;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20),
  ].join('-');
}

/** One capture per host card: sending it again, from any device, is a no-op. */
export function hostCaptureId(
  app: string,
  objectType: string,
  objectId: string,
): Promise<string> {
  return nameUuid(`host-capture\n${app}\n${objectType}\n${objectId}`);
}

/**
 * The session a host's answers are filed under: one per app and day, never
 * a stored set, so they count for memory, the streak and XP but never as
 * today's Daily Set or for "Lighter set today".
 */
export function hostSessionId(app: string, localDate: string): Promise<string> {
  return nameUuid(`host-session\n${app}\n${localDate}`);
}

/** A new capture for a host card, queued for the pipeline. */
export function hostCapture(input: {
  id: string;
  app: string;
  text: string;
  source: Capture['source'] & object;
  now: Date;
}): Capture {
  const at = input.now.toISOString();
  return {
    id: input.id,
    updatedAt: at,
    deletedAt: null,
    modality: 'host',
    text: input.text.trim().slice(0, LIMITS.captureText),
    hasAudio: false,
    transcript: null,
    source: { ...input.source, app: input.app },
    status: 'queued',
    attempts: 0,
    error: null,
    // A host card is learnable by definition: no triage.
    force: true,
    conceptIds: [],
    capturedAt: at,
  };
}

/**
 * The review events for one answer in a host app (design §9): one per
 * concept its card became, once that concept is in the reviews. A draft,
 * a removed concept, an answer from the future or older than 30 days
 * counts for nothing. Ids are derived, so a retried answer counts once.
 */
export async function hostReviewEvents(input: {
  app: string;
  answer: HostAnswerBody;
  /** The concepts the answer's card became (its capture's `conceptIds`). */
  concepts: readonly Concept[];
  timeZone: string;
  now: Date;
}): Promise<ReviewEvent[]> {
  const { answer, now } = input;
  const at = new Date(answer.at);
  const age = now.getTime() - at.getTime();
  if (
    isFromTheFuture(answer.at, now) ||
    age > HOST_RULES.answerAgeDays * 86_400_000
  ) {
    return [];
  }
  const localDate = localDateOf(at, input.timeZone);
  const sessionId = await hostSessionId(input.app, localDate);
  const events: ReviewEvent[] = [];
  for (const concept of input.concepts) {
    if (concept.deletedAt || concept.status !== 'active') continue;
    const prompt = concept.prompts.find((p) => !p.retired);
    if (!prompt) continue;
    events.push({
      id: await nameUuid(`host-event\n${answer.id}\n${concept.id}`),
      conceptId: concept.id,
      promptId: prompt.id,
      sessionId,
      at: at.toISOString(),
      localDate,
      rating: answer.rating as Rating,
      answer: null,
      ms: answer.ms,
    });
  }
  return events;
}

export type HostStage =
  'waiting' | 'draft' | 'reviewing' | 'needs_look' | 'failed' | 'removed';

export interface HostItemProgress {
  objectType: string;
  objectId: string;
  stage: HostStage;
  tier: MasteryTier | null;
  due: string | null;
}

/** What a host's stats show (contracts' `HostState` without the token). */
export interface HostProgress {
  localDate: string;
  streak: { current: number; longest: number; todayCounted: boolean };
  today: { total: number; done: number; finished: boolean } | null;
  tiers: Record<MasteryTier, number>;
  wilting: number;
  items: HostItemProgress[];
  conceptsInReview: number;
}

const TIER_ORDER: readonly MasteryTier[] = [
  'seed',
  'sprout',
  'leaf',
  'bloom',
  'golden',
];

/**
 * The engine's progress for one host app, from the synced records: the
 * streak and today's set (from every app), and where each of the host's
 * cards is, with its concepts' tiers.
 */
export function hostProgress(input: {
  app: string;
  captures: readonly Capture[];
  concepts: readonly Concept[];
  events: readonly ReviewEvent[];
  sessions: readonly ReviewSession[];
  timeZone: string;
  now: Date;
}): HostProgress {
  const { now, timeZone } = input;
  const today = localDateOf(now, timeZone);
  const live = new Map(
    input.concepts
      .filter((concept) => !concept.deletedAt)
      .map((concept) => [concept.id, concept]),
  );
  const inReview = [...live.values()].filter((c) => c.status === 'active');
  const memory = memoryOf(inReview, input.events);
  const sessions = input.sessions.filter((session) => !session.deletedAt);
  const days = countedDays(input.events, sessions);
  const streak = computeStreak(days.counted, days.full, today, days.doubled);

  const set = sessions.find(
    (session) => session.kind === 'daily' && session.localDate === today,
  );
  const done = set
    ? new Set(
        input.events
          .filter((event) => event.sessionId === set.id)
          .map((event) => event.conceptId),
      ).size
    : 0;

  const tiers: Record<MasteryTier, number> = {
    seed: 0,
    sprout: 0,
    leaf: 0,
    bloom: 0,
    golden: 0,
  };
  let wilting = 0;
  const counted = new Set<string>();
  const items: HostItemProgress[] = [];
  const mine = input.captures
    .filter((capture) => capture.source?.app === input.app)
    .sort((a, b) => b.capturedAt.localeCompare(a.capturedAt));

  for (const capture of mine) {
    const source = capture.source as NonNullable<Capture['source']>;
    const concepts = capture.conceptIds
      .map((id) => live.get(id))
      .filter((concept): concept is Concept => !!concept);
    const reviewing = concepts.filter((c) => c.status === 'active');
    let stage: HostStage;
    if (capture.deletedAt) stage = 'removed';
    else if (capture.status === 'queued' || capture.status === 'processing')
      stage = 'waiting';
    else if (capture.status === 'failed') stage = 'failed';
    else if (reviewing.length) stage = 'reviewing';
    else if (concepts.length) stage = 'draft';
    else if (capture.status === 'needs_look') stage = 'needs_look';
    else stage = 'removed';

    let tier: MasteryTier | null = null;
    let due: string | null = null;
    for (const concept of reviewing) {
      const state = memory.get(concept.id);
      if (!state) continue;
      const own = tierOf(state);
      if (tier === null || TIER_ORDER.indexOf(own) < TIER_ORDER.indexOf(tier)) {
        tier = own;
      }
      const next = dueDateOf(state, timeZone);
      if (next && (!due || next < due)) due = next;
      if (counted.has(concept.id)) continue;
      counted.add(concept.id);
      tiers[own] += 1;
      if (state.reps && retrievability(state, now) < HOST_RULES.wiltingBelow) {
        wilting += 1;
      }
    }
    if (items.length < HOST_RULES.items) {
      items.push({
        objectType: source.objectType,
        objectId: source.objectId,
        stage,
        tier: stage === 'reviewing' ? (tier ?? 'seed') : null,
        due,
      });
    }
  }

  return {
    localDate: today,
    streak: {
      current: streak.current,
      longest: streak.longest,
      todayCounted: streak.todayCounted,
    },
    today: set
      ? {
          total: set.planned.length,
          done,
          finished: !!set.completedAt,
        }
      : null,
    tiers,
    wilting,
    items,
    conceptsInReview: inReview.length,
  };
}
