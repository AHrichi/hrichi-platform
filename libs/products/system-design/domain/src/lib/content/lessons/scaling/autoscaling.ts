import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 02.06: Autoscaling (`autoscaling`).
 * Scenario: Evening traffic doubles daily (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'autoscaling',
  learn: [
    'How metric-driven rules add and remove app servers',
    'Why boot and warm-up lag require scaling with headroom',
    'How min/max bounds and cooldowns stop flapping loops',
    'When scheduled scaling beats reactive rules for peaks',
    'Why databases cannot autoscale smoothly like app tiers',
  ],
  scene: {
    nodes: [
      {
        id: 'users',
        kind: 'user',
        at: { x: 0, y: 4 },
        label: 'Viewers',
        sublabel: 'Daily cycle',
      },
      {
        id: 'lb',
        kind: 'load-balancer',
        at: { x: 3, y: 4 },
        label: 'Load balancer',
        sublabel: 'Target pool',
      },
      {
        id: 'app-1',
        kind: 'server',
        at: { x: 6, y: 2 },
        label: 'App 1',
        sublabel: '45% CPU',
        load: 0.45,
      },
      {
        id: 'app-2',
        kind: 'server',
        at: { x: 6, y: 6 },
        label: 'App 2',
        sublabel: '45% CPU',
        load: 0.45,
      },
      {
        id: 'db',
        kind: 'database',
        at: { x: 12, y: 4 },
        label: 'Videos DB',
        sublabel: 'Postgres',
      },
    ],
    edges: [
      { id: 'users-lb', from: 'users', to: 'lb', label: 'HTTPS' },
      { id: 'lb-1', from: 'lb', to: 'app-1' },
      { id: 'lb-2', from: 'lb', to: 'app-2' },
      { id: 'app1-db', from: 'app-1', to: 'db', label: 'SQL' },
      { id: 'app2-db', from: 'app-2', to: 'db', label: 'SQL' },
    ],
    zones: [
      {
        id: 'pool-zone',
        from: { x: 5, y: 1 },
        to: { x: 10, y: 7 },
        hue: 'blue',
        label: 'Autoscaling group',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'rps', label: 'Traffic', icon: 'gauge', value: '900 RPS' },
    { id: 'pool', label: 'Instances', icon: 'server', value: '2' },
    { id: 'cpu', label: 'Avg CPU', icon: 'chart', value: '45%' },
    { id: 'waste', label: 'Idle waste', icon: 'clock', value: 'Low' },
  ],
  steps: [
    {
      id: 'evening-surge',
      label: 'Evening rush',
      kind: 'problem',
      title: 'Evening traffic doubles every night at 7 PM',
      body: [
        'Your workout-video app cruises at **900 RPS** all afternoon on **2 servers** (`45% CPU`). Every night at 7:00 PM, traffic doubles past **1,800 RPS** and drops back down after midnight.',
        'Leaving 4 servers running 24/7 wastes half your budget; keeping 2 melts every evening.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-1',
          patch: {
            sublabel: '92% CPU',
            state: 'hot',
            load: 0.92,
            badge: '92% CPU',
          },
        },
        {
          op: 'update-node',
          id: 'app-2',
          patch: {
            sublabel: '92% CPU',
            state: 'hot',
            load: 0.92,
            badge: '92% CPU',
          },
        },
        { op: 'packet', edge: 'users-lb', kind: 'request', count: 3, wave: 0 },
        { op: 'packet', edge: 'lb-1', kind: 'request', count: 2, wave: 1 },
        { op: 'packet', edge: 'lb-2', kind: 'request', count: 2, wave: 1 },
        { op: 'set-metric', id: 'rps', value: '1,800 RPS', tone: 'bad' },
        { op: 'set-metric', id: 'cpu', value: '92%', tone: 'bad' },
      ],
    },
    {
      id: 'metric-rules',
      label: 'Metric rules',
      kind: 'technique',
      title: 'Scale automatically on leading load metrics',
      body: [
        'Attach an **Autoscaler** watching a leading signal—like **average CPU**, **RPS per instance**, or **request queue depth**.',
        'Target **60% CPU** so there is comfortable slack below the 80% queueing knee. When pool CPU crosses **70%** for two minutes, the rule launches new instances.',
      ],
      changes: [{ type: 'added', text: 'Autoscaler watching target 60% CPU' }],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'scaler',
            kind: 'scheduler',
            at: { x: 3, y: 7 },
            label: 'Autoscaler',
            sublabel: 'Target 60% CPU',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'scaler-lb',
            from: 'scaler',
            to: 'lb',
            label: 'Scale rule',
            style: 'dashed',
          },
        },
        {
          op: 'packet',
          edge: 'scaler-lb',
          kind: 'event',
          label: '92% > 70%!',
          wave: 0,
        },
      ],
      learns: [0],
    },
    {
      id: 'warmup-lag',
      label: 'Warm-up lag',
      kind: 'case',
      title: 'New servers take minutes before taking traffic',
      body: [
        'At 7:02 PM the autoscaler starts `App 3` and `App 4`, yet latency keeps climbing! Booting a VM, pulling containers, warming caches, and passing `/health` checks takes **2–5 minutes**.',
        'If your threshold waits until `95% CPU`, existing servers drown during warm-up lag—always trigger with headroom (`60–70%`).',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Trigger scale-out early enough (e.g. 60–70% CPU) so current nodes survive the 2–5 minute boot lag.',
        },
      ],
      changes: [
        { type: 'added', text: 'App 3 and App 4 booting in the pool' },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'app-3',
            kind: 'server',
            at: { x: 9, y: 2 },
            label: 'App 3',
            sublabel: 'Booting…',
            state: 'dim',
            badge: 'warming 3m',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'app-4',
            kind: 'server',
            at: { x: 9, y: 6 },
            label: 'App 4',
            sublabel: 'Booting…',
            state: 'dim',
            badge: 'warming 3m',
          },
        },
        { op: 'add-edge', edge: { id: 'lb-3', from: 'lb', to: 'app-3' } },
        { op: 'add-edge', edge: { id: 'lb-4', from: 'lb', to: 'app-4' } },
        {
          op: 'add-edge',
          edge: { id: 'app3-db', from: 'app-3', to: 'db', label: 'SQL' },
        },
        {
          op: 'add-edge',
          edge: { id: 'app4-db', from: 'app-4', to: 'db', label: 'SQL' },
        },
        { op: 'set-metric', id: 'pool', value: '4 (2 booting)' },
      ],
      learns: [1],
    },
    {
      id: 'pool-ready',
      label: 'Pool balanced',
      kind: 'technique',
      title: 'Once healthy, four servers share the peak',
      body: [
        'Three minutes later `App 3` and `App 4` pass health checks. The balancer distributes **1,800 RPS** across four instances (**48% CPU** each).',
        'After midnight when traffic drops back to 900 RPS, scale-in gracefully drains connections and shuts down two instances to stop overnight waste.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-1',
          patch: {
            state: 'normal',
            sublabel: '48% CPU',
            load: 0.48,
            badge: null,
          },
        },
        {
          op: 'update-node',
          id: 'app-2',
          patch: {
            state: 'normal',
            sublabel: '48% CPU',
            load: 0.48,
            badge: null,
          },
        },
        {
          op: 'update-node',
          id: 'app-3',
          patch: {
            state: 'normal',
            sublabel: '48% CPU',
            load: 0.48,
            badge: null,
          },
        },
        {
          op: 'update-node',
          id: 'app-4',
          patch: {
            state: 'normal',
            sublabel: '48% CPU',
            load: 0.48,
            badge: null,
          },
        },
        { op: 'packet', edge: 'lb-3', kind: 'request', count: 2, wave: 0 },
        { op: 'packet', edge: 'lb-4', kind: 'request', count: 2, wave: 0 },
        { op: 'set-metric', id: 'pool', value: '4', tone: 'good' },
        { op: 'set-metric', id: 'cpu', value: '48%', tone: 'good' },
        { op: 'set-metric', id: 'waste', value: 'Matched', tone: 'good' },
      ],
      learns: [0],
    },
    {
      id: 'min-max-bounds',
      label: 'Min & max',
      kind: 'technique',
      title: 'Clamp pools with a min floor and max ceiling',
      body: [
        'Every autoscaling group needs two guardrails:',
        '• **Minimum floor** (`min = 2`): never scale down to 1 node at 3 AM, or you recreate a single point of failure.\n• **Maximum ceiling** (`max = 10`): cap fleet size so a traffic bot or bug cannot launch 500 servers and wreck your cloud bill.',
      ],
      ops: [
        {
          op: 'add-note',
          note: {
            id: 'bounds-note',
            anchor: { node: 'scaler' },
            text: 'Floor: 2 · Ceiling: 10',
            tone: 'info',
            icon: 'shield',
          },
        },
        { op: 'update-node', id: 'scaler', patch: { state: 'focus' } },
      ],
      learns: [2],
    },
    {
      id: 'cooldown-flapping',
      label: 'Flapping',
      kind: 'watch-out',
      title: 'Without a cooldown, pools flap up and down',
      body: [
        'If you scale in the moment CPU dips below `50%`, load concentrates on fewer servers, spikes CPU past `70%` again, and forces another scale-out—wasting minutes in a **flapping** loop.',
        'Enforce a **cooldown** (`5–10 min` wait after each change) and scale out aggressively while scaling in cautiously.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never use the exact same threshold and speed for scale-out and scale-in: scale out fast, scale in slow with cooldowns.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-3',
          patch: { state: 'hot', badge: 'thrashing' },
        },
        {
          op: 'update-node',
          id: 'app-4',
          patch: { state: 'down', load: null, badge: 'killed early' },
        },
        {
          op: 'update-note',
          id: 'bounds-note',
          patch: { text: 'Cooldown 5m stops flap', tone: 'bad' },
        },
        {
          op: 'packet',
          edge: 'scaler-lb',
          kind: 'error',
          label: 'Flap loop!',
          wave: 0,
        },
        { op: 'set-metric', id: 'cpu', value: '74%', tone: 'bad' },
      ],
      learns: [2],
    },
    {
      id: 'scheduled-scaling',
      label: 'Scheduled',
      kind: 'technique',
      title: 'Pre-scale ahead of predictable daily surges',
      body: [
        'Since `Viewers` double every single evening around **7:00 PM**, don’t wait for CPU alarms to react!',
        'Combine reactive rules with **scheduled scaling**: trigger `min = 4` at **6:50 PM** so fresh containers finish warming up before the 7:00 PM rush even starts.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-3',
          patch: { state: 'focus', load: 0.48, badge: '6:50 PM warm' },
        },
        {
          op: 'update-node',
          id: 'app-4',
          patch: { state: 'focus', load: 0.48, badge: '6:50 PM warm' },
        },
        {
          op: 'update-note',
          id: 'bounds-note',
          patch: { text: '6:50 PM cron → 4 nodes', tone: 'good' },
        },
        { op: 'set-metric', id: 'cpu', value: '48%', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'db-ceiling',
      label: 'DB ceiling',
      kind: 'watch-out',
      title: 'The database does not autoscale the same way',
      body: [
        'Stateless app nodes spin up in minutes. Your primary **Videos DB** cannot cleanly clone itself on a CPU spike—and adding 10 new app servers multiplies open DB connections, risking connection exhaustion.',
        'Protect the database with caches, connection poolers, read replicas, or planned sharding rather than reactive autoscaling.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Autoscaling an app pool from 2 to 20 nodes can overload your single database with connections.',
        },
      ],
      ops: [
        { op: 'update-node', id: 'scaler', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'app-3',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'app-4',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'hot', load: 0.94, badge: 'Conn spike!' },
        },
        {
          op: 'packet',
          edge: 'app3-db',
          kind: 'error',
          label: 'Max conns',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'app4-db',
          kind: 'error',
          label: 'Max conns',
          wave: 0,
        },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Scale with headroom, cooldowns, and DB care',
      body: [
        'Autoscaling matches fleet size to demand without paying for empty servers overnight. Pair reactive metric targets and cooldowns with scheduled pre-warming for daily cycles—and keep your stateful database shielded.',
      ],
      ops: [
        { op: 'remove-note', id: 'bounds-note' },
        {
          op: 'update-node',
          id: 'db',
          patch: { state: 'normal', load: 0.55, badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'auto-summary',
            anchor: { at: { x: 2, y: 1 } },
            text: 'Autoscaling checklist',
            tone: 'info',
            icon: 'clock',
            rows: [
              ['Target', '~60% CPU / RPS'],
              ['Bounds', 'Min ≥ 2 · Max cap'],
              ['Stability', 'Cooldown + cron'],
            ],
            total: ['Stateful tier', 'Pool + cache + replicas'],
          },
        },
      ],
      takeaways: [
        'Autoscale on leading metrics (CPU, queue depth, RPS) below the queueing knee so nodes survive boot lag',
        'Set a min floor (≥ 2 for availability) and max ceiling (cost protection)',
        'Use cooldown windows and asymmetric scale-in rules to prevent flapping',
        'Pre-warm predictable surges with scheduled scaling, and protect the database separately',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-threshold-headroom',
      kind: 'choice',
      prompt:
        'Why is triggering scale-out at 95% CPU usually too late in production?',
      options: [
        'New instances need minutes to boot and warm up while existing servers are already dropping requests',
        'Load balancers refuse to route traffic above 90% CPU',
        'Databases shut down automatically when app CPU reaches 95%',
      ],
      answer: 0,
      explain:
        'Because boot, container pulls, and health checks take 2–5 minutes, triggering at 60–70% gives existing servers enough headroom to stay fast during warm-up.',
      step: 'warmup-lag',
    },
    {
      id: 'choice-stop-flapping',
      kind: 'choice',
      prompt:
        'Your autoscaler keeps adding two servers, removing them five minutes later, and adding them right back. Which two controls fix this flapping?',
      options: [
        'Adding a cooldown period and scaling in more slowly than scaling out',
        'Setting min = 1 and disabling health checks',
        'Switching from horizontal scaling to sticky sessions',
      ],
      answer: 0,
      explain:
        'A cooldown enforces a waiting window after scaling actions, and asymmetric thresholds (scale out fast, scale in cautiously) stop oscillation.',
      step: 'cooldown-flapping',
    },
    {
      id: 'order-scheduled-scale',
      kind: 'order',
      prompt:
        'Order what happens when scheduled scaling pre-warms capacity before a daily 7:00 PM peak.',
      items: [
        'Scheduled rule raises min instances from 2 to 4 at 6:50 PM',
        'App 3 and App 4 boot, warm up caches, and pass /health checks',
        '7:00 PM viewer traffic doubles onto 4 already healthy servers',
        'CPU stays near 48% with zero warm-up latency spike',
      ],
      explain:
        'Pre-scaling before a known daily surge completes boot and warm-up lag while traffic is still light.',
      step: 'scheduled-scaling',
    },
    {
      id: 'numeric-target-instances',
      kind: 'numeric',
      prompt:
        'Each app instance can safely handle 400 RPS at your target 65% CPU. When evening peak hits 2,400 RPS, how many healthy instances does the pool need?',
      unit: 'instances',
      answer: 6,
      tolerance: 0.05,
      explain: '2,400 RPS ÷ 400 RPS per instance = 6 instances.',
      step: 'pool-ready',
    },
  ],
  cards: [
    {
      front: 'Why do autoscalers target 60–70% CPU instead of 95%?',
      back: 'Booting and warming up new instances takes 2–5 minutes; early triggers give existing nodes headroom to avoid queueing spikes during that lag.',
    },
    {
      front: 'Why set both min and max instance counts on an autoscaling group?',
      back: '• Min floor (≥ 2): preserves redundancy during quiet hours.\n• Max cap: prevents bugs or DDoS bursts from spinning up an unlimited cloud bill.',
    },
    {
      front: 'What causes autoscaling flapping and how do you stop it?',
      back: 'Scaling in too soon pushes CPU back over the scale-out threshold. Prevent it with a cooldown period and conservative scale-in rules.',
    },
    {
      front: 'Why doesn’t a relational database autoscale smoothly like stateless web servers?',
      back: 'State on disk cannot be spawned or destroyed in seconds, and scaling app instances out multiplies database connections—requiring caches, connection pools, replicas, or sharding.',
    },
  ],
} satisfies Lesson;
