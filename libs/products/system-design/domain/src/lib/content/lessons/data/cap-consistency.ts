import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 03.08: CAP & Consistency (`cap-consistency`).
 * Scenario: A link cut between two data centres (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'cap-consistency',
  learn: [
    'Why network partitions force a choice between C and A',
    'Strong (linearizable) vs eventual consistency trade-offs',
    'Session guarantees like read-your-writes for real users',
    'How quorum overlap (R + W > N) guarantees fresh reads',
    'How PACELC extends CAP to normal latency trade-offs',
  ],
  scene: {
    nodes: [
      {
        id: 'client-e',
        kind: 'client',
        at: { x: 2, y: 3 },
        label: 'User A',
        sublabel: 'East client',
      },
      {
        id: 'db-e',
        kind: 'database',
        at: { x: 3, y: 6 },
        label: 'Node East',
        sublabel: 'v1 · stock=5',
      },
      {
        id: 'db-w',
        kind: 'replica',
        at: { x: 11, y: 6 },
        label: 'Node West',
        sublabel: 'v1 · stock=5',
      },
      {
        id: 'client-w',
        kind: 'client',
        at: { x: 10, y: 3 },
        label: 'User B',
        sublabel: 'West client',
      },
    ],
    edges: [
      { id: 'e-in', from: 'client-e', to: 'db-e', label: 'Write' },
      { id: 'rep-link', from: 'db-e', to: 'db-w', label: 'WAN sync' },
      { id: 'w-in', from: 'client-w', to: 'db-w', label: 'Read' },
    ],
    zones: [
      {
        id: 'dc-east',
        from: { x: 1, y: 0 },
        to: { x: 4, y: 7 },
        hue: 'violet',
        label: 'DC East',
      },
      {
        id: 'dc-west',
        from: { x: 9, y: 0 },
        to: { x: 12, y: 7 },
        hue: 'teal',
        label: 'DC West',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'link', label: 'WAN link', icon: 'link', value: 'Healthy' },
    { id: 'avail', label: 'Availability', icon: 'shield', value: '100%' },
    { id: 'stale', label: 'Stale reads', icon: 'warning', value: '0%' },
    { id: 'write-ms', label: 'Write p50', icon: 'timer', value: '45 ms' },
  ],
  steps: [
    {
      id: 'cross-dc-sync',
      label: 'Healthy sync',
      kind: 'problem',
      title: 'Two data centres replicate across one fibre link',
      body: [
        'Your store replicates inventory between **DC East** and **DC West**. User A buys one item (`stock: 5 → 4`), and the update replicates over a WAN link so User B sees `4` too.',
        'Suddenly, construction cuts the fibre link between East and West. Both data centres are still online—but isolated from each other.',
      ],
      ops: [
        {
          op: 'packet',
          edge: 'e-in',
          kind: 'write',
          label: 'stock=4',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'rep-link',
          kind: 'write',
          label: 'replicate',
          wave: 1,
        },
        {
          op: 'update-node',
          id: 'db-e',
          patch: { sublabel: 'v2 · stock=4' },
        },
        {
          op: 'update-node',
          id: 'db-w',
          patch: { sublabel: 'v2 · stock=4' },
        },
      ],
    },
    {
      id: 'partition-hits',
      label: 'Partition',
      kind: 'case',
      title: 'A network partition forces an instant choice',
      body: [
        'Cables fail, switches drop packets, and routers misconfigure: **network partitions (`P`) are a fact of physics**, not an optional flag.',
        'User B clicks buy in West while User A buys in East, yet `Node East` and `Node West` cannot talk. Can both sides keep answering safely?',
      ],
      changes: [
        {
          type: 'changed',
          text: 'Cross-DC WAN link breaks (partition active)',
        },
      ],
      ops: [
        {
          op: 'update-edge',
          id: 'rep-link',
          patch: { state: 'broken', label: 'Link cut!' },
        },
        {
          op: 'update-node',
          id: 'db-e',
          patch: { state: 'hot', badge: 'isolated' },
        },
        {
          op: 'update-node',
          id: 'db-w',
          patch: { state: 'hot', badge: 'isolated' },
        },
        {
          op: 'packet',
          edge: 'rep-link',
          kind: 'error',
          label: 'timeout',
          wave: 0,
        },
        { op: 'set-metric', id: 'link', value: 'Split!', tone: 'bad' },
      ],
      learns: [0],
    },
    {
      id: 'cp-vs-ap',
      label: 'CP vs AP',
      kind: 'technique',
      title: 'Pick Consistency (CP) or Availability (AP)',
      body: [
        'Under the **CAP theorem**, when a partition happens you choose one of two behaviours:',
        '• **CP (Consistency)**: refuse requests on the unreachable side (`Node West` returns `503`) so nobody reads stale stock or oversells.\n• **AP (Availability)**: both sides keep serving (`Node West` answers with old `stock=4` while East moves to `3`), risking conflicting updates.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'You never sacrifice P: partitions happen. CAP only chooses between C (fail safely) and A (stay online with stale data) during a split.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'db-e',
          patch: {
            state: 'focus',
            badge: 'CP: active',
            sublabel: 'v3 · stock=3',
          },
        },
        {
          op: 'update-node',
          id: 'db-w',
          patch: { state: 'down', badge: 'CP: 503', sublabel: 'stale v2' },
        },
        {
          op: 'packet',
          edge: 'w-in',
          kind: 'error',
          reverse: true,
          label: '503 Unavailable',
          wave: 0,
        },
        { op: 'set-metric', id: 'avail', value: '50%', tone: 'bad' },
        { op: 'set-metric', id: 'stale', value: '0%', tone: 'good' },
      ],
    },
    {
      id: 'strong-eventual',
      label: 'Strong vs evt',
      kind: 'technique',
      title: 'Strong linearizability vs eventual convergence',
      body: [
        '**Strong consistency (linearizability)** makes replicas behave like one copy: once a write finishes, every read anywhere sees it immediately.',
        '**Eventual consistency** lets replicas serve locally during splits or fast writes, then sync and resolve conflicts once the link heals so every replica eventually converges.',
      ],
      changes: [
        { type: 'changed', text: 'WAN link heals; replicas converge to v3' },
      ],
      ops: [
        {
          op: 'update-edge',
          id: 'rep-link',
          patch: { state: 'normal', label: 'WAN sync' },
        },
        {
          op: 'update-node',
          id: 'db-e',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'db-w',
          patch: { state: 'focus', badge: 'synced', sublabel: 'v3 · stock=3' },
        },
        {
          op: 'packet',
          edge: 'rep-link',
          kind: 'event',
          label: 'anti-entropy',
          wave: 0,
        },
        { op: 'set-metric', id: 'link', value: 'Healthy', tone: 'good' },
        { op: 'set-metric', id: 'avail', value: '100%', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'session-rules',
      label: 'Session rules',
      kind: 'technique',
      title: 'Protect UX with session consistency rules',
      body: [
        'Users tolerate another shopper seeing an update a second later, but hate refreshing after _their own_ post and seeing it vanish.',
        'Two **session guarantees** prevent that:\n• **Read-your-writes**: route your reads to a replica holding your latest write.\n• **Monotonic reads**: never route a session backward to an older replica.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'db-w',
          patch: { state: 'normal', badge: 'token >= v3' },
        },
        {
          op: 'packet',
          edge: 'w-in',
          kind: 'request',
          label: 'min v3',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'w-in',
          kind: 'response',
          reverse: true,
          label: 'v3 · stock=3',
          wave: 1,
        },
      ],
      learns: [2],
    },
    {
      id: 'quorums',
      label: 'Quorums',
      kind: 'technique',
      title: 'Overlap reads and writes with R + W > N',
      body: [
        'Add a 3rd replica (`N = 3`). Require **`W` replicas** to confirm every write and query **`R` replicas** on every read, picking the highest version.',
        'Whenever **`R + W > N`**, the read set overlaps the write set by at least one up-to-date node. With `N = 3, W = 2, R = 2`, you survive 1 outage while reading fresh data.',
      ],
      changes: [
        { type: 'added', text: 'Node Central (3rd replica, N = 3)' },
        { type: 'changed', text: 'Quorum configured as W = 2, R = 2' },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'db-c',
            kind: 'replica',
            at: { x: 6.5, y: 5 },
            label: 'Node Central',
            sublabel: 'Replica #3',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'e-to-c',
            from: 'db-e',
            to: 'db-c',
            label: 'W=2',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'w-to-c',
            from: 'db-w',
            to: 'db-c',
            label: 'R=2',
            style: 'dashed',
          },
        },
        { op: 'packet', edge: 'e-to-c', kind: 'write', label: 'v4', wave: 0 },
        {
          op: 'packet',
          edge: 'w-to-c',
          kind: 'request',
          label: 'read v?',
          wave: 1,
        },
        { op: 'set-metric', id: 'stale', value: '0%', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'pacelc',
      label: 'PACELC',
      kind: 'technique',
      title: 'Healthy network? Trade Latency vs Consistency',
      body: [
        'Networks work fine 99.9% of the time—yet CAP says nothing about normal days. **PACELC** adds the missing half: if **P**artition, pick **A** or **C**; **E**lse, pick **L**atency or **C**onsistency.',
        'Waiting for a cross-region quorum (`EC`) keeps writes consistent at **45 ms**; acknowledging locally (`EL`, `W = 1`) drops latency to **4 ms**, risking brief staleness.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'db-c',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'pacelc-note',
            anchor: { at: { x: 8, y: 10.5 } },
            text: 'PACELC Trade-off',
            tone: 'info',
            icon: 'layers',
            rows: [
              ['Partition (P)', 'A vs C'],
              ['Else normal (E)', 'L vs C'],
              ['PC / EC (Spanner)', 'Strict, slower'],
              ['PA / EL (Dynamo)', 'Fast, eventual'],
            ],
          },
        },
        { op: 'set-metric', id: 'write-ms', value: '45 ms (EC)' },
      ],
      learns: [4],
    },
    {
      id: 'cap-pitfall',
      label: 'Sloppy math',
      kind: 'watch-out',
      title: 'Watch out: sloppy quorums and overloaded terms',
      body: [
        'Don’t confuse **CAP Consistency** (linearizability: every node reflects the latest write) with **ACID Consistency** (foreign keys and balance rules).',
        'Also watch **sloppy quorums** or tuning `R + W ≤ N` for speed: writing to `W = 1` out of `3` without overlap drops latency to `4 ms`—and silently returns stale data even with zero cable cuts.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Lowering W + R ≤ N or writing to fallback nodes (sloppy quorum) breaks strict freshness in exchange for availability.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'db-w',
          patch: { state: 'hot', badge: 'W=1, R=1!' },
        },
        { op: 'set-metric', id: 'stale', value: 'Stale!', tone: 'bad' },
        { op: 'set-metric', id: 'write-ms', value: '4 ms (EL)' },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Design for partitions and everyday latency',
      body: [
        'Partitions are inevitable, so decide upfront whether a feature fails safe (**CP**) or serves stale (**AP**) during splits—and whether normal traffic pays for quorum freshness (**EC**) or local speed (**EL**).',
      ],
      ops: [
        { op: 'remove-note', id: 'pacelc-note' },
        {
          op: 'update-node',
          id: 'db-w',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'cap-summary',
            anchor: { at: { x: 8, y: 10.5 } },
            text: 'Consistency Toolkit',
            tone: 'good',
            icon: 'check',
            rows: [
              ['Partition split', 'CP (fail) or AP (stale)'],
              ['Session UX', 'Read-your-writes token'],
              ['Quorum rule', 'R + W > N (e.g. 2+2 > 3)'],
              ['Normal days', 'PACELC: Latency vs Cons.'],
            ],
          },
        },
        { op: 'set-metric', id: 'stale', value: '0%', tone: 'good' },
        { op: 'set-metric', id: 'write-ms', value: '45 ms', tone: 'normal' },
      ],
      takeaways: [
        'Network partitions are unavoidable; CAP means choosing Consistency (CP) or Availability (AP) during a split',
        'Strong consistency gives linearizable single-copy reads; eventual consistency converges asynchronously',
        'Session guarantees (read-your-writes, monotonic reads) protect user experience without global locks',
        'Quorum overlap (R + W > N) guarantees at least one node in a read holds the newest write',
        'PACELC captures everyday normal-mode trade-offs between Latency (EL) and Consistency (EC)',
      ],
    },
  ],
  checks: [
    {
      id: 'numeric-quorum-read',
      kind: 'numeric',
      prompt:
        'A distributed store replicates every item across N = 5 nodes and uses a write quorum of W = 3. What is the minimum read quorum R needed so every read overlaps the latest write (R + W > N)?',
      unit: 'nodes',
      answer: 3,
      tolerance: 0.05,
      explain:
        'To satisfy R + W > N with N = 5 and W = 3, you need R + 3 > 5, so R must be at least 3.',
      step: 'quorums',
    },
    {
      id: 'choice-cap-partition',
      kind: 'choice',
      prompt:
        'When a network partition cuts a CP system into a majority side and an isolated minority node, what does the minority node do on incoming writes?',
      options: [
        'Rejects the write (returning an error) rather than creating conflicting state',
        'Accepts the write locally and broadcasts it when healed',
        'Automatically doubles its replication factor N',
      ],
      answer: 0,
      explain:
        'A CP system preserves linearizable consistency by refusing operations that cannot reach a consistent quorum during a partition.',
      step: 'cp-vs-ap',
    },
    {
      id: 'choice-pacelc-else',
      kind: 'choice',
      prompt:
        'What trade-off does the "ELC" half of PACELC highlight that the original CAP theorem omits?',
      options: [
        'During normal operation with no partition (Else), systems still trade lower Latency against stronger Consistency',
        'During an outage, systems trade Encryption against Compression',
        'Even numbers of replicas always outperform odd numbers',
      ],
      answer: 0,
      explain:
        'Most of the time there is no partition; PACELC notes you still decide whether to wait for replicas (EC) or reply fast locally (EL).',
      step: 'pacelc',
    },
    {
      id: 'order-quorum-read',
      kind: 'order',
      prompt:
        'Order the lifecycle of a quorum write followed by a fresh quorum read (N = 3, W = 2, R = 2).',
      items: [
        'Coordinator sends write v4 to all 3 replicas',
        'Write completes once W = 2 replicas persist v4',
        'Reader queries R = 2 replicas and receives their versions',
        'Reader returns v4 because at least one queried replica overlaps the write quorum',
      ],
      explain:
        'With R + W > N (2 + 2 > 3), any 2-node read set shares at least 1 node with the 2-node write set, exposing version v4.',
      step: 'quorums',
    },
  ],
  cards: [
    {
      front:
        'Why can’t a distributed system "choose C and A and drop P" in CAP?',
      back: 'Network partitions (P) happen due to hardware or link failures. You can only choose how to react when a partition hits: preserve consistency (CP) or stay available (AP).',
    },
    {
      front:
        'State the quorum overlap rule and give a standard 3-node setting.',
      back: 'R + W > N guarantees a read quorum overlaps the latest write quorum. Standard 3-node setting: N = 3, W = 2, R = 2 (tolerates 1 node failure).',
    },
    {
      front: 'What are read-your-writes and monotonic reads?',
      back: 'Session guarantees: read-your-writes ensures a user always sees updates they just made; monotonic reads ensures subsequent reads never return an older version than previously seen.',
    },
    {
      front: 'What does PACELC stand for?',
      back: 'If there is a Partition (P), trade Availability (A) vs Consistency (C); Else (E), trade Latency (L) vs Consistency (C).',
    },
  ],
} satisfies Lesson;
