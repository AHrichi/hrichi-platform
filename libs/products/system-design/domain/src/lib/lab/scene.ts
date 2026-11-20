import { LAB_CATALOG } from '../content/lab/catalog';
import type { SceneState } from '../engine/scene';
import type {
  GridPoint,
  PacketKind,
  SceneEdge,
  SceneNode,
} from '../model/scene';
import type { LabDesign, SimResult } from './model';
import { HOT_UTILIZATION, hitRatioOf, labNodeLabel } from './simulate';

/** Grid cells between two occupied tier columns, and between rows. */
export const LAB_COLUMN_GAP = 3;
export const LAB_ROW_GAP = 3;
/** The most packets one edge animates at a time. */
export const MAX_PACKETS_PER_EDGE = 6;

/**
 * Auto layout by tier columns (technical-design §8): client 0, CDN 1, load
 * balancer 2, server 3, cache and queue 4, database, replica and worker 5.
 * Empty tiers collapse; rows in a column are centred on the middle row.
 */
export function labLayout(
  design: Pick<LabDesign, 'nodes'>,
): Map<string, GridPoint> {
  const tiers = [
    ...new Set(design.nodes.map((n) => LAB_CATALOG[n.kind].tier)),
  ].sort((a, b) => a - b);
  const out = new Map<string, GridPoint>();
  tiers.forEach((tier, col) => {
    const column = design.nodes.filter(
      (n) => LAB_CATALOG[n.kind].tier === tier,
    );
    column.forEach((n, row) => {
      out.set(n.id, {
        x: col * LAB_COLUMN_GAP,
        y: (row - (column.length - 1) / 2) * LAB_ROW_GAP,
      });
    });
  });
  return out;
}

const edgeId = (from: string, to: string) => `${from}->${to}`;

/**
 * Requests per second along each link, approximated from the result: a
 * node's input is shared across its incoming links in proportion to what
 * each sender pushes out.
 */
export function linkTraffic(
  design: LabDesign,
  result: SimResult,
): Map<string, number> {
  const rps = new Map(result.nodes.map((n) => [n.id, n.inRps - n.dropped]));
  const out = new Map<string, number>();
  for (const n of design.nodes) {
    const ins = design.links.filter((l) => l.to === n.id);
    const weights = ins.map((l) => {
      const fanOut = design.links.filter((x) => x.from === l.from).length || 1;
      return (rps.get(l.from) ?? 0) / fanOut;
    });
    const total = weights.reduce((a, b) => a + b, 0);
    const inRps = result.nodes.find((x) => x.id === n.id)?.inRps ?? 0;
    ins.forEach((l, i) =>
      out.set(
        edgeId(l.from, l.to),
        total > 0 ? (inRps * weights[i]) / total : 0,
      ),
    );
  }
  return out;
}

/** The diagram for a design and its result, ready for `sd-iso-scene`. */
export function labScene(design: LabDesign, result: SimResult): SceneState {
  const at = labLayout(design);
  const byId = new Map(design.nodes.map((n) => [n.id, n]));
  const res = new Map(result.nodes.map((n) => [n.id, n]));

  const nodes: SceneNode[] = design.nodes.map((n) => {
    const r = res.get(n.id);
    const rho = r?.utilization ?? 0;
    const sub: string[] = [];
    if (n.instances > 1) sub.push(`×${n.instances}`);
    if (n.kind === 'cache')
      sub.push(`${Math.round(hitRatioOf(n) * 100)}% hits`);
    const bounded = Number.isFinite(LAB_CATALOG[n.kind].capacity);
    return {
      id: n.id,
      kind: n.kind,
      at: at.get(n.id) ?? { x: 0, y: 0 },
      label: labNodeLabel(design, n),
      sublabel: sub.length ? sub.join(' · ') : undefined,
      state: n.down ? 'down' : rho > HOT_UTILIZATION ? 'hot' : 'normal',
      load: !n.down && bounded && Number.isFinite(rho) ? rho : null,
    };
  });

  const traffic = linkTraffic(design, result);
  const busiest = Math.max(0, ...traffic.values());
  const edges: SceneEdge[] = [];
  const packets: SceneState['packets'][number][] = [];
  for (const l of design.links) {
    const from = byId.get(l.from);
    const to = byId.get(l.to);
    if (!from || !to) continue;
    const id = edgeId(l.from, l.to);
    const broken = Boolean(from.down || to.down);
    const rps = traffic.get(id) ?? 0;
    edges.push({
      id,
      from: l.from,
      to: l.to,
      state: broken ? 'broken' : rps > 0 ? 'normal' : 'dim',
      style:
        from.kind === 'queue' || from.kind === 'worker' ? 'dashed' : 'solid',
      route: 'elbow-x',
    });
    if (rps <= 0 || busiest <= 0) continue;
    const kind: PacketKind = to.down
      ? 'error'
      : from.kind === 'queue' || from.kind === 'worker'
        ? 'write'
        : 'request';
    packets.push({
      edge: id,
      kind,
      reverse: false,
      count: Math.max(
        1,
        Math.min(
          MAX_PACKETS_PER_EDGE,
          Math.round((rps / busiest) * MAX_PACKETS_PER_EDGE),
        ),
      ),
      label: null,
      wave: 0,
    });
  }

  return {
    nodes,
    edges,
    zones: [],
    notes: [],
    metrics: {},
    packets,
    learned: new Set(),
    fresh: new Set(),
  };
}
