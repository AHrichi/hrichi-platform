import type { Cheatsheet } from '../../model/cheatsheet';

/**
 * Module 06 (Architecture) cheatsheet: monolith vs microservices, saga styles,
 * compensation rules, batch vs stream, and service discovery.
 */
export const cheatsheet = {
  module: 'architecture',
  intro:
    'How to split a system into services (or not), keep data consistent across them, and process data in batches or streams.',
  sections: [
    {
      kind: 'table',
      title: 'Monolith vs Microservices',
      columns: ['Concern', 'Modular monolith', 'Microservices'],
      rows: [
        [
          'Deploys',
          'One unit, released together',
          'Each service on its own schedule',
        ],
        [
          'Teams',
          'One codebase; coordination grows with headcount',
          'Each team owns its services end to end',
        ],
        [
          'Calls between parts',
          'In-process function calls',
          'Network calls that are slower and can fail',
        ],
        [
          'Data',
          'One database with joins and local transactions',
          'A database per service; no cross-service joins',
        ],
        ['Consistency', 'ACID transactions', 'Sagas and eventual consistency'],
        [
          'Operations',
          'One thing to run, log and monitor',
          'Discovery, tracing and many pipelines',
        ],
        [
          'Scaling',
          'Scale the whole application',
          'Scale only the hot services',
        ],
        [
          'Good default for',
          'Small teams and young products',
          'Many teams with stable domain boundaries',
        ],
      ],
    },
    {
      kind: 'table',
      title: 'Saga Styles',
      columns: ['Style', 'Who drives the flow', 'Strengths', 'Weaknesses'],
      rows: [
        [
          'Orchestration',
          'A coordinator calls each step and, on failure, the compensations',
          'The flow is visible in one place; easy timeouts',
          'The coordinator couples to every participant',
        ],
        [
          'Choreography',
          'Each service reacts to the previous one’s events',
          'Loose coupling; no central service',
          'The flow is implicit and hard to trace or change',
        ],
        [
          'Two-phase commit',
          'A coordinator asks all to prepare, then to commit',
          'Truly atomic across resources',
          'Blocks if the coordinator fails; holds locks; rarely available across services',
        ],
      ],
    },
    {
      kind: 'list',
      title: 'Compensation Rules',
      items: [
        'Every step that changes state has a compensating action (refund, release, cancel).',
        'Compensations must be idempotent and retryable: they will run more than once.',
        'Order steps so the ones that cannot be undone run last.',
        'Show intermediate states (“pending”) to users instead of pretending the saga is atomic.',
        'Give the whole saga a timeout and an owner who can see where it stopped.',
      ],
    },
    {
      kind: 'table',
      title: 'Batch vs Stream Processing',
      columns: ['Aspect', 'Batch', 'Stream'],
      rows: [
        [
          'Input',
          'A bounded dataset (yesterday’s orders)',
          'An unbounded flow of events',
        ],
        ['Latency', 'Minutes to hours', 'Milliseconds to seconds'],
        [
          'Time',
          'Simple: the job sees all the data',
          'Windows, event time vs processing time, late data',
        ],
        [
          'Fixing mistakes',
          'Re-run the job',
          'Replay the log from an earlier offset',
        ],
        [
          'Fits',
          'Reports, billing, model training',
          'Fraud alerts, live dashboards',
        ],
      ],
    },
    {
      kind: 'table',
      title: 'Service Discovery Styles',
      columns: ['Style', 'How a caller finds an instance', 'Trade-off'],
      rows: [
        [
          'Client-side',
          'The client queries a registry and balances itself',
          'Fewer hops; every client needs the logic',
        ],
        [
          'Server-side',
          'The client calls a load balancer that knows the registry',
          'Simple clients; one more hop',
        ],
        [
          'DNS-based',
          'A name resolves to healthy instance addresses',
          'Universal; caching delays updates',
        ],
        [
          'Service mesh',
          'A sidecar proxy beside each service routes calls',
          'Retries, mTLS and metrics for free; more infrastructure',
        ],
      ],
    },
    {
      kind: 'pattern',
      title: 'Transactional Outbox',
      when: 'A service must update its database and publish an event, and doing both separately can lose one.',
      how: 'Write the event to an outbox table in the same local transaction as the change; a relay reads the outbox and publishes it.',
      watch:
        'The relay delivers at least once, so consumers must be idempotent.',
      lesson: 'sagas',
    },
    {
      kind: 'pattern',
      title: 'Split Along Domain Boundaries',
      when: 'Teams keep blocking each other in a shared codebase.',
      how: 'First draw modules by business capability inside the monolith, give each its own data, and only extract a service once its boundary has stopped moving.',
      watch: 'Services that must change together are one service split in two.',
      lesson: 'monolith-microservices',
    },
    {
      kind: 'pattern',
      title: 'Heartbeat Registry',
      when: 'Instances come and go every minute, so hard-coded addresses go stale.',
      how: 'Each instance registers on start and renews with a heartbeat; the registry drops entries whose lease expires.',
      watch:
        'Callers still need timeouts: a registry can lag behind a crashed instance.',
      lesson: 'service-discovery',
    },
  ],
} satisfies Cheatsheet;
