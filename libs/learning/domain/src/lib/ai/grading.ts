import type { RecallPrompt } from '../records';
import type { Answer, Question } from './decisions';

/**
 * Grading a typed answer by its key points (design §6.3–6.4). One yes/no
 * question per key point, answered in parallel by a decision model; the
 * verdict follows from the probabilities in code, so "you missed X" quotes
 * the concept's own key point and nothing is generated.
 */
export type Verdict = 'nailed' | 'close' | 'missed';

/** A key point counts as stated at or above this probability. */
export const STATED = 0.7;
/** Below this it counts as missing; between the two, unsure. */
export const NOT_STATED = 0.35;

/** Only the prompt, the expected answer and the learner's answer: no other context. */
export function gradeState(prompt: RecallPrompt, learnerAnswer: string) {
  return {
    question: prompt.question,
    expected: prompt.answer,
    learnerAnswer,
  };
}

export function gradeQuestions(prompt: RecallPrompt): Record<string, Question> {
  const questions: Record<string, Question> = {};
  prompt.keyPoints.forEach((point, i) => {
    questions[`point${i}`] = {
      type: 'noul',
      instructions: `Does the learner's answer state, in any words, that: ${point}?`,
    };
  });
  return questions;
}

export interface Grade {
  /** Null when any key point is in the unsure band: no verdict is shown. */
  verdict: Verdict | null;
  /** The key points the answer missed, as written in the concept. */
  missed: string[];
  /** The rating to suggest for the swipe (design §5.1). */
  suggested: 'again' | 'hard' | 'good' | null;
}

export function readGrade(
  answers: Record<string, Answer>,
  keyPoints: readonly string[],
): Grade {
  if (!keyPoints.length) return { verdict: null, missed: [], suggested: null };
  const p = keyPoints.map((_, i) => {
    const answer = answers[`point${i}`];
    return answer?.type === 'noul' ? answer.p : 0.5;
  });
  if (p.some((value) => value > NOT_STATED && value < STATED)) {
    return { verdict: null, missed: [], suggested: null };
  }
  const missed = keyPoints.filter((_, i) => p[i] < STATED);
  if (!missed.length) return { verdict: 'nailed', missed, suggested: 'good' };
  if (missed.length < keyPoints.length) {
    return { verdict: 'close', missed, suggested: 'hard' };
  }
  return { verdict: 'missed', missed, suggested: 'again' };
}
