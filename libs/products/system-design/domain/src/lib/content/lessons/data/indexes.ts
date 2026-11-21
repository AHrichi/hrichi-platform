import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 03.02: Indexes (`indexes`).
 * Scenario: "Orders by email" scanning 50M rows (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'indexes',
  learn: [
    'Why unindexed filters trigger slow full table scans',
    'How a B-tree index locates rows in O(log N) page reads',
    'Why composite index column order matters for queries',
    'How covering indexes skip heap reads, at a write cost',
  ],
  scene: {
    nodes: [
      {
        id: 'api',
        kind: 'server',
        at: { x: 1, y: 4 },
        label: 'Orders API',
        sublabel: 'Lookup by email',
      },
      {
        id: 'orders-heap',
        kind: 'database',
        at: { x: 10, y: 4 },
        label: 'Orders table',
        sublabel: '50M rows · heap',
        load: 0.95,
        state: 'hot',
      },
    ],
    edges: [
      {
        id: 'api-heap',
        from: 'api',
        to: 'orders-heap',
        label: 'WHERE email=?',
      },
    ],
    zones: [
      {
        id: 'db-zone',
        from: { x: 4, y: 0 },
        to: { x: 12, y: 8 },
        hue: 'violet',
        label: 'Orders storage',
      },
    ],
    notes: [],
  },
  hud: [
    {
      id: 'rows-scanned',
      label: 'Rows scanned',
      icon: 'search',
      value: '50,000,000',
    },
    { id: 'query-ms', label: 'Query ms', icon: 'timer', value: '4,200 ms' },
    { id: 'write-cost', label: 'Write cost', icon: 'layers', value: '1x' },
  ],
  steps: [
    {
      id: 'full-scan',
      label: 'Full scan',
      kind: 'problem',
      title: 'Scanning 50M rows to find twelve orders',
      body: [
        'A customer opens their order history, running `SELECT id, total FROM orders WHERE email = ?`. Your table holds **50 million rows** unsorted on disk.',
        'Without an index, the engine performs a **full table scan**, reading every 8 KB page from disk to check `email`. Scanning 50M rows takes **4,200 ms** and pins disk I/O.',
      ],
      ops: [
        {
          op: 'packet',
          edge: 'api-heap',
          kind: 'request',
          count: 3,
          label: 'Seq scan 50M',
          wave: 0,
        },
        {
          op: 'set-metric',
          id: 'rows-scanned',
          value: '50,000,000',
          tone: 'bad',
        },
        { op: 'set-metric', id: 'query-ms', value: '4,200 ms', tone: 'bad' },
      ],
      learns: [0],
    },
    {
      id: 'btree-lookup',
      label: 'B-tree',
      kind: 'technique',
      title: 'A B-tree finds matching rows in 4 page hops',
      body: [
        'Add a **B-tree index** on `email`. A B-tree keeps sorted keys in balanced, high-fanout pages (~500 keys per page): 4 levels cover `500⁴` (over 60 billion) rows.',
        'The engine reads 4 tree pages (`O(log N)`), finds the matching row pointers, and fetches just **12 heap rows** in **4 ms**.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'High-fanout B-trees stay 3–4 levels shallow even at hundreds of millions of rows.',
        },
      ],
      changes: [
        { type: 'added', text: 'B-tree index on (email)' },
        { type: 'changed', text: 'Rows scanned dropped from 50M to 12' },
      ],
      ops: [
        { op: 'remove-edge', id: 'api-heap' },
        {
          op: 'add-node',
          node: {
            id: 'btree-idx',
            kind: 'search',
            at: { x: 6, y: 3 },
            label: 'B-tree index',
            sublabel: '(email)',
            state: 'focus',
          },
        },
        {
          op: 'update-node',
          id: 'orders-heap',
          patch: { state: 'normal', load: 0.2 },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-btree',
            from: 'api',
            to: 'btree-idx',
            label: '4 tree hops',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'btree-heap',
            from: 'btree-idx',
            to: 'orders-heap',
            label: '12 row ptrs',
          },
        },
        { op: 'packet', edge: 'api-btree', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'btree-heap', kind: 'request', wave: 1 },
        { op: 'set-metric', id: 'rows-scanned', value: '12', tone: 'good' },
        { op: 'set-metric', id: 'query-ms', value: '4 ms', tone: 'good' },
        { op: 'set-metric', id: 'write-cost', value: '2x' },
      ],
      learns: [1],
    },
    {
      id: 'composite-order',
      label: 'Composite',
      kind: 'technique',
      title: 'Order composite keys: equality, then sort',
      body: [
        "Now the page filters and sorts: `WHERE email = ? AND status = 'paid' ORDER BY created_at DESC LIMIT 20`.",
        'A **composite index** on `(email, status, created_at)` groups all matching `email` + `status` entries together, already pre-sorted by `created_at`. The engine stops after reading the top 20 entries—zero sorting needed.',
      ],
      changes: [
        {
          type: 'changed',
          text: 'Index upgraded to (email, status, created_at)',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'btree-idx',
          patch: {
            sublabel: '(email, status, ts)',
            badge: 'pre-sorted',
          },
        },
        {
          op: 'packet',
          edge: 'api-btree',
          kind: 'request',
          label: 'LIMIT 20',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'btree-heap',
          kind: 'request',
          label: '20 ptrs',
          wave: 1,
        },
        { op: 'set-metric', id: 'rows-scanned', value: '20', tone: 'good' },
        { op: 'set-metric', id: 'query-ms', value: '3 ms', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'leftmost-trap',
      label: 'Key order',
      kind: 'case',
      title: 'Skipping the leading column breaks the index',
      body: [
        'Because the B-tree sorts first by `email`, then `status`, then `created_at`, imagine a phonebook sorted by `(last_name, first_name)`.',
        "A support query filtering only `WHERE status = 'paid'` without `email` cannot jump into the tree—matching rows sit scattered under millions of emails, forcing a slow scan again!",
      ],
      ops: [
        {
          op: 'update-node',
          id: 'btree-idx',
          patch: { state: 'dim', badge: 'skipped!' },
        },
        {
          op: 'update-node',
          id: 'orders-heap',
          patch: { state: 'hot', load: 0.9 },
        },
        {
          op: 'add-note',
          note: {
            id: 'prefix-note',
            anchor: { node: 'btree-idx' },
            text: 'No email → leftmost prefix miss',
            tone: 'bad',
            icon: 'warning',
          },
        },
        {
          op: 'set-metric',
          id: 'rows-scanned',
          value: '50,000,000',
          tone: 'bad',
        },
        { op: 'set-metric', id: 'query-ms', value: '3,900 ms', tone: 'bad' },
      ],
      learns: [2],
    },
    {
      id: 'heap-hops',
      label: 'Heap reads',
      kind: 'case',
      title: 'Fetching columns from the heap still costs I/O',
      body: [
        'Back on our normal `email` query, suppose a wholesale buyer has **80,000 paid orders**. The index finds their pointers fast, but `total` only lives in the table heap.',
        'Jumping across 80,000 scattered heap pages turns a fast index lookup into **380 ms** of random disk reads.',
      ],
      ops: [
        { op: 'remove-note', id: 'prefix-note' },
        {
          op: 'update-node',
          id: 'btree-idx',
          patch: { state: 'normal', badge: '80k hits' },
        },
        {
          op: 'update-node',
          id: 'orders-heap',
          patch: { state: 'hot', load: 0.85 },
        },
        {
          op: 'packet',
          edge: 'btree-heap',
          kind: 'request',
          count: 4,
          label: '80k heap hops',
          wave: 0,
        },
        { op: 'set-metric', id: 'rows-scanned', value: '80,000', tone: 'bad' },
        { op: 'set-metric', id: 'query-ms', value: '380 ms', tone: 'bad' },
      ],
    },
    {
      id: 'covering-index',
      label: 'Covering',
      kind: 'technique',
      title: 'A covering index answers straight from the leaf',
      body: [
        'Append `total` as an included column: `(email, status, created_at) INCLUDE (total)`. Because every column in the `SELECT` now lives inside the index leaf, it is a **covering index**.',
        'The planner runs an **index-only scan**: zero random trips to `Orders table`, dropping latency to **6 ms**.',
      ],
      changes: [
        { type: 'changed', text: 'Covering index via INCLUDE (total)' },
        { type: 'changed', text: 'Heap trips eliminated (index-only scan)' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'btree-idx',
          patch: {
            state: 'focus',
            sublabel: '+ INCLUDE (total)',
            badge: 'covering',
          },
        },
        {
          op: 'update-node',
          id: 'orders-heap',
          patch: { state: 'dim', load: 0.1 },
        },
        {
          op: 'update-edge',
          id: 'btree-heap',
          patch: { style: 'dashed', state: 'dim', label: '0 heap reads' },
        },
        {
          op: 'packet',
          edge: 'api-btree',
          kind: 'request',
          label: 'index-only',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'api-btree',
          kind: 'response',
          reverse: true,
          label: '6 ms',
          wave: 1,
        },
        {
          op: 'set-metric',
          id: 'rows-scanned',
          value: '20 (idx)',
          tone: 'good',
        },
        { op: 'set-metric', id: 'query-ms', value: '6 ms', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'write-overhead',
      label: 'Write cost',
      kind: 'watch-out',
      title: 'Every extra index slows inserts and fills RAM',
      body: [
        'Indexes are not free. Every `INSERT`, `DELETE`, or indexed `UPDATE` must update the heap **plus every B-tree** on that table—keeping tree pages dirty in memory and competing for buffer-pool RAM.',
        'Five indexes turn one row write into **6× write work**. Index for real queries, and audit and drop unused indexes.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Over-indexing cripples write throughput and wastes memory; every index slows every write.',
        },
      ],
      changes: [
        { type: 'added', text: 'Four additional table indexes slowing writes' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'orders-heap',
          patch: { state: 'normal', load: 0.5 },
        },
        {
          op: 'update-node',
          id: 'btree-idx',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-node',
          node: {
            id: 'extra-idx',
            kind: 'search',
            at: { x: 6, y: 6 },
            label: '4 more indexes',
            sublabel: 'Write amp',
            state: 'hot',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'heap-extra',
            from: 'orders-heap',
            to: 'extra-idx',
            label: 'update idx',
            style: 'dashed',
          },
        },
        {
          op: 'update-edge',
          id: 'btree-heap',
          patch: { style: 'dashed', state: 'normal', label: 'update idx' },
        },
        {
          op: 'packet',
          edge: 'btree-heap',
          kind: 'write',
          reverse: true,
          wave: 0,
        },
        { op: 'packet', edge: 'heap-extra', kind: 'write', count: 3, wave: 0 },
        { op: 'set-metric', id: 'write-cost', value: '6x writes', tone: 'bad' },
      ],
      learns: [3],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Design minimal indexes for exact query shapes',
      body: [
        'An index trades extra storage and write work to turn O(N) disk scans into O(log N) B-tree lookups. Order composite columns carefully, cover hot queries when needed, and prune unused indexes.',
      ],
      ops: [
        { op: 'update-node', id: 'extra-idx', patch: { state: 'normal' } },
        {
          op: 'add-note',
          note: {
            id: 'index-table',
            anchor: { at: { x: 11, y: 8 } },
            text: '50M-row query trade-offs',
            tone: 'info',
            icon: 'search',
            rows: [
              ['No index', '50M rows · 4.2 s'],
              ['B-tree (email)', '12 rows · 4 ms'],
              ['Covering leaf', '0 heap reads · 6 ms'],
            ],
            total: ['Trade-off', 'Slower writes + RAM'],
          },
        },
        { op: 'set-metric', id: 'write-cost', value: '2x–3x', tone: 'normal' },
      ],
      takeaways: [
        'Full table scans read every page (O(N)); B-tree indexes find rows in ~3–4 page hops (O(log N))',
        'In composite indexes, put equality columns first, then range or ORDER BY columns (leftmost prefix rule)',
        'A covering index includes selected columns in the leaf so queries skip random heap reads',
        'Every index multiplies write amplification and consumes RAM—drop indexes nobody queries',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-composite-order',
      kind: 'choice',
      prompt:
        "Which composite index best serves `SELECT id, total FROM orders WHERE customer_id = ? AND status = 'paid' ORDER BY created_at DESC LIMIT 20` with zero heap reads?",
      options: [
        '(customer_id, status, created_at) INCLUDE (total)',
        '(created_at, status, customer_id)',
        '(status, total, created_at)',
      ],
      answer: 0,
      explain:
        'Equality filters (customer_id, status) lead the composite key so entries are contiguous, created_at pre-sorts them, and INCLUDE (total) makes it covering.',
      step: 'covering-index',
    },
    {
      id: 'choice-leftmost-prefix',
      kind: 'choice',
      prompt:
        "A table has one index on `(email, status, created_at)`. Why does `WHERE status = 'paid'` still scan the table?",
      options: [
        'The index is sorted primarily by email, so matching statuses are scattered across all emails',
        'B-trees cannot index string columns like status',
        'SQL planners ignore indexes whenever LIMIT is omitted',
      ],
      answer: 0,
      explain:
        'The leftmost prefix rule means skipping the leading column (email) prevents narrowing the sorted B-tree range.',
      step: 'leftmost-trap',
    },
    {
      id: 'numeric-btree-capacity',
      kind: 'numeric',
      prompt:
        'Suppose a 3-level B-tree has a branching factor (fanout) of 500 pointers per page (500^3). Roughly how many million rows can just 3 tree levels index?',
      unit: 'million rows',
      answer: 125,
      tolerance: 0.05,
      explain:
        '500 × 500 × 500 = 125,000,000 rows (125 million) in only 3 hops.',
      step: 'btree-lookup',
    },
    {
      id: 'order-scan-cost',
      kind: 'order',
      prompt:
        'Order these access plans for reading 500 rows for one heavy user from fastest to slowest.',
      items: [
        'Covering index-only scan (zero table heap fetches)',
        'B-tree index lookup plus 500 random table heap page fetches',
        'Full sequential scan across all 50 million heap rows',
      ],
      explain:
        'An index-only scan reads sequential leaf entries; index + heap pays random page fetches; full scan reads the entire table.',
      step: 'heap-hops',
    },
  ],
  cards: [
    {
      front:
        'Why are B-tree indexes so shallow even for tens of millions of rows?',
      back: 'High branching factor (~500 keys per 8 KB page) means 3–4 tree levels cover hundreds of millions to billions of rows in O(log N) hops.',
    },
    {
      front:
        'What is the rule of thumb for ordering columns in a composite B-tree index?',
      back: 'Equality columns first (most selective/common leading filter), then range or ORDER BY columns (leftmost prefix rule).',
    },
    {
      front: 'What makes an index a "covering index", and when does it shine?',
      back: 'It stores all columns needed by SELECT inside the index leaf (via key or INCLUDE), enabling an index-only scan with zero random table heap lookups.',
    },
    {
      front: 'What is the hidden cost of adding many indexes to a table?',
      back: 'Every INSERT, DELETE, and indexed UPDATE must update every affected B-tree, increasing write amplification, disk space, and RAM buffer-pool pressure.',
    },
  ],
} satisfies Lesson;
