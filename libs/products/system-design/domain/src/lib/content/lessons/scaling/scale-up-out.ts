import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 02.01: Scale Up or Scale Out (`scale-up-out`).
 * Scenario: One server melting on launch day (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'scale-up-out',
  learn: [
    'Vertical scaling (scale up) limits and reboot cost',
    'Why one large server remains a single point of failure',
    'How horizontal scaling (scale out) adds resilience',
    'Why horizontal pools need a load balancer and statelessness',
    'How hardware cost curves favour scaling out past mid-tier',
  ],
  scene: {
    nodes: [
      {
        id: 'fans',
        kind: 'user',
        at: { x: 1, y: 5 },
        label: 'Ticket fans',
        sublabel: 'Launch drop',
      },
      {
        id: 'app',
        kind: 'server',
        at: { x: 7, y: 5 },
        label: 'App server',
        sublabel: '4 vCPU · 16 GB',
        state: 'hot',
        load: 0.98,
        badge: 'melting',
      },
      {
        id: 'db',
        kind: 'database',
        at: { x: 11, y: 5 },
        label: 'Tickets DB',
        sublabel: 'Postgres',
      },
    ],
    edges: [
      { id: 'fans-app', from: 'fans', to: 'app', label: '1,400 RPS' },
      { id: 'app-db', from: 'app', to: 'db', label: 'SQL' },
    ],
    zones: [
      {
        id: 'cloud-zone',
        from: { x: 3, y: 1 },
        to: { x: 12, y: 9 },
        hue: 'blue',
        label: 'Origin cloud',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'capacity', label: 'Capacity', icon: 'gauge', value: '500 RPS' },
    { id: 'cost', label: 'Cost/mo', icon: 'chart', value: '$120' },
    { id: 'spof', label: 'SPOF', icon: 'warning', value: 'Yes' },
    { id: 'p99', label: 'p99', icon: 'timer', value: '1,900 ms' },
  ],
  steps: [
    {
      id: 'launch-rush',
      label: 'Launch rush',
      kind: 'problem',
      title: 'One server melts on launch morning',
      body: [
        'At 9:00 AM your concert ticket app goes live, and **1,400 requests per second** (`RPS`) slam a single `4 vCPU` server rated for **500 RPS**.',
        'CPU pins at 100%, queues overflow, and `p99` latency jumps to **1,900 ms**. How do you buy three times the headroom before buyers give up?',
      ],
      ops: [
        {
          op: 'packet',
          edge: 'fans-app',
          kind: 'error',
          count: 3,
          label: '503 queue',
          wave: 0,
        },
        { op: 'packet', edge: 'app-db', kind: 'write', wave: 1 },
        { op: 'set-metric', id: 'p99', value: '1,900 ms', tone: 'bad' },
        { op: 'set-metric', id: 'spof', value: 'Yes', tone: 'bad' },
      ],
    },
    {
      id: 'scale-up',
      label: 'Scale up',
      kind: 'technique',
      title: 'Vertical scaling buys a bigger machine',
      body: [
        '**Vertical scaling** (_scaling up_) swaps your host for a larger box: `16 vCPU, 64 GB RAM` rated for **2,200 RPS**.',
        'Nothing in your application code changes. After a brief reboot onto bigger hardware, CPU settles near 64% and `p99` drops to **45 ms**.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Scaling up is zero-code simplicity—until you run out of larger machines to rent.',
        },
      ],
      changes: [
        { type: 'changed', text: 'App server upgraded to 16 vCPU (2,200 RPS)' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app',
          patch: {
            sublabel: '16 vCPU · 64 GB',
            state: 'focus',
            load: 0.64,
            badge: 'scaled up',
          },
        },
        {
          op: 'packet',
          edge: 'fans-app',
          kind: 'request',
          count: 2,
          label: '1,400 RPS',
          wave: 0,
        },
        { op: 'set-metric', id: 'capacity', value: '2,200 RPS', tone: 'good' },
        { op: 'set-metric', id: 'cost', value: '$640' },
        { op: 'set-metric', id: 'p99', value: '45 ms', tone: 'good' },
      ],
      learns: [0],
    },
    {
      id: 'vertical-ceiling',
      label: 'Hardware cap',
      kind: 'case',
      title: 'Every single machine hits a hard ceiling',
      body: [
        'Next month’s stadium tour draws **6,000 RPS**. You upgrade to the largest `128 vCPU` machine your cloud offers (**4,500 RPS** ceiling, **$4,800/month**).',
        'Traffic still exceeds what one motherboard can clear, and each resize costs minutes of downtime while the box reboots.',
      ],
      changes: [
        {
          type: 'changed',
          text: 'Traffic surges to 6,000 RPS on max 128 vCPU host',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app',
          patch: {
            sublabel: '128 vCPU MAX',
            state: 'hot',
            load: 1.0,
            badge: 'at ceiling',
          },
        },
        {
          op: 'update-edge',
          id: 'fans-app',
          patch: { label: '6,000 RPS' },
        },
        {
          op: 'packet',
          edge: 'fans-app',
          kind: 'error',
          reverse: true,
          count: 3,
          label: 'Overload',
          wave: 0,
        },
        { op: 'set-metric', id: 'capacity', value: '4,500 RPS' },
        { op: 'set-metric', id: 'cost', value: '$4,800', tone: 'bad' },
        { op: 'set-metric', id: 'p99', value: '1,400 ms', tone: 'bad' },
      ],
    },
    {
      id: 'spof-risk',
      label: 'Single box',
      kind: 'watch-out',
      title: 'One giant server is a single point of failure',
      body: [
        'Worse than the ceiling is fragility: if that one `$4,800/mo` host suffers a bad stick of RAM or a kernel panic, **100% of buyers see an error page**.',
        'Vertical scaling adds horsepower, not resilience. One box is always a _single point of failure_ (`SPOF`).',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'One giant machine turns any hardware glitch or OS reboot into a total site outage.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app',
          patch: { state: 'down', load: null, badge: 'crashed' },
        },
        {
          op: 'update-edge',
          id: 'fans-app',
          patch: { state: 'broken' },
        },
        {
          op: 'packet',
          edge: 'fans-app',
          kind: 'error',
          reverse: true,
          count: 2,
          label: '502 Down',
          wave: 0,
        },
        { op: 'set-metric', id: 'p99', value: 'Down', tone: 'bad' },
      ],
      learns: [1],
    },
    {
      id: 'scale-out',
      label: 'Scale out',
      kind: 'technique',
      title: 'Horizontal scaling spreads load via a balancer',
      body: [
        '**Horizontal scaling** (_scaling out_) runs multiple modest `16 vCPU` machines (`2,200 RPS` each) behind a **load balancer** that splits incoming requests.',
        'Start with two instances (**4,400 RPS**). If `App 1` crashes, `App 2` absorbs traffic while a replacement boots—eliminating the app-server SPOF.',
      ],
      changes: [
        { type: 'added', text: 'Load balancer and App 2 instance' },
        { type: 'changed', text: 'App tier SPOF removed' },
      ],
      ops: [
        { op: 'remove-edge', id: 'fans-app' },
        {
          op: 'add-node',
          node: {
            id: 'lb',
            kind: 'load-balancer',
            at: { x: 4, y: 5 },
            label: 'Load balancer',
            sublabel: 'Splits traffic',
            state: 'focus',
          },
        },
        {
          op: 'update-node',
          id: 'app',
          patch: {
            at: { x: 7, y: 2 },
            label: 'App 1',
            sublabel: '16 vCPU · 2.2k',
            state: 'normal',
            load: 0.9,
            badge: null,
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'app-2',
            kind: 'server',
            at: { x: 7, y: 8 },
            label: 'App 2',
            sublabel: '16 vCPU · 2.2k',
            state: 'focus',
            load: 0.9,
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'fans-lb', from: 'fans', to: 'lb', label: 'HTTPS' },
        },
        { op: 'add-edge', edge: { id: 'lb-app', from: 'lb', to: 'app' } },
        { op: 'add-edge', edge: { id: 'lb-app2', from: 'lb', to: 'app-2' } },
        {
          op: 'add-edge',
          edge: { id: 'app2-db', from: 'app-2', to: 'db', label: 'SQL' },
        },
        { op: 'packet', edge: 'fans-lb', kind: 'request', count: 3, wave: 0 },
        { op: 'packet', edge: 'lb-app2', kind: 'request', count: 2, wave: 1 },
        { op: 'set-metric', id: 'capacity', value: '4,400 RPS' },
        { op: 'set-metric', id: 'spof', value: 'App pool ok', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'stateless-rule',
      label: 'Stateless rule',
      kind: 'technique',
      title: 'Horizontal pools must be stateless',
      body: [
        'Add **App 3** to reach **6,600 RPS** and push `p99` back down to **40 ms**. Because the balancer may route a buyer’s second click to a different server, instances cannot keep user state in local RAM.',
        'Store shared sessions and carts outside the pool (in a database or cache) so every server is interchangeable.',
      ],
      changes: [
        {
          type: 'added',
          text: 'App 3 added (6,600 RPS total, 40 ms p99)',
        },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'app-3',
            kind: 'server',
            at: { x: 7, y: 5 },
            label: 'App 3',
            sublabel: '16 vCPU · 2.2k',
            state: 'focus',
            load: 0.9,
          },
        },
        { op: 'add-edge', edge: { id: 'lb-app3', from: 'lb', to: 'app-3' } },
        {
          op: 'add-edge',
          edge: { id: 'app3-db', from: 'app-3', to: 'db', label: 'SQL' },
        },
        { op: 'update-node', id: 'app', patch: { load: 0.9 } },
        {
          op: 'update-node',
          id: 'app-2',
          patch: { state: 'normal', load: 0.9 },
        },
        {
          op: 'add-note',
          note: {
            id: 'stateless-note',
            anchor: { node: 'lb' },
            text: 'Pool is stateless',
            tone: 'good',
            icon: 'layers',
          },
        },
        { op: 'packet', edge: 'lb-app3', kind: 'request', count: 2, wave: 0 },
        { op: 'set-metric', id: 'capacity', value: '6,600 RPS', tone: 'good' },
        { op: 'set-metric', id: 'p99', value: '40 ms', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'cost-curve',
      label: 'Cost curve',
      kind: 'technique',
      title: 'Scale-up prices jump faster than capacity',
      body: [
        'Top-bin hardware carries a steep premium: one `128 vCPU` server cost **$4,800/mo** for **4,500 RPS** (`$1,067` per 1k RPS).',
        'Three `16 vCPU` servers cost just **$1,920/mo** (`3 × $640`) for **6,600 RPS** (`$291` per 1k RPS)—and you can turn two off overnight when fans sleep.',
      ],
      changes: [{ type: 'added', text: 'Vertical vs horizontal cost table' }],
      ops: [
        {
          op: 'add-note',
          note: {
            id: 'cost-table',
            anchor: { at: { x: 2, y: 1 } },
            text: 'Monthly cost vs RPS',
            tone: 'info',
            icon: 'chart',
            rows: [
              ['1× 128 vCPU', '$4,800 · 4.5k'],
              ['3× 16 vCPU', '$1,920 · 6.6k'],
            ],
            total: ['Savings', '60% cheaper'],
          },
        },
        { op: 'set-metric', id: 'cost', value: '$1,920', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'db-next-wall',
      label: 'DB bottleneck',
      kind: 'watch-out',
      title: 'Scaling out apps exposes the single database',
      body: [
        'Horizontal app scaling solves compute bottlenecks, yet all three servers still point at **one Tickets DB**. Doubling the app pool can simply flood that database faster.',
        'In practice, teams **scale vertically first** while traffic is modest, then scale out stateless tiers—and protect the database with caches, replicas, and sharding.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Scaling out the app tier moves the bottleneck downstream to the stateful database.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-3',
          patch: { state: 'normal' },
        },
        {
          op: 'update-node',
          id: 'lb',
          patch: { state: 'normal' },
        },
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'hot', load: 0.94, badge: 'New limit!' },
        },
        { op: 'packet', edge: 'app-db', kind: 'write', count: 2, wave: 0 },
        { op: 'packet', edge: 'app2-db', kind: 'write', count: 2, wave: 0 },
        { op: 'packet', edge: 'app3-db', kind: 'write', count: 2, wave: 0 },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Scale up for simplicity, scale out for scale',
      body: [
        'Bigger hardware is effortless until you hit physical ceilings, steep high-end pricing, and single-machine outages. Adding commodity servers behind a load balancer removes the compute ceiling—as long as your services stay stateless.',
      ],
      ops: [
        { op: 'remove-note', id: 'stateless-note' },
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'normal', load: 0.55, badge: null },
        },
      ],
      takeaways: [
        'Vertical scaling (scale up) needs zero code changes but hits hardware limits, reboot downtime, and high costs',
        'A single large box remains a single point of failure (SPOF)',
        'Horizontal scaling (scale out) adds resilience and capacity linearly via commodity nodes',
        'Scaling out requires a load balancer and stateless services—and pushes pressure toward the database',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-vertical-limit',
      kind: 'choice',
      prompt:
        'Which problem remains even after vertically upgrading a web server to the largest VM a cloud provider offers?',
      options: [
        'It still has a hard hardware ceiling and remains a single point of failure',
        'Stateless sessions automatically break across CPU cores',
        'Clients must install a custom DNS resolver',
      ],
      answer: 0,
      explain:
        'A single machine—no matter how large—cannot exceed maximum hardware specs and takes the whole service down if it crashes or reboots.',
      step: 'spof-risk',
    },
    {
      id: 'choice-scale-out-prereq',
      kind: 'choice',
      prompt:
        'What two architectural changes make horizontal scaling of an app tier work smoothly?',
      options: [
        'Adding a load balancer and keeping app servers stateless',
        'Turning off TLS encryption and moving databases onto local disks',
        'Running cron jobs on every user browser',
      ],
      answer: 0,
      explain:
        'A load balancer spreads requests across the pool, and statelessness lets any instance handle any user request safely.',
      step: 'stateless-rule',
    },
    {
      id: 'numeric-cost-compare',
      kind: 'numeric',
      prompt:
        'One 16-vCPU server handles 2,200 RPS and costs $640/month. How much per month do 4 such servers cost to handle 8,800 RPS?',
      unit: '$/month',
      answer: 2560,
      tolerance: 0.05,
      explain:
        '4 × $640 = $2,560/month—almost half the price of one $4,800 128-vCPU host with nearly double the capacity.',
      step: 'cost-curve',
    },
    {
      id: 'order-scaling-evolution',
      kind: 'order',
      prompt:
        'Order these stages as a growing startup evolves its compute tier.',
      items: [
        'Run a single small server on launch day',
        'Scale vertically to a larger machine for quick headroom',
        'Externalise session state and add a load balancer',
        'Scale horizontally across multiple commodity servers',
      ],
      explain:
        'Vertical scaling buys quick time early; once ceilings, cost, or reliability matter, externalising state and adding a load balancer unlock horizontal scaling.',
      step: 'scale-out',
    },
  ],
  cards: [
    {
      front: 'When does vertical scaling (scaling up) make the most sense?',
      back: 'Early on or for stateful nodes when a single larger box solves load with zero code changes—before hitting hardware caps or needing high availability.',
    },
    {
      front: 'What are the two biggest drawbacks of relying only on scale-up?',
      back: '1. Hardware limits & non-linear costs at the top tier.\n2. Single point of failure (SPOF) and downtime during reboots.',
    },
    {
      front: 'What does horizontal scaling require from your app tier?',
      back: 'A load balancer to distribute traffic and stateless servers so any instance can answer any request.',
    },
    {
      front:
        'Once your app tier scales horizontally, what usually becomes the next bottleneck?',
      back: 'The shared database behind the pool, which must then be protected with caching, connection pooling, read replicas, or sharding.',
    },
  ],
} satisfies Lesson;
