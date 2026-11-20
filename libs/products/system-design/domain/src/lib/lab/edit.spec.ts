import { chain, labNode } from '../content/lab/challenges';
import {
  addNode,
  canAdd,
  connect,
  connectableTargets,
  disconnect,
  EMPTY_DESIGN,
  newNodeId,
  removeNode,
  updateNode,
} from './edit';
import type { LabDesign } from './model';
import { labScene, labLayout, linkTraffic } from './scene';
import { simulate } from './simulate';

const SINGLE: LabDesign = {
  nodes: [
    labNode('client', 'client'),
    labNode('server-1', 'server'),
    labNode('database-1', 'database'),
  ],
  links: chain('client', 'server-1', 'database-1'),
};
const links = (d: LabDesign) => d.links.map((l) => `${l.from}>${l.to}`).sort();

describe('lab edits', () => {
  it('names new nodes <kind>-<n> and allows one client', () => {
    expect(newNodeId(SINGLE, 'server')).toBe('server-2');
    expect(canAdd(SINGLE, 'client')).toBe(false);
    expect(canAdd(EMPTY_DESIGN, 'client')).toBe(true);
    expect(addNode(SINGLE, 'client')).toEqual({ design: SINGLE, id: '' });
  });

  it.each<[string, Parameters<typeof addNode>[1], string[]]>([
    [
      'a first load balancer slots in front of the entry',
      'load-balancer',
      [
        'client>load-balancer-1',
        'load-balancer-1>server-1',
        'server-1>database-1',
      ],
    ],
    [
      'a second server copies its sibling’s links',
      'server',
      [
        'client>server-1',
        'client>server-2',
        'server-1>database-1',
        'server-2>database-1',
      ],
    ],
    [
      'a CDN goes in front of the client’s entry',
      'cdn',
      ['cdn-1>server-1', 'client>cdn-1', 'server-1>database-1'],
    ],
    [
      'a cache hangs off every server',
      'cache',
      ['client>server-1', 'server-1>cache-1', 'server-1>database-1'],
    ],
    [
      'a worker drains queues into the database',
      'worker',
      ['client>server-1', 'server-1>database-1', 'worker-1>database-1'],
    ],
  ])('%s', (_, kind, expected) => {
    expect(links(addNode(SINGLE, kind).design)).toEqual([...expected].sort());
  });

  it('a second load balancer forms a pair with the first', () => {
    const one = addNode(SINGLE, 'load-balancer').design;
    const two = addNode(one, 'load-balancer').design;
    expect(links(two)).toEqual(
      [
        'client>load-balancer-1',
        'client>load-balancer-2',
        'load-balancer-1>server-1',
        'load-balancer-2>server-1',
        'server-1>database-1',
      ].sort(),
    );
  });

  it('a first server joins the load balancers and reaches the back ends', () => {
    const d: LabDesign = {
      nodes: [
        labNode('client', 'client'),
        labNode('lb', 'load-balancer'),
        labNode('db', 'database'),
        labNode('q', 'queue'),
      ],
      links: chain('client', 'lb'),
    };
    expect(links(addNode(d, 'server').design)).toEqual(
      ['client>lb', 'lb>server-1', 'server-1>db', 'server-1>q'].sort(),
    );
  });

  it('a database, queue and worker wire up to servers and each other', () => {
    let d: LabDesign = {
      nodes: [labNode('client', 'client'), labNode('s', 'server')],
      links: chain('client', 's'),
    };
    d = addNode(d, 'queue').design;
    d = addNode(d, 'worker').design;
    d = addNode(d, 'database').design;
    expect(links(d)).toEqual(
      [
        'client>s',
        'queue-1>worker-1',
        's>database-1',
        's>queue-1',
        'worker-1>database-1',
      ].sort(),
    );
  });

  it('connects only to valid targets: no loops, no client, no duplicates', () => {
    expect(connectableTargets(SINGLE, 'database-1').map((n) => n.id)).toEqual(
      [],
    );
    expect(connect(SINGLE, 'database-1', 'server-1')).toBe(SINGLE);
    expect(connect(SINGLE, 'server-1', 'database-1')).toBe(SINGLE);
    const more = addNode(SINGLE, 'cache').design;
    const cut = disconnect(more, 'server-1', 'cache-1');
    expect(connectableTargets(cut, 'server-1').map((n) => n.id)).toEqual([
      'cache-1',
    ]);
    expect(links(connect(cut, 'server-1', 'cache-1'))).toEqual(links(more));
  });

  it('removes a node with its links', () => {
    expect(removeNode(SINGLE, 'server-1')).toEqual({
      nodes: [SINGLE.nodes[0], SINGLE.nodes[2]],
      links: [],
    });
  });

  it('clamps instances and hit ratio, and fixes unscalable kinds at one', () => {
    const d = addNode(SINGLE, 'cdn').design;
    const patched = updateNode(
      updateNode(updateNode(d, 'server-1', { instances: 99 }), 'cdn-1', {
        instances: 4,
      }),
      'database-1',
      { instances: 0, down: true },
    );
    const byId = Object.fromEntries(patched.nodes.map((n) => [n.id, n]));
    expect(byId['server-1'].instances).toBe(20);
    expect(byId['cdn-1'].instances).toBe(1);
    expect(byId['database-1']).toEqual({
      id: 'database-1',
      kind: 'database',
      instances: 1,
      down: true,
    });
    const up = updateNode(patched, 'database-1', { down: false });
    expect(up.nodes.find((n) => n.id === 'database-1')).not.toHaveProperty(
      'down',
    );
    const cache = updateNode(addNode(SINGLE, 'cache').design, 'cache-1', {
      hitRatio: 2,
    });
    expect(cache.nodes.find((n) => n.id === 'cache-1')?.hitRatio).toBe(0.99);
  });
});

describe('lab scene', () => {
  it('lays out tier columns, collapsing empty tiers and centring rows', () => {
    const d = addNode(addNode(SINGLE, 'load-balancer').design, 'server').design;
    const at = labLayout(d);
    expect(at.get('client')).toEqual({ x: 0, y: 0 });
    expect(at.get('load-balancer-1')).toEqual({ x: 2, y: 0 });
    expect(at.get('server-1')).toEqual({ x: 4, y: -1 });
    expect(at.get('server-2')).toEqual({ x: 4, y: 1 });
    expect(at.get('database-1')).toEqual({ x: 6, y: 0 });
  });

  it('shows load, hot and down states, and packets proportional to traffic', () => {
    const d = updateNode(addNode(SINGLE, 'cache').design, 'server-1', {
      instances: 1,
    });
    const result = simulate(d, { rps: 900, readRatio: 0.8, staticRatio: 0 });
    const scene = labScene(d, result);
    const server = scene.nodes.find((n) => n.id === 'server-1');
    expect(server?.state).toBe('hot');
    expect(server?.load).toBeCloseTo(0.9, 6);
    expect(scene.nodes.find((n) => n.id === 'client')?.load).toBeNull();
    expect(scene.nodes.find((n) => n.id === 'cache-1')?.sublabel).toBe(
      '80% hits',
    );
    const counts = Object.fromEntries(
      scene.packets.map((p) => [p.edge, p.count]),
    );
    expect(counts['client->server-1']).toBe(6);
    expect(counts['server-1->cache-1']).toBeGreaterThan(0);
    expect(Math.max(...scene.packets.map((p) => p.count))).toBeLessThanOrEqual(
      6,
    );

    const down = updateNode(d, 'database-1', { down: true });
    const downScene = labScene(
      down,
      simulate(down, { rps: 100, readRatio: 0.5, staticRatio: 0 }),
    );
    expect(downScene.nodes.find((n) => n.id === 'database-1')?.state).toBe(
      'down',
    );
    expect(
      downScene.edges.find((e) => e.id === 'server-1->database-1')?.state,
    ).toBe('broken');
    expect(
      downScene.packets.find((p) => p.edge === 'server-1->database-1')?.kind,
    ).toBe('error');
  });

  it('splits a node’s input across its incoming links', () => {
    const d = addNode(addNode(SINGLE, 'load-balancer').design, 'server').design;
    const t = linkTraffic(
      d,
      simulate(d, { rps: 800, readRatio: 0.8, staticRatio: 0 }),
    );
    expect(t.get('load-balancer-1->server-1')).toBeCloseTo(400, 6);
    expect(t.get('server-2->database-1')).toBeCloseTo(400, 6);
  });
});
