import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 04.04: Pub/Sub & Event Streams (`pub-sub`).
 * Scenario: "OrderPlaced" that five teams need (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'pub-sub',
  learn: [
    'How pub/sub topics fan out one event to many teams',
    'How consumer groups scale a team without duplicates',
    'How append-only log streams use offsets for replay',
    'Why partition keys preserve per-entity event order',
    'How additive schema evolution protects consumers',
  ],
  scene: {
    nodes: [
      {
        id: 'checkout',
        kind: 'service',
        at: { x: 1, y: 4 },
        label: 'Checkout',
        sublabel: 'OrderPlaced',
      },
      {
        id: 'billing',
        kind: 'service',
        at: { x: 9, y: 1 },
        label: 'Billing',
        sublabel: 'billing-grp',
      },
      {
        id: 'inventory',
        kind: 'service',
        at: { x: 12, y: 2 },
        label: 'Inventory',
        sublabel: 'Waiting for API',
        state: 'dim',
      },
      {
        id: 'shipping',
        kind: 'service',
        at: { x: 9, y: 4 },
        label: 'Shipping',
        sublabel: 'shipping-grp',
      },
      {
        id: 'fraud',
        kind: 'service',
        at: { x: 9, y: 7 },
        label: 'Fraud',
        sublabel: 'Waiting for API',
        state: 'dim',
      },
      {
        id: 'analytics',
        kind: 'service',
        at: { x: 12, y: 8 },
        label: 'Analytics',
        sublabel: 'analytics-grp',
        state: 'down',
        badge: 'down',
      },
    ],
    edges: [
      {
        id: 'co-billing',
        from: 'checkout',
        to: 'billing',
        label: 'POST /bill',
      },
      {
        id: 'co-shipping',
        from: 'checkout',
        to: 'shipping',
        label: 'POST /ship',
      },
      {
        id: 'co-analytics',
        from: 'checkout',
        to: 'analytics',
        label: 'POST /track',
        state: 'broken',
      },
    ],
    zones: [
      {
        id: 'subscribers',
        from: { x: 8, y: 0 },
        to: { x: 13, y: 9 },
        hue: 'teal',
        label: 'Five downstream teams',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'calls', label: 'Checkout calls', icon: 'link', value: '5 RPCs' },
    { id: 'groups', label: 'Team groups', icon: 'layers', value: '0' },
    { id: 'offset', label: 'Stream offset', icon: 'hash', value: '—' },
    { id: 'ordering', label: 'Ordering', icon: 'check', value: 'None' },
  ],
  steps: [
    {
      id: 'five-teams',
      label: 'Tight coupling',
      kind: 'problem',
      title: 'Five teams want OrderPlaced, and coupling hurts',
      body: [
        'Every time an order succeeds, **five teams** need to react: Billing, Shipping, Analytics, Inventory, and Fraud.',
        'Right now `Checkout` calls downstream HTTP hooks directly—Inventory and Fraud are still queued up waiting, and because Analytics is down for maintenance, Checkout requests time out.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'checkout',
          patch: { state: 'hot', badge: 'Coupled' },
        },
        { op: 'packet', edge: 'co-billing', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'co-shipping', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'co-analytics',
          kind: 'error',
          label: '503 fail',
          wave: 0,
        },
      ],
    },
    {
      id: 'topic-fan-out',
      label: 'Topic fan-out',
      kind: 'technique',
      title: 'Publish once to a topic; broker fans out',
      body: [
        'Introduce an `OrderPlaced` **event topic**. Checkout publishes one event and moves on—it never needs to know which teams listen.',
        'The broker **fans out** a copy to every subscribed service independently. Analytics stays insulated from Checkout, and Inventory and Fraud plug in without touching Checkout’s code.',
      ],
      changes: [
        { type: 'added', text: 'OrderPlaced topic decoupling Checkout from 5 teams' },
        { type: 'changed', text: 'Checkout emits 1 event instead of calling RPCs' },
      ],
      ops: [
        { op: 'remove-edge', id: 'co-billing' },
        { op: 'remove-edge', id: 'co-shipping' },
        { op: 'remove-edge', id: 'co-analytics' },
        {
          op: 'add-node',
          node: {
            id: 'topic',
            kind: 'stream',
            at: { x: 5, y: 4 },
            label: 'OrderPlaced',
            sublabel: 'Topic / Stream',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'co-topic',
            from: 'checkout',
            to: 'topic',
            label: 'publish',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'topic-billing', from: 'topic', to: 'billing' },
        },
        {
          op: 'add-edge',
          edge: { id: 'topic-inventory', from: 'topic', to: 'inventory' },
        },
        {
          op: 'add-edge',
          edge: { id: 'topic-shipping', from: 'topic', to: 'shipping' },
        },
        {
          op: 'add-edge',
          edge: { id: 'topic-fraud', from: 'topic', to: 'fraud' },
        },
        {
          op: 'add-edge',
          edge: { id: 'topic-analytics', from: 'topic', to: 'analytics' },
        },
        { op: 'packet', edge: 'co-topic', kind: 'event', wave: 0 },
        { op: 'set-metric', id: 'calls', value: '1 event', tone: 'good' },
      ],
      learns: [0],
    },
    {
      id: 'consumer-groups',
      label: 'Groups',
      kind: 'technique',
      title: 'Fan out across groups, load-balance inside one',
      body: [
        'Each team subscribes under its own **consumer group** (`billing-grp`, `shipping-grp`). **Every group** receives a full copy of `OrderPlaced`.',
        'Inside a single group, adding a second instance (`Shipping B`) splits partitions across workers—so Shipping scales throughput horizontally without double-shipping orders.',
      ],
      changes: [
        { type: 'added', text: 'Shipping B worker inside shipping-grp' },
        { type: 'changed', text: 'Analytics recovers and all 5 groups read events' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'checkout',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'analytics',
          patch: { state: 'normal', badge: 'caught up' },
        },
        {
          op: 'update-node',
          id: 'inventory',
          patch: { state: 'normal', sublabel: 'inventory-grp' },
        },
        {
          op: 'update-node',
          id: 'fraud',
          patch: { state: 'normal', sublabel: 'fraud-grp' },
        },
        {
          op: 'update-node',
          id: 'shipping',
          patch: { state: 'focus', sublabel: 'shipping-grp #1' },
        },
        {
          op: 'add-node',
          node: {
            id: 'shipping-b',
            kind: 'worker',
            at: { x: 12, y: 5 },
            label: 'Shipping B',
            sublabel: 'shipping-grp #2',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'topic-shipping-b',
            from: 'topic',
            to: 'shipping-b',
            label: 'part 1',
          },
        },
        { op: 'packet', edge: 'topic-billing', kind: 'event', wave: 0 },
        { op: 'packet', edge: 'topic-inventory', kind: 'event', wave: 0 },
        { op: 'packet', edge: 'topic-shipping', kind: 'event', wave: 0 },
        { op: 'packet', edge: 'topic-fraud', kind: 'event', wave: 0 },
        { op: 'set-metric', id: 'groups', value: '5 groups', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'log-offsets',
      label: 'Log & offsets',
      kind: 'technique',
      title: 'Store events in an append-only log with offsets',
      body: [
        'Basic pub/sub discards messages right after delivery. A **log-based stream** (such as Kafka) appends events to an immutable disk log numbered by sequential **offsets** (`#0` .. `#1042`).',
        'Reading never deletes data: each consumer group simply persists its own cursor offset, letting fast and slow teams read independently.',
      ],
      changes: [
        { type: 'added', text: 'Immutable log offset tracker note' },
      ],
      ops: [
        { op: 'update-node', id: 'shipping', patch: { state: 'normal' } },
        { op: 'update-node', id: 'shipping-b', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'topic',
          patch: { badge: 'offset #1042' },
        },
        {
          op: 'add-note',
          note: {
            id: 'offset-note',
            anchor: { at: { x: 2, y: 7 } },
            text: 'Log: [#1040] [#1041] [#1042]',
            tone: 'info',
            icon: 'stack',
          },
        },
        { op: 'set-metric', id: 'offset', value: '#1,042' },
      ],
    },
    {
      id: 'replay-case',
      label: 'Replay',
      kind: 'case',
      title: 'Reset an offset to replay history for new teams',
      body: [
        'A new **Search Index** team launches—or Analytics deploys a bug fix and needs last week’s orders recomputed.',
        'Because the log retains 7 days of events on disk, Analytics rewinds its offset back to `#0` and **replays** history without re-running Checkout or disturbing other groups.',
      ],
      changes: [
        { type: 'added', text: 'Search index group replaying from offset #0' },
      ],
      ops: [
        { op: 'remove-note', id: 'offset-note' },
        {
          op: 'add-node',
          node: {
            id: 'search-svc',
            kind: 'search',
            at: { x: 5, y: 8 },
            label: 'Search index',
            sublabel: 'New group #0',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'topic-search',
            from: 'topic',
            to: 'search-svc',
            label: 'replay #0..',
          },
        },
        {
          op: 'update-node',
          id: 'analytics',
          patch: { state: 'focus', badge: 'replay #0' },
        },
        {
          op: 'packet',
          edge: 'topic-analytics',
          kind: 'event',
          count: 3,
          label: 'replay',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'topic-search',
          kind: 'event',
          count: 3,
          label: 'backfill',
          wave: 0,
        },
        { op: 'set-metric', id: 'offset', value: 'Replay #0' },
      ],
      learns: [2],
    },
    {
      id: 'per-key-ordering',
      label: 'Key ordering',
      kind: 'technique',
      title: 'Partition by orderId to keep events in order',
      body: [
        'If `OrderPlaced` and `OrderCancelled` land on different partitions, parallel Shipping workers can process the cancellation *before* the placement.',
        'Hash a **partition key** (`orderId`) to assign partitions. All events for `#99` enter the **same partition**, read FIFO by one worker per group.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Global ordering blocks parallelism; per-key partitioning scales partitions while keeping every entity’s timeline exact.',
        },
      ],
      ops: [
        { op: 'update-node', id: 'search-svc', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'analytics',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'topic',
          patch: { badge: 'key = orderId' },
        },
        {
          op: 'packet',
          edge: 'co-topic',
          kind: 'event',
          label: 'key: ord-99',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'topic-shipping',
          kind: 'event',
          label: 'part 0 FIFO',
          wave: 1,
        },
        { op: 'set-metric', id: 'ordering', value: 'Per orderId', tone: 'good' },
        { op: 'set-metric', id: 'offset', value: '#1,043', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'schema-evolution',
      label: 'Schema trap',
      kind: 'watch-out',
      title: 'Evolve event schemas additively, never break',
      body: [
        'Checkout renames `totalCents` to `amount` in `OrderPlaced`. Immediately Billing, Fraud, and replayed Analytics jobs crash reading `undefined`.',
        'Published events are a **public contract**. Enforce compatibility via a **schema registry** and evolve **additively**: add new optional fields alongside old ones until every consumer migrates.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never delete or rename live event fields abruptly—old consumers and historical log replays will break.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'topic',
          patch: { state: 'hot', badge: 'v1 ≠ v2 break' },
        },
        {
          op: 'packet',
          edge: 'topic-billing',
          kind: 'error',
          label: 'Missing field',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'topic-fraud',
          kind: 'error',
          label: 'Parse fail',
          wave: 0,
        },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Decouple teams cleanly with log-based streams',
      body: [
        'Topics fan out events to independent consumer groups, append-only offsets enable replay, partition keys keep per-entity order, and additive schemas protect contracts.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'topic',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'pubsub-summary',
            anchor: { at: { x: 1, y: 7 } },
            text: 'Event stream rules',
            tone: 'info',
            icon: 'stack',
            rows: [
              ['Cross-team', 'Each team = own group'],
              ['Within team', 'More workers split parts'],
              ['Replay', 'Reset consumer offset'],
              ['Ordering', 'Partition key = entity ID'],
            ],
          },
        },
      ],
      takeaways: [
        'Publish events to a topic so producers stay decoupled from any number of consumers',
        'Separate consumer groups each receive every event; instances inside one group share partitions',
        'Append-only log streams persist offsets so consumers can rewind and replay history',
        'Use entity IDs as partition keys for ordering and evolve event schemas additively',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-consumer-groups',
      kind: 'choice',
      prompt:
        'Shipping runs 3 instances in consumer group shipping-grp, while Billing runs 2 instances in billing-grp on the same 6-partition OrderPlaced topic. How are events delivered?',
      options: [
        'Both groups receive every event, and each group splits the 6 partitions among its own instances',
        'Shipping and Billing split the events 50/50 so each order reaches only one team',
        'Every single instance receives a duplicate copy of all 6 partitions',
      ],
      answer: 0,
      explain:
        'Pub/sub fans out across distinct consumer groups (Billing and Shipping both get all events) while load-balancing partitions across instances within the same group.',
      step: 'consumer-groups',
    },
    {
      id: 'choice-partition-key',
      kind: 'choice',
      prompt:
        'Why must OrderPlaced and OrderCancelled carry orderId as the partition key?',
      options: [
        'To guarantee all events for the same order land on one partition and run in FIFO order',
        'To broadcast the order to all five teams simultaneously',
        'To allow the broker to delete events right after Shipping reads them',
      ],
      answer: 0,
      explain:
        'Ordering only holds inside a single partition. Hashing orderId keeps every event for that order together in sequence.',
      step: 'per-key-ordering',
    },
    {
      id: 'order-stream-replay',
      kind: 'order',
      prompt:
        'Put the steps to backfill a newly launched Search Index consumer from a 7-day log stream in order.',
      items: [
        'Register a new consumer group ID for Search Index',
        'Set the group’s starting offset to the earliest retained record (#0)',
        'Read historical events sequentially from disk into Search Index',
        'Continue tailing live events seamlessly as they arrive',
      ],
      explain:
        'A fresh group starts with its own independent offset; rewinding to #0 replays retained history without impacting existing teams.',
      step: 'replay-case',
    },
  ],
  cards: [
    {
      front: 'How do consumer groups combine pub/sub fan-out and work queues?',
      back: 'Different consumer groups each get a full copy of every message (fan-out), while instances inside the same group split partitions (load sharing).',
    },
    {
      front: 'What enables replay in an append-only event stream?',
      back: 'Events stay retained on disk by offset rather than deleted on read, so a consumer group can reset its offset cursor and re-read history.',
    },
    {
      front: 'Where does message ordering hold in a partitioned stream?',
      back: 'Strictly within a single partition; use the entity ID (such as orderId) as the partition key so related events stay ordered.',
    },
    {
      front: 'How should you evolve an event schema in production?',
      back: 'Add new optional fields additively and use a schema registry; never rename or delete fields while active consumers or replays still depend on them.',
    },
  ],
} satisfies Lesson;
