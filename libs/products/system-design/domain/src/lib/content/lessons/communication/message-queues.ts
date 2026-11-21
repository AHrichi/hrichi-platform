import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 04.03: Message Queues (`message-queues`).
 * Scenario: Confirmation emails slow checkout (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'message-queues',
  learn: [
    'How a queue decouples slow work from fast user paths',
    'How worker pools level load at a steady pace',
    'Why at-least-once delivery needs idempotent consumers',
    'How backpressure and DLQs handle spikes and bad jobs',
  ],
  scene: {
    nodes: [
      {
        id: 'shopper',
        kind: 'client',
        at: { x: 1, y: 4 },
        label: 'Shopper',
        sublabel: 'POST /checkout',
      },
      {
        id: 'checkout',
        kind: 'server',
        at: { x: 4, y: 4 },
        label: 'Checkout API',
        sublabel: 'Sync handler',
      },
      {
        id: 'orders-db',
        kind: 'database',
        at: { x: 4, y: 7 },
        label: 'Orders DB',
        sublabel: 'Payments + dedupe',
      },
      {
        id: 'smtp',
        kind: 'external',
        at: { x: 12, y: 3 },
        label: 'Email SMTP',
        sublabel: '~1,200 ms',
      },
    ],
    edges: [
      {
        id: 'shopper-checkout',
        from: 'shopper',
        to: 'checkout',
        label: 'POST /pay',
      },
      { id: 'checkout-db', from: 'checkout', to: 'orders-db', label: 'SQL' },
      {
        id: 'checkout-smtp',
        from: 'checkout',
        to: 'smtp',
        label: 'Send receipt',
      },
    ],
    zones: [
      {
        id: 'app-zone',
        from: { x: 3, y: 1 },
        to: { x: 10, y: 8 },
        hue: 'rose',
        label: 'Order platform',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'queue-depth', label: 'Queue depth', icon: 'queue', value: '0' },
    {
      id: 'checkout-p50',
      label: 'Checkout p50',
      icon: 'timer',
      value: '1,240 ms',
    },
    { id: 'workers', label: 'Workers', icon: 'gear', value: '0' },
    { id: 'dlq', label: 'DLQ', icon: 'warning', value: '0' },
  ],
  steps: [
    {
      id: 'slow-checkout',
      label: 'Slow pay',
      kind: 'problem',
      title: 'Confirmation emails stall every checkout',
      body: [
        'When a buyer taps **Pay**, `Checkout API` records the order (**40 ms**) and calls a third-party **Email SMTP** provider inline before replying.',
        'Sending that receipt adds **1,200 ms** to every purchase—and whenever SMTP stalls, checkouts time out even though the payment already succeeded.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'checkout',
          patch: { state: 'hot', badge: 'Blocked 1.2s' },
        },
        { op: 'packet', edge: 'shopper-checkout', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'checkout-db', kind: 'write', wave: 1 },
        {
          op: 'packet',
          edge: 'checkout-smtp',
          kind: 'request',
          label: '1,200 ms',
          wave: 2,
        },
        {
          op: 'packet',
          edge: 'shopper-checkout',
          kind: 'response',
          reverse: true,
          label: '1,240 ms',
          wave: 3,
        },
        {
          op: 'set-metric',
          id: 'checkout-p50',
          value: '1,240 ms',
          tone: 'bad',
        },
      ],
    },
    {
      id: 'decouple-queue',
      label: 'Add queue',
      kind: 'technique',
      title: 'Drop a job on a queue and answer at once',
      body: [
        'Insert a durable **Email Queue** between Checkout and SMTP. Checkout saves the order, pushes a tiny `{ orderId, email }` message (**5 ms**), and returns `202 Accepted` right away.',
        'Checkout `p50` drops from **1,240 ms** to **45 ms**, and SMTP hiccups can no longer fail a payment.',
      ],
      changes: [
        { type: 'added', text: 'Durable Email Queue between Checkout and SMTP' },
        { type: 'changed', text: 'Checkout p50 drops to 45 ms' },
      ],
      ops: [
        { op: 'remove-edge', id: 'checkout-smtp' },
        {
          op: 'add-node',
          node: {
            id: 'email-queue',
            kind: 'queue',
            at: { x: 7, y: 3 },
            label: 'Email Queue',
            sublabel: 'FIFO buffer',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'checkout-queue',
            from: 'checkout',
            to: 'email-queue',
            label: 'Enqueue',
          },
        },
        {
          op: 'update-node',
          id: 'checkout',
          patch: { state: 'normal', sublabel: 'Async enqueue', badge: null },
        },
        { op: 'packet', edge: 'shopper-checkout', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'checkout-queue', kind: 'write', wave: 1 },
        {
          op: 'packet',
          edge: 'shopper-checkout',
          kind: 'response',
          reverse: true,
          label: '45 ms · 202',
          wave: 2,
        },
        { op: 'set-metric', id: 'queue-depth', value: '1' },
        { op: 'set-metric', id: 'checkout-p50', value: '45 ms', tone: 'good' },
      ],
      learns: [0],
    },
    {
      id: 'worker-pool',
      label: 'Worker pool',
      kind: 'technique',
      title: 'Workers drain jobs at a steady pace',
      body: [
        'Add a pool of **4 Email Workers** pulling jobs from the queue and calling SMTP in the background—a pattern called **queue-based load levelling**.',
        'Because workers process up to **20 emails/sec**, a sudden burst of 500 checkouts sits safely buffered instead of tripping SMTP rate limits.',
      ],
      changes: [
        { type: 'added', text: 'Pool of 4 Email Workers draining the queue' },
      ],
      ops: [
        { op: 'update-node', id: 'email-queue', patch: { state: 'normal' } },
        {
          op: 'add-node',
          node: {
            id: 'workers',
            kind: 'worker',
            at: { x: 9, y: 3 },
            label: 'Email workers',
            sublabel: '4 instances',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'queue-workers',
            from: 'email-queue',
            to: 'workers',
            label: 'Pull',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'workers-smtp',
            from: 'workers',
            to: 'smtp',
            label: '20/s max',
          },
        },
        { op: 'packet', edge: 'queue-workers', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'workers-smtp', kind: 'request', wave: 1 },
        { op: 'set-metric', id: 'workers', value: '4', tone: 'good' },
        { op: 'set-metric', id: 'queue-depth', value: '0', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'at-least-once',
      label: 'At-least-once',
      kind: 'technique',
      title: 'Hold visibility timeouts until ACK confirms',
      body: [
        'To prevent lost emails when a worker crashes mid-send, the queue hides a pulled job for a **30 s visibility timeout** instead of deleting it immediately.',
        'Only after SMTP confirms `250 OK` does the worker send **ACK** (_acknowledgement_) to delete the job. Otherwise it reappears (**at-least-once** delivery).',
      ],
      changes: [
        { type: 'added', text: 'Visibility timeout + ACK lifecycle note' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'workers',
          patch: { badge: '30 s lock' },
        },
        {
          op: 'add-note',
          note: {
            id: 'ack-note',
            anchor: { at: { x: 6, y: 6 } },
            text: 'Pull → Send → ACK (or redeliver)',
            tone: 'info',
            icon: 'check',
          },
        },
        { op: 'packet', edge: 'queue-workers', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'workers-smtp', kind: 'request', wave: 1 },
        {
          op: 'packet',
          edge: 'queue-workers',
          kind: 'response',
          reverse: true,
          label: 'ACK',
          wave: 2,
        },
      ],
    },
    {
      id: 'idempotent-consumer',
      label: 'Duplicate send',
      kind: 'watch-out',
      title: 'Make workers idempotent against redelivery',
      body: [
        'At-least-once promises delivery, **not** uniqueness. If a worker sends the email and crashes *before* ACKing, the broker redelivers—and the buyer receives two identical receipts.',
        'Make workers **idempotent** (_safe to repeat_): record `message_id` in `Orders DB` before emailing so any retry skips cleanly.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never run at-least-once queues without idempotent consumers or message-ID deduplication.',
        },
      ],
      changes: [
        { type: 'added', text: 'Dedupe lookup edge from Workers to Orders DB' },
      ],
      ops: [
        { op: 'remove-note', id: 'ack-note' },
        {
          op: 'update-node',
          id: 'workers',
          patch: { state: 'hot', badge: 'Crash pre-ACK' },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'workers-db',
            from: 'workers',
            to: 'orders-db',
            style: 'dashed',
            label: 'dedupe',
          },
        },
        {
          op: 'packet',
          edge: 'workers-smtp',
          kind: 'error',
          count: 2,
          label: '2× send?',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'workers-db',
          kind: 'write',
          label: 'Check msg_id',
          wave: 1,
        },
      ],
      learns: [2],
    },
    {
      id: 'backlog-backpressure',
      label: 'Backlog burst',
      kind: 'case',
      title: 'Buffer bursts, then trigger backpressure',
      body: [
        'A flash sale sends **200 checkouts/sec** while workers drain **20/sec**. The queue buffers the gap—`Queue depth` climbs to **12,000** while `Checkout p50` stays **48 ms**.',
        'Still, queue memory is finite. Apply **backpressure** before disk fills: autoscale workers, cap queue size or job TTL, and alert on rising backlog age.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'workers',
          patch: { state: 'normal', badge: '20/s cap' },
        },
        {
          op: 'update-node',
          id: 'email-queue',
          patch: { state: 'hot', load: 0.92, badge: '12k depth' },
        },
        {
          op: 'packet',
          edge: 'checkout-queue',
          kind: 'write',
          count: 4,
          label: '200/s burst',
          wave: 0,
        },
        { op: 'set-metric', id: 'queue-depth', value: '12,000', tone: 'bad' },
        { op: 'set-metric', id: 'checkout-p50', value: '48 ms', tone: 'good' },
      ],
    },
    {
      id: 'dead-letter-queue',
      label: 'Dead-letter Q',
      kind: 'technique',
      title: 'Route poison pills to a dead-letter queue',
      body: [
        'One malformed job (`bad@@email`) fails every attempt, waits out its visibility timeout, and retries forever—a **poison pill** wasting worker capacity.',
        'Set `maxRetries = 3`. After three failures, the broker moves the message to a **Dead-Letter Queue (`DLQ`)** so valid receipts drain cleanly and engineers can inspect or replay failures.',
      ],
      changes: [
        { type: 'added', text: 'Dead-Letter Queue (DLQ) for failed poison pills' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'email-queue',
          patch: { state: 'normal', load: 0.2, badge: null },
        },
        {
          op: 'add-node',
          node: {
            id: 'dlq',
            kind: 'queue',
            at: { x: 9, y: 7 },
            label: 'Dead-Letter Q',
            sublabel: 'maxRetries = 3',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'workers-dlq',
            from: 'workers',
            to: 'dlq',
            style: 'dashed',
            label: '3 fails',
          },
        },
        {
          op: 'packet',
          edge: 'workers-dlq',
          kind: 'error',
          label: 'Poison pill',
          wave: 0,
        },
        { op: 'set-metric', id: 'dlq', value: '1' },
        { op: 'set-metric', id: 'queue-depth', value: '180', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Queues absorb spikes and isolate slow work',
      body: [
        'Moving slow side effects onto a queue keeps user latency fast, levels traffic spikes across workers, and stays safe using idempotency keys, backpressure, and a DLQ.',
      ],
      ops: [
        { op: 'update-node', id: 'dlq', patch: { state: 'normal' } },
        { op: 'update-node', id: 'workers', patch: { badge: null } },
        {
          op: 'add-note',
          note: {
            id: 'queue-summary',
            anchor: { at: { x: 1, y: 7 } },
            text: 'Queue checklist',
            tone: 'info',
            icon: 'queue',
            rows: [
              ['User path', 'Enqueue & 202 fast'],
              ['Delivery', 'At-least-once + ACK'],
              ['Duplicates', 'Idempotent dedupe ID'],
              ['Failures', 'Max retries → DLQ'],
            ],
          },
        },
      ],
      takeaways: [
        'Push slow side effects (emails, thumbnails) onto a queue so user requests return immediately',
        'Use worker pools for load levelling so spikes never overwhelm downstream rate limits',
        'At-least-once delivery guarantees no lost jobs, requiring idempotent consumers by message ID',
        'Bound queue depth with backpressure and route poison pills to a dead-letter queue (DLQ)',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-idempotent-worker',
      kind: 'choice',
      prompt:
        'A worker sends a confirmation email, crashes before sending ACK, and the queue redelivers the job. What stops the customer from getting two emails?',
      options: [
        'Checking and recording the unique message_id in a dedupe store before calling SMTP',
        'Lowering the visibility timeout from 30 seconds to 1 second',
        'Deleting the message from the queue before the worker starts processing',
      ],
      answer: 0,
      explain:
        'At-least-once queues can always redeliver after a crash before ACK. Recording processed message IDs makes the worker idempotent. Deleting before processing risks losing messages (at-most-once).',
      step: 'idempotent-consumer',
    },
    {
      id: 'numeric-queue-backlog',
      kind: 'numeric',
      prompt:
        'During a 60-second flash sale, Checkout enqueues 120 jobs/sec while workers drain 20 jobs/sec. Starting from an empty queue, what is the queue depth after 60 seconds?',
      unit: 'jobs',
      answer: 6000,
      tolerance: 0.05,
      explain:
        'Net accumulation rate is 120 − 20 = 100 jobs/sec. Over 60 seconds, 100 × 60 = 6,000 jobs build up in the queue.',
      step: 'backlog-backpressure',
    },
    {
      id: 'choice-dlq-purpose',
      kind: 'choice',
      prompt:
        'Why should a message queue move a repeatedly failing job into a Dead-Letter Queue (DLQ) after maxRetries?',
      options: [
        'To stop a poison pill from retrying forever and starving healthy messages in the queue',
        'To compress large email payloads before they enter RAM',
        'To guarantee every message is processed in strict alphabetical order',
      ],
      answer: 0,
      explain:
        'A poison pill fails on every retry. Moving it to a DLQ isolates the bad payload for later inspection while healthy jobs keep draining.',
      step: 'dead-letter-queue',
    },
    {
      id: 'order-queue-ack',
      kind: 'order',
      prompt:
        'Order the lifecycle of one job under at-least-once queue delivery.',
      items: [
        'Checkout enqueues job and returns 202 Accepted',
        'Worker pulls job while broker starts visibility timeout',
        'Worker checks dedupe store and sends email via SMTP',
        'Worker sends ACK so broker deletes the job permanently',
      ],
      explain:
        'The job stays hidden only for the visibility timeout and is deleted only after the worker confirms completion with ACK.',
      step: 'at-least-once',
    },
  ],
  cards: [
    {
      front: 'What is queue-based load levelling?',
      back: 'Buffering bursty producer traffic in a queue so a fixed pool of workers can drain jobs at a steady, safe rate.',
    },
    {
      front: 'Why does at-least-once delivery require idempotent consumers?',
      back: 'If a worker finishes work and crashes before sending ACK, the broker redelivers the message; idempotent consumers dedupe by message ID.',
    },
    {
      front: 'What is a poison pill and how does a DLQ help?',
      back: 'A malformed or unprocessable job that fails every attempt; moving it to a Dead-Letter Queue after maxRetries prevents infinite retries from blocking healthy jobs.',
    },
    {
      front: 'How do you handle a growing queue backlog before running out of memory?',
      back: 'Alert on queue depth and age, autoscale workers if downstream allows, cap queue size or job TTL, and apply backpressure.',
    },
  ],
} satisfies Lesson;
