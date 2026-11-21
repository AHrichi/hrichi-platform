import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 09.02: Design a URL Shortener (`design-url-shortener`).
 * Scenario: 100M new links a month (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'design-url-shortener',
  learn: [
    'How to size writes, reads, storage, and cache from 100M/mo',
    'Why 7-char Base62 keys and counter ranges avoid collisions',
    'How to design compact storage for 600 GB/yr of short links',
    'How caching and 301 vs 302 redirects keep lookups fast',
    'Why click analytics belong on an async queue, not the read',
  ],
  scene: {
    nodes: [
      {
        id: 'users',
        kind: 'user',
        at: { x: 1, y: 4 },
        label: 'Creators & Clickers',
        sublabel: '100M links/mo',
      },
      {
        id: 'lb',
        kind: 'load-balancer',
        at: { x: 4, y: 4 },
        label: 'Load balancer',
        sublabel: 'L7 routing',
      },
      {
        id: 'api',
        kind: 'server',
        at: { x: 7, y: 4 },
        label: 'Shortener API',
        sublabel: 'POST / GET',
      },
    ],
    edges: [
      { id: 'users-lb', from: 'users', to: 'lb', label: 'HTTPS' },
      { id: 'lb-api', from: 'lb', to: 'api', label: 'route' },
    ],
    zones: [
      {
        id: 'backend',
        from: { x: 3, y: 0 },
        to: { x: 12, y: 9 },
        hue: 'violet',
        label: 'URL shortener cloud',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'writes', label: 'Write RPS', icon: 'gauge', value: '—' },
    { id: 'reads', label: 'Read RPS', icon: 'bolt', value: '—' },
    { id: 'p50', label: 'Redirect p50', icon: 'timer', value: '—' },
    { id: 'storage', label: 'Storage/yr', icon: 'database', value: '—' },
  ],
  steps: [
    {
      id: 'the-prompt',
      label: '100M links',
      kind: 'problem',
      title: '100M new links a month and sub-10 ms redirects',
      body: [
        'You are designing a URL shortener handling **100 million new links every month**. Creators call `POST /links` for a compact code like `sho.rt/3xK9pQ2`; visitors click it and redirect instantly.',
        'Two constraints pull hard against each other: short keys must **never collide** across servers, and **click counts** cannot slow down redirects.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'api',
          patch: { state: 'focus', badge: 'No DB yet' },
        },
        { op: 'packet', edge: 'users-lb', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'lb-api', kind: 'request', wave: 1 },
      ],
    },
    {
      id: 'estimates',
      label: 'Estimates',
      kind: 'technique',
      title: '100:1 reads dominate writes, storage is modest',
      body: [
        'Convert **100M new links/month** (`÷ 2.6 × 10⁶ s`): average **~40 writes/s** (`~100/s` peak). Assuming a **100:1 read-to-write ratio**, redirects average **4,000 reads/s** (`~12,000/s` peak) with `~2 MB/s` egress.',
        'At **500 B** per link record, **1.2 billion links/year** take just **600 GB/year** (`3 TB` over 5 years)—tiny enough to cache hot links in RAM!',
      ],
      changes: [
        { type: 'added', text: 'Scale estimate sheet (40 W/s vs 4,000 R/s)' },
      ],
      ops: [
        {
          op: 'add-note',
          note: {
            id: 'est-note',
            anchor: { at: { x: 3, y: 8 } },
            text: '100M links/mo math',
            tone: 'info',
            icon: 'chart',
            rows: [
              ['Writes', '40/s avg · 100 peak'],
              ['Reads (100:1)', '4,000/s avg'],
              ['Storage / yr', '600 GB'],
              ['Hot 20% cache', '~35 GB RAM'],
            ],
          },
        },
        { op: 'set-metric', id: 'writes', value: '40 /s' },
        { op: 'set-metric', id: 'reads', value: '4,000 /s' },
        { op: 'set-metric', id: 'storage', value: '600 GB' },
      ],
      learns: [0],
    },
    {
      id: 'base62-keys',
      label: 'Base62 keys',
      kind: 'technique',
      title: 'Seven Base62 characters hold 3.5 trillion links',
      body: [
        'Use **Base62** (`0–9`, `a–z`, `A–Z`) so short URLs stay alphanumeric and URL-safe without `-` or `/` escaping.',
        'Six characters give `62⁶ ≈ 56.8 billion` keys (~47 years at 1.2B/year). Adding one character (`L = 7`) explodes the key space to **`62⁷ ≈ 3.52 trillion`**—nearly **2,900 years** of capacity!',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: '7-character Base62 codes pack 3.5 trillion unique URLs into a short, readable string.',
        },
      ],
      ops: [
        {
          op: 'update-note',
          id: 'est-note',
          patch: {
            text: 'Base62 key space',
            tone: 'good',
            icon: 'key',
            rows: [
              ['L = 6 (62⁶)', '56.8B (~47 yrs)'],
              ['L = 7 (62⁷)', '3.52T (~2,900 yrs)'],
            ],
            total: ['Choice', '7-char Base62'],
          },
        },
        { op: 'update-node', id: 'api', patch: { badge: '62⁷ = 3.52T' } },
      ],
      learns: [1],
    },
    {
      id: 'key-service',
      label: 'Key service',
      kind: 'technique',
      title: 'Hand counter blocks from a Key Service',
      body: [
        'Hashing long URLs and taking the first 7 Base62 characters risks **collisions**—forcing a DB check-and-retry loop. Asking one `AUTO_INCREMENT` DB row per link creates a write lock bottleneck.',
        'Instead, a **Key Service** allocates **1M-ID counter ranges** (such as `10M..11M`) to each API server once. Each server encodes IDs locally in Base62 with **zero collisions** and zero network locks.',
      ],
      changes: [
        { type: 'added', text: 'Key Service leasing 1M counter blocks' },
      ],
      ops: [
        { op: 'remove-note', id: 'est-note' },
        {
          op: 'add-node',
          node: {
            id: 'kgs',
            kind: 'service',
            at: { x: 7, y: 1 },
            label: 'Key Service',
            sublabel: '1M counter blocks',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-kgs',
            from: 'api',
            to: 'kgs',
            label: 'lease block',
            style: 'dashed',
          },
        },
        {
          op: 'update-node',
          id: 'api',
          patch: { state: 'normal', badge: 'block 10M..11M' },
        },
        {
          op: 'packet',
          edge: 'api-kgs',
          kind: 'request',
          label: 'next 1M range',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'api-kgs',
          kind: 'response',
          reverse: true,
          label: '10M..11M',
          wave: 1,
        },
      ],
      learns: [1],
    },
    {
      id: 'guessable-trap',
      label: 'Predictable',
      kind: 'watch-out',
      title: 'Sequential Base62 codes leak private URLs',
      body: [
        'Encoding sequential counters (`10,000,001 → 3xK9aB1`, `10,000,002 → 3xK9aB2`) makes links **predictable**: anyone can increment the last character to scrape private links or measure your daily signup volume.',
        'Fix this before Base62 encoding by applying a reversible **bit permutation** (like a _Feistel cipher_) or appending fixed random bits—preserving **1:1 uniqueness** while scrambling output order.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never expose raw sequential counter codes in public URLs; permute or salt the integer first.',
        },
      ],
      ops: [
        { op: 'update-node', id: 'kgs', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'api',
          patch: { state: 'hot', badge: 'aB1 → aB2 leak!' },
        },
        {
          op: 'packet',
          edge: 'lb-api',
          kind: 'error',
          label: 'enum /aB1..9',
          wave: 0,
        },
      ],
      learns: [1],
    },
    {
      id: 'storage-model',
      label: 'Storage',
      kind: 'technique',
      title: 'Store compact rows keyed by short code',
      body: [
        'At **600 GB/year** (`3 TB` over 5 years), links need no complex joins—every lookup is a single key fetch `short_code → long_url`.',
        'Store `(short_code PK, long_url, user_id, created_at, expires_at)` in a **NoSQL key-value store** or sharded SQL table partitioned by `short_code` hash for even write and read distribution.',
      ],
      changes: [{ type: 'added', text: 'Links DB partitioned by short_code' }],
      ops: [
        {
          op: 'update-node',
          id: 'api',
          patch: { state: 'normal', badge: 'Feistel + Base62' },
        },
        {
          op: 'add-node',
          node: {
            id: 'links-db',
            kind: 'database',
            at: { x: 11, y: 5 },
            label: 'Links DB',
            sublabel: 'PK: short_code · 600 GB/yr',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-db',
            from: 'api',
            to: 'links-db',
            label: 'PUT/GET',
          },
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'write',
          label: '3xK9pQ2 → url',
          wave: 0,
        },
        { op: 'set-metric', id: 'p50', value: '20 ms' },
      ],
      learns: [2],
    },
    {
      id: 'cached-redirect',
      label: 'Redirect cache',
      kind: 'technique',
      title: 'Serve 80% of redirects from RAM and pick 302',
      body: [
        'Following the 80/20 rule, caching **20% of a day’s reads** needs only **~35 GB** of **Redis**. Redirect reads check RAM first (`~2 ms`) and only hit `Links DB` on a cold miss.',
        'Return **`302 Found`** (temporary) rather than `301 Moved Permanently`: browsers cache `301` locally and bypass your servers on repeat clicks, breaking click analytics and link edits!',
      ],
      changes: [
        {
          type: 'added',
          text: 'Redirect Cache (35 GB Redis) cutting p50 to 2 ms',
        },
        { type: 'changed', text: 'API serves 302 Found redirects' },
      ],
      ops: [
        { op: 'update-node', id: 'links-db', patch: { state: 'normal' } },
        { op: 'update-node', id: 'api', patch: { badge: '302 Found' } },
        {
          op: 'add-node',
          node: {
            id: 'cache',
            kind: 'cache',
            at: { x: 10, y: 2 },
            label: 'Redirect Cache',
            sublabel: 'Redis · 35 GB',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-cache',
            from: 'api',
            to: 'cache',
            label: 'GET code',
          },
        },
        {
          op: 'packet',
          edge: 'users-lb',
          kind: 'request',
          count: 3,
          label: '4k RPS',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'api-cache',
          kind: 'request',
          count: 3,
          label: 'HIT 2 ms',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'users-lb',
          kind: 'response',
          reverse: true,
          label: '302 Location',
          wave: 2,
        },
        { op: 'set-metric', id: 'p50', value: '2 ms', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'viral-analytics',
      label: 'Click queue',
      kind: 'case',
      title: 'Buffer viral click counts in an async queue',
      body: [
        'A major launch post goes viral: **25,000 clicks/sec** hit one short link! Running synchronous `UPDATE links SET clicks = clicks + 1` on every redirect creates brutal **row-lock contention** and stalls `302` responses.',
        'Instead, publish a tiny click event to a **Queue** (`< 1 ms`) and redirect immediately. **Analytics Workers** aggregate 10-second batches in memory and flush totals to **Analytics DB**.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Click Queue, Analytics Workers, and Analytics DB',
        },
      ],
      ops: [
        { op: 'update-node', id: 'cache', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'api',
          patch: { state: 'focus', badge: '25k clicks/s' },
        },
        {
          op: 'add-node',
          node: {
            id: 'click-q',
            kind: 'queue',
            at: { x: 5, y: 8 },
            label: 'Click Queue',
            sublabel: 'Async events',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'agg-worker',
            kind: 'worker',
            at: { x: 8, y: 8 },
            label: 'Click Workers',
            sublabel: '10 s batch rollup',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'analytics-db',
            kind: 'database',
            at: { x: 11, y: 8 },
            label: 'Analytics DB',
            sublabel: 'Click rollups',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-q',
            from: 'api',
            to: 'click-q',
            label: 'emit click',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'q-agg',
            from: 'click-q',
            to: 'agg-worker',
            label: 'consume',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'agg-db',
            from: 'agg-worker',
            to: 'analytics-db',
            label: 'batch write',
          },
        },
        {
          op: 'packet',
          edge: 'api-q',
          kind: 'event',
          count: 4,
          label: '25k/s',
          wave: 0,
        },
        { op: 'packet', edge: 'q-agg', kind: 'event', wave: 1 },
        {
          op: 'packet',
          edge: 'agg-db',
          kind: 'write',
          label: '1 batch/10s',
          wave: 2,
        },
        { op: 'set-metric', id: 'reads', value: '25,000 /s', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Fast cached redirects, collision-free keys',
      body: [
        'A 100:1 read-heavy URL shortener stays fast and clean by pairing **pre-allocated Base62 ranges** for lock-free writes, **Redis** + **`302`** for sub-2 ms redirects, and an **async queue** for click analytics.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'api',
          patch: { state: 'normal', badge: null },
        },
        { op: 'update-node', id: 'click-q', patch: { state: 'normal' } },
        {
          op: 'add-note',
          note: {
            id: 'url-summary',
            anchor: { at: { x: 2, y: 8 } },
            text: 'URL shortener blueprint',
            tone: 'good',
            icon: 'link',
            rows: [
              ['Keys', 'Permuted Base62 (7 chars)'],
              ['Writes', '1M counter blocks (KGS)'],
              ['Redirects', 'Redis (35 GB) + 302'],
              ['Analytics', 'Queue → batch worker'],
            ],
            total: ['Redirect p50', '2 ms'],
          },
        },
        { op: 'set-metric', id: 'reads', value: '4,000 /s', tone: 'good' },
      ],
      takeaways: [
        '100M monthly writes (~40 RPS) with 100:1 reads (~4,000 RPS) fits in 600 GB/year and ~35 GB hot cache',
        '7-character Base62 codes give 3.5 trillion keys; lease counter blocks from a Key Service to avoid locks',
        'Scramble or Feistel-permute sequential counter IDs before encoding so links cannot be guessed',
        'Serve 302 redirects from Redis and push click events onto an async queue so analytics never block reads',
      ],
    },
  ],
  checks: [
    {
      id: 'numeric-annual-storage',
      kind: 'numeric',
      prompt:
        'At 100 million new links created per month, roughly how many gigabytes (GB) of link records are written per year if each record averages 500 bytes?',
      unit: 'GB',
      answer: 600,
      tolerance: 0.1,
      explain:
        '100M/month × 12 months = 1.2 billion links/year. 1.2 × 10⁹ × 500 B = 600 × 10⁹ B = 600 GB/year.',
      step: 'estimates',
    },
    {
      id: 'choice-301-vs-302',
      kind: 'choice',
      prompt:
        'Why do URL shorteners that track click analytics usually return HTTP 302 (or 307) instead of 301 Moved Permanently?',
      options: [
        '301 lets browsers cache the target URL locally and skip hitting the shortener on repeat visits',
        '301 redirects cannot carry destination URLs longer than 62 characters',
        '302 forces the browser to perform a fresh TLS handshake on every click',
      ],
      answer: 0,
      explain:
        'Browsers cache 301 permanently, so subsequent clicks jump straight to the destination without notifying your servers or analytics queue.',
      step: 'cached-redirect',
    },
    {
      id: 'choice-key-ranges',
      kind: 'choice',
      prompt:
        'How does pre-allocating counter ranges from a Key Service let multiple API servers mint Base62 keys fast without collisions?',
      options: [
        'Each API server receives a disjoint numeric range in memory and encodes IDs locally with zero per-request coordination',
        'Every server hashes the long URL with MD5 and deletes conflicting records',
        'All API servers lock the same single counter row in PostgreSQL on every POST',
      ],
      answer: 0,
      explain:
        'Disjoint counter blocks (such as 10M..11M on server A and 11M..12M on server B) guarantee unique keys locally in microseconds.',
      step: 'key-service',
    },
    {
      id: 'order-redirect-analytics',
      kind: 'order',
      prompt:
        'Order the steps of a cached redirect request with asynchronous click tracking.',
      items: [
        'Visitor requests GET /3xK9pQ2 through the load balancer',
        'Shortener API reads the target URL from Redis cache in ~2 ms',
        'API emits a click event onto the async Click Queue',
        'API immediately replies with 302 Found to the destination URL',
        'Analytics Worker aggregates batched events into Analytics DB',
      ],
      explain:
        'Serving from cache and queueing the click event asynchronously keeps redirect latency at ~2 ms even during viral spikes.',
      step: 'viral-analytics',
    },
  ],
  cards: [
    {
      front: 'Why choose 7 characters in Base62 for a URL shortener?',
      back: '62⁷ ≈ 3.52 trillion unique codes—enough for ~2,900 years at 100M new links per month—while keeping URLs compact and alphanumeric (0–9, a–z, A–Z).',
    },
    {
      front:
        'How do counter ranges from a Key Service avoid write bottlenecks and collisions?',
      back: 'Each app server leases a disjoint block (e.g., 1M IDs) once and encodes numbers locally, avoiding per-request DB locks and hash collision retries.',
    },
    {
      front:
        'Why should sequential counter IDs be scrambled before Base62 encoding?',
      back: 'Raw sequential codes let attackers enumerate consecutive private URLs and infer link volume; a Feistel permutation or bit shuffle hides order while keeping 1:1 uniqueness.',
    },
    {
      front: 'Compare 301 vs 302 redirects and how click analytics stay fast.',
      back: '302 ensures clicks still reach your server for tracking (unlike browser-cached 301s), and pushing click events onto an async queue prevents row-lock contention on viral links.',
    },
  ],
} satisfies Lesson;
