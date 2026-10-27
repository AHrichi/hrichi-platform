import type { GraphNode } from './graph';

/** Parameters the hero passes to the WebGL scene. */
export interface ConstellationParams {
  /** A project to highlight from outside the canvas (e.g. a hovered link). */
  highlight: string | null;
}

/**
 * One camera for both renderings, so the WebGL scene opens on exactly the
 * picture the prerendered SVG already shows.
 */
export const view = {
  fovDeg: 40,
  distance: 3.4,
  /** Initial rotation of the graph, in radians. */
  yaw: 0.55,
  tilt: 0.28,
  /** Width / height of the hero figure. */
  aspect: 4 / 3,
} as const;

/** Core radius in world units; apps are drawn larger than libraries. */
export function nodeRadius(node: GraphNode, degree: number): number {
  return (0.028 + 0.009 * Math.sqrt(degree)) * (node.kind === 'app' ? 1.6 : 1);
}

export type DataColour = `color-data-${1 | 2 | 3 | 4 | 5 | 6 | 7}`;

/** Scope → categorical colour token (`--color-data-N`). */
const scopeColours: Record<string, 1 | 2 | 3 | 4 | 5 | 6> = {
  portfolio: 1,
  api: 2,
  orbit: 2,
  shared: 3,
  platform: 4,
  'design-system': 5,
  test: 6,
};

export function scopeColour(scope: string): DataColour {
  // Every lab gets the same colour; there will be several.
  return `color-data-${scopeColours[scope] ?? 7}`;
}

export const legend = [
  { label: 'Portfolio', token: scopeColour('portfolio') },
  { label: 'Platform', token: scopeColour('platform') },
  { label: 'Design system', token: scopeColour('design-system') },
  { label: 'Shared', token: scopeColour('shared') },
  { label: 'Backend', token: scopeColour('api') },
  { label: 'Labs', token: scopeColour('lab-hello') },
  { label: 'Tests', token: scopeColour('test') },
] as const;

/** Where clicking a project goes. Projects without a page aren't links. */
export const nodeLinks: Readonly<Record<string, string>> = {
  shell: '/work/this-platform',
  'lab-hello': '/labs/hello',
  'lab-orbit': '/labs/orbit',
  api: '/contact',
};

export interface ProjectedPoint {
  /** In the SVG viewBox: x in [-aspect, aspect], y in [-1, 1], y down. */
  x: number;
  y: number;
  /** World-to-screen scale at this depth; multiply radii by it. */
  scale: number;
  /** Camera-space depth, for painter's order (larger is farther). */
  depth: number;
}

/**
 * Projects a layout position the way the scene's camera does: rotate by
 * yaw around Y, then tilt around X (three's 'XYZ' Euler order), then a
 * perspective divide.
 */
export function project(
  point: { x: number; y: number; z: number },
  yaw: number = view.yaw,
  tilt: number = view.tilt,
): ProjectedPoint {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const x1 = point.x * cosY + point.z * sinY;
  const z1 = -point.x * sinY + point.z * cosY;
  const cosX = Math.cos(tilt);
  const sinX = Math.sin(tilt);
  const y2 = point.y * cosX - z1 * sinX;
  const z2 = point.y * sinX + z1 * cosX;

  const depth = view.distance - z2;
  const scale = 1 / (depth * Math.tan((view.fovDeg * Math.PI) / 360));
  return { x: x1 * scale, y: -y2 * scale, scale, depth };
}

export const viewBox = `${-view.aspect} -1 ${2 * view.aspect} 2`;
