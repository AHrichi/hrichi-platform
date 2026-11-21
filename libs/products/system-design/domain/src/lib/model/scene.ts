import type { IconName } from './icons';

/** Colour families for nodes, zones and modules. `red` is for trouble only. */
export type Hue =
  'neutral' | 'amber' | 'blue' | 'violet' | 'green' | 'rose' | 'teal' | 'red';

/** A cell on the isometric grid; halves are allowed. */
export interface GridPoint {
  x: number;
  y: number;
}

export type NodeKind =
  | 'client'
  | 'phone'
  | 'user'
  | 'dns'
  | 'cdn'
  | 'load-balancer'
  | 'gateway'
  | 'server'
  | 'service'
  | 'worker'
  | 'database'
  | 'replica'
  | 'cache'
  | 'queue'
  | 'stream'
  | 'storage'
  | 'search'
  | 'external'
  | 'scheduler';

export type NodeState = 'normal' | 'focus' | 'hot' | 'down' | 'dim';

export interface SceneNode {
  id: string;
  kind: NodeKind;
  at: GridPoint;
  label: string;
  sublabel?: string;
  state?: NodeState;
  /** 0–1 and beyond; draws a load chip. */
  load?: number | null;
  badge?: string | null;
}

export interface SceneEdge {
  id: string;
  from: string;
  to: string;
  label?: string | null;
  style?: 'solid' | 'dashed';
  state?: 'normal' | 'dim' | 'broken';
  route?: 'elbow-x' | 'elbow-y' | 'straight';
}

export interface SceneZone {
  id: string;
  from: GridPoint;
  to: GridPoint;
  hue: Hue;
  label?: string;
}

export type NoteAnchor =
  { node: string } | { edge: string } | { at: GridPoint };

export interface SceneNote {
  id: string;
  anchor: NoteAnchor;
  text: string;
  tone?: 'plain' | 'good' | 'bad' | 'info';
  icon?: IconName;
  /** A table panel: label, value rows. */
  rows?: readonly (readonly [string, string])[];
  total?: readonly [string, string];
}

export interface SceneSpec {
  nodes: readonly SceneNode[];
  edges: readonly SceneEdge[];
  zones: readonly SceneZone[];
  notes: readonly SceneNote[];
}

export interface HudMetric {
  id: string;
  label: string;
  icon: IconName;
  /** The initial value, usually '—'. */
  value: string;
}

export type PacketKind =
  'request' | 'response' | 'handshake' | 'write' | 'event' | 'error';

export type MetricTone = 'normal' | 'good' | 'bad';

export type SceneOp =
  | { op: 'add-node'; node: SceneNode }
  | {
      op: 'update-node';
      id: string;
      patch: Partial<Omit<SceneNode, 'id' | 'kind'>>;
    }
  /** Also removes the node's edges and the notes anchored to it or them. */
  | { op: 'remove-node'; id: string }
  | { op: 'add-edge'; edge: SceneEdge }
  | {
      op: 'update-edge';
      id: string;
      patch: Partial<Omit<SceneEdge, 'id' | 'from' | 'to'>>;
    }
  | { op: 'remove-edge'; id: string }
  | { op: 'add-zone'; zone: SceneZone }
  | { op: 'remove-zone'; id: string }
  | { op: 'add-note'; note: SceneNote }
  | { op: 'update-note'; id: string; patch: Partial<Omit<SceneNote, 'id'>> }
  | { op: 'remove-note'; id: string }
  | { op: 'set-metric'; id: string; value: string; tone?: MetricTone }
  | {
      op: 'packet';
      edge: string;
      kind: PacketKind;
      reverse?: boolean;
      count?: 1 | 2 | 3 | 4 | 5;
      label?: string;
      /** 0-based; packets in the same wave play together, waves in order. */
      wave?: number;
    };
