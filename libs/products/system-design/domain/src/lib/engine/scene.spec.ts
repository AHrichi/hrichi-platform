import type { Lesson } from '../model/lesson';
import { fixtureLesson } from '../testing/fixtures';
import { SceneDraft, sceneAt } from './scene';

describe('sceneAt', () => {
  const lesson = fixtureLesson();

  it('returns the baseline before step 1', () => {
    const s = sceneAt(lesson, -1);
    expect(s.nodes.map((n) => n.id)).toEqual(['app', 'db']);
    expect(s.metrics['p50']).toEqual({ value: '—', tone: 'normal' });
    expect(s.packets).toEqual([]);
    expect(s.learned.size).toBe(0);
  });

  it('plays only the current step’s packets, sorted by wave', () => {
    expect(sceneAt(lesson, 0).packets).toHaveLength(1);
    const at2 = sceneAt(lesson, 2);
    expect(at2.packets.map((p) => [p.kind, p.wave, p.reverse])).toEqual([
      ['request', 0, false],
      ['response', 1, true],
    ]);
    expect(sceneAt(lesson, 3).packets).toEqual([]);
  });

  it('keeps metric values and tones from earlier steps', () => {
    const s = sceneAt(lesson, 3);
    expect(s.metrics['p50'].value).toBe('40 ms');
    expect(s.metrics['hit']).toEqual({ value: '80%', tone: 'good' });
  });

  it('marks what this step added or changed as fresh', () => {
    expect([...sceneAt(lesson, 1).fresh].sort()).toEqual([
      'app-cache',
      'cache',
    ]);
    expect(sceneAt(lesson, 2).fresh.has('cache')).toBe(false);
    expect(sceneAt(lesson, 4).fresh.has('cache')).toBe(true);
  });

  it('applies updates over the previous node', () => {
    const cache = sceneAt(lesson, 4).nodes.find((n) => n.id === 'cache');
    expect(cache).toMatchObject({
      label: 'Cache',
      state: 'hot',
      badge: 'stale',
    });
  });

  it('collects learned items up to the step', () => {
    expect([...sceneAt(lesson, 3).learned]).toEqual([0, 1]);
    expect([...sceneAt(lesson, 99).learned].sort()).toEqual([0, 1, 2]);
  });

  it('clamps past the last step', () => {
    expect(sceneAt(lesson, 99).notes).toEqual([]);
  });

  it('throws with the lesson id on a broken reference', () => {
    const broken: Lesson = {
      ...lesson,
      steps: [{ ...lesson.steps[0], ops: [{ op: 'remove-edge', id: 'nope' }] }],
    };
    expect(() => sceneAt(broken, 0)).toThrow(
      'Lesson "fixture": unknown edge "nope"',
    );
  });
});

describe('SceneDraft.apply', () => {
  const base = () => new SceneDraft(fixtureLesson());

  it('removing a node removes its edges and the notes on them', () => {
    const d = base();
    d.apply(
      {
        op: 'add-note',
        note: { id: 'n1', anchor: { edge: 'app-db' }, text: 'x' },
      },
      false,
    );
    d.apply(
      { op: 'add-note', note: { id: 'n2', anchor: { node: 'db' }, text: 'y' } },
      false,
    );
    d.apply(
      {
        op: 'add-note',
        note: { id: 'n3', anchor: { at: { x: 0, y: 0 } }, text: 'z' },
      },
      false,
    );
    expect(d.apply({ op: 'remove-node', id: 'db' }, false)).toBeNull();
    expect([...d.edges.keys()]).toEqual([]);
    expect([...d.notes.keys()]).toEqual(['n3']);
  });

  it('removing an edge removes the notes anchored to it', () => {
    const d = base();
    d.apply(
      {
        op: 'add-note',
        note: { id: 'n1', anchor: { edge: 'app-db' }, text: 'x' },
      },
      false,
    );
    d.apply({ op: 'remove-edge', id: 'app-db' }, false);
    expect(d.notes.size).toBe(0);
  });

  it.each([
    [
      {
        op: 'add-node',
        node: { id: 'app', kind: 'server', at: { x: 0, y: 0 }, label: 'A' },
      },
      'node "app" already exists',
    ],
    [{ op: 'update-node', id: 'x', patch: {} }, 'unknown node "x"'],
    [{ op: 'remove-node', id: 'x' }, 'unknown node "x"'],
    [
      { op: 'add-edge', edge: { id: 'app-db', from: 'app', to: 'db' } },
      'edge "app-db" already exists',
    ],
    [
      { op: 'add-edge', edge: { id: 'e', from: 'x', to: 'db' } },
      'edge "e" starts at unknown node "x"',
    ],
    [
      { op: 'add-edge', edge: { id: 'e', from: 'app', to: 'x' } },
      'edge "e" ends at unknown node "x"',
    ],
    [{ op: 'update-edge', id: 'x', patch: {} }, 'unknown edge "x"'],
    [{ op: 'remove-zone', id: 'x' }, 'unknown zone "x"'],
    [
      { op: 'add-note', note: { id: 'n', anchor: { node: 'x' }, text: 't' } },
      'note "n" is anchored to unknown node "x"',
    ],
    [
      { op: 'add-note', note: { id: 'n', anchor: { edge: 'x' }, text: 't' } },
      'note "n" is anchored to unknown edge "x"',
    ],
    [{ op: 'update-note', id: 'x', patch: {} }, 'unknown note "x"'],
    [{ op: 'remove-note', id: 'x' }, 'unknown note "x"'],
    [{ op: 'set-metric', id: 'x', value: '1' }, 'unknown metric "x"'],
    [
      { op: 'packet', edge: 'x', kind: 'request' },
      'packet on unknown edge "x"',
    ],
  ] as const)('reports %o', (op, problem) => {
    expect(base().apply(op, true)).toBe(problem);
  });

  it('rejects duplicate zones and notes, and re-anchoring to nothing', () => {
    const d = base();
    const zone = {
      id: 'z',
      from: { x: 0, y: 0 },
      to: { x: 1, y: 1 },
      hue: 'green',
    } as const;
    expect(d.apply({ op: 'add-zone', zone }, false)).toBeNull();
    expect(d.apply({ op: 'add-zone', zone }, false)).toBe(
      'zone "z" already exists',
    );
    expect(d.apply({ op: 'remove-zone', id: 'z' }, false)).toBeNull();
    const note = { id: 'n', anchor: { node: 'app' }, text: 't' } as const;
    expect(d.apply({ op: 'add-note', note }, false)).toBeNull();
    expect(d.apply({ op: 'add-note', note }, false)).toBe(
      'note "n" already exists',
    );
    expect(
      d.apply(
        { op: 'update-note', id: 'n', patch: { anchor: { node: 'x' } } },
        false,
      ),
    ).toBe('note "n" is anchored to unknown node "x"');
    expect(
      d.apply({ op: 'update-note', id: 'n', patch: { text: 'u' } }, true),
    ).toBeNull();
    expect(d.notes.get('n')?.text).toBe('u');
    expect(
      d.apply(
        { op: 'update-edge', id: 'app-db', patch: { style: 'dashed' } },
        false,
      ),
    ).toBeNull();
    expect(d.edges.get('app-db')?.style).toBe('dashed');
  });

  it('defaults packet fields', () => {
    const d = base();
    d.apply(
      {
        op: 'packet',
        edge: 'app-db',
        kind: 'write',
        count: 3,
        label: 'INSERT',
      },
      true,
    );
    expect(d.packets).toEqual([
      {
        edge: 'app-db',
        kind: 'write',
        reverse: false,
        count: 3,
        label: 'INSERT',
        wave: 0,
      },
    ]);
  });
});
