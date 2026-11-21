import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 05.03: Timeouts, Retries & Backoff (`timeouts-retries`).
 * Scenario: A slow dependency stalls every thread (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'timeouts-retries',
  learn: [
    'See why missing timeouts freeze every caller thread',
    'Propagate a per-request timeout budget across hops',
    'Stop retry storms with exponential backoff and jitter',
    'Prevent retry amplification across multi-hop call chains',
    'Make retried writes safe using idempotency keys',
  ],
  scene: {
    nodes: [
      {
        id: 'riders',
        kind: 'phone',
        at: { x: 1, y: 4 },
        label: 'Mobile app',
        sublabel: 'Place order',
      },
      {
        id: 'orders',
        kind: 'service',
        at: { x: 5, y: 4 },
        label: 'Order API',
        sublabel: '100 threads',
        load: 0.15,
      },
      {
        id: 'fraud',
        kind: 'service',
        at: { x: 10, y: 2 },
        label: 'Fraud Check',
        sublabel: 'p99 40 ms',
      },
      {
        id: 'ledger',
        kind: 'database',
        at: { x: 10, y: 7 },
        label: 'Payments DB',
        sublabel: 'Charges',
      },
    ],
    edges: [
      {
        id: 'riders-orders',
        from: 'riders',
        to: 'orders',
        label: 'POST /order',
      },
      { id: 'orders-fraud', from: 'orders', to: 'fraud', label: 'Check' },
      { id: 'orders-ledger', from: 'orders', to: 'ledger', label: 'Charge' },
    ],
    zones: [
      {
        id: 'backend',
        from: { x: 4, y: 1 },
        to: { x: 12, y: 8 },
        hue: 'blue',
        label: 'Checkout cluster',
      },
    ],
    notes: [],
  },
  hud: [
    {
      id: 'threads',
      label: 'Free threads',
      icon: 'layers',
      value: '100 / 100',
    },
    { id: 'p99', label: 'Order p99', icon: 'timer', value: '120 ms' },
    { id: 'load', label: 'Fraud RPS', icon: 'gauge', value: '100' },
    { id: 'dupes', label: 'Double pay', icon: 'warning', value: '0' },
  ],
  steps: [
    {
      id: 'missing-timeout',
      label: 'No timeout',
      kind: 'problem',
      title: 'One stalled dependency freezes every thread',
      body: [
        'Your **Order API** runs 100 worker threads and calls **Fraud Check** with _no timeout_ (`∞`). Normally Fraud answers in `40 ms`.',
        'Today a database lock stalls Fraud Check for **30 seconds**. At `100 RPS`, `100 × 30 = 3,000` threads are needed—so all **100 threads** wedge waiting, freezing even unrelated endpoints.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'fraud',
          patch: { state: 'hot', badge: '30 s hang' },
        },
        {
          op: 'update-node',
          id: 'orders',
          patch: { state: 'hot', load: 1.0, badge: '0 / 100 free' },
        },
        {
          op: 'packet',
          edge: 'orders-fraud',
          kind: 'request',
          count: 4,
          label: 'Stalled',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'riders-orders',
          kind: 'error',
          reverse: true,
          count: 2,
          label: '504 Hang',
          wave: 1,
        },
        { op: 'set-metric', id: 'threads', value: '0 / 100', tone: 'bad' },
        { op: 'set-metric', id: 'p99', value: '30,000 ms', tone: 'bad' },
      ],
      learns: [0],
    },
    {
      id: 'set-timeouts',
      label: 'Timeouts',
      kind: 'technique',
      title: 'Bound every remote call with two timeouts',
      body: [
        'Set a short **connect timeout** (`50 ms` for TCP/TLS) and a **request timeout** just above the dependency’s healthy `p99` (`150 ms` when `p99` is `40 ms`).',
        'Now hung calls abort at `150 ms`: only `100 × 0.15 = 15` threads stay busy, freeing **85 threads** for healthy traffic.',
      ],
      changes: [
        { type: 'added', text: '150 ms request timeout on Fraud Check client' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'orders',
          patch: { state: 'focus', load: 0.25, badge: '150 ms cap' },
        },
        {
          op: 'update-node',
          id: 'fraud',
          patch: { state: 'hot', badge: 'Slow (30s)' },
        },
        {
          op: 'packet',
          edge: 'orders-fraud',
          kind: 'error',
          reverse: true,
          label: 'Abort @150ms',
          wave: 0,
        },
        { op: 'set-metric', id: 'threads', value: '85 / 100', tone: 'good' },
        { op: 'set-metric', id: 'p99', value: '220 ms', tone: 'normal' },
      ],
    },
    {
      id: 'timeout-budget',
      label: 'Budgets',
      kind: 'technique',
      title: 'Pass a shrinking deadline budget downstream',
      body: [
        'Suppose the mobile request has a **500 ms** overall deadline. If `Order API` already spent `200 ms` parsing and queueing, only **300 ms** remains in the **timeout budget**.',
        'Propagate that remaining deadline across every hop (`X-Deadline`). Never start a `150 ms` retry when only `40 ms` remain—fail fast instead of doing work nobody waits for.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'A retry must fit inside what remains of the caller’s deadline budget, or it only wastes load.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'fraud',
          patch: { state: 'normal', badge: '≤ 300 ms' },
        },
        {
          op: 'update-node',
          id: 'ledger',
          patch: { state: 'focus', badge: '≤ 120 ms' },
        },
        {
          op: 'add-note',
          note: {
            id: 'budget-note',
            anchor: { at: { x: 3, y: 7 } },
            text: 'Request budget: 500 ms',
            tone: 'info',
            icon: 'timer',
            rows: [
              ['Order API', '500 ms left'],
              ['Fraud hop', '≤ 300 ms'],
              ['DB charge', '≤ 120 ms'],
            ],
          },
        },
        {
          op: 'packet',
          edge: 'orders-fraud',
          kind: 'request',
          label: '300ms left',
          wave: 0,
        },
      ],
      learns: [1],
    },
    {
      id: 'retry-storm',
      label: 'Retry storm',
      kind: 'case',
      title: 'Immediate retries multiply load into a storm',
      body: [
        'Fraud Check hits a brief `20%` overload. Every `Order API` instance immediately retries failed calls **3 times** in a tight loop.',
        'Requests multiply from `100 RPS` to `300–400 RPS` just when Fraud Check is weakest—locking the dependency into a self-inflicted **retry storm**.',
      ],
      changes: [
        { type: 'changed', text: 'Immediate retries spike Fraud RPS past 400' },
      ],
      ops: [
        { op: 'remove-note', id: 'budget-note' },
        {
          op: 'update-node',
          id: 'fraud',
          patch: { state: 'hot', load: 1.0, badge: '400+ RPS!' },
        },
        {
          op: 'update-node',
          id: 'orders',
          patch: { state: 'hot', load: 0.85, badge: 'Retry loop' },
        },
        {
          op: 'update-node',
          id: 'ledger',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'packet',
          edge: 'orders-fraud',
          kind: 'error',
          count: 5,
          label: '4× storm',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'orders-fraud',
          kind: 'error',
          reverse: true,
          count: 3,
          label: '503 Overload',
          wave: 1,
        },
        { op: 'set-metric', id: 'load', value: '400+ RPS', tone: 'bad' },
        { op: 'set-metric', id: 'threads', value: '20 / 100', tone: 'bad' },
      ],
    },
    {
      id: 'backoff-jitter',
      label: 'Jitter backoff',
      kind: 'technique',
      title: 'Space retries via backoff and random jitter',
      body: [
        '**Exponential backoff** doubles the delay on each failure: `min(cap, base × 2ⁿ)` (`100 → 200 → 400 ms`).',
        'Add **full jitter** (`random(0, backoff)`) so clients do not wake up in synchronised waves (_thundering herd_), plus a **retry budget** capping extra traffic at `10%` of normal load.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Full-jitter exponential backoff + 10% retry budget',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'orders',
          patch: { state: 'focus', load: 0.3, badge: 'Jittered' },
        },
        {
          op: 'update-node',
          id: 'fraud',
          patch: { state: 'normal', load: 0.4, badge: 'Recovering' },
        },
        {
          op: 'add-note',
          note: {
            id: 'backoff-note',
            anchor: { at: { x: 3, y: 7 } },
            text: 'Full jitter backoff',
            tone: 'good',
            icon: 'clock',
            rows: [
              ['Try 1', '0–100 ms'],
              ['Try 2', '0–200 ms'],
              ['Retry cap', '≤ 10% extra RPS'],
            ],
          },
        },
        {
          op: 'packet',
          edge: 'orders-fraud',
          kind: 'request',
          label: 'Spread out',
          wave: 0,
        },
        { op: 'set-metric', id: 'load', value: '110', tone: 'good' },
        { op: 'set-metric', id: 'threads', value: '88 / 100', tone: 'good' },
        { op: 'set-metric', id: 'p99', value: '180 ms', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'layer-amplification',
      label: 'Multi-layer',
      kind: 'watch-out',
      title: 'Watch out: retry at one layer only',
      body: [
        'If the mobile app retries `3×`, an API gateway retries `3×`, and Order API retries `3×`, one failing payment produces **`3 × 3 × 3 = 27` database calls**!',
        'Retry at **one layer only** (usually the client edge with budget left), and never retry non-transient errors like `400 Bad Request` or `401`.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: '3 tries across 3 stacked layers multiply into 27 calls—retry at a single layer.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'riders',
          patch: { state: 'hot', badge: '3× retries' },
        },
        {
          op: 'update-node',
          id: 'orders',
          patch: { state: 'hot', badge: '×3 = 9×' },
        },
        {
          op: 'packet',
          edge: 'riders-orders',
          kind: 'error',
          count: 3,
          label: '3× client',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'orders-ledger',
          kind: 'error',
          count: 5,
          label: '27× DB calls!',
          wave: 1,
        },
      ],
      learns: [3],
    },
    {
      id: 'idempotency-keys',
      label: 'Idempotency',
      kind: 'technique',
      title: 'Idempotency keys stop double charges on retry',
      body: [
        'Suppose `Payments DB` commits a `$40` ride charge, then the response packet drops before reaching the phone. A blind retry charges the card twice!',
        'Attach a unique **idempotency key** (`idem-9f3a`) to `POST /order`. The server records `{ key → receipt }` atomically; retries find the stored key and return the original `200 OK` without charging again.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'riders',
          patch: { state: 'normal', badge: 'key: idem-9f3a' },
        },
        {
          op: 'update-node',
          id: 'orders',
          patch: { state: 'focus', badge: 'Dedup key' },
        },
        {
          op: 'update-node',
          id: 'ledger',
          patch: { state: 'focus', badge: 'Unique key' },
        },
        {
          op: 'update-note',
          id: 'backoff-note',
          patch: {
            text: 'Idempotent POST',
            tone: 'good',
            icon: 'key',
            rows: [
              ['1st attempt', 'Charge + save key'],
              ['Retry same key', 'Replay 200 OK'],
            ],
          },
        },
        {
          op: 'packet',
          edge: 'orders-ledger',
          kind: 'write',
          label: 'idem-9f3a',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'orders-ledger',
          kind: 'response',
          reverse: true,
          label: 'Saved receipt',
          wave: 1,
        },
        { op: 'set-metric', id: 'dupes', value: '0', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Fail fast, back off with jitter, retry safely',
      body: [
        'Bound every network call with timeouts and a shared deadline budget, spread safe retries with jittered backoff at a single layer, and guard writes with idempotency keys.',
      ],
      ops: [
        { op: 'remove-note', id: 'backoff-note' },
        {
          op: 'update-node',
          id: 'riders',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'orders',
          patch: { state: 'normal', load: 0.15, badge: null },
        },
        {
          op: 'update-node',
          id: 'fraud',
          patch: { state: 'normal', load: 0.2, badge: null },
        },
        {
          op: 'update-node',
          id: 'ledger',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'retry-summary',
            anchor: { at: { x: 3, y: 7 } },
            text: 'Safe retry rules',
            tone: 'good',
            icon: 'shield',
            rows: [
              ['Timeouts', 'Connect + p99 cap'],
              ['Backoff', 'min(cap, base × 2ⁿ)'],
              ['Jitter', 'random(0, backoff)'],
              ['Writes', 'Idempotency key'],
            ],
          },
        },
        { op: 'set-metric', id: 'threads', value: '90 / 100', tone: 'good' },
        { op: 'set-metric', id: 'p99', value: '120 ms', tone: 'good' },
        { op: 'set-metric', id: 'load', value: '105', tone: 'good' },
      ],
      takeaways: [
        'Always set connect and request timeouts just above healthy p99 so stalls free threads fast',
        'Propagate a per-request deadline budget so downstream hops skip work after the caller expires',
        'Combine exponential backoff, full jitter, and a retry budget to prevent retry storms',
        'Retry at one layer only and attach idempotency keys to protect mutating operations',
      ],
    },
  ],
  checks: [
    {
      id: 'numeric-thread-pinning',
      kind: 'numeric',
      prompt:
        'An API handles 200 RPS and calls a dependency without a timeout. If a lock stalls that dependency for 5 seconds per call, how many worker threads are held waiting concurrently (L = λ × W)?',
      unit: 'threads',
      answer: 1000,
      tolerance: 0.05,
      explain:
        'By Little’s law, 200 requests/s × 5 s = 1,000 concurrent threads pinned waiting on stalled sockets.',
      step: 'missing-timeout',
    },
    {
      id: 'numeric-retry-amplification',
      kind: 'numeric',
      prompt:
        'A request travels through 3 service layers in series. Each layer makes up to 3 attempts (1 initial call + 2 retries) when the downstream call fails. How many total calls can reach the leaf service for 1 user request?',
      unit: 'calls',
      answer: 27,
      tolerance: 0.05,
      explain:
        'Retries multiply across layers: 3 × 3 × 3 = 27 total calls hitting the leaf dependency.',
      step: 'layer-amplification',
    },
    {
      id: 'choice-jitter-purpose',
      kind: 'choice',
      prompt:
        'Why do resilient clients add random jitter to exponential backoff when recovering from a brief outage?',
      options: [
        'To spread retries unevenly over time instead of creating synchronised thundering-herd spikes',
        'To encrypt the request payload before retrying',
        'To ignore the caller’s timeout budget when load is high',
      ],
      answer: 0,
      explain:
        'Pure exponential backoff leaves clients that failed together retrying at the exact same future ticks; jitter desynchronises them.',
      step: 'backoff-jitter',
    },
    {
      id: 'choice-idempotency-key',
      kind: 'choice',
      prompt:
        'A charge commits in the database, but a dropped packet causes the client to time out and retry POST /order. What stops the customer from being billed twice?',
      options: [
        'Sending a client-generated idempotency key so the server replays the stored receipt for duplicate keys',
        'Setting a shorter TCP connect timeout on the retry',
        'Using exponential backoff of 800 ms before the second POST',
      ],
      answer: 0,
      explain:
        'Backoff only changes timing; an idempotency key stored atomically with the payment ensures repeat submissions return the original result.',
      step: 'idempotency-keys',
    },
    {
      id: 'order-safe-retry',
      kind: 'order',
      prompt:
        'Order the safeguards for handling a slow downstream payment dependency without stalling threads or double-charging.',
      items: [
        'Assign a total request timeout budget at the entry service',
        'Abort the downstream call at its bounded timeout before threads fill up',
        'Wait using exponential backoff with jitter if budget remains',
        'Resend the same idempotency key so any prior write deduplicates',
      ],
      explain:
        'First bound the call with a budget and timeout, space retries out with jitter only while budget remains, and carry an idempotency key to prevent duplicates.',
      step: 'idempotency-keys',
    },
  ],
  cards: [
    {
      front:
        'Why can a single missing timeout bring down an entire web server?',
      back: 'By Little’s law (L = λ × W), slow responses pin worker threads and sockets until the pool hits 100% saturation, stalling even healthy routes.',
    },
    {
      front: 'How do timeout budgets work in a multi-hop service chain?',
      back: 'The entry point sets a total request deadline and forwards the remaining budget downstream so hops skip doomed work and never outlive the caller.',
    },
    {
      front: 'Write the formulas for exponential backoff and full jitter.',
      back: '• Backoff: min(cap, base × 2ⁿ)\n• Full jitter: random(0, backoff)\nPair with a retry budget (e.g. ≤10% retries) and retry at one layer only.',
    },
    {
      front: 'What is an idempotency key and when do you need one?',
      back: 'A unique client-supplied token sent with mutating requests (like POST /pay) so the server deduplicates retries and returns the original outcome.',
    },
  ],
} satisfies Lesson;
