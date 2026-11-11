import * as v from 'valibot';
import {
  GradeRequestSchema,
  GradingService,
  TeachBackRequestSchema,
} from './grading.service';
import { FakeDecisions, FakeTranscriber } from './testing/ai-fakes';

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
    const grade = await new GradingService(
      decisions,
      new FakeTranscriber(),
    ).grade(request);
    expect(Object.keys(decisions.asked[0])).toEqual(['point0', 'point1']);
    expect(grade).toMatchObject({
      verdict: 'close',
      missed: ['given up by choosing'],
      suggested: 'hard',
      calibrated: true,
    });
  });

  it('judges a teach-back by its points and clarity', async () => {
    const decisions = new FakeDecisions();
    decisions.answers = {
      point0: { type: 'noul', p: 0.9 },
      point1: { type: 'noul', p: 0.05 },
      clarity: {
        type: 'score',
        score: 1,
        confidence: 0.8,
        probabilities: [0.1, 0.8, 0.1],
      },
    };
    const service = new GradingService(decisions, new FakeTranscriber());
    const result = await service.teachBack({
      title: 'Opportunity cost',
      points: request.keyPoints,
      transcript: 'It is what you lose when you pick one thing over another.',
    });
    expect(Object.keys(decisions.asked[0])).toEqual([
      'point0',
      'point1',
      'clarity',
    ]);
    expect(result).toMatchObject({
      clarity: 'partly',
      covered: ['next best alternative'],
      gaps: ['given up by choosing'],
      suggested: 'hard',
    });
  });

  it('transcribes a recording only when a model is set up', async () => {
    const service = new GradingService(
      new FakeDecisions(),
      new FakeTranscriber('  An idea, explained.  '),
    );
    const clip = { bytes: new Uint8Array([1, 2]), mimeType: 'audio/webm' };
    await expect(service.transcribe(clip)).resolves.toBe('An idea, explained.');
    const off = new GradingService(
      new FakeDecisions(),
      new FakeTranscriber('x', false),
    );
    await expect(off.transcribe(clip)).rejects.toMatchObject({
      reason: 'unavailable',
    });
  });

  it('refuses a teach-back too short to judge', () => {
    expect(
      v.safeParse(TeachBackRequestSchema, {
        title: 'Opportunity cost',
        points: ['a'],
        transcript: 'Um, a cost.',
      }).success,
    ).toBe(false);
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
