import type { AttemptRow } from '@ah/products/system-design/data-access';
import type { Check } from '@ah/products/system-design/domain';
import {
  bestLessonScores,
  lessonQuestions,
  missedReviewItems,
  type PracticeResult,
} from './practice';

const choice: Check = {
  id: 'pick',
  kind: 'choice',
  prompt: 'Which one?',
  options: ['A', 'B'],
  answer: 0,
  explain: 'A, because.',
  step: 'second',
};
const numeric: Check = {
  id: 'count',
  kind: 'numeric',
  prompt: 'How many?',
  unit: 'ms',
  answer: 10,
  tolerance: 0.1,
  explain: 'Ten.',
};

function row(
  lessonId: string,
  correct: boolean,
  run?: AttemptRow['run'],
): AttemptRow {
  return {
    lessonId,
    checkId: 'x',
    correct,
    answer: 0,
    at: '2026-11-20T10:00:00.000Z',
    ...(run ? { run } : {}),
  };
}

describe('practice helpers', () => {
  it('turns lesson checks into questions with 1-based review steps', () => {
    const questions = lessonQuestions(
      { id: 'l1', title: 'Lesson one' },
      {
        steps: [{ id: 'first' }, { id: 'second' }] as never,
        checks: [choice, numeric],
      },
    );
    expect(questions.map((q) => q.stepNumber)).toEqual([2, null]);
    expect(questions[0].lessonTitle).toBe('Lesson one');
  });

  it('keeps the best lesson run per lesson and ignores mixed runs', () => {
    const lessonRun = (id: string) =>
      ({ id, kind: 'lesson', size: 4 }) as const;
    const scores = bestLessonScores([
      row('l1', true, lessonRun('r1')),
      row('l1', false, lessonRun('r1')),
      row('l1', true, lessonRun('r2')),
      row('l1', true, lessonRun('r2')),
      row('l1', true, lessonRun('r2')),
      row('l1', true, { id: 'm1', kind: 'mix', size: 10 }),
      row('l2', true),
    ]);
    expect(scores).toEqual({ l1: { correct: 3, total: 4 } });
  });

  it('builds Learning Engine captures for missed questions', () => {
    const missed: PracticeResult[] = [
      {
        question: {
          lessonId: 'l1',
          lessonTitle: 'Lesson one',
          check: choice,
          stepNumber: 2,
        },
        response: 1,
        correct: false,
        expected: 'A',
      },
    ];
    const [item] = missedReviewItems(missed, 'https://sd.example/practice/l1');
    expect(item).toEqual({
      text: 'Which one?\nA, because.',
      source: {
        app: 'system-design',
        objectType: 'check',
        objectId: 'l1:pick',
        deepLink: 'https://sd.example/practice/l1',
        excerpt: 'Lesson one',
      },
    });
    expect(missedReviewItems(missed, 'file:///x')[0].source.deepLink).toBe(
      null,
    );
  });
});
