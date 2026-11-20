import type { Cheatsheet } from '../../model/cheatsheet';

/**
 * Module 08 (Shipping) cheatsheet: deploy strategies, zero-downtime schema
 * changes, and which tests catch which bugs.
 */
export const cheatsheet = {
  module: 'shipping',
  intro:
    'How to release changes without outages, migrate a live database safely, and spread tests where they catch the most.',
  sections: [
    {
      kind: 'table',
      title: 'Deploy Strategies',
      columns: ['Strategy', 'How it works', 'Rolling back', 'Cost and risk'],
      rows: [
        [
          'Recreate',
          'Stop the old version, start the new one',
          'Deploy the old version again',
          'Simple, but users see downtime',
        ],
        [
          'Rolling',
          'Replace instances a batch at a time',
          'Roll the batches back the same way',
          'Two versions serve at once; rollback is slow',
        ],
        [
          'Blue-green',
          'Bring up a full new stack, then switch all traffic',
          'Switch traffic back at once',
          'Double capacity during the switch; the DB must suit both',
        ],
        [
          'Canary',
          'Send a small share (1–5%) first, watch metrics, then widen',
          'Route the canary share back to the old version',
          'Needs reliable metrics and automatic gates',
        ],
        [
          'Feature flag',
          'Ship code switched off; turn it on per user or cohort',
          'Turn the flag off',
          'Old flags pile up; test both paths',
        ],
        [
          'Shadow traffic',
          'Copy live requests to the new version and discard its answers',
          'Nothing reaches users',
          'Side effects must be disabled; extra load',
        ],
      ],
    },
    {
      kind: 'list',
      title: 'Expand / Contract Migrations',
      items: [
        '1. Expand: add the new column or table, nullable or with a default; old code ignores it.',
        '2. Write both: deploy code that writes the old and the new shape.',
        '3. Backfill: copy existing rows into the new shape in small batches.',
        '4. Switch reads: read from the new shape, still writing both.',
        '5. Contract: stop writing the old shape, then drop it in a later release.',
      ],
    },
    {
      kind: 'table',
      title: 'Which Test Catches What',
      columns: ['Test', 'Catches', 'Speed'],
      rows: [
        ['Unit', 'Logic errors in one function or class', 'Milliseconds'],
        [
          'Contract',
          'A provider breaking what its consumers rely on',
          'Seconds',
        ],
        [
          'Integration',
          'Wrong assumptions about a real database, queue or API',
          'Seconds to minutes',
        ],
        [
          'End to end',
          'Broken user journeys across the whole stack',
          'Minutes; keep them few',
        ],
        [
          'Load',
          'Capacity limits and latency under expected peaks',
          'Minutes to hours',
        ],
        [
          'Chaos experiment',
          'Missing timeouts, retries and failover under real faults',
          'Planned, in a controlled blast radius',
        ],
      ],
    },
    {
      kind: 'list',
      title: 'Delivery Health Signals',
      items: [
        'Deployment frequency: how often changes reach production.',
        'Lead time for changes: from commit to running in production.',
        'Change failure rate: the share of deploys that need a fix or rollback.',
        'Time to restore: how long it takes to recover from a bad change.',
      ],
    },
    {
      kind: 'pattern',
      title: 'Canary with Automatic Rollback',
      when: 'A release can break a path that tests never exercised.',
      how: 'Route a small share of traffic to the new version, compare its error rate and latency against the old one, and roll back automatically when a gate fails.',
      watch:
        'Low traffic gives noisy metrics; let the canary run long enough to matter.',
      lesson: 'cicd',
    },
    {
      kind: 'pattern',
      title: 'Consumer-Driven Contract Tests',
      when: 'Each service passes its own tests, but they break when deployed together.',
      how: 'Consumers record the requests and responses they rely on; the provider’s pipeline replays those contracts and fails before it ships a breaking change.',
      watch:
        'Contracts check shape, not behaviour; keep a few real integration tests.',
      lesson: 'testing-at-scale',
    },
  ],
} satisfies Cheatsheet;
