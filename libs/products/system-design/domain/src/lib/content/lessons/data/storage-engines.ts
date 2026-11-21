import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 03.03: Storage Engines (`storage-engines`).
 * Scenario: A write-heavy log store (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'storage-engines',
  learn: [
    'How B-tree pages and a WAL support in-place disk writes',
    'How LSM trees buffer writes in a memtable and SSTables',
    'How compaction and bloom filters keep LSM reads fast',
    'How read, write, and space amplification trade off',
  ],
  scene: {
    nodes: [
      {
        id: 'ingestor',
        kind: 'service',
        at: { x: 1, y: 4 },
        label: 'Log collector',
        sublabel: '60k writes/s',
      },
      {
        id: 'wal',
        kind: 'queue',
        at: { x: 5, y: 2 },
        label: 'WAL',
        sublabel: 'Sequential log',
      },
      {
        id: 'btree-pages',
        kind: 'database',
        at: { x: 9, y: 4 },
        label: 'B-tree pages',
        sublabel: '8 KB in-place',
        load: 0.96,
        state: 'hot',
      },
    ],
    edges: [
      {
        id: 'in-wal',
        from: 'ingestor',
        to: 'wal',
        label: 'append',
        style: 'dashed',
      },
      {
        id: 'in-btree',
        from: 'ingestor',
        to: 'btree-pages',
        label: 'random 8 KB',
      },
    ],
    zones: [
      {
        id: 'engine-zone',
        from: { x: 4, y: 0 },
        to: { x: 12, y: 8 },
        hue: 'amber',
        label: 'Storage engine',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'write-tput', label: 'Write rate', icon: 'bolt', value: '8k/s cap' },
    { id: 'write-amp', label: 'Write amp', icon: 'layers', value: '12x' },
    { id: 'read-p99', label: 'Point read', icon: 'timer', value: '2 ms' },
  ],
  steps: [
    {
      id: 'write-storm',
      label: 'Write storm',
      kind: 'problem',
      title: 'Random B-tree page writes choke a log store',
      body: [
        'Your observability pipeline receives **60,000 log entries per second** keyed by random request IDs. A classic B-tree engine stalls at **8,000/s**.',
        'Inserting a 200-byte log row dirties an entire **8 KB disk page** in a random location, forcing the SSD to rewrite whole blocks over and over.',
      ],
      ops: [
        {
          op: 'packet',
          edge: 'in-btree',
          kind: 'write',
          count: 4,
          label: 'Random I/O',
          wave: 0,
        },
        {
          op: 'set-metric',
          id: 'write-tput',
          value: '8k/s stall',
          tone: 'bad',
        },
        { op: 'set-metric', id: 'write-amp', value: '12x', tone: 'bad' },
      ],
    },
    {
      id: 'btree-wal',
      label: 'B-tree + WAL',
      kind: 'technique',
      title: 'B-trees update fixed pages guarded by a WAL',
      body: [
        'Traditional engines (Postgres, InnoDB) lay B-tree nodes on fixed **4–16 KB pages**. To survive crashes mid-page split, every edit first appends sequentially to a **WAL** (_Write-Ahead Log_).',
        'Reads follow one sorted tree cleanly in **~2 ms**, but modifying scattered keys triggers heavy **write amplification** as entire pages flush and split.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Write amplification = bytes written to physical storage divided by logical bytes written by the app.',
        },
      ],
      ops: [
        { op: 'update-node', id: 'wal', patch: { state: 'focus' } },
        { op: 'packet', edge: 'in-wal', kind: 'write', label: 'WAL', wave: 0 },
        {
          op: 'packet',
          edge: 'in-btree',
          kind: 'write',
          label: '8 KB page',
          wave: 1,
        },
      ],
      learns: [0],
    },
    {
      id: 'lsm-memtable',
      label: 'Memtable',
      kind: 'technique',
      title: 'LSM trees buffer writes in a sorted memtable',
      body: [
        'Switch to an **LSM tree** (_Log-Structured Merge-tree_, used by RocksDB and Cassandra). Writes append to the crash-safe WAL and go straight into an in-memory sorted tree called the **memtable**.',
        'Because nothing touches random disk pages during the write path, ingestion leaps to **60,000/s** with minimal I/O.',
      ],
      changes: [
        { type: 'removed', text: 'Random in-place B-tree page rewrites' },
        { type: 'added', text: 'In-memory sorted memtable buffer' },
      ],
      ops: [
        { op: 'remove-node', id: 'btree-pages' },
        { op: 'update-node', id: 'wal', patch: { state: 'normal' } },
        {
          op: 'add-node',
          node: {
            id: 'memtable',
            kind: 'cache',
            at: { x: 5, y: 5 },
            label: 'Memtable',
            sublabel: 'Sorted RAM · 64 MB',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'in-mem',
            from: 'ingestor',
            to: 'memtable',
            label: 'RAM',
          },
        },
        {
          op: 'packet',
          edge: 'in-wal',
          kind: 'write',
          label: 'WAL',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'in-mem',
          kind: 'write',
          count: 3,
          label: '60k/s',
          wave: 0,
        },
        { op: 'set-metric', id: 'write-tput', value: '60k/s', tone: 'good' },
        { op: 'set-metric', id: 'write-amp', value: '2x', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'sstables',
      label: 'SSTables',
      kind: 'technique',
      title: 'Full memtables flush sequentially as SSTables',
      body: [
        'When the memtable hits **64 MB**, it freezes and streams sequentially to disk as an immutable **SSTable** (_Sorted String Table_).',
        'Because SSTables never mutate, overwrites and deletes simply write newer timestamped entries or _tombstone_ markers into the next memtable—keeping all disk writes strictly sequential.',
      ],
      changes: [{ type: 'added', text: 'Immutable L0 SSTables on disk' }],
      ops: [
        { op: 'update-node', id: 'memtable', patch: { state: 'normal' } },
        {
          op: 'add-node',
          node: {
            id: 'sstable-l0',
            kind: 'storage',
            at: { x: 9, y: 3 },
            label: 'SSTables L0',
            sublabel: 'Immutable sorted',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'mem-l0',
            from: 'memtable',
            to: 'sstable-l0',
            label: 'seq flush',
          },
        },
        {
          op: 'packet',
          edge: 'mem-l0',
          kind: 'write',
          label: '64 MB flush',
          wave: 0,
        },
      ],
      learns: [1],
    },
    {
      id: 'compaction',
      label: 'Compaction',
      kind: 'technique',
      title: 'Compaction merges SSTables and prunes old keys',
      body: [
        'Over hours, dozens of overlapping `L0` SSTables pile up—slowing reads and wasting disk on overwritten keys and tombstones.',
        'Background **compaction** merge-sorts `L0` files into larger, non-overlapping levels (`L1`, `L2`), discarding stale versions so space stays bounded and range scans stay tidy.',
      ],
      changes: [{ type: 'added', text: 'Compacted L1+ SSTable tier' }],
      ops: [
        { op: 'update-node', id: 'sstable-l0', patch: { state: 'normal' } },
        {
          op: 'add-node',
          node: {
            id: 'sstable-l1',
            kind: 'storage',
            at: { x: 11, y: 6 },
            label: 'SSTables L1+',
            sublabel: 'Non-overlapping',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'l0-l1',
            from: 'sstable-l0',
            to: 'sstable-l1',
            label: 'compact',
            style: 'dashed',
          },
        },
        {
          op: 'packet',
          edge: 'l0-l1',
          kind: 'write',
          label: 'merge-sort',
          wave: 0,
        },
        { op: 'set-metric', id: 'write-amp', value: '4x' },
        { op: 'set-metric', id: 'read-p99', value: '8 ms' },
      ],
      learns: [2],
    },
    {
      id: 'bloom-filters',
      label: 'Bloom filter',
      kind: 'technique',
      title: 'Bloom filters skip checking empty SSTables',
      body: [
        'Searching for a missing trace ID could check the memtable plus ten SSTable files (`high read amplification`).',
        'Each SSTable keeps a tiny in-memory **Bloom filter** bit array: it tells readers _"definitely not in this file"_ with zero false negatives, skipping 99% of wasted disk reads.',
      ],
      changes: [
        { type: 'added', text: 'In-memory Bloom filter index per SSTable' },
      ],
      ops: [
        { op: 'update-node', id: 'sstable-l1', patch: { state: 'normal' } },
        {
          op: 'add-node',
          node: {
            id: 'bloom',
            kind: 'search',
            at: { x: 9, y: 7 },
            label: 'Bloom filters',
            sublabel: 'O(1) skip check',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'l0-bloom',
            from: 'sstable-l0',
            to: 'bloom',
            label: 'bitset',
            style: 'dashed',
          },
        },
        {
          op: 'packet',
          edge: 'l0-bloom',
          kind: 'request',
          label: '99% skip',
          wave: 0,
        },
        { op: 'set-metric', id: 'read-p99', value: '3 ms', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'amplification-tradeoff',
      label: 'Amplification',
      kind: 'case',
      title: 'Read, write, and space amplification trade off',
      body: [
        'No engine wins every axis (**RUM conjecture**):\n• **B-trees** minimise **read amplification** (1 tree lookup, predictable reads) and waste less temporary space, at higher random **write amplification**.',
        '• **LSM trees** minimise foreground **write amplification** via sequential flushes and pack rows tightly, paying background compaction I/O and higher point-read checks.',
      ],
      ops: [
        { op: 'update-node', id: 'bloom', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'memtable',
          patch: { state: 'focus', badge: 'fast write' },
        },
        {
          op: 'packet',
          edge: 'in-mem',
          kind: 'write',
          count: 3,
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'l0-l1',
          kind: 'write',
          wave: 1,
        },
      ],
      learns: [3],
    },
    {
      id: 'compaction-stall',
      label: 'Watch out',
      kind: 'watch-out',
      title: 'Compaction storms can stall LSM writes',
      body: [
        'LSM writes are only fast while background compaction keeps pace. During a sustained burst, `L0` files accumulate faster than compaction can merge them.',
        'To prevent read latency and disk space from blowing up, the engine throttles or halts new writes—triggering sudden **p99 write stalls**.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Monitor compaction lag and SSD headroom: LSM engines need spare disk space and IOPS for background merges.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'memtable',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'sstable-l0',
          patch: { state: 'hot', badge: 'L0 backlog' },
        },
        {
          op: 'packet',
          edge: 'in-mem',
          kind: 'error',
          reverse: true,
          label: 'write stall',
          wave: 0,
        },
        { op: 'set-metric', id: 'write-tput', value: 'throttled', tone: 'bad' },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'B-trees favour reads; LSM trees favour writes',
      body: [
        'Storage layout decides whether disks do small random overwrites or large sequential merges. Match B-trees to balanced OLTP reads and LSM trees to write-heavy logs, time series, and streams.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'sstable-l0',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'engine-compare',
            anchor: { at: { x: 7.5, y: -0.5 } },
            text: 'B-tree vs LSM-tree',
            tone: 'info',
            icon: 'layers',
            rows: [
              ['B-tree', 'Random 8 KB page'],
              ['LSM', 'WAL + memtable'],
              ['LSM read', 'Bloom + cache'],
              ['Write fit', 'LSM (logs/events)'],
            ],
          },
        },
        { op: 'set-metric', id: 'write-tput', value: '60k/s', tone: 'good' },
      ],
      takeaways: [
        'B-trees store data in mutable fixed-size disk pages protected by a sequential WAL',
        'LSM trees append writes to a WAL + sorted memtable, flushing sequentially to immutable SSTables',
        'Background compaction merges SSTables and removes overwritten keys and tombstones',
        'Bloom filters skip checking SSTables that definitely lack a key, cutting LSM read amplification',
      ],
    },
  ],
  checks: [
    {
      id: 'order-lsm-write-path',
      kind: 'order',
      prompt:
        'Put the stages of an LSM-tree key lifecycle in the order they happen.',
      items: [
        'Append write to sequential WAL and insert into in-memory memtable',
        'Flush full memtable sequentially to an immutable L0 SSTable on disk',
        'Compact overlapping SSTables into sorted deeper levels (L1, L2)',
      ],
      explain:
        'Writes hit the WAL and memtable first, flush into immutable L0 SSTables, and later merge during background compaction.',
      step: 'compaction',
    },
    {
      id: 'choice-bloom-filter',
      kind: 'choice',
      prompt:
        'How does an in-memory Bloom filter speed up point lookups in an LSM-tree database?',
      options: [
        'It guarantees when a key is definitely NOT in an SSTable, avoiding wasted disk reads',
        'It replaces the WAL during crash recovery',
        'It guarantees zero false positives while sorting keys in place',
      ],
      answer: 0,
      explain:
        'A Bloom filter never produces a false negative ("definitely absent" is 100% certain), letting readers skip checking irrelevant SSTables on disk.',
      step: 'bloom-filters',
    },
    {
      id: 'choice-write-amp',
      kind: 'choice',
      prompt:
        'Why do LSM trees handle random-key heavy write workloads faster than B-trees on SSDs?',
      options: [
        'They convert random updates into in-memory inserts and sequential SSTable flushes instead of rewriting scattered 8 KB pages',
        'They skip writing a WAL to disk completely',
        'They never merge or delete old records on disk',
      ],
      answer: 0,
      explain:
        'Sequential appends avoid in-place random page rewrites and page splits on the foreground write path.',
      step: 'lsm-memtable',
    },
    {
      id: 'choice-compaction-stall',
      kind: 'choice',
      prompt:
        'What happens when sustained write bursts outpace an LSM engine’s background compaction?',
      options: [
        'L0 SSTables pile up, read latency climbs, and the engine throttles new writes (write stalls)',
        'The engine converts itself into a graph database automatically',
        'Bloom filters start deleting uncommitted transactions',
      ],
      answer: 0,
      explain:
        'Unbounded L0 buildup degrades reads and exhausts disk; LSM engines apply backpressure by stalling incoming writes until compaction catches up.',
      step: 'compaction-stall',
    },
    {
      id: 'numeric-memtable-flush',
      kind: 'numeric',
      prompt:
        'An LSM memtable flushes to disk once it reaches 64 MB. If an application sustains 16 MB/s of sequential writes, every how many seconds does a new L0 SSTable flush?',
      unit: 'seconds',
      answer: 4,
      tolerance: 0.05,
      explain:
        '64 MB ÷ 16 MB/s = 4 seconds between sequential L0 SSTable flushes.',
      step: 'sstables',
    },
  ],
  cards: [
    {
      front:
        'How does a B-tree storage engine make in-place page edits crash-safe?',
      back: 'Every change appends sequentially to a Write-Ahead Log (WAL) before modifying fixed-size B-tree pages on disk.',
    },
    {
      front: 'Name the three core components of an LSM-tree storage engine.',
      back: '1. Memtable (sorted in-memory write buffer + WAL)\n2. Immutable SSTables flushed sequentially to disk\n3. Background compaction merging SSTables across levels',
    },
    {
      front:
        'What question can a Bloom filter answer with 100% certainty, and what can it not?',
      back: 'It is 100% certain when a key is NOT in an SSTable (zero false negatives), but "maybe present" can have a small false-positive rate.',
    },
    {
      front:
        'Compare read vs write amplification between B-trees and LSM trees.',
      back: 'B-trees have low read amplification (one tree lookup) and higher random write amplification; LSM trees have lower foreground write amplification (sequential flushes) and rely on compaction + Bloom filters to control read/space amplification.',
    },
  ],
} satisfies Lesson;
