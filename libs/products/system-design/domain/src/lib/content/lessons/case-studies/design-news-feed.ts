import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 09.03: Design a News Feed (`design-news-feed`).
 * Scenario: Fresh posts for millions of followers (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'design-news-feed',
  learn: [
    'Why fan-out on write beats fan-out on read for most feeds',
    'How hybrid fan-out handles accounts with millions of fans',
    'How to size and structure the feed cache with IDs only',
    'Where candidate gathering and ranking fit in the read path',
    'Why cursor pagination prevents duplicate posts on scroll',
  ],
  scene: {
    nodes: [
      {
        id: 'authors',
        kind: 'user',
        at: { x: 1, y: 3 },
        label: 'Creators',
        sublabel: 'Publish posts',
      },
      {
        id: 'readers',
        kind: 'phone',
        at: { x: 1, y: 7 },
        label: 'Readers',
        sublabel: 'Scroll feed',
      },
      {
        id: 'post-api',
        kind: 'server',
        at: { x: 4, y: 3 },
        label: 'Post API',
        sublabel: 'POST /posts',
      },
      {
        id: 'feed-api',
        kind: 'server',
        at: { x: 4, y: 7 },
        label: 'Feed API',
        sublabel: 'GET /feed',
      },
      {
        id: 'post-db',
        kind: 'database',
        at: { x: 8, y: 2 },
        label: 'Posts DB',
        sublabel: 'Sharded by author',
      },
    ],
    edges: [
      { id: 'auth-post', from: 'authors', to: 'post-api', label: 'POST' },
      { id: 'post-db-edge', from: 'post-api', to: 'post-db', label: 'write' },
      { id: 'read-feed', from: 'readers', to: 'feed-api', label: 'GET /feed' },
      {
        id: 'feed-db-edge',
        from: 'feed-api',
        to: 'post-db',
        label: 'pull 200',
      },
    ],
    zones: [
      {
        id: 'feed-cloud',
        from: { x: 3, y: 0 },
        to: { x: 13, y: 9 },
        hue: 'violet',
        label: 'News feed backend',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'read-p99', label: 'Feed p99', icon: 'timer', value: '1,800 ms' },
    { id: 'push-ops', label: 'Push writes', icon: 'bolt', value: '0' },
    { id: 'strategy', label: 'Fan-out', icon: 'layers', value: 'On read' },
    { id: 'paging', label: 'Paging', icon: 'stack', value: 'OFFSET' },
  ],
  steps: [
    {
      id: 'cold-feed',
      label: 'Slow feed',
      kind: 'problem',
      title: 'Querying 200 authors on read takes 1.8 seconds',
      body: [
        'A social app serves **10M daily readers**, each following **200 accounts**. When you open the app, it has to assemble fresh posts under **200 ms**.',
        'Right now `Feed API` runs `WHERE author_id IN (...200 ids...)` across sharded `Posts DB` tables, sorting every timeline at read time. At **1,800 ms p99**, scrolling stalls before the first photo appears.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'post-db',
          patch: { state: 'hot', load: 0.92, badge: '200-way fan-in' },
        },
        { op: 'packet', edge: 'read-feed', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'feed-db-edge',
          kind: 'request',
          count: 4,
          label: '200 shards',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'read-feed',
          kind: 'error',
          reverse: true,
          label: '1,800 ms',
          wave: 2,
        },
      ],
    },
    {
      id: 'fanout-on-read',
      label: 'Pull vs push',
      kind: 'technique',
      title: 'Fan-out on read keeps writes cheap, reads slow',
      body: [
        'That pull query is **fan-out on read**: publishing a post writes just **one row** into `Posts DB`, so writes stay trivial.',
        'The pain falls on readers: because feeds are read **100× more often** than posts are written, merging 200 followed timelines on every scroll wastes DB CPU. Can we shift work to write time instead?',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'post-db',
          patch: { state: 'normal', load: 0.3, badge: '1 write' },
        },
        { op: 'packet', edge: 'auth-post', kind: 'write', wave: 0 },
        {
          op: 'packet',
          edge: 'post-db-edge',
          kind: 'write',
          label: '1 row',
          wave: 1,
        },
      ],
      learns: [0],
    },
    {
      id: 'fanout-on-write',
      label: 'Fan-out write',
      kind: 'technique',
      title: 'Precompute follower feeds at write time',
      body: [
        'With **fan-out on write** (_push model_), when Maya (300 followers) publishes a post, `Post API` pushes a job onto a **Queue**.',
        '**Fan-out Workers** append `(postId, ts)` into all 300 followers’ **Feed Cache** lists in Redis. Now `Feed API` skips scanning `Posts DB` and reads one precomputed list in **12 ms**!',
      ],
      changes: [
        {
          type: 'added',
          text: 'Fan-out Queue, Workers, and Feed Cache (Redis)',
        },
        {
          type: 'changed',
          text: 'Feed API reads precomputed lists in 12 ms',
        },
      ],
      ops: [
        { op: 'remove-edge', id: 'feed-db-edge' },
        { op: 'update-node', id: 'post-db', patch: { badge: null } },
        {
          op: 'add-node',
          node: {
            id: 'fanout-q',
            kind: 'queue',
            at: { x: 7, y: 5 },
            label: 'Fan-out Queue',
            sublabel: 'Async jobs',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'worker',
            kind: 'worker',
            at: { x: 11, y: 5 },
            label: 'Fan-out Worker',
            sublabel: 'Push postId',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'feed-cache',
            kind: 'cache',
            at: { x: 11, y: 8 },
            label: 'Feed Cache',
            sublabel: 'Redis · IDs',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'post-q',
            from: 'post-api',
            to: 'fanout-q',
            label: 'enqueue',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'q-worker',
            from: 'fanout-q',
            to: 'worker',
            label: 'consume',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'worker-cache',
            from: 'worker',
            to: 'feed-cache',
            label: 'ZADD x300',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'feed-cache-edge',
            from: 'feed-api',
            to: 'feed-cache',
            label: 'ZREVRANGE',
          },
        },
        { op: 'set-metric', id: 'read-p99', value: '12 ms', tone: 'good' },
        { op: 'set-metric', id: 'push-ops', value: '300 / post' },
        { op: 'set-metric', id: 'strategy', value: 'On write', tone: 'good' },
      ],
      learns: [0],
    },
    {
      id: 'celebrity-hotkey',
      label: '20M followers',
      kind: 'case',
      title: 'A 20M-follower celebrity floods the write path',
      body: [
        'Now **Taylor** (**20 million followers**) posts one photo! Pure fan-out on write drops **20 million Redis writes** onto `Fan-out Worker` all at once.',
        'Workers lag for minutes (`celebrity delay`), cache bandwidth spikes, and **15 million writes** go straight into feeds of **inactive followers** who will never log in today!',
      ],
      changes: [
        {
          type: 'changed',
          text: '20M-follower post saturates Fan-out Worker',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'fanout-q',
          patch: { state: 'hot', load: 0.95, badge: '20M backlog' },
        },
        {
          op: 'update-node',
          id: 'worker',
          patch: { state: 'hot', load: 0.98, badge: 'Lag 4 min' },
        },
        {
          op: 'update-node',
          id: 'feed-cache',
          patch: { state: 'hot', badge: '75% wasted RAM' },
        },
        {
          op: 'packet',
          edge: 'post-q',
          kind: 'event',
          label: 'Taylor post',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'worker-cache',
          kind: 'error',
          count: 4,
          label: '20M writes!',
          wave: 1,
        },
        { op: 'set-metric', id: 'push-ops', value: '20M / post', tone: 'bad' },
      ],
      learns: [1],
    },
    {
      id: 'hybrid-fanout',
      label: 'Hybrid model',
      kind: 'technique',
      title: 'Push for regular accounts, pull for celebrities',
      body: [
        'Switch to **hybrid fan-out**: for regular accounts (`< 10k` followers), keep **push on write** (and skip dormant followers).',
        'For mega-accounts like Taylor, write once to a tiny **Celeb Cache**—zero fan-out! At read time, `Feed API` fetches your precomputed **Feed Cache** plus recent posts from the few celebrities you follow, merging both in **25 ms**.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Hybrid fan-out combines O(1) reads for 99% of creators with zero write amplification for celebrities.',
        },
      ],
      changes: [
        {
          type: 'added',
          text: 'Celeb Cache for mega-account posts (pull on read)',
        },
        { type: 'changed', text: 'Worker load drops back to normal' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'fanout-q',
          patch: { state: 'normal', load: 0.25, badge: null },
        },
        {
          op: 'update-node',
          id: 'worker',
          patch: { state: 'normal', load: 0.3, badge: 'Active only' },
        },
        {
          op: 'update-node',
          id: 'feed-cache',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-node',
          node: {
            id: 'celeb-cache',
            kind: 'cache',
            at: { x: 11, y: 2 },
            label: 'Celeb Cache',
            sublabel: 'Top creators',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'post-celeb',
            from: 'post-api',
            to: 'celeb-cache',
            label: 'if >10k',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'feed-celeb',
            from: 'feed-api',
            to: 'celeb-cache',
            label: 'merge pull',
            style: 'dashed',
          },
        },
        { op: 'packet', edge: 'feed-cache-edge', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'feed-celeb', kind: 'request', wave: 0 },
        { op: 'set-metric', id: 'read-p99', value: '25 ms', tone: 'good' },
        {
          op: 'set-metric',
          id: 'push-ops',
          value: 'Active <10k',
          tone: 'good',
        },
        { op: 'set-metric', id: 'strategy', value: 'Hybrid', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'feed-cache',
      label: 'Feed cache',
      kind: 'technique',
      title: 'Cache lightweight post IDs, hydrate on read',
      body: [
        'Never copy full post text, photos, or like counts into every follower’s feed list—that multiplies storage 1,000× and goes stale on edits.',
        'Each user’s **Feed Cache** entry stores only lightweight tuples—`(postId, authorId, score)` (`~24 B` each, capped at `500` recent IDs). `Feed API` hydrates full bodies and avatars from a shared `Posts DB` / object cache just before returning.',
      ],
      changes: [
        { type: 'added', text: 'Feed cache entry layout note (24 B per ID)' },
      ],
      ops: [
        { op: 'update-node', id: 'celeb-cache', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'feed-cache',
          patch: { state: 'focus', badge: '500 IDs × 24 B' },
        },
        {
          op: 'add-note',
          note: {
            id: 'cache-layout',
            anchor: { at: { x: 5, y: 9 } },
            text: 'Feed Cache tuple (24 B)',
            tone: 'info',
            icon: 'bolt',
            rows: [
              ['Per entry', 'postId · authorId · ts'],
              ['Cap / user', '500 recent IDs (12 KB)'],
              ['Hydration', 'Batch fetch Post/User'],
            ],
          },
        },
      ],
      learns: [2],
    },
    {
      id: 'ranking-step',
      label: 'Ranking',
      kind: 'technique',
      title: 'Score 200 candidates into a personalised top 20',
      body: [
        'Pure chronological sorting buries big updates posted while you slept. Instead, `Feed API` gathers ~200 recent candidate IDs from `Feed Cache` + `Celeb Cache` and sends them to a **Ranker**.',
        'The **Ranker** scores each post using _recency_, _author affinity_, and _engagement signals_, returning the top 20 hydrated items in **~45 ms total p99**.',
      ],
      changes: [
        { type: 'added', text: 'Ranker service scoring 200 candidate posts' },
      ],
      ops: [
        { op: 'remove-note', id: 'cache-layout' },
        {
          op: 'update-node',
          id: 'feed-cache',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-node',
          node: {
            id: 'ranker',
            kind: 'service',
            at: { x: 8, y: 8 },
            label: 'Ranker',
            sublabel: 'Top 20 of 200',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'feed-rank',
            from: 'feed-api',
            to: 'ranker',
            label: '200 candidates',
          },
        },
        {
          op: 'packet',
          edge: 'feed-rank',
          kind: 'request',
          label: '200 IDs',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'feed-rank',
          kind: 'response',
          reverse: true,
          label: 'Top 20',
          wave: 1,
        },
        { op: 'set-metric', id: 'read-p99', value: '45 ms', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'offset-trap',
      label: 'Cursor paging',
      kind: 'watch-out',
      title: 'Replace OFFSET pagination with stable cursors',
      body: [
        'Using `LIMIT 20 OFFSET 20` on a live feed breaks as new posts arrive: item #20 shifts down to #23, so scrolling to page 2 shows **duplicate posts** and forces the DB to scan skipped rows.',
        'Use **cursor pagination** (`?cursor=<last_score_or_id>&limit=20`): the server seeks straight to the cursor in `O(log N)` with zero duplicates.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never use OFFSET on fast-moving timelines—new inserts shift page boundaries and produce duplicates.',
        },
      ],
      ops: [
        { op: 'update-node', id: 'ranker', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'feed-api',
          patch: { state: 'focus', badge: '?cursor=9812' },
        },
        {
          op: 'update-edge',
          id: 'read-feed',
          patch: { label: 'GET ?cursor=' },
        },
        {
          op: 'packet',
          edge: 'read-feed',
          kind: 'request',
          label: 'cursor=9812',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'read-feed',
          kind: 'response',
          reverse: true,
          label: 'next 20',
          wave: 1,
        },
        { op: 'set-metric', id: 'paging', value: 'Cursor', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Hybrid fan-out, ID caches, and cursor paging',
      body: [
        'Fast news feeds precompute **ID-only feed caches** on write for typical creators, merge **celebrity posts** on read, rank top candidates in memory, and page cleanly with **cursors**.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'feed-api',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'feed-summary',
            anchor: { at: { x: 5, y: 9 } },
            text: 'News feed rules',
            tone: 'good',
            icon: 'layers',
            rows: [
              ['<10k followers', 'Push to active caches'],
              ['Mega-accounts', 'Pull & merge on read'],
              ['Feed cache', 'IDs only (~24 B/item)'],
              ['Pagination', 'Cursor, never OFFSET'],
            ],
            total: ['Feed p99', '45 ms'],
          },
        },
      ],
      takeaways: [
        'Fan-out on write delivers ~12 ms reads for normal accounts; fan-out on read avoids huge write storms',
        'Hybrid fan-out pushes posts for normal creators (active followers only) and merges celebrities at read time',
        'Store lightweight (postId, authorId, score) tuples in Feed Cache and hydrate bodies once per read',
        'Score ~200 candidates in a Ranker service and navigate pages with stable cursor pagination',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-hybrid-fanout',
      kind: 'choice',
      prompt:
        'Why do large social feeds switch from pure fan-out on write to a hybrid fan-out model?',
      options: [
        'Pushing one celebrity post into tens of millions of follower caches causes severe write lag and wastes RAM on inactive users',
        'Redis sorted sets cannot store more than 100 post IDs per key',
        'Fan-out on write prevents the Ranker service from sorting posts by engagement',
      ],
      answer: 0,
      explain:
        'Hybrid fan-out keeps fast precomputed caches for 99% of creators while pulling posts from the few mega-accounts on read, eliminating 20M-write storms.',
      step: 'hybrid-fanout',
    },
    {
      id: 'numeric-feed-cache-size',
      kind: 'numeric',
      prompt:
        'Suppose 5 million daily active users each keep 500 lightweight post tuples in Feed Cache at 24 bytes per tuple. How many gigabytes (GB) of RAM does the ID cache hold?',
      unit: 'GB',
      answer: 60,
      tolerance: 0.1,
      explain:
        '500 × 24 B = 12 KB per user. 5,000,000 × 12,000 B = 60,000,000,000 B = 60 GB.',
      step: 'feed-cache',
    },
    {
      id: 'choice-cursor-pagination',
      kind: 'choice',
      prompt:
        'What happens if a scrolling news feed uses LIMIT 20 OFFSET 20 while new posts keep arriving at the top?',
      options: [
        'New inserts shift indices downward, causing page 2 to repeat posts the user just saw on page 1',
        'New posts are automatically hidden until the user logs out',
        'The client receives duplicate WebSocket handshakes',
      ],
      answer: 0,
      explain:
        'Row offsets shift whenever newer items insert at the front; cursor pagination anchors reads to the last seen score or ID.',
      step: 'offset-trap',
    },
    {
      id: 'order-feed-read-path',
      kind: 'order',
      prompt:
        'Put the steps of serving a hybrid, ranked GET /feed?cursor=... request in order.',
      items: [
        'Fetch precomputed post IDs from the user’s Feed Cache',
        'Pull and merge recent post IDs from followed celebrity caches',
        'Score ~200 candidate IDs through the Ranker service',
        'Hydrate full post text and author profiles for the top 20',
        'Return the ranked page along with the next cursor token',
      ],
      explain:
        'Feed API gathers candidates from both Feed Cache and Celeb Cache, ranks them down to 20, hydrates full bodies once, and returns the next cursor.',
      step: 'ranking-step',
    },
  ],
  cards: [
    {
      front: 'Compare fan-out on write vs fan-out on read.',
      back: 'Fan-out on write precomputes follower feed caches on publish (fast reads, costly for huge follower counts); fan-out on read merges timelines on demand (cheap writes, slower reads).',
    },
    {
      front: 'How does hybrid fan-out handle celebrities with 20M followers?',
      back: 'Regular accounts push post IDs to active followers’ Feed Caches at write time; celebrity posts skip push fan-out and are pulled and merged at read time.',
    },
    {
      front:
        'Why should the Feed Cache store only post ID tuples instead of full post objects?',
      back: 'Storing ~24-byte (postId, authorId, score) tuples keeps memory small, avoids duplicating media across millions of feeds, and ensures edits/deletes reflect on hydration.',
    },
    {
      front:
        'Why use cursor pagination instead of OFFSET for a live news feed?',
      back: 'Cursors anchor to the last item seen so newly arriving posts do not shift offsets and create duplicate or skipped items while scrolling.',
    },
  ],
} satisfies Lesson;
