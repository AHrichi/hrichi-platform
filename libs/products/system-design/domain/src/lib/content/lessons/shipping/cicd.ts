import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 08.02: CI/CD & Safe Deploys (`cicd`).
 * Scenario: A Friday deploy breaks checkout (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'cicd',
  learn: [
    'Gate code changes through fast, automated CI/CD stages',
    'Decouple deploy from release using feature flags',
    'Switch environments cleanly with blue-green deploys',
    'Roll out canaries and auto-roll back on bad metrics',
    'Change live schemas safely via expand/contract steps',
  ],
  scene: {
    nodes: [
      {
        id: 'shoppers',
        kind: 'client',
        at: { x: 1, y: 4 },
        label: 'Shoppers',
        sublabel: 'Friday rush',
      },
      {
        id: 'router',
        kind: 'load-balancer',
        at: { x: 4, y: 4 },
        label: 'Traffic Router',
        sublabel: '100% -> Blue',
      },
      {
        id: 'blue-app',
        kind: 'server',
        at: { x: 8, y: 3 },
        label: 'Checkout Blue',
        sublabel: 'v1.4 (stable)',
      },
      {
        id: 'orders-db',
        kind: 'database',
        at: { x: 11, y: 4 },
        label: 'Orders DB',
        sublabel: 'Postgres',
      },
    ],
    edges: [
      {
        id: 'shoppers-router',
        from: 'shoppers',
        to: 'router',
        label: 'POST /pay',
      },
      {
        id: 'router-blue',
        from: 'router',
        to: 'blue-app',
        label: '100%',
      },
      {
        id: 'blue-db',
        from: 'blue-app',
        to: 'orders-db',
        label: 'SQL',
      },
    ],
    zones: [
      {
        id: 'prod-zone',
        from: { x: 3, y: 1 },
        to: { x: 12, y: 8 },
        hue: 'teal',
        label: 'Production cluster',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'err-rate', label: 'Error rate', icon: 'warning', value: '0.1%' },
    { id: 'p99', label: 'Checkout p99', icon: 'timer', value: '95 ms' },
    { id: 'mttr', label: 'Restore time', icon: 'clock', value: '45 min' },
    { id: 'blast', label: 'Blast radius', icon: 'shield', value: '100%' },
  ],
  steps: [
    {
      id: 'friday-outage',
      label: 'Friday push',
      kind: 'problem',
      title: 'One Friday push takes down 100% of checkout',
      body: [
        'At 4:45 PM Friday, a developer deploys `v1.5` directly over live **Checkout Blue** servers and drops an old database column in the same change.',
        'A hidden bug and missing column push checkout errors to **18%** for **100%** of shoppers. Rolling back takes **45 minutes** of frantic manual hotfixes.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'blue-app',
          patch: { state: 'down', sublabel: 'v1.5 (broken)', badge: '18% 5xx' },
        },
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'hot', badge: 'column gone' },
        },
        {
          op: 'packet',
          edge: 'shoppers-router',
          kind: 'request',
          count: 3,
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'router-blue',
          kind: 'error',
          count: 3,
          label: '500 crash',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'blue-db',
          kind: 'error',
          reverse: true,
          label: 'bad SQL',
          wave: 2,
        },
        { op: 'set-metric', id: 'err-rate', value: '18%', tone: 'bad' },
        { op: 'set-metric', id: 'p99', value: '2,100 ms', tone: 'bad' },
        { op: 'set-metric', id: 'blast', value: '100%', tone: 'bad' },
      ],
    },
    {
      id: 'pipeline-stages',
      label: 'CI pipeline',
      kind: 'technique',
      title: 'Gate every commit through pipeline stages',
      body: [
        'Replace manual pushes with an automated **CI/CD pipeline**. Every commit flows through ordered stages: **Build & Lint** → **Unit & Contract** → **Integration** → **Staging**.',
        'Bad commits fail fast before production, driving down _change failure rate_ while keeping _deployment frequency_ and _lead time_ healthy.',
      ],
      changes: [
        { type: 'added', text: 'Automated CI/CD Pipeline node' },
        { type: 'changed', text: 'Only verified signed builds reach prod' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'blue-app',
          patch: { state: 'normal', sublabel: 'v1.4 (verified)', badge: null },
        },
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-node',
          node: {
            id: 'ci-pipeline',
            kind: 'worker',
            at: { x: 1, y: 1 },
            label: 'CI/CD Pipeline',
            sublabel: 'Build · Test · Stage',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'ci-blue',
            from: 'ci-pipeline',
            to: 'blue-app',
            label: 'signed build',
            style: 'dashed',
          },
        },
        {
          op: 'packet',
          edge: 'ci-blue',
          kind: 'write',
          label: 'pass 4 gates',
          wave: 0,
        },
        { op: 'set-metric', id: 'err-rate', value: '0.1%', tone: 'good' },
        { op: 'set-metric', id: 'p99', value: '95 ms', tone: 'good' },
      ],
      learns: [0],
    },
    {
      id: 'feature-flags',
      label: 'Feature flags',
      kind: 'technique',
      title: 'Separate deployment from feature release',
      body: [
        'Deploying code and turning on a feature are different steps. Wrap new checkout logic inside a **feature flag** (`new_tax = off`).',
        'You ship dark code calmly at noon, enable it for **5%** internal staff first, and flip the switch off in under **5 seconds** if errors climb.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Feature flags turn a scary code rollback into an instant configuration toggle.',
        },
      ],
      changes: [
        { type: 'added', text: 'Feature flag toggle on Checkout Blue' },
        { type: 'changed', text: 'Restore time drops under 5 s' },
      ],
      ops: [
        { op: 'update-node', id: 'ci-pipeline', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'blue-app',
          patch: {
            state: 'focus',
            sublabel: 'v1.5 · flag 5%',
            badge: 'dark code',
          },
        },
        {
          op: 'add-note',
          note: {
            id: 'flag-note',
            anchor: { node: 'blue-app' },
            text: 'flag: new_tax = 5% staff',
            tone: 'info',
            icon: 'key',
          },
        },
        {
          op: 'packet',
          edge: 'shoppers-router',
          kind: 'request',
          label: 'staff cohort',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'router-blue',
          kind: 'request',
          label: 'new path',
          wave: 1,
        },
        { op: 'set-metric', id: 'mttr', value: '< 5 s', tone: 'good' },
        { op: 'set-metric', id: 'blast', value: '5% (staff)', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'blue-green',
      label: 'Blue-green',
      kind: 'technique',
      title: 'Blue-green swaps traffic with instant rollback',
      body: [
        'With **blue-green deployment**, you spin up a full **Green** stack (`v1.6`) alongside warm **Blue** (`v1.4`), run smoke checks, and then flip the router to send **100%** of traffic to Green.',
        'If anything breaks, flipping traffic back to warm Blue restores service in seconds—at the cost of running **2×** server capacity during cutover.',
      ],
      changes: [
        { type: 'added', text: 'Full Checkout Green stack alongside Blue' },
        { type: 'changed', text: 'Router shifts 100% traffic to Green' },
      ],
      ops: [
        { op: 'remove-note', id: 'flag-note' },
        {
          op: 'update-node',
          id: 'blue-app',
          patch: { state: 'dim', sublabel: 'v1.4 (warm)', badge: '0%' },
        },
        {
          op: 'add-node',
          node: {
            id: 'green-app',
            kind: 'server',
            at: { x: 8, y: 6 },
            label: 'Checkout Green',
            sublabel: 'v1.6 (live)',
            state: 'focus',
            badge: '100%',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'router-green',
            from: 'router',
            to: 'green-app',
            label: '100%',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'green-db',
            from: 'green-app',
            to: 'orders-db',
            label: 'SQL',
          },
        },
        {
          op: 'update-edge',
          id: 'router-blue',
          patch: { label: '0% (warm)', style: 'dashed', state: 'dim' },
        },
        {
          op: 'packet',
          edge: 'router-green',
          kind: 'request',
          count: 3,
          label: '100% cutover',
          wave: 0,
        },
        { op: 'set-metric', id: 'mttr', value: '< 10 s', tone: 'good' },
        { op: 'set-metric', id: 'blast', value: '100% (2× cap)' },
      ],
      learns: [2],
    },
    {
      id: 'canary-rollout',
      label: 'Canary 5%',
      kind: 'technique',
      title: 'Shift 5% to a canary before full cutover',
      body: [
        'Blue-green still hits every user at once if smoke tests miss a path. A **canary release** routes just **5%** of live shoppers to **Green** (`v1.7`) while **95%** stay on **Blue**.',
        'A **Canary Gate** compares Green’s live error rate and `p99` latency against Blue before widening traffic.',
      ],
      changes: [
        { type: 'added', text: 'Canary Gate watching live 5xx and p99' },
        { type: 'changed', text: 'Canary traffic capped at 5%' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'blue-app',
          patch: { state: 'normal', sublabel: 'v1.6 (stable)', badge: '95%' },
        },
        {
          op: 'update-node',
          id: 'green-app',
          patch: { state: 'focus', sublabel: 'v1.7 (canary)', badge: '5%' },
        },
        {
          op: 'update-edge',
          id: 'router-blue',
          patch: { label: '95%', style: 'solid', state: 'normal' },
        },
        {
          op: 'update-edge',
          id: 'router-green',
          patch: { label: '5%', style: 'dashed' },
        },
        {
          op: 'add-node',
          node: {
            id: 'metrics-gate',
            kind: 'service',
            at: { x: 1, y: 7 },
            label: 'Canary Gate',
            sublabel: 'Compare 5xx & p99',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'gate-router',
            from: 'metrics-gate',
            to: 'router',
            label: 'auto shift',
            style: 'dashed',
          },
        },
        {
          op: 'packet',
          edge: 'router-blue',
          kind: 'request',
          count: 3,
          label: '95%',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'router-green',
          kind: 'request',
          count: 1,
          label: '5% canary',
          wave: 0,
        },
        { op: 'set-metric', id: 'blast', value: '5%', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'canary-rollback',
      label: 'Auto rollback',
      kind: 'case',
      title: 'Canary fails an edge case and auto-reverts',
      body: [
        'Five minutes in, `v1.7` crashes on international cards: canary `5xx` hits **12%** and `p99` spikes to **900 ms**.',
        'The **Canary Gate** trips automatically, shifts Green back to **0%**, and restores **100%** Blue in **15 seconds**. Ninety-five percent of shoppers never see an error.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Automated metric gates roll back bad canaries in seconds without waiting for a human alert.',
        },
      ],
      changes: [
        { type: 'changed', text: 'Canary Gate halts v1.7 and reverts to Blue' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'green-app',
          patch: { state: 'down', badge: '12% 5xx -> 0%' },
        },
        {
          op: 'update-edge',
          id: 'router-green',
          patch: { label: '0% halted', state: 'broken' },
        },
        {
          op: 'update-node',
          id: 'blue-app',
          patch: { state: 'focus', badge: '100% safe' },
        },
        {
          op: 'update-edge',
          id: 'router-blue',
          patch: { label: '100%' },
        },
        {
          op: 'packet',
          edge: 'router-green',
          kind: 'error',
          reverse: true,
          label: '12% 5xx',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'gate-router',
          kind: 'write',
          label: 'rollback!',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'router-blue',
          kind: 'request',
          count: 3,
          label: '100% Blue',
          wave: 2,
        },
        { op: 'set-metric', id: 'err-rate', value: '0.1%', tone: 'good' },
        { op: 'set-metric', id: 'mttr', value: '15 s', tone: 'good' },
        { op: 'set-metric', id: 'blast', value: '5% capped', tone: 'good' },
      ],
    },
    {
      id: 'expand-contract',
      label: 'DB migrations',
      kind: 'technique',
      title: 'Evolve schemas safely with expand and contract',
      body: [
        'When Blue and Green share **Orders DB**, dropping or renaming a column breaks the older version mid-deploy.',
        'Use **expand and contract**: add the new nullable column first (`expand`), deploy code that writes both, backfill old rows in batches, switch reads to the new column, and drop the old one (`contract`) in a later release.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Five-phase Expand / Contract migration table',
        },
        { type: 'changed', text: 'Blue and Green share compatible DB shapes' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'green-app',
          patch: {
            state: 'normal',
            sublabel: 'v1.8 (dual-write)',
            badge: '50%',
          },
        },
        {
          op: 'update-edge',
          id: 'router-green',
          patch: { label: '50%', style: 'solid', state: 'normal' },
        },
        {
          op: 'update-node',
          id: 'blue-app',
          patch: { state: 'normal', sublabel: 'v1.7 (old read)', badge: '50%' },
        },
        { op: 'update-edge', id: 'router-blue', patch: { label: '50%' } },
        {
          op: 'update-node',
          id: 'orders-db',
          patch: {
            state: 'focus',
            sublabel: 'old + new cols',
            badge: 'dual shape',
          },
        },
        {
          op: 'packet',
          edge: 'blue-db',
          kind: 'write',
          label: 'old col',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'green-db',
          kind: 'write',
          label: 'old + new',
          wave: 0,
        },
        {
          op: 'add-note',
          note: {
            id: 'migrate-note',
            anchor: { at: { x: 6, y: 9 } },
            text: 'Expand / Contract phases',
            tone: 'info',
            icon: 'database',
            rows: [
              ['1. Expand', 'Add nullable new column'],
              ['2. Write both', 'App writes old & new'],
              ['3. Backfill', 'Batch-copy old rows'],
              ['4. Switch reads', 'Read new, write both'],
              ['5. Contract', 'Drop old col later'],
            ],
          },
        },
      ],
      learns: [4],
    },
    {
      id: 'watch-out-traps',
      label: 'Watch out',
      kind: 'watch-out',
      title: 'Watch out for noisy canaries and flag debt',
      body: [
        'On low-traffic endpoints, a two-minute canary sees too few requests to spot a 2% bug—let canaries run long enough for real sample size.',
        'Also prune retired **feature flags**; stale flags multiply untested code paths, and **shadow traffic** must disable writes and emails so duplicated requests do not charge users twice.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never combine a destructive schema drop with a code deploy—wait until old code is 100% retired.',
        },
      ],
      changes: [{ type: 'added', text: 'Sample-size and flag-debt warning' }],
      ops: [
        { op: 'remove-note', id: 'migrate-note' },
        {
          op: 'update-node',
          id: 'green-app',
          patch: { state: 'hot', badge: 'low sample' },
        },
        {
          op: 'packet',
          edge: 'router-green',
          kind: 'request',
          count: 1,
          label: 'too few hits',
          wave: 0,
        },
        {
          op: 'add-note',
          note: {
            id: 'trap-note',
            anchor: { at: { x: 6, y: 9 } },
            text: 'Low traffic = noisy canary · Prune stale flags',
            tone: 'bad',
            icon: 'warning',
          },
        },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Ship small, gated changes you undo in seconds',
      body: [
        'Safe deploys make Friday releases boring: gate commits in CI, hide features behind flags, limit blast radius with blue-green or metric-gated canaries, and evolve live databases through expand/contract phases.',
      ],
      ops: [
        { op: 'remove-note', id: 'trap-note' },
        {
          op: 'update-node',
          id: 'blue-app',
          patch: { state: 'normal', sublabel: 'v1.8 (standby)', badge: null },
        },
        {
          op: 'update-node',
          id: 'green-app',
          patch: { state: 'normal', sublabel: 'v1.8 (live)', badge: '100%' },
        },
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'normal', sublabel: 'Postgres', badge: null },
        },
        {
          op: 'update-edge',
          id: 'router-blue',
          patch: { label: '0% (warm)', style: 'dashed', state: 'dim' },
        },
        {
          op: 'update-edge',
          id: 'router-green',
          patch: { label: '100%', style: 'solid', state: 'normal' },
        },
        {
          op: 'add-note',
          note: {
            id: 'dora-note',
            anchor: { at: { x: 6, y: 9 } },
            text: 'Delivery health signals',
            tone: 'good',
            icon: 'check',
            rows: [
              ['Deploy freq', 'Small, routine releases'],
              ['Lead time', 'Minutes from commit'],
              ['Failure rate', 'Filtered by CI & gates'],
              ['Restore (MTTR)', 'Seconds via flag or canary'],
            ],
          },
        },
        { op: 'set-metric', id: 'err-rate', value: '0.1%', tone: 'good' },
        { op: 'set-metric', id: 'p99', value: '90 ms', tone: 'good' },
        { op: 'set-metric', id: 'mttr', value: '15 s', tone: 'good' },
        { op: 'set-metric', id: 'blast', value: '5% canary', tone: 'good' },
      ],
      takeaways: [
        'Run fast CI stages (build, unit, contract, integration) before any production deploy',
        'Feature flags decouple deploying dark code from releasing it to users',
        'Blue-green cuts over cleanly at 2× capacity; canaries cap blast radius at 1–5%',
        'Tie canary promotions to automated error-rate and latency rollback gates',
        'Use expand, dual-write, backfill, switch-reads, and contract for zero-downtime migrations',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-blue-green-vs-canary',
      kind: 'choice',
      prompt:
        'How does a canary release lower risk compared to a full blue-green cutover?',
      options: [
        'It exposes only a small share of live traffic (such as 5%) first before shifting the rest',
        'It removes the need to run unit or integration tests in CI',
        'It allows dropping live database columns immediately during deploy',
        'It eliminates the load balancer in front of application servers',
      ],
      answer: 0,
      explain:
        'Blue-green switches 100% of traffic at once; a canary starts at 1–5% so an unexpected bug only affects a tiny slice before automated gates roll it back.',
      step: 'canary-rollout',
    },
    {
      id: 'order-expand-contract',
      kind: 'order',
      prompt:
        'Order the five expand/contract steps to migrate a live database column with zero downtime.',
      items: [
        'Expand: add the new nullable column alongside the old one',
        'Write both: deploy code writing to both old and new columns',
        'Backfill: copy historical rows into the new column in batches',
        'Switch reads: read from the new column while still dual-writing',
        'Contract: stop writing the old column and drop it later',
      ],
      explain:
        'Old and new application versions share the database safely only while both shapes stay valid until every old reader is gone.',
      step: 'expand-contract',
    },
    {
      id: 'choice-canary-trap',
      kind: 'choice',
      prompt:
        'A canary on a low-traffic endpoint sees only 2 requests per minute and reports 0% errors after two minutes. Why should you not promote to 100% yet?',
      options: [
        'Four requests is too small a sample to distinguish luck from a real defect rate',
        'Canary routers automatically reset connections every two minutes',
        'Feature flags expire automatically after two minutes',
        'Blue-green deployments forbid running longer than two minutes',
      ],
      answer: 0,
      explain:
        'Low-traffic endpoints yield noisy metrics; a canary needs enough requests over time to give statistically meaningful error and latency signals.',
      step: 'watch-out-traps',
    },
    {
      id: 'numeric-canary-impact',
      kind: 'numeric',
      prompt:
        'Checkout serves 2,000 requests per minute. A canary sends 5% of traffic to v1.7, which hits a 20% error rate before rolling back. How many failed requests per minute occur during that window?',
      unit: 'errors/min',
      answer: 20,
      tolerance: 0.05,
      explain:
        '5% of 2,000 = 100 requests/min routed to the canary; 20% of 100 = 20 errors/min.',
      step: 'canary-rollback',
    },
  ],
  cards: [
    {
      front: 'Feature flag vs. canary release: how do they differ?',
      back: 'A feature flag toggles code paths per user or cohort inside deployed servers; a canary shifts a small share of network traffic to a new version of the service.',
    },
    {
      front: 'What is the trade-off of blue-green deployment?',
      back: 'Instant cutover and instant rollback by flipping traffic between two full stacks, at the cost of 2× server capacity during the switch and keeping DB schemas compatible with both.',
    },
    {
      front: 'List the 5 phases of an expand/contract database migration.',
      back: '1. Expand (add nullable shape) -> 2. Write both -> 3. Backfill in batches -> 4. Switch reads to new -> 5. Contract (stop old writes, drop old column).',
    },
    {
      front: 'What are the four classic delivery health (DORA) signals?',
      back: 'Deployment frequency, lead time for changes, change failure rate, and time to restore service (MTTR).',
    },
  ],
} satisfies Lesson;
