import type { Cheatsheet } from '../../model/cheatsheet';

/**
 * Module 03 (Data & Storage) cheatsheet: database families, the isolation
 * anomalies matrix, partitioning strategies and quorum maths.
 */
export const cheatsheet = {
  module: 'data',
  intro:
    'Which kind of database fits which access pattern, what each isolation level lets slip through, and how data is split across machines.',
  sections: [
    {
      kind: 'table',
      title: 'Database Families',
      columns: ['Family', 'Data shape', 'Strong at', 'Weak at', 'Examples'],
      rows: [
        [
          'Relational',
          'Rows in tables with a schema and joins',
          'Transactions, integrity, ad-hoc queries',
          'Scaling writes past one primary',
          'PostgreSQL, MySQL',
        ],
        [
          'Document',
          'Nested JSON-like documents',
          'Reading a whole aggregate by id; flexible fields',
          'Joins and transactions across documents',
          'MongoDB, Couchbase',
        ],
        [
          'Key-value',
          'An opaque value per key',
          'Sub-millisecond gets and puts; sessions, caches',
          'Any query that is not by key',
          'Redis, DynamoDB',
        ],
        [
          'Wide-column',
          'Rows grouped by partition key, sorted by clustering key',
          'Very high write volume; time-ordered data',
          'Ad-hoc queries: tables are designed per query',
          'Cassandra, HBase, Bigtable',
        ],
        [
          'Graph',
          'Nodes and edges with properties',
          'Multi-hop relationship queries',
          'Bulk analytics; sharding a dense graph',
          'Neo4j, Amazon Neptune',
        ],
        [
          'Search engine',
          'Inverted index over documents',
          'Full-text search, facets, relevance ranking',
          'Being the source of truth',
          'Elasticsearch, OpenSearch',
        ],
      ],
    },
    {
      kind: 'table',
      title: 'Isolation Levels vs Anomalies',
      columns: [
        'Isolation level',
        'Dirty read',
        'Non-repeatable read',
        'Phantom',
        'Lost update',
        'Write skew',
      ],
      rows: [
        [
          'Read uncommitted',
          'Possible',
          'Possible',
          'Possible',
          'Possible',
          'Possible',
        ],
        [
          'Read committed',
          'Prevented',
          'Possible',
          'Possible',
          'Possible',
          'Possible',
        ],
        [
          'Repeatable read (lock-based)',
          'Prevented',
          'Prevented',
          'Possible',
          'Prevented',
          'Possible',
        ],
        [
          'Snapshot isolation',
          'Prevented',
          'Prevented',
          'Prevented for reads',
          'Prevented (first committer wins)',
          'Possible',
        ],
        [
          'Serializable',
          'Prevented',
          'Prevented',
          'Prevented',
          'Prevented',
          'Prevented',
        ],
      ],
    },
    {
      kind: 'table',
      title: 'Anomalies in One Line',
      columns: ['Anomaly', 'What goes wrong'],
      rows: [
        ['Dirty read', 'You read another transaction’s uncommitted change.'],
        [
          'Non-repeatable read',
          'The same row reads differently twice in one transaction.',
        ],
        [
          'Phantom',
          'A repeated range query returns rows that were not there before.',
        ],
        [
          'Lost update',
          'Two read-modify-write cycles race and one overwrites the other.',
        ],
        [
          'Write skew',
          'Two transactions each check a rule, write different rows, and together break it.',
        ],
      ],
    },
    {
      kind: 'list',
      title: 'Know Your Defaults',
      items: [
        'PostgreSQL defaults to read committed; its “repeatable read” is snapshot isolation.',
        'MySQL InnoDB defaults to repeatable read with snapshot reads; plain read-modify-write can still lose updates without SELECT … FOR UPDATE.',
        'SQL Server and Oracle default to read committed.',
        'Serializable costs retries: be ready to re-run transactions that abort.',
      ],
    },
    {
      kind: 'table',
      title: 'Partitioning Strategies',
      columns: ['Strategy', 'Key → partition', 'Good at', 'Bad at'],
      rows: [
        [
          'Range',
          'Contiguous key ranges per partition',
          'Range scans and ordered reads',
          'Hot spots when keys arrive in order (timestamps)',
        ],
        [
          'Hash (mod N)',
          'hash(key) mod N',
          'Spreading load evenly',
          'Range scans; changing N moves almost every key',
        ],
        [
          'Consistent hashing',
          'Nearest node clockwise on a hash ring, with virtual nodes',
          'Adding a node moves only about 1/N of keys',
          'Range scans; more moving parts',
        ],
        [
          'Directory',
          'A lookup table maps each key or tenant to a partition',
          'Moving single tenants; flexible placement',
          'The directory is a dependency on every request',
        ],
        [
          'Geographic or tenant',
          'Region or customer id picks the partition',
          'Data residency and isolation',
          'Tenants of very different sizes',
        ],
      ],
    },
    {
      kind: 'numbers',
      title: 'Replication & Quorum Maths',
      rows: [
        [
          'Overlap rule',
          'R + W > N',
          'Every read quorum meets the latest write',
        ],
        ['Typical setting', 'N = 3, W = 2, R = 2', 'Survives one replica down'],
        ['Fast writes', 'N = 3, W = 1, R = 3', 'Reads pay to stay consistent'],
        [
          'Majority for consensus',
          '⌊N / 2⌋ + 1',
          '5 nodes tolerate 2 failures',
        ],
      ],
    },
    {
      kind: 'pattern',
      title: 'Read Replicas with Read-Your-Writes',
      when: 'Reads outgrow one database, but users expect to see their own changes right away.',
      how: 'Send reads to asynchronous replicas, and route a user’s reads to the leader for a short window after they write (or wait until the replica has caught up).',
      watch:
        'Replica lag grows under load; monitor it and stop routing to replicas that fall too far behind.',
      lesson: 'replication',
    },
    {
      kind: 'pattern',
      title: 'Index for the Query',
      when: 'A frequent query scans millions of rows to return a handful.',
      how: 'Build a composite index whose leading columns match the equality filters, then the range or sort column; include selected columns to make it covering.',
      watch: 'Every index slows writes and takes space; drop unused ones.',
      lesson: 'indexes',
    },
    {
      kind: 'pattern',
      title: 'Optimistic Concurrency',
      when: 'Two users edit the same record and one silently overwrites the other.',
      how: 'Keep a version column and write with UPDATE … WHERE id = ? AND version = ?; zero rows updated means someone else won, so reload and retry.',
      watch:
        'Under heavy contention, retries pile up; use a lock or a queue instead.',
      lesson: 'transactions',
    },
  ],
} satisfies Cheatsheet;
