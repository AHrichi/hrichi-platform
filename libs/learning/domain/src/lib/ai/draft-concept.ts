import type { Concept, ConceptType } from '../records';
import type { ExplainedConcept } from './tasks';

export interface DraftConceptInput {
  title: string;
  type: ConceptType;
  topicId: string | null;
  span: string;
  captureId: string;
  explained: ExplainedConcept;
  /** Prompt indexes the quality gate retired (their question leaks the answer). */
  retired?: number[];
  now: Date;
  newId?: () => string;
}

/**
 * A concept the AI wrote from a capture: a `draft` that waits in the digest
 * until the learner keeps it, or 48 hours pass (design §1). Its source
 * points back at the capture.
 */
export function draftConceptFrom(input: DraftConceptInput): Concept {
  const newId = input.newId ?? (() => crypto.randomUUID());
  const at = input.now.toISOString();
  const retired = new Set(input.retired ?? []);
  const { explained } = input;
  return {
    id: newId(),
    updatedAt: at,
    deletedAt: null,
    topicId: input.topicId,
    title: input.title,
    type: input.type,
    status: 'draft',
    explanation: {
      essence: explained.essence,
      simple: explained.simple,
      analogy: explained.analogy,
      misconception: explained.misconception,
      ownWords: null,
      by: 'ai',
    },
    prompts: explained.prompts.map((prompt, i) => ({
      id: newId(),
      type: prompt.type,
      question: prompt.question,
      answer: prompt.answer,
      options: prompt.options,
      keyPoints: prompt.keyPoints,
      retired: retired.has(i),
    })),
    sources: [
      {
        app: 'learning',
        objectType: 'capture',
        objectId: input.captureId,
        deepLink: null,
        excerpt: input.span.slice(0, 500),
      },
    ],
    confirmedAt: null,
    version: 1,
    createdAt: at,
  };
}

/** The capture a draft came from, if any. */
export function captureIdOf(concept: Concept): string | null {
  return (
    concept.sources.find(
      (source) => source.app === 'learning' && source.objectType === 'capture',
    )?.objectId ?? null
  );
}
