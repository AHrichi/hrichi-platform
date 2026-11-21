import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 03.06: Consistent Hashing (`consistent-hashing`).
 * Scenario: Adding a cache node remaps every key (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'consistent-hashing',
  learn: [
    'Why hash(key) % N causes a cache stampede on resize',
    'How a hash ring maps keys and nodes to one circle',
    'Why adding a node on the ring moves only ~1/N of keys',
    'How virtual nodes smooth skew and replicate safely',
  ],
  scene: {
    nodes: [
      {
        id: 'api',
        kind: 'server',
        at: { x: 1, y: 5 },
        label: 'App server',
        sublabel: '30M keys',
      },
      {
        id: 'origin-db',
        kind: 'database',
        at: { x: 3, y: 8 },
        label: 'Origin DB',
        sublabel: 'Fallback',
      },
      {
        id: 'cache-a',
        kind: 'cache',
        at: { x: 8, y: 1 },
        label: 'Cache A',
        sublabel: 'Slot 0',
      },
      {
        id: 'cache-b',
        kind: 'cache',
        at: { x: 11, y: 4 },
        label: 'Cache B',
        sublabel: 'Slot 1',
      },
      {
        id: 'cache-c',
        kind: 'cache',
        at: { x: 5, y: 4 },
        label: 'Cache C',
        sublabel: 'Slot 2',
      },
    ],
    edges: [
      {
        id: 'api-ca',
        from: 'api',
        to: 'cache-a',
        route: 'elbow-y',
      },
      {
        id: 'api-cb',
        from: 'api',
        to: 'cache-b',
        route: 'elbow-x',
      },
      {
        id: 'api-cc',
        from: 'api',
        to: 'cache-c',
        route: 'elbow-y',
      },
      {
        id: 'api-db',
        from: 'api',
        to: 'origin-db',
        label: 'misses',
        style: 'dashed',
      },
    ],
    zones: [
      {
        id: 'ring-zone',
        from: { x: 4, y: 0 },
        to: { x: 12, y: 8 },
        hue: 'green',
        label: 'Hash ring',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'nodes', label: 'Cache nodes', icon: 'server', value: '3' },
    { id: 'moved', label: 'Keys moved', icon: 'route', value: '0%' },
    { id: 'hit-rate', label: 'Cache hit', icon: 'bolt', value: '94%' },
  ],
  steps: [
    {
      id: 'mod-n-shock',
      label: 'mod N shock',
      kind: 'problem',
      title: 'Adding node 4 under mod N misses 75% of keys',
      body: [
        'Your 3-node Redis cluster holds **30M cached keys** using `hash(key) % 3` at a **94%** hit rate. Traffic grows, so you add a 4th node and change the formula to `% 4`.',
        'Suddenly three-quarters of keys hash to a _different_ bucket! Cache misses flood `Origin DB` in a cluster-wide **cache stampede**.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'origin-db',
          patch: { state: 'hot', load: 0.95, badge: '75% misses!' },
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'error',
          count: 4,
          label: 'stampede',
          wave: 0,
        },
        { op: 'set-metric', id: 'nodes', value: '4 (% 4)' },
        { op: 'set-metric', id: 'moved', value: '~75%', tone: 'bad' },
        { op: 'set-metric', id: 'hit-rate', value: '24%', tone: 'bad' },
      ],
      learns: [0],
    },
    {
      id: 'hash-ring',
      label: 'Hash ring',
      kind: 'technique',
      title: 'Map both nodes and keys onto a 32-bit circle',
      body: [
        '**Consistent hashing** replaces `% N` with a circular number line from `0` to `2³² − 1` (the **hash ring**). Hash each server’s ID onto the circle (`C -> A -> B`).',
        'To locate a key, hash the key onto the same ring and walk **clockwise** until you hit the first server. Removing `% N` breaks the dependency on total node count.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Both keys and servers share one 0..2³²−1 ring; each key belongs to the next node clockwise.',
        },
      ],
      changes: [
        {
          type: 'added',
          text: 'Clockwise hash ring edges connecting C → A → B',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'origin-db',
          patch: { state: 'normal', load: 0.1, badge: null },
        },
        {
          op: 'update-node',
          id: 'cache-a',
          patch: { sublabel: '12 o’clock' },
        },
        {
          op: 'update-node',
          id: 'cache-b',
          patch: { sublabel: '4 o’clock' },
        },
        {
          op: 'update-node',
          id: 'cache-c',
          patch: { sublabel: '9 o’clock' },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'c-to-a',
            from: 'cache-c',
            to: 'cache-a',
            style: 'dashed',
            route: 'straight',
            label: 'clockwise',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'a-to-b',
            from: 'cache-a',
            to: 'cache-b',
            style: 'dashed',
            route: 'straight',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'b-to-c',
            from: 'cache-b',
            to: 'cache-c',
            style: 'dashed',
            route: 'straight',
          },
        },
        { op: 'packet', edge: 'c-to-a', kind: 'request', wave: 0 },
        { op: 'set-metric', id: 'nodes', value: '3 (ring)' },
        { op: 'set-metric', id: 'moved', value: '0%', tone: 'normal' },
        { op: 'set-metric', id: 'hit-rate', value: '94%', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'one-over-n',
      label: '1/N moves',
      kind: 'technique',
      title: 'Adding Cache D moves only ~1/N of the keys',
      body: [
        'Now insert **Cache D** onto the ring at 6 o’clock, between `Cache B` and `Cache C`.',
        'Only keys landing in the slice just before D (`B → D`) walk clockwise to D instead of C. Every key elsewhere on the ring stays untouched—only **~25%** (`~1/N`) of keys move instead of 75%!',
      ],
      changes: [
        { type: 'added', text: 'Cache D inserted between B and C on the ring' },
        { type: 'changed', text: 'Only ~1/4 (25%) of keys remap' },
      ],
      ops: [
        { op: 'remove-edge', id: 'b-to-c' },
        {
          op: 'add-node',
          node: {
            id: 'cache-d',
            kind: 'cache',
            at: { x: 8, y: 7 },
            label: 'Cache D',
            sublabel: '6 o’clock (new)',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'b-to-d',
            from: 'cache-b',
            to: 'cache-d',
            style: 'dashed',
            route: 'straight',
            label: '1/4 slice',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'd-to-c',
            from: 'cache-d',
            to: 'cache-c',
            style: 'dashed',
            route: 'straight',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-cd',
            from: 'api',
            to: 'cache-d',
            route: 'elbow-y',
          },
        },
        {
          op: 'packet',
          edge: 'api-cd',
          kind: 'request',
          label: 'only B→D moves',
          wave: 0,
        },
        { op: 'set-metric', id: 'nodes', value: '4 (ring)' },
        { op: 'set-metric', id: 'moved', value: '~25% (1/N)', tone: 'good' },
        { op: 'set-metric', id: 'hit-rate', value: '71% → 94%', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'ring-skew',
      label: 'Uneven ring',
      kind: 'case',
      title: 'Few nodes create hot slices and cascade risk',
      body: [
        'With only four physical points on a 32-bit circle, random hashes cluster unevenly: `Cache A` could end up owning **55%** of the ring while `Cache D` owns **10%**.',
        'Worse, if `Cache A` crashes, **100%** of its hot slice dumps directly onto its single clockwise neighbour `Cache B`—risking a cascading failure!',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'cache-d',
          patch: { state: 'normal' },
        },
        {
          op: 'update-node',
          id: 'cache-a',
          patch: { state: 'down', badge: 'crashed' },
        },
        {
          op: 'update-node',
          id: 'cache-b',
          patch: { state: 'hot', load: 0.97, badge: 'overloaded!' },
        },
        {
          op: 'packet',
          edge: 'a-to-b',
          kind: 'error',
          count: 3,
          label: '100% of A → B',
          wave: 0,
        },
      ],
    },
    {
      id: 'virtual-nodes',
      label: 'Virtual nodes',
      kind: 'technique',
      title: 'Virtual nodes split each server into many slices',
      body: [
        'Instead of placing `Cache A` once on the ring, give each physical machine **100–200 virtual nodes** (`vnodes`: `A#0`, `A#1`, ..., `A#199`) scattered around the circle.',
        'Slices interleave tightly: key variance shrinks to **~5%**, bigger servers can take more vnodes, and a dead server’s load spreads evenly across all survivors.',
      ],
      changes: [
        {
          type: 'changed',
          text: '200 virtual nodes assigned per physical cache',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'cache-a',
          patch: { state: 'focus', badge: '200 vnodes' },
        },
        {
          op: 'update-node',
          id: 'cache-b',
          patch: { state: 'focus', load: 0.25, badge: '200 vnodes' },
        },
        {
          op: 'update-node',
          id: 'cache-c',
          patch: { state: 'focus', badge: '200 vnodes' },
        },
        {
          op: 'update-node',
          id: 'cache-d',
          patch: { state: 'focus', badge: '200 vnodes' },
        },
        {
          op: 'add-note',
          note: {
            id: 'vnode-note',
            anchor: { node: 'cache-a' },
            text: '< 5% key skew across ring',
            tone: 'good',
            icon: 'check',
          },
        },
      ],
      learns: [3],
    },
    {
      id: 'ring-replicas',
      label: 'Ring replicas',
      kind: 'technique',
      title: 'Walk clockwise to copy N replicas across nodes',
      body: [
        'Distributed key-value stores like **Dynamo** and **Cassandra** also use the ring for durability. For replication factor `N = 3`, a key hashes to its primary vnode and walks clockwise to copy onto the next **2 distinct physical nodes**.',
        'If one node goes down, the next clockwise replica already holds the key.',
      ],
      ops: [
        { op: 'remove-note', id: 'vnode-note' },
        {
          op: 'update-node',
          id: 'cache-c',
          patch: { state: 'normal', badge: 'rep 1' },
        },
        {
          op: 'update-node',
          id: 'cache-a',
          patch: { state: 'normal', badge: 'rep 2' },
        },
        {
          op: 'update-node',
          id: 'cache-b',
          patch: { state: 'normal', badge: 'rep 3' },
        },
        {
          op: 'update-node',
          id: 'cache-d',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'packet',
          edge: 'c-to-a',
          kind: 'write',
          label: 'copy 2',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'a-to-b',
          kind: 'write',
          label: 'copy 3',
          wave: 1,
        },
      ],
      learns: [3],
    },
    {
      id: 'vnode-watchout',
      label: 'Watch out',
      kind: 'watch-out',
      title: 'Skip same-host vnodes when placing replicas',
      body: [
        'With virtual nodes interleaved on the ring, walking clockwise from `A#12` might immediately hit `A#47`—another vnode on the _exact same physical machine_ (or rack)!',
        'Replica placement **must skip duplicate physical hosts and failure zones**. Also keep vnode counts moderate (~100–200): 50,000 vnodes per node bloats cluster routing tables.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never place two replicas on virtual nodes belonging to the same physical server or availability zone.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'cache-a',
          patch: { state: 'hot', badge: 'skip same host!' },
        },
        {
          op: 'add-note',
          note: {
            id: 'dup-host-note',
            anchor: { node: 'cache-a' },
            text: 'Skip A#47 → pick next host',
            tone: 'bad',
            icon: 'warning',
          },
        },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Consistent hashing keeps resizes calm',
      body: [
        'Mapping keys and nodes onto a hash ring with virtual nodes bounds data movement to ~1/N during scale events, flattens uneven hotspots, and simplifies clockwise replica placement.',
      ],
      ops: [
        { op: 'remove-note', id: 'dup-host-note' },
        {
          op: 'update-node',
          id: 'cache-a',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'cache-b',
          patch: { badge: null, load: null },
        },
        { op: 'update-node', id: 'cache-c', patch: { badge: null } },
        { op: 'update-node', id: 'origin-db', patch: { load: null } },
        {
          op: 'add-note',
          note: {
            id: 'ch-summary',
            anchor: { at: { x: 12, y: 8.5 } },
            text: 'Resize from 3 → 4 nodes',
            tone: 'info',
            icon: 'route',
            rows: [
              ['hash(k) % N', '~75% keys move'],
              ['Raw ring', '~25% move · high skew'],
              ['Ring + vnodes', '~25% move · balanced'],
            ],
          },
        },
      ],
      takeaways: [
        'Modulo hashing (`hash(key) % N`) remaps almost every key when N changes, causing cache stampedes',
        'A hash ring assigns each key to the first node clockwise, moving only ~1/N keys when adding or removing a node',
        'Virtual nodes (100–200 per server) balance key distribution and spread failure recovery across all remaining nodes',
        'Clockwise replication places N copies on distinct physical servers/zones by skipping same-host virtual nodes',
      ],
    },
  ],
  checks: [
    {
      id: 'numeric-one-over-n',
      kind: 'numeric',
      prompt:
        'A consistent hash ring with virtual nodes holds 20 million keys across 4 equal cache servers. When you add a 5th equal cache server, roughly how many million keys move?',
      unit: 'million keys',
      answer: 4,
      tolerance: 0.25,
      explain:
        'With consistent hashing, adding a 5th server moves only about 1/N = 1/5 (20%) of the keys: 20M × 0.2 = 4 million keys.',
      step: 'one-over-n',
    },
    {
      id: 'choice-mod-n-problem',
      kind: 'choice',
      prompt:
        'Why does switching from `hash(key) % 4` to `hash(key) % 5` hurt a production Redis cluster?',
      options: [
        'Roughly 80% of keys map to a different node index, triggering a massive cache miss storm against the database',
        'Modulo arithmetic stops working once N exceeds 4',
        'Redis deletes every expired key synchronously before answering reads',
      ],
      answer: 0,
      explain:
        'Changing the modulus shifts the remainder for almost every hash value, invalidating the majority of cached routes at once.',
      step: 'mod-n-shock',
    },
    {
      id: 'choice-virtual-nodes',
      kind: 'choice',
      prompt:
        'What TWO problems do virtual nodes solve on a consistent hash ring?',
      options: [
        'Uneven key distribution (skew) across servers, and one neighbour absorbing 100% of a crashed server’s traffic',
        'Cross-datacentre network latency and TLS handshake overhead',
        'SQL schema migrations and foreign key constraints',
      ],
      answer: 0,
      explain:
        'Giving each server many interleaved points shrinks key skew and ensures a crashed node’s slices hand off evenly to all remaining servers.',
      step: 'virtual-nodes',
    },
    {
      id: 'order-ring-lookup',
      kind: 'order',
      prompt:
        'Order the steps a client takes to locate and replicate a key on a consistent hash ring (N = 3).',
      items: [
        'Hash the key onto the 0..2^32−1 ring space',
        'Walk clockwise to the first virtual node to pick the primary server',
        'Continue clockwise, skipping virtual nodes on already-chosen physical hosts, until 3 distinct hosts hold replicas',
      ],
      explain:
        'You hash the key, walk clockwise to find the primary host, then walk further while skipping duplicate physical hosts for replicas.',
      step: 'ring-replicas',
    },
  ],
  cards: [
    {
      front: 'Why does `hash(key) % N` fail when cache cluster size N changes?',
      back: 'Almost every key’s `hash(key) % N` result changes, invalidating most routes simultaneously and triggering a cache stampede to the backing database.',
    },
    {
      front:
        'How does a consistent hash ring limit key movement when adding a server?',
      back: 'Both servers and keys hash onto one circle; keys map to the first node clockwise, so inserting a node only steals keys in the slice immediately counter-clockwise to it (~1/N).',
    },
    {
      front: 'Why are virtual nodes (vnodes) used in consistent hashing?',
      back: 'Assigning 100–200 points per server smooths key skew, supports heterogeneous server weights, and spreads a failed node’s load across all remaining machines.',
    },
    {
      front:
        'What rule must clockwise replication follow when virtual nodes are enabled?',
      back: 'Skip virtual nodes belonging to already-selected physical hosts (or failure zones) so all N replicas live on independent hardware.',
    },
  ],
} satisfies Lesson;
