import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 09.01: A Method for Design Problems (`design-method`).
 * Scenario: One vague prompt, 45 minutes (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'design-method',
  learn: [
    'How to scope functional and non-functional requirements',
    'How back-of-the-envelope estimates shape the architecture',
    'How to define the API and data model before drawing boxes',
    'How to progress from high-level design to deep dives',
    'Where High-Level Design (HLD) stops and LLD begins',
  ],
  scene: {
    nodes: [
      {
        id: 'caller',
        kind: 'client',
        at: { x: 1, y: 5 },
        label: 'Caller service',
        sublabel: 'Triggers alerts',
      },
      {
        id: 'notif-api',
        kind: 'server',
        at: { x: 7, y: 5 },
        label: 'Notify system',
        sublabel: '45-min prompt',
      },
    ],
    edges: [
      {
        id: 'caller-api',
        from: 'caller',
        to: 'notif-api',
        label: 'Alert?',
      },
    ],
    zones: [
      {
        id: 'design-board',
        from: { x: 3, y: 1 },
        to: { x: 13, y: 9 },
        hue: 'violet',
        label: '45-min design board',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'clock', label: 'Time left', icon: 'clock', value: '45 min' },
    { id: 'phase', label: 'Phase', icon: 'layers', value: 'Prompt' },
    { id: 'rps', label: 'Peak RPS', icon: 'gauge', value: '—' },
    { id: 'focus', label: 'Focus', icon: 'search', value: 'Scope' },
  ],
  steps: [
    {
      id: 'vague-prompt',
      label: 'Vague prompt',
      kind: 'problem',
      title: 'One vague prompt, 45 minutes on the clock',
      body: [
        'You hear: _"Design a notification system."_ With only **45 minutes**, the instinct is to grab a marker and start drawing load balancers, caches, and databases immediately.',
        'Resist that urge. Guessing scale or building unasked features eats twenty minutes before you realise you solved the wrong problem.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'notif-api',
          patch: { state: 'hot', badge: 'Vague!' },
        },
        {
          op: 'add-note',
          note: {
            id: 'prompt-note',
            anchor: { at: { x: 9, y: 3 } },
            text: '"Design notifications"',
            tone: 'info',
            icon: 'mail',
          },
        },
        { op: 'packet', edge: 'caller-api', kind: 'request', wave: 0 },
      ],
    },
    {
      id: 'functional-reqs',
      label: 'Functional',
      kind: 'technique',
      title: 'Lock down 3–5 core features and cut the rest',
      body: [
        'Spend the first **~5 minutes** clarifying _functional requirements_—what the system must do. Who uses it, and which three to five flows truly matter?',
        'For notifications: send **push, email, and SMS**, honour user **opt-out preferences**, and render **templates**. Explicitly park marketing dashboards and billing _out of scope_.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Agreeing what is out of scope saves you from wasting ten minutes on unasked features.',
        },
      ],
      changes: [
        {
          type: 'changed',
          text: 'Pinned 3 core flows and parked extras out of scope',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'notif-api',
          patch: { state: 'focus', badge: 'Scoped' },
        },
        {
          op: 'update-note',
          id: 'prompt-note',
          patch: {
            text: '1. Functional (~5 min)',
            tone: 'good',
            icon: 'check',
            rows: [
              ['In scope', 'Push · Email · SMS'],
              ['In scope', 'User opt-outs'],
              ['Out of scope', 'Analytics UI'],
            ],
          },
        },
        { op: 'set-metric', id: 'clock', value: '40 min' },
        { op: 'set-metric', id: 'phase', value: 'Functional' },
      ],
      learns: [0],
    },
    {
      id: 'non-functional',
      label: 'Non-functional',
      kind: 'technique',
      title: 'Set latency, uptime, and durability targets',
      body: [
        'Next (~3 minutes), ask _how well_ the system must run: **non-functional requirements**.',
        'OTP codes need **< 5 s** delivery, uptime targets **99.99%** (`four nines`), and accepted alerts must **never drop silently**. Preferences can be _eventually consistent_, while duplicate-send checks need stronger guarantees.',
      ],
      changes: [
        {
          type: 'changed',
          text: 'Added latency, 99.99% uptime, and durability targets',
        },
      ],
      ops: [
        {
          op: 'update-note',
          id: 'prompt-note',
          patch: {
            text: '2. Non-functional (~3 min)',
            tone: 'info',
            icon: 'shield',
            rows: [
              ['Latency', '< 5 s OTP'],
              ['Availability', '99.99%'],
              ['Durability', 'Zero drops'],
            ],
          },
        },
        { op: 'set-metric', id: 'clock', value: '37 min' },
        { op: 'set-metric', id: 'phase', value: 'Non-func' },
      ],
      learns: [0],
    },
    {
      id: 'estimates',
      label: 'Estimates',
      kind: 'technique',
      title: 'Let scale estimates guide your architecture',
      body: [
        'Spend **~5 minutes** turning users into **RPS**, **storage**, and **bandwidth** (`÷ 10⁵ s/day`).',
        'Suppose **10M DAU** trigger 5 alerts/day (`50M/day`): **500 avg RPS**, **1,500 peak RPS**, and **50 GB/day** (`~18 TB/yr`). That rules out waiting on slow external email/SMS providers inside the API request!',
      ],
      changes: [
        {
          type: 'changed',
          text: 'Peak estimated at 1,500 RPS; 50 GB/day storage',
        },
      ],
      ops: [
        {
          op: 'update-note',
          id: 'prompt-note',
          patch: {
            text: '3. Estimates (~5 min)',
            tone: 'info',
            icon: 'chart',
            rows: [
              ['Avg / Peak', '500 / 1,500 RPS'],
              ['Storage', '~18 TB / year'],
              ['Implication', 'Async queue'],
            ],
          },
        },
        { op: 'set-metric', id: 'clock', value: '32 min' },
        { op: 'set-metric', id: 'phase', value: 'Estimates' },
        { op: 'set-metric', id: 'rps', value: '1,500 RPS' },
        { op: 'set-metric', id: 'focus', value: 'Scale' },
      ],
      learns: [1],
    },
    {
      id: 'api-design',
      label: 'API contract',
      kind: 'technique',
      title: 'Define API endpoints before wiring internals',
      body: [
        'Spend **~5 minutes** writing the external contract so inputs, outputs, and error cases stay concrete.',
        'Define `POST /v1/notify` (carrying `userId`, `channel`, `templateId`, and an `idempotencyKey`) returning **`202 Accepted`**, plus `PUT /v1/users/{id}/prefs` for opt-outs. Returning `202` tells callers delivery runs asynchronously.',
      ],
      changes: [
        {
          type: 'added',
          text: 'API gateway handling POST /v1/notify (202)',
        },
      ],
      ops: [
        { op: 'remove-edge', id: 'caller-api' },
        { op: 'remove-note', id: 'prompt-note' },
        {
          op: 'add-node',
          node: {
            id: 'api-gw',
            kind: 'gateway',
            at: { x: 4, y: 5 },
            label: 'API Gateway',
            sublabel: 'Auth · 202 Ack',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'caller-gw',
            from: 'caller',
            to: 'api-gw',
            label: 'POST /v1/notify',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'gw-api',
            from: 'api-gw',
            to: 'notif-api',
            label: '1,500 RPS',
          },
        },
        {
          op: 'update-node',
          id: 'notif-api',
          patch: {
            sublabel: 'Notify API',
            badge: '202 Accepted',
            state: 'normal',
          },
        },
        {
          op: 'packet',
          edge: 'caller-gw',
          kind: 'request',
          label: 'idempotencyKey',
          wave: 0,
        },
        { op: 'packet', edge: 'gw-api', kind: 'request', wave: 1 },
        { op: 'set-metric', id: 'clock', value: '27 min' },
        { op: 'set-metric', id: 'phase', value: 'API' },
        { op: 'set-metric', id: 'focus', value: 'Contract' },
      ],
      learns: [2],
    },
    {
      id: 'data-model',
      label: 'Data model',
      kind: 'technique',
      title: 'Match keys and stores to access patterns',
      body: [
        'Next (**~5 minutes**), map entities, primary keys, and access patterns before choosing databases.',
        'Store **user preferences** keyed by `user_id` in SQL plus a fast **Redis cache** for every send check. Log **notification status** (`id PK`, `user_id`, `state`) for audit trails and deduplication.',
      ],
      changes: [
        { type: 'added', text: 'Prefs Cache (Redis) and Prefs & Log DB' },
      ],
      ops: [
        { op: 'update-node', id: 'api-gw', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'notif-api',
          patch: { state: 'focus', badge: null },
        },
        {
          op: 'add-node',
          node: {
            id: 'prefs-cache',
            kind: 'cache',
            at: { x: 7, y: 2 },
            label: 'Prefs Cache',
            sublabel: 'Redis · opt-outs',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'prefs-db',
            kind: 'database',
            at: { x: 10, y: 2 },
            label: 'Prefs & Log DB',
            sublabel: 'user_id PK',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-cache',
            from: 'notif-api',
            to: 'prefs-cache',
            label: 'GET prefs',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-db',
            from: 'notif-api',
            to: 'prefs-db',
            label: 'SQL',
          },
        },
        { op: 'packet', edge: 'api-cache', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'api-db', kind: 'write', wave: 1 },
        { op: 'set-metric', id: 'clock', value: '22 min' },
        { op: 'set-metric', id: 'phase', value: 'Data model' },
        { op: 'set-metric', id: 'focus', value: 'Keys' },
      ],
      learns: [2],
    },
    {
      id: 'high-level-design',
      label: 'HLD boxes',
      kind: 'technique',
      title: 'Connect the end-to-end read and write paths',
      body: [
        'Now spend **~10 minutes** drawing the **High-Level Design (HLD)** end to end. Every box earns its place from your earlier numbers.',
        'The API checks opt-outs, enqueues jobs into a **Queue**, and returns `202` in **15 ms**. Channel **Workers** pull jobs and call external Email/Push/SMS providers.',
      ],
      changes: [
        { type: 'added', text: 'Queue, Channel Workers, and Providers' },
      ],
      ops: [
        { op: 'update-node', id: 'notif-api', patch: { state: 'normal' } },
        {
          op: 'add-node',
          node: {
            id: 'notif-q',
            kind: 'queue',
            at: { x: 7, y: 8 },
            label: 'Channel Queue',
            sublabel: 'Per priority',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'workers',
            kind: 'worker',
            at: { x: 10, y: 8 },
            label: 'Send Workers',
            sublabel: 'Retry + rate limit',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'providers',
            kind: 'external',
            at: { x: 12, y: 5 },
            label: 'Push · Email · SMS',
            sublabel: '3rd-party APIs',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-q',
            from: 'notif-api',
            to: 'notif-q',
            label: 'enqueue',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'q-workers',
            from: 'notif-q',
            to: 'workers',
            label: 'pull',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'workers-prov',
            from: 'workers',
            to: 'providers',
            label: 'send',
          },
        },
        { op: 'packet', edge: 'api-q', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'q-workers', kind: 'event', wave: 1 },
        { op: 'packet', edge: 'workers-prov', kind: 'request', wave: 2 },
        { op: 'set-metric', id: 'clock', value: '12 min' },
        { op: 'set-metric', id: 'phase', value: 'HLD' },
      ],
      learns: [3],
    },
    {
      id: 'deep-dives',
      label: 'Deep dives',
      kind: 'case',
      title: 'Spend 10 minutes on bottlenecks and failures',
      body: [
        'With a working skeleton drawn, dedicate **~10 minutes** to **deep dives**: what breaks at 10× load or when a dependency fails?',
        'Suppose an SMS gateway goes down during a **4,500 RPS** flash sale. The queue absorbs the spike, **workers** retry with _exponential backoff_, and failed messages route to a **Dead-Letter Queue** without blocking OTP pushes.',
      ],
      changes: [
        {
          type: 'changed',
          text: 'Tested 4,500 RPS burst and provider outage',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'notif-q',
          patch: { state: 'focus', load: 0.75, badge: '4.5k burst' },
        },
        {
          op: 'update-node',
          id: 'workers',
          patch: { state: 'focus', badge: 'Backoff + DLQ' },
        },
        {
          op: 'update-node',
          id: 'providers',
          patch: { state: 'down', badge: 'SMS 503' },
        },
        {
          op: 'packet',
          edge: 'api-q',
          kind: 'write',
          count: 3,
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'workers-prov',
          kind: 'error',
          label: '503 retry',
          wave: 1,
        },
        { op: 'set-metric', id: 'clock', value: '2 min' },
        { op: 'set-metric', id: 'phase', value: 'Deep dive' },
        { op: 'set-metric', id: 'rps', value: '4,500 RPS' },
        { op: 'set-metric', id: 'focus', value: 'Failure' },
      ],
      learns: [3],
    },
    {
      id: 'hld-vs-lld',
      label: 'HLD vs LLD',
      kind: 'watch-out',
      title: 'Keep HLD architecture separate from LLD code',
      body: [
        'A frequent trap is spending 15 minutes writing `NotificationSenderFactory` classes or full SQL column types (**Low-Level Design / LLD**) during a **High-Level Design (HLD)** session.',
        '**HLD** covers components, data flow, scaling, and failure trade-offs. **LLD** covers object models, interfaces, concurrency locks, and schema details inside one service.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Ask upfront if the goal is HLD (distributed architecture) or LLD (classes and code structure).',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'providers',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'notif-q',
          patch: { state: 'normal', load: null, badge: null },
        },
        {
          op: 'update-node',
          id: 'workers',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'hld-lld-note',
            anchor: { at: { x: 2.5, y: 8 } },
            text: 'HLD vs LLD',
            tone: 'info',
            icon: 'layers',
            rows: [
              ['HLD', 'Boxes · Scale · Trade-offs'],
              ['LLD', 'Classes · Interfaces · Locks'],
            ],
          },
        },
        { op: 'set-metric', id: 'focus', value: 'HLD ≠ LLD' },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Follow the eight-step clock to a defended design',
      body: [
        'Great system designs never start by drawing boxes. Agree requirements and numbers first, outline the API and data model, sketch the HLD, then defend bottlenecks in deep dives.',
      ],
      ops: [
        { op: 'remove-note', id: 'hld-lld-note' },
        {
          op: 'add-note',
          note: {
            id: 'method-summary',
            anchor: { at: { x: 2.5, y: 8 } },
            text: '45-min checklist',
            tone: 'good',
            icon: 'check',
            rows: [
              ['1–2. Reqs (F + NF)', '~8 min'],
              ['3–5. Math · API · Data', '~15 min'],
              ['6. High-level design', '~10 min'],
              ['7–8. Deep dives · Wrap', '~12 min'],
            ],
            total: ['Result', 'Defended HLD'],
          },
        },
        { op: 'set-metric', id: 'clock', value: '0 min', tone: 'good' },
        { op: 'set-metric', id: 'phase', value: 'Wrap-up', tone: 'good' },
        { op: 'set-metric', id: 'focus', value: 'Trade-offs', tone: 'good' },
      ],
      takeaways: [
        'Spend the first ~8 minutes pinning functional scope, out-of-scope items, and non-functional targets',
        'Use back-of-the-envelope estimates to justify caches, queues, and partitioning before drawing',
        'Define the API contract and data access patterns before wiring high-level boxes',
        'Reserve ~10 minutes for deep dives on bottlenecks and failures—and keep HLD distinct from LLD',
      ],
    },
  ],
  checks: [
    {
      id: 'order-design-method',
      kind: 'order',
      prompt:
        'Put the phases of the 45-minute system design method in their recommended order.',
      items: [
        'Clarify functional and non-functional requirements',
        'Run back-of-the-envelope scale estimates',
        'Define the API contract and core data model',
        'Draw the high-level design (HLD)',
        'Deep-dive into bottlenecks and failure modes',
      ],
      explain:
        'Requirements and scale estimates justify the API and data model, which inform the high-level design before you spend deep-dive time on bottlenecks.',
      step: 'high-level-design',
    },
    {
      id: 'choice-hld-vs-lld',
      kind: 'choice',
      prompt:
        'In a 45-minute High-Level Design (HLD) round, which choice is a sign you have drifted too deep into Low-Level Design (LLD)?',
      options: [
        'Spending 15 minutes writing interface signatures and Factory pattern subclasses',
        'Comparing read-through caching vs async queues for a 50k RPS bottleneck',
        'Estimating annual storage growth from daily writes and record size',
      ],
      answer: 0,
      explain:
        'HLD explores distributed components, data flows, and scaling trade-offs; class hierarchies and internal code structures belong to LLD.',
      step: 'hld-vs-lld',
    },
    {
      id: 'numeric-time-budget',
      kind: 'numeric',
      prompt:
        'Following the 45-minute budget (8 min requirements, 15 min estimates/API/data model, 10 min HLD), how many minutes remain for deep dives and wrap-up?',
      unit: 'min',
      answer: 12,
      tolerance: 0.1,
      explain:
        '45 − (8 + 15 + 10) = 12 minutes (~10 min for deep dives and ~2 min for wrap-up trade-offs).',
      step: 'deep-dives',
    },
    {
      id: 'choice-scope-first',
      kind: 'choice',
      prompt:
        'Why should you explicitly agree on out-of-scope features during the first five minutes?',
      options: [
        'It prevents wasting design time on secondary features instead of deep-diving the hardest bottleneck',
        'It eliminates the need to estimate requests per second or storage',
        'It guarantees the system only needs a single relational database',
      ],
      answer: 0,
      explain:
        'Parking secondary features out of scope keeps your 45-minute budget focused on the core flows and the toughest scaling deep dives.',
      step: 'functional-reqs',
    },
  ],
  cards: [
    {
      front:
        'What should you establish in the first ~8 minutes of a 45-minute design problem?',
      back: '1. Functional requirements: 3–5 core flows and what is explicitly out of scope.\n2. Non-functional requirements: latency, availability, consistency, and durability targets.',
    },
    {
      front:
        'Why do back-of-the-envelope estimates come before drawing the architecture?',
      back: 'Converting users into RPS, storage, and bandwidth reveals whether one database works or whether caches, queues, and shards are essential.',
    },
    {
      front:
        'How do High-Level Design (HLD) and Low-Level Design (LLD) differ?',
      back: 'HLD covers system components, APIs, data flow, scaling, and failure trade-offs; LLD covers classes, interfaces, design patterns, and code-level concurrency inside one service.',
    },
    {
      front: 'What makes a strong ~10-minute deep dive?',
      back: 'Stress-testing the biggest bottlenecks—hot keys, traffic spikes, failure recovery, and consistency trade-offs—tied directly to your scale estimates.',
    },
  ],
} satisfies Lesson;
