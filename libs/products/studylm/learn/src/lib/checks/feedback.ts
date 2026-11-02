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
