import * as v from 'valibot';
import type { DecisionModel } from '@ah/api/ai';
import {
  type Grade,
  gradeQuestions,
  gradeState,
  LIMITS,
  readGrade,
} from '@ah/learning/domain';

export const GradeRequestSchema = v.strictObject({
  question: v.pipe(v.string(), v.minLength(1), v.maxLength(LIMITS.question)),
  expected: v.pipe(v.string(), v.minLength(1), v.maxLength(LIMITS.answer)),
  keyPoints: v.pipe(
    v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(LIMITS.keyPoint))),
    v.minLength(1),
    v.maxLength(LIMITS.keyPoints),
  ),
  answer: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(1),
    v.maxLength(LIMITS.answer),
  ),
});
export type GradeRequest = v.InferOutput<typeof GradeRequestSchema>;

export interface GradeResponse extends Grade {
  provider: string;
  /** Jev's probabilities are calibrated; the ladder's yes/no are not. */
  calibrated: boolean;
}

/**
 * Grades a typed answer by its key points (design §6.3). The swipe is
 * always the rating: this only suggests, and a slow or failed call shows
 * no verdict. Runs in Nest until the Jev spike moves it to the edge Worker.
 */
export class GradingService {
  constructor(private readonly decisions: DecisionModel) {}

  async grade(request: GradeRequest): Promise<GradeResponse> {
    const prompt = {
      id: crypto.randomUUID(),
      type: 'free_recall' as const,
      question: request.question,
      answer: request.expected,
      options: null,
      keyPoints: request.keyPoints,
      retired: false,
    };
    const decision = await this.decisions.decide(
      gradeState(prompt, request.answer),
      gradeQuestions(prompt),
    );
    return {
      ...readGrade(decision.answers, request.keyPoints),
      provider: decision.provider,
      calibrated: decision.calibrated,
    };
  }
}
