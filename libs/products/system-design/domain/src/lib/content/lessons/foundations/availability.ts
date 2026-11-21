import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 01.04: Availability & the Nines (`availability`).
 * Scenario: A 99.9% promise on a status page (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'availability',
  learn: [
    'How two, three, four, and five nines map to yearly downtime',
    'Why serial dependencies multiply to lower availability',
    'How parallel redundancy raises availability',
    'How SLIs, SLOs, SLAs, and error budgets guide releases',
  ],
  scene: {
    nodes: [
      {
        id: 'merchant',
        kind: 'client',
        at: { x: 1, y: 4 },
        label: 'Merchant POS',
        sublabel: '99.9% SLA?',
      },
      {
        id: 'pay-api',
        kind: 'server',
        at: { x: 6, y: 4 },
        label: 'Pay Service',
        sublabel: '99.9% (3 nines)',
      },
    ],
    edges: [
      { id: 'merchant-pay', from: 'merchant', to: 'pay-api', label: 'HTTPS' },
    ],
    zones: [
      {
        id: 'prod-zone',
        from: { x: 4, y: 1 },
        to: { x: 12, y: 7 },
        hue: 'rose',
        label: 'Payments cloud',
      },
    ],
    notes: [],
  },
  hud: [
    {
      id: 'availability',
      label: 'Availability',
      icon: 'shield',
      value: '99.9%',
    },
    { id: 'downtime-yr', label: 'Downtime/yr', icon: 'clock', value: '8.76 h' },
  ],
  steps: [
    {
      id: 'status-promise',
      label: 'The promise',
      kind: 'problem',
      title: 'What does 99.9% uptime actually allow?',
      body: [
        'Your payments status page advertises **99.9% availability** ("three nines"). Enterprise merchants want a contract guaranteeing it.',
        'Before signing, you need to know how many hours of downtime `99.9%` allows per year—and what happens when a request must pass through three components in a row.',
      ],
      ops: [
        { op: 'update-node', id: 'pay-api', patch: { state: 'focus' } },
        { op: 'packet', edge: 'merchant-pay', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'merchant-pay',
          kind: 'response',
          reverse: true,
          wave: 1,
        },
      ],
    },
    {
      id: 'the-nines',
      label: 'The nines',
      kind: 'technique',
      title: 'Each extra nine divides downtime by ten',
      body: [
        'A year has **8,760 hours** (`525,600 minutes`). At **99%** (two nines), `1%` downtime is **3.65 days/year**. At **99.9%** (three nines), `0.1%` is **8.76 hours/year** (`~44 min/month`).',
        'Moving to **99.99%** (four nines) leaves just **52.6 minutes/year**—barely four minutes a month for crashes, bad deploys, and network blips combined.',
      ],
      changes: [
        { type: 'added', text: 'Nines reference table (99% to 99.999%)' },
      ],
      ops: [
        {
          op: 'add-note',
          note: {
            id: 'nines-note',
            anchor: { at: { x: 1, y: 1 } },
            text: 'The Nines table',
            tone: 'info',
            icon: 'clock',
            rows: [
              ['99% (2 nines)', '3.65 d / yr'],
              ['99.9% (3 nines)', '8.76 h / yr'],
              ['99.99% (4 nines)', '52.6 m / yr'],
              ['99.999% (5 nines)', '5.26 m / yr'],
            ],
          },
        },
      ],
      learns: [0],
    },
    {
      id: 'serial-chain',
      label: 'Serial chain',
      kind: 'case',
      title: 'Dependencies in series multiply their risk',
      body: [
        'Now trace the real path: **API Gateway** (`99.9%`) → **Pay Service** (`99.9%`) → **Ledger DB** (`99.9%`). If _any_ one of the three is down, the payment fails.',
        'Serial availability is `A₁ × A₂ × A₃ = 0.999³ = 99.7%`. Your downtime triples to **26.3 hours/year**, breaking the 99.9% promise!',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'A chain of N components each at 99.9% has roughly (100 − 0.1 × N)% availability.',
        },
      ],
      changes: [
        { type: 'added', text: 'API Gateway and Ledger DB in series' },
        {
          type: 'changed',
          text: 'Combined availability drops to 99.7% (26.3 h/yr)',
        },
      ],
      ops: [
        { op: 'remove-edge', id: 'merchant-pay' },
        {
          op: 'add-node',
          node: {
            id: 'gateway',
            kind: 'gateway',
            at: { x: 4, y: 4 },
            label: 'API Gateway',
            sublabel: '99.9%',
            state: 'focus',
          },
        },
        {
          op: 'update-node',
          id: 'pay-api',
          patch: { at: { x: 7, y: 4 }, state: 'focus' },
        },
        {
          op: 'add-node',
          node: {
            id: 'ledger-db',
            kind: 'database',
            at: { x: 10, y: 4 },
            label: 'Ledger DB',
            sublabel: '99.9%',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'merchant-gw', from: 'merchant', to: 'gateway' },
        },
        {
          op: 'add-edge',
          edge: { id: 'gw-pay', from: 'gateway', to: 'pay-api' },
        },
        {
          op: 'add-edge',
          edge: { id: 'pay-db', from: 'pay-api', to: 'ledger-db' },
        },
        { op: 'packet', edge: 'merchant-gw', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'gw-pay', kind: 'request', wave: 1 },
        { op: 'packet', edge: 'pay-db', kind: 'write', wave: 2 },
        { op: 'set-metric', id: 'availability', value: '99.7%', tone: 'bad' },
        { op: 'set-metric', id: 'downtime-yr', value: '26.3 h', tone: 'bad' },
      ],
      learns: [1],
    },
    {
      id: 'parallel-redundancy',
      label: 'Redundancy',
      kind: 'technique',
      title: 'Parallel replicas multiply failure probabilities',
      body: [
        'Run two independent **Pay Service** nodes in parallel so either one can serve traffic. The tier fails only when _both_ fail simultaneously: `P(fail) = (1 − 0.999)² = 0.001² = 10⁻⁶`.',
        'That single tier jumps from `99.9%` to **`99.9999%`** (six nines). Adding a standby replica for the database and redundant gateways brings the whole chain to **99.95%+**.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Parallel Pay Service B and standby DB replica',
        },
        {
          type: 'changed',
          text: 'System availability climbs to 99.95% (4.38 h/yr)',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'pay-api',
          patch: {
            at: { x: 7, y: 3 },
            label: 'Pay Service A',
            state: 'normal',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'pay-api-b',
            kind: 'server',
            at: { x: 7, y: 6 },
            label: 'Pay Service B',
            sublabel: '99.9% replica',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'ledger-replica',
            kind: 'replica',
            at: { x: 10, y: 6 },
            label: 'Standby DB',
            sublabel: 'Failover replica',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'gw-pay-b', from: 'gateway', to: 'pay-api-b' },
        },
        {
          op: 'add-edge',
          edge: { id: 'pay-b-db', from: 'pay-api-b', to: 'ledger-db' },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'db-sync',
            from: 'ledger-db',
            to: 'ledger-replica',
            label: 'sync',
            style: 'dashed',
          },
        },
        { op: 'packet', edge: 'gw-pay', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'gw-pay-b', kind: 'request', wave: 0 },
        { op: 'set-metric', id: 'availability', value: '99.95%', tone: 'good' },
        { op: 'set-metric', id: 'downtime-yr', value: '4.38 h', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'sli-slo-sla',
      label: 'SLI, SLO, SLA',
      kind: 'technique',
      title: 'Measure SLI, steer by SLO, promise SLA',
      body: [
        'Keep three terms sharp:\n• **SLI** (_Indicator_): the metric you measure, such as "share of `POST /charge` requests returning non-5xx in under 400 ms".',
        '• **SLO** (_Objective_): your internal engineering goal (`99.95%`).\n• **SLA** (_Agreement_): the looser legal contract with customers (`99.9%`), leaving a safety margin below your SLO.',
      ],
      ops: [
        { op: 'update-node', id: 'gateway', patch: { state: 'normal' } },
        { op: 'update-node', id: 'pay-api-b', patch: { state: 'normal' } },
        { op: 'update-node', id: 'ledger-db', patch: { state: 'normal' } },
        { op: 'update-node', id: 'ledger-replica', patch: { state: 'normal' } },
        {
          op: 'add-note',
          note: {
            id: 'slo-note',
            anchor: { node: 'gateway' },
            text: 'SLO 99.95% > SLA 99.9%',
            tone: 'good',
            icon: 'shield',
          },
        },
      ],
      learns: [3],
    },
    {
      id: 'error-budget',
      label: 'Error budget',
      kind: 'technique',
      title: 'Spend your error budget on velocity',
      body: [
        'Your **error budget** is `100% − SLO`. With a `99.95%` SLO, the team has **`0.05%`** (`21.9 minutes/month` of bad minutes, or `500` failed requests per million) to spend.',
        'As long as budget remains, ship features and run chaos drills. If an incident burns the monthly budget, freeze risky launches until reliability work restores it.',
      ],
      callouts: [
        {
          kind: 'good-to-know',
          text: '100% availability is the wrong target: it leaves zero room to deploy new software.',
        },
      ],
      ops: [
        {
          op: 'update-note',
          id: 'slo-note',
          patch: { text: 'Error budget: 21.9 min/mo' },
        },
      ],
    },
    {
      id: 'correlated-failure',
      label: 'Shared fate',
      kind: 'watch-out',
      title: 'Correlated failures wipe out parallel math',
      body: [
        'The formula `1 − (1 − A)²` assumes **Pay Service A** and **Pay Service B** fail _independently_. If both run in the same availability zone, or a bad config push breaks both at once, they crash together.',
        'Place replicas in separate failure domains and roll out changes gradually (canaries) so one bug cannot take down every copy.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Two servers on one power switch or one instant global deploy still have single-server availability.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'pay-api',
          patch: { state: 'down', badge: 'AZ-1 down' },
        },
        {
          op: 'update-node',
          id: 'pay-api-b',
          patch: { state: 'focus', badge: 'AZ-2 live' },
        },
        { op: 'packet', edge: 'gw-pay-b', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'pay-b-db', kind: 'write', wave: 1 },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Design for the nines you actually need',
      body: [
        'High availability is arithmetic plus isolation: keep serial chains short, add parallel redundancy across independent failure domains, and guard your external SLA with a tighter internal SLO.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'pay-api',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'pay-api-b',
          patch: { state: 'normal', badge: null },
        },
      ],
      takeaways: [
        '99.9% allows 8.76 hours/year of downtime; 99.99% allows 52.6 minutes/year',
        'Components in series multiply their availabilities (A = A₁ × A₂), lowering the total',
        'Independent components in parallel multiply their failure rates (A = 1 − (1 − A₁)(1 − A₂))',
        'Set an internal SLO tighter than your external SLA, and manage risk with the error budget (100% − SLO)',
      ],
    },
  ],
  checks: [
    {
      id: 'numeric-three-nines-hours',
      kind: 'numeric',
      prompt:
        'A year has 8,760 hours. How many hours of downtime per year does 99.9% ("three nines") availability allow?',
      unit: 'hours/year',
      answer: 8.76,
      tolerance: 0.05,
      explain: '0.1% of 8,760 hours = 0.001 × 8,760 = 8.76 hours per year.',
      step: 'the-nines',
    },
    {
      id: 'choice-serial-availability',
      kind: 'choice',
      prompt:
        'A request depends on two services in series, each with 99% (0.99) availability. What is their combined availability?',
      options: [
        'About 98.01% (0.99 × 0.99)',
        '99.99% (1 − 0.01 × 0.01)',
        'Still 99.0%',
      ],
      answer: 0,
      explain:
        'When both components must be up in series, overall availability is the product 0.99 × 0.99 = 0.9801 (98.01%).',
      step: 'serial-chain',
    },
    {
      id: 'choice-parallel-availability',
      kind: 'choice',
      prompt:
        'Two independent servers each have 99% availability (1% failure rate) and sit in parallel behind a load balancer where either server can handle the traffic. What is the pair’s combined availability?',
      options: [
        '99.99% (only fails when both fail: 1% × 1% = 0.01%)',
        '98.01% (0.99 × 0.99)',
        '99.5%',
      ],
      answer: 0,
      explain:
        'With independent parallel nodes, both are down only 0.01 × 0.01 = 0.0001 of the time, giving 1 − 0.0001 = 99.99% availability.',
      step: 'parallel-redundancy',
    },
    {
      id: 'order-sli-slo-sla',
      kind: 'order',
      prompt:
        'Order these reliability layers from raw measurement to external customer contract.',
      items: [
        'SLI (Service Level Indicator): measured ratio of good responses',
        'SLO (Service Level Objective): internal engineering target (e.g. 99.95%)',
        'SLA (Service Level Agreement): external contract with penalties (e.g. 99.9%)',
      ],
      explain:
        'You measure the SLI, hold engineering to the stricter internal SLO, and commit externally to the SLA.',
      step: 'sli-slo-sla',
    },
  ],
  cards: [
    {
      front:
        'How much downtime per year do 99.9% (3 nines) and 99.99% (4 nines) allow?',
      back: '• 99.9% (3 nines): 8.76 hours/year (~43.8 min/month)\n• 99.99% (4 nines): 52.6 minutes/year (~4.38 min/month)',
    },
    {
      front:
        'How do you calculate the availability of components in series vs in parallel?',
      back: '• Series (all must work): A = A₁ × A₂\n• Parallel (any one works, independent failures): A = 1 − (1 − A₁)(1 − A₂)',
    },
    {
      front: 'Distinguish SLI, SLO, and SLA.',
      back: '• SLI: quantitative metric of service health\n• SLO: internal target for that SLI\n• SLA: external contract with consequences if missed (looser than the SLO)',
    },
    {
      front: 'What is an error budget and how is it used?',
      back: 'Error budget = 100% − SLO. It is the allowable unreliability spent on releases, experiments, and maintenance before reliability work takes priority.',
    },
  ],
} satisfies Lesson;
