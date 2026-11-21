import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 06.04: Batch vs Stream Processing (`batch-stream`).
 * Scenario: Nightly sales report vs live fraud alerts (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'batch-stream',
  learn: [
    'How batch jobs process bounded datasets on a schedule',
    'How stream processors turn unbounded events into windows',
    'Why event time differs from processing time',
    'How Lambda and Kappa architectures unify or split paths',
    'What exactly-once processing guarantees—and where it ends',
  ],
  scene: {
    nodes: [
      {
        id: 'pos',
        kind: 'client',
        at: { x: 1, y: 4 },
        label: 'Card swipes',
        sublabel: '5,000 events/s',
      },
      {
        id: 'orders-db',
        kind: 'database',
        at: { x: 5, y: 2 },
        label: 'Orders Store',
        sublabel: 'Daily partitions',
      },
      {
        id: 'cron',
        kind: 'scheduler',
        at: { x: 5, y: 5 },
        label: 'Nightly Cron',
        sublabel: '02:00 UTC',
      },
      {
        id: 'batch-job',
        kind: 'worker',
        at: { x: 9, y: 3 },
        label: 'Batch Worker',
        sublabel: 'Reads yesterday',
      },
      {
        id: 'warehouse',
        kind: 'storage',
        at: { x: 12, y: 3 },
        label: 'Finance Report',
        sublabel: 'Daily totals',
      },
    ],
    edges: [
      {
        id: 'pos-db',
        from: 'pos',
        to: 'orders-db',
        label: 'Save order',
      },
      {
        id: 'cron-batch',
        from: 'cron',
        to: 'batch-job',
        label: 'Trigger',
      },
      {
        id: 'db-batch',
        from: 'orders-db',
        to: 'batch-job',
        label: 'Bounded day',
      },
      {
        id: 'batch-wh',
        from: 'batch-job',
        to: 'warehouse',
        label: 'Write report',
      },
    ],
    zones: [
      {
        id: 'batch-zone',
        from: { x: 4, y: 1 },
        to: { x: 13, y: 6 },
        hue: 'amber',
        label: 'Batch pipeline',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'latency', label: 'Alert latency', icon: 'timer', value: '24 h' },
    { id: 'input', label: 'Input shape', icon: 'stack', value: 'Bounded' },
    { id: 'window', label: 'Window', icon: 'clock', value: '1 day' },
    { id: 'delivery', label: 'Guarantee', icon: 'shield', value: 'Batch run' },
  ],
  steps: [
    {
      id: 'nightly-batch',
      label: 'Nightly lag',
      kind: 'problem',
      title: 'Nightly batch reports catch fraud 24 hours late',
      body: [
        'Every night at `02:00 UTC`, a **Batch Worker** scans yesterday’s complete **Orders Store** slice—a **bounded dataset**—and publishes the daily finance report.',
        'That is cheap and accurate for accounting, yet useless against stolen credit cards: a thief can rack up hundreds of fraudulent swipes long before 2 AM arrives.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'batch-job',
          patch: { state: 'focus', badge: 'Runs at 2 AM' },
        },
        { op: 'packet', edge: 'pos-db', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'cron-batch', kind: 'event', wave: 1 },
        {
          op: 'packet',
          edge: 'db-batch',
          kind: 'request',
          label: '24h slice',
          wave: 2,
        },
        { op: 'packet', edge: 'batch-wh', kind: 'write', wave: 3 },
        {
          op: 'add-note',
          note: {
            id: 'fraud-gap',
            anchor: { node: 'pos' },
            text: '24 h fraud blind spot',
            tone: 'bad',
            icon: 'warning',
          },
        },
      ],
    },
    {
      id: 'batch-vs-stream',
      label: 'Stream path',
      kind: 'technique',
      title: 'Batch reads finite slices; streams run live',
      body: [
        '**Batch jobs** read finite, complete snapshots (`yesterday`), so fixing a bug simply means re-running the job. **Stream processing** reads an **unbounded event log** continuously as each card swipe arrives.',
        'Adding a live stream drops fraud detection latency from **24 hours** down to **under 2 seconds**, while batch keeps feeding finance reports.',
      ],
      changes: [
        { type: 'added', text: 'Event Stream, Fraud Stream worker, and Alerts service' },
        { type: 'changed', text: 'Alert latency drops from 24 h to 1.5 s' },
      ],
      ops: [
        { op: 'remove-note', id: 'fraud-gap' },
        {
          op: 'update-node',
          id: 'batch-job',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-node',
          node: {
            id: 'stream-bus',
            kind: 'stream',
            at: { x: 5, y: 8 },
            label: 'Event Stream',
            sublabel: 'Unbounded log',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'stream-proc',
            kind: 'worker',
            at: { x: 9, y: 8 },
            label: 'Fraud Stream',
            sublabel: 'Per-swipe checks',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'alerts',
            kind: 'service',
            at: { x: 12, y: 8 },
            label: 'Fraud Alerts',
            sublabel: 'Blocks card',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'pos-stream',
            from: 'pos',
            to: 'stream-bus',
            label: 'Swipe event',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'stream-proc-e',
            from: 'stream-bus',
            to: 'stream-proc',
            label: 'Offsets',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'proc-alerts',
            from: 'stream-proc',
            to: 'alerts',
            label: '< 2 s',
          },
        },
        { op: 'packet', edge: 'pos-stream', kind: 'event', wave: 0 },
        { op: 'packet', edge: 'stream-proc-e', kind: 'event', wave: 1 },
        {
          op: 'packet',
          edge: 'proc-alerts',
          kind: 'error',
          label: 'Block!',
          wave: 2,
        },
        { op: 'set-metric', id: 'latency', value: '1.5 s', tone: 'good' },
      ],
      learns: [0],
    },
    {
      id: 'windows',
      label: 'Windows',
      kind: 'technique',
      title: 'Group unbounded streams into finite windows',
      body: [
        'Fraud rules count bursts like "more than 5 swipes in 1 minute." Because an event stream never ends, you slice it into finite **windows**:',
        '• **Tumbling**: fixed, non-overlapping buckets (`[12:00–12:01]`).\n• **Sliding**: overlapping intervals updating every few seconds (`last 60 s`).\n• **Session**: groups bursts until an inactivity gap.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Windows give aggregations like COUNT and SUM a finish line on an infinite stream.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'stream-proc',
          patch: { badge: '60 s window' },
        },
        { op: 'set-metric', id: 'input', value: 'Unbounded' },
        { op: 'set-metric', id: 'window', value: '60 s sliding' },
        {
          op: 'packet',
          edge: 'stream-proc-e',
          kind: 'event',
          count: 4,
          label: '5 swipes/60s',
          wave: 0,
        },
      ],
      learns: [1],
    },
    {
      id: 'event-vs-processing-time',
      label: 'Late events',
      kind: 'case',
      title: 'Event time vs processing time in slow tunnels',
      body: [
        'A commuter taps a card offline in a subway at `12:00:50` (**event time**), then regains signal so the reader uploads at `12:02:10` (**processing time**).',
        'Bucketing by processing time blames the wrong minute! Group by **event time** instead, and use a **watermark**—a timer saying "wait `90 s` for stragglers before closing `12:00`."',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'pos',
          patch: { state: 'hot', badge: 'Offline 80s' },
        },
        {
          op: 'add-note',
          note: {
            id: 'clock-note',
            anchor: { node: 'stream-proc' },
            text: 'Event 12:00:50 · Watermark +90s',
            tone: 'info',
            icon: 'clock',
          },
        },
        {
          op: 'packet',
          edge: 'pos-stream',
          kind: 'event',
          label: 'Delayed 80s',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'stream-proc-e',
          kind: 'event',
          label: 'Fits 12:00 bucket',
          wave: 1,
        },
      ],
      learns: [2],
    },
    {
      id: 'late-data-watchout',
      label: 'Watermark',
      kind: 'watch-out',
      title: 'Events arriving past the watermark cutoff',
      body: [
        'What if an airplane terminal reconnects two hours later—long after the `12:00` watermark closed? You must explicitly choose: drop stragglers, send them to a **late-data side output**, or re-emit updated window totals.',
        'Watermarks always trade **completeness** against **latency**: waiting longer catches more late events but delays final alerts.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Every streaming window faces a completeness vs latency trade-off controlled by its watermark.',
        },
      ],
      ops: [
        { op: 'remove-note', id: 'clock-note' },
        {
          op: 'update-node',
          id: 'pos',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'stream-proc',
          patch: { state: 'hot', badge: 'Past watermark' },
        },
        {
          op: 'packet',
          edge: 'stream-proc-e',
          kind: 'error',
          label: '2h late!',
          wave: 0,
        },
        {
          op: 'add-note',
          note: {
            id: 'late-note',
            anchor: { node: 'stream-proc' },
            text: 'Drop vs side output vs re-emit',
            tone: 'bad',
            icon: 'warning',
          },
        },
      ],
    },
    {
      id: 'lambda-kappa',
      label: 'Lambda / Kappa',
      kind: 'technique',
      title: 'Lambda runs two paths; Kappa replays the log',
      body: [
        '**Lambda architecture** runs both pipelines side by side: a fast stream layer plus a nightly batch layer that reconciles everything accurately—requiring **two codebases** to maintain.',
        '**Kappa architecture** keeps only one stream pipeline fed by a durable **append-only log** (`Event Stream`). To fix bugs or recompute reports, you simply **replay from an earlier offset**.',
      ],
      changes: [
        { type: 'added', text: 'Unified Kappa replay path from stream to Finance Report' },
      ],
      ops: [
        { op: 'remove-note', id: 'late-note' },
        {
          op: 'update-node',
          id: 'stream-proc',
          patch: { state: 'focus', badge: 'Replayable' },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'stream-wh',
            from: 'stream-proc',
            to: 'warehouse',
            label: 'Kappa replay',
            style: 'dashed',
          },
        },
        {
          op: 'add-zone',
          zone: {
            id: 'stream-zone',
            from: { x: 4, y: 7 },
            to: { x: 13, y: 9 },
            hue: 'teal',
            label: 'Kappa unified stream',
          },
        },
        {
          op: 'packet',
          edge: 'stream-proc-e',
          kind: 'event',
          label: 'Replay offset 0',
          wave: 0,
        },
        { op: 'packet', edge: 'stream-wh', kind: 'write', wave: 1 },
        { op: 'set-metric', id: 'input', value: 'Replayable log' },
      ],
      learns: [3],
    },
    {
      id: 'exactly-once-caveats',
      label: 'Exactly-once',
      kind: 'watch-out',
      title: 'Exactly-once ends at external side effects',
      body: [
        'Modern engines advertise **exactly-once processing**: checkpoints and atomic offset commits ensure a swipe updates internal window counts once even after a worker crash.',
        'Beware the boundary! Once **Fraud Alerts** calls an external SMS gateway or webhook, a retry can still fire **twice** unless the downstream sink supports **idempotency keys** or transactional writes.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Engine state can be exactly-once; external HTTP, email, or SMS side effects remain at-least-once without idempotency.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'alerts',
          patch: { state: 'hot', badge: 'Needs idem key' },
        },
        {
          op: 'packet',
          edge: 'proc-alerts',
          kind: 'error',
          count: 2,
          label: 'Duplicate SMS!',
          wave: 0,
        },
        {
          op: 'set-metric',
          id: 'delivery',
          value: 'Needs idem sink',
          tone: 'bad',
        },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Match batch simplicity or stream speed to needs',
      body: [
        'Reach for batch jobs when periodic completeness beats sub-second latency; reach for windowed streams with event-time watermarks when live reaction protects users or revenue.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'alerts',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'stream-proc',
          patch: { state: 'normal', badge: null },
        },
        { op: 'update-node', id: 'stream-bus', patch: { state: 'normal' } },
        {
          op: 'set-metric',
          id: 'delivery',
          value: 'Idempotent sink',
          tone: 'good',
        },
        {
          op: 'add-note',
          note: {
            id: 'bs-summary',
            anchor: { at: { x: 1, y: 7 } },
            text: 'Batch vs Stream',
            tone: 'info',
            icon: 'stack',
            rows: [
              ['Batch', 'Bounded · mins-hrs · rerun'],
              ['Stream', 'Unbounded · ms-s · replay'],
              ['Event time', 'Use watermarks for late data'],
              ['Exactly-once', 'Internal only; idempotent sinks'],
            ],
          },
        },
      ],
      takeaways: [
        'Batch jobs process bounded datasets on a schedule; streams process unbounded event logs continuously',
        'Tumbling, sliding, and session windows turn infinite streams into finite aggregations',
        'Group by event time with watermarks so network delays do not scramble window buckets',
        'Lambda pairs batch + stream; Kappa unifies on log replay; external sinks still require idempotency',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-event-vs-proc-time',
      kind: 'choice',
      prompt:
        'A point-of-sale terminal records a card swipe offline at 14:04:50, regains signal, and uploads it at 14:07:10. Which timestamp should a per-minute sales window use?',
      options: [
        '14:04:50 (event time) so the sale belongs to the minute it occurred',
        '14:07:10 (processing time) so the stream engine never waits',
        'Whichever hour the nightly batch cron happens to run',
      ],
      answer: 0,
      explain:
        'Grouping by event time places offline or delayed events into the true window when they happened, using watermarks to wait briefly for stragglers.',
      step: 'event-vs-processing-time',
    },
    {
      id: 'choice-exactly-once-limit',
      kind: 'choice',
      prompt:
        'Your stream engine provides "exactly-once" state processing, yet cardholders sometimes get two alert texts after a worker restarts. Why?',
      options: [
        'Exactly-once covers internal engine state and offsets; external SMS/API sinks still see at-least-once retries unless idempotent',
        'Tumbling windows automatically duplicate every event across adjacent buckets',
        'Kappa architecture forbids offset checkpoints during restarts',
      ],
      answer: 0,
      explain:
        'Internal checkpoints guarantee internal counts update once, but side effects outside the engine repeat on retry unless the sink deduplicates via idempotency keys.',
      step: 'exactly-once-caveats',
    },
    {
      id: 'numeric-tumbling-windows',
      kind: 'numeric',
      prompt:
        'A stream job counts card swipes using non-overlapping 5-minute tumbling windows. How many distinct windows span one full 60-minute hour?',
      unit: 'windows',
      answer: 12,
      tolerance: 0.05,
      explain:
        'Tumbling windows never overlap, so 60 minutes ÷ 5 minutes per window = 12 distinct windows per hour.',
      step: 'windows',
    },
    {
      id: 'order-stream-late-data',
      kind: 'order',
      prompt:
        'Order the lifecycle of a delayed offline payment flowing through an event-time stream window.',
      items: [
        'Card swipe happens offline at 12:00:50 (event time)',
        'Device reconnects at 12:01:40 and appends swipe to Event Stream',
        'Stream processor routes swipe into the 12:00 window before watermark cutoff',
        'Watermark crosses 12:00 + 90 s and emits final 12:00 window total',
      ],
      explain:
        'Because the swipe arrives at 12:01:40—inside the 90-second watermark grace period—the processor still includes it in the 12:00 event-time window before closing.',
      step: 'event-vs-processing-time',
    },
  ],
  cards: [
    {
      front: 'When should you pick batch processing vs stream processing?',
      back: 'Batch fits bounded datasets and periodic outputs like billing or nightly reports. Stream processing fits unbounded event logs needing millisecond-to-second alerts or live dashboards.',
    },
    {
      front: 'Distinguish tumbling, sliding, and session windows.',
      back: '• Tumbling: fixed, non-overlapping intervals\n• Sliding: overlapping fixed-size intervals advancing every slide step\n• Session: variable-length bursts closed after an inactivity gap',
    },
    {
      front: 'What are event time, processing time, and watermarks?',
      back: 'Event time is when the action happened; processing time is when the worker saw it. A watermark tracks event-time progress so windows know how long to wait for delayed data.',
    },
    {
      front: 'Compare Lambda vs Kappa architecture, and note the exactly-once caveat.',
      back: 'Lambda combines a fast stream path with a batch reconciliation path (two codebases). Kappa keeps one stream pipeline that replays a durable log. Even with exactly-once engine state, external sinks still need idempotency keys.',
    },
  ],
} satisfies Lesson;
