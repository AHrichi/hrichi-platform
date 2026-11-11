import * as v from 'valibot';
import { CONCEPT_TYPES, LIMITS } from '../records';

/**
 * What the generative models must return, per task (design §6.2). These
 * valibot schemas are the single source: `strictJsonSchema` turns them into
 * the strict structured-output subset for the ladder, and the pipeline
 * parses every reply with them before the semantic checks. Size limits sit
 * in the descriptions too, because strict schemas drop `maxLength`.
 */

export const LEARNING_SPEC_VERSION = 1;

/** Prompt types the AI may write now; `contrast` waits for concept links. */
export const GENERATED_PROMPT_TYPES = [
  'free_recall',
  'cloze',
  'why',
  'apply',
  'spot_error',
  'quick_fire',
] as const;

// No v.trim(): it has no JSON Schema form, and strict mode needs one.
const text = (max: number, description: string) =>
  v.pipe(
    v.string(),
    v.minLength(1),
    v.maxLength(max),
    v.description(`${description} At most ${max} characters.`),
  );

export const ExtractedConceptSchema = v.strictObject({
  title: text(LIMITS.conceptTitle, 'A short name for the idea, 1–6 words.'),
  type: v.picklist(CONCEPT_TYPES),
  topic: text(
    LIMITS.topicName,
    'The subject it belongs to: one of the existing topics when one fits, else a new short name.',
  ),
  span: text(
    600,
    'The words of the capture this idea comes from, copied or lightly cleaned.',
  ),
});

export const ExtractedConceptsSchema = v.strictObject({
  concepts: v.pipe(
    v.array(ExtractedConceptSchema),
    v.minLength(1),
    v.maxLength(3),
    v.description('1 to 3 distinct ideas worth remembering.'),
  ),
});

export const GeneratedPromptSchema = v.strictObject({
  type: v.picklist(GENERATED_PROMPT_TYPES),
  question: text(LIMITS.question, 'The question the learner sees.'),
  answer: text(LIMITS.answer, 'The expected answer.'),
  options: v.nullable(
    v.pipe(
      v.array(text(LIMITS.answer, 'One option.')),
      v.description(
        'quick_fire only: 2–4 options, one equal to the answer. Otherwise null.',
      ),
    ),
  ),
  keyPoints: v.pipe(
    v.array(text(LIMITS.keyPoint, 'One point a good answer states.')),
    v.maxLength(LIMITS.keyPoints),
    v.description(
      'free_recall, why and apply: 1–4 short points a good answer must state. cloze and quick_fire: empty.',
    ),
  ),
});

export const ExplanationPartsSchema = v.strictObject({
  essence: text(
    LIMITS.essence,
    'The idea in one plain line, at most 20 words.',
  ),
  simple: text(
    LIMITS.explanation,
    'A plain explanation a 12-year-old follows, at most 80 words, jargon defined.',
  ),
  analogy: text(LIMITS.explanation, 'One "It is like…" comparison.'),
  misconception: text(
    LIMITS.explanation,
    'What people commonly get wrong about it, and the correction.',
  ),
});

export const ExplainedConceptSchema = v.strictObject({
  ...ExplanationPartsSchema.entries,
  prompts: v.pipe(
    v.array(GeneratedPromptSchema),
    v.minLength(3),
    v.maxLength(LIMITS.prompts),
    v.description('3 to 6 recall prompts in a mix of types.'),
  ),
  uncertain: v.pipe(
    v.boolean(),
    v.description(
      'true when the capture is vague or you are unsure the facts are right.',
    ),
  ),
});

export const RevisedExplanationSchema = ExplanationPartsSchema;

export type ExtractedConcept = v.InferOutput<typeof ExtractedConceptSchema>;
export type ExtractedConcepts = v.InferOutput<typeof ExtractedConceptsSchema>;
export type GeneratedPrompt = v.InferOutput<typeof GeneratedPromptSchema>;
export type ExplanationParts = v.InferOutput<typeof ExplanationPartsSchema>;
export type ExplainedConcept = v.InferOutput<typeof ExplainedConceptSchema>;

/** Inputs, as the pipeline builds them. */
export interface ExtractInput {
  text: string;
  sourceExcerpt: string | null;
  /** Existing topic names, so new captures join them. */
  topics: string[];
}

export interface ExplainInput {
  title: string;
  type: (typeof CONCEPT_TYPES)[number];
  span: string;
  /** The whole capture, for context. */
  capture: string;
}

export interface ReviseInput {
  title: string;
  explanation: ExplanationParts;
  /** e.g. "simpler", "focus on the formula". */
  instruction: string;
}

export const MAX_INSTRUCTION = 200;
