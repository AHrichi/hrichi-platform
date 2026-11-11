import type { Concept, Rating, ReviewEvent, ReviewSession } from '../records';
import { sampleConcept } from '../testing/fixtures';
import {
  choosePrompt,
  composeDailySet,
  DEFAULT_CAP,
  needsLighterSet,
} from './composer';
import { memoryOf, replayMemory, retrievability, tierOf } from './memory';
import { learnedMorning, type NudgeState, nudgeDue } from './nudge';
import { computeStreak, countedDays, MAX_FREEZES } from './streak';
import { levelOf, xpOf } from './xp';

const TZ = 'Europe/Paris';
const uuid = (n: number) =>
  `0b6f0c30-0000-4000-8000-${String(n).padStart(12, '0')}`;

function concept(
  n: number,
  topic: number,
  extra: Partial<Concept> = {},
): Concept {
  const base = sampleConcept();
  return {
    ...base,
    id: uuid(1000 + n),
    title: `Concept ${n}`,
    topicId: uuid(100 + topic),
    confirmedAt: '2026-10-01T08:00:00.000Z',
    createdAt: `2026-10-01T08:00:${String(n % 60).padStart(2, '0')}.000Z`,
    prompts: [
      { ...base.prompts[0], id: uuid(5000 + n * 10), type: 'free_recall' },
      { ...base.prompts[0], id: uuid(5000 + n * 10 + 1), type: 'why' },
      {
        ...base.prompts[0],
        id: uuid(5000 + n * 10 + 2),
        type: 'cloze',
        keyPoints: [],
      },
    ],
    ...extra,
  };
}

let eventSeq = 0;
function event(
  c: Concept,
  at: string,
  rating: Rating = 'good',
  extra: Partial<ReviewEvent> = {},
): ReviewEvent {
  return {
    id: uuid(90_000 + eventSeq++),
    conceptId: c.id,
    promptId: c.prompts[0].id,
    sessionId: uuid(7),
    at,
    localDate: at.slice(0, 10),
    rating,
    answer: null,
    ms: 5000,
    ...extra,
  };
}

function session(
  localDate: string,
  extra: Partial<ReviewSession> = {},
): ReviewSession {
  return {
    id: uuid(60_000 + Number(localDate.replaceAll('-', '').slice(-4))),
    updatedAt: `${localDate}T08:00:00.000Z`,
    deletedAt: null,
    localDate,
    kind: 'daily',
    planned: [{ conceptId: uuid(1), promptId: uuid(2) }],
    lighter: false,
    startedAt: `${localDate}T07:30:00.000Z`,
    completedAt: `${localDate}T07:35:00.000Z`,
    ...extra,
  };
}

describe('memory', () => {
  it('replays the same way whatever order the events arrive in', () => {
    const c = concept(1, 1);
    const events = [
      event(c, '2026-11-01T08:00:00.000Z', 'good'),
      event(c, '2026-11-04T08:00:00.000Z', 'hard'),
      event(c, '2026-11-09T08:00:00.000Z', 'good'),
    ];
    const forward = replayMemory(c.id, events);
    const shuffled = replayMemory(c.id, [events[2], events[0], events[1]]);
    expect(shuffled).toEqual(forward);
    expect(forward.reps).toBe(3);
    expect(forward.phase).toBe('review');
    expect(Date.parse(forward.dueAt ?? '')).toBeGreaterThan(
      Date.parse('2026-11-09'),
    );
  });

  it('forgets on a miss and climbs the tiers as stability grows', () => {
    const c = concept(1, 1);
    expect(tierOf(replayMemory(c.id, []))).toBe('seed');
    const after = (ratings: Rating[]) =>
      replayMemory(
        c.id,
        ratings.map((rating, i) =>
          event(
            c,
            new Date(Date.UTC(2026, 0, 1 + i * 30)).toISOString(),
            rating,
          ),
        ),
      );
    expect(tierOf(after(['good']))).toBe('sprout');
    const strong = after(['good', 'good', 'good', 'good', 'easy']);
    expect(['bloom', 'golden']).toContain(tierOf(strong));
    expect(after(['good', 'good', 'again']).lapses).toBe(1);
  });

  it('gives retrievability that falls with time', () => {
    const c = concept(1, 1);
    const state = replayMemory(c.id, [event(c, '2026-11-01T08:00:00.000Z')]);
    const soon = retrievability(state, new Date('2026-11-02T08:00:00Z'));
    const later = retrievability(state, new Date('2026-11-20T08:00:00Z'));
    expect(soon).toBeGreaterThan(later);
    expect(retrievability(replayMemory(c.id, []), new Date())).toBe(0);
  });
});

describe('composeDailySet', () => {
  const now = new Date('2026-11-12T07:00:00Z');
  const today = '2026-11-12';

  function setUp(count: number, reviewedEvery = 1) {
    const concepts = Array.from({ length: count }, (_, i) => concept(i, i % 3));
    const events = concepts
      .filter((_, i) => i % reviewedEvery === 0)
      .map((c, i) => event(c, `2026-11-0${1 + (i % 5)}T08:00:00.000Z`));
    return { concepts, events, memory: memoryOf(concepts, events) };
  }

  it('keeps every promise: the cap, new concepts and free recalls', () => {
    for (const seedCount of [0, 3, 12, 40]) {
      const { concepts, events, memory } = setUp(seedCount, 2);
      const set = composeDailySet({
        concepts,
        memory,
        sessions: [],
        events,
        localDate: today,
        now,
        timeZone: TZ,
      });
      expect(set.planned.length).toBeLessThanOrEqual(DEFAULT_CAP);
      const fresh = set.planned.filter(
        (item) => !memory.get(item.conceptId)?.reps,
      );
      expect(fresh.length).toBeLessThanOrEqual(2);
      const types = set.planned.map(
        (item) =>
          concepts
            .find((c) => c.id === item.conceptId)
            ?.prompts.find((p) => p.id === item.promptId)?.type,
      );
      expect(
        types.filter((type) => type === 'free_recall').length,
      ).toBeLessThanOrEqual(2);
      expect(new Set(set.planned.map((item) => item.conceptId)).size).toBe(
        set.planned.length,
      );
    }
  });

  it('is the same on every device for the same data', () => {
    const { concepts, events, memory } = setUp(20);
    const input = {
      concepts,
      memory,
      sessions: [],
      events,
      localDate: today,
      now,
      timeZone: TZ,
    };
    expect(composeDailySet(input)).toEqual(
      composeDailySet({ ...input, concepts: [...concepts].reverse() }),
    );
  });

  it('interleaves topics when it can', () => {
    const { concepts, events, memory } = setUp(12);
    const { planned } = composeDailySet({
      concepts,
      memory,
      sessions: [],
      events,
      localDate: today,
      now,
      timeZone: TZ,
    });
    const topics = planned.map(
      (item) => concepts.find((c) => c.id === item.conceptId)?.topicId,
    );
    for (let i = 1; i < topics.length; i++)
      expect(topics[i]).not.toBe(topics[i - 1]);
  });

  it('only brings in concepts kept before today, never drafts', () => {
    const keptToday = concept(1, 1, {
      confirmedAt: '2026-11-12T06:00:00.000Z',
    });
    const draft = concept(2, 1, { status: 'draft', confirmedAt: null });
    const keptBefore = concept(3, 2);
    const { planned } = composeDailySet({
      concepts: [keptToday, draft, keptBefore],
      memory: memoryOf([keptToday, draft, keptBefore], []),
      sessions: [],
      events: [],
      localDate: today,
      now,
      timeZone: TZ,
    });
    expect(planned.map((item) => item.conceptId)).toEqual([keptBefore.id]);
  });

  it('shrinks after a rough patch and takes nothing new', () => {
    const { concepts, events, memory } = setUp(20, 2);
    const rough = ['2026-11-09', '2026-11-10', '2026-11-11'].map((day) =>
      session(day),
    );
    const misses = rough.flatMap((s) =>
      Array.from({ length: 5 }, (_, i) =>
        event(
          concepts[i],
          `${s.localDate}T08:00:00.000Z`,
          i < 3 ? 'again' : 'good',
          { sessionId: s.id },
        ),
      ),
    );
    expect(needsLighterSet(rough, misses, today)).toBe(true);
    const set = composeDailySet({
      concepts,
      memory,
      sessions: rough,
      events: [...events, ...misses],
      localDate: today,
      now,
      timeZone: TZ,
    });
    expect(set.lighter).toBe(true);
    expect(set.planned.length).toBeLessThanOrEqual(DEFAULT_CAP - 2);
    expect(set.planned.every((item) => memory.get(item.conceptId)?.reps)).toBe(
      true,
    );
    expect(
      needsLighterSet(
        [session('2026-11-11', { completedAt: null })],
        [],
        today,
      ),
    ).toBe(true);
  });

  it('rotates prompts and opens a new concept with free recall', () => {
    const c = concept(1, 1);
    expect(choosePrompt(c, replayMemory(c.id, []), true)?.type).toBe(
      'free_recall',
    );
    const asked = replayMemory(c.id, [event(c, '2026-11-01T08:00:00.000Z')]);
    expect(choosePrompt(c, asked, true)?.id).not.toBe(c.prompts[0].id);
    expect(choosePrompt(c, replayMemory(c.id, []), false)?.type).not.toBe(
      'free_recall',
    );
  });
});

describe('streaks', () => {
  const days = (...list: string[]) => new Set(list);

  it('counts ember and full days, and today never breaks it', () => {
    const { counted, full } = countedDays(
      [event(concept(1, 1), '2026-11-10T08:00:00.000Z')],
      [session('2026-11-11')],
    );
    const streak = computeStreak(counted, full, '2026-11-12');
    expect(streak).toMatchObject({
      current: 2,
      todayCounted: false,
      todayFull: false,
    });
  });

  it('earns a freeze per 7 days, banks at most 2, and spends one on a gap', () => {
    const run = Array.from(
      { length: 21 },
      (_, i) => `2026-10-${String(1 + i).padStart(2, '0')}`,
    );
    const streak = computeStreak(
      days(...run, '2026-10-23'),
      days(),
      '2026-10-23',
    );
    // Day 22 is missing: a banked freeze covers it.
    expect(streak.frozen).toEqual(['2026-10-22']);
    expect(streak.current).toBe(22);
    expect(streak.freezesBanked).toBe(MAX_FREEZES - 1);
  });

  it('ends when there is no freeze left', () => {
    const streak = computeStreak(
      days('2026-11-01', '2026-11-02', '2026-11-04'),
      days(),
      '2026-11-04',
    );
    expect(streak.current).toBe(1);
    expect(streak.longest).toBe(2);
  });
});

describe('xp', () => {
  it('weighs effort over ease and pays for finished sets', () => {
    const c = concept(1, 1);
    const xp = xpOf(
      [
        event(c, '2026-11-01T08:00:00.000Z', 'hard', { answer: 'something' }),
        event(c, '2026-11-02T08:00:00.000Z', 'easy'),
      ],
      [session('2026-11-02')],
    );
    expect(xp).toBe(8 + 4 + 4 + 15);
    expect(levelOf(0)).toEqual({ level: 1, into: 0, span: 50 });
    expect(levelOf(60).level).toBe(2);
  });
});

describe('nudges', () => {
  const state: NudgeState = {
    timeZone: TZ,
    morning: '08:00',
    evening: '20:30',
    setSize: 7,
    streak: 12,
    doneDate: null,
    vacationUntil: null,
    recap: false,
    week: null,
  };
  // November in Paris is UTC+1.
  const at = (clock: string) => new Date(`2026-11-12T${clock}:00+01:00`);

  it('sends the morning nudge in its window, once', () => {
    expect(nudgeDue(state, null, at('07:59'))).toBeNull();
    const morning = nudgeDue(state, null, at('08:10'));
    expect(morning).toMatchObject({ kind: 'morning', localDate: '2026-11-12' });
    expect(morning?.text).toContain('7 cards');
    expect(morning?.text).toContain('🔥 12');
    expect(
      nudgeDue(
        state,
        { localDate: '2026-11-12', sent: ['morning'] },
        at('08:20'),
      ),
    ).toBeNull();
    expect(nudgeDue(state, null, at('11:30'))).toBeNull();
  });

  it('reminds in the evening, and stays quiet when done or away', () => {
    expect(
      nudgeDue(
        state,
        { localDate: '2026-11-12', sent: ['morning'] },
        at('20:45'),
      )?.kind,
    ).toBe('evening');
    expect(
      nudgeDue({ ...state, doneDate: '2026-11-12' }, null, at('20:45')),
    ).toBeNull();
    expect(
      nudgeDue({ ...state, vacationUntil: '2026-11-15' }, null, at('08:10')),
    ).toBeNull();
    expect(
      nudgeDue(
        state,
        { localDate: '2026-11-12', sent: ['morning', 'evening'] },
        at('21:00'),
      ),
    ).toBeNull();
  });

  it('learns the morning time from recent sets', () => {
    const sets = ['07:40', '07:50', '08:05', '07:45'].map((clock, i) =>
      session(`2026-11-0${i + 1}`, {
        startedAt: new Date(
          `2026-11-0${i + 1}T${clock}:00+01:00`,
        ).toISOString(),
      }),
    );
    expect(learnedMorning(sets, TZ)).toBe('07:40');
    expect(learnedMorning(sets.slice(0, 2), TZ)).toBeNull();
  });
});
