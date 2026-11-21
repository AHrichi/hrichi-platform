import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 08.01: Testing Distributed Systems (`testing-at-scale`).
 * Scenario: Green tests, broken production (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'testing-at-scale',
  learn: [
    'Balance unit, integration, and end-to-end tests',
    'Catch API drift early with consumer contract tests',
    'Test queries and queues against real dependencies',
    'Uncover bottlenecks with load and soak tests',
    'Verify timeouts and failover with chaos experiments',
  ],
  scene: {
    nodes: [
      {
        id: 'ci-runner',
        kind: 'worker',
        at: { x: 1, y: 4 },
        label: 'CI Test Suite',
        sublabel: '240 unit tests',
      },
      {
        id: 'order-api',
        kind: 'service',
        at: { x: 5, y: 4 },
        label: 'Order API',
        sublabel: 'Checkout service',
      },
      {
        id: 'billing-api',
        kind: 'external',
        at: { x: 10, y: 2 },
        label: 'Billing API',
        sublabel: 'Provider service',
      },
      {
        id: 'orders-db',
        kind: 'database',
        at: { x: 10, y: 6 },
        label: 'Orders DB',
        sublabel: 'Postgres',
      },
    ],
    edges: [
      {
        id: 'ci-order',
        from: 'ci-runner',
        to: 'order-api',
        label: 'mocked run',
        style: 'dashed',
      },
      {
        id: 'order-billing',
        from: 'order-api',
        to: 'billing-api',
        label: 'POST /charge',
      },
      {
        id: 'order-db',
        from: 'order-api',
        to: 'orders-db',
        label: 'SQL',
      },
    ],
    zones: [
      {
        id: 'prod-zone',
        from: { x: 4, y: 1 },
        to: { x: 11, y: 8 },
        hue: 'teal',
        label: 'Production mesh',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'suite-time', label: 'Suite time', icon: 'timer', value: '12 s' },
    { id: 'confidence', label: 'Prod safety', icon: 'shield', value: 'Low' },
    { id: 'p99', label: 'Peak p99', icon: 'gauge', value: '—' },
    { id: 'bugs-caught', label: 'Bugs caught', icon: 'check', value: '0 / 4' },
  ],
  steps: [
    {
      id: 'green-lies',
      label: 'Green CI',
      kind: 'problem',
      title: 'All 240 unit tests pass, yet prod breaks',
      body: [
        'Your CI pipeline finishes in **12 seconds**: all 240 unit tests are green. Confident, you ship **Order API** to production—and checkout immediately throws `500` errors.',
        'Every unit test mocked out **Billing API**, **Orders DB**, and the queue. Green mocks only prove your code matches your guesses, not real production behaviour.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'ci-runner',
          patch: { state: 'focus', badge: '240 pass' },
        },
        {
          op: 'update-node',
          id: 'order-api',
          patch: { state: 'hot', badge: '500 errors' },
        },
        {
          op: 'packet',
          edge: 'order-billing',
          kind: 'error',
          reverse: true,
          label: 'Bad JSON',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'order-db',
          kind: 'error',
          reverse: true,
          label: 'SQL fail',
          wave: 0,
        },
        {
          op: 'add-note',
          note: {
            id: 'prod-alert',
            anchor: { at: { x: 6, y: 9 } },
            text: 'Green unit mocks ≠ safe release',
            tone: 'bad',
            icon: 'warning',
          },
        },
      ],
    },
    {
      id: 'test-pyramid',
      label: 'The pyramid',
      kind: 'technique',
      title: 'Shape tests by speed and blast radius',
      body: [
        'The _test pyramid_ keeps hundreds of fast **unit tests** at the wide base to check pure logic in milliseconds.',
        'Above them sit fewer **contract** and **integration tests** for service seams, topped by a thin slice of slow **end-to-end tests** for critical user flows.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Catch logic errors at the fast unit base; save slower tests for real boundaries.',
        },
      ],
      changes: [
        { type: 'added', text: 'Test pyramid guide by speed and scope' },
      ],
      ops: [
        { op: 'remove-note', id: 'prod-alert' },
        {
          op: 'update-node',
          id: 'ci-runner',
          patch: { state: 'focus', badge: 'Pyramid' },
        },
        {
          op: 'update-node',
          id: 'order-api',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'pyramid-table',
            anchor: { at: { x: 6, y: 9 } },
            text: 'Test pyramid layers',
            tone: 'info',
            icon: 'layers',
            rows: [
              ['Unit (base)', 'ms · pure logic'],
              ['Contract / Int', 'sec · real seams'],
              ['E2E (peak)', 'min · key flows'],
            ],
            total: ['Rule', 'Keep E2E suites small'],
          },
        },
      ],
      learns: [0],
    },
    {
      id: 'contract-tests',
      label: 'Contracts',
      kind: 'technique',
      title: 'Catch schema drift with contract tests',
      body: [
        '**Billing API** renamed `total_cents` to `amount_cents`, breaking **Order API** at runtime while mocked unit tests still passed.',
        'With **consumer-driven contract tests**, Order records the request and response shapes it expects in a shared broker. Billing replays those contracts in CI and fails before merging breaking changes.',
      ],
      callouts: [
        {
          kind: 'good-to-know',
          text: 'Contracts verify API shape and status codes, not business logic—still pair them with real integration tests.',
        },
      ],
      changes: [
        { type: 'added', text: 'Contract Broker between Order and Billing' },
        { type: 'changed', text: 'Schema rename caught in CI (1 / 4)' },
      ],
      ops: [
        { op: 'remove-note', id: 'pyramid-table' },
        {
          op: 'add-node',
          node: {
            id: 'contract-broker',
            kind: 'storage',
            at: { x: 2, y: 1 },
            label: 'Contract Broker',
            sublabel: 'Consumer specs',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'order-contract',
            from: 'order-api',
            to: 'contract-broker',
            label: 'publish spec',
            style: 'dashed',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'billing-contract',
            from: 'contract-broker',
            to: 'billing-api',
            label: 'verify PR',
            style: 'dashed',
          },
        },
        {
          op: 'update-node',
          id: 'billing-api',
          patch: { state: 'focus', badge: 'PR blocked' },
        },
        {
          op: 'packet',
          edge: 'order-contract',
          kind: 'write',
          label: 'expects total_cents',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'billing-contract',
          kind: 'error',
          reverse: true,
          label: 'drift caught',
          wave: 1,
        },
        { op: 'set-metric', id: 'suite-time', value: '20 s' },
        { op: 'set-metric', id: 'bugs-caught', value: '1 / 4' },
        { op: 'set-metric', id: 'confidence', value: 'Fair' },
      ],
      learns: [1],
    },
    {
      id: 'real-integration',
      label: 'Integration',
      kind: 'technique',
      title: 'Run integration tests on real dependencies',
      body: [
        'In-memory fakes miss real SQL locks, constraints, and queue serialization rules.',
        '**Integration tests** spin up ephemeral containers for **Postgres** and **Shipping Queue** in CI. **Order API** tests real queries, transactions, and message formats in seconds before shipping.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Ephemeral Postgres container and real Shipping Queue',
        },
        { type: 'changed', text: 'SQL and broker quirks caught (2 / 4)' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'billing-api',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'contract-broker',
          patch: { state: 'dim' },
        },
        {
          op: 'add-node',
          node: {
            id: 'test-db',
            kind: 'database',
            at: { x: 1, y: 7 },
            label: 'Ephemeral DB',
            sublabel: 'Real Postgres',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'ship-queue',
            kind: 'queue',
            at: { x: 7, y: 7 },
            label: 'Shipping Queue',
            sublabel: 'Real broker',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'ci-testdb',
            from: 'ci-runner',
            to: 'test-db',
            label: 'real SQL',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'order-queue',
            from: 'order-api',
            to: 'ship-queue',
            label: 'OrderPaid',
          },
        },
        {
          op: 'packet',
          edge: 'ci-testdb',
          kind: 'write',
          label: 'locks & types',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'order-queue',
          kind: 'event',
          label: 'real payload',
          wave: 0,
        },
        { op: 'set-metric', id: 'suite-time', value: '90 s' },
        { op: 'set-metric', id: 'bugs-caught', value: '2 / 4' },
        { op: 'set-metric', id: 'confidence', value: 'Medium' },
      ],
      learns: [2],
    },
    {
      id: 'load-tests',
      label: 'Load tests',
      kind: 'case',
      title: 'Simulate peak traffic to expose bottlenecks',
      body: [
        'Single-user tests pass, then Black Friday hits **800 RPS**. A **load test** ramps realistic traffic to expose an unindexed query saturating **Orders DB** and pushing `p99` to **2,400 ms**.',
        'Also run multi-hour **soak tests** at steady load to catch slow memory leaks or leaked database connections.',
      ],
      changes: [
        { type: 'added', text: 'Load Generator ramping 800 RPS traffic' },
        { type: 'changed', text: 'DB pool bottleneck caught (3 / 4)' },
      ],
      ops: [
        { op: 'update-node', id: 'test-db', patch: { state: 'dim' } },
        { op: 'update-node', id: 'ship-queue', patch: { state: 'normal' } },
        {
          op: 'add-node',
          node: {
            id: 'load-gen',
            kind: 'client',
            at: { x: 3, y: 6 },
            label: 'Load Generator',
            sublabel: '800 RPS ramp',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'load-order',
            from: 'load-gen',
            to: 'order-api',
            label: '800 RPS',
          },
        },
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'hot', load: 0.96, badge: 'Pool full' },
        },
        {
          op: 'update-node',
          id: 'order-api',
          patch: { state: 'hot', load: 0.92, badge: 'p99 2.4 s' },
        },
        {
          op: 'packet',
          edge: 'load-order',
          kind: 'request',
          count: 4,
          label: '800 RPS',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'order-db',
          kind: 'write',
          count: 3,
          label: 'Full scan',
          wave: 1,
        },
        { op: 'set-metric', id: 'p99', value: '2,400 ms', tone: 'bad' },
        { op: 'set-metric', id: 'bugs-caught', value: '3 / 4' },
      ],
      learns: [3],
    },
    {
      id: 'chaos-experiments',
      label: 'Chaos drills',
      kind: 'technique',
      title: 'Inject faults to prove resilience holds',
      body: [
        'After fixing the index, timeouts and fallbacks still remain untested on real faults.',
        'A **chaos experiment** forms a hypothesis, injects a controlled fault—like stalling **Billing API** for **5%** of traffic—and verifies **Order API** times out cleanly and queues retries without stalling checkout.',
      ],
      changes: [
        { type: 'added', text: 'Chaos Runner injecting 5% fault into Billing' },
        { type: 'changed', text: 'Timeout and fallback verified (4 / 4)' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'normal', load: 0.4, badge: 'indexed' },
        },
        {
          op: 'update-node',
          id: 'order-api',
          patch: { state: 'focus', load: 0.45, badge: 'fallback ok' },
        },
        {
          op: 'add-node',
          node: {
            id: 'chaos-agent',
            kind: 'scheduler',
            at: { x: 13, y: 3 },
            label: 'Chaos Runner',
            sublabel: '5% fault inject',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'chaos-billing',
            from: 'chaos-agent',
            to: 'billing-api',
            label: '2 s stall',
            style: 'dashed',
          },
        },
        {
          op: 'update-node',
          id: 'billing-api',
          patch: { state: 'down', badge: '2 s fault' },
        },
        {
          op: 'packet',
          edge: 'order-billing',
          kind: 'error',
          label: '500 ms timeout',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'order-queue',
          kind: 'event',
          label: 'queued retry',
          wave: 1,
        },
        { op: 'set-metric', id: 'p99', value: '75 ms', tone: 'good' },
        { op: 'set-metric', id: 'bugs-caught', value: '4 / 4', tone: 'good' },
        { op: 'set-metric', id: 'confidence', value: 'High', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'staging-and-blast',
      label: 'Watch out',
      kind: 'watch-out',
      title: 'Watch out for staging skew and wide chaos',
      body: [
        'Load tests against tiny staging tables or uniform IDs miss hot keys and full scans that only hit 50-million-row production data.',
        'Meanwhile, chaos without a strict **blast radius** and automated abort switch turns an exercise into an outage—and bloated end-to-end suites grind deploys to a halt.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never run chaos experiments without a capped blast radius and an automated kill switch when user errors spike.',
        },
      ],
      changes: [
        { type: 'added', text: 'Blast radius and staging skew warning' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'billing-api',
          patch: { state: 'hot', badge: '25% bleed' },
        },
        {
          op: 'update-node',
          id: 'chaos-agent',
          patch: { state: 'hot', badge: 'ABORT!' },
        },
        {
          op: 'packet',
          edge: 'chaos-billing',
          kind: 'error',
          count: 2,
          label: 'Abort drill',
          wave: 0,
        },
        {
          op: 'add-note',
          note: {
            id: 'watch-note',
            anchor: { at: { x: 6, y: 9 } },
            text: 'Cap blast radius · Mirror prod data skew',
            tone: 'bad',
            icon: 'warning',
          },
        },
        { op: 'set-metric', id: 'confidence', value: 'Guardrails' },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Test seams, scale, and failure before users do',
      body: [
        'Distributed bugs hide between services, under load, and during partial failures. Layer fast unit tests with contracts, real-dependency integration, load tests, and bounded chaos so green builds predict calm production.',
      ],
      ops: [
        { op: 'remove-note', id: 'watch-note' },
        {
          op: 'update-node',
          id: 'billing-api',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'order-api',
          patch: { state: 'normal', load: 0.4, badge: null },
        },
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'normal', load: 0.4, badge: null },
        },
        {
          op: 'update-node',
          id: 'chaos-agent',
          patch: { state: 'normal', badge: '1% capped' },
        },
        {
          op: 'update-node',
          id: 'contract-broker',
          patch: { state: 'normal' },
        },
        { op: 'update-node', id: 'test-db', patch: { state: 'normal' } },
        { op: 'update-node', id: 'load-gen', patch: { state: 'normal' } },
        {
          op: 'add-note',
          note: {
            id: 'summary-table',
            anchor: { at: { x: 6, y: 9 } },
            text: 'Testing layers by risk',
            tone: 'info',
            icon: 'check',
            rows: [
              ['Unit & Contract', 'Logic + API shape (sec)'],
              ['Integration', 'Real DB & queue (min)'],
              ['Load & Chaos', 'Scale + resilience'],
            ],
            total: ['Caught', '4 / 4 failure modes'],
          },
        },
        { op: 'set-metric', id: 'confidence', value: 'High', tone: 'good' },
        { op: 'set-metric', id: 'p99', value: '65 ms', tone: 'good' },
      ],
      takeaways: [
        'Keep a wide unit-test base for logic and a slim E2E peak for critical journeys',
        'Use consumer-driven contract tests to catch breaking API changes before deploy',
        'Run integration tests against real databases and queues, not in-memory fakes',
        'Run load tests for capacity and p99 latency, plus soak tests for slow leaks',
        'Run bounded chaos experiments to verify timeouts, retries, and failovers',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-contract-vs-unit',
      kind: 'choice',
      prompt:
        'All 240 unit tests pass in CI, yet production fails when Billing API renames total_cents to amount_cents. Why did unit tests miss it?',
      options: [
        'Unit test mocks encoded stale assumptions instead of verifying the real API contract',
        'Unit tests cannot run over localhost ports',
        'JSON field renames only fail inside SQL databases',
        'Unit tests ignore synchronous HTTP responses',
      ],
      answer: 0,
      explain:
        'Mocks return whatever payload you wrote when creating the test. Consumer-driven contract tests verify that the provider still honours the shape consumers rely on.',
      step: 'contract-tests',
    },
    {
      id: 'choice-integration-real-deps',
      kind: 'choice',
      prompt:
        'A service relies on Postgres advisory locks and unique constraints. Which test setup catches constraint and locking bugs most reliably before release?',
      options: [
        'Integration tests running against an ephemeral Postgres container',
        'Swapping Postgres for an in-memory map during unit tests',
        'Adding more mocked unit tests on the controller',
        'Skipping database tests until production canary',
      ],
      answer: 0,
      explain:
        'In-memory fakes skip real SQL lock semantics and schema constraints; ephemeral containers test the real database engine.',
      step: 'real-integration',
    },
    {
      id: 'numeric-blast-radius',
      kind: 'numeric',
      prompt:
        'A checkout service serves 1,200 RPS. Your chaos runner injects a controlled latency fault into 2% of requests. How many requests per second experience the injected fault?',
      unit: 'RPS',
      answer: 24,
      tolerance: 0.05,
      explain: '2% of 1,200 RPS = 0.02 × 1,200 = 24 requests per second.',
      step: 'chaos-experiments',
    },
    {
      id: 'order-testing-layers',
      kind: 'order',
      prompt:
        'Order these test layers from fastest feedback and largest count to slowest feedback and smallest count.',
      items: [
        'Unit tests (isolated functions in milliseconds)',
        'Contract tests (API payload shapes in seconds)',
        'Integration tests (real database and queue containers)',
        'End-to-end & load tests (full stack journeys and traffic peaks)',
      ],
      explain:
        'The test pyramid starts wide and fast with unit and contract tests, adds focused integration tests, and keeps slow end-to-end and load tests narrow and purposeful.',
      step: 'test-pyramid',
    },
  ],
  cards: [
    {
      front: 'What is the test pyramid?',
      back: 'A test distribution with many fast unit tests at the base, fewer contract and integration tests in the middle, and very few slow end-to-end tests at the top.',
    },
    {
      front: 'How do consumer-driven contract tests work?',
      back: 'Consumers record the request and response expectations they depend on; providers replay those contracts in CI so breaking API changes fail before merge.',
    },
    {
      front: 'Why test against real dependencies instead of in-memory fakes?',
      back: 'Fakes miss real SQL locks, unique constraints, serialization quirks, and broker retries; ephemeral containers catch those boundary bugs early.',
    },
    {
      front: 'Load testing vs. chaos engineering: what does each prove?',
      back: 'Load testing proves throughput and p99 latency under peak traffic (and soak tests catch leaks); chaos experiments inject controlled faults to verify timeouts, retries, and failover.',
    },
  ],
} satisfies Lesson;
