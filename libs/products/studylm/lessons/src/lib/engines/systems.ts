import type { BlockOf } from '../spec/blocks';
import { upTo } from './steps';

// --- state machine ------------------------------------------------------------

export interface StateMachineState {
  current: string | null;
  visited: string[];
  /** This step only. */
  fired: string | null;
  rejected: string | null;
}

export function stateMachineStateAt(
  block: BlockOf<'state-machine'>,
  n: number,
): StateMachineState {
  const start = block.states.find((s) => s.initial)?.id ?? null;
  const state: StateMachineState = {
    current: start,
    visited: start ? [start] : [],
    fired: null,
    rejected: null,
  };
  const transitions = new Map(block.transitions.map((t) => [t.id, t]));
  upTo(block.steps, n, (o, current) => {
    if (o.op === 'fire' && o.transition) {
      const t = transitions.get(o.transition);
      if (t) {
        state.current = t.to;
        if (!state.visited.includes(t.to)) state.visited.push(t.to);
      }
      if (current) state.fired = o.transition;
    }
    if (o.op === 'reject' && current) state.rejected = o.event;
  });
  return state;
}

// --- pipeline -------------------------------------------------------------------

export interface PipelineState {
  /** The data last seen at each stage. */
  data: Record<string, string>;
  emitted: string[];
  failed: string | null;
  /** This step only. */
  active: string | null;
}

export function pipelineStateAt(
  block: BlockOf<'pipeline'>,
  n: number,
): PipelineState {
  const state: PipelineState = {
    data: {},
    emitted: [],
    failed: null,
    active: null,
  };
  upTo(block.steps, n, (o, current) => {
    if (o.stage) state.data[o.stage] = o.data ?? '';
    if (o.op === 'emit') state.emitted.push(o.data ?? '');
    if (o.op === 'fail') state.failed = o.stage;
    if (current) state.active = o.stage;
  });
  return state;
}

// --- event loop ------------------------------------------------------------------

export interface EventLoopState {
  stack: string[];
  webApis: string[];
  tasks: string[];
  microtasks: string[];
  console: string[];
  /** This step only: the op that just happened. */
  last: BlockOf<'event-loop'>['steps'][number]['ops'][number] | null;
}

export function eventLoopStateAt(
  block: Pick<BlockOf<'event-loop'>, 'steps'>,
  n: number,
): EventLoopState {
  const state: EventLoopState = {
    stack: [],
    webApis: [],
    tasks: [],
    microtasks: [],
    console: [],
    last: null,
  };
  upTo(block.steps, n, (o, current) => {
    const label = o.label ?? '';
    switch (o.op) {
      case 'push-stack':
        state.stack.push(label);
        break;
      case 'pop-stack':
        state.stack.pop();
        break;
      case 'web-api':
        state.webApis.push(label);
        break;
      case 'queue-task': {
        // A timer that fires leaves the Web APIs for the task queue.
        const i = state.webApis.indexOf(label);
        if (i >= 0) state.webApis.splice(i, 1);
        state.tasks.push(label);
        break;
      }
      case 'queue-microtask':
        state.microtasks.push(label);
        break;
      case 'run-task':
        state.stack.push(state.tasks.shift() ?? label);
        break;
      case 'run-microtask':
        state.stack.push(state.microtasks.shift() ?? label);
        break;
      case 'log':
        state.console.push(label);
        break;
    }
    if (current) state.last = o;
  });
  return state;
}

// --- git graph -----------------------------------------------------------------------

export interface GitCommit {
  id: string;
  message: string;
  parents: string[];
  /** The branch it was made on, which picks its lane. */
  branch: string;
}

export interface GitState {
  commits: GitCommit[];
  branches: Record<string, string>;
  tags: Record<string, string>;
  /** The checked-out branch. */
  head: string;
  /** Branch names in the order they appeared, one lane each. */
  lanes: string[];
  /** This step only. */
  active: string[];
}

export function gitStateAt(block: BlockOf<'git-graph'>, n: number): GitState {
  const main = block.start.branch;
  const state: GitState = {
    commits: [
      { id: block.start.commit, message: 'initial', parents: [], branch: main },
    ],
    branches: { [main]: block.start.commit },
    tags: {},
    head: main,
    lanes: [main],
    active: [],
  };
  const tip = () => state.branches[state.head];
  const add = (commit: GitCommit) => {
    state.commits.push(commit);
    state.branches[state.head] = commit.id;
  };
  upTo(block.steps, n, (o, current) => {
    const touched: string[] = [];
    switch (o.op) {
      case 'commit':
        if (o.commit) {
          add({
            id: o.commit,
            message: o.message ?? '',
            parents: [tip()],
            branch: state.head,
          });
          touched.push(o.commit);
        }
        break;
      case 'branch':
        if (o.ref) {
          state.branches[o.ref] = tip();
          if (!state.lanes.includes(o.ref)) state.lanes.push(o.ref);
        }
        break;
      case 'checkout':
        if (o.ref && o.ref in state.branches) state.head = o.ref;
        break;
      case 'merge':
        if (o.ref && o.commit && o.ref in state.branches) {
          add({
            id: o.commit,
            message: o.message ?? `merge ${o.ref}`,
            parents: [tip(), state.branches[o.ref]],
            branch: state.head,
          });
          touched.push(o.commit);
        }
        break;
      case 'rebase': {
        if (!o.ref || !(o.ref in state.branches)) break;
        // Replay the commits only this branch has onto the other's tip.
        const ancestors = new Set<string>();
        const walk = (id: string) => {
          if (ancestors.has(id)) return;
          ancestors.add(id);
          state.commits.find((c) => c.id === id)?.parents.forEach(walk);
        };
        walk(state.branches[o.ref]);
        const mine: GitCommit[] = [];
        let at: string | undefined = tip();
        while (at && !ancestors.has(at)) {
          const commit = state.commits.find((c) => c.id === at);
          if (!commit) break;
          mine.unshift(commit);
          at = commit.parents[0];
        }
        let base = state.branches[o.ref];
        for (const commit of mine) {
          const copy = { ...commit, id: `${commit.id}'`, parents: [base] };
          state.commits.push(copy);
          touched.push(copy.id);
          base = copy.id;
        }
        state.branches[state.head] = base;
        break;
      }
      case 'tag':
        if (o.ref) state.tags[o.ref] = tip();
        break;
      case 'reset':
        if (o.commit) state.branches[state.head] = o.commit;
        break;
    }
    if (current) state.active = touched.length ? touched : [tip()];
  });
  return state;
}

// --- concept map ---------------------------------------------------------------------

export interface ConceptMapState {
  /** Nodes and links on show: all, minus those a later step reveals. */
  shown: string[];
  /** This step only. */
  highlighted: string[];
}

export function conceptMapStateAt(
  block: BlockOf<'concept-map'>,
  n: number,
): ConceptMapState {
  const revealedLater = new Set(
    block.steps.flatMap((s) =>
      s.ops.filter((o) => o.op === 'reveal').flatMap((o) => [o.node, o.link]),
    ),
  );
  const shown = new Set(
    [...block.nodes.map((x) => x.id), ...block.links.map((x) => x.id)].filter(
      (id) => !revealedLater.has(id),
    ),
  );
  const state: ConceptMapState = { shown: [], highlighted: [] };
  upTo(block.steps, n, (o, current) => {
    for (const id of [o.node, o.link]) {
      if (!id) continue;
      if (o.op === 'reveal') shown.add(id);
      if (current) state.highlighted.push(id);
    }
  });
  // A link shows only with both of its ends.
  for (const link of block.links) {
    if (!shown.has(link.from) || !shown.has(link.to)) shown.delete(link.id);
  }
  state.shown = [...shown];
  return state;
}

// --- chart -------------------------------------------------------------------------------

const GROWTH: Record<string, (n: number) => number> = {
  '1': () => 1,
  'log n': (n) => Math.log2(Math.max(n, 1)),
  n: (n) => n,
  'n log n': (n) => n * Math.log2(Math.max(n, 1)),
  'n^2': (n) => n * n,
  'n^3': (n) => n ** 3,
  '2^n': (n) => 2 ** n,
  'n!': (n) => {
    let f = 1;
    for (let k = 2; k <= n; k++) f *= k;
    return f;
  },
};

/** A chart's points: computed from its growth functions, or given. */
export function chartSeries(block: BlockOf<'chart'>): {
  xs: (number | string)[];
  series: { id: string; label: string; values: number[] }[];
} {
  const xs: (number | string)[] = block.x
    ? Array.from(
        { length: Math.min(block.x.to - block.x.from + 1, 64) },
        (_, i) => (block.x as { from: number }).from + i,
      )
    : [...block.categories];
  return {
    xs,
    series: block.series.map((s) => ({
      id: s.id,
      label: s.label,
      values: s.fn
        ? xs.map((x) => GROWTH[s.fn as string](Number(x)))
        : [...(s.values ?? [])],
    })),
  };
}
