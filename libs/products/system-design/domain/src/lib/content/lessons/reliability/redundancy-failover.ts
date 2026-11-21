import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 05.01: Redundancy & Failover (`redundancy-failover`).
 * Scenario: A data centre loses power (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'redundancy-failover',
  learn: [
    'Spot single points of failure (SPOFs) across a request path',
    'Compare active-passive failover with active-active routing',
    'Break failover time into health detection and cutover',
    'Isolate blast radius across availability zones and regions',
    'Size architectures to concrete RPO and RTO targets',
  ],
  scene: {
    nodes: [
      {
        id: 'patients',
        kind: 'client',
        at: { x: 1, y: 4 },
        label: 'Patients',
        sublabel: 'Booking app',
      },
      {
        id: 'dns',
        kind: 'dns',
        at: { x: 3, y: 1 },
        label: 'DNS',
        sublabel: 'api.care.ex',
      },
      {
        id: 'app-a',
        kind: 'server',
        at: { x: 6, y: 4 },
        label: 'Booking API',
        sublabel: 'DC-East',
        load: 0.35,
      },
      {
        id: 'db-a',
        kind: 'database',
        at: { x: 10, y: 4 },
        label: 'Bookings DB',
        sublabel: 'DC-East',
      },
    ],
    edges: [
      {
        id: 'patients-dns',
        from: 'patients',
        to: 'dns',
        label: 'DNS',
        style: 'dashed',
      },
      {
        id: 'patients-app',
        from: 'patients',
        to: 'app-a',
        label: 'HTTPS',
      },
      { id: 'app-db', from: 'app-a', to: 'db-a', label: 'SQL' },
    ],
    zones: [
      {
        id: 'dc-east',
        from: { x: 5, y: 2 },
        to: { x: 11, y: 5 },
        hue: 'blue',
        label: 'DC-East (one room)',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'rto', label: 'RTO', icon: 'timer', value: '—' },
    { id: 'rpo', label: 'RPO', icon: 'database', value: '—' },
    { id: 'capacity', label: 'Capacity', icon: 'gauge', value: '100%' },
    { id: 'status', label: 'Status', icon: 'shield', value: 'Up' },
  ],
  steps: [
    {
      id: 'power-cut',
      label: 'Blackout',
      kind: 'problem',
      title: 'One transformer trips and the app vanishes',
      body: [
        'Patients book clinic slots on your telehealth app, hosted entirely inside **DC-East**. At 09:04, a power transformer trips and blacks out the data centre.',
        'Every request fails (`503`). Until power returns or you rebuild elsewhere, zero bookings succeed—turning one local fault into a total outage.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-a',
          patch: { state: 'down', load: 0, badge: 'No power' },
        },
        {
          op: 'update-node',
          id: 'db-a',
          patch: { state: 'down', badge: 'No power' },
        },
        { op: 'update-edge', id: 'patients-app', patch: { state: 'broken' } },
        {
          op: 'packet',
          edge: 'patients-app',
          kind: 'error',
          reverse: true,
          count: 2,
          label: '503 Outage',
          wave: 0,
        },
        { op: 'set-metric', id: 'status', value: 'Down', tone: 'bad' },
        { op: 'set-metric', id: 'capacity', value: '0%', tone: 'bad' },
        { op: 'set-metric', id: 'rto', value: 'Hours?', tone: 'bad' },
      ],
    },
    {
      id: 'spof-audit',
      label: 'SPOF audit',
      kind: 'technique',
      title: 'Redundancy removes single points of failure',
      body: [
        'A **single point of failure** (_SPOF_) is any piece whose failure stops the whole system—even twin web servers still fail together if they share one database or one power feed.',
        'True redundancy duplicates every critical hop (`DNS`, entry routing, compute, storage) across independent hardware.',
      ],
      changes: [
        { type: 'added', text: 'SPOF checklist across every tier' },
        { type: 'changed', text: 'Power restored in DC-East to inspect hops' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-a',
          patch: { state: 'normal', load: 0.35, badge: null },
        },
        {
          op: 'update-node',
          id: 'db-a',
          patch: { state: 'normal', badge: null },
        },
        { op: 'update-edge', id: 'patients-app', patch: { state: 'normal' } },
        {
          op: 'add-note',
          note: {
            id: 'spof-note',
            anchor: { at: { x: 2, y: 7 } },
            text: 'Single points of failure',
            tone: 'info',
            icon: 'warning',
            rows: [
              ['Entry / LB', '1 path'],
              ['Booking API', '1 room'],
              ['Bookings DB', '1 disk'],
            ],
          },
        },
        { op: 'set-metric', id: 'status', value: 'Audited', tone: 'normal' },
        { op: 'set-metric', id: 'capacity', value: '100%', tone: 'normal' },
      ],
      learns: [0],
    },
    {
      id: 'active-passive',
      label: 'Active-passive',
      kind: 'technique',
      title: 'Active-passive keeps a warm standby ready',
      body: [
        'In **active-passive**, `DC-East` serves 100% of live bookings while `DC-West` stays on standby: an idle server stands ready and a replica streams database writes continuously.',
        'Standby hardware sits mostly unused, yet consistency stays simple because only one database accepts writes at a time.',
      ],
      changes: [
        {
          type: 'added',
          text: 'DC-West standby API and continuously replicated DB',
        },
      ],
      ops: [
        { op: 'remove-note', id: 'spof-note' },
        {
          op: 'add-zone',
          zone: {
            id: 'dc-west',
            from: { x: 5, y: 6 },
            to: { x: 11, y: 9 },
            hue: 'teal',
            label: 'DC-West (standby)',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'app-b',
            kind: 'server',
            at: { x: 6, y: 8 },
            label: 'Standby API',
            sublabel: 'DC-West warm',
            state: 'dim',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'db-b',
            kind: 'replica',
            at: { x: 10, y: 8 },
            label: 'Replica DB',
            sublabel: 'Async lag 5 s',
            state: 'dim',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'db-rep',
            from: 'db-a',
            to: 'db-b',
            label: 'WAL stream',
            style: 'dashed',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'app-b-db-b',
            from: 'app-b',
            to: 'db-b',
            style: 'dashed',
            state: 'dim',
          },
        },
        { op: 'packet', edge: 'db-rep', kind: 'write', wave: 0 },
      ],
      learns: [1],
    },
    {
      id: 'detection-cutover',
      label: 'Failover time',
      kind: 'technique',
      title: 'Recovery time = detection + promotion + routing',
      body: [
        'Failover is never instant. First, health checks wait for **3 missed probes** at `10 s` intervals (**30 s** detection) to avoid false alarms.',
        'Next, the replica promotes to primary (**15 s**) and short-TTL DNS steers patients to `DC-West` (**45 s**). Total recovery time: **90 seconds**.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Real failover latency is always detection delay + state promotion + traffic cutover.',
        },
      ],
      changes: [
        { type: 'changed', text: 'DC-East lost; traffic promoted to DC-West' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-a',
          patch: { state: 'down', load: 0, badge: 'Lost' },
        },
        {
          op: 'update-node',
          id: 'db-a',
          patch: { state: 'down', badge: 'Lost' },
        },
        { op: 'remove-edge', id: 'patients-app' },
        {
          op: 'update-node',
          id: 'app-b',
          patch: { state: 'focus', load: 0.4, badge: 'Active' },
        },
        {
          op: 'update-node',
          id: 'db-b',
          patch: { state: 'focus' },
        },
        {
          op: 'update-edge',
          id: 'app-b-db-b',
          patch: { style: 'solid', state: 'normal', label: 'SQL' },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'patients-app-b',
            from: 'patients',
            to: 'app-b',
            label: 'Failover',
          },
        },
        { op: 'packet', edge: 'patients-app-b', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'app-b-db-b', kind: 'write', wave: 1 },
        { op: 'set-metric', id: 'rto', value: '90 s', tone: 'normal' },
        { op: 'set-metric', id: 'status', value: 'Failover', tone: 'normal' },
      ],
      learns: [2],
    },
    {
      id: 'active-active',
      label: 'Active-active',
      kind: 'technique',
      title: 'Active-active serves live users from both sites',
      body: [
        'In **active-active**, a global **load balancer** splits live bookings (`50% / 50%`) across both data centres so no server sits idle.',
        'If `DC-East` fails, active health checks stop routing there within **10 seconds**—no cold warm-up needed, though databases must reconcile or shard writes cleanly.',
      ],
      changes: [
        { type: 'added', text: 'Global load balancer splitting traffic 50 / 50' },
        { type: 'changed', text: 'Failover time drops to ~10 s' },
      ],
      ops: [
        { op: 'remove-edge', id: 'patients-app-b' },
        {
          op: 'add-node',
          node: {
            id: 'glb',
            kind: 'load-balancer',
            at: { x: 3, y: 6 },
            label: 'Global LB',
            sublabel: 'Health checks',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'patients-glb',
            from: 'patients',
            to: 'glb',
            label: 'HTTPS',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'glb-app-a', from: 'glb', to: 'app-a', label: '50%' },
        },
        {
          op: 'add-edge',
          edge: { id: 'glb-app-b', from: 'glb', to: 'app-b', label: '50%' },
        },
        {
          op: 'update-node',
          id: 'app-a',
          patch: { state: 'normal', load: 0.45, badge: null },
        },
        {
          op: 'update-node',
          id: 'db-a',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'app-b',
          patch: { state: 'normal', load: 0.45, badge: null },
        },
        { op: 'packet', edge: 'glb-app-a', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'glb-app-b', kind: 'request', wave: 0 },
        { op: 'set-metric', id: 'rto', value: '10 s', tone: 'good' },
        { op: 'set-metric', id: 'status', value: 'Active ×2', tone: 'good' },
      ],
    },
    {
      id: 'az-vs-region',
      label: 'AZ vs region',
      kind: 'technique',
      title: 'AZs beat room faults; regions beat storms',
      body: [
        'Replicating across **availability zones** (_AZs_—separate power and cooling in one metro, `< 2 ms` apart) lets databases stay synchronous with zero data loss.',
        'Cross-**region** links (`50–150 ms` away) survive regional blackouts or fiber cuts, at the cost of asynchronous replication lag.',
      ],
      ops: [
        { op: 'update-node', id: 'db-b', patch: { state: 'normal' } },
        { op: 'update-node', id: 'glb', patch: { state: 'normal' } },
        {
          op: 'add-note',
          note: {
            id: 'domain-note',
            anchor: { at: { x: 7, y: 1 } },
            text: 'Failure domains',
            tone: 'info',
            icon: 'globe',
            rows: [
              ['Multi-AZ', '< 2 ms · sync'],
              ['Multi-Region', '80 ms · async'],
            ],
          },
        },
        { op: 'packet', edge: 'patients-glb', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'db-rep', kind: 'write', wave: 1 },
      ],
      learns: [3],
    },
    {
      id: 'rpo-rto',
      label: 'RPO and RTO',
      kind: 'technique',
      title: 'RPO bounds lost data; RTO bounds downtime',
      body: [
        'Measure every disaster plan with two targets:',
        '• **RPO** (_Recovery Point Objective_): the maximum age of data you may lose, set by replication lag or backup cadence (`0` for sync multi-AZ, `5 s` here).\n• **RTO** (_Recovery Time Objective_): maximum outage duration, set by detection plus failover (**10 s**).',
      ],
      ops: [
        {
          op: 'update-note',
          id: 'domain-note',
          patch: {
            text: 'Recovery targets',
            tone: 'good',
            icon: 'shield',
            rows: [
              ['RPO (data loss)', '≤ 5 s (async lag)'],
              ['RTO (downtime)', '≤ 10 s (cutover)'],
            ],
          },
        },
        { op: 'set-metric', id: 'rpo', value: '5 s', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'half-fleet-lost',
      label: '50% capacity',
      kind: 'case',
      title: 'Losing one site doubles surviving load',
      body: [
        'Now `DC-East` trips offline under peak morning load. The Global LB drains it in **10 s**, shifting all bookings to `DC-West`.',
        'Because `DC-West` ran at `45%` load, it absorbs the surge at **90%** without crashing. Had both sites run at `75%`, the surviving site would collapse immediately.',
      ],
      changes: [
        { type: 'changed', text: 'DC-East down; DC-West jumps from 45% to 90% load' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-a',
          patch: { state: 'down', load: 0, badge: 'AZ lost' },
        },
        {
          op: 'update-node',
          id: 'db-a',
          patch: { state: 'down', badge: 'AZ lost' },
        },
        { op: 'update-edge', id: 'glb-app-a', patch: { state: 'broken' } },
        {
          op: 'update-node',
          id: 'app-b',
          patch: { state: 'hot', load: 0.9, badge: '90% load' },
        },
        { op: 'update-edge', id: 'glb-app-b', patch: { label: '100%' } },
        {
          op: 'packet',
          edge: 'patients-glb',
          kind: 'request',
          count: 3,
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'glb-app-b',
          kind: 'request',
          count: 3,
          wave: 1,
        },
        { op: 'set-metric', id: 'capacity', value: '50%', tone: 'bad' },
        { op: 'set-metric', id: 'status', value: 'Degraded', tone: 'bad' },
      ],
    },
    {
      id: 'untested-failover',
      label: 'Untested drill',
      kind: 'watch-out',
      title: 'Watch out: untested failovers break live',
      body: [
        'A standby site that never runs live traffic quietly rots: missing firewall rules, stale DNS TTLs, cold caches, or silent replication lag (`RPO = 2 hours` instead of `5 s`).',
        'Schedule regular **failover drills** during business hours so your measured **RPO** and **RTO** are real numbers, not hopeful guesses.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Failover you never test does not work; rehearse cutovers and measure real RTO and RPO.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'db-b',
          patch: { state: 'hot', badge: 'Lag unchecked?' },
        },
        {
          op: 'add-note',
          note: {
            id: 'drill-note',
            anchor: { node: 'glb' },
            text: 'Rehearse drills regularly',
            tone: 'bad',
            icon: 'warning',
          },
        },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Design redundancy around RPO and RTO',
      body: [
        'Redundancy only protects availability when replicas live in independent failure domains, run with spare headroom, and practise failover regularly.',
      ],
      ops: [
        { op: 'remove-note', id: 'drill-note' },
        { op: 'remove-note', id: 'domain-note' },
        {
          op: 'update-node',
          id: 'app-a',
          patch: { state: 'normal', load: 0.45, badge: null },
        },
        {
          op: 'update-node',
          id: 'db-a',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'app-b',
          patch: { state: 'normal', load: 0.45, badge: null },
        },
        {
          op: 'update-node',
          id: 'db-b',
          patch: { state: 'normal', badge: null },
        },
        { op: 'update-edge', id: 'glb-app-a', patch: { state: 'normal' } },
        { op: 'update-edge', id: 'glb-app-b', patch: { label: '50%' } },
        {
          op: 'add-note',
          note: {
            id: 'failover-summary',
            anchor: { at: { x: 7, y: 1 } },
            text: 'Failover patterns',
            tone: 'good',
            icon: 'check',
            rows: [
              ['Active-passive', 'Simple DB · ~90s RTO'],
              ['Active-active', 'Uses fleet · ~10s RTO'],
              ['Multi-AZ', '<2ms sync · 0 RPO'],
            ],
            total: ['Rule', 'Keep 2× headroom'],
          },
        },
        { op: 'set-metric', id: 'capacity', value: '100%', tone: 'good' },
        { op: 'set-metric', id: 'status', value: 'Resilient', tone: 'good' },
      ],
      takeaways: [
        'Eliminate every single point of failure across compute, routing, power, and storage',
        'Active-passive simplifies single-writer consistency at the cost of slower RTO and idle hardware',
        'Active-active lowers RTO and serves live traffic from every site, but needs spare headroom',
        'RPO is bounded by replication lag or backup cadence; RTO is bounded by detection plus cutover',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-rpo-meaning',
      kind: 'choice',
      prompt:
        'A database replicates asynchronously to a second region with a typical lag of 8 seconds. Which target does that 8-second lag directly determine?',
      options: [
        'RPO (Recovery Point Objective): up to 8 seconds of recent writes could be lost',
        'RTO (Recovery Time Objective): clients always reconnect in 8 seconds',
        'DNS TTL: records expire every 8 seconds',
      ],
      answer: 0,
      explain:
        'RPO measures maximum acceptable data loss in time; asynchronous replication lag bounds how many committed writes may not have reached the standby.',
      step: 'rpo-rto',
    },
    {
      id: 'numeric-failover-rto',
      kind: 'numeric',
      prompt:
        'Health checks probe every 10 seconds and require 3 consecutive misses to declare an outage. Replica promotion takes 15 seconds and DNS cutover takes 25 seconds. What is the total RTO in seconds?',
      unit: 'seconds',
      answer: 70,
      tolerance: 0.05,
      explain:
        'Detection takes 3 × 10 s = 30 s, plus 15 s promotion and 25 s traffic cutover = 70 seconds total.',
      step: 'detection-cutover',
    },
    {
      id: 'order-active-passive-failover',
      kind: 'order',
      prompt:
        'Order the sequence of events in an active-passive failover from fault to restored service.',
      items: [
        'Primary data centre stops answering health probes',
        'Health monitor marks primary unhealthy after consecutive missed checks',
        'Standby replica promotes to accept primary writes',
        'Load balancers and DNS route traffic to the standby site',
      ],
      explain:
        'You must detect the failure first, promote the standby safely so writes have a home, and then cut traffic over.',
      step: 'detection-cutover',
    },
    {
      id: 'choice-active-active-headroom',
      kind: 'choice',
      prompt:
        'Two active-active regions each run at 75% CPU utilisation during evening peak. If one region loses power, what happens to the surviving region?',
      options: [
        'Traffic jumps to 150% of its capacity, causing severe overload unless load is shed',
        'CPU utilisation drops to 37.5% because traffic is halved',
        'Active-active systems automatically split the extra load back to the downed site',
      ],
      answer: 0,
      explain:
        'Each surviving site must carry both regions’ traffic (75% + 75% = 150% load). Run below 50% per site in 2-region active-active, or plan load shedding.',
      step: 'half-fleet-lost',
    },
  ],
  cards: [
    {
      front: 'What is a single point of failure (SPOF)?',
      back: 'Any component (server, load balancer, database, power feed, or AZ) whose single failure halts the entire system.',
    },
    {
      front: 'Compare active-passive and active-active failover.',
      back: '• Active-passive: one site serves traffic, standby waits (simpler DB consistency, slower RTO, idle capacity).\n• Active-active: all sites serve live traffic (fast RTO, full utilisation, needs spare headroom and write coordination).',
    },
    {
      front: 'Distinguish RPO from RTO and state what governs each.',
      back: '• RPO (Recovery Point Objective): max tolerable data loss — governed by backup cadence or replication lag.\n• RTO (Recovery Time Objective): max tolerable outage duration — governed by detection time + promotion + traffic cutover.',
    },
    {
      front: 'When should you span availability zones (AZs) vs regions?',
      back: 'Multi-AZ (< 2 ms apart) supports synchronous replication for zero RPO against room/power faults. Multi-region protects against regional disasters using async replication.',
    },
  ],
} satisfies Lesson;
