import type { CourseModule } from '../model/course';
import type { Check } from '../model/checks';
import { fixtureLesson, fixtureMeta } from '../testing/fixtures';
import { markCheck } from './checks';
import { foldSteps } from './fold';
import { parseInline, plainText, wordCount } from './inline';
import {
  anchorOf,
  edgePoints,
  iso,
  pathLength,
  pointAlong,
  sceneBounds,
} from './iso';
import { pickPractice, type Attempt, type PracticeItem } from './practice';
import {
  courseProgress,
  lessonPlace,
  lessonStatus,
  nextLesson,
  recordVisit,
  type LessonProgress,
} from './progress';
import { searchCourse } from './search';

describe('foldSteps', () => {
  it('folds steps 0..n and flags the last one', () => {
    const seen: [string, boolean][] = [];
    foldSteps(
      [{ ops: ['a'] }, { ops: ['b', 'c'] }, { ops: ['d'] }],
      1,
      (op, cur) => seen.push([op, cur]),
    );
    expect(seen).toEqual([
      ['a', false],
      ['b', true],
      ['c', true],
    ]);
  });

  it('does nothing before step 0 and clamps past the end', () => {
    const seen: string[] = [];
    foldSteps([{ ops: ['a'] }], -1, (op) => seen.push(op));
    foldSteps([{ ops: ['a'] }], 5, (op) => seen.push(op));
    expect(seen).toEqual(['a']);
  });
});

describe('iso', () => {
  it('maps grid cells to a 2:1 dimetric screen', () => {
    expect(iso({ x: 0, y: 0 })).toEqual({ x: 0, y: 0 });
    expect(iso({ x: 1, y: 0 })).toEqual({ x: 32, y: 16 });
    expect(iso({ x: 0, y: 1 })).toEqual({ x: -32, y: 16 });
    expect(iso({ x: 1, y: 1 }, 1)).toEqual({ x: 0, y: 8 });
  });

  it('hangs anchors above the glyph', () => {
    expect(anchorOf({ at: { x: 0, y: 0 } }).y).toBeCloseTo(-38.4);
  });

  it('routes elbows through the grid corner', () => {
    expect(edgePoints({ x: 0, y: 0 }, { x: 2, y: 2 }, 'elbow-x')).toEqual([
      iso({ x: 0, y: 0 }),
      iso({ x: 2, y: 0 }),
      iso({ x: 2, y: 2 }),
    ]);
    expect(edgePoints({ x: 0, y: 0 }, { x: 2, y: 2 }, 'elbow-y')[1]).toEqual(
      iso({ x: 0, y: 2 }),
    );
    expect(edgePoints({ x: 0, y: 0 }, { x: 2, y: 2 }, 'straight')).toHaveLength(
      2,
    );
    expect(edgePoints({ x: 0, y: 0 }, { x: 3, y: 0 })).toHaveLength(2);
  });

  it('measures and walks a polyline', () => {
    const pts = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 3, y: 10 },
    ];
    expect(pathLength(pts)).toBe(11);
    expect(pointAlong(pts, 0)).toEqual({ x: 0, y: 0 });
    expect(pointAlong(pts, 1)).toEqual({ x: 3, y: 10 });
    expect(pointAlong(pts, 5 / 11)).toEqual({ x: 3, y: 4 });
    expect(pointAlong(pts, 8 / 11).y).toBeCloseTo(7);
    expect(pointAlong([], 0.5)).toEqual({ x: 0, y: 0 });
    expect(
      pointAlong(
        [
          { x: 1, y: 1 },
          { x: 1, y: 1 },
        ],
        0.5,
      ),
    ).toEqual({ x: 1, y: 1 });
  });

  it('fits nodes and zones in the view box', () => {
    const empty = sceneBounds({ nodes: [], zones: [] }, 10);
    expect(empty).toEqual({ x: -10, y: -10, width: 20, height: 20 });
    const box = sceneBounds(
      {
        nodes: [{ id: 'a', kind: 'server', at: { x: 0, y: 0 }, label: 'A' }],
        zones: [
          { id: 'z', from: { x: 0, y: 0 }, to: { x: 4, y: 4 }, hue: 'green' },
        ],
      },
      0,
    );
    expect(box.width).toBe(256);
    expect(box.y + box.height).toBe(iso({ x: 4, y: 4 }).y);
    expect(box.y).toBeLessThan(0);
  });
});

describe('parseInline', () => {
  it('splits bold, code and emphasis', () => {
    expect(parseInline('A **fast** `GET` on a _replica_.')).toEqual([
      { kind: 'text', text: 'A ' },
      { kind: 'bold', text: 'fast' },
      { kind: 'text', text: ' ' },
      { kind: 'code', text: 'GET' },
      { kind: 'text', text: ' on a ' },
      { kind: 'em', text: 'replica' },
      { kind: 'text', text: '.' },
    ]);
  });

  it('leaves unbalanced marks as text and never makes HTML', () => {
    expect(parseInline('2 ** 3 and <b>x</b>')).toEqual([
      { kind: 'text', text: '2 ** 3 and <b>x</b>' },
    ]);
    expect(parseInline('')).toEqual([]);
  });

  it('counts words without marks', () => {
    expect(plainText('**a** `b`')).toBe('a b');
    expect(wordCount('One **two** three')).toBe(3);
    expect(wordCount('  ')).toBe(0);
  });
});

describe('markCheck', () => {
  const choice: Check = {
    id: 'c',
    kind: 'choice',
    prompt: 'p',
    options: ['a', 'b'],
    answer: 1,
    explain: 'e',
  };
  const numeric: Check = {
    id: 'n',
    kind: 'numeric',
    prompt: 'p',
    unit: 'rps',
    answer: 1000,
    tolerance: 0.25,
    explain: 'e',
  };
  const order: Check = {
    id: 'o',
    kind: 'order',
    prompt: 'p',
    items: ['x', 'y', 'z'],
    explain: 'e',
  };

  it('marks choices by index', () => {
    expect(markCheck(choice, 1)).toEqual({ correct: true, expected: 'b' });
    expect(markCheck(choice, 0).correct).toBe(false);
  });

  it('accepts numbers within the relative tolerance', () => {
    expect(markCheck(numeric, 1250)).toEqual({
      correct: true,
      expected: '1,000 rps',
    });
    expect(markCheck(numeric, 751).correct).toBe(true);
    expect(markCheck(numeric, 1300).correct).toBe(false);
    expect(markCheck(numeric, Number.NaN).correct).toBe(false);
    expect(markCheck(numeric, ['1000']).correct).toBe(false);
    expect(markCheck({ ...numeric, answer: 0.5, unit: '' }, 0.5).expected).toBe(
      '0.5',
    );
  });

  it('wants the exact order', () => {
    expect(markCheck(order, ['x', 'y', 'z'])).toEqual({
      correct: true,
      expected: 'x → y → z',
    });
    expect(markCheck(order, ['y', 'x', 'z']).correct).toBe(false);
    expect(markCheck(order, ['x', 'y']).correct).toBe(false);
    expect(markCheck(order, 2).correct).toBe(false);
  });
});

describe('progress', () => {
  const lesson = (id: string, ready = true) => ({
    ...fixtureMeta(),
    id,
    ready,
  });
  const modules: CourseModule[] = [
    {
      id: 'foundations',
      number: 1,
      title: 'Foundations',
      hue: 'neutral',
      lessons: [lesson('a'), lesson('b')],
    },
    {
      id: 'scaling',
      number: 2,
      title: 'Scaling',
      hue: 'blue',
      lessons: [lesson('c'), lesson('d', false)],
    },
  ];
  const p = (
    id: string,
    furthest: number,
    done: boolean,
    at: string,
  ): LessonProgress => ({
    lessonId: id,
    furthestStep: furthest,
    lastStep: furthest,
    completedAt: done ? at : null,
    updatedAt: at,
  });

  it('derives a lesson’s status', () => {
    expect(lessonStatus(undefined)).toBe('new');
    expect(lessonStatus(p('a', 0, false, 't'))).toBe('new');
    expect(lessonStatus(p('a', 2, false, 't'))).toBe('started');
    expect(lessonStatus(p('a', 5, true, 't'))).toBe('complete');
  });

  it('records visits and completes on the last step, once', () => {
    const v1 = recordVisit(undefined, 'a', 2, 6, 't1');
    expect(v1).toEqual({
      lessonId: 'a',
      furthestStep: 2,
      lastStep: 2,
      completedAt: null,
      updatedAt: 't1',
    });
    const v2 = recordVisit(v1, 'a', 5, 6, 't2');
    expect(v2.completedAt).toBe('t2');
    const v3 = recordVisit(v2, 'a', 1, 6, 't3');
    expect(v3).toMatchObject({
      furthestStep: 5,
      lastStep: 1,
      completedAt: 't2',
    });
  });

  it('counts the course and each module', () => {
    const map = new Map([
      ['a', p('a', 5, true, 't')],
      ['c', p('c', 3, false, 't')],
    ]);
    expect(courseProgress(modules, map)).toEqual({
      done: 1,
      total: 4,
      modules: [
        { id: 'foundations', done: 1, total: 2 },
        { id: 'scaling', done: 0, total: 2 },
      ],
    });
  });

  it('resumes the latest open lesson, else the first ready unfinished one', () => {
    expect(nextLesson([], new Map())).toBeNull();
    expect(nextLesson(modules, new Map())?.id).toBe('a');
    const open = new Map([
      ['b', p('b', 1, false, '2026-01-01')],
      ['c', p('c', 1, false, '2026-02-01')],
    ]);
    expect(nextLesson(modules, open)?.id).toBe('c');
    const done = new Map(
      ['a', 'b', 'c'].map((id) => [id, p(id, 5, true, 't')] as const),
    );
    expect(nextLesson(modules, done)?.id).toBe('a');
    const someDone = new Map([['a', p('a', 5, true, 't')]]);
    expect(nextLesson(modules, someDone)?.id).toBe('b');
  });

  it('places a lesson in its module and the course', () => {
    const place = lessonPlace(modules, 'c');
    expect(place?.module.id).toBe('scaling');
    expect(place?.index).toBe(0);
    expect(place?.prev?.id).toBe('b');
    expect(place?.next?.id).toBe('d');
    expect(lessonPlace(modules, 'a')?.prev).toBeNull();
    expect(lessonPlace(modules, 'zzz')).toBeNull();
  });
});

describe('searchCourse', () => {
  const meta = (
    id: string,
    title: string,
    keywords: string[],
    summary = '',
  ) => ({
    ...fixtureMeta(),
    id,
    title,
    keywords,
    summary,
  });
  const modules: CourseModule[] = [
    {
      id: 'scaling',
      number: 2,
      title: 'Scaling',
      hue: 'blue',
      lessons: [
        meta('caching', 'Caching', ['ttl', 'redis']),
        meta(
          'cdn',
          'Content Delivery Networks',
          ['edge', 'caching'],
          'Serve from the edge.',
        ),
        meta('lb', 'Load Balancing', ['round robin']),
      ],
    },
  ];

  it('ranks title prefixes above keywords and summaries', () => {
    const hits = searchCourse('cach', modules);
    expect(hits.map((h) => h.id)).toEqual(['caching', 'cdn']);
    expect(hits[0].score).toBe(5);
  });

  it('needs every token to match', () => {
    expect(searchCourse('load balancing', modules).map((h) => h.id)).toEqual([
      'lb',
    ]);
    expect(searchCourse('load ttl', modules)).toEqual([]);
    expect(searchCourse('  ', modules)).toEqual([]);
  });

  it('finds module titles, summaries and cheatsheet terms', () => {
    expect(searchCourse('scaling', modules)).toHaveLength(3);
    expect(searchCourse('edge', modules)[0].id).toBe('cdn');
    const hits = searchCourse('nines', modules, [
      { module: 'scaling', title: 'Nines and downtime' },
      { module: 'data', title: 'Isolation levels' },
    ]);
    expect(hits).toEqual([
      {
        kind: 'cheatsheet',
        id: 'scaling',
        title: 'Nines and downtime',
        detail: 'Scaling cheatsheet',
        score: 1,
      },
    ]);
    expect(
      searchCourse('isolation', modules, [
        { module: 'data', title: 'Isolation levels' },
      ])[0].detail,
    ).toBe('Cheatsheet');
  });
});

describe('pickPractice', () => {
  const checks = fixtureLesson().checks;
  const items: PracticeItem[] = checks.map((check) => ({
    lessonId: 'fixture',
    check,
  }));
  const attempt = (checkId: string, correct: boolean, at: string): Attempt => ({
    lessonId: 'fixture',
    checkId,
    correct,
    at,
  });

  it('puts last-wrong first, then unseen, then oldest seen', () => {
    const attempts = [
      attempt('q1', false, '2026-01-01'),
      attempt('q1', true, '2026-01-03'),
      attempt('q2', false, '2026-01-02'),
    ];
    expect(pickPractice(items, attempts).map((i) => i.check.id)).toEqual([
      'q2',
      'q3',
      'q1',
    ]);
  });

  it('caps the count and is deterministic for a seed', () => {
    expect(pickPractice(items, [], 2)).toHaveLength(2);
    expect(pickPractice(items, [], 0)).toEqual([]);
    expect(pickPractice(items, [], 3, 7)).toEqual(
      pickPractice(items, [], 3, 7),
    );
  });
});
