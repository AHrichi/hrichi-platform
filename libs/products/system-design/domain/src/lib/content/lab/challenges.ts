import type {
  LabChallenge,
  LabDesign,
  LabKind,
  LabNode,
} from '../../lab/model';

/** Shorthand for authoring designs: `node('server-1', 'server', 2)`. */
export function labNode(
  id: string,
  kind: LabKind,
  instances = 1,
  extra: Partial<Pick<LabNode, 'hitRatio' | 'down'>> = {},
): LabNode {
  return { id, kind, instances, ...extra };
}

/** Shorthand for links: `chain('client', 'server-1', 'database-1')`. */
export function chain(...ids: string[]): LabDesign['links'] {
  return ids.slice(1).map((to, i) => ({ from: ids[i], to }));
}

/** One server and one database: the worked example in technical-design §8. */
const SINGLE_SERVER: LabDesign = {
  nodes: [
    labNode('client', 'client'),
    labNode('server-1', 'server'),
    labNode('database-1', 'database'),
  ],
  links: chain('client', 'server-1', 'database-1'),
};

/** A load balancer in front of two servers sharing one database. */
const TWO_SERVERS: LabDesign = {
  nodes: [
    labNode('client', 'client'),
    labNode('load-balancer-1', 'load-balancer'),
    labNode('server-1', 'server'),
    labNode('server-2', 'server'),
    labNode('database-1', 'database'),
  ],
  links: [
    ...chain('client', 'load-balancer-1', 'server-1', 'database-1'),
    ...chain('load-balancer-1', 'server-2', 'database-1'),
  ],
};

/**
 * The Design Lab's challenges (technical-design §8). Each starter fails;
 * `challenges.spec.ts` records a design that passes each one.
 */
export const LAB_CHALLENGES: readonly LabChallenge[] = [
  {
    id: 'first-users',
    title: 'First users',
    brief:
      'Your app has its first 800 requests a second and one server is sweating. Bring p95 latency under 150 ms without spending more than 10.',
    traffic: { rps: 800, readRatio: 0.8, staticRatio: 0 },
    goals: { maxP95: 150, maxCost: 10 },
    starter: SINGLE_SERVER,
    hint: 'One server at 80% load queues every request. Put a load balancer in front and add a second server to share the work.',
  },
  {
    id: 'launch-day',
    title: 'Launch day',
    brief:
      'A launch brings 6,000 requests a second, nine in ten of them reads. Keep p95 under 120 ms and fail fewer than 0.1% of requests.',
    traffic: { rps: 6_000, readRatio: 0.9, staticRatio: 0 },
    goals: { maxP95: 120, maxErrorRate: 0.001 },
    starter: TWO_SERVERS,
    hint: 'Scale the servers until none runs hot, then put a cache in front of the database so most reads never reach it.',
  },
  {
    id: 'global-images',
    title: 'Global images',
    brief:
      'A photo app serves 20,000 requests a second and seven in ten are images. Serve them all with under 1% errors on a budget of 30.',
    traffic: { rps: 20_000, readRatio: 0.9, staticRatio: 0.7 },
    goals: { maxErrorRate: 0.01, maxCost: 30 },
    starter: TWO_SERVERS,
    hint: 'Servers are an expensive way to send images. A CDN answers static files at the edge for a flat price; size the servers for what is left.',
  },
  {
    id: 'write-storm',
    title: 'Write storm',
    brief:
      'Half of 4,000 requests a second are writes, more than one database can take synchronously. Keep p95 under 100 ms with under 1% errors.',
    traffic: { rps: 4_000, readRatio: 0.5, staticRatio: 0 },
    goals: { maxP95: 100, maxErrorRate: 0.01 },
    starter: TWO_SERVERS,
    hint: 'Let a queue accept writes right away and workers apply them in the background. Give the database room for the writes the workers send, and cache the reads.',
  },
  {
    id: 'no-single-failure',
    title: 'No single failure',
    brief:
      'At 3,000 requests a second, losing any one server or load balancer must not take the site down (under 1% errors).',
    traffic: { rps: 3_000, readRatio: 0.8, staticRatio: 0 },
    goals: {
      maxErrorRate: 0.01,
      survivesAnySingleFailure: ['server', 'load-balancer'],
    },
    starter: {
      nodes: [
        labNode('client', 'client'),
        labNode('load-balancer-1', 'load-balancer'),
        labNode('server-1', 'server', 4),
        labNode('database-1', 'database', 2),
      ],
      links: chain('client', 'load-balancer-1', 'server-1', 'database-1'),
    },
    hint: 'Every box can fail. Run two load balancers and two server groups, each big enough to carry all the traffic alone. Try “Simulate failure” on each one.',
  },
  {
    id: 'budget-hero',
    title: 'Budget hero',
    brief:
      '15,000 requests a second: 60% static files, and nine in ten of the rest are reads. Keep p95 under 100 ms with under 1% errors, for a total cost of 34 or less.',
    traffic: { rps: 15_000, readRatio: 0.9, staticRatio: 0.6 },
    goals: { maxP95: 100, maxErrorRate: 0.01, maxCost: 34 },
    starter: TWO_SERVERS,
    hint: 'Spend where it pays: a CDN takes static files off the servers, a cache takes reads off the database, and the money saved buys enough servers to stay cool.',
  },
];

export function findChallenge(id: string): LabChallenge | undefined {
  return LAB_CHALLENGES.find((c) => c.id === id);
}
