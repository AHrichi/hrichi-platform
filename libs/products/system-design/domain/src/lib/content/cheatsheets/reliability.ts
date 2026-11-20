import type { Cheatsheet } from '../../model/cheatsheet';

/**
 * Module 05 (Reliability) cheatsheet: failure patterns and their remedies,
 * circuit-breaker states, rate limiters, backoff and recovery targets.
 */
export const cheatsheet = {
  module: 'reliability',
  intro:
    'The ways distributed systems usually fail, the remedy for each, and the numbers behind retries and recovery.',
  sections: [
    {
      kind: 'table',
      title: 'Failure Patterns & Remedies',
      columns: ['Failure', 'What you see', 'Remedy'],
      rows: [
        [
          'Single point of failure',
          'One machine or zone down means a full outage',
          'Redundant copies across zones, with health checks and failover',
        ],
        [
          'Slow dependency',
          'Threads and connections pile up; everything slows',
          'A timeout on every remote call, set from a request budget',
        ],
        [
          'Retry storm',
          'Load multiplies just as a service struggles',
          'Exponential backoff with jitter and a retry budget',
        ],
        [
          'Cascading failure',
          'One failing service drags its callers down',
          'Circuit breakers and fallbacks',
        ],
        [
          'Resource starvation',
          'One noisy workload exhausts a shared pool',
          'Bulkheads: separate pools, queues or instances',
        ],
        [
          'Overload',
          'Latency climbs, then nearly every request times out',
          'Load shedding and rate limits; 429 or 503 with Retry-After',
        ],
        [
          'Thundering herd',
          'Clients reconnect in sync after a blip',
          'Jittered reconnects and request coalescing',
        ],
        [
          'Split brain',
          'Two nodes both act as the leader',
          'Majority quorum and fencing tokens',
        ],
        [
          'Silent failure',
          'Users notice before the team does',
          'SLO-based alerts on RED metrics and traces',
        ],
      ],
    },
    {
      kind: 'table',
      title: 'Circuit Breaker States',
      columns: ['State', 'Calls', 'Moves on when'],
      rows: [
        [
          'Closed',
          'Pass through; failures are counted',
          'The failure rate crosses a threshold → Open',
        ],
        [
          'Open',
          'Fail fast and use the fallback',
          'A cool-down passes → Half-open',
        ],
        [
          'Half-open',
          'A few trial calls go through',
          'They succeed → Closed; they fail → Open',
        ],
      ],
    },
    {
      kind: 'table',
      title: 'Rate-Limiting Algorithms',
      columns: ['Algorithm', 'Idea', 'Trade-off'],
      rows: [
        [
          'Fixed window',
          'Count requests per clock window',
          'Allows a 2× burst across a window edge',
        ],
        [
          'Sliding window log',
          'Keep a timestamp per request',
          'Exact, but memory grows with traffic',
        ],
        [
          'Sliding window counter',
          'Blend the current and previous window counts',
          'Close to exact with two counters',
        ],
        [
          'Token bucket',
          'Tokens refill at a rate; each request spends one',
          'Allows bursts up to the bucket size',
        ],
        [
          'Leaky bucket',
          'Requests drain from a queue at a fixed rate',
          'Smooth output; bursts wait or drop',
        ],
      ],
    },
    {
      kind: 'numbers',
      title: 'Backoff & Recovery Numbers',
      rows: [
        [
          'Exponential backoff',
          'min(cap, base × 2ⁿ)',
          '100 ms → 200 → 400 → 800 ms',
        ],
        [
          'Full jitter',
          'random(0, backoff)',
          'Spreads retries so clients do not sync',
        ],
        [
          'Retries multiply',
          '3 tries at each of 3 layers = 27 calls',
          'Retry at one layer only',
        ],
        [
          'RPO',
          'How much data you may lose',
          'Set by backup and replication lag',
        ],
        ['RTO', 'How long recovery may take', 'Set by detection plus failover'],
      ],
    },
    {
      kind: 'table',
      title: 'Golden Signals',
      columns: ['Method', 'Signals', 'Use for'],
      rows: [
        ['RED', 'Rate, Errors, Duration', 'Request-driven services'],
        [
          'USE',
          'Utilisation, Saturation, Errors',
          'Resources: CPU, disks, pools',
        ],
      ],
    },
    {
      kind: 'pattern',
      title: 'Active-Passive Failover',
      when: 'A whole machine, zone or data centre can disappear without warning.',
      how: 'Run a replicated standby in another zone, detect failure with health checks, and promote the standby while clients follow a stable name.',
      watch:
        'Failover you never test does not work; rehearse it and measure the real RTO.',
      lesson: 'redundancy-failover',
    },
    {
      kind: 'pattern',
      title: 'Timeout Budgets',
      when: 'A request fans out to several services, and one slow hop makes the whole page time out.',
      how: 'Give the request an overall deadline, pass the remaining time downstream, and set each call’s timeout just above that dependency’s p99.',
      watch:
        'A retry must fit in what is left of the budget, or it only adds load.',
      lesson: 'timeouts-retries',
    },
    {
      kind: 'pattern',
      title: 'Token Bucket at the Edge',
      when: 'A single client or script floods an endpoint and starves everyone else.',
      how: 'Keep a token bucket per API key or IP in a shared counter store, reject over-limit requests with 429 and a Retry-After header.',
      watch:
        'Limit by the right identity: one office NAT can put many users behind one IP.',
      lesson: 'rate-limiting',
    },
    {
      kind: 'pattern',
      title: 'Breakers with Fallbacks',
      when: 'An optional dependency fails and takes a critical path down with it.',
      how: 'Wrap the call in a circuit breaker with its own small pool, and return a cached or default answer while it is open.',
      watch:
        'A fallback that hits the same broken dependency is not a fallback.',
      lesson: 'circuit-breakers',
    },
  ],
} satisfies Cheatsheet;
