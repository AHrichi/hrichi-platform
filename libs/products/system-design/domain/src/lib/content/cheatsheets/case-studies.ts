import type { Cheatsheet } from '../../model/cheatsheet';

/**
 * Module 09 (Case studies) cheatsheet: the design method as a checklist, an
 * estimate template with a worked example, and the core idea of each classic.
 */
export const cheatsheet = {
  module: 'case-studies',
  intro:
    'A repeatable way to work through any design prompt, a fill-in estimate template, and the key move in each classic problem.',
  sections: [
    {
      kind: 'table',
      title: 'The Method Checklist',
      columns: ['Step', 'Ask yourself', 'Time (of 45 min)'],
      rows: [
        [
          '1. Functional requirements',
          'Who uses it, and which 3–5 features matter most? What is out of scope?',
          '~5 min',
        ],
        [
          '2. Non-functional requirements',
          'How many users, what latency, availability, consistency and durability?',
          '~3 min',
        ],
        [
          '3. Estimates',
          'Requests per second, storage per year, bandwidth, read:write ratio',
          '~5 min',
        ],
        [
          '4. API',
          'Which endpoints or events, with what inputs and outputs?',
          '~5 min',
        ],
        [
          '5. Data model',
          'Which entities and keys, which access patterns, which store?',
          '~5 min',
        ],
        [
          '6. High-level design',
          'Boxes and arrows for the main read and write paths',
          '~10 min',
        ],
        [
          '7. Deep dives',
          'Bottlenecks, hot keys, failure modes, the hardest part at scale',
          '~10 min',
        ],
        [
          '8. Wrap-up',
          'Which trade-offs did you make, and what would you do next?',
          '~2 min',
        ],
      ],
    },
    {
      kind: 'table',
      title: 'Estimate Template',
      columns: [
        'Quantity',
        'Formula',
        'Worked example: 100M new links a month',
      ],
      rows: [
        [
          'Average writes / s',
          'writes per month ÷ 2.6M s',
          '100M ÷ 2.6M ≈ 40 / s',
        ],
        ['Peak writes / s', 'average × 2–3', '≈ 100 / s'],
        [
          'Average reads / s',
          'writes / s × read:write ratio',
          '100:1 → ≈ 4,000 / s',
        ],
        [
          'Storage per year',
          'writes per year × bytes per record',
          '1.2B × 500 B ≈ 600 GB',
        ],
        [
          'Read bandwidth',
          'reads / s × response size',
          '4,000 × 500 B ≈ 2 MB/s',
        ],
        [
          'Cache size',
          '~20% of a day’s reads × record size',
          '0.2 × 345M × 500 B ≈ 35 GB',
        ],
        [
          'Key space',
          '62ᴸ keys for a base62 key of length L',
          '62⁷ ≈ 3.5 × 10¹² keys: ~2,900 years at 1.2B a year',
        ],
      ],
    },
    {
      kind: 'numbers',
      title: 'Handy Constants',
      rows: [
        ['Seconds per day', '86,400 ≈ 10⁵', 'Round to divide fast'],
        ['Seconds per month', '≈ 2.6 × 10⁶', '30 days'],
        ['Seconds per year', '≈ 3.15 × 10⁷', 'About π × 10⁷'],
        ['1M requests per day', '≈ 12 / s', 'Average, before the peak factor'],
        ['UUID', '16 bytes binary', '36 characters as text'],
        ['Timestamp', '8 bytes', 'A 64-bit integer'],
      ],
    },
    {
      kind: 'table',
      title: 'Classic Problems at a Glance',
      columns: ['Problem', 'The crux', 'Key move'],
      rows: [
        [
          'URL shortener',
          'Unique short keys and a very hot read path',
          'Pre-allocated id ranges encoded in base62; cache redirects; count clicks through a queue',
        ],
        [
          'News feed',
          'Posts from accounts with millions of followers',
          'Fan-out on write for most accounts, fan-out on read for the biggest; cursor pagination',
        ],
        [
          'Chat',
          'Ordered delivery to online and offline devices',
          'WebSocket gateways, a partition per conversation with sequence ids, push for offline users',
        ],
      ],
    },
    {
      kind: 'pattern',
      title: 'Requirements Before Boxes',
      when: 'A vague prompt tempts you to start drawing servers straight away.',
      how: 'Agree the features and the scale first, then let the numbers pick the design: they decide where caches, queues and partitions go.',
      watch: 'Ten unasked features waste the time you need for one deep dive.',
      lesson: 'design-method',
    },
    {
      kind: 'pattern',
      title: 'Key Generation without Collisions',
      when: 'Many app servers must hand out short, unique codes at the same time.',
      how: 'A key service gives each server a block of counter values to encode in base62, so servers never coordinate per request.',
      watch:
        'Sequential codes are guessable; shuffle or salt them if links are private.',
      lesson: 'design-url-shortener',
    },
    {
      kind: 'pattern',
      title: 'Hybrid Fan-Out',
      when: 'Pushing every post into every follower’s feed explodes for a celebrity account.',
      how: 'Precompute feeds on write for normal accounts, and merge posts from the few huge accounts at read time.',
      watch:
        'Inactive followers do not need precomputed feeds; build theirs on demand.',
      lesson: 'design-news-feed',
    },
    {
      kind: 'pattern',
      title: 'Per-Conversation Ordering',
      when: 'Messages in a group chat arrive in different orders on different devices.',
      how: 'Route each conversation to one partition, stamp messages with an increasing sequence id there, and have clients sort and de-duplicate by it.',
      watch:
        'One huge group becomes a hot partition; cap group size or split its fan-out.',
      lesson: 'design-chat',
    },
  ],
} satisfies Cheatsheet;
