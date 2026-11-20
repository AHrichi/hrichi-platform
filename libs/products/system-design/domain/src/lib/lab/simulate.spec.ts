import { chain, labNode } from '../content/lab/challenges';
import type { LabDesign, LabLink, LabNode, SimResult, Traffic } from './model';
import { designCost, labNodeLabel, simulate } from './simulate';

const design = (nodes: LabNode[], ...links: LabLink[][]): LabDesign => ({
  nodes,
  links: links.flat(),
});
const traffic = (rps: number, readRatio = 0.8, staticRatio = 0): Traffic => ({
  rps,
  readRatio,
  staticRatio,
});
const node = (r: SimResult, id: string) => {
  const n = r.nodes.find((x) => x.id === id);
  if (!n) throw new Error(`no node ${id}`);
  return n;
};

const SINGLE = design(
  [labNode('c', 'client'), labNode('s', 'server'), labNode('db', 'database')],
  chain('c', 's', 'db'),
);
const BALANCED = design(
  [
    labNode('c', 'client'),
    labNode('lb', 'load-balancer'),
    labNode('s1', 'server'),
    labNode('s2', 'server'),
    labNode('db', 'database'),
  ],
  chain('c', 'lb', 's1', 'db'),
  chain('lb', 's2', 'db'),
);

describe('simulate: the worked example (technical-design §8)', () => {
  it('single server at 800 rps, 80% reads: p50 112.76, p95 281.9 ms, cost 6', () => {
    const r = simulate(SINGLE, traffic(800));
    expect(node(r, 's').utilization).toBeCloseTo(0.8, 6);
    expect(node(r, 's').p50).toBeCloseTo(100, 6);
    expect(node(r, 'db').utilization).toBeCloseTo(640 / 3000 + 160 / 1000, 6);
    expect(node(r, 'db').p50).toBeCloseTo(12.77, 2);
    expect(r.p50).toBeCloseTo(112.77, 2);
    expect(r.p95).toBeCloseTo(281.9, 1);
    expect(r.cost).toBe(6);
    expect(r.errorRate).toBe(0);
    expect(r.throughput).toBe(800);
  });

  it('a load balancer and a second server: p50 ≈ 47.1, p95 ≈ 117.8 ms, cost 9', () => {
    const r = simulate(BALANCED, traffic(800));
    expect(node(r, 's1').utilization).toBeCloseTo(0.4, 6);
    expect(node(r, 's1').p50).toBeCloseTo(33.33, 2);
    expect(node(r, 'lb').p50).toBeCloseTo(1.02, 2);
    expect(r.p50).toBeCloseTo(47.1, 1);
    expect(r.p95).toBeCloseTo(117.8, 1);
    expect(r.cost).toBe(9);
  });
});

describe('simulate, rule 1: shape', () => {
  it.each<[string, LabDesign, RegExp, number]>([
    ['no client', design([labNode('s', 'server')]), /Add a client/, 1],
    [
      'a loop',
      design(
        [labNode('c', 'client'), labNode('a', 'server'), labNode('b', 'cache')],
        chain('c', 'a', 'b', 'a'),
      ),
      /loop/,
      1,
    ],
    [
      'a client linked to nothing',
      design([labNode('c', 'client'), labNode('s', 'server')]),
      /Connect the client/,
      1,
    ],
    [
      'a link to a missing node',
      design(
        [labNode('c', 'client'), labNode('s', 'server')],
        chain('c', 's', 'ghost'),
      ),
      /missing component/,
      0,
    ],
    [
      'two clients',
      design(
        [
          labNode('c', 'client'),
          labNode('c2', 'client'),
          labNode('s', 'server'),
        ],
        chain('c', 's'),
      ),
      /Use one client/,
      0,
    ],
  ])('reports %s', (_, d, problem, errorRate) => {
    const r = simulate(d, traffic(100));
    expect(r.problems.some((p) => problem.test(p))).toBe(true);
    expect(r.errorRate).toBe(errorRate);
  });

  it('asks for a load balancer when the client reaches two entry points, and uses only the first', () => {
    const d = design(
      [
        labNode('c', 'client'),
        labNode('s1', 'server'),
        labNode('s2', 'server'),
      ],
      chain('c', 's1'),
      chain('c', 's2'),
    );
    const r = simulate(d, traffic(500));
    expect(r.problems).toContain(
      'Clients reach one entry point: add a load balancer.',
    );
    expect(node(r, 's1').inRps).toBe(500);
    expect(node(r, 's2').inRps).toBe(0);
  });

  it('lets the client reach a pair of load balancers', () => {
    const d = design(
      [
        labNode('c', 'client'),
        labNode('lb1', 'load-balancer'),
        labNode('lb2', 'load-balancer'),
        labNode('s', 'server'),
      ],
      chain('c', 'lb1', 's'),
      chain('c', 'lb2', 's'),
    );
    const r = simulate(d, traffic(500));
    expect(r.problems.join(' ')).not.toMatch(/entry point/);
    expect(node(r, 'lb1').inRps).toBe(250);
    expect(node(r, 's').inRps).toBe(500);
  });

  it('flags components no request reaches', () => {
    const d = design(
      [...SINGLE.nodes, labNode('cache', 'cache')],
      SINGLE.links,
    );
    expect(simulate(d, traffic(100)).problems).toContain(
      'Not connected: Cache.',
    );
  });
});

describe('simulate, rule 2: flow', () => {
  it('a CDN answers the static share and forwards the rest', () => {
    const d = design(
      [
        labNode('c', 'client'),
        labNode('cdn', 'cdn'),
        labNode('s', 'server', 2),
      ],
      chain('c', 'cdn', 's'),
    );
    const r = simulate(d, traffic(1_000, 0.8, 0.7));
    expect(node(r, 'cdn').inRps).toBe(1_000);
    expect(node(r, 's').inRps).toBeCloseTo(300, 6);
  });

  it('a load balancer splits evenly across up servers only', () => {
    const d = structuredClone(BALANCED);
    const even = simulate(d, traffic(800));
    expect(node(even, 's1').inRps).toBe(400);
    expect(node(even, 's2').inRps).toBe(400);
    d.nodes[2].down = true;
    const failed = simulate(d, traffic(800));
    expect(node(failed, 's1').inRps).toBe(0);
    expect(node(failed, 's2').inRps).toBe(800);
    expect(failed.errorRate).toBe(0);
  });

  it('reads hit a cache at its hit ratio; misses go to the database', () => {
    const d = design(
      [
        labNode('c', 'client'),
        labNode('s', 'server', 2),
        labNode('k', 'cache', 1, { hitRatio: 0.9 }),
        labNode('db', 'database'),
      ],
      chain('c', 's', 'k'),
      chain('s', 'db'),
    );
    const r = simulate(d, traffic(1_000, 0.8));
    expect(node(r, 'k').inRps).toBeCloseTo(800, 6);
    // 80 read misses plus 200 writes.
    expect(node(r, 'db').inRps).toBeCloseTo(280, 6);
    expect(node(r, 'db').utilization).toBeCloseTo(80 / 3000 + 200 / 1000, 6);
  });

  it('reads spread evenly across up replicas, falling back to the database', () => {
    const d = design(
      [
        labNode('c', 'client'),
        labNode('s', 'server', 2),
        labNode('r1', 'replica'),
        labNode('r2', 'replica'),
        labNode('db', 'database'),
      ],
      chain('c', 's', 'r1'),
      chain('s', 'r2'),
      chain('s', 'db'),
    );
    const r = simulate(d, traffic(1_000, 0.8));
    expect(node(r, 'r1').inRps).toBeCloseTo(400, 6);
    expect(node(r, 'r2').inRps).toBeCloseTo(400, 6);
    expect(node(r, 'db').inRps).toBeCloseTo(200, 6);

    d.nodes[2].down = true;
    d.nodes[3].down = true;
    expect(node(simulate(d, traffic(1_000, 0.8)), 'db').inRps).toBeCloseTo(
      1_000,
      6,
    );
  });

  it('writes behind a queue end the user path; workers cap what reaches the database', () => {
    const d = design(
      [
        labNode('c', 'client'),
        labNode('s', 'server', 4),
        labNode('q', 'queue'),
        labNode('w', 'worker', 2),
        labNode('db', 'database', 2),
      ],
      chain('c', 's', 'q', 'w', 'db'),
      chain('s', 'db'),
    );
    // 2,000 writes a second; two workers drain 800.
    const r = simulate(d, traffic(3_000, 1 / 3));
    expect(node(r, 'q').inRps).toBeCloseTo(2_000, 6);
    expect(node(r, 'w').dropped).toBeCloseTo(1_200, 6);
    expect(node(r, 'db').inRps).toBeCloseTo(1_000 + 800, 6);
    expect(r.errorRate).toBe(0);
    expect(r.problems.some((p) => p.startsWith('Backlog grows: Worker'))).toBe(
      true,
    );
  });

  it('static requests go to object storage when a server links to it', () => {
    const d = design(
      [
        labNode('c', 'client'),
        labNode('s', 'server'),
        labNode('st', 'storage'),
      ],
      chain('c', 's', 'st'),
    );
    const r = simulate(d, traffic(500, 1, 0.4));
    expect(node(r, 'st').inRps).toBeCloseTo(200, 6);
  });

  it('a load balancer with nothing behind it fails every request', () => {
    const d = design(
      [labNode('c', 'client'), labNode('lb', 'load-balancer')],
      chain('c', 'lb'),
    );
    const r = simulate(d, traffic(100));
    expect(r.errorRate).toBe(1);
    expect(r.problems).toContain(
      'Load balancer has nothing behind it to answer some requests.',
    );
  });
});

describe('simulate, rule 3: per node', () => {
  it.each<[string, number, number, number, number]>([
    // [label, instances, rps, ρ, p50]
    ['idle', 1, 0, 0, 20],
    ['half load', 2, 1_000, 0.5, 40],
    ['saturating at 0.95', 1, 990, 0.99, 400],
    ['overloaded', 1, 2_000, 2, 400],
  ])('server, %s', (_, instances, rps, rho, p50) => {
    const d = design(
      [labNode('c', 'client'), labNode('s', 'server', instances)],
      chain('c', 's'),
    );
    const r = simulate(d, traffic(rps, 1));
    expect(node(r, 's').capacity).toBe(1_000 * instances);
    expect(node(r, 's').utilization).toBeCloseTo(rho, 6);
    expect(node(r, 's').p50).toBeCloseTo(p50, 6);
  });

  it('an overloaded node drops 1 − 1/ρ of its traffic', () => {
    const d = design(
      [labNode('c', 'client'), labNode('s', 'server')],
      chain('c', 's'),
    );
    const r = simulate(d, traffic(4_000, 1));
    expect(node(r, 's').dropped).toBeCloseTo(3_000, 6);
    expect(r.errorRate).toBeCloseTo(0.75, 6);
    expect(r.throughput).toBeCloseTo(1_000, 6);
    expect(r.problems[0]).toBe(
      'Overloaded: Web server runs at 400% and drops 75% of its requests.',
    );
  });

  it('a down node has no capacity and fails what reaches it', () => {
    const d = design(
      [labNode('c', 'client'), labNode('s', 'server', 3, { down: true })],
      chain('c', 's'),
    );
    const r = simulate(d, traffic(100, 1));
    expect(node(r, 's').capacity).toBe(0);
    expect(node(r, 's').p50).toBe(400);
    expect(r.errorRate).toBe(1);
    expect(r.problems).toContain('Web server is down, so its requests fail.');
  });

  it('downstream nodes see only what survives upstream', () => {
    const d = design(
      [
        labNode('c', 'client'),
        labNode('s', 'server'),
        labNode('db', 'database'),
      ],
      chain('c', 's', 'db'),
    );
    expect(node(simulate(d, traffic(2_000, 1)), 'db').inRps).toBeCloseTo(
      1_000,
      6,
    );
  });
});

describe('simulate, rule 4: end to end', () => {
  it('adds 50 ms of p95 per hot node on a path', () => {
    const d = design(
      [labNode('c', 'client'), labNode('s', 'server')],
      chain('c', 's'),
    );
    const r = simulate(d, traffic(900, 1));
    // ρ = 0.9: p50 = 200, p95 = 2.5 × 200 + 50.
    expect(r.p50).toBeCloseTo(200, 6);
    expect(r.p95).toBeCloseTo(550, 6);
  });

  it('weights path classes by their share', () => {
    const d = design(
      [
        labNode('c', 'client'),
        labNode('cdn', 'cdn'),
        labNode('s', 'server', 10),
      ],
      chain('c', 'cdn', 's'),
    );
    const r = simulate(d, traffic(1_000, 1, 0.5));
    // static: CDN only (15); dynamic: CDN + server at ρ 0.05.
    const server = 20 / 0.95;
    expect(r.p50).toBeCloseTo(0.5 * 15 + 0.5 * (15 + server), 6);
    expect(r.p95).toBeCloseTo(2.5 * r.p50, 6);
  });
});

describe('simulate, rules 5 and 6: cost and problems', () => {
  it('sums instances × unit cost, flat for the CDN', () => {
    const d = design([
      labNode('c', 'client'),
      labNode('cdn', 'cdn'),
      labNode('s', 'server', 3),
      labNode('db', 'database', 2),
    ]);
    expect(designCost(d)).toBe(2 + 6 + 8);
  });

  it('names single points of failure', () => {
    const r = simulate(SINGLE, traffic(800));
    expect(r.problems).toEqual([
      'Single point of failure: Web server.',
      'Single point of failure: Database.',
    ]);
    expect(simulate(BALANCED, traffic(800)).problems).toEqual([
      'Single point of failure: Load balancer.',
      'Single point of failure: Database.',
    ]);
  });

  it('numbers labels when a design has several of a kind', () => {
    expect(labNodeLabel(BALANCED, { id: 's2', kind: 'server' })).toBe(
      'Web server 2',
    );
    expect(labNodeLabel(BALANCED, { id: 'db', kind: 'database' })).toBe(
      'Database',
    );
  });
});
