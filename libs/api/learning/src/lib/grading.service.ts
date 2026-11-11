import * as v from 'valibot';
import type { AudioClip, DecisionModel, Transcriber } from '@ah/api/ai';
import {
  type Grade,
  gradeQuestions,
  gradeState,
  LIMITS,
  readGrade,
  readTeachBack,
  TEACH_BACK_MIN_CHARS,
  type TeachBackFeedback,
  teachBackQuestions,
  teachBackState,
} from '@ah/learning/domain';
import { PipelineError } from './capture-pipeline';

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

export const TeachBackRequestSchema = v.strictObject({
  title: v.pipe(v.string(), v.minLength(1), v.maxLength(LIMITS.conceptTitle)),
  points: v.pipe(
    v.array(v.pipe(v.string(), v.minLength(1), v.maxLength(LIMITS.essence))),
    v.minLength(1),
    v.maxLength(LIMITS.teachPoints),
  ),
  transcript: v.pipe(
    v.string(),
    v.trim(),
    v.minLength(TEACH_BACK_MIN_CHARS),
    v.maxLength(LIMITS.teachBack),
  ),
});
export type TeachBackRequest = v.InferOutput<typeof TeachBackRequestSchema>;

export interface TeachBackResponse extends TeachBackFeedback {
  provider: string;
  calibrated: boolean;
}

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
  constructor(
    private readonly decisions: DecisionModel,
    private readonly transcriber: Transcriber & {
      readonly configured: boolean;
    },
  ) {}

  /** A teach-back's recording, as text; nothing is stored. */
  async transcribe(clip: AudioClip): Promise<string> {
    if (!this.transcriber.configured) {
      throw new PipelineError(
        'This server has no transcription model set up.',
        'unavailable',
      );
    }
    const text = (await this.transcriber.transcribe(clip)).trim();
    return text.slice(0, LIMITS.teachBack);
  }

  /**
   * Judges a teach-back (design §6.3): one yes/no per point and a clarity
   * band. Like grading, it only suggests; the swipe is the rating.
   */
  async teachBack(request: TeachBackRequest): Promise<TeachBackResponse> {
    const decision = await this.decisions.decide(
      teachBackState(request.title, request.transcript),
      teachBackQuestions(request.title, request.points),
    );
    return {
      ...readTeachBack(decision.answers, request.points),
      provider: decision.provider,
      calibrated: decision.calibrated,
    };
  }

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
