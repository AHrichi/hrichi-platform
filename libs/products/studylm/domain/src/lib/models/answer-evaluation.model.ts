export interface AnswerEvaluationRequest {
  action: 'evaluate_answer';
  question: string;
  expected: string;
  answer: string;
  context?: string;
}

export interface AnswerEvaluationResponse {
  success: boolean;
  correct: boolean;
  isTypo?: boolean;
  feedback: string;
  provider?: string;
  timestamp?: string;
}
