import * as v from 'valibot';
import { TeachBackSchema } from '../records';
import { composeDailySet, pickTeachBack } from '../schedule/composer';
import type { MemoryState } from '../schedule/memory';
import { milestonesOf } from '../schedule/milestones';
import { XP_RULES, xpOf } from '../schedule/xp';
import { emptyPush, SyncRequestSchema } from '../sync';
import {
  FIXTURE_IDS,
  sampleConcept,
  sampleTeachBack,
} from '../testing/fixtures';
import type { Answer } from './decisions';
import { readTeachBack, teachBackQuestions, teachPoints } from './teach-back';

const yes: Answer = { type: 'noul', p: 0.92 };
const no: Answer = { type: 'noul', p: 0.08 };
const unsure: Answer = { type: 'noul', p: 0.5 };
const clarity = (score: number, confidence = 0.8): Answer => ({
  type: 'score',
  score,
  confidence,
  probabilities: [],
});

const state = (
  conceptId: string,
  stability: number,
  reps = 3,
): MemoryState => ({
  conceptId,
  phase: 'review',
  stability,
  difficulty: 5,
  dueAt: '2026-11-12T08:00:00.000Z',
  lastReviewAt: '2026-11-01T08:00:00.000Z',
  reps,
  lapses: 0,
  promptUses: {},
  lastPromptId: null,
});

describe('teach-back', () => {
  it('checks against the live prompts’ key points, once each', () => {
    const concept = sampleConcept({
      prompts: [
        { ...sampleConcept().prompts[0] },
        {
          ...sampleConcept().prompts[0],
          id: '0b6f0c30-0000-4000-8000-0000000000f1',
          keyPoints: ['Next best alternative', 'a cost even without money'],
        },
        {
          ...sampleConcept().prompts[0],
          id: '0b6f0c30-0000-4000-8000-0000000000f2',
          keyPoints: ['retired point'],
          retired: true,
        },
      ],
    });
    expect(teachPoints(concept)).toEqual([
      'next best alternative',
      'given up by choosing',
      'a cost even without money',
    ]);
  });

  it('falls back to the essence when no prompt has key points', () => {
    const concept = sampleConcept();
    concept.prompts[0].keyPoints = [];
    expect(teachPoints(concept)).toEqual([concept.explanation.essence]);
  });

  it('asks one question per point and one for clarity', () => {
    const questions = teachBackQuestions('Opportunity cost', ['a', 'b']);
    expect(Object.keys(questions)).toEqual(['point0', 'point1', 'clarity']);
    expect(questions['clarity']).toMatchObject({ type: 'score' });
  });

  it('reads covered points, gaps and the clarity band', () => {
    const points = ['a', 'b', 'c'];
    const all = readTeachBack(
      { point0: yes, point1: yes, point2: yes, clarity: clarity(2) },
      points,
    );
    expect(all).toEqual({
      clarity: 'clear',
      covered: points,
      gaps: [],
      suggested: 'good',
    });

    const some = readTeachBack(
      { point0: yes, point1: unsure, point2: no, clarity: clarity(1) },
      points,
    );
    expect(some).toEqual({
      clarity: 'partly',
      covered: ['a'],
      gaps: ['c'],
      suggested: 'hard',
    });

    const none = readTeachBack(
      { point0: no, point1: no, point2: no, clarity: clarity(0) },
      points,
    );
    expect(none.suggested).toBe('again');
    expect(none.clarity).toBe('unclear');
  });

  it('shows no band when the model is unsure about clarity', () => {
    const read = readTeachBack({ point0: yes, clarity: clarity(2, 0.3) }, [
      'a',
    ]);
    expect(read.clarity).toBeNull();
    expect(read.suggested).toBe('good');
  });

  it('is a valid synced record and optional in a push', () => {
    expect(v.safeParse(TeachBackSchema, sampleTeachBack()).success).toBe(true);
    const { teachbacks, ...older } = emptyPush();
    expect(teachbacks).toEqual([]);
    const parsed = v.parse(SyncRequestSchema, { cursor: 0, push: older });
    expect(parsed.push.teachbacks).toEqual([]);
  });

  it('weighs most in XP and unlocks "Crystal clear"', () => {
    const clear = sampleTeachBack();
    const partly = sampleTeachBack({
      id: '0b6f0c30-0000-4000-8000-0000000000f3',
      clarity: 'partly',
    });
    expect(xpOf([], [], [clear, partly])).toBe(
      2 * XP_RULES.teachBack + XP_RULES.teachBackClear,
    );
    const progress = {
      events: [],
      sessions: [],
      memory: new Map(),
      longestStreak: 0,
      level: 1,
    };
    const earned = (teachBacks = [partly]) =>
      milestonesOf({ ...progress, teachBacks }).find(
        (m) => m.id === 'crystal-clear',
      )?.earned;
    expect(earned()).toBe(false);
    expect(earned([partly, clear])).toBe(true);
  });
});

describe('the teach-back card in a set', () => {
  const ids = [
    '0b6f0c30-0000-4000-8000-0000000000a1',
    '0b6f0c30-0000-4000-8000-0000000000a2',
    '0b6f0c30-0000-4000-8000-0000000000a3',
  ];
  const planned = ids.map((conceptId) => ({
    conceptId,
    promptId: FIXTURE_IDS.prompt,
  }));

  it('picks the most mature concept from Leaf up, never the opener', () => {
    const memory = new Map([
      [ids[0], state(ids[0], 40)],
      [ids[1], state(ids[1], 2)],
      [ids[2], state(ids[2], 12)],
    ]);
    expect(pickTeachBack(planned, { memory, localDate: '2026-11-12' })).toBe(2);
  });

  it('skips concepts taught back in the last week, and Sprouts', () => {
    const memory = new Map([
      [ids[1], state(ids[1], 2)],
      [ids[2], state(ids[2], 12)],
    ]);
    const recent = sampleTeachBack({
      conceptId: ids[2],
      localDate: '2026-11-08',
    });
    expect(
      pickTeachBack(planned, {
        memory,
        localDate: '2026-11-12',
        teachBacks: [recent],
      }),
    ).toBe(-1);
    const older = { ...recent, localDate: '2026-11-04' };
    expect(
      pickTeachBack(planned, {
        memory,
        localDate: '2026-11-12',
        teachBacks: [older],
      }),
    ).toBe(2);
  });

  it('marks at most one card of a composed set', () => {
    const concepts = ids.map((id, i) =>
      sampleConcept({
        id,
        title: `Concept ${i}`,
        prompts: [
          {
            ...sampleConcept().prompts[0],
            id: `0b6f0c30-0000-4000-8000-0000000000b${i}`,
          },
        ],
      }),
    );
    const memory = new Map(ids.map((id) => [id, state(id, 30)]));
    const { planned: set } = composeDailySet({
      concepts,
      memory,
      sessions: [],
      events: [],
      localDate: '2026-11-12',
      now: new Date('2026-11-12T09:00:00Z'),
      timeZone: 'UTC',
    });
    expect(set.filter((item) => item.teach)).toHaveLength(1);
    expect(set[0].teach).toBeUndefined();
  });
});
