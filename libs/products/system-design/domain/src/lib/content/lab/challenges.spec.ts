import { checkChallenge } from '../../lab/challenge';
import { addNode } from '../../lab/edit';
import type { LabDesign, LabNode } from '../../lab/model';
import { chain, findChallenge, LAB_CHALLENGES, labNode } from './challenges';

/** client → [cdn] → load balancer → one server group → back ends. */
function behindOneBalancer(
  server: LabNode,
  backEnds: LabNode[],
  front: LabNode[] = [],
): LabDesign {
  return {
    nodes: [
      labNode('client', 'client'),
      ...front,
      labNode('lb', 'load-balancer'),
      server,
      ...backEnds,
    ],
    links: [
      ...chain('client', ...front.map((n) => n.id), 'lb', server.id),
      ...backEnds
        .filter((b) => b.kind !== 'worker')
        .map((b) => ({ from: server.id, to: b.id })),
    ],
  };
}

const writeStorm = behindOneBalancer(labNode('servers', 'server', 10), [
  labNode('cache', 'cache'),
  labNode('queue', 'queue'),
  labNode('workers', 'worker', 5),
  labNode('db', 'database', 3),
]);
writeStorm.links.push(...chain('queue', 'workers', 'db'));

/** A design that solves each challenge, documented for authors and the Guide. */
const SOLUTIONS: Record<string, LabDesign> = {
  'first-users': behindOneBalancer(labNode('s1', 'server'), [
    labNode('db', 'database'),
  ]),
  'launch-day': behindOneBalancer(labNode('servers', 'server', 12), [
    labNode('cache', 'cache'),
    labNode('db', 'database', 2),
  ]),
  'global-images': behindOneBalancer(
    labNode('servers', 'server', 7),
    [labNode('db', 'database', 3)],
    [labNode('cdn', 'cdn')],
  ),
  'write-storm': writeStorm,
  'no-single-failure': {
    nodes: [
      labNode('client', 'client'),
      labNode('lb1', 'load-balancer'),
      labNode('lb2', 'load-balancer'),
      labNode('a', 'server', 4),
      labNode('b', 'server', 4),
      labNode('db', 'database', 2),
    ],
    links: [
      ...chain('client', 'lb1', 'a', 'db'),
      ...chain('client', 'lb2', 'b', 'db'),
      ...chain('lb1', 'b'),
      ...chain('lb2', 'a'),
    ],
  },
  'budget-hero': behindOneBalancer(
    labNode('servers', 'server', 10),
    [labNode('cache', 'cache'), labNode('db', 'database', 2)],
    [labNode('cdn', 'cdn')],
  ),
};
// first-users wants two servers behind the balancer.
SOLUTIONS['first-users'].nodes.push(labNode('s2', 'server'));
SOLUTIONS['first-users'].links.push(...chain('lb', 's2', 'db'));

/** Near misses: designs that look right but miss one goal. */
const NEAR_MISSES: [string, string, LabDesign][] = [
  [
    'launch-day',
    'maxP95',
    behindOneBalancer(labNode('servers', 'server', 10), [
      labNode('cache', 'cache'),
      labNode('db', 'database', 2),
    ]),
  ],
  [
    'global-images',
    'maxCost',
    behindOneBalancer(labNode('servers', 'server', 20), [
      labNode('db', 'database', 3),
    ]),
  ],
  [
    'write-storm',
    'maxP95',
    behindOneBalancer(labNode('servers', 'server', 10), [
      labNode('cache', 'cache'),
      labNode('db', 'database', 3),
    ]),
  ],
  [
    'budget-hero',
    'maxCost',
    behindOneBalancer(
      labNode('servers', 'server', 11),
      [labNode('cache', 'cache'), labNode('db', 'database', 2)],
      [labNode('cdn', 'cdn')],
    ),
  ],
];

describe('LAB_CHALLENGES', () => {
  it('lists the six challenges of technical-design §8 in order', () => {
    expect(LAB_CHALLENGES.map((c) => c.id)).toEqual([
      'first-users',
      'launch-day',
      'global-images',
      'write-storm',
      'no-single-failure',
      'budget-hero',
    ]);
    expect(findChallenge('write-storm')?.title).toBe('Write storm');
    expect(findChallenge('nope')).toBeUndefined();
  });

  it.each(LAB_CHALLENGES.map((c) => [c.id, c] as const))(
    '%s: the starter fails',
    (_, challenge) => {
      expect(checkChallenge(challenge, challenge.starter).solved).toBe(false);
    },
  );

  it.each(LAB_CHALLENGES.map((c) => [c.id, c] as const))(
    '%s: the recorded solution passes every goal',
    (id, challenge) => {
      const check = checkChallenge(challenge, SOLUTIONS[id]);
      expect(check.goals.filter((g) => !g.met)).toEqual([]);
      expect(check.solved).toBe(true);
    },
  );

  it.each(NEAR_MISSES)('%s: a near miss fails %s', (id, goal, design) => {
    const challenge = findChallenge(id);
    if (!challenge) throw new Error(id);
    const check = checkChallenge(challenge, design);
    expect(check.goals.find((g) => g.id === goal)?.met).toBe(false);
    expect(check.solved).toBe(false);
  });

  it('first-users: the starter misses p95 by the worked example’s numbers', () => {
    const challenge = LAB_CHALLENGES[0];
    const check = checkChallenge(challenge, challenge.starter);
    expect(check.goals).toEqual([
      { id: 'maxP95', label: 'p95 ≤ 150 ms', met: false, actual: '282 ms' },
      { id: 'maxCost', label: 'Cost ≤ 10', met: true, actual: '6' },
    ]);
  });

  it('first-users: one click for a load balancer and one for a server solve it', () => {
    const challenge = LAB_CHALLENGES[0];
    const withLb = addNode(challenge.starter, 'load-balancer').design;
    const solved = addNode(withLb, 'server').design;
    const check = checkChallenge(challenge, solved);
    expect(check.solved).toBe(true);
    expect(check.result.p95).toBeCloseTo(117.8, 1);
    expect(check.result.cost).toBe(9);
  });

  it('no-single-failure: one balancer is a single point of failure, even with spare servers', () => {
    const challenge = findChallenge('no-single-failure');
    if (!challenge) throw new Error('missing');
    const oneLb = structuredClone(SOLUTIONS['no-single-failure']);
    oneLb.nodes = oneLb.nodes.filter((n) => n.id !== 'lb2');
    oneLb.links = oneLb.links.filter((l) => l.from !== 'lb2' && l.to !== 'lb2');
    const survives = checkChallenge(challenge, oneLb).goals.find(
      (g) => g.id === 'survives',
    );
    expect(survives).toEqual({
      id: 'survives',
      label: 'Survives losing any one web server or load balancer',
      met: false,
      actual: '100.0% errors without Load balancer',
    });
  });

  it('checks goals at the traffic it is given', () => {
    const challenge = LAB_CHALLENGES[0];
    expect(
      checkChallenge(challenge, challenge.starter, {
        rps: 100,
        readRatio: 0.8,
        staticRatio: 0,
      }).solved,
    ).toBe(true);
  });
});
