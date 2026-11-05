import { extractAndParseJson } from './schema-validator';
import type { AnswerEvaluationResponse } from '../models/answer-evaluation.model';

export function validateAndParseAnswerEvaluation(
  raw: unknown,
  fallbackReq: { question: string; expected: string; answer: string },
): AnswerEvaluationResponse {
  try {
    const data =
      typeof raw === 'string'
        ? extractAndParseJson<Record<string, unknown>>(raw)
        : (raw as Record<string, unknown>);

    const evalObj = (data['evaluation'] ?? data) as Record<string, unknown>;

    const correct =
      typeof evalObj['correct'] === 'boolean'
        ? evalObj['correct']
        : String(evalObj['correct']).toLowerCase() === 'true';

    const isTypo =
      typeof evalObj['isTypo'] === 'boolean'
        ? evalObj['isTypo']
        : String(evalObj['isTypo']).toLowerCase() === 'true';

    const feedback =
      typeof evalObj['feedback'] === 'string' &&
      evalObj['feedback'].trim().length > 0
        ? evalObj['feedback'].trim()
        : correct
          ? 'Correct conceptual answer.'
          : `Expected: "${fallbackReq.expected}".`;

    return {
      success: true,
      correct,
      isTypo,
      feedback,
      provider:
        typeof data['provider'] === 'string'
          ? data['provider']
          : 'AI Answer Evaluator',
      timestamp:
        typeof data['timestamp'] === 'string'
          ? data['timestamp']
          : new Date().toISOString(),
    };
  } catch {
    return {
      success: false,
      correct: false,
      isTypo: false,
      feedback: `Expected: "${fallbackReq.expected}".`,
      provider: 'Answer Evaluation Fallback',
      timestamp: new Date().toISOString(),
    };
  }
}
