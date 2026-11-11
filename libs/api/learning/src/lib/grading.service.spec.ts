import * as v from 'valibot';
import { GradeRequestSchema, GradingService } from './grading.service';
import { FakeDecisions } from './testing/ai-fakes';

const request = {
  question: 'What is opportunity cost?',
  expected: 'The value of the next best alternative given up.',
  keyPoints: ['next best alternative', 'given up by choosing'],
  answer: 'What you lose by not picking the next best option.',
};

describe('GradingService', () => {
  it('asks one question per key point and reads the verdict', async () => {
    const decisions = new FakeDecisions();
    decisions.answers = {
      point0: { type: 'noul', p: 0.92 },
      point1: { type: 'noul', p: 0.1 },
    };
    const grade = await new GradingService(decisions).grade(request);
    expect(Object.keys(decisions.asked[0])).toEqual(['point0', 'point1']);
    expect(grade).toMatchObject({
      verdict: 'close',
      missed: ['given up by choosing'],
      suggested: 'hard',
      calibrated: true,
    });
  });

  it('refuses requests without key points or an answer', () => {
    expect(
      v.safeParse(GradeRequestSchema, { ...request, keyPoints: [] }).success,
    ).toBe(false);
    expect(
      v.safeParse(GradeRequestSchema, { ...request, answer: '  ' }).success,
    ).toBe(false);
  });
});
