import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 02.04: Caching (`caching`).
 * Scenario: A product page hammering the database (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'caching',
  learn: [
    'How cache-aside serves hot reads from fast RAM',
    'How hit-ratio maths cuts DB load and average latency',
    'How TTLs and write invalidation limit stale data',
    'Write-through vs write-back and LRU eviction trade-offs',
    'How request coalescing and jitter stop cache stampedes',
  ],
  scene: {
    nodes: [
      {
        id: 'shoppers',
        kind: 'user',
        at: { x: 1, y: 4 },
        label: 'Shoppers',
        sublabel: '5,000 RPS',
      },
      {
        id: 'api',
        kind: 'server',
        at: { x: 5, y: 4 },
        label: 'Product API',
        sublabel: 'Stateless',
      },
      {
        id: 'db',
        kind: 'database',
        at: { x: 11, y: 4 },
        label: 'Catalog DB',
        sublabel: 'Postgres · 20 ms',
        state: 'hot',
        load: 0.96,
        badge: '5,000 QPS',
      },
    ],
    edges: [
      {
        id: 'shoppers-api',
        from: 'shoppers',
        to: 'api',
        label: 'GET /item/99',
      },
      { id: 'api-db', from: 'api', to: 'db', label: 'SELECT' },
    ],
    zones: [
      {
        id: 'backend-zone',
        from: { x: 4, y: 1 },
        to: { x: 12, y: 7 },
        hue: 'blue',
        label: 'Backend tier',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'hit-ratio', label: 'Hit ratio', icon: 'bolt', value: '0%' },
    { id: 'db-load', label: 'DB load', icon: 'database', value: '100%' },
    { id: 'p50', label: 'p50', icon: 'timer', value: '20 ms' },
  ],
  steps: [
    {
      id: 'db-hammered',
      label: 'DB hammered',
      kind: 'problem',
      title: '5,000 reads a second for one product row',
      body: [
        'A flash sale drives **5,000 RPS** to your bestselling product page `/item/99`. Its title and price barely ever change, yet the **Product API** runs the exact same **20 ms** SQL query five thousand times every second.',
        '**Catalog DB** burns 96% CPU answering identical reads.',
      ],
      ops: [
        {
          op: 'packet',
          edge: 'shoppers-api',
          kind: 'request',
          count: 3,
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'request',
          count: 4,
          label: '5,000 QPS',
          wave: 1,
        },
        { op: 'set-metric', id: 'db-load', value: '96%', tone: 'bad' },
      ],
    },
    {
      id: 'cache-aside',
      label: 'Cache-aside',
      kind: 'technique',
      title: 'Check fast RAM before querying the database',
      body: [
        'Place an in-memory **Cache** (like Redis or Memcached, `~1 ms` read) beside the API. In **cache-aside** (_lazy loading_), the API checks the cache first.',
        'On a **miss**, it queries **Catalog DB**, writes the row into the cache, and returns it. Every later read is a **1 ms hit**.',
      ],
      changes: [{ type: 'added', text: 'In-memory Product cache (Redis)' }],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'cache',
            kind: 'cache',
            at: { x: 8, y: 2 },
            label: 'Product cache',
            sublabel: 'Redis · 1 ms',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'api-cache', from: 'api', to: 'cache', label: 'GET/SET' },
        },
        {
          op: 'packet',
          edge: 'api-cache',
          kind: 'request',
          label: 'Miss',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'request',
          label: 'SELECT',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'api-cache',
          kind: 'write',
          label: 'SET item:99',
          wave: 2,
        },
        {
          op: 'packet',
          edge: 'api-cache',
          kind: 'response',
          reverse: true,
          label: '1 ms HIT',
          wave: 3,
        },
      ],
      learns: [0],
    },
    {
      id: 'hit-ratio-math',
      label: 'Hit-ratio math',
      kind: 'technique',
      title: '90% hits cuts DB load 10×; 99% cuts it 100×',
      body: [
        'Mean read latency equals `h × t(cache) + (1 − h) × t(DB)`, where `h` is the **hit ratio**. With a `1 ms` cache and `20 ms` DB at **90% hits**, average latency drops to `0.9(1) + 0.1(20) = 2.9 ms` (`p50 = 1 ms`) and DB traffic falls **10×** to 500 QPS.',
        'Reaching **99% hits** cuts DB queries another **10×** to just **50 QPS**—each nine matters!',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Moving from 90% to 99% hits leaves only 1% of reads reaching your database—a 10× drop in DB load.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'normal', load: 0.12, badge: '500 QPS' },
        },
        {
          op: 'add-note',
          note: {
            id: 'math-note',
            anchor: { at: { x: 8, y: 7 } },
            text: '0.9×1 + 0.1×20 = 2.9 ms',
            tone: 'info',
            icon: 'chart',
          },
        },
        {
          op: 'packet',
          edge: 'api-cache',
          kind: 'request',
          count: 4,
          label: '90% hits',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'request',
          count: 1,
          label: '10% miss',
          wave: 0,
        },
        { op: 'set-metric', id: 'hit-ratio', value: '90%', tone: 'good' },
        { op: 'set-metric', id: 'db-load', value: '10%', tone: 'good' },
        { op: 'set-metric', id: 'p50', value: '1 ms', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'ttl-staleness',
      label: 'TTL & stale',
      kind: 'technique',
      title: 'Attach a TTL to bound stale reads',
      body: [
        'Cached values age as soon as the database updates. Setting a **TTL** (_Time-To-Live_, such as `60 s`) automatically expires the key so the next read pulls fresh data.',
        'Short TTLs shrink the stale window at the cost of more misses; long TTLs protect the database when brief staleness is fine.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'cache',
          patch: { badge: 'TTL 60s' },
        },
        {
          op: 'update-note',
          id: 'math-note',
          patch: { text: 'Max stale window: 60 s' },
        },
      ],
      learns: [2],
    },
    {
      id: 'write-invalidation',
      label: 'Invalidate',
      kind: 'technique',
      title: 'Delete the cached key when the row updates',
      body: [
        'When a seller cuts a jacket’s price in half, waiting 60 seconds causes checkout errors. With **invalidation on write**, the API writes **Catalog DB** first and immediately sends `DEL item:99` to evict the stale key.',
        'Deleting beats overwriting in cache-aside because concurrent writes cannot leave an older value stuck in RAM.',
      ],
      ops: [
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'write',
          label: 'UPDATE price',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'api-cache',
          kind: 'write',
          label: 'DEL item:99',
          wave: 1,
        },
        {
          op: 'update-note',
          id: 'math-note',
          patch: { text: 'Write DB → DEL cache key', tone: 'good' },
        },
      ],
      learns: [2],
    },
    {
      id: 'write-through-back',
      label: 'Write modes',
      kind: 'technique',
      title: 'Write-through stays sync; write-back batches',
      body: [
        'When writes also need caching, two patterns put the cache in the write path:',
        '• **Write-through**: every write updates cache _and_ DB synchronously—reads stay warm, writes pay both hops.\n• **Write-back**: writes return after hitting fast cache RAM and flush to DB asynchronously in batches—blazing writes, yet a cache crash loses unflushed data!',
      ],
      ops: [
        {
          op: 'add-edge',
          edge: {
            id: 'cache-db',
            from: 'cache',
            to: 'db',
            label: 'flush',
            style: 'dashed',
          },
        },
        {
          op: 'update-note',
          id: 'math-note',
          patch: { text: 'Through: sync · Back: async', tone: 'info' },
        },
        { op: 'packet', edge: 'api-cache', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'cache-db', kind: 'write', wave: 1 },
      ],
      learns: [3],
    },
    {
      id: 'lru-eviction',
      label: 'LRU eviction',
      kind: 'technique',
      title: 'Evict cold keys with LRU when RAM fills up',
      body: [
        'Memory is far smaller than disk. Once the cache fills, it must make room for new items using an **eviction policy**.',
        '**LRU** (_Least Recently Used_) drops keys nobody touched lately—a reliable default that keeps hot flash-sale products pinned in RAM. (**LFU**, _Least Frequently Used_, fits long-lived popularity skew.)',
      ],
      ops: [
        { op: 'remove-edge', id: 'cache-db' },
        { op: 'update-node', id: 'cache', patch: { badge: 'LRU full' } },
        {
          op: 'update-note',
          id: 'math-note',
          patch: { text: 'Full RAM → evict oldest' },
        },
      ],
      learns: [3],
    },
    {
      id: 'cache-stampede',
      label: 'Stampede',
      kind: 'watch-out',
      title: 'One expired hot key unleashes a herd',
      body: [
        'At 12:01:00, `item:99` hits its TTL and vanishes. Five hundred shoppers request it in the exact same millisecond, all miss the cache together, and fire **500 identical SQL queries** straight at **Catalog DB**.',
        'That sudden herd—a **cache stampede**—knocks the database back into meltdown.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never let hundreds of concurrent misses on one expired hot key query the DB at once.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'cache',
          patch: { state: 'hot', badge: 'Expired!' },
        },
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'hot', load: 0.95, badge: 'Stampede!' },
        },
        {
          op: 'update-note',
          id: 'math-note',
          patch: { text: '500 misses flood DB!', tone: 'bad' },
        },
        {
          op: 'packet',
          edge: 'api-cache',
          kind: 'error',
          count: 4,
          label: '500 misses',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'error',
          count: 4,
          label: '500 QPS',
          wave: 1,
        },
        { op: 'set-metric', id: 'hit-ratio', value: '0% burst', tone: 'bad' },
        { op: 'set-metric', id: 'db-load', value: '95%', tone: 'bad' },
        { op: 'set-metric', id: 'p50', value: '220 ms', tone: 'bad' },
      ],
    },
    {
      id: 'coalescing',
      label: 'Coalescing',
      kind: 'case',
      title: 'Single-flight coalescing sends one DB query',
      body: [
        'Stop stampedes with **request coalescing** (_single-flight_): only the first miss fetches from **Catalog DB** (with a lease timeout), while the other 499 waiters share its result.',
        'Pair coalescing with **random TTL jitter** (`60 s ± 10 s`) so keys never expire in unison, and optionally serve stale values while refreshing.',
      ],
      changes: [
        {
          type: 'changed',
          text: 'Single-flight collapses 500 DB queries into 1',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'cache',
          patch: { state: 'focus', badge: 'Single-flight' },
        },
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'normal', load: 0.08, badge: '1 query' },
        },
        {
          op: 'update-note',
          id: 'math-note',
          patch: { text: '1 DB fetch · 499 share', tone: 'good' },
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'request',
          count: 1,
          label: '1 reload',
          wave: 0,
        },
        { op: 'set-metric', id: 'hit-ratio', value: '99%', tone: 'good' },
        { op: 'set-metric', id: 'db-load', value: '1%', tone: 'good' },
        { op: 'set-metric', id: 'p50', value: '1 ms', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Serve reads from RAM, protect misses and writes',
      body: [
        'Caching turns expensive database reads into sub-millisecond memory hits. Choose your write policy for consistency vs speed, evict cold keys with LRU, and coalesce misses before a hot expiry floods your database.',
      ],
      ops: [
        { op: 'remove-note', id: 'math-note' },
        {
          op: 'update-node',
          id: 'cache',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'normal', load: 0.08, badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'cache-summary',
            anchor: { at: { x: 2, y: 1 } },
            text: 'Cache rules of thumb',
            tone: 'info',
            icon: 'bolt',
            rows: [
              ['90% → 99% hits', 'DB load ÷ 10'],
              ['Freshness', 'TTL + DEL on write'],
              ['Eviction', 'LRU default'],
            ],
            total: ['Stampede fix', 'Coalesce + jitter'],
          },
        },
      ],
      takeaways: [
        'Cache-aside checks RAM first, loads from DB on misses, and cuts DB load exponentially as hit ratio nears 99%',
        'Bound staleness with TTLs and delete keys on writes; pick write-through (safe) or write-back (fast writes, crash risk)',
        'LRU evicts the least recently touched items once cache memory fills',
        'Prevent stampedes with single-flight request coalescing, TTL jitter, and stale-while-revalidate',
      ],
    },
  ],
  checks: [
    {
      id: 'numeric-hit-ratio-latency',
      kind: 'numeric',
      prompt:
        'A cache hit takes 2 ms and a database miss takes 42 ms. With an 80% hit ratio (h = 0.8), what is the average read latency?',
      unit: 'ms',
      answer: 10,
      tolerance: 0.05,
      explain:
        'Average latency = 0.8 × 2 ms + 0.2 × 42 ms = 1.6 + 8.4 = 10 ms.',
      step: 'hit-ratio-math',
    },
    {
      id: 'choice-write-back-risk',
      kind: 'choice',
      prompt:
        'What is the main durability risk of a write-back (write-behind) cache compared with write-through?',
      options: [
        'A cache crash before async flushing loses recently written data not yet saved in the database',
        'Every write becomes twice as slow as writing directly to disk',
        'Read requests can never hit the cache after a write',
      ],
      answer: 0,
      explain:
        'Write-back acknowledges writes in cache RAM before asynchronously flushing batches to the DB, creating a loss window if the cache node fails.',
      step: 'write-through-back',
    },
    {
      id: 'choice-stampede-defense',
      kind: 'choice',
      prompt:
        'How does request coalescing (single-flight) stop a cache stampede when a popular key expires?',
      options: [
        'It lets only one miss query the database and shares that fetched value with all concurrent waiters',
        'It disables TTL expiration on every key in the cluster',
        'It switches the eviction policy from LRU to random drop',
      ],
      answer: 0,
      explain:
        'Coalescing collapses hundreds of simultaneous identical misses into a single backend DB fetch while waiting requests subscribe to the result.',
      step: 'coalescing',
    },
    {
      id: 'order-cache-aside-miss',
      kind: 'order',
      prompt:
        'Put the events of a cache-aside read miss in the order they happen.',
      items: [
        'App checks the cache for item:99 and gets a miss',
        'App queries the database for item:99',
        'App writes the database result into the cache with a TTL',
        'App returns the response to the shopper',
      ],
      explain:
        'In cache-aside, the application orchestrates both checks: cache lookup first, DB fallback on miss, populate cache, then reply.',
      step: 'cache-aside',
    },
  ],
  cards: [
    {
      front:
        'How do you calculate average read latency from a cache hit ratio h?',
      back: 'Average latency = h × t(cache) + (1 − h) × t(DB). Even a small miss rate dominates average latency when DB reads are 20× slower.',
    },
    {
      front:
        'In cache-aside, why do applications usually DELETE a key on write instead of overwriting it?',
      back: 'Deleting prevents two concurrent writes from racing and leaving the older value stuck in the cache until TTL expires.',
    },
    {
      front: 'Compare write-through vs write-back caching.',
      back: '• Write-through: updates cache and DB synchronously (consistent, slower writes).\n• Write-back: writes cache first and flushes to DB asynchronously (fast writes, risk of data loss on crash).',
    },
    {
      front:
        'Name three techniques to prevent a cache stampede on hot-key expiration.',
      back: '1. Single-flight / request coalescing (one reload per key)\n2. Random TTL jitter\n3. Stale-while-revalidate background refresh',
    },
  ],
} satisfies Lesson;
