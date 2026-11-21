import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 05.04: Circuit Breakers & Bulkheads (`circuit-breakers`).
 * Scenario: A failing recommendations service takes down checkout (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'circuit-breakers',
  learn: [
    'Trace how one failing optional service cascades to checkout',
    'Understand closed, open, and half-open breaker states',
    'Degrade gracefully with fast, independent fallbacks',
    'Isolate thread and connection pools using bulkheads',
    'Protect core paths under overload via load shedding',
  ],
  scene: {
    nodes: [
      {
        id: 'shoppers',
        kind: 'client',
        at: { x: 1, y: 4 },
        label: 'Shoppers',
        sublabel: 'Cart & pay',
      },
      {
        id: 'checkout',
        kind: 'service',
        at: { x: 5, y: 4 },
        label: 'Checkout API',
        sublabel: '100-thread pool',
        load: 0.25,
      },
      {
        id: 'payments',
        kind: 'database',
        at: { x: 10, y: 2 },
        label: 'Payments',
        sublabel: 'Critical path',
      },
      {
        id: 'recs',
        kind: 'service',
        at: { x: 10, y: 7 },
        label: 'Recs Service',
        sublabel: 'Optional upsells',
      },
    ],
    edges: [
      {
        id: 'shoppers-checkout',
        from: 'shoppers',
        to: 'checkout',
        label: 'GET /cart',
      },
      {
        id: 'checkout-pay',
        from: 'checkout',
        to: 'payments',
        label: 'Pay',
      },
      {
        id: 'checkout-recs',
        from: 'checkout',
        to: 'recs',
        label: 'Upsells',
      },
    ],
    zones: [
      {
        id: 'store-zone',
        from: { x: 4, y: 1 },
        to: { x: 12, y: 8 },
        hue: 'violet',
        label: 'E-commerce backend',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'breaker', label: 'Breaker', icon: 'bolt', value: 'Closed' },
    { id: 'checkout-ok', label: 'Checkout OK', icon: 'check', value: '99.9%' },
    { id: 'pool', label: 'Pools', icon: 'layers', value: 'Shared' },
    { id: 'p99', label: 'Cart p99', icon: 'timer', value: '80 ms' },
  ],
  steps: [
    {
      id: 'cascade-outage',
      label: 'Cascade',
      kind: 'problem',
      title: 'Optional recommendations drag checkout down',
      body: [
        'Every cart view asks **Checkout API** to call **Payments** and optional **Recs Service** upsells. Both calls share one 100-thread pool.',
        'Recs hits a broken query and stalls for `2 s`. Soon all 100 threads sit blocked on upsells—preventing paying buyers from reaching Payments in a **cascading failure**.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'recs',
          patch: { state: 'hot', badge: '2 s stall' },
        },
        {
          op: 'update-node',
          id: 'checkout',
          patch: { state: 'hot', load: 1.0, badge: 'Pool stuck' },
        },
        {
          op: 'packet',
          edge: 'checkout-recs',
          kind: 'error',
          count: 4,
          label: '2 s hang',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'shoppers-checkout',
          kind: 'error',
          reverse: true,
          count: 2,
          label: '503 Outage',
          wave: 1,
        },
        { op: 'set-metric', id: 'checkout-ok', value: '12%', tone: 'bad' },
        { op: 'set-metric', id: 'p99', value: '2,400 ms', tone: 'bad' },
      ],
      learns: [0],
    },
    {
      id: 'breaker-states',
      label: 'State machine',
      kind: 'technique',
      title: 'A circuit breaker trips open to fail in < 1 ms',
      body: [
        'Wrap `Recs` calls in a **circuit breaker** state machine:',
        '• **Closed**: calls pass normally while counting failures.\n• **Open**: once error rate crosses a threshold (say `50%` over 20 calls), calls **fail fast** locally in `< 1 ms`.\n• **Half-open**: after a `30 s` cool-down, a few trial calls test recovery.',
      ],
      changes: [
        { type: 'changed', text: 'Breaker trips Open on Recs Service' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'checkout',
          patch: { state: 'focus', load: 0.3, badge: 'Breaker: OPEN' },
        },
        {
          op: 'update-edge',
          id: 'checkout-recs',
          patch: { state: 'broken', label: 'Open (trip)' },
        },
        {
          op: 'add-note',
          note: {
            id: 'breaker-states-note',
            anchor: { at: { x: 3, y: 7 } },
            text: 'Circuit breaker states',
            tone: 'info',
            icon: 'bolt',
            rows: [
              ['Closed', 'Pass + count faults'],
              ['Open', 'Fail fast (0 ms)'],
              ['Half-open', 'Probe recovery'],
            ],
          },
        },
        { op: 'set-metric', id: 'breaker', value: 'Open', tone: 'bad' },
        { op: 'set-metric', id: 'checkout-ok', value: '99.5%', tone: 'good' },
        { op: 'set-metric', id: 'p99', value: '60 ms', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'half-open-probe',
      label: 'Half-open',
      kind: 'technique',
      title: 'Half-open probes safely verify recovery',
      body: [
        'When the `30 s` cool-down timer expires, the breaker moves to **Half-open** and allows **3 trial requests** to touch `Recs Service`.',
        'If all 3 probes succeed fast, the breaker closes and normal upsells resume. If any probe fails, it snaps back to **Open** without overwhelming a recovering service.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'checkout',
          patch: { badge: 'Half-open' },
        },
        {
          op: 'update-node',
          id: 'recs',
          patch: { state: 'focus', badge: 'Recovering' },
        },
        {
          op: 'update-edge',
          id: 'checkout-recs',
          patch: { state: 'normal', style: 'dashed', label: '3 probes' },
        },
        {
          op: 'packet',
          edge: 'checkout-recs',
          kind: 'handshake',
          count: 2,
          label: 'Trial probe',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'checkout-recs',
          kind: 'response',
          reverse: true,
          label: 'Probe OK',
          wave: 1,
        },
        { op: 'set-metric', id: 'breaker', value: 'Half-open', tone: 'normal' },
      ],
    },
    {
      id: 'fallbacks',
      label: 'Fallbacks',
      kind: 'technique',
      title: 'Degrade gracefully with fast local fallbacks',
      body: [
        'While the breaker is **Open**, buyers still see a clean checkout page using a **fallback**: serve generic top-10 bestsellers from an in-memory **Cache**, or hide the upsell strip.',
        'Never query a stalled service inside its own fallback—keep fallback paths local, cheap, and independent.',
      ],
      changes: [
        { type: 'added', text: 'Popular Cache serving local fallback upsells' },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'fallback-cache',
            kind: 'cache',
            at: { x: 7, y: 7 },
            label: 'Popular Cache',
            sublabel: 'Top-10 fallback',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'checkout-cache',
            from: 'checkout',
            to: 'fallback-cache',
            label: 'Fallback',
          },
        },
        {
          op: 'update-node',
          id: 'checkout',
          patch: { badge: 'Open → Cache' },
        },
        {
          op: 'update-node',
          id: 'recs',
          patch: { state: 'down', badge: 'Down' },
        },
        {
          op: 'update-edge',
          id: 'checkout-recs',
          patch: { state: 'broken', style: 'solid', label: 'Bypassed' },
        },
        { op: 'packet', edge: 'checkout-cache', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'checkout-cache',
          kind: 'response',
          reverse: true,
          label: 'Top-10 list',
          wave: 1,
        },
        { op: 'set-metric', id: 'breaker', value: 'Open (cache)', tone: 'good' },
        { op: 'set-metric', id: 'checkout-ok', value: '99.9%', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'bulkheads',
      label: 'Bulkheads',
      kind: 'technique',
      title: 'Bulkheads isolate pools like hull compartments',
      body: [
        'Before a breaker even trips, one slow dependency can starve a shared pool. Like watertight hull **bulkheads** on a ship, split threads and connections into separate pools per dependency.',
        'Give `Payments` **80 dedicated threads** and cap `Recs` at **20 threads**. Even if Recs locks up completely, 80 threads keep Payments flowing.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Bulkheads prevent resource starvation upfront; circuit breakers stop calling broken dependencies reactively.',
        },
      ],
      changes: [
        { type: 'changed', text: 'Checkout pool split into 80 Pay / 20 Recs' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'checkout',
          patch: { badge: '80 Pay / 20 Rec' },
        },
        {
          op: 'update-node',
          id: 'payments',
          patch: { state: 'focus', badge: '80 threads' },
        },
        {
          op: 'update-node',
          id: 'recs',
          patch: { state: 'hot', badge: 'Capped @20' },
        },
        {
          op: 'update-node',
          id: 'fallback-cache',
          patch: { state: 'normal' },
        },
        {
          op: 'update-edge',
          id: 'checkout-recs',
          patch: { state: 'normal', label: '20-pool' },
        },
        {
          op: 'packet',
          edge: 'checkout-pay',
          kind: 'request',
          count: 3,
          label: 'Pay clear',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'checkout-recs',
          kind: 'error',
          label: '20 full',
          wave: 0,
        },
        { op: 'set-metric', id: 'pool', value: '80 / 20 split', tone: 'good' },
        { op: 'set-metric', id: 'breaker', value: 'Closed', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'load-shedding',
      label: 'Load shedding',
      kind: 'case',
      title: 'Shed excess or low-priority load during surges',
      body: [
        'During a flash sale, cart traffic hits `2×` capacity (`1,600 RPS`). Accepting everything into a giant queue makes _every_ buyer time out.',
        '**Load shedding** drops excess or low-priority work early (analytics, upsells, then overflow requests) with `503 + Retry-After`, keeping accepted checkouts crisp at **95 ms**.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'shoppers',
          patch: { state: 'hot', badge: '2× Flash sale' },
        },
        {
          op: 'update-node',
          id: 'checkout',
          patch: { state: 'hot', load: 0.9, badge: 'Shedding excess' },
        },
        {
          op: 'packet',
          edge: 'shoppers-checkout',
          kind: 'request',
          count: 4,
          label: '1,600 RPS',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'shoppers-checkout',
          kind: 'error',
          reverse: true,
          count: 2,
          label: '503 Shed',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'checkout-pay',
          kind: 'write',
          count: 2,
          label: 'Core OK',
          wave: 1,
        },
        { op: 'set-metric', id: 'checkout-ok', value: '95% core', tone: 'good' },
        { op: 'set-metric', id: 'p99', value: '95 ms', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'bad-fallback',
      label: 'Bad fallback',
      kind: 'watch-out',
      title: 'Watch out: shared-fate fallbacks still cascade',
      body: [
        'A fallback that queries the same overloaded database, triggers heavy client retries, or trips on `4xx` user typos defeats your circuit breaker.',
        'Keep fallbacks strictly decoupled—pre-computed in memory or omitted cleanly—and trip breakers only on timeouts and `5xx` faults.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'A fallback that hits the same broken dependency is not a fallback.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'shoppers',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'checkout',
          patch: { state: 'normal', load: 0.35, badge: 'Isolated' },
        },
        {
          op: 'update-node',
          id: 'fallback-cache',
          patch: { state: 'hot', badge: 'No shared DB!' },
        },
        {
          op: 'update-note',
          id: 'breaker-states-note',
          patch: {
            text: 'Fallback rules',
            tone: 'bad',
            icon: 'warning',
            rows: [
              ['Bad', 'Hits same slow DB'],
              ['Good', 'Local / cached / []'],
            ],
          },
        },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Contain faults so critical paths stay healthy',
      body: [
        'Bulkheads wall off resource pools, circuit breakers cut off failing dependencies fast, independent fallbacks preserve user experience, and load shedding saves core work under surges.',
      ],
      ops: [
        { op: 'remove-note', id: 'breaker-states-note' },
        {
          op: 'update-node',
          id: 'checkout',
          patch: { state: 'normal', load: 0.25, badge: null },
        },
        {
          op: 'update-node',
          id: 'payments',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'recs',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'fallback-cache',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'resilience-summary',
            anchor: { at: { x: 3, y: 7 } },
            text: 'Fault containment',
            tone: 'good',
            icon: 'shield',
            rows: [
              ['Bulkhead', 'Isolate pools upfront'],
              ['Breaker', 'Fail fast when broken'],
              ['Fallback', 'Cheap + independent'],
              ['Shed load', 'Drop excess with 503'],
            ],
          },
        },
        { op: 'set-metric', id: 'checkout-ok', value: '99.9%', tone: 'good' },
        { op: 'set-metric', id: 'p99', value: '80 ms', tone: 'good' },
      ],
      takeaways: [
        'Circuit breakers stop cascading failures by failing fast when error thresholds trip',
        'Breakers cycle Closed → Open (fallback) → Half-open (trial probes) → Closed',
        'Bulkheads split thread and connection pools so slow optional calls cannot starve core paths',
        'Load shedding drops excess or non-essential requests early to protect core latency',
      ],
    },
  ],
  checks: [
    {
      id: 'order-breaker-lifecycle',
      kind: 'order',
      prompt:
        'Order the circuit-breaker lifecycle from healthy traffic through an outage and recovery.',
      items: [
        'Closed: calls pass through and failure rates are monitored',
        'Open: error threshold trips; calls fail fast and return a fallback',
        'Half-open: cool-down expires and a few probe requests test recovery',
        'Closed: probes succeed and full traffic resumes',
      ],
      explain:
        'A healthy breaker starts Closed, trips Open to shed doomed calls, probes in Half-open after a cool-down, and returns to Closed once probes pass.',
      step: 'breaker-states',
    },
    {
      id: 'choice-bulkhead-purpose',
      kind: 'choice',
      prompt:
        'How does a bulkhead stop a slow recommendations dependency from blocking payments inside Checkout API?',
      options: [
        'It assigns separate bounded thread/connection pools to each dependency so one cannot exhaust the other’s pool',
        'It automatically scales the recommendations database to 10× more CPU cores',
        'It retries recommendations calls indefinitely until payments succeed',
      ],
      answer: 0,
      explain:
        'Bulkheads isolate resources per dependency (like watertight ship compartments) so a hung pool never starves critical paths.',
      step: 'bulkheads',
    },
    {
      id: 'choice-load-shedding',
      kind: 'choice',
      prompt:
        'During a 2× traffic spike, queues grow so long that every checkout times out. What is the goal of load shedding?',
      options: [
        'Reject excess or low-priority requests early (e.g. HTTP 503) so accepted requests finish within SLA',
        'Buffer all excess requests in RAM for 60 seconds without dropping any',
        'Turn off timeouts so waiting requests never see errors',
      ],
      answer: 0,
      explain:
        'Doing partial work on doomed requests wastes capacity; shedding overload early preserves good throughput and low latency for accepted traffic.',
      step: 'load-shedding',
    },
    {
      id: 'numeric-bulkhead-pool',
      kind: 'numeric',
      prompt:
        'Checkout API has 100 worker threads partitioned with bulkheads: 75 reserved for Payments and 25 for Recommendations. If Recommendations hangs completely, how many threads remain available for Payments?',
      unit: 'threads',
      answer: 75,
      tolerance: 0.05,
      explain:
        'Because the pools are partitioned, Recommendations can saturate at most its 25 threads, leaving all 75 Payments threads free.',
      step: 'bulkheads',
    },
  ],
  cards: [
    {
      front: 'What are the three states of a circuit breaker?',
      back: '• Closed: requests pass through, failures counted.\n• Open: calls fail fast locally (return fallback) until cool-down expires.\n• Half-open: limited trial probes test whether to close or re-open.',
    },
    {
      front: 'How do bulkheads complement circuit breakers?',
      back: 'Bulkheads isolate thread, connection, or instance pools upfront so one slow dependency cannot starve others before a breaker even trips.',
    },
    {
      front: 'What makes a good circuit-breaker fallback?',
      back: 'Fast, local or pre-cached (or gracefully omitted), and completely independent of the broken dependency so it never shares fate.',
    },
    {
      front: 'What is load shedding and when should a service use it?',
      back: 'Intentionally dropping excess or low-priority requests early (returning 503/429) during overload so accepted core traffic stays fast instead of every request timing out.',
    },
  ],
} satisfies Lesson;
