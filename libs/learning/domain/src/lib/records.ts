import * as v from 'valibot';

/**
 * The records the Learning Engine syncs between devices (design §4.1).
 *
 * Every record carries a client-made UUID, `updatedAt` and a nullable
 * `deletedAt` (a tombstone, so a deletion syncs like any other change).
 * Topics and concepts change over time and merge last-writer-wins; review
 * events are append-only. FSRS memory, streaks and XP are never records:
 * they are derived from the events.
 */

export const LIMITS = {
  topicName: 60,
  conceptTitle: 120,
  essence: 280,
  explanation: 1200,
  question: 400,
  answer: 1200,
  keyPoint: 160,
  keyPoints: 4,
  options: 4,
  prompts: 6,
  sources: 5,
  excerpt: 500,
  url: 2048,
  captureText: 4000,
  captureError: 300,
} as const;

/**
 * The writer id of versions the API writes (the capture pipeline). Device
 * ids are random UUIDs; this fixed one sorts below them, which only matters
 * on an exact timestamp tie.
 */
export const SERVER_WRITER = '00000000-0000-4000-8000-000000000000';

const Id = v.pipe(v.string(), v.uuid());
const Timestamp = v.pipe(v.string(), v.isoTimestamp());
const LocalDate = v.pipe(v.string(), v.isoDate());
const text = (max: number) => v.pipe(v.string(), v.trim(), v.maxLength(max));
const required = (max: number) =>
  v.pipe(v.string(), v.trim(), v.minLength(1), v.maxLength(max));

const envelope = {
  id: Id,
  updatedAt: Timestamp,
  deletedAt: v.nullable(Timestamp),
};

export const TopicSchema = v.strictObject({
  ...envelope,
  name: required(LIMITS.topicName),
  parentId: v.nullable(Id),
  /** 0–359, the topic's colour in the garden. */
  hue: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(359)),
});

export const CONCEPT_TYPES = [
  'definition',
  'process',
  'cause_effect',
  'fact',
  'skill',
  'comparison',
] as const;

export const CONCEPT_STATUSES = [
  'draft',
  'active',
  'suspended',
  'archived',
] as const;

export const PROMPT_TYPES = [
  'free_recall',
  'cloze',
  'why',
  'apply',
  'contrast',
  'spot_error',
  'quick_fire',
] as const;

export const ExplanationSchema = v.strictObject({
  /** One line, the idea in plain words. */
  essence: required(LIMITS.essence),
  simple: v.nullable(text(LIMITS.explanation)),
  analogy: v.nullable(text(LIMITS.explanation)),
  misconception: v.nullable(text(LIMITS.explanation)),
  /** The learner's own attempt, kept beside the AI's version. */
  ownWords: v.nullable(text(LIMITS.explanation)),
  by: v.picklist(['ai', 'user']),
});

export const RecallPromptSchema = v.strictObject({
  id: Id,
  type: v.picklist(PROMPT_TYPES),
  question: required(LIMITS.question),
  answer: required(LIMITS.answer),
  options: v.nullable(
    v.pipe(v.array(required(LIMITS.answer)), v.maxLength(LIMITS.options)),
  ),
  /** Short statements a good answer contains; grading checks each (§6.4). */
  keyPoints: v.pipe(
    v.array(required(LIMITS.keyPoint)),
    v.maxLength(LIMITS.keyPoints),
  ),
  retired: v.boolean(),
});

export const SourceRefSchema = v.strictObject({
  app: required(40),
  objectType: required(40),
  objectId: required(120),
  deepLink: v.nullable(v.pipe(v.string(), v.url(), v.maxLength(LIMITS.url))),
  excerpt: v.nullable(text(LIMITS.excerpt)),
});

export const ConceptSchema = v.strictObject({
  ...envelope,
  topicId: v.nullable(Id),
  title: required(LIMITS.conceptTitle),
  type: v.picklist(CONCEPT_TYPES),
  status: v.picklist(CONCEPT_STATUSES),
  explanation: ExplanationSchema,
  prompts: v.pipe(
    v.array(RecallPromptSchema),
    v.minLength(1),
    v.maxLength(LIMITS.prompts),
  ),
  sources: v.pipe(v.array(SourceRefSchema), v.maxLength(LIMITS.sources)),
  confirmedAt: v.nullable(Timestamp),
  createdAt: Timestamp,
});

export const CAPTURE_MODALITIES = ['text', 'voice', 'share', 'host'] as const;

export const CAPTURE_STATUSES = [
  /** Waiting for the pipeline (or, for voice, for its audio). */
  'queued',
  /** The pipeline is working on it. */
  'processing',
  /** Its concepts are in the digest. */
  'ready',
  /** Processed, but a person should look first (see `error`). */
  'needs_look',
  /** The AI failed three times; the learner can retry. */
  'failed',
] as const;

/**
 * A raw capture, kept exactly as given (design §1): the AI's concepts can be
 * regenerated from it later. The device creates it; the pipeline moves its
 * status on.
 */
export const CaptureSchema = v.strictObject({
  ...envelope,
  modality: v.picklist(CAPTURE_MODALITIES),
  /** What was typed or shared; null for a voice note until transcribed. */
  text: v.nullable(text(LIMITS.captureText)),
  /** A voice note waits for its audio upload before processing. */
  hasAudio: v.boolean(),
  transcript: v.nullable(text(LIMITS.captureText)),
  source: v.nullable(SourceRefSchema),
  status: v.picklist(CAPTURE_STATUSES),
  attempts: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(10)),
  error: v.nullable(text(LIMITS.captureError)),
  /** Process even if triage thinks it isn't learnable. */
  force: v.boolean(),
  conceptIds: v.pipe(v.array(Id), v.maxLength(3)),
  capturedAt: Timestamp,
});

export const RATINGS = ['again', 'hard', 'good', 'easy'] as const;

/** One answer in a review. Append-only: never edited, never deleted. */
export const ReviewEventSchema = v.strictObject({
  id: Id,
  conceptId: Id,
  promptId: Id,
  sessionId: Id,
  at: Timestamp,
  /** The learner's day it counts for (see localDateOf). */
  localDate: LocalDate,
  rating: v.picklist(RATINGS),
  answer: v.nullable(text(LIMITS.answer)),
  /** Time from showing the prompt to grading it. */
  ms: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(3_600_000)),
});

export type Topic = v.InferOutput<typeof TopicSchema>;
export type ConceptType = (typeof CONCEPT_TYPES)[number];
export type ConceptStatus = (typeof CONCEPT_STATUSES)[number];
export type PromptType = (typeof PROMPT_TYPES)[number];
export type Explanation = v.InferOutput<typeof ExplanationSchema>;
export type RecallPrompt = v.InferOutput<typeof RecallPromptSchema>;
export type SourceRef = v.InferOutput<typeof SourceRefSchema>;
export type Concept = v.InferOutput<typeof ConceptSchema>;
export type Rating = (typeof RATINGS)[number];
export type ReviewEvent = v.InferOutput<typeof ReviewEventSchema>;
export type Capture = v.InferOutput<typeof CaptureSchema>;
export type CaptureStatus = (typeof CAPTURE_STATUSES)[number];
export type CaptureModality = (typeof CAPTURE_MODALITIES)[number];

/** Records that change and merge last-writer-wins. */
export const MUTABLE_KINDS = ['topic', 'concept', 'capture'] as const;
/** Records that are only ever added. */
export const APPEND_ONLY_KINDS = ['event'] as const;
export const RECORD_KINDS = [...MUTABLE_KINDS, ...APPEND_ONLY_KINDS] as const;

export type MutableKind = (typeof MUTABLE_KINDS)[number];
export type AppendOnlyKind = (typeof APPEND_ONLY_KINDS)[number];
export type RecordKind = (typeof RECORD_KINDS)[number];

export interface RecordOfKind {
  topic: Topic;
  concept: Concept;
  capture: Capture;
  event: ReviewEvent;
}

export const RECORD_SCHEMAS = {
  topic: TopicSchema,
  concept: ConceptSchema,
  capture: CaptureSchema,
  event: ReviewEventSchema,
} as const;

export function isMutableKind(kind: RecordKind): kind is MutableKind {
  return (MUTABLE_KINDS as readonly string[]).includes(kind);
}
