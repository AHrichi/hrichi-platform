import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 03.01: SQL vs NoSQL (`sql-vs-nosql`).
 * Scenario: Orders vs activity events (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'sql-vs-nosql',
  learn: [
    'How relational tables and ACID protect critical writes',
    'When document and key-value stores beat rigid tables',
    'Why wide-column stores excel at sorted event timelines',
    'When graph engines outshine SQL for multi-hop links',
    'How access patterns drive polyglot persistence',
  ],
  scene: {
    nodes: [
      {
        id: 'checkout',
        kind: 'service',
        at: { x: 1, y: 3 },
        label: 'Checkout API',
        sublabel: 'Orders & cart',
      },
      {
        id: 'analytics',
        kind: 'service',
        at: { x: 1, y: 7 },
        label: 'Activity API',
        sublabel: '50k events/s',
      },
      {
        id: 'orders-db',
        kind: 'database',
        at: { x: 6, y: 1 },
        label: 'Orders DB',
        sublabel: 'PostgreSQL',
        load: 0.92,
        state: 'hot',
      },
    ],
    edges: [
      {
        id: 'checkout-orders',
        from: 'checkout',
        to: 'orders-db',
        label: 'SQL tx',
        route: 'elbow-x',
      },
      {
        id: 'analytics-orders',
        from: 'analytics',
        to: 'orders-db',
        label: '50k inserts/s',
        route: 'elbow-x',
      },
    ],
    zones: [
      {
        id: 'data-zone',
        from: { x: 4, y: 0 },
        to: { x: 12, y: 9 },
        hue: 'violet',
        label: 'Data tier',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'engines', label: 'Engines', icon: 'layers', value: '1 SQL' },
    { id: 'order-p99', label: 'Order p99', icon: 'timer', value: '620 ms' },
    { id: 'fit', label: 'Pattern fit', icon: 'warning', value: 'Strained' },
  ],
  steps: [
    {
      id: 'one-db-strain',
      label: 'One database',
      kind: 'problem',
      title: 'Orders and click events collide in one DB',
      body: [
        'Your storefront runs **orders and payments** alongside **50,000 click events per second** inside a single relational database.',
        'Every click write acquires page locks and flushes indexes, stalling checkouts at **620 ms**. Can one data model fit strict money ledgers, messy product attributes, carts, logs, and recommendations?',
      ],
      ops: [
        { op: 'packet', edge: 'checkout-orders', kind: 'write', wave: 0 },
        {
          op: 'packet',
          edge: 'analytics-orders',
          kind: 'write',
          count: 4,
          label: '50k/s flood',
          wave: 0,
        },
        { op: 'set-metric', id: 'order-p99', value: '620 ms', tone: 'bad' },
      ],
    },
    {
      id: 'relational-acid',
      label: 'Relational',
      kind: 'technique',
      title: 'Relational tables and ACID guard orders',
      body: [
        '**Relational databases** store normalised rows across linked tables with strict schemas and joins. For orders, **ACID** transactions (_Atomicity, Consistency, Isolation, Durability_) ensure inventory deduction and payment capture either both commit or both roll back.',
        'Keep financial and relational records in SQL where correctness and ad-hoc queries matter most.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Use relational SQL whenever multi-row transactions, foreign keys, and ad-hoc SQL joins protect business truth.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'focus', badge: 'ACID ledger' },
        },
        {
          op: 'packet',
          edge: 'checkout-orders',
          kind: 'write',
          label: 'BEGIN..COMMIT',
          wave: 0,
        },
      ],
      learns: [0],
    },
    {
      id: 'document-store',
      label: 'Document',
      kind: 'technique',
      title: 'Document stores hold flexible aggregates',
      body: [
        'Product specs differ wildly: shoes have sizes; laptops have CPU and RAM. A **document store** keeps each product as a nested JSON-like _document_ indexed by `product_id`.',
        'You fetch a whole product aggregate in one read without multi-table joins, and new fields ship without `ALTER TABLE` migrations.',
      ],
      changes: [
        { type: 'added', text: 'Document store for product catalogue JSON' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-node',
          node: {
            id: 'catalog-doc',
            kind: 'storage',
            at: { x: 11, y: 1 },
            label: 'Catalog DB',
            sublabel: 'Document JSON',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'checkout-catalog',
            from: 'checkout',
            to: 'catalog-doc',
            label: 'get by id',
            route: 'elbow-y',
          },
        },
        {
          op: 'packet',
          edge: 'checkout-catalog',
          kind: 'request',
          label: 'sku_92',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'checkout-catalog',
          kind: 'response',
          reverse: true,
          label: 'JSON doc',
          wave: 1,
        },
        { op: 'set-metric', id: 'engines', value: '2 (SQL+Doc)' },
      ],
      learns: [1],
    },
    {
      id: 'key-value',
      label: 'Key-value',
      kind: 'technique',
      title: 'Key-value stores serve carts in under 1 ms',
      body: [
        'A shopper’s **cart** and login session only need lookups by `session_id`—never range scans or joins. A **key-value store** treats each value as an opaque blob keyed in memory.',
        'Hash-table lookups deliver **sub-millisecond** reads and writes, keeping fast-changing cart state off the relational primary.',
      ],
      changes: [
        { type: 'added', text: 'Key-value store for carts and sessions' },
      ],
      ops: [
        { op: 'update-node', id: 'catalog-doc', patch: { state: 'normal' } },
        {
          op: 'add-node',
          node: {
            id: 'cart-kv',
            kind: 'cache',
            at: { x: 4, y: 3 },
            label: 'Cart KV',
            sublabel: 'Key-value · <1 ms',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'checkout-kv',
            from: 'checkout',
            to: 'cart-kv',
            label: 'GET/SET key',
          },
        },
        {
          op: 'packet',
          edge: 'checkout-kv',
          kind: 'request',
          label: 'cart:u42',
          wave: 0,
        },
        { op: 'set-metric', id: 'engines', value: '3 engines' },
      ],
      learns: [1],
    },
    {
      id: 'wide-column',
      label: 'Wide-column',
      kind: 'technique',
      title: 'Wide-column stores absorb event streams',
      body: [
        'Now move the **50,000/s** click events off `Orders DB` into a **wide-column store** (like Cassandra or Bigtable). Rows group by a _partition key_ (`user_id`) and stay sorted on disk by a _clustering key_ (`timestamp`).',
        'Append-only writes scale horizontally across nodes, and reading one user’s last hour of clicks is one sequential slice.',
      ],
      changes: [
        { type: 'added', text: 'Wide-column store for time-ordered events' },
        { type: 'removed', text: 'Clickstream writes from Orders DB' },
      ],
      ops: [
        { op: 'update-node', id: 'cart-kv', patch: { state: 'normal' } },
        { op: 'remove-edge', id: 'analytics-orders' },
        {
          op: 'add-node',
          node: {
            id: 'events-wc',
            kind: 'database',
            at: { x: 8, y: 6 },
            label: 'Events DB',
            sublabel: 'Wide-column',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'analytics-wc',
            from: 'analytics',
            to: 'events-wc',
            label: '(user_id, ts)',
            route: 'elbow-y',
          },
        },
        {
          op: 'packet',
          edge: 'analytics-wc',
          kind: 'write',
          count: 4,
          label: '50k/s',
          wave: 0,
        },
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'normal', load: 0.3 },
        },
        { op: 'set-metric', id: 'engines', value: '4 engines' },
        { op: 'set-metric', id: 'order-p99', value: '14 ms', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'graph-db',
      label: 'Graph',
      kind: 'technique',
      title: 'Graph databases traverse links in hops',
      body: [
        'Recommendations ask: _"What did buyers who bought item X also buy within three hops?"_ In SQL, three self-joins explode in cost as the table grows.',
        'A **graph database** stores nodes (`User`, `Item`) and directed edges (`BOUGHT`) with direct pointers, traversing multi-hop neighbours in milliseconds.',
      ],
      changes: [
        { type: 'added', text: 'Graph store for buyer-item relationships' },
      ],
      ops: [
        { op: 'update-node', id: 'events-wc', patch: { state: 'normal' } },
        {
          op: 'add-node',
          node: {
            id: 'recs-graph',
            kind: 'search',
            at: { x: 11, y: 8 },
            label: 'Recs Graph',
            sublabel: 'Nodes + edges',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'analytics-graph',
            from: 'analytics',
            to: 'recs-graph',
            label: '3-hop query',
          },
        },
        {
          op: 'packet',
          edge: 'analytics-graph',
          kind: 'request',
          label: 'MATCH (u)-[..3]',
          wave: 0,
        },
        { op: 'set-metric', id: 'engines', value: '5 engines' },
        { op: 'set-metric', id: 'fit', value: 'Matched', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'access-patterns',
      label: 'Access first',
      kind: 'case',
      title: 'Workload spikes prove why access patterns win',
      body: [
        'During a flash sale, clicks surge to **120,000 events/s** while checkout traffic triples. Because every store serves only its natural **access pattern**, `Orders DB` stays calm at **16 ms** p99.',
        'Running specialised engines side by side is called **polyglot persistence**—let read/write shapes pick the database, not hype.',
      ],
      ops: [
        { op: 'update-node', id: 'recs-graph', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'events-wc',
          patch: { state: 'focus', badge: '120k/s burst' },
        },
        {
          op: 'packet',
          edge: 'checkout-orders',
          kind: 'write',
          label: '16 ms',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'analytics-wc',
          kind: 'write',
          count: 5,
          label: '120k/s',
          wave: 0,
        },
        { op: 'set-metric', id: 'order-p99', value: '16 ms', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'nosql-pitfall',
      label: 'Watch out',
      kind: 'watch-out',
      title: 'Do not buy NoSQL for ad-hoc query flexibility',
      body: [
        'NoSQL trades away SQL’s swiss-army knife. Wide-column tables must be designed **per query**—filtering by a non-key column forces a cluster scan. Document stores struggle with multi-document joins, and dense graphs do not shard cleanly.',
        'Each extra engine adds backups, monitoring, and sync pipelines, so start with **one relational DB** until a real bottleneck demands splitting.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Every extra database brings new operations and data-sync overhead. Add a second engine only when access patterns outgrow SQL.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'events-wc',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'ops-tax-note',
            anchor: { node: 'events-wc' },
            text: 'No ad-hoc WHERE without key',
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
      title: 'Match each data model to its access pattern',
      body: [
        'SQL vs NoSQL is not a popularity contest: let transaction rules, key-lookup shapes, write rates, and graph hops choose the smallest set of stores your system actually needs.',
      ],
      ops: [
        { op: 'remove-note', id: 'ops-tax-note' },
        {
          op: 'add-note',
          note: {
            id: 'polyglot-summary',
            anchor: { at: { x: 5.5, y: 8.5 } },
            text: 'Workload -> Engine',
            tone: 'info',
            icon: 'layers',
            rows: [
              ['Orders (ACID)', 'Relational SQL'],
              ['Catalog JSON', 'Document'],
              ['Carts (<1 ms)', 'Key-value'],
              ['50k/s events', 'Wide-column'],
              ['3-hop recs', 'Graph'],
            ],
          },
        },
      ],
      takeaways: [
        'Use relational SQL for multi-row ACID transactions, foreign keys, and ad-hoc queries',
        'Use document stores for self-contained aggregates with evolving fields, and key-value for sub-ms key lookups',
        'Use wide-column stores for high-volume, time-ordered writes keyed by partition + clustering keys',
        'Use graph databases for multi-hop traversals; adopt polyglot persistence only as real bottlenecks appear',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-orders-vs-events',
      kind: 'choice',
      prompt:
        'A system processes strict double-entry payment transfers alongside 80,000 append-only user click events per second. Which pairing matches each access pattern?',
      options: [
        'Relational SQL for payments; wide-column store partitioned by (user_id, timestamp) for clicks',
        'Key-value cache for payments; graph database for click events',
        'Wide-column store for payments; single unsharded SQL table for clicks',
      ],
      answer: 0,
      explain:
        'Payments need multi-row ACID transactions (SQL), while high-volume time-ordered click streams match wide-column partition + clustering keys.',
      step: 'wide-column',
    },
    {
      id: 'choice-graph-fit',
      kind: 'choice',
      prompt:
        'Which query most strongly favours a graph database over a standard relational or key-value store?',
      options: [
        'Finding products connected within 3–4 purchase hops from a given user',
        'Looking up a user shopping cart by session_id',
        'Recording immutable sensor readings sorted by timestamp',
      ],
      answer: 0,
      explain:
        'Graph databases store explicit edge pointers so multi-hop traversals avoid costly repeated SQL joins.',
      step: 'graph-db',
    },
    {
      id: 'choice-polyglot-watchout',
      kind: 'choice',
      prompt:
        'Why should a small team usually start with a relational database rather than adopting five engines on day one?',
      options: [
        'Each additional database adds operational overhead, backup complexity, and cross-store consistency work',
        'Relational databases cannot store JSON or indexed timestamps',
        'NoSQL databases forbid running on cloud virtual machines',
      ],
      answer: 0,
      explain:
        'Polyglot persistence pays off when a single store hits real scaling or modelling limits; prematurely splitting adds operational cost.',
      step: 'nosql-pitfall',
    },
    {
      id: 'order-access-match',
      kind: 'order',
      prompt:
        'Order these database families from strictest tabular schema and multi-row ACID to pointer-based multi-hop traversal.',
      items: [
        'Relational (normalised tables, foreign keys, ACID joins)',
        'Document (nested JSON aggregates fetched by id)',
        'Wide-column (partition key + sorted clustering columns)',
        'Graph (nodes and edges with direct neighbour pointers)',
      ],
      explain:
        'Relational enforces normalised tables and cross-table joins; Document nests aggregates; Wide-column sorts rows per partition key; Graph follows node-edge pointers.',
      step: 'access-patterns',
    },
    {
      id: 'numeric-event-bandwidth',
      kind: 'numeric',
      prompt:
        'An Activity API sends 50,000 click events per second to a wide-column store, with each event averaging 500 bytes. How many megabytes per second (MB/s, 10^6 bytes) does it ingest?',
      unit: 'MB/s',
      answer: 25,
      tolerance: 0.05,
      explain: '50,000 events/s × 500 B = 25,000,000 B/s = 25 MB/s.',
      step: 'wide-column',
    },
  ],
  cards: [
    {
      front: 'When is a relational (SQL) database the right default?',
      back: 'When you need strict schemas, foreign keys, ad-hoc joins, and multi-row ACID transactions (e.g. orders, payments, inventory).',
    },
    {
      front: 'Compare Document, Key-value, and Wide-column NoSQL stores.',
      back: '• Document: flexible nested JSON fetched as one aggregate\n• Key-value: opaque blob lookup by exact key in <1 ms\n• Wide-column: massive write throughput with rows sorted by clustering key inside each partition',
    },
    {
      front: 'What is a Graph database strong and weak at?',
      back: 'Strong at multi-hop relationship queries (friends-of-friends, recommendations, fraud rings); weak at bulk analytics and sharding dense graphs.',
    },
    {
      front: 'What is polyglot persistence, and what is its main trade-off?',
      back: 'Using different database families for different workloads in one product; it gives optimal performance per access pattern at the cost of extra operational and data-sync complexity.',
    },
  ],
} satisfies Lesson;
