import type { CompetencyTier } from './tier.model';

export interface StudyQuizQuestion {
  id: string;
  tier: CompetencyTier;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  sourceCitation: string;
  userSelectedIndex?: number;
  isAnswered?: boolean;
  isCorrect?: boolean;
}

export interface CreateQuizQuestionInput {
  tier: CompetencyTier;
  question: string;
  options: [string, string, string, string];
  correctIndex: number;
  explanation: string;
  sourceCitation: string;
}

export interface QuizSessionSummary {
  totalQuestions: number;
  answeredCount: number;
  correctCount: number;
  scorePercentage: number;
  tierBreakdown: Record<CompetencyTier, { total: number; correct: number }>;
}
