import { sampleConcept } from '../testing/fixtures';
import { gradeQuestions, gradeState, readGrade } from './grading';

const prompt = sampleConcept().prompts[0];
const noul = (...p: number[]) =>
  Object.fromEntries(
    p.map((value, i) => [`point${i}`, { type: 'noul' as const, p: value }]),
  );

describe('grading by key points', () => {
  it('asks one question per key point, with only what it needs', () => {
    expect(Object.keys(gradeQuestions(prompt))).toEqual(['point0', 'point1']);
    expect(gradeQuestions(prompt)['point0'].instructions).toContain(
      'that: next best alternative?',
    );
    expect(gradeState(prompt, 'my answer')).toEqual({
      question: prompt.question,
      expected: prompt.answer,
      learnerAnswer: 'my answer',
    });
  });

  it('reads nailed, close and missed, quoting what was missed', () => {
    expect(readGrade(noul(0.9, 0.8), prompt.keyPoints)).toEqual({
      verdict: 'nailed',
      missed: [],
      suggested: 'good',
    });
    expect(readGrade(noul(0.9, 0.1), prompt.keyPoints)).toEqual({
      verdict: 'close',
      missed: ['given up by choosing'],
      suggested: 'hard',
    });
    expect(readGrade(noul(0.2, 0.1), prompt.keyPoints).verdict).toBe('missed');
  });

  it('shows no verdict when unsure, or with no key points', () => {
    expect(readGrade(noul(0.9, 0.5), prompt.keyPoints).verdict).toBeNull();
    expect(readGrade({}, prompt.keyPoints).verdict).toBeNull();
    expect(readGrade(noul(0.9), []).verdict).toBeNull();
  });
});
