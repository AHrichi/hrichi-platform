import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 03.09: Consensus & Leader Election (`consensus`).
 * Scenario: Two nodes both think they lead (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'consensus',
  learn: [
    'Why two active leaders cause split-brain data corruption',
    'Why consensus requires a majority quorum (⌊N / 2⌋ + 1)',
    'How Raft terms and vote requests elect a single leader',
    'How Raft commits log entries safely across a majority',
    'Why storage systems need fencing tokens against zombies',
  ],
  scene: {
    nodes: [
      {
        id: 'client',
        kind: 'client',
        at: { x: 1, y: 3 },
        label: 'Order API',
        sublabel: 'Writer',
      },
      {
        id: 'n1',
        kind: 'server',
        at: { x: 6, y: 3 },
        label: 'Node 1',
        sublabel: 'Term 1',
        state: 'hot',
        badge: 'Leader?',
      },
      {
        id: 'n2',
        kind: 'server',
        at: { x: 10, y: 3 },
        label: 'Node 2',
        sublabel: 'Term 1',
        state: 'hot',
        badge: 'Leader?',
      },
      {
        id: 'n3',
        kind: 'server',
        at: { x: 11, y: 6 },
        label: 'Node 3',
        sublabel: 'Follower',
      },
      {
        id: 'n4',
        kind: 'server',
        at: { x: 8, y: 7 },
        label: 'Node 4',
        sublabel: 'Follower',
      },
      {
        id: 'n5',
        kind: 'server',
        at: { x: 5, y: 6 },
        label: 'Node 5',
        sublabel: 'Follower',
      },
    ],
    edges: [
      { id: 'client-n1', from: 'client', to: 'n1', label: 'write A' },
      {
        id: 'n1-n2',
        from: 'n1',
        to: 'n2',
        label: 'heartbeat?',
        style: 'dashed',
      },
      { id: 'n1-n5', from: 'n1', to: 'n5', label: 'RPC' },
      { id: 'n2-n3', from: 'n2', to: 'n3', label: 'RPC' },
      { id: 'n2-n4', from: 'n2', to: 'n4', label: 'RPC' },
    ],
    zones: [
      {
        id: 'cluster-zone',
        from: { x: 4, y: 0 },
        to: { x: 12, y: 8 },
        hue: 'violet',
        label: 'Raft cluster (N = 5)',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'term', label: 'Term', icon: 'hash', value: 'Term 1' },
    { id: 'leaders', label: 'Leaders', icon: 'warning', value: '2' },
    { id: 'quorum', label: 'Quorum', icon: 'check', value: '—' },
    { id: 'committed', label: 'Log index', icon: 'database', value: '#41' },
  ],
  steps: [
    {
      id: 'split-brain',
      label: 'Split brain',
      kind: 'problem',
      title: 'Two nodes both claim the leader crown',
      body: [
        'Heartbeats between **Node 1** and **Node 2** drop during a switch glitch. Thinking Node 1 crashed, Node 2 promotes itself—while Node 1 is still alive serving clients.',
        'Now _both_ nodes accept conflicting writes as **split-brain** leaders, silently corrupting order history.',
      ],
      ops: [
        {
          op: 'update-edge',
          id: 'n1-n2',
          patch: { state: 'broken', label: 'timeout' },
        },
        {
          op: 'packet',
          edge: 'client-n1',
          kind: 'write',
          label: 'x = 10',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'n2-n3',
          kind: 'write',
          label: 'x = 99!',
          wave: 0,
        },
        { op: 'set-metric', id: 'leaders', value: '2', tone: 'bad' },
      ],
    },
    {
      id: 'majority-quorum',
      label: 'Majority rule',
      kind: 'technique',
      title: 'Only a strict majority can elect or commit',
      body: [
        'To prevent two winners, require a **majority quorum** of `⌊N / 2⌋ + 1` nodes for every decision. In a **5-node** cluster, quorum is **3**.',
        'Two disjoint halves of a split cannot _both_ reach `3` nodes (`3 + 3 = 6 > 5`). That is why clusters use odd sizes (`3, 5, 7`): a 2-node pair has no split-safe majority.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Every majority quorum overlaps every other majority quorum by at least one node.',
        },
      ],
      changes: [{ type: 'changed', text: 'Quorum set to 3 of 5 nodes' }],
      ops: [
        {
          op: 'update-node',
          id: 'n1',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'n2',
          patch: { state: 'normal', badge: null },
        },
        { op: 'set-metric', id: 'quorum', value: '3 / 5', tone: 'good' },
      ],
      learns: [0, 1],
    },
    {
      id: 'terms',
      label: 'Terms',
      kind: 'technique',
      title: 'Monotonic terms replace untrusted wall clocks',
      body: [
        'Distributed machines cannot rely on synchronized clocks to know whose crown is newer. Raft numbers leadership eras using logical **terms** (`1, 2, 3…`).',
        'Every message carries its sender’s term. Any node receiving a higher term immediately updates its clock and steps down to **Follower**, and each node casts at most **one vote per term**.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'n2',
          patch: { state: 'focus', sublabel: 'Term 2 · Candidate' },
        },
        { op: 'set-metric', id: 'term', value: 'Term 2' },
      ],
    },
    {
      id: 'raft-election',
      label: 'Election',
      kind: 'technique',
      title: 'Timeout, bump term, and win majority votes',
      body: [
        'Each follower runs a **randomized election timer** (`150–300 ms`) so peers don’t tie. Node 2 times out first, bumps to **Term 2**, votes for itself, and sends `RequestVote`.',
        'Node 3 and Node 4 grant their votes—giving **3 / 5**. Node 2 becomes the sole **Leader** and sends periodic **heartbeats** to keep followers calm.',
      ],
      changes: [
        { type: 'changed', text: 'Node 2 elected sole Leader in Term 2' },
        { type: 'added', text: 'Client routed to Node 2' },
      ],
      ops: [
        {
          op: 'update-edge',
          id: 'n1-n2',
          patch: { state: 'normal', label: 'Term 2 HB' },
        },
        {
          op: 'packet',
          edge: 'n2-n3',
          kind: 'handshake',
          label: 'RequestVote',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'n2-n4',
          kind: 'handshake',
          label: 'RequestVote',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'n2-n3',
          kind: 'response',
          reverse: true,
          label: 'Vote',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'n2-n4',
          kind: 'response',
          reverse: true,
          label: 'Vote',
          wave: 1,
        },
        {
          op: 'update-node',
          id: 'n1',
          patch: { sublabel: 'Term 2 · Follower' },
        },
        {
          op: 'update-node',
          id: 'n2',
          patch: {
            state: 'focus',
            sublabel: 'Term 2 · Leader',
            badge: 'Leader',
          },
        },
        { op: 'remove-edge', id: 'client-n1' },
        {
          op: 'add-edge',
          edge: {
            id: 'client-n2',
            from: 'client',
            to: 'n2',
            label: 'writes',
            route: 'elbow-y',
          },
        },
        { op: 'set-metric', id: 'leaders', value: '1', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'log-commit',
      label: 'Log commit',
      kind: 'technique',
      title: 'Replicate to a majority before committing',
      body: [
        'When `Order API` sends write `#42`, Leader Node 2 appends `#42` to its local log and replicates `AppendEntries` to followers.',
        'Once **3 of 5** nodes persist `#42` on disk, Node 2 marks it **committed**, applies it to state, and acknowledges the client. Future leaders must hold all committed entries.',
      ],
      changes: [
        { type: 'changed', text: 'Log entry #42 committed across 3/5 nodes' },
      ],
      ops: [
        {
          op: 'packet',
          edge: 'client-n2',
          kind: 'write',
          label: 'entry #42',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'n2-n3',
          kind: 'write',
          label: 'Append #42',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'n2-n4',
          kind: 'write',
          label: 'Append #42',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'client-n2',
          kind: 'response',
          reverse: true,
          label: 'Committed',
          wave: 2,
        },
        {
          op: 'update-node',
          id: 'n3',
          patch: { state: 'focus', sublabel: 'log #42' },
        },
        {
          op: 'update-node',
          id: 'n4',
          patch: { state: 'focus', sublabel: 'log #42' },
        },
        { op: 'set-metric', id: 'committed', value: '#42', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'minority-partition',
      label: 'Partition',
      kind: 'case',
      title: 'An isolated minority stalls cleanly, never forks',
      body: [
        'Now cut off `{Node 1, Node 5}` (2 nodes) from `{Node 2, Node 3, Node 4}` (3 nodes). Neither Node 1 nor Node 5 can gather 3 votes or commit entries—they safely stall.',
        'Meanwhile, the 3-node majority keeps serving writes (`#43`), proving safety even during an asymmetric split.',
      ],
      ops: [
        {
          op: 'update-edge',
          id: 'n1-n2',
          patch: { state: 'broken', label: 'split' },
        },
        {
          op: 'update-node',
          id: 'n1',
          patch: { state: 'dim', badge: '2/5 minority' },
        },
        {
          op: 'update-node',
          id: 'n5',
          patch: { state: 'dim', badge: 'stalled' },
        },
        {
          op: 'packet',
          edge: 'n2-n3',
          kind: 'write',
          label: 'entry #43',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'n2-n4',
          kind: 'write',
          label: 'entry #43',
          wave: 0,
        },
        { op: 'set-metric', id: 'committed', value: '#43', tone: 'good' },
      ],
    },
    {
      id: 'zombie-leader',
      label: 'Zombie trap',
      kind: 'watch-out',
      title: 'A paused ex-leader wakes up and overwrites data',
      body: [
        'Suppose old leader **Node 1** froze for 10 seconds in a stop-the-world GC pause. While paused, the cluster elected **Node 2** in **Term 2**.',
        'Node 1 wakes up believing it still holds the leadership lease and fires a stale write directly into **Shared Store**—bypassing the cluster!',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Time-based leader leases are unsafe alone: a paused process can wake up after its lease expired and send a stale write.',
        },
      ],
      changes: [
        {
          type: 'added',
          text: 'Shared Store receiving zombie write from Node 1',
        },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'store',
            kind: 'database',
            at: { x: 1, y: 8 },
            label: 'Shared Store',
            sublabel: 'max token: #1',
            state: 'hot',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'n1-store',
            from: 'n1',
            to: 'store',
            label: 'stale write!',
            route: 'straight',
          },
        },
        {
          op: 'update-node',
          id: 'n1',
          patch: { state: 'hot', badge: 'GC zombie' },
        },
        {
          op: 'packet',
          edge: 'n1-store',
          kind: 'error',
          label: 'old write!',
          wave: 0,
        },
      ],
    },
    {
      id: 'fencing-tokens',
      label: 'Fencing tokens',
      kind: 'technique',
      title: 'Guard downstream storage with fencing tokens',
      body: [
        'Every time the consensus cluster elects a leader, it issues a strictly increasing **fencing token** (`#1`, `#2`, `#3`…). Node 2 receives token **`#2`** and includes it on writes.',
        'When **Shared Store** stores `max_token = #2`, any late packet from zombie Node 1 carrying token **`#1`** is rejected cleanly.',
      ],
      changes: [
        { type: 'added', text: 'Fenced write path from Node 2 (token #2)' },
        { type: 'changed', text: 'Shared Store rejects stale token #1' },
      ],
      ops: [
        {
          op: 'add-edge',
          edge: {
            id: 'n2-store',
            from: 'n2',
            to: 'store',
            label: 'token #2',
            route: 'elbow-y',
          },
        },
        {
          op: 'update-node',
          id: 'store',
          patch: { state: 'focus', sublabel: 'max token: #2', badge: 'fenced' },
        },
        {
          op: 'update-edge',
          id: 'n1-store',
          patch: { state: 'broken', label: 'token #1 rejected' },
        },
        {
          op: 'packet',
          edge: 'n2-store',
          kind: 'write',
          label: 'token #2 OK',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'n1-store',
          kind: 'error',
          label: '#1 < #2!',
          wave: 1,
        },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'One leader per term, fenced end to end',
      body: [
        'Consensus protocols like **Raft** combine **majority quorums**, **logical terms**, and **replicated logs** so a cluster never forks—and **fencing tokens** carry that safety to downstream storage.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'n1',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'n3',
          patch: { state: 'normal', sublabel: 'Follower' },
        },
        {
          op: 'update-node',
          id: 'n4',
          patch: { state: 'normal', sublabel: 'Follower' },
        },
        {
          op: 'update-node',
          id: 'n5',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'store',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'raft-summary',
            anchor: { at: { x: 6.5, y: 11.2 } },
            text: 'Raft Consensus Rules',
            tone: 'good',
            icon: 'shield',
            rows: [
              ['Majority quorum', '⌊N / 2⌋ + 1'],
              ['Tie breaker', 'Random timer jitter'],
              ['Commit rule', 'Majority persisted'],
              ['Zombie defence', 'Fencing token'],
            ],
          },
        },
      ],
      takeaways: [
        'Split brain occurs when two leaders accept conflicting writes during missed heartbeats',
        'A majority quorum (⌊N / 2⌋ + 1) guarantees any two quorums overlap on at least one node',
        'Raft uses monotonic terms, randomized election timers, and majority log commits to keep one history',
        'Downstream storage needs monotonic fencing tokens to reject stale writes from paused zombie leaders',
      ],
    },
  ],
  checks: [
    {
      id: 'numeric-raft-quorum',
      kind: 'numeric',
      prompt:
        'A Raft cluster has N = 7 nodes so it can survive multiple machine failures. What is the minimum majority quorum needed to elect a leader or commit a log entry?',
      unit: 'nodes',
      answer: 4,
      tolerance: 0.05,
      explain: 'Majority quorum is ⌊7 / 2⌋ + 1 = 3 + 1 = 4 nodes.',
      step: 'majority-quorum',
    },
    {
      id: 'order-raft-flow',
      kind: 'order',
      prompt:
        'Order the steps of a Raft leader election and log commit from timeout to client acknowledgment.',
      items: [
        'Follower election timer expires without receiving a heartbeat',
        'Candidate bumps its term, votes for itself, and sends RequestVote RPCs',
        'Candidate wins a majority of votes and starts sending leader heartbeats',
        'Leader replicates a new entry to a majority before marking it committed',
      ],
      explain:
        'An election triggers on heartbeat timeout, requires bumping the term and gathering majority votes, and then the leader commits entries once replicated to a majority.',
      step: 'log-commit',
    },
    {
      id: 'choice-fencing-purpose',
      kind: 'choice',
      prompt:
        'Why do consensus lock services attach an incrementing fencing token to every leadership lease?',
      options: [
        'So downstream storage can reject late writes from a paused old leader holding a smaller token',
        'To encrypt network packets between followers during an election',
        'To speed up garbage collection pauses on the leader',
      ],
      answer: 0,
      explain:
        'If an old leader freezes during GC and wakes up late, downstream storage checks the monotonic token and drops any write with a smaller token than already seen.',
      step: 'fencing-tokens',
    },
    {
      id: 'choice-odd-cluster',
      kind: 'choice',
      prompt:
        'Why do production consensus clusters normally run 3 or 5 nodes instead of 4 nodes?',
      options: [
        'A 4-node cluster still needs 3 votes for a majority, so it tolerates only 1 failure—the same as 3 nodes',
        'Even numbers of nodes cannot run randomized timers',
        'Raft rejects any configuration with an even node count at startup',
      ],
      answer: 0,
      explain:
        '⌊4 / 2⌋ + 1 = 3, leaving only 1 node of fault tolerance (4 − 3 = 1), identical to a cheaper 3-node cluster.',
      step: 'majority-quorum',
    },
  ],
  cards: [
    {
      front: 'What is split brain and how do consensus protocols prevent it?',
      back: 'Split brain happens when two nodes both believe they are leader and accept conflicting writes. Consensus prevents it by requiring a strict majority quorum (⌊N / 2⌋ + 1) and monotonic terms.',
    },
    {
      front: 'Why does Raft use randomized election timeouts?',
      back: 'If followers time out simultaneously, they split votes and tie. Jittered timeouts (e.g. 150–300 ms) let one candidate ask for votes and win a majority first.',
    },
    {
      front: 'When is a Raft log entry safe to mark committed?',
      back: 'Once the leader for the current term has replicated that entry onto a majority quorum of nodes.',
    },
    {
      front: 'What problem does a fencing token solve?',
      back: 'It prevents a paused "zombie" leader that wakes up with an expired lease from corrupting downstream storage, because storage rejects any token smaller than the highest token already seen.',
    },
  ],
} satisfies Lesson;
