import type {
  CourseModule,
  Level,
  LessonMeta,
  ModuleId,
} from '../model/course';
import type { Hue } from '../model/scene';
import { pendingLesson } from './lessons/pending';

/**
 * The course, in order. Only metadata lives here; each lesson body is a lazy
 * chunk reached through `load`.
 *
 * To add a written lesson (docs/system-design/lesson-authoring.md):
 *   1. write `lessons/<module>/<id>.ts` exporting `lesson`;
 *   2. replace its `soon(...)` below with `ready(..., () => import('./lessons/<module>/<id>').then((m) => m.lesson))`.
 */

type Row = [
  id: string,
  title: string,
  level: Level,
  minutes: number,
  summary: string,
  keywords: readonly string[],
];

const L: Record<string, Level> = {
  B: 'beginner',
  I: 'intermediate',
  A: 'advanced',
};

function soon(
  module: ModuleId,
  [id, title, level, minutes, summary, keywords]: Row,
): LessonMeta {
  return {
    id,
    module,
    title,
    summary,
    level,
    minutes,
    keywords,
    ready: false,
    load: () => Promise.resolve(pendingLesson(id, title)),
  };
}

/** A written lesson. Kept for P6 onwards. */
export function ready(
  module: ModuleId,
  row: Row,
  load: LessonMeta['load'],
): LessonMeta {
  return { ...soon(module, row), ready: true, load };
}

function mod(
  id: ModuleId,
  number: number,
  title: string,
  hue: Hue,
  rows: readonly Row[],
): CourseModule {
  return { id, number, title, hue, lessons: rows.map((r) => soon(id, r)) };
}

export const CURRICULUM: readonly CourseModule[] = [
  mod('foundations', 1, 'Foundations', 'neutral', [
    [
      'request-journey',
      'One Request, End to End',
      L['B'],
      11,
      'Follow one page load from a tap to a rendered page, and see where the time goes.',
      ['dns', 'tcp', 'tls', 'http', 'latency', 'round trip'],
    ],
    [
      'latency-throughput',
      'Latency vs Throughput',
      L['B'],
      9,
      'Why a fast service can still be slow under load, and how to read percentiles.',
      [
        'latency',
        'throughput',
        'p99',
        'percentile',
        'utilization',
        'little’s law',
      ],
    ],
    [
      'napkin-math',
      'Back-of-the-Envelope Math',
      L['B'],
      12,
      'Turn users into requests, bytes and machines with quick, honest estimates.',
      ['estimation', 'rps', 'storage', 'bandwidth', 'dau', 'capacity'],
    ],
    [
      'availability',
      'Availability & the Nines',
      L['B'],
      9,
      'What 99.9% really allows, and how dependencies and redundancy change it.',
      ['availability', 'nines', 'sla', 'slo', 'error budget', 'downtime'],
    ],
  ]),
  mod('scaling', 2, 'Scaling', 'blue', [
    [
      'scale-up-out',
      'Scale Up or Scale Out',
      L['B'],
      9,
      'Bigger machines or more machines: the limits and costs of each.',
      ['vertical', 'horizontal', 'scaling', 'spof', 'capacity'],
    ],
    [
      'load-balancing',
      'Load Balancing',
      L['B'],
      11,
      'Spread traffic across servers, route around failures, and avoid a new bottleneck.',
      [
        'load balancer',
        'round robin',
        'least connections',
        'health check',
        'l4',
        'l7',
        'sticky sessions',
      ],
    ],
    [
      'stateless-services',
      'Stateless Services',
      L['I'],
      9,
      'Move state out of the server so any instance can answer any request.',
      ['stateless', 'session', 'token', 'jwt', 'redis'],
    ],
    [
      'caching',
      'Caching',
      L['I'],
      12,
      'Serve repeat reads from memory, and keep cached data honest.',
      [
        'cache',
        'ttl',
        'hit ratio',
        'invalidation',
        'write-through',
        'stampede',
        'lru',
      ],
    ],
    [
      'cdn',
      'Content Delivery Networks',
      L['B'],
      9,
      'Put content near users so distance stops costing round trips.',
      ['cdn', 'edge', 'pop', 'cache-control', 'origin', 'purge'],
    ],
    [
      'autoscaling',
      'Autoscaling',
      L['I'],
      9,
      'Add and remove servers with the traffic, without flapping or lag.',
      ['autoscaling', 'metrics', 'cooldown', 'warm-up', 'scheduled scaling'],
    ],
  ]),
  mod('data', 3, 'Data & Storage', 'violet', [
    [
      'sql-vs-nosql',
      'SQL vs NoSQL',
      L['B'],
      11,
      'Match the data model to the access pattern, not to the fashion.',
      [
        'sql',
        'nosql',
        'relational',
        'document',
        'key-value',
        'acid',
        'polyglot',
      ],
    ],
    [
      'indexes',
      'Indexes',
      L['I'],
      10,
      'Turn a full table scan into a few page reads, and know what it costs writes.',
      ['index', 'b-tree', 'composite index', 'covering index', 'query plan'],
    ],
    [
      'storage-engines',
      'Storage Engines',
      L['A'],
      12,
      'B-trees and LSM trees: how databases lay data on disk, and why it matters.',
      ['b-tree', 'lsm', 'wal', 'sstable', 'compaction', 'bloom filter'],
    ],
    [
      'replication',
      'Replication',
      L['I'],
      11,
      'Copy data to more machines for reads and safety, and live with lag.',
      ['replication', 'leader', 'follower', 'replica', 'lag', 'failover'],
    ],
    [
      'sharding',
      'Sharding',
      L['I'],
      11,
      'Split data across machines when one can no longer hold the writes.',
      [
        'sharding',
        'partitioning',
        'hash',
        'range',
        'hot partition',
        'resharding',
      ],
    ],
    [
      'consistent-hashing',
      'Consistent Hashing',
      L['A'],
      10,
      'Add or remove nodes and move only a small share of the keys.',
      ['consistent hashing', 'hash ring', 'virtual nodes', 'rebalancing'],
    ],
    [
      'unique-ids',
      'Unique IDs at Scale',
      L['I'],
      9,
      'Generate ids on many machines without collisions or a single counter.',
      ['uuid', 'ulid', 'snowflake', 'id generation', 'clock skew'],
    ],
    [
      'cap-consistency',
      'CAP & Consistency',
      L['A'],
      12,
      'When the network splits, choose between answering and being right.',
      [
        'cap',
        'consistency',
        'eventual consistency',
        'quorum',
        'pacelc',
        'partition',
      ],
    ],
    [
      'consensus',
      'Consensus & Leader Election',
      L['A'],
      12,
      'How a group of machines agrees on one leader and one history.',
      [
        'consensus',
        'raft',
        'leader election',
        'quorum',
        'split brain',
        'fencing',
      ],
    ],
    [
      'transactions',
      'Transactions & Isolation',
      L['A'],
      12,
      'Keep concurrent writes correct: anomalies, isolation levels and locking.',
      ['transaction', 'acid', 'isolation', 'mvcc', 'lost update', 'write skew'],
    ],
    [
      'blob-storage',
      'Files, Blobs & Media',
      L['I'],
      10,
      'Store and serve large files without putting them in the database.',
      [
        'object storage',
        'blob',
        'pre-signed url',
        'multipart',
        'transcoding',
        'media',
      ],
    ],
  ]),
  mod('communication', 4, 'Communication', 'teal', [
    [
      'api-styles',
      'REST, RPC & GraphQL',
      L['B'],
      11,
      'Three ways for services to talk, and when each one fits.',
      ['rest', 'rpc', 'grpc', 'graphql', 'api', 'pagination', 'idempotency'],
    ],
    [
      'api-gateway',
      'API Gateways',
      L['I'],
      9,
      'One front door for many services: routing, auth and limits at the edge.',
      ['api gateway', 'bff', 'routing', 'tls termination', 'edge'],
    ],
    [
      'message-queues',
      'Message Queues',
      L['I'],
      11,
      'Hand slow work to a queue so users stop waiting for it.',
      [
        'queue',
        'worker',
        'async',
        'at-least-once',
        'dead letter',
        'backpressure',
      ],
    ],
    [
      'pub-sub',
      'Pub/Sub & Event Streams',
      L['I'],
      11,
      'Publish one event and let every interested service react to it.',
      ['pub/sub', 'event', 'topic', 'kafka', 'consumer group', 'offset'],
    ],
    [
      'realtime',
      'Polling, SSE & WebSockets',
      L['I'],
      10,
      'Push live updates to users, from polling to open connections.',
      ['polling', 'long polling', 'sse', 'websocket', 'realtime', 'presence'],
    ],
  ]),
  mod('reliability', 5, 'Reliability', 'rose', [
    [
      'redundancy-failover',
      'Redundancy & Failover',
      L['I'],
      10,
      'Remove single points of failure and recover fast when parts break.',
      [
        'redundancy',
        'failover',
        'active-passive',
        'active-active',
        'rpo',
        'rto',
      ],
    ],
    [
      'rate-limiting',
      'Rate Limiting',
      L['I'],
      11,
      'Protect a service from floods with fair, predictable limits.',
      ['rate limiting', 'token bucket', 'sliding window', '429', 'throttling'],
    ],
    [
      'timeouts-retries',
      'Timeouts, Retries & Backoff',
      L['I'],
      10,
      'Fail fast, retry carefully, and never turn a blip into a storm.',
      [
        'timeout',
        'retry',
        'backoff',
        'jitter',
        'idempotency key',
        'retry storm',
      ],
    ],
    [
      'circuit-breakers',
      'Circuit Breakers & Bulkheads',
      L['A'],
      10,
      'Stop one failing dependency from taking everything else down.',
      [
        'circuit breaker',
        'bulkhead',
        'fallback',
        'cascading failure',
        'load shedding',
      ],
    ],
    [
      'observability',
      'Logs, Metrics & Traces',
      L['I'],
      10,
      'See inside a running system: what is slow, where, and why.',
      ['observability', 'logs', 'metrics', 'tracing', 'slo', 'alerting'],
    ],
  ]),
  mod('architecture', 6, 'Architecture', 'amber', [
    [
      'monolith-microservices',
      'Monolith vs Microservices',
      L['I'],
      11,
      'When to split a system into services, and what the split costs.',
      [
        'monolith',
        'microservices',
        'modular monolith',
        'service boundaries',
        'domain',
      ],
    ],
    [
      'service-discovery',
      'Service Discovery',
      L['A'],
      9,
      'Find healthy instances that come and go without hard-coded addresses.',
      [
        'service discovery',
        'registry',
        'heartbeat',
        'dns',
        'service mesh',
        'sidecar',
      ],
    ],
    [
      'sagas',
      'Sagas & Distributed Transactions',
      L['A'],
      12,
      'Keep a multi-service business action consistent without one big transaction.',
      [
        'saga',
        'two-phase commit',
        'compensation',
        'orchestration',
        'choreography',
        'outbox',
      ],
    ],
    [
      'batch-stream',
      'Batch vs Stream Processing',
      L['I'],
      10,
      'Process data in big scheduled runs or continuously as it arrives.',
      ['batch', 'stream', 'window', 'event time', 'late data', 'exactly-once'],
    ],
  ]),
  mod('security', 7, 'Security', 'green', [
    [
      'authentication',
      'Authentication',
      L['B'],
      10,
      'Prove who a user is once, then keep them signed in safely.',
      [
        'authentication',
        'password hashing',
        'session',
        'jwt',
        'oauth',
        'oidc',
        'mfa',
      ],
    ],
    [
      'authorization',
      'Authorization',
      L['I'],
      9,
      'Decide what a signed-in user may do, on the server, every time.',
      ['authorization', 'rbac', 'abac', 'permissions', 'least privilege'],
    ],
    [
      'encryption-secrets',
      'Encryption & Secrets',
      L['I'],
      10,
      'Protect data in transit and at rest, and keep keys out of code.',
      ['encryption', 'tls', 'kms', 'secrets', 'rotation', 'hashing'],
    ],
  ]),
  mod('shipping', 8, 'Shipping', 'teal', [
    [
      'testing-at-scale',
      'Testing Distributed Systems',
      L['I'],
      10,
      'Catch the failures that only appear when services meet.',
      ['testing', 'contract tests', 'integration', 'load testing', 'chaos'],
    ],
    [
      'cicd',
      'CI/CD & Safe Deploys',
      L['I'],
      10,
      'Ship often without breaking things: pipelines, flags and canaries.',
      [
        'ci/cd',
        'feature flags',
        'blue-green',
        'canary',
        'rollback',
        'migrations',
      ],
    ],
  ]),
  mod('case-studies', 9, 'Case Studies', 'violet', [
    [
      'design-method',
      'A Method for Design Problems',
      L['B'],
      10,
      'A repeatable way to go from a vague prompt to a defended design.',
      ['method', 'requirements', 'estimates', 'hld', 'lld', 'interview'],
    ],
    [
      'design-url-shortener',
      'Design a URL Shortener',
      L['I'],
      14,
      'Short keys, fast redirects and click counts for 100 million links a month.',
      ['url shortener', 'base62', 'key generation', 'redirect', 'analytics'],
    ],
    [
      'design-news-feed',
      'Design a News Feed',
      L['A'],
      15,
      'Fresh, ranked posts for millions of followers without melting the database.',
      ['news feed', 'fan-out', 'timeline', 'ranking', 'feed cache'],
    ],
    [
      'design-chat',
      'Design a Chat System',
      L['A'],
      15,
      'One-to-one and group messages, delivered in order, online or offline.',
      ['chat', 'websocket', 'messages', 'ordering', 'presence', 'push'],
    ],
  ]),
];

/** Every lesson meta, in course order. */
export const ALL_LESSONS: readonly LessonMeta[] = CURRICULUM.flatMap(
  (m) => m.lessons,
);

export function findLesson(id: string): LessonMeta | undefined {
  return ALL_LESSONS.find((l) => l.id === id);
}
