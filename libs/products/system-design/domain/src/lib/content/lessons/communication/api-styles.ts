import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 04.01: REST, RPC & GraphQL (`api-styles`).
 * Scenario: Mobile and web need different data (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'api-styles',
  learn: [
    'Why REST models resources, verbs, and idempotency',
    'How gRPC speeds up internal calls and streaming',
    'How GraphQL lets clients shape queries and avoid N+1',
    'How to evolve APIs safely with versioning',
    'Why cursor pagination beats offset for live feeds',
  ],
  scene: {
    nodes: [
      {
        id: 'phone',
        kind: 'phone',
        at: { x: 1, y: 2 },
        label: 'Mobile app',
        sublabel: 'Needs 3 fields',
      },
      {
        id: 'web-app',
        kind: 'client',
        at: { x: 1, y: 7 },
        label: 'Web dashboard',
        sublabel: 'Needs full view',
      },
      {
        id: 'orders-api',
        kind: 'server',
        at: { x: 5, y: 4 },
        label: 'Orders API',
        sublabel: 'Fixed JSON',
      },
      {
        id: 'orders-db',
        kind: 'database',
        at: { x: 12, y: 4 },
        label: 'Orders DB',
        sublabel: 'Primary store',
      },
    ],
    edges: [
      {
        id: 'phone-api',
        from: 'phone',
        to: 'orders-api',
        label: 'GET /orders',
      },
      {
        id: 'web-api',
        from: 'web-app',
        to: 'orders-api',
        label: 'GET /orders',
      },
      {
        id: 'api-db',
        from: 'orders-api',
        to: 'orders-db',
        label: 'SQL',
      },
    ],
    zones: [
      {
        id: 'backend',
        from: { x: 4, y: 1 },
        to: { x: 13, y: 8 },
        hue: 'teal',
        label: 'Storefront backend',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'payload', label: 'Payload', icon: 'file', value: '18 KB' },
    { id: 'trips', label: 'Round trips', icon: 'route', value: '4' },
    { id: 'wire', label: 'Wire format', icon: 'layers', value: 'JSON' },
    { id: 'retries', label: 'POST retry', icon: 'shield', value: 'Unsafe' },
  ],
  steps: [
    {
      id: 'two-screens',
      label: 'Two screens',
      kind: 'problem',
      title: 'Mobile and web want very different shapes',
      body: [
        'Your storefront serves a **mobile app** showing an order summary (ID, status, total) and a **web dashboard** displaying items, shipping address, and invoice lines.',
        'One fixed JSON endpoint forces mobile to download **18 KB** of unused fields (**over-fetching**) or fire **4 separate calls** to stitch screens together (**under-fetching**).',
      ],
      ops: [
        { op: 'update-node', id: 'phone', patch: { state: 'focus' } },
        { op: 'update-node', id: 'web-app', patch: { state: 'focus' } },
        {
          op: 'packet',
          edge: 'phone-api',
          kind: 'request',
          count: 3,
          label: '4 calls',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'phone-api',
          kind: 'response',
          reverse: true,
          label: '18 KB JSON',
          wave: 1,
        },
      ],
    },
    {
      id: 'rest-verbs',
      label: 'REST & verbs',
      kind: 'technique',
      title: 'Model nouns as resources and actions as verbs',
      body: [
        '**REST** organises APIs around resource URLs like `/orders/42` paired with standard HTTP verbs. `GET` reads safely and works seamlessly with HTTP caches (`ETag`, `Cache-Control`).',
        '`PUT` replaces a known resource, `DELETE` removes it, and `POST` creates a new one. `GET`, `PUT`, and `DELETE` are _idempotent_—repeating them leaves the same result.',
      ],
      changes: [
        { type: 'added', text: 'HTTP method idempotency reference note' },
      ],
      ops: [
        { op: 'update-node', id: 'web-app', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'orders-api',
          patch: { state: 'focus', badge: 'REST JSON' },
        },
        {
          op: 'add-note',
          note: {
            id: 'verbs-note',
            anchor: { at: { x: 1, y: 4.5 } },
            text: 'HTTP verbs',
            tone: 'info',
            icon: 'check',
            rows: [
              ['GET / PUT / DELETE', 'Idempotent'],
              ['POST', 'Not idempotent'],
            ],
          },
        },
      ],
    },
    {
      id: 'idempotent-post',
      label: 'Idempotency',
      kind: 'watch-out',
      title: 'Make POST retries safe with idempotency keys',
      body: [
        'Unlike `PUT`, `POST /orders` is **not** idempotent. If mobile times out waiting for a receipt and retries, the server creates two orders and charges twice.',
        'Have the client send a unique `Idempotency-Key` header per attempt. The server stores the first result under that key and replays it on any retry.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Scope idempotency keys per client, expire them after 24 h, and reject a reused key sent with a different body.',
        },
      ],
      changes: [
        {
          type: 'changed',
          text: 'Checkout retries protected by Idempotency-Key',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'phone',
          patch: { badge: 'Idempotency-Key' },
        },
        {
          op: 'packet',
          edge: 'phone-api',
          kind: 'write',
          count: 2,
          label: 'POST + retry',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'phone-api',
          kind: 'response',
          reverse: true,
          label: 'Same 201',
          wave: 1,
        },
        { op: 'set-metric', id: 'retries', value: 'Keyed', tone: 'good' },
      ],
      learns: [0],
    },
    {
      id: 'grpc-internal',
      label: 'gRPC & streams',
      kind: 'technique',
      title: 'Use gRPC and Protobuf between internal services',
      body: [
        'Inside your data centre, `Orders API` calls `Pricing` and `Inventory` thousands of times per second. Parsing verbose JSON on every hop wastes CPU.',
        '**gRPC** compiles `.proto` contracts into binary **Protobuf** payloads (~4× smaller) multiplexed over **HTTP/2**, supporting fast RPCs and live **streaming**. Browsers still need a proxy to call it.',
      ],
      changes: [
        { type: 'added', text: 'Pricing and Inventory internal gRPC services' },
        { type: 'changed', text: 'Internal wire format switched to Protobuf' },
      ],
      ops: [
        { op: 'remove-note', id: 'verbs-note' },
        {
          op: 'update-node',
          id: 'phone',
          patch: { badge: null, state: 'normal' },
        },
        {
          op: 'add-node',
          node: {
            id: 'pricing-svc',
            kind: 'service',
            at: { x: 8, y: 2 },
            label: 'Pricing svc',
            sublabel: 'gRPC · HTTP/2',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'inventory-svc',
            kind: 'service',
            at: { x: 8, y: 7 },
            label: 'Inventory svc',
            sublabel: 'gRPC stream',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-pricing',
            from: 'orders-api',
            to: 'pricing-svc',
            label: 'Protobuf',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-inventory',
            from: 'orders-api',
            to: 'inventory-svc',
            label: 'Stream',
          },
        },
        { op: 'packet', edge: 'api-pricing', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'api-inventory',
          kind: 'event',
          count: 2,
          wave: 0,
        },
        { op: 'set-metric', id: 'wire', value: 'JSON + gRPC' },
      ],
      learns: [1],
    },
    {
      id: 'graphql-shaping',
      label: 'GraphQL shape',
      kind: 'technique',
      title: 'Let clients ask for the exact fields they need',
      body: [
        'At the public edge, **GraphQL** exposes one `POST /graphql` endpoint where clients send a query describing the exact response tree they want.',
        'Mobile requests `{ id status total }` and gets **0.8 KB** in **1 round trip**; web requests nested items and invoices in the same single call—trading away standard HTTP URL caching.',
      ],
      changes: [
        { type: 'changed', text: 'Orders API adds a GraphQL edge schema' },
        { type: 'changed', text: 'Mobile payload drops from 18 KB to 0.8 KB' },
      ],
      ops: [
        { op: 'update-node', id: 'pricing-svc', patch: { state: 'normal' } },
        { op: 'update-node', id: 'inventory-svc', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'orders-api',
          patch: { sublabel: 'GraphQL edge', badge: 'POST /graphql' },
        },
        {
          op: 'update-edge',
          id: 'phone-api',
          patch: { label: '{ id status }' },
        },
        {
          op: 'update-edge',
          id: 'web-api',
          patch: { label: '{ items, invoice }' },
        },
        { op: 'packet', edge: 'phone-api', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'phone-api',
          kind: 'response',
          reverse: true,
          label: '0.8 KB',
          wave: 1,
        },
        { op: 'set-metric', id: 'payload', value: '0.8 KB', tone: 'good' },
        { op: 'set-metric', id: 'trips', value: '1', tone: 'good' },
        { op: 'set-metric', id: 'wire', value: 'GQL + gRPC', tone: 'good' },
      ],
    },
    {
      id: 'graphql-n-plus-one',
      label: 'N+1 trap',
      kind: 'watch-out',
      title: 'Guard GraphQL resolvers against N+1 queries',
      body: [
        'Flexibility hides a trap: fetching **50 orders** runs `1` SQL query for orders, then each row’s `items` resolver fires its own query—**51 queries** (**N+1 problem**).',
        'Batch keys per request with a **DataLoader** (`WHERE order_id IN (...)`) to collapse 51 round trips into 2, and enforce query depth limits.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'DataLoader collects keys across one tick of the event loop and runs a single batched lookup.',
        },
      ],
      ops: [
        { op: 'update-node', id: 'orders-api', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'hot', load: 0.9, badge: '51 SQL hits' },
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'error',
          count: 4,
          label: '1 + N queries',
          wave: 0,
        },
      ],
      learns: [2],
    },
    {
      id: 'api-versioning',
      label: 'Versioning',
      kind: 'technique',
      title: 'Evolve contracts without breaking older apps',
      body: [
        'Older mobile builds stay installed for months. Renaming `total` to `amount` breaks every un-updated phone overnight.',
        'Prefer **additive changes**: add new fields while keeping old ones working, and mark removals `@deprecated` with sunset dates. For breaking REST changes, bump the URI (`/v2/orders`) or `Accept` header.',
      ],
      changes: [
        { type: 'added', text: 'Additive evolution & /v2 contract note' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'normal', load: null, badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'version-note',
            anchor: { node: 'orders-api' },
            text: 'Add fields · @deprecated old · /v2 only on break',
            tone: 'info',
            icon: 'layers',
          },
        },
      ],
      learns: [3],
    },
    {
      id: 'cursor-pagination',
      label: 'Pagination',
      kind: 'case',
      title: 'Swap slow OFFSET pages for keyset cursors',
      body: [
        'A buyer scrolls to page 2,500 (`OFFSET 50000 LIMIT 20`). The DB must scan and discard 50,000 rows—and new inserts shift offsets, duplicating or skipping items.',
        '**Cursor pagination** returns an opaque cursor encoding `(created_at, id)` and runs `WHERE (created_at, id) < cursor LIMIT 20`—an instant indexed jump at any depth.',
      ],
      ops: [
        { op: 'remove-note', id: 'version-note' },
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'focus', badge: 'Keyset index' },
        },
        {
          op: 'add-note',
          note: {
            id: 'cursor-note',
            anchor: { at: { x: 1, y: 4.5 } },
            text: 'Cursor = (created_at, id)',
            tone: 'good',
            icon: 'search',
          },
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'request',
          label: 'WHERE key < cursor',
          wave: 0,
        },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Match the API style to the caller',
      body: [
        'Public REST shines with HTTP caching and idempotency keys, GraphQL shapes payloads per screen, and internal gRPC keeps service-to-service hops fast and strongly typed.',
      ],
      ops: [
        { op: 'remove-note', id: 'cursor-note' },
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'orders-api',
          patch: { badge: null, sublabel: 'REST / GraphQL' },
        },
        {
          op: 'add-note',
          note: {
            id: 'styles-table',
            anchor: { at: { x: 1, y: 4.5 } },
            text: 'API style trade-offs',
            tone: 'info',
            icon: 'layers',
            rows: [
              ['REST', 'Public & HTTP cache'],
              ['gRPC', 'Internal & streaming'],
              ['GraphQL', 'Custom screen shapes'],
              ['Pagination', 'Cursor (created_at, id)'],
            ],
          },
        },
      ],
      takeaways: [
        'Use Idempotency-Key headers so retried POST requests never double-charge',
        'Use gRPC with Protobuf over HTTP/2 for fast internal RPCs and streams',
        'Use GraphQL to avoid over/under-fetching, paired with DataLoader against N+1',
        'Evolve APIs additively and paginate feeds with indexed keyset cursors',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-idempotency-key',
      kind: 'choice',
      prompt:
        'A mobile app sends POST /orders, times out before reading the reply, and retries. What prevents creating two duplicate orders?',
      options: [
        'Sending a unique Idempotency-Key header stored by the server with the first response',
        'Switching the endpoint from JSON to Protobuf',
        'Adding OFFSET 1 LIMIT 1 to the database query',
      ],
      answer: 0,
      explain:
        'POST is not idempotent by default. An Idempotency-Key lets the server recognise the retry and return the saved result from the first attempt.',
      step: 'idempotent-post',
    },
    {
      id: 'numeric-n-plus-one',
      kind: 'numeric',
      prompt:
        'A GraphQL query loads 40 orders and calls an unbatched items resolver once per order. How many SQL queries hit the database in total?',
      unit: 'queries',
      answer: 41,
      tolerance: 0.05,
      explain:
        '1 query fetches the 40 orders, and N = 40 separate queries fetch each order’s items: 1 + 40 = 41 queries.',
      step: 'graphql-n-plus-one',
    },
    {
      id: 'choice-cursor-tiebreaker',
      kind: 'choice',
      prompt:
        'Why should a cursor pagination token encode both created_at and id instead of created_at alone?',
      options: [
        'Two rows with the same timestamp need id as a unique tiebreaker so no row is skipped',
        'Database indexes cannot sort timestamps without a string suffix',
        'GraphQL requires every cursor to be at least 32 bytes long',
      ],
      answer: 0,
      explain:
        'If multiple rows share a timestamp, filtering strictly by created_at > last could skip or repeat ties. Pairing (created_at, id) creates a total unique ordering.',
      step: 'cursor-pagination',
    },
    {
      id: 'order-api-evolution',
      kind: 'order',
      prompt:
        'Put the steps for safely renaming a field in a live API from first to last.',
      items: [
        'Add the new field alongside the existing field',
        'Mark the old field deprecated with a sunset date',
        'Wait for clients to migrate to the new field',
        'Remove the old field after traffic drops to zero',
      ],
      explain:
        'Additive evolution keeps older app versions running while clients upgrade, avoiding sudden breaking changes.',
      step: 'api-versioning',
    },
  ],
  cards: [
    {
      front: 'Which HTTP methods are idempotent by definition?',
      back: 'GET, PUT, and DELETE are idempotent; POST and PATCH are not idempotent by default.',
    },
    {
      front: 'When should you prefer gRPC over REST?',
      back: 'For high-throughput internal service-to-service calls and streaming over HTTP/2 with strongly typed Protobuf contracts.',
    },
    {
      front: 'What is the GraphQL N+1 problem and how do you fix it?',
      back: 'A parent query returning N items triggers N separate child SQL queries; fix it by batching keys per request with DataLoader.',
    },
    {
      front: 'Why does cursor pagination beat OFFSET pagination?',
      back: 'Cursor pagination jumps straight to an indexed (sort_key, id) boundary in O(log N) and avoids skipped or duplicated rows during live inserts.',
    },
  ],
} satisfies Lesson;
