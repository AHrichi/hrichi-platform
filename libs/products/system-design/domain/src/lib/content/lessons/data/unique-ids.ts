import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 03.07: Unique IDs at Scale (`unique-ids`).
 * Scenario: Two shards issue the same invoice number (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'unique-ids',
  learn: [
    'Why auto-increment IDs collide or bottleneck across shards',
    'Why random UUIDv4 hurts database B-tree write performance',
    'How UUIDv7 and ULID stay sortable without coordination',
    'How Snowflake 64-bit IDs work and handle clock skew',
  ],
  scene: {
    nodes: [
      {
        id: 'app-a',
        kind: 'service',
        at: { x: 3, y: 3 },
        label: 'Billing A',
        sublabel: 'East region',
      },
      {
        id: 'app-b',
        kind: 'service',
        at: { x: 3, y: 7 },
        label: 'Billing B',
        sublabel: 'West region',
      },
      {
        id: 'shard-a',
        kind: 'database',
        at: { x: 10, y: 3 },
        label: 'Invoice DB 1',
        sublabel: 'AUTO_INCREMENT',
      },
      {
        id: 'shard-b',
        kind: 'database',
        at: { x: 10, y: 7 },
        label: 'Invoice DB 2',
        sublabel: 'AUTO_INCREMENT',
      },
    ],
    edges: [
      { id: 'a-shard', from: 'app-a', to: 'shard-a', label: 'INSERT' },
      { id: 'b-shard', from: 'app-b', to: 'shard-b', label: 'INSERT' },
    ],
    zones: [
      {
        id: 'app-zone',
        from: { x: 1, y: 1 },
        to: { x: 4, y: 8 },
        hue: 'blue',
        label: 'App servers',
      },
      {
        id: 'shard-zone',
        from: { x: 9, y: 0 },
        to: { x: 12, y: 8 },
        hue: 'violet',
        label: 'Invoice shards',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'id-bits', label: 'ID size', icon: 'hash', value: '64 bit' },
    { id: 'collisions', label: 'Collisions', icon: 'warning', value: '0' },
    { id: 'gen-rate', label: 'IDs / sec', icon: 'gauge', value: '2k' },
    { id: 'index-io', label: 'Index I/O', icon: 'database', value: 'Low' },
  ],
  steps: [
    {
      id: 'shard-collision',
      label: 'Collision',
      kind: 'problem',
      title: 'Two shards issue the exact same invoice ID',
      body: [
        'Your billing platform grew past one database, so you split invoices across two **shards**. Each shard still relies on local SQL `AUTO_INCREMENT` starting from `1000`.',
        'At noon both shards mint invoice **`#1042`** for different buyers. Merging records into analytics crashes with a duplicate-key error—and customers hold colliding receipt numbers.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'shard-a',
          patch: { state: 'hot', badge: 'issued #1042' },
        },
        {
          op: 'update-node',
          id: 'shard-b',
          patch: { state: 'hot', badge: 'issued #1042' },
        },
        {
          op: 'packet',
          edge: 'a-shard',
          kind: 'write',
          label: 'INV #1042',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'b-shard',
          kind: 'write',
          label: 'INV #1042',
          wave: 0,
        },
        { op: 'set-metric', id: 'collisions', value: '2 dupes', tone: 'bad' },
      ],
    },
    {
      id: 'central-seq',
      label: 'Single counter',
      kind: 'technique',
      title: 'A central sequence stops dupes—at a cost',
      body: [
        'To avoid duplicates, both apps can ask one **Sequence DB** for the next number before inserting. You could also use odd/even strides (`+2`), though resharding from 2 shards to 10 breaks stride math.',
        'One central sequence guarantees unique IDs (`0` collisions), but every invoice write now pays an extra network hop.',
      ],
      changes: [
        { type: 'added', text: 'Central Sequence DB node' },
        { type: 'changed', text: 'Collisions drop to 0' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'shard-a',
          patch: { state: 'normal', badge: null, sublabel: 'Shard 1' },
        },
        {
          op: 'update-node',
          id: 'shard-b',
          patch: { state: 'normal', badge: null, sublabel: 'Shard 2' },
        },
        {
          op: 'add-node',
          node: {
            id: 'seq-db',
            kind: 'database',
            at: { x: 6.5, y: 5 },
            label: 'Sequence DB',
            sublabel: 'nextval()',
            state: 'focus',
            load: 0.3,
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'a-seq',
            from: 'app-a',
            to: 'seq-db',
            label: 'ID?',
            style: 'dashed',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'b-seq',
            from: 'app-b',
            to: 'seq-db',
            label: 'ID?',
            style: 'dashed',
          },
        },
        { op: 'packet', edge: 'a-seq', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'b-seq', kind: 'request', wave: 0 },
        {
          op: 'set-metric',
          id: 'collisions',
          value: '0',
          tone: 'good',
        },
      ],
      learns: [0],
    },
    {
      id: 'single-bottleneck',
      label: 'Bottleneck',
      kind: 'case',
      title: 'Flash traffic saturates one central counter',
      body: [
        'During a concert ticket drop, billing needs **50,000 IDs/sec**. Every region blocks waiting on the single **Sequence DB** row lock.',
        'Cross-region round trips spike latency, and if that one counter goes down, _nobody_ can create an invoice. We need nodes to mint unique IDs locally.',
      ],
      changes: [
        { type: 'changed', text: 'Sequence DB hits 95% lock saturation' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'seq-db',
          patch: { state: 'hot', load: 0.96, badge: 'SPOF lock' },
        },
        {
          op: 'packet',
          edge: 'a-seq',
          kind: 'error',
          count: 3,
          label: 'lock wait',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'b-seq',
          kind: 'error',
          count: 3,
          label: 'lock wait',
          wave: 0,
        },
        { op: 'set-metric', id: 'gen-rate', value: '5k cap', tone: 'bad' },
      ],
    },
    {
      id: 'uuid-v4',
      label: 'Random UUIDv4',
      kind: 'technique',
      title: 'UUIDv4 mints locally, but thrashes B-trees',
      body: [
        'Remove the central counter and generate **128-bit UUIDv4** locally on each app server using 122 random bits. Two servers never collide without talking.',
        'The catch is disk I/O: random IDs scatter inserts across random **B-tree** index pages instead of appending at the end, causing cache misses and page splits.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'B-tree primary keys love monotonic appends; purely random UUIDv4 keys force random page writes.',
        },
      ],
      changes: [
        { type: 'removed', text: 'Central Sequence DB bottleneck' },
        { type: 'changed', text: 'Local 128-bit UUIDv4 causes high index I/O' },
      ],
      ops: [
        { op: 'remove-node', id: 'seq-db' },
        {
          op: 'update-node',
          id: 'app-a',
          patch: { state: 'focus', badge: 'UUIDv4' },
        },
        {
          op: 'update-node',
          id: 'app-b',
          patch: { state: 'focus', badge: 'UUIDv4' },
        },
        {
          op: 'update-node',
          id: 'shard-a',
          patch: { state: 'hot', load: 0.85, badge: 'page splits' },
        },
        {
          op: 'update-node',
          id: 'shard-b',
          patch: { state: 'hot', load: 0.85, badge: 'page splits' },
        },
        { op: 'packet', edge: 'a-shard', kind: 'write', count: 3, wave: 0 },
        { op: 'packet', edge: 'b-shard', kind: 'write', count: 3, wave: 0 },
        { op: 'set-metric', id: 'id-bits', value: '128 bit' },
        { op: 'set-metric', id: 'gen-rate', value: '1M+/s', tone: 'good' },
        { op: 'set-metric', id: 'index-io', value: 'High', tone: 'bad' },
      ],
      learns: [1],
    },
    {
      id: 'time-ordered',
      label: 'UUIDv7 & ULID',
      kind: 'technique',
      title: 'Put a timestamp first for sequential appends',
      body: [
        '**UUIDv7** and **ULID** keep 128 bits and zero coordination, but store a **48-bit millisecond timestamp** in the high bits followed by random bits.',
        'Because IDs increase over time, new invoices append to the right edge of the B-tree index. Index writes stay sequential and buffer-pool cache hits rebound.',
      ],
      changes: [
        { type: 'changed', text: 'Switched to time-ordered UUIDv7 / ULID' },
        { type: 'changed', text: 'B-tree index I/O returns to Low' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-a',
          patch: { badge: 'UUIDv7' },
        },
        {
          op: 'update-node',
          id: 'app-b',
          patch: { badge: 'UUIDv7' },
        },
        {
          op: 'update-node',
          id: 'shard-a',
          patch: { state: 'focus', load: 0.3, badge: 'append I/O' },
        },
        {
          op: 'update-node',
          id: 'shard-b',
          patch: { state: 'focus', load: 0.3, badge: 'append I/O' },
        },
        {
          op: 'packet',
          edge: 'a-shard',
          kind: 'write',
          label: '0193…a4',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'b-shard',
          kind: 'write',
          label: '0193…f9',
          wave: 0,
        },
        { op: 'set-metric', id: 'index-io', value: 'Low', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'snowflake',
      label: 'Snowflake IDs',
      kind: 'technique',
      title: 'Pack 64 bits with time, node ID, and sequence',
      body: [
        'Need half the index size of 128-bit UUIDs? **Snowflake IDs** fit in a single 64-bit integer (`BIGINT`): `1` sign bit + `41` bits milliseconds (~69 years) + `10` bits worker ID (`1,024` nodes) + `12` bits per-ms sequence.',
        'One worker mints up to **4,096 IDs/ms** (~4M/sec) locally and chronologically.',
      ],
      changes: [
        { type: 'added', text: '64-bit Snowflake bit-layout panel' },
        { type: 'changed', text: 'ID size halved back to 64 bit' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-a',
          patch: { badge: 'node #01' },
        },
        {
          op: 'update-node',
          id: 'app-b',
          patch: { badge: 'node #02' },
        },
        {
          op: 'update-node',
          id: 'shard-a',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'shard-b',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'snowflake-bits',
            anchor: { at: { x: 5, y: 0 } },
            text: '64-bit Snowflake layout',
            tone: 'info',
            icon: 'hash',
            rows: [
              ['Sign + Time', '1 + 41 bits'],
              ['Worker ID', '10 bits (1,024)'],
              ['Sequence', '12 bits (4,096/ms)'],
            ],
            total: ['Per worker', '4.09M IDs/s'],
          },
        },
        { op: 'set-metric', id: 'id-bits', value: '64 bit', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'clock-skew',
      label: 'Clock skew',
      kind: 'watch-out',
      title: 'Backward NTP clock jumps can duplicate IDs',
      body: [
        'Time-ordered generators assume wall clocks only move forward. If **NTP** steps `Billing A` backward by `50 ms`, the worker re-enters an old millisecond and risks issuing duplicate IDs.',
        'Track the last timestamp seen: wait out tiny backward drift, refuse ID minting on large jumps, or pull time from monotonic clocks.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never trust wall clocks blindly: pause for small backward clock skew, and alert or fence on large jumps.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-a',
          patch: { state: 'hot', badge: '-50 ms skew' },
        },
        {
          op: 'packet',
          edge: 'a-shard',
          kind: 'error',
          label: 'stale ms!',
          wave: 0,
        },
        { op: 'set-metric', id: 'collisions', value: 'Risk!', tone: 'bad' },
      ],
    },
    {
      id: 'id-secrecy',
      label: 'Choosing IDs',
      kind: 'case',
      title: 'Watch out for predictable IDs in public URLs',
      body: [
        'Compact 64-bit Snowflake IDs expose creation timestamps and order volume—competitors can scrape `/invoices/1042` and `/invoices/1043` to count your daily sales.',
        'Use **Snowflake** for internal keys and high-volume streams, **UUIDv7** when you want unguessable random bits plus B-tree locality, and **UUIDv4** when hiding creation time matters.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-a',
          patch: { state: 'normal', badge: 'monotonic guard' },
        },
        { op: 'set-metric', id: 'collisions', value: '0', tone: 'good' },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Local, sortable, and safe from clock jumps',
      body: [
        'Distributing ID generation removes central counter bottlenecks, provided you respect **B-tree write locality** and **clock skew**.',
      ],
      ops: [
        { op: 'remove-note', id: 'snowflake-bits' },
        {
          op: 'update-node',
          id: 'app-a',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'app-b',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'id-summary',
            anchor: { at: { x: 6.5, y: 10.2 } },
            text: 'ID Scheme Trade-offs',
            tone: 'good',
            icon: 'check',
            rows: [
              ['Auto-increment', 'Collides on shards'],
              ['UUIDv4 (128b)', 'Random B-tree splits'],
              ['UUIDv7 / ULID', 'Sortable, unguessable'],
              ['Snowflake (64b)', '64-bit + worker IDs'],
            ],
          },
        },
      ],
      takeaways: [
        'Local auto-increment counters collide across shards; one central sequence becomes a lock bottleneck',
        'UUIDv4 needs zero coordination, but random bits scatter B-tree inserts across disk pages',
        'UUIDv7 and ULID prepend a millisecond timestamp so 128-bit IDs append sequentially',
        'Snowflake IDs pack timestamp, worker ID, and sequence into 64 bits—guard against backward clock skew',
      ],
    },
  ],
  checks: [
    {
      id: 'numeric-snowflake-ms',
      kind: 'numeric',
      prompt:
        'A Snowflake ID generator allocates 12 bits for its per-millisecond sequence counter. How many unique IDs can one worker generate in a single millisecond?',
      unit: 'IDs/ms',
      answer: 4096,
      tolerance: 0.05,
      explain:
        '12 sequence bits give 2¹² = 4,096 distinct IDs per millisecond on a single worker before waiting for the next millisecond.',
      step: 'snowflake',
    },
    {
      id: 'choice-uuidv4-io',
      kind: 'choice',
      prompt:
        'Why do purely random UUIDv4 primary keys hurt write throughput on large SQL B-tree tables?',
      options: [
        'New keys land in random leaf pages across the index instead of appending sequentially, causing cache misses and page splits',
        'UUIDv4 values require asking a central sequence server on every insert',
        'Databases cannot index 128-bit strings',
      ],
      answer: 0,
      explain:
        'B-trees stay fast when new primary keys append to the rightmost leaf page in memory; random keys touch cold pages all over disk.',
      step: 'uuid-v4',
    },
    {
      id: 'choice-clock-skew-defense',
      kind: 'choice',
      prompt:
        'What should a Snowflake generator do if an NTP sync steps its system clock backward by 10 milliseconds?',
      options: [
        'Refuse to reuse the past millisecond—wait for the clock to catch up (or fail health checks on large drift)',
        'Switch temporarily to random UUIDv4 inside the same 64-bit integer',
        'Reset its worker ID to 0 and keep minting',
      ],
      answer: 0,
      explain:
        'Reusing an earlier millisecond can emit duplicate IDs; waiting out tiny drift or fencing the node prevents collisions.',
      step: 'clock-skew',
    },
    {
      id: 'order-snowflake-mint',
      kind: 'order',
      prompt:
        'Put the steps a Snowflake worker runs to safely mint one 64-bit ID in order.',
      items: [
        'Read the current timestamp in milliseconds',
        'Verify the clock has not jumped backward past the last timestamp',
        'Increment the per-ms sequence (or wait for the next ms if 4,096 is reached)',
        'Pack timestamp, worker ID, and sequence into 64 bits',
      ],
      explain:
        'You read time, guard against backward skew, allocate the sequence slot within that millisecond, and pack the fields into 64 bits.',
      step: 'snowflake',
    },
  ],
  cards: [
    {
      front: 'Why does UUIDv4 degrade B-tree insert performance at scale?',
      back: 'Its 122 random bits scatter new primary keys across random disk pages instead of appending sequentially, causing buffer-pool misses and page splits.',
    },
    {
      front: 'How do UUIDv7 and ULID fix UUIDv4’s indexing problem?',
      back: 'They place a 48-bit millisecond timestamp in the most significant bits followed by random bits, keeping IDs roughly time-sorted without coordination.',
    },
    {
      front: 'What are the fields inside a standard 64-bit Snowflake ID?',
      back: '1 sign bit (0) + 41 timestamp bits + 10 machine/worker ID bits + 12 per-millisecond sequence bits.',
    },
    {
      front: 'Why is clock skew dangerous for time-based ID generators?',
      back: 'If NTP steps a server’s clock backward, it can generate IDs with an earlier timestamp and collide with IDs already issued.',
    },
  ],
} satisfies Lesson;
