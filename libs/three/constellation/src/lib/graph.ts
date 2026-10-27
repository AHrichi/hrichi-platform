import data from '../generated/graph.json';

export type EdgeKind = 'static' | 'dynamic' | 'implicit' | 'federated';

export interface GraphNode {
  /** The Nx project name. */
  id: string;
  kind: 'app' | 'lib' | 'e2e';
  scope: string;
  layer: string;
  runtime: string;
  /** Layout position inside the unit sphere. */
  x: number;
  y: number;
  z: number;
}

/** `[dependent, dependency, kind]`, as indexes into `nodes`. */
export type GraphEdge = [source: number, target: number, kind: EdgeKind];

export interface ConstellationGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/** This workspace's project graph, exported by tools/scripts/export-graph.mjs. */
// JSON imports widen tuples to arrays, so the shape is asserted here and checked by tests.
export const constellation = data as unknown as ConstellationGraph;

/** Number of edges touching each node, by index. */
export function degrees(graph: ConstellationGraph): number[] {
  const counts = graph.nodes.map(() => 0);
  for (const [source, target] of graph.edges) {
    counts[source]++;
    counts[target]++;
  }
  return counts;
}

/** Indexes of a node and every node it shares an edge with. */
export function neighbourhood(
  graph: ConstellationGraph,
  index: number,
): Set<number> {
  const result = new Set([index]);
  for (const [source, target] of graph.edges) {
    if (source === index) result.add(target);
    if (target === index) result.add(source);
  }
  return result;
}
