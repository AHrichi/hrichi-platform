import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 01.02: Latency vs Throughput (`latency-throughput`).
 * Scenario: Lunchtime rush on a checkout API (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'latency-throughput',
  learn: [
    'The difference between latency (ms) and throughput (RPS)',
    'Why percentiles (p50, p95, p99) beat simple averages',
    'How high utilisation causes queueing latency to explode',
    'How Little’s law links concurrency, throughput, and latency',
  ],
  scene: {
    nodes: [
      {
        id: 'buyers',
        kind: 'client',
        at: { x: 1, y: 4 },
        label: 'Lunch buyers',
        sublabel: 'Checkout app',
      },
      {
        id: 'checkout',
        kind: 'server',
        at: { x: 6, y: 4 },
        label: 'Checkout API',
        sublabel: '800 RPS cap',
        load: 0.25,
      },
      {
        id: 'orders-db',
        kind: 'database',
        at: { x: 11, y: 4 },
        label: 'Orders DB',
        sublabel: 'Primary',
      },
    ],
    edges: [
      {
        id: 'buyers-checkout',
        from: 'buyers',
        to: 'checkout',
        label: 'POST /pay',
      },
      { id: 'checkout-db', from: 'checkout', to: 'orders-db', label: 'SQL' },
    ],
    zones: [
      {
        id: 'backend-zone',
        from: { x: 5, y: 2 },
        to: { x: 12, y: 6 },
        hue: 'blue',
        label: 'Checkout service',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'rps', label: 'RPS', icon: 'gauge', value: '200' },
    { id: 'p50', label: 'p50', icon: 'timer', value: '25 ms' },
    { id: 'p99', label: 'p99', icon: 'warning', value: '45 ms' },
    { id: 'util', label: 'Util', icon: 'chart', value: '25%' },
  ],
  steps: [
    {
      id: 'morning-calm',
      label: 'Morning calm',
      kind: 'problem',
      title: 'Fast at 10 AM, crawling at noon',
      body: [
        'At 10:00 AM your food-delivery **Checkout API** handles **200 requests per second** (`RPS`) in a brisk **25 ms**. Nobody deployed new code all morning.',
        'At 12:15 PM lunch orders surge and buyers complain that paying takes almost **two seconds**. Why does an unchanged server suddenly feel ten times slower?',
      ],
      ops: [
        { op: 'packet', edge: 'buyers-checkout', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'checkout-db', kind: 'write', wave: 1 },
        {
          op: 'packet',
          edge: 'buyers-checkout',
          kind: 'response',
          reverse: true,
          wave: 2,
        },
      ],
    },
    {
      id: 'two-measures',
      label: 'Two measures',
      kind: 'technique',
      title: 'Latency is duration; throughput is rate',
      body: [
        '**Latency** is how long _one_ request takes from start to finish, measured in milliseconds (`ms`). **Throughput** is how many requests the system finishes per second (`RPS`).',
        'Like a highway, adding more lanes lets more cars pass per minute (throughput) without making the speed limit any faster (latency).',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Latency measures time per request (ms). Throughput measures requests per unit time (RPS).',
        },
      ],
      changes: [
        {
          type: 'changed',
          text: 'Traffic doubles to 400 RPS at 50% utilisation',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'checkout',
          patch: { state: 'focus', load: 0.5 },
        },
        {
          op: 'packet',
          edge: 'buyers-checkout',
          kind: 'request',
          count: 2,
          label: '400 RPS',
          wave: 0,
        },
        { op: 'set-metric', id: 'rps', value: '400' },
        { op: 'set-metric', id: 'p50', value: '28 ms' },
        { op: 'set-metric', id: 'p99', value: '65 ms' },
        { op: 'set-metric', id: 'util', value: '50%' },
      ],
      learns: [0],
    },
    {
      id: 'percentiles',
      label: 'Percentiles',
      kind: 'technique',
      title: 'Read percentiles, not averages',
      body: [
        'If 99 buyers wait **30 ms** and 1 buyer waits **2,030 ms**, the arithmetic average is **50 ms**—hiding the worst pain. Sort latencies from fastest to slowest to read _percentiles_:',
        '`p50` (the median) is what half of requests beat; `p95` and `p99` show the **tail latency** experienced by your slowest 5% and 1% of traffic.',
      ],
      changes: [{ type: 'added', text: 'Percentile note on the Checkout API' }],
      ops: [
        {
          op: 'add-note',
          note: {
            id: 'percentile-note',
            anchor: { node: 'checkout' },
            text: 'p50: 28 ms · p99: 65 ms',
            tone: 'info',
            icon: 'chart',
          },
        },
      ],
      learns: [1],
    },
    {
      id: 'utilization',
      label: 'Utilisation',
      kind: 'technique',
      title: 'Busy servers build a waiting line',
      body: [
        '**Utilisation** is arrival rate divided by capacity (`RPS / 800`). Requests do not arrive spaced like a metronome; they arrive in clumps.',
        'Below **60%** utilisation, spare capacity absorbs bursts immediately. Past **80%**, bursts arrive while workers are still busy, so requests queue in memory waiting for a free worker.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'checkout',
          patch: { load: 0.75, badge: 'queueing' },
        },
        {
          op: 'packet',
          edge: 'buyers-checkout',
          kind: 'request',
          count: 3,
          label: '600 RPS',
          wave: 0,
        },
        { op: 'set-metric', id: 'rps', value: '600' },
        { op: 'set-metric', id: 'p50', value: '60 ms' },
        { op: 'set-metric', id: 'p99', value: '240 ms' },
        { op: 'set-metric', id: 'util', value: '75%' },
      ],
      learns: [2],
    },
    {
      id: 'lunch-rush',
      label: 'Lunch rush',
      kind: 'case',
      title: 'At 95% utilisation, queue wait dominates',
      body: [
        'At 12:15 PM traffic hits **760 RPS** (**95%** of the 800 RPS ceiling). The actual CPU and SQL work is still 20 ms, but each request sits behind a dozen others first.',
        'Waiting time scales with `1 / (1 - util)`: going from 50% to 95% utilisation multiplies latency tenfold (`p50` **250 ms**, `p99` **1,800 ms**).',
      ],
      changes: [
        {
          type: 'changed',
          text: 'Utilisation hits 95%; p99 spikes to 1,800 ms',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'checkout',
          patch: { state: 'hot', load: 0.95, badge: '95% util' },
        },
        {
          op: 'update-note',
          id: 'percentile-note',
          patch: {
            text: '20 ms work + 1,780 ms queue',
            tone: 'bad',
          },
        },
        {
          op: 'packet',
          edge: 'buyers-checkout',
          kind: 'request',
          count: 4,
          label: '760 RPS',
          wave: 0,
        },
        { op: 'set-metric', id: 'rps', value: '760' },
        { op: 'set-metric', id: 'p50', value: '250 ms', tone: 'bad' },
        { op: 'set-metric', id: 'p99', value: '1,800 ms', tone: 'bad' },
        { op: 'set-metric', id: 'util', value: '95%', tone: 'bad' },
      ],
    },
    {
      id: 'littles-law',
      label: 'Little’s law',
      kind: 'technique',
      title: 'In-flight requests = throughput × latency',
      body: [
        '_Little’s law_ states `L = λ × W`: the average number of requests in flight (`L`) equals throughput (`λ`) times average latency in seconds (`W`).',
        'At **200 RPS** and **0.025 s**, only **5** requests are in flight. At **760 RPS** and **0.5 s** average latency, **380** requests occupy sockets and DB connections at once.',
      ],
      callouts: [
        {
          kind: 'good-to-know',
          text: 'Little’s law (L = λ × W) tells you how large a thread or connection pool must be before it starves.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'focus', badge: '380 conns' },
        },
        {
          op: 'packet',
          edge: 'checkout-db',
          kind: 'write',
          count: 3,
          label: '380 in flight',
          wave: 0,
        },
      ],
      learns: [3],
    },
    {
      id: 'ceiling',
      label: 'Saturation',
      kind: 'watch-out',
      title: 'Past the capacity ceiling, throughput drops',
      body: [
        'When demand reaches **900 RPS** on an **800 RPS** server, the queue grows without bound. Connections time out, clients retry, and lock contention makes good throughput fall below 800.',
        'Run production services with headroom (typically **50–70% utilisation**) or scale out before the knee of the curve.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never capacity-plan for 100% utilisation: the latency hockey-stick bends sharply around 75–85%.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'checkout',
          patch: { state: 'hot', load: 1.0, badge: '503 drops' },
        },
        {
          op: 'packet',
          edge: 'buyers-checkout',
          kind: 'error',
          reverse: true,
          count: 2,
          label: '503 Timeout',
          wave: 0,
        },
        { op: 'set-metric', id: 'rps', value: '720', tone: 'bad' },
        { op: 'set-metric', id: 'p50', value: '950 ms', tone: 'bad' },
        { op: 'set-metric', id: 'p99', value: '5,000 ms', tone: 'bad' },
        { op: 'set-metric', id: 'util', value: '100%', tone: 'bad' },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Keep headroom below the queueing knee',
      body: [
        'A service gets slow under load long before it runs out of raw instructions: queueing turns small bursts into multi-second tail latencies as utilisation approaches 100%.',
      ],
      ops: [
        { op: 'remove-note', id: 'percentile-note' },
        {
          op: 'update-node',
          id: 'checkout',
          patch: { state: 'normal', load: 0.5, badge: null },
        },
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'headroom-table',
            anchor: { at: { x: 6, y: 7 } },
            text: '800 RPS server under load',
            tone: 'info',
            icon: 'gauge',
            rows: [
              ['200 RPS (25%)', 'p99 45 ms'],
              ['400 RPS (50%)', 'p99 65 ms'],
              ['760 RPS (95%)', 'p99 1,800 ms'],
            ],
            total: ['Safe target', '≤ 70% util'],
          },
        },
        { op: 'set-metric', id: 'rps', value: '400', tone: 'normal' },
        { op: 'set-metric', id: 'p50', value: '28 ms', tone: 'good' },
        { op: 'set-metric', id: 'p99', value: '65 ms', tone: 'good' },
        { op: 'set-metric', id: 'util', value: '50%', tone: 'good' },
      ],
      takeaways: [
        'Latency is time per request (ms); throughput is requests completed per second (RPS)',
        'Track p50, p95, and p99 percentiles—averages hide tail latency spikes',
        'Queueing delay grows non-linearly past ~75–80% utilisation',
        'Little’s law (L = λ × W) gives the concurrent requests in flight',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-percentile-meaning',
      kind: 'choice',
      prompt:
        'An API reports p50 = 30 ms and p99 = 900 ms at 1,000 RPS. What does p99 = 900 ms mean?',
      options: [
        '1% of requests (about 10 per second) take 900 ms or longer',
        '99% of requests take 900 ms or longer',
        'The average request takes 465 ms',
      ],
      answer: 0,
      explain:
        'The 99th percentile is the threshold that 99% of requests beat and the slowest 1% reach or exceed.',
      step: 'percentiles',
    },
    {
      id: 'numeric-littles-law',
      kind: 'numeric',
      prompt:
        'Using Little’s law (L = λ × W), if a service handles 500 RPS with an average response time of 0.2 seconds (200 ms), how many requests are in flight concurrently on average?',
      unit: 'requests',
      answer: 100,
      tolerance: 0.05,
      explain:
        'L = 500 requests/s × 0.2 s = 100 concurrent requests in flight.',
      step: 'littles-law',
    },
    {
      id: 'choice-queueing-knee',
      kind: 'choice',
      prompt:
        'Why does response latency jump sharply when a server moves from 50% to 95% utilisation, even though per-request CPU work stays constant?',
      options: [
        'Random arrival bursts must wait in a queue because workers are almost always busy',
        'The CPU clock frequency slows down at 95% load',
        'TCP packets double in byte size above 80% utilisation',
      ],
      answer: 0,
      explain:
        'Queue waiting time scales roughly with 1 / (1 − utilisation); near 95% there is almost no idle slack to drain arrival bursts.',
      step: 'lunch-rush',
    },
  ],
  cards: [
    {
      front: 'How do latency and throughput differ?',
      back: 'Latency is the time to complete one request (ms); throughput is the rate of requests completed per unit time (RPS).',
    },
    {
      front: 'Why use p50, p95, and p99 instead of average latency?',
      back: 'Averages hide outliers; p95 and p99 reveal the tail latency experienced by the slowest 5% and 1% of requests.',
    },
    {
      front: 'What happens to latency as server utilisation approaches 100%?',
      back: 'Queueing delay grows non-linearly (roughly 1 / (1 − ρ)), causing p95 and p99 latency to explode past ~75–85% utilisation.',
    },
    {
      front: 'State Little’s law for a request-handling service.',
      back: 'L = λ × W: average concurrent requests in flight (L) equals throughput (λ, in RPS) times mean response time (W, in seconds).',
    },
  ],
} satisfies Lesson;
