import type { Cheatsheet } from '../../model/cheatsheet';

/**
 * Module 04 (Communication) cheatsheet: API styles, HTTP method semantics,
 * message delivery guarantees and ordering.
 */
export const cheatsheet = {
  module: 'communication',
  intro:
    'Choosing how services and clients talk, what a message broker really promises, and how to make retries safe.',
  sections: [
    {
      kind: 'table',
      title: 'API Styles',
      columns: ['Style', 'Shape on the wire', 'Best for', 'Weak at'],
      rows: [
        [
          'REST',
          'Resources and HTTP verbs, usually JSON',
          'Public APIs; HTTP caching',
          'Over- or under-fetching for complex screens',
        ],
        [
          'gRPC',
          'Protobuf over HTTP/2 with generated clients',
          'Internal service calls; streaming',
          'Browsers need a proxy; payloads not human-readable',
        ],
        [
          'GraphQL',
          'One endpoint; the client describes the shape it wants',
          'Many clients needing different fields',
          'HTTP caching, N+1 resolvers, query cost limits',
        ],
        [
          'WebSocket',
          'Full-duplex frames over one long-lived connection',
          'Chat, collaboration, live games',
          'Stateful connections make scaling and deploys harder',
        ],
        [
          'Server-Sent Events',
          'A one-way text stream over plain HTTP',
          'Live feeds and notifications',
          'Server to client only',
        ],
        [
          'Webhook',
          'The provider POSTs to your URL when something happens',
          'Telling third parties about events',
          'Receiver must be reachable; needs retries and signatures',
        ],
      ],
    },
    {
      kind: 'table',
      title: 'HTTP Methods & Idempotency',
      columns: ['Method', 'Safe', 'Idempotent', 'Typical use'],
      rows: [
        ['GET', 'Yes', 'Yes', 'Read a resource'],
        ['PUT', 'No', 'Yes', 'Create or replace at a known URL'],
        ['DELETE', 'No', 'Yes', 'Remove a resource'],
        ['PATCH', 'No', 'Not by default', 'Partial update'],
        ['POST', 'No', 'No', 'Create or trigger an action'],
      ],
    },
    {
      kind: 'table',
      title: 'Delivery Guarantees',
      columns: [
        'Guarantee',
        'What can happen',
        'How it is built',
        'Consumer must',
      ],
      rows: [
        [
          'At-most-once',
          'Messages can be lost, never duplicated',
          'Acknowledge before processing, or fire and forget',
          'Tolerate gaps (metrics, telemetry)',
        ],
        [
          'At-least-once',
          'Never lost, sometimes delivered twice',
          'Acknowledge after processing; redeliver on timeout',
          'Be idempotent: dedupe by message id',
        ],
        [
          'Effectively-once',
          'Each effect is applied once',
          'At-least-once plus idempotent writes, or offsets committed with the output',
          'Keep dedupe state or commit atomically',
        ],
      ],
    },
    {
      kind: 'list',
      title: 'Ordering & Failure Rules',
      items: [
        'Order is kept only within one partition or queue; pick the partition key by the entity whose events must stay in order.',
        'Parallel consumers and retries can reorder messages unless a key is processed by one consumer at a time.',
        'After a few failed attempts, move the message to a dead-letter queue instead of blocking the rest.',
        'Watch queue depth and consumer lag: a growing backlog is the early warning.',
        'Evolve message schemas additively, so old consumers can still read new events.',
      ],
    },
    {
      kind: 'pattern',
      title: 'Idempotency Keys',
      when: 'A client times out on a payment POST and retries, risking a double charge.',
      how: 'The client sends a unique Idempotency-Key header; the server stores the key with the first result and returns that same result for any repeat.',
      watch:
        'Scope keys per client and expire them; a reused key with a different body is an error.',
      lesson: 'api-styles',
    },
    {
      kind: 'pattern',
      title: 'Cursor Pagination',
      when: 'Offset pages get slow deep into a list and skip or repeat items while rows are inserted.',
      how: 'Return an opaque cursor encoding the last seen sort key (for example created_at plus id) and fetch the next page with WHERE (key) > cursor.',
      watch:
        'The sort key must be unique and indexed; add the id as a tiebreaker.',
      lesson: 'api-styles',
    },
    {
      kind: 'pattern',
      title: 'Queue-Based Load Levelling',
      when: 'Slow side work (emails, thumbnails) sits in the request path and spikes break it.',
      how: 'Put a job on a queue and answer right away; a pool of workers drains the queue at a steady rate.',
      watch:
        'Set a maximum queue size or age, and alert on backlog before users notice.',
      lesson: 'message-queues',
    },
    {
      kind: 'pattern',
      title: 'Fan-Out over Pub/Sub',
      when: 'Several teams need to react to the same event without the producer knowing them.',
      how: 'Publish to a topic; each team subscribes with its own consumer group, and a log-based stream lets new consumers replay history.',
      watch:
        'Events become a public contract: version them and never remove fields abruptly.',
      lesson: 'pub-sub',
    },
  ],
} satisfies Cheatsheet;
