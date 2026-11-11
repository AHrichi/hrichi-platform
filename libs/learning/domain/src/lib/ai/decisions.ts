import type { ExplainedConcept } from './tasks';

/**
 * The judging tasks, as typed questions for a decision model (design §6.4).
 * These types match api-ai's DecisionQuestion and DecisionAnswer, so the
 * domain decides what to ask and how to read the answers, and the API only
 * carries them.
 */
export type Question =
  | {
      type: 'noul';
      instructions: string;
      criteria?: { true: string; false: string };
    }
  | {
      type: 'choice';
      instructions: string;
      criteria: Record<string, string | null>;
    }
  | {
      type: 'score';
      instructions: string;
      /** 2–10 levels, lowest first. */
      criteria: string[];
    };

export type Answer =
  | { type: 'noul'; p: number }
  | {
      type: 'choice';
      choice: string;
      confidence: number;
      probabilities: Record<string, number>;
    }
  | {
      type: 'score';
      score: number;
      confidence: number;
      probabilities: number[];
    };

/** At or above: yes. Below 1 − this: no. Between: unsure. */
export const CONFIDENT = 0.65;

export const TRIAGE_QUESTIONS: Record<string, Question> = {
  kind: {
    type: 'choice',
    instructions: 'What is this note the learner captured?',
    criteria: {
      learnable: 'an idea, fact, term or skill worth remembering',
      todo: 'a task, reminder or plan',
      noise: 'too short or unclear to learn anything from',
    },
  },
};

export type TriageVerdict = 'learnable' | 'todo' | 'noise' | 'unsure';

/** A capture goes on unless the model is confident it isn't learnable. */
export function readTriage(answers: Record<string, Answer>): TriageVerdict {
  const answer = answers['kind'];
  if (!answer || answer.type !== 'choice') return 'unsure';
  if (answer.confidence < CONFIDENT) return 'unsure';
  return (
    (['learnable', 'todo', 'noise'] as const).find(
      (kind) => kind === answer.choice,
    ) ?? 'unsure'
  );
}

/** The state Jev judges: only what the questions need (context rot). */
export function gateState(span: string, explained: ExplainedConcept) {
  return {
    source: span,
    explanation: {
      essence: explained.essence,
      simple: explained.simple,
      misconception: explained.misconception,
    },
    prompts: explained.prompts.map((prompt) => ({
      question: prompt.question,
      answer: prompt.answer,
    })),
  };
}

export function gateQuestions(
  explained: ExplainedConcept,
): Record<string, Question> {
  const questions: Record<string, Question> = {
    faithful: {
      type: 'noul',
      instructions:
        'Does the explanation state only things the source supports or that are common knowledge, with no false claim?',
    },
    misconception: {
      type: 'noul',
      instructions:
        'Is the belief described as the misconception actually false, and is its correction right?',
    },
  };
  explained.prompts.forEach((_, i) => {
    questions[`leak${i}`] = {
      type: 'noul',
      instructions: `Does prompt ${i}'s question give away its own answer?`,
    };
  });
  return questions;
}

export interface GateVerdict {
  /** A person should look before this concept is trusted. */
  needsLook: boolean;
  reasons: string[];
  /** Prompts to retire because the question gives the answer away. */
  leakyPrompts: number[];
}

export function readGate(
  answers: Record<string, Answer>,
  promptCount: number,
): GateVerdict {
  const p = (key: string) => {
    const answer = answers[key];
    return answer?.type === 'noul' ? answer.p : 0.5;
  };
  const reasons: string[] = [];
  if (p('faithful') < 1 - CONFIDENT) {
    reasons.push(
      'The explanation may say something the capture doesn’t support.',
    );
  }
  if (p('misconception') < 1 - CONFIDENT) {
    reasons.push('The “common mistake” may not be a mistake.');
  }
  const leakyPrompts: number[] = [];
  for (let i = 0; i < promptCount; i++) {
    if (p(`leak${i}`) >= CONFIDENT) leakyPrompts.push(i);
  }
  return { needsLook: reasons.length > 0, reasons, leakyPrompts };
}
