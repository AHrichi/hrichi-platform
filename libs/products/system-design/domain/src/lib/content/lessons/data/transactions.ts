import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 03.10: Transactions & Isolation (`transactions`).
 * Scenario: Two buyers, one last concert seat (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'transactions',
  learn: [
    'What ACID guarantees—and why isolation prevents races',
    'How dirty reads, lost updates, and write skew happen',
    'What each SQL isolation level prevents and allows',
    'How pessimistic locks compare to MVCC snapshots',
    'How optimistic version checks stop silent overwrites',
  ],
  scene: {
    nodes: [
      {
        id: 'buyer-a',
        kind: 'user',
        at: { x: 1, y: 2 },
        label: 'Buyer A',
        sublabel: 'Session 1',
      },
      {
        id: 'buyer-b',
        kind: 'user',
        at: { x: 1, y: 6 },
        label: 'Buyer B',
        sublabel: 'Session 2',
      },
      {
        id: 'api',
        kind: 'service',
        at: { x: 5, y: 4 },
        label: 'Ticket API',
        sublabel: 'Checkout svc',
      },
      {
        id: 'db',
        kind: 'database',
        at: { x: 10, y: 4 },
        label: 'Tickets DB',
        sublabel: 'Seat A12 · free',
      },
    ],
    edges: [
      { id: 'a-api', from: 'buyer-a', to: 'api', label: 'POST /book' },
      { id: 'b-api', from: 'buyer-b', to: 'api', label: 'POST /book' },
      { id: 'api-db', from: 'api', to: 'db', label: 'SQL tx' },
    ],
    zones: [
      {
        id: 'db-zone',
        from: { x: 8, y: 1 },
        to: { x: 12, y: 7 },
        hue: 'violet',
        label: 'Database engine',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'seats', label: 'Seats left', icon: 'layers', value: '1' },
    { id: 'sold', label: 'Tickets sold', icon: 'check', value: '0' },
    { id: 'isolation', label: 'Isolation', icon: 'lock', value: 'Read Uncomm' },
    { id: 'conflicts', label: 'Anomalies', icon: 'warning', value: '0' },
  ],
  steps: [
    {
      id: 'last-seat',
      label: 'Last seat',
      kind: 'problem',
      title: 'Two buyers click Book on the very last seat',
      body: [
        'One concert ticket remains: **Seat A12** (`seats_left = 1`). Buyer A and Buyer B tap Book at the exact same millisecond.',
        'Without concurrency protection, both threads read `seats_left = 1`, both charge a credit card, and both print a ticket—selling one seat twice.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'hot', badge: '2 buyers!' },
        },
        { op: 'packet', edge: 'a-api', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'b-api', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'write',
          count: 2,
          label: 'both book A12',
          wave: 1,
        },
        { op: 'set-metric', id: 'sold', value: '2!!', tone: 'bad' },
        { op: 'set-metric', id: 'conflicts', value: 'Oversold', tone: 'bad' },
      ],
    },
    {
      id: 'acid-rules',
      label: 'ACID rules',
      kind: 'technique',
      title: 'ACID makes each transaction all-or-nothing',
      body: [
        'A database **transaction** bundles reads and writes under four guarantees (**ACID**): **Atomicity** (all commit or all roll back), **Consistency** (schema constraints hold), **Isolation** (concurrent runs do not corrupt each other), and **Durability** (committed bytes survive crashes via WAL).',
        '**Isolation** is the dial you tune to block concurrency bugs.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'focus', badge: 'ACID tx' },
        },
        { op: 'set-metric', id: 'sold', value: '0', tone: 'normal' },
        { op: 'set-metric', id: 'conflicts', value: '0', tone: 'good' },
      ],
      learns: [0],
    },
    {
      id: 'dirty-read',
      label: 'Dirty read',
      kind: 'technique',
      title: 'Read Committed blocks reading uncommitted writes',
      body: [
        'At **Read Uncommitted**, Buyer A sets `seats = 0` mid-transaction, Buyer B reads `0` and leaves, and then Buyer A’s card declines and rolls back to `1`. That phantom peek is a **dirty read**.',
        'Raise isolation to **Read Committed**: readers see only committed rows, stopping dirty reads immediately.',
      ],
      changes: [
        { type: 'changed', text: 'Isolation raised to Read Committed' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'normal', badge: 'committed only' },
        },
        { op: 'set-metric', id: 'isolation', value: 'Read Comm' },
      ],
    },
    {
      id: 'lost-update',
      label: 'Lost update',
      kind: 'case',
      title: 'Read Committed still loses concurrent updates',
      body: [
        'Even under Read Committed, two read-modify-write cycles interleave: Buyer A reads `seats = 1`, Buyer B reads `seats = 1`, A writes `owner = A, seats = 0`, then B overwrites `owner = B, seats = 0`.',
        'A’s reservation vanishes—a **lost update**—yet both buyers hold confirmations!',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'hot', badge: 'A overwritten!' },
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'error',
          count: 2,
          label: 'B overwrites A',
          wave: 0,
        },
        { op: 'set-metric', id: 'sold', value: '2!!', tone: 'bad' },
        {
          op: 'set-metric',
          id: 'conflicts',
          value: 'Lost update',
          tone: 'bad',
        },
      ],
      learns: [1],
    },
    {
      id: 'locks-vs-mvcc',
      label: 'Locks vs MVCC',
      kind: 'technique',
      title: 'Use row locks or MVCC snapshots to stop races',
      body: [
        'Two ways engines protect updates:\n• **Pessimistic row lock** (`SELECT … FOR UPDATE`): Buyer A locks Seat A12; Buyer B blocks in line until A commits, then sees `0` seats.\n• **MVCC** (_Multi-Version Concurrency Control_): reads view a consistent past snapshot without blocking writers, and **Snapshot Isolation** aborts the second committer on conflict.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'MVCC prevents readers and writers from blocking each other while Snapshot Isolation enforces first-committer-wins on row writes.',
        },
      ],
      changes: [
        { type: 'changed', text: 'Isolation raised to Snapshot (MVCC)' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'db',
          patch: {
            state: 'focus',
            sublabel: 'Seat A12 · Buyer A',
            badge: 'MVCC v2',
          },
        },
        {
          op: 'packet',
          edge: 'a-api',
          kind: 'response',
          reverse: true,
          label: 'Booked!',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'b-api',
          kind: 'error',
          reverse: true,
          label: '409 Sold out',
          wave: 0,
        },
        { op: 'set-metric', id: 'seats', value: '0' },
        { op: 'set-metric', id: 'sold', value: '1', tone: 'good' },
        { op: 'set-metric', id: 'isolation', value: 'Snapshot' },
        { op: 'set-metric', id: 'conflicts', value: '0', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'optimistic-version',
      label: 'Optimistic',
      kind: 'technique',
      title: 'Prevent silent overwrites with a version column',
      body: [
        'Holding database locks while calling a slow payment gateway starves connections. Instead, use **optimistic concurrency**: add a `version` column (`v1`).',
        'Run `UPDATE seats SET owner=?, version=2 WHERE id=\'A12\' AND version=1`. Buyer A updates **1 row**; Buyer B matches **0 rows** and safely retries or returns "Sold out".',
      ],
      changes: [{ type: 'added', text: 'Optimistic WHERE version = ? check' }],
      ops: [
        {
          op: 'update-node',
          id: 'db',
          patch: { sublabel: 'A12 · version=2', badge: 'CAS check' },
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'write',
          label: 'WHERE ver=1',
          wave: 0,
        },
      ],
      learns: [4],
    },
    {
      id: 'write-skew',
      label: 'Write skew',
      kind: 'watch-out',
      title: 'Snapshot Isolation still allows write skew',
      body: [
        'Suppose venue safety requires **at least 1 usher on duty** (`Alice` and `Bob` rows, both `true`). Under **Snapshot Isolation**, Alice reads `count = 2` and sets `Alice = false`; Bob reads the _same_ snapshot `count = 2` and sets `Bob = false`.',
        'Because they edit **disjoint rows**, first-committer-wins commits both—leaving **0 ushers**! This anomaly is **write skew**.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'PostgreSQL’s REPEATABLE READ is Snapshot Isolation: it prevents lost updates on one row, but permits write skew across separate rows.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'db',
          patch: {
            state: 'hot',
            sublabel: '0 ushers on duty!',
            badge: 'write skew',
          },
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'error',
          count: 2,
          label: 'disjoint rows!',
          wave: 0,
        },
        {
          op: 'set-metric',
          id: 'conflicts',
          value: 'Write skew',
          tone: 'bad',
        },
      ],
    },
    {
      id: 'serializable',
      label: 'Serializable',
      kind: 'technique',
      title: 'Serializable prevents all five anomalies',
      body: [
        'Step up to **Serializable** isolation (`SSI` or range locks). The engine tracks what rows each transaction _read_, detects that Alice’s write invalidated Bob’s `count = 2` premise, and aborts Bob with a serialization error to retry.',
        'Use the weakest level that stays safe, and handle retryable serialization aborts in app code.',
      ],
      changes: [{ type: 'changed', text: 'Isolation raised to Serializable' }],
      ops: [
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'focus', sublabel: '1 usher safe', badge: 'SSI' },
        },
        {
          op: 'set-metric',
          id: 'isolation',
          value: 'Serializable',
          tone: 'good',
        },
        { op: 'set-metric', id: 'conflicts', value: '0', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Match isolation and locking to your contention',
      body: [
        'Concurrency bugs happen when interleaved transactions share state without sufficient isolation. Know which anomalies your database’s default level allows.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'normal', badge: null, sublabel: 'Tickets DB' },
        },
        {
          op: 'add-note',
          note: {
            id: 'iso-summary',
            anchor: { at: { x: 7, y: 8.5 } },
            text: 'Isolation Levels vs Anomalies',
            tone: 'info',
            icon: 'lock',
            rows: [
              ['Read Committed', 'Stops dirty reads'],
              ['Snapshot (MVCC)', 'Stops lost updates'],
              ['Optimistic CAS', 'WHERE version = ?'],
              ['Serializable', 'Stops write skew too'],
            ],
          },
        },
      ],
      takeaways: [
        'ACID protects single-transaction integrity; Isolation controls how concurrent transactions interfere',
        'Read Committed stops dirty reads, but still permits lost updates on read-modify-write cycles',
        'Pessimistic row locks (SELECT … FOR UPDATE), MVCC snapshots, and optimistic version checks prevent lost updates',
        'Snapshot Isolation allows write skew across disjoint rows; only Serializable prevents every anomaly',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-write-skew',
      kind: 'choice',
      prompt:
        'Under Snapshot Isolation, two on-call doctors read count = 2 on-call doctors, and each updates only their own row to off-duty. Why does the database allow both to commit, leaving 0 on call?',
      options: [
        'They wrote to disjoint rows, so Snapshot Isolation detects no write-write conflict (write skew)',
        'Snapshot Isolation allows dirty reads of uncommitted booleans',
        'SQL databases cannot enforce isolation across boolean columns',
      ],
      answer: 0,
      explain:
        'Snapshot Isolation checks first-committer-wins only when two transactions modify the exact same row; cross-row invariants require Serializable (or explicit locking).',
      step: 'write-skew',
    },
    {
      id: 'choice-optimistic-cas',
      kind: 'choice',
      prompt:
        "With optimistic concurrency (`UPDATE seats SET owner=?, version=8 WHERE id='A12' AND version=7`), what happens if another buyer already incremented version to 8?",
      options: [
        'Zero rows match the WHERE clause, signalling the caller that someone else won the update',
        'The database blocks the caller until version returns to 7',
        'The database silently overwrites version 8 with 8',
      ],
      answer: 0,
      explain:
        'Comparing the expected version in the WHERE clause makes the update atomic: 0 affected rows means a conflict occurred, so the app reloads or rejects cleanly.',
      step: 'optimistic-version',
    },
    {
      id: 'order-isolation-levels',
      kind: 'order',
      prompt:
        'Order these SQL isolation levels from weakest (most anomalies allowed) to strongest (all anomalies prevented).',
      items: [
        'Read Uncommitted',
        'Read Committed',
        'Snapshot Isolation',
        'Serializable',
      ],
      explain:
        'Read Uncommitted allows dirty reads; Read Committed blocks dirty reads; Snapshot Isolation adds lost-update protection; Serializable blocks write skew and phantoms too.',
      step: 'serializable',
    },
    {
      id: 'choice-mvcc-reads',
      kind: 'choice',
      prompt:
        'How does MVCC (Multi-Version Concurrency Control) keep concurrent readers fast during heavy writes?',
      options: [
        'Readers read a consistent past row version from a snapshot instead of blocking behind write locks',
        'MVCC forces all readers into Read Uncommitted mode',
        'MVCC copies the entire table onto a separate server per query',
      ],
      answer: 0,
      explain:
        'By keeping older row versions while writers create new versions, MVCC lets reads proceed lock-free without blocking writers or reading uncommitted state.',
      step: 'locks-vs-mvcc',
    },
  ],
  cards: [
    {
      front: 'Contrast dirty read, lost update, and write skew.',
      back: '• Dirty read: reading another transaction’s uncommitted change.\n• Lost update: two read-modify-write cycles overwrite the same row.\n• Write skew: two transactions read a shared rule, edit different rows, and break the rule together.',
    },
    {
      front: 'How do pessimistic locking and optimistic version checks differ?',
      back: 'Pessimistic (SELECT … FOR UPDATE) locks the row upfront so rivals wait; optimistic stores a version column and checks WHERE version = ? at commit, retrying on 0 updated rows.',
    },
    {
      front:
        'Why does PostgreSQL’s Repeatable Read (Snapshot Isolation) still permit write skew?',
      back: 'Snapshot Isolation aborts only when two concurrent transactions update the same row; updates to disjoint rows commit cleanly unless Serializable (SSI) tracks read dependencies.',
    },
    {
      front: 'How does MVCC avoid reader-writer lock contention?',
      back: 'It stores multiple versions of a row so queries read a consistent snapshot without waiting on or blocking concurrent writers.',
    },
  ],
} satisfies Lesson;
