import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 05.05: Logs, Metrics & Traces (`observability`).
 * Scenario: "It's slow", but where? (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'observability',
  learn: [
    'Distinguish RED service metrics from USE resource metrics',
    'Trigger actionable pages with SLO burn-rate alerts',
    'Correlate structured JSON logs using request IDs',
    'Pinpoint slow spans across hops with distributed tracing',
    'Keep telemetry affordable via head and tail sampling',
  ],
  scene: {
    nodes: [
      {
        id: 'users',
        kind: 'client',
        at: { x: 1, y: 4 },
        label: 'Web app',
        sublabel: '320 RPS',
      },
      {
        id: 'gateway',
        kind: 'gateway',
        at: { x: 4, y: 4 },
        label: 'API Gateway',
        sublabel: 'Edge proxy',
      },
      {
        id: 'invoice-api',
        kind: 'service',
        at: { x: 8, y: 4 },
        label: 'Invoice API',
        sublabel: 'CPU 28%',
        load: 0.28,
      },
      {
        id: 'pdf-svc',
        kind: 'worker',
        at: { x: 11, y: 2 },
        label: 'PDF Worker',
        sublabel: 'Renderer',
      },
      {
        id: 'orders-db',
        kind: 'database',
        at: { x: 11, y: 7 },
        label: 'Billing DB',
        sublabel: 'Postgres',
      },
    ],
    edges: [
      { id: 'users-gw', from: 'users', to: 'gateway', label: 'HTTPS' },
      {
        id: 'gw-inv',
        from: 'gateway',
        to: 'invoice-api',
        label: '/invoices',
      },
      { id: 'inv-pdf', from: 'invoice-api', to: 'pdf-svc', label: 'Render' },
      { id: 'inv-db', from: 'invoice-api', to: 'orders-db', label: 'SQL' },
    ],
    zones: [
      {
        id: 'prod-cloud',
        from: { x: 3, y: 1 },
        to: { x: 12, y: 9 },
        hue: 'blue',
        label: 'Production cluster',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'rate', label: 'Rate', icon: 'gauge', value: '320 RPS' },
    { id: 'errors', label: 'Errors', icon: 'warning', value: '0.2%' },
    { id: 'p99', label: 'p99', icon: 'timer', value: '4.1 s' },
    { id: 'root-cause', label: 'Root cause', icon: 'search', value: 'Unknown' },
  ],
  steps: [
    {
      id: 'blind-spot',
      label: 'Blind spot',
      kind: 'problem',
      title: '"It feels slow," yet every CPU chart looks green',
      body: [
        'Customers complain that exporting invoices takes **4 seconds**. You open host dashboards and see **Invoice API CPU at 28%** with zero alerts firing.',
        'Across a gateway, API, worker, and database, unstructured text logs hide which hop actually stalls.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'invoice-api',
          patch: { state: 'hot', badge: 'p99 4.1 s?' },
        },
        { op: 'packet', edge: 'users-gw', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'gw-inv', kind: 'request', wave: 1 },
        { op: 'packet', edge: 'inv-pdf', kind: 'request', wave: 2 },
        { op: 'packet', edge: 'inv-db', kind: 'request', wave: 2 },
        { op: 'set-metric', id: 'p99', value: '4.1 s', tone: 'bad' },
      ],
    },
    {
      id: 'red-metrics',
      label: 'RED metrics',
      kind: 'technique',
      title: 'Measure Rate, Errors, and Duration per service',
      body: [
        '**Metrics** aggregate numeric counters and latency histograms cheaply over time. For any request-driven service, track **RED**:',
        '• **Rate**: requests per second (`320 RPS`).\n• **Errors**: failed responses (`0.2%`).\n• **Duration**: latency percentiles (`p50 90 ms`, `p99 4.1 s`)—proving the tail spike is real even at low CPU.',
      ],
      changes: [{ type: 'added', text: 'Metrics TSDB collecting RED signals' }],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'metrics-db',
            kind: 'storage',
            at: { x: 5, y: 7 },
            label: 'Metrics TSDB',
            sublabel: 'RED + USE',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'inv-metrics',
            from: 'invoice-api',
            to: 'metrics-db',
            label: 'Metrics',
            style: 'dashed',
            route: 'straight',
          },
        },
        {
          op: 'add-note',
          note: {
            id: 'signal-note',
            anchor: { at: { x: 2, y: 7 } },
            text: 'RED (Invoice API)',
            tone: 'info',
            icon: 'chart',
            rows: [
              ['Rate', '320 RPS'],
              ['Errors', '0.2% 5xx'],
              ['Duration', 'p99 4.1 s'],
            ],
          },
        },
        { op: 'packet', edge: 'inv-metrics', kind: 'event', wave: 0 },
        { op: 'set-metric', id: 'root-cause', value: 'RED spike' },
      ],
      learns: [0],
    },
    {
      id: 'use-metrics',
      label: 'USE metrics',
      kind: 'technique',
      title: 'Check Utilisation, Saturation, and Errors',
      body: [
        'RED watches _services_; **USE** watches _resources_ (CPU, disks, connection pools): **Utilisation** (`%` busy), **Saturation** (work queued waiting), and **Errors**.',
        'Billing DB CPU reads just `45%`, yet its connection pool shows **38 requests queued**—saturation invisible on CPU charts.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'hot', badge: '38 queued' },
        },
        {
          op: 'update-note',
          id: 'signal-note',
          patch: {
            text: 'USE (Billing DB pool)',
            tone: 'bad',
            icon: 'gauge',
            rows: [
              ['Utilisation', '45% CPU'],
              ['Saturation', '38 waiting'],
              ['Errors', '0 hardware'],
            ],
          },
        },
        { op: 'packet', edge: 'inv-metrics', kind: 'event', wave: 0 },
      ],
    },
    {
      id: 'slo-alerts',
      label: 'SLO alerts',
      kind: 'technique',
      title: 'Page on SLO burn rate, not noisy CPU spikes',
      body: [
        'Paging whenever CPU crosses `80%` wakes engineers for harmless batch jobs while missing silent slowdowns.',
        'Alert on **SLO error-budget burn rate**: page immediately when fast `p99 > 500 ms` or `5xx` errors consume `2%` of the monthly error budget inside 1 hour; create a daytime ticket for slow burn.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Alert on user-facing symptoms (SLO burn rate), then diagnose causes using resource metrics and traces.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'metrics-db',
          patch: { badge: 'Burn rate 12×' },
        },
        {
          op: 'update-node',
          id: 'invoice-api',
          patch: { state: 'normal', badge: 'SLO breach' },
        },
        {
          op: 'packet',
          edge: 'inv-metrics',
          kind: 'error',
          label: 'Page on-call',
          wave: 0,
        },
        { op: 'set-metric', id: 'errors', value: 'SLO burn', tone: 'bad' },
      ],
      learns: [1],
    },
    {
      id: 'structured-logs',
      label: 'Logs + Req ID',
      kind: 'technique',
      title: 'Structured JSON logs carry one shared request ID',
      body: [
        'Metrics reveal _what_ hurts; **logs** record _why_ an individual call failed. Emit **structured JSON** (`user_id`, `duration_ms`, `sql_state`) instead of plain strings so log search indexes every field.',
        'Generate a unique **`request_id`** at the gateway and forward it to every hop so one filter pulls the full log story.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Log Search indexing JSON entries with request_id',
        },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'log-store',
            kind: 'search',
            at: { x: 8, y: 9 },
            label: 'Log Search',
            sublabel: 'JSON + req_id',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'gw-logs',
            from: 'gateway',
            to: 'log-store',
            label: 'req_id',
            style: 'dashed',
            route: 'elbow-y',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'inv-logs',
            from: 'invoice-api',
            to: 'log-store',
            style: 'dashed',
          },
        },
        {
          op: 'update-node',
          id: 'metrics-db',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'packet',
          edge: 'gw-logs',
          kind: 'event',
          label: 'req_id=a8f2',
          wave: 0,
        },
        { op: 'packet', edge: 'inv-logs', kind: 'event', wave: 0 },
        {
          op: 'update-note',
          id: 'signal-note',
          patch: {
            text: 'Filter: req_id=a8f2',
            tone: 'info',
            icon: 'file',
            rows: [
              ['gateway', 'start /invoices'],
              ['invoice-api', 'pool wait 3.8s'],
            ],
          },
        },
        { op: 'set-metric', id: 'root-cause', value: 'Logs linked' },
      ],
      learns: [2],
    },
    {
      id: 'distributed-tracing',
      label: 'Traces & spans',
      kind: 'case',
      title: 'Distributed traces expose the 3,880 ms SQL lock',
      body: [
        'To see exact timing across hops, **distributed tracing** attaches a `trace_id` header and records timed parent–child **spans** per hop.',
        'One trace for `POST /invoices` solves the mystery immediately: Gateway `12 ms`, Invoice handler `25 ms`, PDF Worker `180 ms`, and **`3,880 ms` blocked on an unindexed table lock** inside Billing DB!',
      ],
      ops: [
        { op: 'update-node', id: 'log-store', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'gateway',
          patch: { badge: '12 ms' },
        },
        {
          op: 'update-node',
          id: 'pdf-svc',
          patch: { badge: '180 ms' },
        },
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'hot', badge: '3,880 ms lock!' },
        },
        {
          op: 'update-note',
          id: 'signal-note',
          patch: {
            text: 'Trace #4f9a (4,097 ms)',
            tone: 'bad',
            icon: 'search',
            rows: [
              ['Gateway span', '12 ms'],
              ['PDF Worker span', '180 ms'],
              ['Billing DB span', '3,880 ms'],
            ],
            total: ['Culprit', 'Table lock'],
          },
        },
        { op: 'packet', edge: 'users-gw', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'gw-inv', kind: 'request', wave: 1 },
        {
          op: 'packet',
          edge: 'inv-db',
          kind: 'error',
          label: '3.9 s lock',
          wave: 2,
        },
        { op: 'set-metric', id: 'root-cause', value: 'DB table lock', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'sampling',
      label: 'Sampling',
      kind: 'watch-out',
      title: 'Watch out: tracing 100% of traffic blows budgets',
      body: [
        'Recording debug logs and full trace spans on every `200 OK` call at `10,000 RPS` can cost more storage and CPU than the app itself.',
        'Keep **1% head sampling** for fast baseline requests, and add **tail sampling** in the trace collector to retain **100% of errors and slow outliers** (`> 500 ms`).',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Head-sampling 1% blindly drops rare errors; add tail sampling so slow or failed traces are always kept.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'focus', badge: 'Lock fixed' },
        },
        {
          op: 'update-node',
          id: 'invoice-api',
          patch: { badge: '1% head · 100% tail' },
        },
        {
          op: 'update-note',
          id: 'signal-note',
          patch: {
            text: 'Trace sampling',
            tone: 'info',
            icon: 'layers',
            rows: [
              ['Fast 200 OK', 'Keep 1% (head)'],
              ['Errors / >500ms', 'Keep 100% (tail)'],
            ],
            total: undefined,
          },
        },
        { op: 'set-metric', id: 'p99', value: '140 ms', tone: 'good' },
        { op: 'set-metric', id: 'errors', value: '0.05%', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Metrics alert, logs explain, traces locate',
      body: [
        'Combine all three observability pillars: RED/USE metrics and SLO burn alerts tell you something broke, traces show which hop stalled, and correlated JSON logs reveal why.',
      ],
      ops: [
        { op: 'remove-note', id: 'signal-note' },
        {
          op: 'update-node',
          id: 'gateway',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'invoice-api',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'pdf-svc',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'orders-db',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'obs-summary',
            anchor: { at: { x: 2, y: 7 } },
            text: 'Three pillars',
            tone: 'good',
            icon: 'check',
            rows: [
              ['Metrics', 'RED / USE + SLO burn'],
              ['Logs', 'JSON + request_id'],
              ['Traces', 'Spans + tail sampling'],
            ],
          },
        },
        { op: 'set-metric', id: 'root-cause', value: '3 pillars', tone: 'good' },
      ],
      takeaways: [
        'Track RED (Rate, Errors, Duration) on services and USE (Utilisation, Saturation, Errors) on resources',
        'Page on SLO burn-rate alerts tied to user impact rather than noisy CPU thresholds',
        'Emit structured JSON logs carrying a shared request_id across every hop',
        'Use distributed tracing to isolate slow spans and tail sampling to capture 100% of outliers affordably',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-red-signals',
      kind: 'choice',
      prompt:
        'Which three signals form the RED method for monitoring request-driven microservices?',
      options: [
        'Rate, Errors, and Duration',
        'Retries, Evictions, and Disk IOPS',
        'Utilisation, Saturation, and Errors',
      ],
      answer: 0,
      explain:
        'RED tracks request Rate, Error rate, and Duration (latency percentiles) for services, while USE tracks Utilisation, Saturation, and Errors for resources.',
      step: 'red-metrics',
    },
    {
      id: 'choice-use-saturation',
      kind: 'choice',
      prompt:
        'Invoice API CPU is only 28%, yet p99 latency spikes to 4 seconds. Which USE signal on the database connection pool directly shows threads waiting for a free connection?',
      options: [
        'Saturation (queue depth / waiting requests)',
        'Utilisation (CPU idle percentage)',
        'Rate (total bytes sent over HTTPS)',
      ],
      answer: 0,
      explain:
        'Saturation measures queued work waiting on a bounded resource—explaining high latency even when CPU utilisation looks moderate.',
      step: 'use-metrics',
    },
    {
      id: 'order-debug-flow',
      kind: 'order',
      prompt:
        'Order the observability workflow for diagnosing a p99 slowdown across multiple services.',
      items: [
        'SLO burn-rate alert fires on RED Duration metrics',
        'Inspect a slow distributed trace to identify the 3.8 s database span',
        'Filter structured JSON logs by the request_id to read the SQL lock details',
        'Add the missing index and confirm p99 returns within the SLO',
      ],
      explain:
        'Alerts from metrics detect the user-facing symptom, traces narrow down which hop spent the time, and correlated logs explain the root cause.',
      step: 'distributed-tracing',
    },
    {
      id: 'numeric-tail-sampling',
      kind: 'numeric',
      prompt:
        'An API handles 2,000 RPS. Head sampling keeps 1% of normal requests, and 0.5% of requests are slow errors kept by tail sampling (with zero overlap). How many traces per second are stored?',
      unit: 'traces/s',
      answer: 30,
      tolerance: 0.1,
      explain:
        'Head sampling keeps 2,000 × 0.01 = 20 traces/s, and tail sampling keeps 2,000 × 0.005 = 10 slow/error traces/s, totaling 30 traces/s.',
      step: 'sampling',
    },
  ],
  cards: [
    {
      front: 'Distinguish RED metrics from USE metrics.',
      back: '• RED (services): Rate, Errors, Duration.\n• USE (resources like CPU, disk, pools): Utilisation, Saturation, Errors.',
    },
    {
      front: 'Why alert on SLO burn rate instead of raw CPU thresholds?',
      back: 'CPU spikes do not always hurt users, while pool saturation or locks can break user latency at low CPU. Burn-rate alerts tie pages directly to error-budget loss.',
    },
    {
      front: 'How do structured logs and distributed traces complement each other?',
      back: 'Distributed traces (trace_id + spans) show where time went across hops; structured JSON logs (correlated via request_id) show the detailed events and error fields inside a hop.',
    },
    {
      front: 'Compare head sampling vs tail sampling in distributed tracing.',
      back: 'Head sampling decides randomly at entry (cheap, drops rare errors). Tail sampling buffers briefly and decides after completion so 100% of errors and slow outliers are saved.',
    },
  ],
} satisfies Lesson;
