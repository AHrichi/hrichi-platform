import type { GridPoint, SceneEdge, SceneNode } from '../model/scene';
import type { SceneState } from './scene';

/** A point in screen (SVG user) units. */
export interface Point {
  x: number;
  y: number;
}

export interface Box {
  x: number;
  y: number;
  width: number;
  height: number;
}

/** A tile is 64 × 32: 2:1 dimetric. One unit of height is 24. */
export const TILE_WIDTH = 64;
export const TILE_HEIGHT = 32;
export const HEIGHT_UNIT = 24;
/** How tall a glyph's label anchor sits above the ground, in height units. */
export const GLYPH_TOP = 1.6;

/** Grid cell (and height) to screen. */
export function iso(p: GridPoint, z = 0): Point {
  return {
    x: (p.x - p.y) * (TILE_WIDTH / 2),
    y: (p.x + p.y) * (TILE_HEIGHT / 2) - z * HEIGHT_UNIT,
  };
}

/** Where a node's label chip and load chip hang: above its top. */
export function anchorOf(node: Pick<SceneNode, 'at'>): Point {
  return iso(node.at, GLYPH_TOP);
}

/**
 * The ground path between two cells, in screen points. Elbows turn in grid
 * space, so the bend follows the floor's lines.
 */
export function edgePoints(
  from: GridPoint,
  to: GridPoint,
  route: NonNullable<SceneEdge['route']> = 'elbow-x',
): Point[] {
  if (route === 'straight' || from.x === to.x || from.y === to.y)
    return [iso(from), iso(to)];
  const bend =
    route === 'elbow-x' ? { x: to.x, y: from.y } : { x: from.x, y: to.y };
  return [iso(from), iso(bend), iso(to)];
}

export function pathLength(points: readonly Point[]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++)
    total += Math.hypot(
      points[i].x - points[i - 1].x,
      points[i].y - points[i - 1].y,
    );
  return total;
}

/** The point at fraction `t` (0–1) of the way along a polyline. */
export function pointAlong(points: readonly Point[], t: number): Point {
  if (points.length === 0) return { x: 0, y: 0 };
  const total = pathLength(points);
  if (total === 0 || t <= 0) return points[0];
  if (t >= 1) return points[points.length - 1];
  let left = t * total;
  for (let i = 1; i < points.length; i++) {
    const a = points[i - 1];
    const b = points[i];
    const seg = Math.hypot(b.x - a.x, b.y - a.y);
    if (left <= seg) {
      const f = seg === 0 ? 0 : left / seg;
      return { x: a.x + (b.x - a.x) * f, y: a.y + (b.y - a.y) * f };
    }
    left -= seg;
  }
  return points[points.length - 1];
}

/**
 * The view box that fits every node footprint (with room above for glyphs
 * and labels) and every zone, plus `pad` on each side.
 */
export function sceneBounds(
  state: Pick<SceneState, 'nodes' | 'zones'>,
  pad = 48,
): Box {
  const pts: Point[] = [];
  for (const n of state.nodes) {
    const { x, y } = n.at;
    pts.push(
      iso({ x: x - 0.5, y: y - 0.5 }, 2.4),
      iso({ x: x + 0.5, y: y - 0.5 }),
      iso({ x: x - 0.5, y: y + 0.5 }),
      iso({ x: x + 0.5, y: y + 0.5 }),
    );
  }
  for (const z of state.zones) {
    pts.push(
      iso(z.from),
      iso(z.to),
      iso({ x: z.from.x, y: z.to.y }),
      iso({ x: z.to.x, y: z.from.y }),
    );
  }
  if (pts.length === 0)
    return { x: -pad, y: -pad, width: pad * 2, height: pad * 2 };
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs) - pad;
  const minY = Math.min(...ys) - pad;
  return {
    x: minX,
    y: minY,
    width: Math.max(...xs) + pad - minX,
    height: Math.max(...ys) + pad - minY,
  };
}
