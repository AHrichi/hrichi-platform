import { InjectionToken } from '@angular/core';
import type { SelfExplainFeedback } from '@ah/products/studylm/lessons';

export interface FeedbackRequest {
  prompt: string;
  rubric: string[];
  modelAnswer: string;
  answer: string;
}

/**
 * Asks the AI to mark a self-explanation. The app that hosts the lessons
 * provides it; without it, learners mark their own answers.
 */
export const SELF_EXPLAIN_FEEDBACK = new InjectionToken<
  (request: FeedbackRequest) => Promise<SelfExplainFeedback>
>('SELF_EXPLAIN_FEEDBACK');

export interface AnswerEvaluationRequest {
  question: string;
  expected: string;
  answer: string;
  context?: string;
}

export interface AnswerEvaluationResult {
  correct: boolean;
  isTypo?: boolean;
  feedback?: string;
}

/**
 * Asks the AI to evaluate a learner's answer against an expected answer,
 * ensuring typos, casing, phrasing variations or synonyms do not mark
 * a conceptually correct answer wrong.
 */
export const AI_ANSWER_EVALUATOR = new InjectionToken<
  (request: AnswerEvaluationRequest) => Promise<AnswerEvaluationResult>
>('AI_ANSWER_EVALUATOR');
