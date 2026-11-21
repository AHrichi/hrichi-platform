import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 05.02: Rate Limiting (`rate-limiting`).
 * Scenario: A script floods the login endpoint (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'rate-limiting',
  learn: [
    'Spot why fixed-window limits allow 2× boundary bursts',
    'Compare sliding window logs with sliding window counters',
    'Control steady rate and bursts using a token bucket',
    'Share rate-limit counters safely across gateway nodes',
    'Reject excess load with HTTP 429 and Retry-After headers',
  ],
  scene: {
    nodes: [
      {
        id: 'legit',
        kind: 'user',
        at: { x: 1, y: 4 },
        label: 'Real users',
        sublabel: '2 logins/s',
      },
      {
        id: 'bot',
        kind: 'client',
        at: { x: 1, y: 7 },
        label: 'Bot script',
        sublabel: 'Password spray',
      },
      {
        id: 'gateway',
        kind: 'gateway',
        at: { x: 5, y: 6 },
        label: 'API Gateway',
        sublabel: 'POST /login',
      },
      {
        id: 'auth-svc',
        kind: 'service',
        at: { x: 9, y: 5 },
        label: 'Auth Service',
        sublabel: 'bcrypt verify',
        load: 0.15,
      },
      {
        id: 'auth-db',
        kind: 'database',
        at: { x: 12, y: 5 },
        label: 'Users DB',
        sublabel: 'Credentials',
      },
    ],
    edges: [
      { id: 'legit-gw', from: 'legit', to: 'gateway', label: '2/s' },
      { id: 'bot-gw', from: 'bot', to: 'gateway', label: 'Flood' },
      {
        id: 'gw-auth',
        from: 'gateway',
        to: 'auth-svc',
        label: 'POST /login',
      },
      { id: 'auth-db-link', from: 'auth-svc', to: 'auth-db', label: 'Query' },
    ],
    zones: [
      {
        id: 'edge-zone',
        from: { x: 4, y: 1 },
        to: { x: 13, y: 9 },
        hue: 'teal',
        label: 'Login platform',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'limit', label: 'Limit', icon: 'shield', value: '10/min' },
    { id: 'allowed', label: 'Forwarded', icon: 'check', value: '2/s' },
    { id: 'rejected', label: '429 Drops', icon: 'warning', value: '0/s' },
    { id: 'cpu', label: 'Auth CPU', icon: 'gauge', value: '15%' },
  ],
  steps: [
    {
      id: 'login-flood',
      label: 'Bot flood',
      kind: 'problem',
      title: 'One login script saturates password hashing',
      body: [
        'Real users sign in at **2 requests/s**, while a credential-stuffing script pounds `POST /login` at **120 requests/s** from a rented VM.',
        'Each `bcrypt` check is intentionally CPU-heavy. Without an edge limit, the bot pegs **Auth Service** at `100%` CPU and blocks genuine sign-ins.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'bot',
          patch: { state: 'hot', badge: '120 req/s' },
        },
        {
          op: 'update-node',
          id: 'auth-svc',
          patch: { state: 'hot', load: 1.0, badge: 'CPU 100%' },
        },
        {
          op: 'packet',
          edge: 'bot-gw',
          kind: 'error',
          count: 4,
          label: '120/s flood',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'gw-auth',
          kind: 'request',
          count: 4,
          wave: 1,
        },
        { op: 'set-metric', id: 'allowed', value: '122/s', tone: 'bad' },
        { op: 'set-metric', id: 'cpu', value: '100%', tone: 'bad' },
      ],
    },
    {
      id: 'fixed-window',
      label: 'Fixed window',
      kind: 'technique',
      title: 'Fixed windows count requests per clock bucket',
      body: [
        'The simplest limiter is a **fixed window**: round the timestamp to the current minute (`12:00`), increment a counter for that caller (`10/min`), and reject calls past `10`.',
        'Each key needs only one integer and an expiry TTL, making memory and lookup cost tiny.',
      ],
      changes: [
        {
          type: 'added',
          text: '10 req/min fixed-window counter at the gateway',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'gateway',
          patch: { state: 'focus', badge: 'Fixed 10/m' },
        },
        {
          op: 'update-node',
          id: 'auth-svc',
          patch: { state: 'normal', load: 0.18, badge: null },
        },
        {
          op: 'update-node',
          id: 'bot',
          patch: { state: 'normal', badge: 'Throttled' },
        },
        {
          op: 'add-note',
          note: {
            id: 'algo-note',
            anchor: { at: { x: 10, y: 2 } },
            text: 'Fixed window (10/min)',
            tone: 'info',
            icon: 'clock',
            rows: [
              ['12:00 bucket', '10 / 10'],
              ['Next bucket', '12:01:00'],
            ],
          },
        },
        { op: 'packet', edge: 'bot-gw', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'bot-gw',
          kind: 'error',
          reverse: true,
          label: 'Drop >10',
          wave: 1,
        },
        { op: 'set-metric', id: 'allowed', value: '10/min', tone: 'good' },
        { op: 'set-metric', id: 'rejected', value: 'Active', tone: 'good' },
        { op: 'set-metric', id: 'cpu', value: '18%', tone: 'good' },
      ],
    },
    {
      id: 'edge-burst',
      label: 'Edge burst',
      kind: 'case',
      title: 'Boundary bursts let 2× traffic sneak past',
      body: [
        'Fixed windows leak across clock seams. The bot sends **10 logins at `12:00:58`** and **10 more at `12:01:02`**—each bucket sees `10 ≤ 10` and allows all of them!',
        'Auth Service suddenly absorbs **20 requests in 4 seconds**, double the `10/min` budget.',
      ],
      changes: [
        {
          type: 'changed',
          text: '20 bot requests pass within 4 seconds across seam',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'bot',
          patch: { state: 'hot', badge: '20 in 4 s' },
        },
        {
          op: 'update-node',
          id: 'auth-svc',
          patch: { state: 'hot', load: 0.75, badge: '2× burst' },
        },
        {
          op: 'update-note',
          id: 'algo-note',
          patch: {
            text: 'Boundary burst!',
            tone: 'bad',
            rows: [
              ['12:00:58', '10 allowed'],
              ['12:01:02', '10 allowed'],
            ],
            total: ['In 4 seconds', '20 requests (2×)'],
          },
        },
        {
          op: 'packet',
          edge: 'bot-gw',
          kind: 'request',
          count: 3,
          label: '20 in 4 s',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'gw-auth',
          kind: 'request',
          count: 3,
          wave: 1,
        },
        { op: 'set-metric', id: 'allowed', value: '20 / 4s', tone: 'bad' },
        { op: 'set-metric', id: 'cpu', value: '75%', tone: 'bad' },
      ],
      learns: [0],
    },
    {
      id: 'sliding-window',
      label: 'Sliding window',
      kind: 'technique',
      title: 'Sliding windows eliminate clock-edge spikes',
      body: [
        'A **sliding window log** keeps every request timestamp and counts entries in the trailing `60 s`—exact, but memory grows with traffic.',
        'A **sliding window counter** approximates it with just two buckets: `prev_count × overlap + curr_count`. At `12:01:02` (`97%` overlap with `12:00`), `10 × 0.97 + 1 = 10.7 > 10`, blocking the burst!',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'bot',
          patch: { state: 'normal', badge: 'Seam blocked' },
        },
        {
          op: 'update-node',
          id: 'auth-svc',
          patch: { state: 'normal', load: 0.18, badge: null },
        },
        {
          op: 'update-node',
          id: 'gateway',
          patch: { badge: 'Sliding 60s' },
        },
        {
          op: 'update-note',
          id: 'algo-note',
          patch: {
            text: 'Sliding counter math',
            tone: 'info',
            rows: [
              ['Prev (97% overlap)', '10 × 0.97'],
              ['Current bucket', '+ 1'],
            ],
            total: ['Weighted count', '10.7 > 10'],
          },
        },
        {
          op: 'packet',
          edge: 'bot-gw',
          kind: 'error',
          reverse: true,
          label: 'Blocked',
          wave: 0,
        },
        { op: 'set-metric', id: 'allowed', value: '10 / 60s', tone: 'good' },
        { op: 'set-metric', id: 'cpu', value: '18%', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'token-bucket',
      label: 'Token bucket',
      kind: 'technique',
      title: 'Token buckets allow small, bounded bursts',
      body: [
        'Real users sometimes send 3 quick calls (page refresh + asset retry). A **token bucket** holds up to _capacity_ tokens (`10`) and refills steadily (`1 token / 6 s`).',
        'Each request spends a token: short valid bursts use saved tokens without blocking, while sustained floods drain the bucket and fail immediately.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Token bucket caps both burst size (bucket capacity) and average rate (refill speed).',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'gateway',
          patch: { badge: 'Bucket: 10' },
        },
        {
          op: 'update-note',
          id: 'algo-note',
          patch: {
            text: 'Token bucket',
            tone: 'good',
            icon: 'bolt',
            rows: [
              ['Capacity (burst)', '10 tokens'],
              ['Refill rate', '10 / min'],
            ],
            total: undefined,
          },
        },
        {
          op: 'packet',
          edge: 'legit-gw',
          kind: 'request',
          count: 2,
          label: 'Burst OK',
          wave: 0,
        },
        { op: 'packet', edge: 'gw-auth', kind: 'request', wave: 1 },
      ],
      learns: [2],
    },
    {
      id: 'distributed-counters',
      label: 'Shared store',
      kind: 'technique',
      title: 'Multiple gateways share one atomic counter store',
      body: [
        'Running two gateways with local in-memory counters lets a script spend `2 ×` its limit by alternating servers.',
        'Store buckets in a shared **Redis** cache and update tokens with an **atomic Lua script** (or `INCR` + `EXPIRE`), preventing read-modify-write races across concurrent requests.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Second API Gateway and shared Redis atomic store',
        },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'gw-2',
            kind: 'gateway',
            at: { x: 5, y: 3 },
            label: 'Gateway 2',
            sublabel: 'Replica',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'redis',
            kind: 'cache',
            at: { x: 8, y: 8 },
            label: 'Redis Store',
            sublabel: 'Atomic Lua',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'gw-redis',
            from: 'gateway',
            to: 'redis',
            label: 'Lua check',
            style: 'dashed',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'gw2-redis',
            from: 'gw-2',
            to: 'redis',
            style: 'dashed',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'legit-gw2', from: 'legit', to: 'gw-2', label: 'HTTPS' },
        },
        {
          op: 'add-edge',
          edge: { id: 'gw2-auth', from: 'gw-2', to: 'auth-svc' },
        },
        {
          op: 'update-node',
          id: 'gateway',
          patch: {
            state: 'normal',
            label: 'Gateway 1',
            badge: 'Shared bucket',
          },
        },
        { op: 'packet', edge: 'gw-redis', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'gw2-redis', kind: 'write', wave: 0 },
      ],
      learns: [3],
    },
    {
      id: 'http-429',
      label: '429 + Retry',
      kind: 'technique',
      title: 'Return 429 Too Many Requests with Retry-After',
      body: [
        'Reject over-limit traffic right at the gateway with **`429 Too Many Requests`** so **Auth Service** never wastes CPU.',
        'Include **`Retry-After: 12`** (seconds until the next token refills) and `X-RateLimit-Remaining: 0` so well-behaved clients back off instead of polling in a tight loop.',
      ],
      ops: [
        { op: 'update-node', id: 'gw-2', patch: { state: 'normal' } },
        { op: 'update-node', id: 'redis', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'bot',
          patch: { state: 'hot', badge: '429 dropped' },
        },
        {
          op: 'packet',
          edge: 'bot-gw',
          kind: 'request',
          count: 3,
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'bot-gw',
          kind: 'error',
          reverse: true,
          count: 2,
          label: '429 · Wait 12s',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'legit-gw2',
          kind: 'request',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'legit-gw2',
          kind: 'response',
          reverse: true,
          label: '200 OK',
          wave: 1,
        },
        { op: 'set-metric', id: 'allowed', value: '2/s', tone: 'good' },
        { op: 'set-metric', id: 'rejected', value: '120/s', tone: 'good' },
        { op: 'set-metric', id: 'cpu', value: '12%', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'shared-ip-trap',
      label: 'Shared NAT IP',
      kind: 'watch-out',
      title: 'Watch out: limiting by IP alone blocks offices',
      body: [
        'An entire university campus or corporate office often shares one outbound NAT IP address. Keying login limits purely on `ip` lets one noisy script trigger `429` for hundreds of real coworkers.',
        'Scope limits by **user ID**, **API key**, or a composite **`ip + username`** key, and decide whether Redis failure **fails open** (allow) or **fails closed** (block).',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Limit by the right identity: one office NAT can place hundreds of real users behind a single IP.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'legit',
          patch: { state: 'hot', badge: 'Shared NAT IP!' },
        },
        {
          op: 'packet',
          edge: 'legit-gw',
          kind: 'error',
          reverse: true,
          label: 'False 429',
          wave: 0,
        },
        {
          op: 'update-note',
          id: 'algo-note',
          patch: {
            text: 'Key selection matters',
            tone: 'bad',
            icon: 'warning',
            rows: [
              ['IP only', 'Blocks NAT offices'],
              ['API key / user+IP', 'Fair per account'],
            ],
          },
        },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Enforce fair, shared limits at the edge',
      body: [
        'Rate limiting shields expensive backends from abuse and spikes—when backed by an atomic shared store, fair identity keys, and clear `429 + Retry-After` signals.',
      ],
      ops: [
        { op: 'remove-note', id: 'algo-note' },
        {
          op: 'update-node',
          id: 'legit',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'bot',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'gateway',
          patch: { badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'rate-summary',
            anchor: { at: { x: 10, y: 2 } },
            text: 'Rate limiting',
            tone: 'good',
            icon: 'shield',
            rows: [
              ['Fixed window', '2× edge burst risk'],
              ['Sliding counter', 'Smooth, 2 buckets'],
              ['Token bucket', 'Bounded bursts OK'],
            ],
            total: ['Response', '429 + Retry-After'],
          },
        },
      ],
      takeaways: [
        'Fixed windows are simple but permit up to 2× bursts across minute boundaries',
        'Sliding-window counters smooth boundary spikes with just two weighted counters',
        'Token buckets allow short valid bursts up to bucket capacity while capping sustained rate',
        'Use atomic Redis counters across gateway replicas and respond with HTTP 429 plus Retry-After',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-fixed-window-burst',
      kind: 'choice',
      prompt:
        'A fixed-window rate limiter allows 60 requests per minute per key. How can a client slip 120 requests past it inside 2 seconds?',
      options: [
        'Send 60 requests at 12:00:59 and 60 more at 12:01:01 across the window boundary',
        'Send 120 requests at 12:00:30 because counters reset every second',
        'Use HTTP/2 multiplexing so all 120 count as one TCP packet',
      ],
      answer: 0,
      explain:
        'Fixed windows reset on clock ticks: 60 requests at the end of one bucket plus 60 at the start of the next both stay within 60 per bucket.',
      step: 'edge-burst',
    },
    {
      id: 'numeric-token-bucket',
      kind: 'numeric',
      prompt:
        'A token bucket starts full at its capacity of 20 tokens and refills at 5 tokens per second. A burst immediately uses 14 tokens, then 2 seconds pass with zero requests. How many tokens are in the bucket now?',
      unit: 'tokens',
      answer: 16,
      tolerance: 0.05,
      explain:
        'After the burst: 20 − 14 = 6 tokens left. Over 2 seconds, 2 × 5 = 10 tokens refill, giving 6 + 10 = 16 tokens (below the cap of 20).',
      step: 'token-bucket',
    },
    {
      id: 'choice-distributed-counters',
      kind: 'choice',
      prompt:
        'Why do multi-instance API gateways keep token buckets in a shared Redis store with atomic scripts instead of local RAM?',
      options: [
        'Local memory lets callers multiply their quota across N gateways and risks race conditions',
        'Redis automatically encrypts user passwords before bcrypt runs',
        'Local RAM cannot store integers larger than 10',
      ],
      answer: 0,
      explain:
        'Without a shared atomic store, a client round-robining across 4 gateways gets 4× the quota, and concurrent read-then-write updates lose counts.',
      step: 'distributed-counters',
    },
    {
      id: 'order-gateway-limit-flow',
      kind: 'order',
      prompt:
        'Put the steps of an edge rate-limited login request in the correct execution order.',
      items: [
        'Extract caller identity key (account + IP or API key)',
        'Atomically evaluate and decrement token count in shared Redis',
        'Return HTTP 429 with Retry-After immediately if tokens are exhausted',
        'Forward allowed requests to Auth Service for password verification',
      ],
      explain:
        'Identify the caller first, check the shared atomic limiter, shed excess at the edge with 429, and only forward permitted traffic to expensive auth work.',
      step: 'http-429',
    },
  ],
  cards: [
    {
      front: 'Why can fixed-window rate limiting allow double the target rate?',
      back: 'A burst at the end of window N (e.g. 59s) and another at the start of window N+1 (01s) each fit inside separate buckets, producing 2× the limit in a short span.',
    },
    {
      front: 'How do sliding window log and sliding window counter differ?',
      back: '• Log: stores every timestamp (exact, high memory).\n• Counter: weights the previous and current fixed buckets by overlap (O(1) memory, very accurate).',
    },
    {
      front: 'What two parameters define a token bucket?',
      back: 'Bucket capacity (maximum burst size) and refill rate (sustained average request rate).',
    },
    {
      front:
        'What HTTP status and headers should an over-limit API return, and what key pitfall should you avoid?',
      back: 'Return 429 Too Many Requests with Retry-After (and X-RateLimit-Remaining). Avoid keying purely on IP when many legitimate users share a corporate or mobile NAT.',
    },
  ],
} satisfies Lesson;
