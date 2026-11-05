import { validateAndParseAnswerEvaluation } from './answer-evaluation-validator';

describe('validateAndParseAnswerEvaluation', () => {
  const fallback = {
    question: 'How many steps?',
    expected: '14',
    answer: '14 steps',
  };

  it('parses valid AI answer evaluation JSON correctly', () => {
    const raw = JSON.stringify({
      correct: true,
      isTypo: true,
      feedback: 'Accepted numeric value 14 with unit steps.',
      provider: 'Groq LPU (gpt-oss-120b)',
    });

    const parsed = validateAndParseAnswerEvaluation(raw, fallback);
    expect(parsed.success).toBe(true);
    expect(parsed.correct).toBe(true);
    expect(parsed.isTypo).toBe(true);
    expect(parsed.feedback).toContain('Accepted');
    expect(parsed.provider).toBe('Groq LPU (gpt-oss-120b)');
  });

  it('handles nested evaluation object', () => {
    const raw = {
      evaluation: {
        correct: false,
        isTypo: false,
        feedback: 'The answer missed the logarithmic factor.',
      },
    };

    const parsed = validateAndParseAnswerEvaluation(raw, fallback);
    expect(parsed.success).toBe(true);
    expect(parsed.correct).toBe(false);
    expect(parsed.feedback).toBe('The answer missed the logarithmic factor.');
  });

  it('falls back gracefully on malformed JSON or invalid output', () => {
    const raw = 'not json at all';
    const parsed = validateAndParseAnswerEvaluation(raw, fallback);
    expect(parsed.success).toBe(false);
    expect(parsed.correct).toBe(false);
    expect(parsed.feedback).toBe('Expected: "14".');
  });
});
