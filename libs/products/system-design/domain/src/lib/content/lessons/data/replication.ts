import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 03.04: Replication (`replication`).
 * Scenario: Reads outgrow one database (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'replication',
  learn: [
    'How leader-follower replication scales read traffic',
    'How asynchronous replication lag causes stale reads',
    'How read-your-writes and sync replicas control staleness',
    'How failover and multi-leader writes create conflicts',
  ],
  scene: {
    nodes: [
      {
        id: 'app',
        kind: 'service',
        at: { x: 1, y: 4 },
        label: 'Web API',
        sublabel: '12k R / 1k W',
      },
      {
        id: 'leader',
        kind: 'database',
        at: { x: 6, y: 4 },
        label: 'Leader DB',
        sublabel: 'Primary',
        load: 0.94,
        state: 'hot',
      },
    ],
    edges: [
      {
        id: 'app-leader',
        from: 'app',
        to: 'leader',
        label: '13k RPS',
      },
    ],
    zones: [
      {
        id: 'cluster-zone',
        from: { x: 4, y: 0 },
        to: { x: 12, y: 8 },
        hue: 'violet',
        label: 'Database cluster',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'read-rps', label: 'Read RPS', icon: 'gauge', value: '12,000' },
    { id: 'lag', label: 'Replica lag', icon: 'clock', value: '0 ms' },
    { id: 'leaders', label: 'Leaders', icon: 'database', value: '1' },
  ],
  steps: [
    {
      id: 'read-ceiling',
      label: 'One primary',
      kind: 'problem',
      title: 'Reads push one database to 94% CPU',
      body: [
        'Your web application serves **12,000 reads/s** and **1,000 writes/s** against a single database machine.',
        'Read queries hog CPU and disk cache, driving the primary to **94% load** and stalling checkouts. Buying a bigger machine helps briefly, then hits a hardware wall.',
      ],
      ops: [
        {
          op: 'packet',
          edge: 'app-leader',
          kind: 'request',
          count: 4,
          label: '12k reads/s',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'app-leader',
          kind: 'write',
          label: '1k writes/s',
          wave: 0,
        },
      ],
    },
    {
      id: 'leader-follower',
      label: 'Leader/follow',
      kind: 'technique',
      title: 'A leader streams changes to follower replicas',
      body: [
        'Add **leader-follower replication**: one **Leader** accepts all writes and continuously ships its write-ahead log (`WAL`) to read-only **Followers** (`Replica 1`, `Replica 2`).',
        'Because followers stay in sync by replaying the leader’s ordered change stream, every replica holds a live copy of the data.',
      ],
      changes: [
        { type: 'added', text: 'Two follower replicas receiving WAL stream' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'leader',
          patch: { state: 'focus', sublabel: 'Leader · Writes' },
        },
        {
          op: 'add-node',
          node: {
            id: 'replica-1',
            kind: 'replica',
            at: { x: 10, y: 2 },
            label: 'Replica 1',
            sublabel: 'Follower',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'replica-2',
            kind: 'replica',
            at: { x: 10, y: 6 },
            label: 'Replica 2',
            sublabel: 'Follower',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'leader-r1',
            from: 'leader',
            to: 'replica-1',
            label: 'async WAL',
            style: 'dashed',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'leader-r2',
            from: 'leader',
            to: 'replica-2',
            label: 'async WAL',
            style: 'dashed',
          },
        },
        { op: 'packet', edge: 'leader-r1', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'leader-r2', kind: 'write', wave: 0 },
      ],
      learns: [0],
    },
    {
      id: 'read-replicas',
      label: 'Read replicas',
      kind: 'technique',
      title: 'Route 12k reads/s to replicas, writes to leader',
      body: [
        'Now split traffic in the application layer: send the **1,000 writes/s** to `Leader DB` and spread the **12,000 reads/s** across `Replica 1` and `Replica 2`.',
        'Leader CPU drops from **94%** to a calm **28%**, and you can scale reads horizontally by adding more followers.',
      ],
      changes: [
        { type: 'added', text: 'Read paths from Web API to both replicas' },
        { type: 'changed', text: 'Leader load drops to 28%' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'leader',
          patch: { state: 'normal', load: 0.28 },
        },
        {
          op: 'update-node',
          id: 'replica-1',
          patch: { state: 'normal', load: 0.45 },
        },
        {
          op: 'update-node',
          id: 'replica-2',
          patch: { state: 'normal', load: 0.45 },
        },
        {
          op: 'update-edge',
          id: 'app-leader',
          patch: { label: '1k writes/s' },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'app-r1',
            from: 'app',
            to: 'replica-1',
            label: '6k reads/s',
            route: 'elbow-y',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'app-r2',
            from: 'app',
            to: 'replica-2',
            label: '6k reads/s',
            route: 'elbow-y',
          },
        },
        { op: 'packet', edge: 'app-leader', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'app-r1', kind: 'request', count: 2, wave: 0 },
        { op: 'packet', edge: 'app-r2', kind: 'request', count: 2, wave: 0 },
        { op: 'set-metric', id: 'lag', value: '15 ms', tone: 'good' },
      ],
      learns: [0],
    },
    {
      id: 'async-lag',
      label: 'Async lag',
      kind: 'case',
      title: 'Replication lag hides a user’s own update',
      body: [
        'Under a heavy batch import, asynchronous WAL shipping falls **800 ms** behind. A shopper updates their shipping address on `Leader DB`, reloads, and reads from `Replica 1`.',
        'The replica has not replayed that WAL entry yet, so it returns the **old address**—making the user think their save vanished!',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'replica-1',
          patch: { state: 'hot', badge: '800 ms lag' },
        },
        {
          op: 'add-note',
          note: {
            id: 'stale-note',
            anchor: { node: 'replica-1' },
            text: 'Stale read: old address',
            tone: 'bad',
            icon: 'warning',
          },
        },
        {
          op: 'packet',
          edge: 'app-leader',
          kind: 'write',
          label: 'save address',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'app-r1',
          kind: 'response',
          reverse: true,
          label: 'stale row',
          wave: 1,
        },
        { op: 'set-metric', id: 'lag', value: '800 ms', tone: 'bad' },
      ],
      learns: [1],
    },
    {
      id: 'read-your-writes',
      label: 'Your writes',
      kind: 'technique',
      title: 'Read-your-writes closes the stale gap',
      body: [
        'Fix this without losing read scaling via **read-your-writes** consistency: after a user mutates data, route _their_ reads to the **Leader** for a short window (~2–5 s)—or pass their write log position (`LSN`) and only query replicas caught up past it.',
        'Everyone else keeps reading fast replicas; writers always see their own edits.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Route a user’s own post-write reads to the leader (or an LSN-caught-up replica) while keeping general reads on async followers.',
        },
      ],
      ops: [
        { op: 'remove-note', id: 'stale-note' },
        {
          op: 'update-node',
          id: 'replica-1',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'leader',
          patch: { state: 'focus', badge: 'writer reads' },
        },
        {
          op: 'packet',
          edge: 'app-leader',
          kind: 'request',
          label: 'own profile',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'app-leader',
          kind: 'response',
          reverse: true,
          label: 'fresh row',
          wave: 1,
        },
      ],
      learns: [2],
    },
    {
      id: 'sync-vs-async',
      label: 'Sync vs async',
      kind: 'technique',
      title: 'Trade write latency for zero data loss',
      body: [
        '**Async replication** replies immediately (fast writes, **0 ms** wait), but if the leader’s disk dies before shipping, committed writes vanish.',
        'With **semi-synchronous replication**, the leader waits until _one_ standby follower writes to disk before confirming `OK`. Writes pay one cross-AZ round trip, guaranteeing zero data loss on failover.',
      ],
      changes: [
        { type: 'changed', text: 'Replica 1 promoted to synchronous standby' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'leader',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-edge',
          id: 'leader-r1',
          patch: { style: 'solid', label: 'sync WAL' },
        },
        {
          op: 'update-node',
          id: 'replica-1',
          patch: { state: 'focus', badge: 'sync standby' },
        },
        { op: 'packet', edge: 'app-leader', kind: 'write', wave: 0 },
        {
          op: 'packet',
          edge: 'leader-r1',
          kind: 'write',
          label: 'fsync ACK',
          wave: 1,
        },
        { op: 'set-metric', id: 'lag', value: '0 ms (R1)', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'failover',
      label: 'Failover',
      kind: 'case',
      title: 'When the leader crashes, a replica promotes',
      body: [
        'Suppose `Leader DB` crashes. Heartbeats time out, and failover promotes `Replica 1` to the **new Leader** while pointing `Web API` writes to it.',
        'Because `Replica 1` was synchronous, zero commits are lost. Still, beware **split-brain** if the old leader restarts thinking it still leads—fencing must block its writes.',
      ],
      changes: [
        {
          type: 'changed',
          text: 'Old leader down; Replica 1 promoted to Leader',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'leader',
          patch: { state: 'down', badge: 'crashed' },
        },
        {
          op: 'update-edge',
          id: 'leader-r1',
          patch: { state: 'broken', label: 'down' },
        },
        {
          op: 'update-edge',
          id: 'leader-r2',
          patch: { state: 'broken', label: 'down' },
        },
        {
          op: 'update-node',
          id: 'replica-1',
          patch: {
            label: 'New Leader',
            sublabel: 'Promoted',
            state: 'focus',
            badge: 'promoted',
          },
        },
        {
          op: 'update-edge',
          id: 'app-r1',
          patch: { label: 'writes + reads' },
        },
        { op: 'packet', edge: 'app-r1', kind: 'write', wave: 0 },
      ],
      learns: [3],
    },
    {
      id: 'multi-leader',
      label: 'Multi-leader',
      kind: 'watch-out',
      title: 'Multiple leaders invite write conflicts',
      body: [
        'Global apps sometimes run **two leaders** (US + EU) so local writes finish fast everywhere, syncing asynchronously across oceans.',
        'If two users edit the same title concurrently in US and EU, both succeed locally—then collide during sync! Picking a winner with wall-clock timestamps (_last-write-wins_) silently drops edits.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Prefer single-leader per shard unless multi-region writes demand multi-leader—and then plan conflict resolution (CRDTs, merge rules).',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'leader',
          patch: {
            label: 'US Leader',
            sublabel: 'Multi-leader',
            state: 'hot',
            badge: 'edit: "A"',
          },
        },
        {
          op: 'update-node',
          id: 'replica-1',
          patch: {
            label: 'EU Leader',
            sublabel: 'Multi-leader',
            state: 'hot',
            badge: 'edit: "B"',
          },
        },
        {
          op: 'update-edge',
          id: 'leader-r1',
          patch: { style: 'dashed', state: 'normal', label: 'conflict!' },
        },
        {
          op: 'packet',
          edge: 'leader-r1',
          kind: 'error',
          label: 'A vs B',
          wave: 0,
        },
        { op: 'set-metric', id: 'leaders', value: '2 (conflict)', tone: 'bad' },
      ],
      learns: [3],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Pick replication mode by reads, RPO, and lag',
      body: [
        'Leader-follower replication scales reads cleanly without adding write conflicts. Guard UX with read-your-writes routing, use a synchronous standby when zero data loss matters, and avoid multi-leader until you truly need local multi-region writes.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'leader',
          patch: {
            label: 'Leader DB',
            sublabel: 'Primary',
            state: 'normal',
            badge: null,
          },
        },
        {
          op: 'update-node',
          id: 'replica-1',
          patch: {
            label: 'Replica 1',
            sublabel: 'Sync standby',
            state: 'normal',
            badge: null,
          },
        },
        {
          op: 'add-note',
          note: {
            id: 'rep-summary',
            anchor: { at: { x: 7, y: 9 } },
            text: 'Replication modes',
            tone: 'info',
            icon: 'layers',
            rows: [
              ['Async', 'Fast · lag risk'],
              ['Semi-sync', '1 RTT · 0 loss'],
              ['Own writes', 'Read leader'],
              ['Multi-lead', 'Write conflicts'],
            ],
          },
        },
        { op: 'set-metric', id: 'leaders', value: '1', tone: 'good' },
      ],
      takeaways: [
        'Leader-follower replication sends writes to one leader and scales reads across follower replicas',
        'Asynchronous lag causes stale reads; route a user’s own post-write reads to the leader (read-your-writes)',
        'Semi-synchronous replication waits for at least one follower to persist before ACKing, trading RTT for durability',
        'Failover promotes a follower on leader loss; multi-leader topologies create concurrent write conflicts',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-read-your-writes',
      kind: 'choice',
      prompt:
        'A user updates their bio and immediately reloads their profile page, seeing the old bio from an async read replica. Which pattern fixes this without routing ALL users’ reads to the leader?',
      options: [
        'Read-your-writes: route that user’s own reads to the leader for a short window (or until their write LSN is replayed)',
        'Disable database indexes on the replicas',
        'Switch to multi-leader replication inside one rack',
      ],
      answer: 0,
      explain:
        'Routing only the writer’s recent reads to the leader (or an LSN-caught-up replica) guarantees freshness for the author while keeping read scaling for everyone else.',
      step: 'read-your-writes',
    },
    {
      id: 'choice-sync-vs-async',
      kind: 'choice',
      prompt:
        'What is the main trade-off between asynchronous and semi-synchronous replication?',
      options: [
        'Semi-sync adds follower round-trip latency to every write in exchange for zero committed data loss if the leader crashes',
        'Async replication uses twice as much disk storage as semi-sync',
        'Semi-sync eliminates the need for failover when the leader goes down',
      ],
      answer: 0,
      explain:
        'Waiting for a follower to fsync each commit protects durability across single-node failure, at the cost of network RTT on writes.',
      step: 'sync-vs-async',
    },
    {
      id: 'choice-multi-leader-lww',
      kind: 'choice',
      prompt:
        'Why is "last-write-wins" (using wall-clock timestamps) risky for resolving multi-leader write conflicts?',
      options: [
        'Clock skew across nodes can cause an earlier edit to look newer, and conflicting updates are silently overwritten',
        'Timestamps only work on integer primary keys',
        'It blocks all reads until all leaders shut down',
      ],
      answer: 0,
      explain:
        'Physical clocks drift across machines, and LWW discards one user’s concurrent write silently instead of merging.',
      step: 'multi-leader',
    },
    {
      id: 'order-failover-steps',
      kind: 'order',
      prompt: 'Order the events of a safe single-leader database failover.',
      items: [
        'Health monitors detect the leader missed heartbeats and confirm it is down',
        'The most up-to-date standby replica is selected and promoted to leader',
        'Write traffic and fencing tokens switch so the old leader cannot accept stale writes',
      ],
      explain:
        'You first confirm leader failure, promote the freshest replica, and update routing/fencing so split-brain writes are blocked.',
      step: 'failover',
    },
    {
      id: 'numeric-replica-reads',
      kind: 'numeric',
      prompt:
        'An API serves 12,000 read RPS and sends all reads evenly across 3 follower replicas (while 1,000 write RPS go to the leader). How many read RPS does each replica serve?',
      unit: 'RPS',
      answer: 4000,
      tolerance: 0.05,
      explain: '12,000 read RPS ÷ 3 replicas = 4,000 read RPS per follower.',
      step: 'read-replicas',
    },
  ],
  cards: [
    {
      front:
        'How does leader-follower replication scale a read-heavy workload?',
      back: 'One leader handles all writes and streams its WAL to multiple follower replicas, which absorb read queries in parallel.',
    },
    {
      front:
        'What is "read-your-writes" consistency, and how do you implement it?',
      back: 'Ensuring a user immediately sees changes they just wrote—implemented by routing that user’s reads to the leader briefly after a write or checking replica LSN progress.',
    },
    {
      front: 'Contrast asynchronous vs semi-synchronous replication.',
      back: '• Async: leader commits and replies immediately (low latency, risk of losing unshipped writes on crash)\n• Semi-sync: leader waits for at least one follower to confirm disk write before ACKing (higher write RTT, zero data loss)',
    },
    {
      front: 'Why does multi-leader replication complicate correctness?',
      back: 'Two leaders can accept concurrent edits to the same record independently, creating write conflicts that require merge rules, CRDTs, or application resolution.',
    },
  ],
} satisfies Lesson;
