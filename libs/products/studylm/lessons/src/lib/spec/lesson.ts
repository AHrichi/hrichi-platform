import * as v from 'valibot';
import { BLOCK_KINDS, BlockSchema } from './blocks';
import {
  Id,
  int,
  LIMITS,
  list,
  SPEC_VERSION,
  text,
  TierSchema,
} from './primitives';

export const SECTION_INTENTS = [
  'hook',
  'explain',
  'example',
  'practice',
  'recap',
] as const;

const SectionIntent = v.pipe(
  v.picklist(SECTION_INTENTS),
  v.description(
    'hook: a question or problem that makes the topic matter; explain: how it works; example: a worked example; practice: the learner does it; recap: retrieval of the key points.',
  ),
);

/**
 * Flashcard seeds, sorted the way Ultralearning sorts what is learnt:
 * concepts are understood, facts are remembered, procedures are practised.
 */
export const CARD_TYPES = ['concept', 'fact', 'procedure'] as const;

export const CardSeedSchema = v.strictObject({
  type: v.picklist(CARD_TYPES),
  front: text(200, 'The question side: one idea, answerable from memory.'),
  back: text(LIMITS.textChars, 'The answer side.'),
});

export const SectionSchema = v.strictObject({
  id: Id,
  title: text(LIMITS.titleChars, 'The section heading.'),
  intent: SectionIntent,
  blocks: list(
    BlockSchema,
    1,
    LIMITS.blocksPerSection,
    'The blocks, in order.',
  ),
});

const Minutes = int(
  LIMITS.minutesMin,
  LIMITS.minutesMax,
  'Minutes a focused learner needs for the whole lesson.',
);
const Objectives = list(
  text(160, 'What the learner can do afterwards, starting with a verb.'),
  1,
  LIMITS.objectives,
  'Learning objectives.',
);
const Cards = v.pipe(
  v.array(CardSeedSchema),
  v.maxLength(LIMITS.cards),
  v.description(
    `Flashcards for spaced review, at most ${LIMITS.cards}: the facts and ideas worth keeping for weeks.`,
  ),
);

export const LessonSchema = v.strictObject({
  specVersion: v.literal(SPEC_VERSION),
  id: Id,
  sectionId: text(64, 'The roadmap section this lesson teaches.'),
  title: text(LIMITS.titleChars, 'The lesson title.'),
  tier: TierSchema,
  minutes: Minutes,
  objectives: Objectives,
  sections: list(SectionSchema, 1, LIMITS.sections, "The lesson's sections."),
  cards: Cards,
});

/**
 * The first generation call: the lesson's shape, with a short brief for
 * each block. Each block is then generated against its own small schema.
 */
export const LessonOutlineSchema = v.strictObject({
  title: text(LIMITS.titleChars, 'The lesson title.'),
  minutes: Minutes,
  objectives: Objectives,
  sections: list(
    v.strictObject({
      id: Id,
      title: text(LIMITS.titleChars, 'The section heading.'),
      intent: SectionIntent,
      blocks: list(
        v.strictObject({
          id: Id,
          kind: v.pipe(
            v.picklist(BLOCK_KINDS),
            v.description('The block kind, from the catalog.'),
          ),
          brief: text(
            240,
            'What this block must show or ask, specific enough to generate it alone: name the example, data and point it makes.',
          ),
        }),
        1,
        LIMITS.blocksPerSection,
        'The planned blocks, in order.',
      ),
    }),
    1,
    LIMITS.sections,
    'The planned sections.',
  ),
  cards: Cards,
});

export const SelfExplainFeedbackSchema = v.strictObject({
  verdict: v.picklist(['correct', 'partial', 'incorrect']),
  strengths: v.pipe(
    v.array(text(160, 'Something the answer got right.')),
    v.maxLength(3),
    v.description('What the answer got right, at most 3.'),
  ),
  gaps: v.pipe(
    v.array(text(160, 'A rubric point the answer missed or got wrong.')),
    v.maxLength(3),
    v.description('What is missing or wrong, at most 3.'),
  ),
  hint: v.nullable(
    text(
      240,
      'A nudge towards the missing idea that does not give the answer away.',
    ),
  ),
});

export type CardSeed = v.InferOutput<typeof CardSeedSchema>;
export type Section = v.InferOutput<typeof SectionSchema>;
export type Lesson = v.InferOutput<typeof LessonSchema>;
export type LessonOutline = v.InferOutput<typeof LessonOutlineSchema>;
export type SelfExplainFeedback = v.InferOutput<
  typeof SelfExplainFeedbackSchema
>;
export type SectionIntentName = (typeof SECTION_INTENTS)[number];
