import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 03.05: Sharding (`sharding`).
 * Scenario: A marketplace's order writes outgrow one machine (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'sharding',
  learn: [
    'Why write-heavy growth forces horizontal sharding',
    'How range and hash partitioning split keys cleanly',
    'Why bad shard keys cause hot spots and scatter queries',
    'How resharding moves data without full downtime',
  ],
  scene: {
    nodes: [
      {
        id: 'checkout',
        kind: 'service',
        at: { x: 0, y: 5 },
        label: 'Order API',
        sublabel: '45k writes/s',
      },
      {
        id: 'shard-1',
        kind: 'database',
        at: { x: 9, y: 4 },
        label: 'Orders DB',
        sublabel: '12 TB · 100% writes',
        load: 0.98,
        state: 'hot',
      },
    ],
    edges: [
      {
        id: 'api-s1',
        from: 'checkout',
        to: 'shard-1',
        label: '45k writes/s',
      },
    ],
    zones: [
      {
        id: 'shard-zone',
        from: { x: 6, y: 0 },
        to: { x: 13, y: 8 },
        hue: 'violet',
        label: 'Shard cluster',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'write-rps', label: 'Write RPS', icon: 'bolt', value: '45,000' },
    { id: 'shards', label: 'Shards', icon: 'database', value: '1' },
    { id: 'p99', label: 'Write p99', icon: 'timer', value: '650 ms' },
  ],
  steps: [
    {
      id: 'write-wall',
      label: 'Write wall',
      kind: 'problem',
      title: '45,000 order writes/s saturate one leader',
      body: [
        'Your marketplace processes **45,000 order writes/s** and **12 TB** of active history. Read replicas cannot help here: every replica still has to apply all 45,000 writes.',
        'To scale writes and storage past one machine, you must **shard** (_horizontally partition_) rows across multiple independent primaries.',
      ],
      ops: [
        {
          op: 'packet',
          edge: 'api-s1',
          kind: 'write',
          count: 4,
          label: '98% saturated',
          wave: 0,
        },
        { op: 'set-metric', id: 'p99', value: '650 ms', tone: 'bad' },
      ],
      learns: [0],
    },
    {
      id: 'range-partitioning',
      label: 'Range split',
      kind: 'technique',
      title: 'Range partitioning splits ordered key spans',
      body: [
        'Put a **Shard router** in front of three shards split by **date range** (`Jan–Apr`, `May–Aug`, `Sep–Dec`). Ordered spans make date-range scans (`SELECT ... WHERE created_at BETWEEN ...`) touch just one shard.',
        'The snag: _all_ of today’s live orders fall into `Sep–Dec`, leaving Shards 1 and 2 idle while **Shard 3** still melts!',
      ],
      changes: [
        { type: 'added', text: 'Shard router and 3 range-partitioned shards' },
      ],
      ops: [
        { op: 'remove-edge', id: 'api-s1' },
        {
          op: 'add-node',
          node: {
            id: 'router',
            kind: 'load-balancer',
            at: { x: 4, y: 4 },
            label: 'Shard router',
            sublabel: 'Key → shard',
            state: 'focus',
          },
        },
        {
          op: 'update-node',
          id: 'shard-1',
          patch: {
            at: { x: 9, y: 1 },
            label: 'Shard 1',
            sublabel: 'Jan–Apr',
            load: 0.05,
            state: 'normal',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'shard-2',
            kind: 'database',
            at: { x: 9, y: 4 },
            label: 'Shard 2',
            sublabel: 'May–Aug',
            load: 0.05,
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'shard-3',
            kind: 'database',
            at: { x: 9, y: 7 },
            label: 'Shard 3',
            sublabel: 'Sep–Dec (today)',
            load: 0.96,
            state: 'hot',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'api-router', from: 'checkout', to: 'router' },
        },
        { op: 'add-edge', edge: { id: 'r-s1', from: 'router', to: 'shard-1' } },
        { op: 'add-edge', edge: { id: 'r-s2', from: 'router', to: 'shard-2' } },
        { op: 'add-edge', edge: { id: 'r-s3', from: 'router', to: 'shard-3' } },
        {
          op: 'packet',
          edge: 'r-s3',
          kind: 'write',
          count: 4,
          label: 'all today',
          wave: 0,
        },
        { op: 'set-metric', id: 'shards', value: '3' },
      ],
      learns: [1],
    },
    {
      id: 'hash-partitioning',
      label: 'Hash split',
      kind: 'technique',
      title: 'Hash partitioning spreads writes evenly',
      body: [
        'Switch to **hash partitioning**: compute `hash(order_id) % 3` to pick the shard. Even sequential IDs scramble uniformly across all three machines.',
        'Each shard now handles **15,000 writes/s** (`33%` load), dropping write `p99` from `650 ms` to **14 ms**—trading away fast cross-range scans.',
      ],
      changes: [
        { type: 'changed', text: 'Routing switched to hash(order_id) % 3' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'shard-1',
          patch: { sublabel: 'Hash 0 · 15k/s', load: 0.33 },
        },
        {
          op: 'update-node',
          id: 'shard-2',
          patch: { sublabel: 'Hash 1 · 15k/s', load: 0.33 },
        },
        {
          op: 'update-node',
          id: 'shard-3',
          patch: { sublabel: 'Hash 2 · 15k/s', load: 0.34, state: 'normal' },
        },
        { op: 'packet', edge: 'r-s1', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'r-s2', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'r-s3', kind: 'write', wave: 0 },
        { op: 'set-metric', id: 'p99', value: '14 ms', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'flash-sale',
      label: 'Hot partition',
      kind: 'case',
      title: 'A flash-sale seller creates a hot partition',
      body: [
        'Suppose instead you sharded by `seller_id` so each merchant’s dashboard lives on one shard. Then a viral brand drops limited sneakers: **30,000 orders/s** carry the _same_ `seller_id`.',
        'Even with hashing, identical keys always land on **Shard 2**, pushing it to **99% load** while Shards 1 and 3 sit quiet.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'shard-1',
          patch: { load: 0.15 },
        },
        {
          op: 'update-node',
          id: 'shard-2',
          patch: {
            state: 'hot',
            load: 0.99,
            badge: 'hot seller!',
          },
        },
        {
          op: 'update-node',
          id: 'shard-3',
          patch: { load: 0.15 },
        },
        {
          op: 'packet',
          edge: 'r-s2',
          kind: 'write',
          count: 4,
          label: '30k/s one key',
          wave: 0,
        },
        { op: 'set-metric', id: 'p99', value: '480 ms', tone: 'bad' },
      ],
      learns: [2],
    },
    {
      id: 'key-design',
      label: 'Shard keys',
      kind: 'technique',
      title: 'Pick high-cardinality or salted shard keys',
      body: [
        'A good shard key has **high cardinality** (millions of values), **even distribution**, and matches your hottest queries. Using `order_id` spreads flash-sale orders evenly.',
        'If you must group by `seller_id`, add a **write salt** (`seller_id#0..9`) for hot merchants—splitting one hot key across 10 buckets at the cost of merging 10 reads on their dashboard.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Key design rule: pick a key that spreads heavy writes evenly while keeping your top read queries on one shard.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'shard-2',
          patch: { state: 'normal', load: 0.34, badge: null },
        },
        { op: 'update-node', id: 'shard-1', patch: { load: 0.33 } },
        { op: 'update-node', id: 'shard-3', patch: { load: 0.33 } },
        {
          op: 'add-note',
          note: {
            id: 'salt-note',
            anchor: { node: 'router' },
            text: 'Key: order_id or seller#0..9',
            tone: 'good',
            icon: 'key',
          },
        },
        { op: 'packet', edge: 'r-s1', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'r-s2', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'r-s3', kind: 'write', wave: 0 },
        { op: 'set-metric', id: 'p99', value: '15 ms', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'cross-shard',
      label: 'Cross-shard',
      kind: 'watch-out',
      title: 'Queries without the shard key scatter-gather',
      body: [
        'Now support searches `"all orders for buyer_42"` when orders are sharded by `order_id`. Because `order_id` is missing, `Shard router` must broadcast the query to **every shard** (**scatter-gather**).',
        'Response time equals the **slowest shard**, global joins/unique constraints break, and cross-shard transactions need sagas or 2PC.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never shard lightly: once split, cross-shard joins and scatter-gather queries multiply tail latency.',
        },
      ],
      ops: [
        { op: 'remove-note', id: 'salt-note' },
        {
          op: 'update-node',
          id: 'router',
          patch: { state: 'hot', badge: 'scatter-gather' },
        },
        { op: 'packet', edge: 'r-s1', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'r-s2', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'r-s3', kind: 'request', wave: 0 },
        { op: 'set-metric', id: 'p99', value: '120 ms', tone: 'bad' },
      ],
      learns: [2],
    },
    {
      id: 'resharding',
      label: 'Resharding',
      kind: 'technique',
      title: 'Use virtual buckets to add Shard 4 online',
      body: [
        'Traffic doubles and you need **Shard 4**. Changing `hash(key) % 3` to `% 4` forces moving ~75% of keys at once!',
        'Instead, hash keys into **1,024 fixed logical buckets** mapped to physical shards via a directory. Adding `Shard 4` streams ~25% of buckets in the background (dual-write + backfill), then flips the directory atomically.',
      ],
      changes: [
        { type: 'added', text: 'Shard 4 receiving 25% of logical buckets' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'router',
          patch: { state: 'focus', badge: '1,024 buckets' },
        },
        {
          op: 'add-node',
          node: {
            id: 'shard-4',
            kind: 'database',
            at: { x: 12, y: 3 },
            label: 'Shard 4',
            sublabel: '25% buckets',
            state: 'focus',
            load: 0.25,
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'r-s4',
            from: 'router',
            to: 'shard-4',
            route: 'elbow-y',
            label: 'backfill',
            style: 'dashed',
          },
        },
        {
          op: 'packet',
          edge: 'r-s4',
          kind: 'write',
          label: '25% move',
          wave: 0,
        },
        { op: 'set-metric', id: 'shards', value: '4' },
        { op: 'set-metric', id: 'p99', value: '14 ms', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Shard last, and choose the key carefully',
      body: [
        'Sharding unlocks linear write and storage growth, at the cost of scatter-gather queries, cross-shard transactions, and operational complexity. Pick keys that avoid hot spots and decouple logical buckets from physical nodes.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'router',
          patch: { state: 'normal', badge: null },
        },
        { op: 'update-node', id: 'shard-4', patch: { state: 'normal' } },
        {
          op: 'update-edge',
          id: 'r-s4',
          patch: { style: 'solid', label: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'shard-summary',
            anchor: { at: { x: 12.5, y: 8.5 } },
            text: 'Partitioning playbook',
            tone: 'info',
            icon: 'layers',
            rows: [
              ['Range', 'Ordered scans · hot tail'],
              ['Hash', 'Even writes · no scans'],
              ['Salted key', 'Breaks hot-tenant skew'],
              ['Logical buckets', 'Smooth online reshard'],
            ],
          },
        },
      ],
      takeaways: [
        'Shard horizontally only after tuning indexes and read replicas, when writes or disk outgrow one machine',
        'Range partitioning enables fast range scans but creates hot spots on sequential keys like timestamps',
        'Hash partitioning spreads writes evenly; choose high-cardinality keys or salt hot keys to stop skewed flash-sale traffic',
        'Queries without the shard key scatter-gather across all shards; logical buckets make resharding online and bounded',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-range-hot-tail',
      kind: 'choice',
      prompt:
        'An orders table is range-partitioned by `created_at` month across 12 shards. Why does Shard 12 run at 95% CPU while Shards 1–11 sit mostly idle?',
      options: [
        'All new order inserts carry today’s timestamp and route exclusively to the latest range shard',
        'Range partitioning always replicates every write to all 12 shards',
        'Older shards automatically shut down after 30 days',
      ],
      answer: 0,
      explain:
        'Monotonically increasing keys like timestamps always land in the newest range, creating a write hot spot on the tail shard.',
      step: 'range-partitioning',
    },
    {
      id: 'choice-hot-seller-salt',
      kind: 'choice',
      prompt:
        'A marketplace shards by `seller_id`, and one flash-sale merchant sends 30,000 orders/sec to a single shard. What fixes this hot partition while still keeping merchant queries bounded?',
      options: [
        'Salt the hot key (e.g. `seller_id#0..9`) across 10 logical buckets and merge those 10 slices on read',
        'Add more read replicas to a different unrelated database',
        'Disable hashing and revert to a single unsharded primary',
      ],
      answer: 0,
      explain:
        'Appending a bounded salt (0..9) distributes the hot seller’s writes across shards while limiting reads for that seller to 10 known buckets instead of the whole cluster.',
      step: 'key-design',
    },
    {
      id: 'choice-scatter-gather',
      kind: 'choice',
      prompt:
        'Orders are hash-sharded by `order_id`. What happens when a query searches `WHERE buyer_id = 42` without supplying `order_id`?',
      options: [
        'The router must scatter-gather the query across every shard and wait for the slowest shard to respond',
        'The router automatically computes `order_id` from `buyer_id` in O(1)',
        'Only Shard 1 stores buyer IDs, so other shards are skipped',
      ],
      answer: 0,
      explain:
        'Without the shard key, the router does not know which shards hold matching rows and must query all shards in parallel.',
      step: 'cross-shard',
    },
    {
      id: 'numeric-bucket-reshard',
      kind: 'numeric',
      prompt:
        'A cluster uses 1,000 logical buckets spread evenly across 4 shards (250 buckets each). When adding a 5th shard to balance at 200 buckets per shard, how many total buckets must move to the new 5th shard?',
      unit: 'buckets',
      answer: 200,
      tolerance: 0.05,
      explain:
        'Each of the 4 existing shards donates 50 buckets (250 → 200), moving 200 buckets (20% of total) cleanly onto Shard 5.',
      step: 'resharding',
    },
    {
      id: 'order-online-reshard',
      kind: 'order',
      prompt:
        'Order the phases of adding a new shard online with zero downtime.',
      items: [
        'Provision Shard 4 and dual-write new mutations for migrating buckets',
        'Backfill historical rows for those buckets onto Shard 4 in the background',
        'Flip the shard directory routing to Shard 4 and prune old bucket copies',
      ],
      explain:
        'Dual-writing new changes first, then backfilling history, ensures Shard 4 is completely caught up before cutting over reads and writes.',
      step: 'resharding',
    },
  ],
  cards: [
    {
      front: 'Compare range vs hash partitioning.',
      back: '• Range: keeps keys sorted for range queries, but sequential keys (timestamps) create hot spots\n• Hash: scrambles keys evenly across shards, but loses ordered range scans',
    },
    {
      front: 'What makes a good shard key, and how do you handle a hot tenant?',
      back: 'High cardinality, even write spread, and present in top read queries. For skewed tenants, add a bounded salt (e.g. `tenant#0..9`) to fan writes across shards.',
    },
    {
      front: 'What is a scatter-gather query in a sharded database?',
      back: 'A query lacking the shard key that must be broadcast to every shard and merged, making tail latency equal to the slowest shard.',
    },
    {
      front:
        'Why use fixed logical buckets instead of raw `hash(key) % N` for resharding?',
      back: 'Changing N in `% N` remaps almost every key; mapping keys to fixed logical buckets lets you migrate only `~1/N` buckets when adding a shard.',
    },
  ],
} satisfies Lesson;
