import type { LessonMeta } from '../model/course';
import type { Lesson } from '../model/lesson';

/**
 * A small lesson that passes every validation rule. Specs copy it and break
 * one thing at a time.
 */
export function fixtureLesson(): Lesson {
  return {
    id: 'fixture',
    learn: [
      'Why a cache helps reads',
      'What a miss costs',
      'When data goes stale',
    ],
    scene: {
      nodes: [
        { id: 'app', kind: 'server', at: { x: 2, y: 2 }, label: 'App' },
        { id: 'db', kind: 'database', at: { x: 6, y: 2 }, label: 'Database' },
      ],
      edges: [{ id: 'app-db', from: 'app', to: 'db', label: 'SQL' }],
      zones: [],
      notes: [],
    },
    hud: [
      { id: 'hit', label: 'Hit ratio', icon: 'gauge', value: '—' },
      { id: 'p50', label: 'p50', icon: 'timer', value: '—' },
    ],
    steps: [
      {
        id: 'slow',
        label: 'Slow reads',
        kind: 'problem',
        title: 'Every read goes to the database',
        body: ['Each page view runs the same **query**.'],
        ops: [
          { op: 'packet', edge: 'app-db', kind: 'request' },
          { op: 'set-metric', id: 'p50', value: '40 ms' },
        ],
      },
      {
        id: 'add-cache',
        label: 'Add a cache',
        kind: 'technique',
        title: 'Keep hot rows in memory',
        body: ['A `cache` answers repeat reads.'],
        changes: [{ type: 'added', text: 'Cache' }],
        ops: [
          {
            op: 'add-node',
            node: {
              id: 'cache',
              kind: 'cache',
              at: { x: 4, y: 0 },
              label: 'Cache',
            },
          },
          {
            op: 'add-edge',
            edge: { id: 'app-cache', from: 'app', to: 'cache' },
          },
        ],
        learns: [0],
      },
      {
        id: 'hit',
        label: 'Hit',
        kind: 'technique',
        title: 'A hit skips the database',
        body: ['Most reads now stop at the cache.'],
        ops: [
          { op: 'packet', edge: 'app-cache', kind: 'request' },
          {
            op: 'packet',
            edge: 'app-cache',
            kind: 'response',
            reverse: true,
            wave: 1,
          },
          { op: 'set-metric', id: 'hit', value: '80%', tone: 'good' },
        ],
      },
      {
        id: 'miss',
        label: 'Miss',
        kind: 'case',
        title: 'A miss pays twice',
        body: ['On a miss the app asks the cache, then the database.'],
        ops: [
          {
            op: 'add-note',
            note: {
              id: 'miss-note',
              anchor: { edge: 'app-db' },
              text: 'miss · 41 ms',
            },
          },
        ],
        learns: [1],
      },
      {
        id: 'stale',
        label: 'Stale',
        kind: 'watch-out',
        title: 'Cached rows can go stale',
        body: ['Give entries a _TTL_ and clear them on writes.'],
        callouts: [
          {
            kind: 'watch-out',
            text: 'Stale reads are a choice, not an accident.',
          },
        ],
        ops: [
          {
            op: 'update-node',
            id: 'cache',
            patch: { state: 'hot', badge: 'stale' },
          },
        ],
        learns: [2],
      },
      {
        id: 'recap',
        label: 'Recap',
        kind: 'recap',
        title: 'What the cache bought',
        body: ['Reads got fast; writes got a new duty.'],
        ops: [{ op: 'remove-note', id: 'miss-note' }],
        takeaways: [
          'Hits skip the database',
          'Misses cost a little more',
          'Expire or clear entries',
        ],
      },
    ],
    checks: [
      {
        id: 'q1',
        kind: 'choice',
        prompt: 'Where does a hit stop?',
        options: ['Cache', 'Database'],
        answer: 0,
        explain: 'A hit is served from memory.',
        step: 'hit',
      },
      {
        id: 'q2',
        kind: 'numeric',
        prompt: 'Hit ratio 80%, 1,000 reads: how many reach the DB?',
        unit: 'reads',
        answer: 200,
        tolerance: 0.1,
        explain: '20% miss.',
      },
      {
        id: 'q3',
        kind: 'order',
        prompt: 'Order a miss',
        items: ['Ask cache', 'Ask database', 'Fill cache'],
        explain: 'Cache-aside.',
      },
    ],
    cards: [
      { front: 'What is a cache hit?', back: 'A read served from the cache.' },
      {
        front: 'What does a miss cost?',
        back: 'A cache lookup plus the database query.',
      },
      { front: 'Why set a TTL?', back: 'So stale entries expire.' },
    ],
  };
}

export function fixtureMeta(lesson: Lesson = fixtureLesson()): LessonMeta {
  return {
    id: lesson.id,
    module: 'scaling',
    title: 'Caching',
    summary: 'Keep hot data close.',
    level: 'intermediate',
    minutes: 10,
    keywords: ['cache', 'ttl', 'hit ratio'],
    ready: true,
    load: () => Promise.resolve(lesson),
  };
}
