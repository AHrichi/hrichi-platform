import type { Cheatsheet } from '../../model/cheatsheet';

/**
 * Module 02 (Scaling) cheatsheet: load-balancing algorithms, cache
 * strategies, hit-ratio maths and the patterns that keep a tier scalable.
 */
export const cheatsheet = {
  module: 'scaling',
  intro:
    'How traffic is spread across servers, how caches are filled and kept fresh, and the habits that let a tier grow by adding machines.',
  sections: [
    {
      kind: 'table',
      title: 'Load-Balancing Algorithms',
      columns: ['Algorithm', 'How it picks', 'Best for', 'Watch out'],
      rows: [
        [
          'Round robin',
          'The next server in a fixed rotation',
          'Identical servers, short and similar requests',
          'Ignores how busy each server is',
        ],
        [
          'Weighted round robin',
          'Rotation skewed by a capacity weight',
          'A pool mixing large and small instances',
          'Weights go stale when capacity changes',
        ],
        [
          'Least connections',
          'The server with the fewest open connections',
          'Long or uneven work: uploads, WebSockets',
          'The balancer must track every connection',
        ],
        [
          'Least response time',
          'Lowest recent latency, weighted by load',
          'Backends with different speeds',
          'Traffic can stampede onto a server that just got fast',
        ],
        [
          'Power of two choices',
          'Sample two servers at random, take the less loaded',
          'Many balancers, each with a partial view',
          'Slightly less even than a perfect global choice',
        ],
        [
          'Hash (IP or key)',
          'hash(client or key) picks the server',
          'Sticky sessions, per-key cache locality',
          'Hot keys overload one server; resizing reshuffles',
        ],
      ],
    },
    {
      kind: 'table',
      title: 'Cache Strategies',
      columns: ['Strategy', 'On read', 'On write', 'Trade-off'],
      rows: [
        [
          'Cache-aside',
          'App checks the cache; on a miss it reads the DB and fills the cache',
          'App writes the DB, then deletes the key',
          'Simple and common; a short stale window, cold misses',
        ],
        [
          'Read-through',
          'The cache loads from the DB itself on a miss',
          'Usually paired with write-through or invalidation',
          'Less app code; the cache needs a loader',
        ],
        [
          'Write-through',
          'Reads find a warm cache',
          'Write the cache and the DB in the same request',
          'Slower writes; caches rows nobody reads',
        ],
        [
          'Write-back',
          'Reads find a warm cache',
          'Write the cache now, flush to the DB later in batches',
          'Fast writes; unflushed data is lost if the cache dies',
        ],
        [
          'Write-around',
          'Misses load from the DB',
          'Write the DB only, skip the cache',
          'No churn from write-once data; fresh writes miss once',
        ],
        [
          'Refresh-ahead',
          'Hot keys are reloaded shortly before they expire',
          'Same as cache-aside',
          'Wasted loads when the guess about hot keys is wrong',
        ],
      ],
    },
    {
      kind: 'numbers',
      title: 'Hit-Ratio Maths',
      rows: [
        [
          'Average read latency',
          'h × t(cache) + (1 − h) × t(DB)',
          'h is the hit ratio',
        ],
        [
          '90% hits, 1 ms cache, 20 ms DB',
          '0.9 + 2.0 = 2.9 ms',
          'Misses dominate the average',
        ],
        ['DB reads left at 90% hits', '10% of all reads', '10× less DB load'],
        [
          'DB reads left at 99% hits',
          '1% of all reads',
          'Another 10× less: each nine matters',
        ],
        [
          'Eviction policy default',
          'LRU (least recently used)',
          'LFU suits stable popularity',
        ],
      ],
    },
    {
      kind: 'pattern',
      title: 'Stampede Protection',
      when: 'A hot key expires and hundreds of requests miss at once, all hitting the database.',
      how: 'Coalesce misses so one request reloads the key while the rest wait (single-flight), add random jitter to TTLs, and serve the stale value while it refreshes.',
      watch:
        'A reload lock needs a lease timeout, or a crashed holder blocks the key forever.',
      lesson: 'caching',
    },
    {
      kind: 'pattern',
      title: 'Stateless App Tier',
      when: 'Users lose their session whenever a server restarts or the balancer sends them elsewhere.',
      how: 'Move session state to a shared store or into signed tokens, so any instance can serve any request and instances can be added or removed freely.',
      watch:
        'The shared session store is now a dependency: replicate it and give it a timeout.',
      lesson: 'stateless-services',
    },
    {
      kind: 'pattern',
      title: 'Edge Caching for Static Assets',
      when: 'Far-away users wait on long round trips for images, scripts and styles that rarely change.',
      how: 'Serve them from a CDN with long Cache-Control lifetimes and content-hashed file names; add an origin shield so edge misses share one origin fetch.',
      watch:
        'Purges take time to spread; versioned URLs are safer than purging.',
      lesson: 'cdn',
    },
    {
      kind: 'pattern',
      title: 'Autoscaling with Headroom',
      when: 'Daily traffic swings, and fixed capacity is either wasted at night or overloaded at peak.',
      how: 'Scale on a leading metric (CPU, queue depth or RPS per instance) with a target below saturation, a minimum floor, and a cooldown between changes.',
      watch:
        'New instances take minutes to warm up, and the database behind them does not scale the same way.',
      lesson: 'autoscaling',
    },
  ],
} satisfies Cheatsheet;
