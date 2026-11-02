import type { LayoutInput, LayoutOutput } from './contracts';

/** Space between layers and between nodes in a layer, in layout units. */
const LAYER_GAP = 80;
const NODE_GAP = 32;

/**
 * A layered (Sugiyama-style) layout, small enough for lesson diagrams:
 *
 * 1. Edges that close a cycle are set aside, so the rest is acyclic.
 * 2. Each node's layer is the longest path to it from a source.
 * 3. Two sweeps order each layer by the mean position of its neighbours
 *    (the barycentre), which removes most crossings.
 *
 * Deterministic: the same input always gives the same picture. Node
 * positions are their centres.
 */
export function layeredLayout(input: LayoutInput): LayoutOutput {
  const ids = input.nodes.map((node) => node.id);
  const known = new Set(ids);
  const edges = input.edges.filter(
    (edge) => known.has(edge.from) && known.has(edge.to),
  );
  const forward = acyclicEdges(ids, edges);

  // Longest-path layering, in input order so ties stay stable.
  const layer = new Map(ids.map((id) => [id, 0]));
  for (let pass = 0; pass < ids.length; pass++) {
    let changed = false;
    for (const edge of forward) {
      const next = (layer.get(edge.from) ?? 0) + 1;
      if (next > (layer.get(edge.to) ?? 0)) {
        layer.set(edge.to, next);
        changed = true;
      }
    }
    if (!changed) break;
  }

  const layers: string[][] = [];
  for (const id of ids) (layers[layer.get(id) ?? 0] ??= []).push(id);
  for (let i = 0; i < layers.length; i++) layers[i] ??= [];

  const order = () =>
    new Map(layers.flatMap((ids) => ids.map((id, i) => [id, i] as const)));
  const sweep = (from: 'from' | 'to', range: number[]) => {
    for (const l of range) {
      const pos = order();
      const centre = (id: string) => {
        const near = forward
          .filter((edge) => edge[from === 'from' ? 'to' : 'from'] === id)
          .map((edge) => pos.get(edge[from]) ?? 0);
        return near.length
          ? near.reduce((a, b) => a + b, 0) / near.length
          : (pos.get(id) ?? 0);
      };
      const keyed = layers[l].map((id, i) => ({ id, key: centre(id), i }));
      keyed.sort((a, b) => a.key - b.key || a.i - b.i);
      layers[l] = keyed.map((entry) => entry.id);
    }
  };
  const down = layers.map((_, i) => i).slice(1);
  sweep('from', down);
  sweep(
    'to',
    [...down].reverse().map((i) => i - 1),
  );

  // Uniform cells, centred across layers, so a reader's eye follows the flow.
  const size = new Map(input.nodes.map((node) => [node.id, node]));
  const cellAlong = Math.max(...input.nodes.map((n) => along(input, n)), 0);
  const cellAcross = Math.max(...input.nodes.map((n) => across(input, n)), 0);
  const widest = Math.max(...layers.map((ids) => ids.length), 1);
  const spanAcross = widest * cellAcross + (widest - 1) * NODE_GAP;
  const centre = new Map<string, [number, number]>();
  layers.forEach((ids, l) => {
    const used = ids.length * cellAcross + (ids.length - 1) * NODE_GAP;
    const start = (spanAcross - used) / 2;
    ids.forEach((id, i) => {
      const a = l * (cellAlong + LAYER_GAP) + cellAlong / 2;
      const c = start + i * (cellAcross + NODE_GAP) + cellAcross / 2;
      centre.set(id, input.direction === 'lr' ? [a, c] : [c, a]);
    });
  });
  const spanAlong = layers.length * cellAlong + (layers.length - 1) * LAYER_GAP;

  return {
    width: input.direction === 'lr' ? spanAlong : spanAcross,
    height: input.direction === 'lr' ? spanAcross : spanAlong,
    nodes: ids.map((id) => {
      const [x, y] = centre.get(id) ?? [0, 0];
      return { id, x, y };
    }),
    edges: edges.map((edge) => ({
      id: edge.id,
      points: route(input, centre, size, edge.from, edge.to),
    })),
  };
}

type Box = LayoutInput['nodes'][number];

const along = (input: LayoutInput, node: Box) =>
  input.direction === 'lr' ? node.width : node.height;
const across = (input: LayoutInput, node: Box) =>
  input.direction === 'lr' ? node.height : node.width;

/** Edges with the ones that close a cycle (found by depth-first search) left out. */
function acyclicEdges(
  ids: string[],
  edges: LayoutInput['edges'],
): LayoutInput['edges'] {
  const state = new Map<string, 'open' | 'done'>();
  const back = new Set<string>();
  const visit = (id: string) => {
    state.set(id, 'open');
    for (const edge of edges) {
      if (edge.from !== id) continue;
      const seen = state.get(edge.to);
      if (seen === 'open') back.add(edge.id);
      else if (!seen) visit(edge.to);
    }
    state.set(id, 'done');
  };
  for (const id of ids) if (!state.has(id)) visit(id);
  return edges.filter((edge) => !back.has(edge.id));
}

/** From the edge of one box to the edge of the other, along the flow. */
function route(
  input: LayoutInput,
  centre: Map<string, [number, number]>,
  size: Map<string, Box>,
  from: string,
  to: string,
): [number, number][] {
  const [ax, ay] = centre.get(from) ?? [0, 0];
  const [bx, by] = centre.get(to) ?? [0, 0];
  const a = size.get(from);
  const b = size.get(to);
  if (!a || !b) return [];
  if (from === to) {
    // A loop beside the box.
    const r = 18;
    return input.direction === 'lr'
      ? [
          [ax + a.width / 2, ay - r / 2],
          [ax + a.width / 2 + r, ay - r],
          [ax + a.width / 2 + r, ay + r],
          [ax + a.width / 2, ay + r / 2],
        ]
      : [
          [ax - r / 2, ay + a.height / 2],
          [ax - r, ay + a.height / 2 + r],
          [ax + r, ay + a.height / 2 + r],
          [ax + r / 2, ay + a.height / 2],
        ];
  }
  if (input.direction === 'lr') {
    const ahead = bx >= ax;
    const sx = ax + (ahead ? a.width / 2 : -a.width / 2);
    const ex = bx + (ahead ? -b.width / 2 : b.width / 2);
    return [
      [sx, ay],
      [(sx + ex) / 2, ay],
      [(sx + ex) / 2, by],
      [ex, by],
    ];
  }
  const ahead = by >= ay;
  const sy = ay + (ahead ? a.height / 2 : -a.height / 2);
  const ey = by + (ahead ? -b.height / 2 : b.height / 2);
  return [
    [ax, sy],
    [ax, (sy + ey) / 2],
    [bx, (sy + ey) / 2],
    [bx, ey],
  ];
}
