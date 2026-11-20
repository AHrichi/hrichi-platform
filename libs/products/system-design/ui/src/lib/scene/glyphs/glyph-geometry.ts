import {
  GLYPH_TOP,
  type Hue,
  type IconName,
  iso,
  NODE_KINDS,
  type NodeState,
  type Point,
  type SceneNode,
} from '@ah/products/system-design/domain';
import { ICON_PATHS } from '../../icon/icon-paths';

export interface IsoBoxGeometry {
  top: string;
  left: string;
  right: string;
  outline: string;
  topCenter: Point;
}

export interface IsoCylinderGeometry {
  rx: number;
  ry: number;
  topCenter: Point;
  botCenter: Point;
  leftPath: string;
  rightPath: string;
  bottomArc: string;
  midArc: string;
  outlinePath: string;
}

export interface LoadChipView {
  bars: string;
  percent: number;
  text: string;
  critical: boolean;
  width: number;
}

export interface GlyphView {
  origin: Point;
  hue: Hue;
  state: NodeState;
  icon: IconName;
  iconPaths: readonly string[];
  topAnchor: Point;
  bottomAnchor: Point;
  focusRing: string;
  downCenter: Point;
  labelWidth: number;
  labelHeight: number;
  badgeText: string | null;
  badgeWidth: number;
  loadChip: LoadChipView | null;
}

export function pointsToSvg(pts: readonly Point[]): string {
  return pts.map((p) => `${round(p.x)},${round(p.y)}`).join(' ');
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}

/**
 * Builds an isometric prism centered at local `(0, 0)` from `zBottom` to `zTop`
 * with grid half-extent `halfWidth` using `iso()`.
 */
export function isoBox(
  halfWidth: number,
  zBottom: number,
  zTop: number,
): IsoBoxGeometry {
  const nTop = iso({ x: -halfWidth, y: -halfWidth }, zTop);
  const eTop = iso({ x: halfWidth, y: -halfWidth }, zTop);
  const sTop = iso({ x: halfWidth, y: halfWidth }, zTop);
  const wTop = iso({ x: -halfWidth, y: halfWidth }, zTop);

  const eBot = iso({ x: halfWidth, y: -halfWidth }, zBottom);
  const sBot = iso({ x: halfWidth, y: halfWidth }, zBottom);
  const wBot = iso({ x: -halfWidth, y: halfWidth }, zBottom);

  return {
    top: pointsToSvg([nTop, eTop, sTop, wTop]),
    left: pointsToSvg([wTop, sTop, sBot, wBot]),
    right: pointsToSvg([sTop, eTop, eBot, sBot]),
    outline: pointsToSvg([nTop, eTop, eBot, sBot, wBot, wTop]),
    topCenter: iso({ x: 0, y: 0 }, zTop),
  };
}

/**
 * Builds an isometric cylinder centered at local `(0, 0)` from `zBottom` to
 * `zTop` with grid radius `radius` using `iso()`.
 */
export function isoCylinder(
  radius: number,
  zBottom: number,
  zTop: number,
): IsoCylinderGeometry {
  const topCenter = iso({ x: 0, y: 0 }, zTop);
  const botCenter = iso({ x: 0, y: 0 }, zBottom);
  const rx = round(iso({ x: radius, y: -radius }, 0).x);
  const ry = round(iso({ x: radius, y: radius }, 0).y);
  const ty = round(topCenter.y);
  const by = round(botCenter.y);
  const my = round((ty + by) / 2);

  const leftPath = [
    `M ${-rx} ${ty}`,
    `L ${-rx} ${by}`,
    `A ${rx} ${ry} 0 0 0 0 ${round(by + ry)}`,
    `L 0 ${round(ty + ry)}`,
    `A ${rx} ${ry} 0 0 1 ${-rx} ${ty}`,
    'Z',
  ].join(' ');

  const rightPath = [
    `M 0 ${round(ty + ry)}`,
    `L 0 ${round(by + ry)}`,
    `A ${rx} ${ry} 0 0 0 ${rx} ${by}`,
    `L ${rx} ${ty}`,
    `A ${rx} ${ry} 0 0 1 0 ${round(ty + ry)}`,
    'Z',
  ].join(' ');

  const bottomArc = `M ${-rx} ${by} A ${rx} ${ry} 0 0 0 ${rx} ${by}`;
  const midArc = `M ${-rx} ${my} A ${rx} ${ry} 0 0 0 ${rx} ${my}`;

  const outlinePath = [
    `M ${-rx} ${ty}`,
    `A ${rx} ${ry} 0 1 1 ${rx} ${ty}`,
    `L ${rx} ${by}`,
    `A ${rx} ${ry} 0 0 1 ${-rx} ${by}`,
    'Z',
  ].join(' ');

  return {
    rx,
    ry,
    topCenter,
    botCenter,
    leftPath,
    rightPath,
    bottomArc,
    midArc,
    outlinePath,
  };
}

/**
 * Formats a load ratio (`0..1+`) into the `"■■■□ 72%"` chip model.
 * Red (`critical: true`) when load >= 90%.
 */
export function formatLoadChip(
  load: number | null | undefined,
): LoadChipView | null {
  if (load == null || !Number.isFinite(load)) return null;
  const clamped = Math.max(0, load);
  const filled = Math.max(0, Math.min(4, Math.round(clamped * 4)));
  const bars = `${'■'.repeat(filled)}${'□'.repeat(4 - filled)}`;
  const percent = Math.round(clamped * 100);
  const text = `${bars} ${percent}%`;
  return {
    bars,
    percent,
    text,
    critical: clamped >= 0.9,
    width: Math.max(68, Math.round(text.length * 6.8 + 14)),
  };
}

/**
 * Resolves the common display metadata for any `SceneNode`.
 */
export function resolveGlyphView(node: SceneNode): GlyphView {
  const kindInfo = NODE_KINDS[node.kind];
  const state: NodeState = node.state ?? 'normal';
  const hue: Hue =
    state === 'hot' ? 'red' : state === 'down' ? 'neutral' : kindInfo.hue;
  const origin = iso(node.at, 0);
  const topAnchor = iso({ x: 0, y: 0 }, GLYPH_TOP);
  const bottomAnchor = iso({ x: 0.48, y: 0.48 }, 0);
  const focusBox = isoBox(0.54, -0.05, 1.25);
  const downCenter = iso({ x: 0, y: 0 }, 0.65);

  const longestLabel = Math.max(
    node.label.length,
    node.sublabel ? node.sublabel.length : 0,
  );
  const labelWidth = Math.max(48, Math.round(longestLabel * 6.8 + 16));
  const labelHeight = node.sublabel ? 28 : 18;

  const badgeText = node.badge
    ? state === 'hot'
      ? `! ${node.badge}`
      : node.badge
    : null;
  const badgeWidth = badgeText
    ? Math.max(38, Math.round(badgeText.length * 6.6 + 14))
    : 0;

  return {
    origin,
    hue,
    state,
    icon: kindInfo.icon,
    iconPaths: ICON_PATHS[kindInfo.icon] ?? [],
    topAnchor,
    bottomAnchor,
    focusRing: focusBox.outline,
    downCenter,
    labelWidth,
    labelHeight,
    badgeText,
    badgeWidth,
    loadChip: formatLoadChip(node.load),
  };
}
