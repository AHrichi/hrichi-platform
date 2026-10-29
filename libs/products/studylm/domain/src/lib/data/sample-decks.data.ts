import type { StudyOverview } from '../models/synthesis.model';
import type { StudyFlashcard } from '../models/flashcard.model';
import type { StudyQuizQuestion } from '../models/quiz.model';
import type { StudySource } from '../models/source.model';

export interface PreSeededStudyDeck {
  id: string;
  subject: string;
  tagline: string;
  sources: StudySource[];
  overview: StudyOverview;
  flashcards: StudyFlashcard[];
  quiz: StudyQuizQuestion[];
}

export const PRESEEDED_STUDY_DECKS: PreSeededStudyDeck[] = [
  {
    id: 'deck-angular-zoneless',
    subject: 'Angular 19 Zoneless Architecture, Signals & Native Federation',
    tagline: 'Deep dive into zone.js-free rendering, push-based signal graphs, and independent micro-frontend deployment.',
    sources: [
      {
        id: 'src-ang-1',
        title: 'RFC: Zoneless Angular & Fine-Grained Reactivity',
        type: 'document',
        content: `Angular 18+ introduces experimental and official zoneless change detection via provideZonelessChangeDetection(). In traditional Angular, Zone.js monkey-patched browser asynchronous APIs (setTimeout, Promise, addEventListener) to trigger top-down dirty checking across the entire component tree on any macro or micro-task. In zoneless mode, Zone.js is completely excluded, saving ~40KB bundle weight and removing call-stack obfuscation.
Reactivity is driven by Signals (signal, computed, effect). computed() primitives are memoized, pure, and glitch-free: dependencies are dynamically tracked during evaluation. If an upstream signal updates, downstream computed values are marked dirty and only evaluated when read.
Change detection notifications in zoneless components are triggered by Signal reads in templates, AsyncPipe emissions, component output/event handlers, and explicit ChangeDetectorRef.markForCheck(). Native Federation uses the browser-native Import Maps and ES Modules standard to load remote apps independently without Webpack runtime lock-in.`,
        wordCount: 152,
        addedAt: '2026-10-28T12:00:00.000Z',
        summary: 'Architectural overview of zoneless change detection, signal DAG evaluation, and Native Federation mechanics.',
      },
      {
        id: 'src-ang-2',
        title: 'Production Slide Deck: Scaling Enterprise Signal Architecture',
        type: 'slide',
        content: `Slide 1: The Reactive Primitives
- signal(T): Read-write reactive value.
- computed(() => T): Read-only pure derivation. Dynamic dependency tracking. Glitch-free diamond graph resolution.
- effect(): Side-effect runner. Runs in microtask queue after change detection. Discouraged for state derivation.

Slide 2: Zoneless Component Lifecycle
- Angular schedules rendering via ChangeDetectionScheduler when notifications arrive.
- Avoid writing to signals inside effects: can cause infinite loops or cyclic dependency exceptions.
- Signal Forms (@angular/forms/signals): Type-safe declarative schema validation without FormGroup boilerplate.`,
        wordCount: 96,
        addedAt: '2026-10-28T12:05:00.000Z',
        summary: 'Slides on reactive primitives, scheduling mechanics, and signal forms best practices.',
      },
    ],
    overview: {
      title: 'Angular 19 Zoneless Architecture & Signal Graphs',
      executiveSummary: `Zoneless Angular transforms enterprise web application architecture by decoupling change detection from global monkey-patched browser APIs. By utilizing provideZonelessChangeDetection(), applications eliminate Zone.js runtime overhead, resulting in dramatically simplified stack traces, faster initial load times, and true push-based reactivity.

The reactivity core is governed by a directed acyclic graph (DAG) of Signals. Computed signals use dynamic dependency tracking with glitch-free evaluation, ensuring that intermediate inconsistent states are never observable by consumers or view templates.

At scale, Native Federation extends this architectural purity across distributed micro-frontends, leveraging standard browser Import Maps and ES modules rather than monolithic bundler runtimes.`,
      keyTakeaways: [
        'provideZonelessChangeDetection() strips Zone.js entirely, reducing bundle size and execution latency.',
        'Signals provide glitch-free memoized reactivity with automatic dependency tracking.',
        'effects execute asynchronously in microtasks; state derivations must stay in computed() primitives.',
        'Native Federation enables independent remote deployments via native browser module standards.',
      ],
    },
    flashcards: [
      {
        id: 'fc-ang-b1',
        tier: 'beginner',
        front: 'What does `provideZonelessChangeDetection()` replace in modern Angular applications?',
        back: 'It replaces Zone.js entirely. Instead of monkey-patching browser async APIs to trigger top-down dirty checking, Angular relies on Signals and explicit notifications to schedule rendering.',
        sourceCitation: 'RFC: Zoneless Angular & Fine-Grained Reactivity',
        category: 'Core Architecture',
        masteryCount: 0,
      },
      {
        id: 'fc-ang-b2',
        tier: 'beginner',
        front: 'What is the key difference between `signal()` and `computed()`?',
        back: '`signal(val)` creates a read-write reactive container with `.set()` and `.update()`. `computed(() => expr)` creates a read-only, memoized derived signal that recomputes only when tracked dependencies change.',
        sourceCitation: 'Production Slide Deck: Scaling Enterprise Signal Architecture',
        category: 'Reactivity Primitives',
        masteryCount: 0,
      },
      {
        id: 'fc-ang-i1',
        tier: 'intermediate',
        front: 'Why is setting or updating signals inside an `effect()` strongly discouraged in production?',
        back: 'Setting signals in effects can trigger cascading re-evaluations, cyclic dependency loops, and unnecessary render passes. State derivation should always be modeled with pure `computed()` signals.',
        sourceCitation: 'Production Slide Deck: Scaling Enterprise Signal Architecture',
        category: 'Best Practices',
        masteryCount: 0,
      },
      {
        id: 'fc-ang-i2',
        tier: 'intermediate',
        front: 'How does Native Federation differ from traditional Webpack Module Federation?',
        back: 'Native Federation is bundler-agnostic (works seamlessly with Esbuild, Vite, and Rollup) and uses standard browser Import Maps and ES Modules rather than Webpack-specific runtime glue.',
        sourceCitation: 'RFC: Zoneless Angular & Fine-Grained Reactivity',
        category: 'Micro-Frontends',
        masteryCount: 0,
      },
      {
        id: 'fc-ang-e1',
        tier: 'expert',
        front: 'How does Angular Signals solve the classic "Diamond Dependency Problem" (glitch-free execution)?',
        back: 'By using a two-phase push-pull evaluation algorithm with dynamic versioning. When a root signal changes, it pushes dirty flags down the DAG without evaluating. When a consumer reads a computed value, it pulls and verifies upstream versions, guaranteeing intermediate inconsistent states are never observed.',
        sourceCitation: 'RFC: Zoneless Angular & Fine-Grained Reactivity',
        category: 'Runtime Internals',
        masteryCount: 0,
      },
      {
        id: 'fc-ang-e2',
        tier: 'expert',
        front: 'In a Zoneless application, what mechanism ensures microtask coalescence and prevents render thrashing when 50 signals update in the same turn?',
        back: 'The `ChangeDetectionScheduler` batches multiple notification pulses into a single consolidated microtask queue entry via `scheduler.notify()`, ensuring a single change detection traversal per tick.',
        sourceCitation: 'RFC: Zoneless Angular & Fine-Grained Reactivity',
        category: 'Scheduler Internals',
        masteryCount: 0,
      },
    ],
    quiz: [
      {
        id: 'qz-ang-b1',
        tier: 'beginner',
        question: 'Which provider is required to completely remove zone.js from an Angular 18+ application?',
        options: [
          'provideZonelessChangeDetection()',
          'enableProdMode()',
          'provideZoneFreeCompiler()',
          'provideSignalStore({ zoneless: true })',
        ],
        correctIndex: 0,
        explanation: 'provideZonelessChangeDetection() configures the application injector to use the signal-based ChangeDetectionScheduler without loading zone.js.',
        sourceCitation: 'RFC: Zoneless Angular & Fine-Grained Reactivity',
      },
      {
        id: 'qz-ang-i1',
        tier: 'intermediate',
        question: 'An architect needs to compute a filtered list of orders based on a search query signal and an order list signal. What is the most idiomatic Angular pattern?',
        options: [
          'Use an effect() to listen to both signals and assign the filtered result to a writable signal',
          'Use computed() to derive the filtered list purely and synchronously from both signals',
          'Subscribe to an RxJS Subject in the constructor and call ChangeDetectorRef.detectChanges()',
          'Use setInterval() to re-filter the array every 200 milliseconds',
        ],
        correctIndex: 1,
        explanation: 'computed() guarantees pure, glitch-free, memoized derivation without the cycle risks and timing delays of effects or imperative subscriptions.',
        sourceCitation: 'Production Slide Deck: Scaling Enterprise Signal Architecture',
      },
      {
        id: 'qz-ang-e1',
        tier: 'expert',
        question: 'Under what specific condition will an Angular computed() signal execute its derivation function when a tracked upstream signal changes?',
        options: [
          'Immediately and synchronously at the moment the upstream signal is set',
          'Lazily, only when the computed signal is subsequently read by a template or another active consumer',
          'On the next window requestAnimationFrame tick regardless of reads',
          'Only when the browser window receives a user click event',
        ],
        correctIndex: 1,
        explanation: 'Angular signals use a push-pull reactive algorithm: upstream signals push dirty invalidation flags, but the derivation lambda is only pulled/evaluated when the value is actually accessed.',
        sourceCitation: 'RFC: Zoneless Angular & Fine-Grained Reactivity',
      },
    ],
  },
  {
    id: 'deck-distributed-consensus',
    subject: 'Distributed Consensus: Raft Protocol & Byzantine Fault Tolerance',
    tagline: 'Leader election, log replication, safety invariants, and consensus guarantees across partitioned networks.',
    sources: [
      {
        id: 'src-raft-1',
        title: 'In Search of an Understandable Consensus Algorithm (Ongaro & Ousterhout)',
        type: 'document',
        content: `Raft decomposes consensus into 3 independent subproblems: Leader Election, Log Replication, and Safety.
Nodes exist in one of three states: Follower, Candidate, or Leader. Time is divided into arbitrary terms numbered with consecutive integers.
Election Safety: At most one leader can be elected per term. A candidate must collect votes from a strict majority (quorum: n/2 + 1) of the cluster.
Log Matching: If two logs contain an entry with the same index and term, then the logs are identical in all entries up through the given index.
Leader Completeness: If a log entry is committed in a given term, that entry will be present in the logs of the leaders for all higher-numbered terms.
Byzantine fault tolerance (BFT) addresses malicious or arbitrary node behavior, requiring 3f + 1 nodes to tolerate f faulty nodes, whereas crash-fault-tolerant (CFT) protocols like Raft require 2f + 1 nodes.`,
        wordCount: 148,
        addedAt: '2026-10-28T12:10:00.000Z',
        summary: 'Paper breakdown of Raft states, term numbers, election quorums, log invariants, and BFT differences.',
      },
    ],
    overview: {
      title: 'Distributed Consensus & Fault-Tolerant Replicated State Machines',
      executiveSummary: `Distributed consensus ensures that a cluster of independent computing nodes can agree on a shared state machine ledger even in the presence of unreliable networks, packet delays, and node crashes.

The Raft protocol achieves equivalence with Multi-Paxos while significantly improving understandability through formal decomposition into Leader Election, Log Replication, and Safety Invariants.

Crucially, Raft operates within the Crash-Fault-Tolerant (CFT) model, assuming nodes follow the protocol faithfully until failure. In adversarial environments with malicious actors or message forgery, Byzantine Fault Tolerant (BFT) protocols like PBFT or Tendermint are required, expanding cluster quorum requirements from 2f + 1 to 3f + 1.`,
      keyTakeaways: [
        'Raft separates consensus into Leader Election, Log Replication, and Safety.',
        'Majority quorums (floor(N/2) + 1) ensure any two quorums overlap by at least one node.',
        'Leader Completeness invariant guarantees committed entries are never overwritten.',
        'CFT systems tolerate f crashes with 2f + 1 nodes; BFT systems tolerate f Byzantine nodes with 3f + 1 nodes.',
      ],
    },
    flashcards: [
      {
        id: 'fc-raft-b1',
        tier: 'beginner',
        front: 'What are the three possible states of a Raft node?',
        back: 'Follower (passive, responds to RPCs), Candidate (requests votes during an election), and Leader (handles client requests and coordinates log replication).',
        sourceCitation: 'In Search of an Understandable Consensus Algorithm',
        category: 'Core States',
        masteryCount: 0,
      },
      {
        id: 'fc-raft-b2',
        tier: 'beginner',
        front: 'How many server nodes are needed in a Raft cluster to tolerate 2 simultaneous node crashes?',
        back: '5 nodes. Raft requires 2f + 1 nodes to tolerate f crashes: 2(2) + 1 = 5. A quorum of 3 nodes is needed to elect a leader and commit log entries.',
        sourceCitation: 'In Search of an Understandable Consensus Algorithm',
        category: 'Quorum Math',
        masteryCount: 0,
      },
      {
        id: 'fc-raft-i1',
        tier: 'intermediate',
        front: 'How does Raft prevent split votes from causing an infinite leader election loop?',
        back: 'Raft uses randomized election timeouts (e.g., 150ms–300ms) for each follower. This ensures that one candidate usually times out before others, starting an election and winning majority votes before another can contend.',
        sourceCitation: 'In Search of an Understandable Consensus Algorithm',
        category: 'Election Dynamics',
        masteryCount: 0,
      },
      {
        id: 'fc-raft-i2',
        tier: 'intermediate',
        front: 'When is a log entry officially considered "committed" in Raft?',
        back: 'When the leader that created the entry has replicated it on a majority of cluster nodes in its current term, and that entry has been applied to its local state machine.',
        sourceCitation: 'In Search of an Understandable Consensus Algorithm',
        category: 'Commit Rule',
        masteryCount: 0,
      },
      {
        id: 'fc-raft-e1',
        tier: 'expert',
        front: 'Why can a Raft leader never commit a log entry from a PREVIOUS term solely by counting replicas?',
        back: 'Due to the subtle Log Matching edge case illustrated in Figure 8 of the Raft paper: an entry from an old term replicated on a majority could still be overwritten by a future leader with higher term if that entry was never committed in its original term. A leader must commit an entry from its CURRENT term to safely commit prior entries indirectly.',
        sourceCitation: 'In Search of an Understandable Consensus Algorithm',
        category: 'Safety Invariants',
        masteryCount: 0,
      },
      {
        id: 'fc-raft-e2',
        tier: 'expert',
        front: 'Why does Byzantine Fault Tolerance (BFT) require 3f + 1 nodes to tolerate f faults, whereas Raft only requires 2f + 1?',
        back: 'In CFT, non-responsive nodes are merely crashed (silent). In BFT, f nodes can actively lie, collude, or send conflicting votes (equivocation). To ensure honest nodes (N - f) form a strict majority over faulty nodes plus delayed honest nodes, the equation requires (N - f) - f > f => N > 3f, yielding N = 3f + 1.',
        sourceCitation: 'In Search of an Understandable Consensus Algorithm',
        category: 'Byzantine Theory',
        masteryCount: 0,
      },
    ],
    quiz: [
      {
        id: 'qz-raft-b1',
        tier: 'beginner',
        question: 'In a 7-node Raft cluster, what is the minimum quorum size required to elect a leader or commit entries?',
        options: ['4 nodes', '3 nodes', '5 nodes', '7 nodes'],
        correctIndex: 0,
        explanation: 'Quorum in Raft is floor(N / 2) + 1. For 7 nodes, floor(7/2) + 1 = 3 + 1 = 4 nodes.',
        sourceCitation: 'In Search of an Understandable Consensus Algorithm',
      },
      {
        id: 'qz-raft-i1',
        tier: 'intermediate',
        question: 'What happens to uncommitted log entries on a follower if the leader sends an AppendEntries RPC with a conflicting term at the same index?',
        options: [
          'The follower rejects the RPC and immediately crashes itself',
          'The follower overwrites the conflicting entry and all subsequent entries in its log with the leader entries',
          'The follower stores both versions and merges them with a two-phase commit',
          'The follower forces a new leader election instantly',
        ],
        correctIndex: 1,
        explanation: 'In Raft, the leader log is authoritative. Followers delete uncommitted conflicting entries starting at the divergence index and append the leader entries.',
        sourceCitation: 'In Search of an Understandable Consensus Algorithm',
      },
      {
        id: 'qz-raft-e1',
        tier: 'expert',
        question: 'How does Raft guarantee that a newly elected leader already contains all previously committed log entries?',
        options: [
          'The cluster coordinator transfers all logs to the winner before it starts',
          'Followers vote NO if the candidate log is less up-to-date than their own log (comparing last entry term and length)',
          'The leader queries all followers and pulls missing entries upon election',
          'All committed entries are written to a centralized NFS network drive',
        ],
        correctIndex: 1,
        explanation: 'Raft RequestVote RPC includes the candidate last log term and index. A voter denies its vote if the candidate log is less up-to-date than its own. Because any committed entry is present on a majority of nodes, any winning candidate must have received a vote from at least one node with that entry.',
        sourceCitation: 'In Search of an Understandable Consensus Algorithm',
      },
    ],
  },
];
