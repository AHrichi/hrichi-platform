import type { Concept } from './records';

/**
 * What a learner types to add a concept by hand (phase L1, before AI
 * capture): a title, the idea in a line, and one question with its answer.
 */
export interface ConceptDraft {
  title: string;
  essence: string;
  question: string;
  answer: string;
}

/**
 * A complete, kept concept from a draft. It is `active` and confirmed at
 * once: the learner wrote it, so there is nothing to review in the digest.
 */
export function conceptFromDraft(
  draft: ConceptDraft,
  now: Date,
  newId: () => string = () => crypto.randomUUID(),
): Concept {
  const at = now.toISOString();
  return {
    id: newId(),
    updatedAt: at,
    deletedAt: null,
    topicId: null,
    title: draft.title.trim(),
    type: 'definition',
    status: 'active',
    explanation: {
      essence: draft.essence.trim(),
      simple: null,
      analogy: null,
      misconception: null,
      ownWords: null,
      by: 'user',
    },
    prompts: [
      {
        id: newId(),
        type: 'free_recall',
        question: draft.question.trim(),
        answer: draft.answer.trim(),
        options: null,
        keyPoints: [],
        retired: false,
      },
    ],
    sources: [],
    confirmedAt: at,
    createdAt: at,
  };
}
