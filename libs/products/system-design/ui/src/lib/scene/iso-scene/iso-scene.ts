import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  type ElementRef,
  inject,
  input,
  output,
  signal,
  untracked,
  viewChildren,
} from '@angular/core';
import {
  anchorOf,
  edgePoints,
  type Hue,
  type IconName,
  iso,
  NODE_KINDS,
  type NodeShape,
  type PacketKind,
  pathLength,
  type Point,
  pointAlong,
  sceneBounds,
  type SceneEdge,
  type SceneNode,
  type SceneNote,
  type SceneState,
} from '@ah/products/system-design/domain';
import { ICON_PATHS } from '../../icon/icon-paths';
import { SdCubeGlyph } from '../glyphs/cube-glyph';
import { SdCylinderGlyph } from '../glyphs/cylinder-glyph';
import { SdDeviceGlyph } from '../glyphs/device-glyph';
import { SdDiskGlyph } from '../glyphs/disk-glyph';
import { SdGlobeGlyph } from '../glyphs/globe-glyph';
import { pointsToSvg } from '../glyphs/glyph-geometry';
import { SdPersonGlyph } from '../glyphs/person-glyph';
import { SdStackGlyph } from '../glyphs/stack-glyph';

/** Base travel duration per edge at 1× speed, in ms (technical-design §5). */
export const PACKET_EDGE_MS = 900;
/** Stagger delay between multiple packets in the same wave at 1×, in ms. */
export const PACKET_STAGGER_MS = 150;

export interface GridLineView {
  key: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  strong: boolean;
}

export interface ZoneView {
  id: string;
  hue: Hue;
  points: string;
  label: string | null;
  labelPos: Point;
  fresh: boolean;
}

export interface EdgeView {
  id: string;
  points: readonly Point[];
  polyline: string;
  arrowPoints: string;
  midpoint: Point;
  label: string | null;
  labelWidth: number;
  style: 'solid' | 'dashed';
  state: 'normal' | 'dim' | 'broken';
  flashKind: PacketKind | null;
  fresh: boolean;
}

export interface NodeView {
  node: SceneNode;
  shape: NodeShape;
  fresh: boolean;
  ariaLabel: string;
}

export interface NoteView {
  id: string;
  note: SceneNote;
  tone: 'plain' | 'good' | 'bad' | 'info';
  pos: Point;
  width: number;
  height: number;
  iconPaths: readonly string[] | null;
  fresh: boolean;
}

export interface PacketInstanceView {
  key: string;
  edgeId: string;
  kind: PacketKind;
  label: string | null;
  labelWidth: number;
  points: readonly Point[];
  endPoint: Point;
  delayMs: number;
  durationMs: number;
}

function computeArrowhead(points: readonly Point[]): string {
  if (points.length < 2) return '';
  const end = points[points.length - 1];
  const prev = points[points.length - 2];
  const dx = end.x - prev.x;
  const dy = end.y - prev.y;
  const len = Math.hypot(dx, dy);
  if (len === 0) return '';
  const ux = dx / len;
  const uy = dy / len;
  // Pull back slightly from node center so the arrow tip is visible at the tile edge.
  const pullBack = Math.min(20, len * 0.35);
  const tipX = end.x - ux * pullBack;
  const tipY = end.y - uy * pullBack;
  const size = 7;
  const wing = 4;
  const baseX = tipX - ux * size;
  const baseY = tipY - uy * size;
  const left = { x: baseX - uy * wing, y: baseY + ux * wing };
  const right = { x: baseX + uy * wing, y: baseY - ux * wing };
  return pointsToSvg([{ x: tipX, y: tipY }, left, right]);
}

/**
 * Isometric SVG diagram renderer (`sd-iso-scene`).
 *
 * Draw order (technical-design §6):
 * zones → grid → edges → nodes (sorted back-to-front by `x + y`) → notes → packets.
 */
@Component({
  selector: 'sd-iso-scene',
  imports: [
    SdCubeGlyph,
    SdCylinderGlyph,
    SdDeviceGlyph,
    SdStackGlyph,
    SdGlobeGlyph,
    SdPersonGlyph,
    SdDiskGlyph,
  ],
  templateUrl: './iso-scene.html',
  styleUrl: './iso-scene.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdIsoScene {
  readonly state = input.required<SceneState>();
  readonly playing = input<boolean>(true);
  readonly speed = input<number>(1);
  readonly reducedMotion = input<boolean>(false);
  readonly label = input<string>('System diagram');
  readonly selectable = input<boolean>(false);
  readonly selectedNodeId = input<string | null>(null);

  readonly packetsDone = output<void>();
  readonly nodeSelected = output<string>();

  private readonly packetEls =
    viewChildren<ElementRef<SVGGElement>>('packetEl');
  private readonly replayCounter = signal(0);
  private activeAnimations: Animation[] = [];
  private runToken = 0;

  protected readonly bounds = computed(() => sceneBounds(this.state(), 56));

  protected readonly viewBox = computed(() => {
    const b = this.bounds();
    return `${Math.round(b.x)} ${Math.round(b.y)} ${Math.round(b.width)} ${Math.round(b.height)}`;
  });

  protected readonly gridLines = computed<readonly GridLineView[]>(() => {
    const s = this.state();
    const xs: number[] = [];
    const ys: number[] = [];
    for (const n of s.nodes) {
      xs.push(n.at.x);
      ys.push(n.at.y);
    }
    for (const z of s.zones) {
      xs.push(z.from.x, z.to.x);
      ys.push(z.from.y, z.to.y);
    }
    const minX = (xs.length ? Math.floor(Math.min(...xs)) : 0) - 1;
    const maxX = (xs.length ? Math.ceil(Math.max(...xs)) : 4) + 1;
    const minY = (ys.length ? Math.floor(Math.min(...ys)) : 0) - 1;
    const maxY = (ys.length ? Math.ceil(Math.max(...ys)) : 4) + 1;

    const lines: GridLineView[] = [];
    for (let i = minX; i <= maxX + 1; i++) {
      const gx = i - 0.5;
      const a = iso({ x: gx, y: minY - 0.5 });
      const b = iso({ x: gx, y: maxY + 0.5 });
      lines.push({
        key: `gx-${i}`,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        strong: i % 2 === 0,
      });
    }
    for (let j = minY; j <= maxY + 1; j++) {
      const gy = j - 0.5;
      const a = iso({ x: minX - 0.5, y: gy });
      const b = iso({ x: maxX + 0.5, y: gy });
      lines.push({
        key: `gy-${j}`,
        x1: a.x,
        y1: a.y,
        x2: b.x,
        y2: b.y,
        strong: j % 2 === 0,
      });
    }
    return lines;
  });

  protected readonly nodeMap = computed(
    () => new Map(this.state().nodes.map((n) => [n.id, n])),
  );

  protected readonly zones = computed<readonly ZoneView[]>(() => {
    const s = this.state();
    return s.zones.map((z) => {
      const minX = Math.min(z.from.x, z.to.x) - 0.5;
      const maxX = Math.max(z.from.x, z.to.x) + 0.5;
      const minY = Math.min(z.from.y, z.to.y) - 0.5;
      const maxY = Math.max(z.from.y, z.to.y) + 0.5;
      const corners = [
        iso({ x: minX, y: minY }),
        iso({ x: maxX, y: minY }),
        iso({ x: maxX, y: maxY }),
        iso({ x: minX, y: maxY }),
      ];
      const labelPos = iso({ x: minX + 0.2, y: minY + 0.25 });
      return {
        id: z.id,
        hue: z.hue,
        points: pointsToSvg(corners),
        label: z.label ?? null,
        labelPos,
        fresh: s.fresh.has(z.id),
      };
    });
  });

  protected readonly edgePointsMap = computed(() => {
    const nodes = this.nodeMap();
    const out = new Map<string, Point[]>();
    for (const e of this.state().edges) {
      const from = nodes.get(e.from);
      const to = nodes.get(e.to);
      if (!from || !to) continue;
      out.set(e.id, edgePoints(from.at, to.at, e.route ?? 'elbow-x'));
    }
    return out;
  });

  protected readonly edges = computed<readonly EdgeView[]>(() => {
    const s = this.state();
    const ptsMap = this.edgePointsMap();
    const packetByEdge = new Map<string, PacketKind>();
    for (const pkt of s.packets) {
      if (!packetByEdge.has(pkt.edge)) packetByEdge.set(pkt.edge, pkt.kind);
    }

    return s.edges
      .map((e: SceneEdge): EdgeView | null => {
        const pts = ptsMap.get(e.id);
        if (!pts || pts.length < 2) return null;
        const mid = pointAlong(pts, 0.5);
        const label = e.label ?? null;
        return {
          id: e.id,
          points: pts,
          polyline: pointsToSvg(pts),
          arrowPoints: computeArrowhead(pts),
          midpoint: mid,
          label,
          labelWidth: label
            ? Math.max(34, Math.round(label.length * 6.8 + 14))
            : 0,
          style: e.style ?? 'solid',
          state: e.state ?? 'normal',
          flashKind: this.reducedMotion()
            ? (packetByEdge.get(e.id) ?? null)
            : null,
          fresh: s.fresh.has(e.id),
        };
      })
      .filter((e): e is EdgeView => e !== null);
  });

  /** Nodes sorted back-to-front by `x + y`. */
  protected readonly sortedNodes = computed<readonly NodeView[]>(() => {
    const s = this.state();
    return [...s.nodes]
      .sort((a, b) => {
        const depth = a.at.x + a.at.y - (b.at.x + b.at.y);
        if (depth !== 0) return depth;
        return a.at.x - b.at.x;
      })
      .map((node) => {
        const info = NODE_KINDS[node.kind];
        const parts = [`${node.label} (${info.label})`];
        if (node.sublabel) parts.push(node.sublabel);
        if (node.state && node.state !== 'normal')
          parts.push(`state ${node.state}`);
        if (node.load != null)
          parts.push(`load ${Math.round(node.load * 100)}%`);
        if (node.badge) parts.push(`badge ${node.badge}`);
        return {
          node,
          shape: info.shape,
          fresh: s.fresh.has(node.id),
          ariaLabel: parts.join(', '),
        };
      });
  });

  protected readonly notes = computed<readonly NoteView[]>(() => {
    const s = this.state();
    const nodes = this.nodeMap();
    const edges = this.edgePointsMap();

    return s.notes.map((note) => {
      let pos: Point = { x: 0, y: 0 };
      const a = note.anchor;
      if ('node' in a) {
        const n = nodes.get(a.node);
        if (n) {
          const base = anchorOf(n);
          pos = { x: base.x, y: base.y - (n.load != null ? 36 : 22) };
        }
      } else if ('edge' in a) {
        const pts = edges.get(a.edge);
        if (pts) {
          const mid = pointAlong(pts, 0.5);
          pos = { x: mid.x, y: mid.y - 24 };
        }
      } else if ('at' in a) {
        pos = iso(a.at, 0.4);
      }

      const rowCount = (note.rows?.length ?? 0) + (note.total ? 1 : 0);
      const longestRow = Math.max(
        note.text.length,
        ...(note.rows ?? []).map(([k, v]) => k.length + v.length + 3),
        note.total ? note.total[0].length + note.total[1].length + 3 : 0,
      );
      const iconExtra = note.icon ? 18 : 0;
      const width = Math.max(64, Math.round(longestRow * 6.6 + 18 + iconExtra));
      const height = rowCount > 0 ? 22 + rowCount * 15 : 22;
      const iconName: IconName | undefined = note.icon;

      return {
        id: note.id,
        note,
        tone: note.tone ?? 'plain',
        pos,
        width,
        height,
        iconPaths: iconName ? (ICON_PATHS[iconName] ?? null) : null,
        fresh: s.fresh.has(note.id),
      };
    });
  });

  protected readonly packetInstances = computed<readonly PacketInstanceView[]>(
    () => {
      const s = this.state();
      const edges = this.edgePointsMap();
      const spd = Math.max(0.1, this.speed());
      const edgeMs = PACKET_EDGE_MS / spd;
      const staggerMs = PACKET_STAGGER_MS / spd;

      const distinctWaves = [...new Set(s.packets.map((p) => p.wave))].sort(
        (a, b) => a - b,
      );
      const waveStartMs = new Map<number, number>();
      let cursorMs = 0;
      for (const w of distinctWaves) {
        waveStartMs.set(w, cursorMs);
        const maxCount = Math.max(
          1,
          ...s.packets.filter((p) => p.wave === w).map((p) => p.count),
        );
        cursorMs += edgeMs + (maxCount - 1) * staggerMs;
      }

      const out: PacketInstanceView[] = [];
      s.packets.forEach((pkt, pIdx) => {
        const basePts = edges.get(pkt.edge);
        if (!basePts || basePts.length < 2) return;
        const pts = pkt.reverse ? [...basePts].reverse() : [...basePts];
        const endPoint = pts[pts.length - 1];
        const baseDelay = waveStartMs.get(pkt.wave) ?? 0;

        for (let c = 0; c < pkt.count; c++) {
          const label = c === 0 ? pkt.label : null;
          out.push({
            key: `${pkt.edge}-${pkt.kind}-${pkt.wave}-${pIdx}-${c}`,
            edgeId: pkt.edge,
            kind: pkt.kind,
            label,
            labelWidth: label
              ? Math.max(32, Math.round(label.length * 6.5 + 12))
              : 0,
            points: pts,
            endPoint,
            delayMs: baseDelay + c * staggerMs,
            durationMs: edgeMs,
          });
        }
      });

      return out;
    },
  );

  /** Accessible text items for the visually-hidden description list. */
  protected readonly descriptionItems = computed<readonly string[]>(() => {
    const s = this.state();
    const nodes = this.nodeMap();
    const items: string[] = [];

    if (s.nodes.length > 0) {
      const list = s.nodes
        .map((n) => {
          const info = NODE_KINDS[n.kind];
          const extras: string[] = [];
          if (n.state && n.state !== 'normal') extras.push(n.state);
          if (n.load != null) extras.push(`${Math.round(n.load * 100)}% load`);
          if (n.badge) extras.push(n.badge);
          return extras.length
            ? `${n.label} (${info.label}, ${extras.join(', ')})`
            : `${n.label} (${info.label})`;
        })
        .join(', ');
      items.push(`Diagram components: ${list}.`);
    }

    if (s.edges.length > 0) {
      const conns = s.edges
        .map((e) => {
          const from = nodes.get(e.from)?.label ?? e.from;
          const to = nodes.get(e.to)?.label ?? e.to;
          return e.label ? `${from} → ${to} (${e.label})` : `${from} → ${to}`;
        })
        .join('; ');
      items.push(`Connections: ${conns}.`);
    }

    if (s.notes.length > 0) {
      const notesText = s.notes.map((n) => n.text).join('; ');
      items.push(`Notes: ${notesText}.`);
    }

    if (s.packets.length > 0) {
      const pkts = s.packets
        .map((p) => {
          const edge = s.edges.find((e) => e.id === p.edge);
          const from =
            nodes.get((p.reverse ? edge?.to : edge?.from) ?? '')?.label ??
            p.edge;
          const to =
            nodes.get((p.reverse ? edge?.from : edge?.to) ?? '')?.label ??
            p.edge;
          return p.label
            ? `${p.kind} (${p.label}) from ${from} to ${to}`
            : `${p.kind} from ${from} to ${to}`;
        })
        .join('; ');
      items.push(`Active traffic: ${pkts}.`);
    }

    return items;
  });

  constructor() {
    afterRenderEffect(() => {
      // Track dependencies that trigger a fresh packet animation pass.
      const instances = this.packetInstances();
      const instant = this.reducedMotion();
      this.replayCounter();
      const refs = this.packetEls();

      this.startPacketAnimations(instances, refs, instant);
    });

    afterRenderEffect(() => {
      const isPlaying = this.playing();
      for (const anim of this.activeAnimations) {
        if (isPlaying) anim.play();
        else anim.pause();
      }
    });

    inject(DestroyRef).onDestroy(() => this.cancelAnimations());
  }

  /** Restarts the current step's packet animations from wave 0. */
  replay(): void {
    this.replayCounter.update((n) => n + 1);
  }

  protected onNodeActivate(event: Event, nodeId: string): void {
    if (!this.selectable()) return;
    event.preventDefault();
    this.nodeSelected.emit(nodeId);
  }

  private cancelAnimations(): void {
    this.runToken++;
    for (const anim of this.activeAnimations) {
      try {
        anim.cancel();
      } catch {
        // Ignore cancellation errors in stubbed/jsdom environments.
      }
    }
    this.activeAnimations = [];
  }

  private startPacketAnimations(
    instances: readonly PacketInstanceView[],
    refs: readonly ElementRef<SVGGElement>[],
    instant: boolean,
  ): void {
    this.cancelAnimations();
    const token = this.runToken;

    if (instances.length === 0) {
      this.packetsDone.emit();
      return;
    }

    if (instant) {
      refs.forEach((ref, i) => {
        const inst = instances[i];
        if (!inst) return;
        ref.nativeElement.style.transform = `translate(${inst.endPoint.x}px, ${inst.endPoint.y}px)`;
      });
      this.packetsDone.emit();
      return;
    }

    const animations: Animation[] = [];
    const promises: Promise<unknown>[] = [];

    refs.forEach((ref, i) => {
      const inst = instances[i];
      if (!inst || inst.points.length < 2) return;
      const el = ref.nativeElement;
      const total = pathLength(inst.points);
      let acc = 0;
      const keyframes: Keyframe[] = inst.points.map((pt, idx) => {
        if (idx > 0) {
          const prev = inst.points[idx - 1];
          acc += Math.hypot(pt.x - prev.x, pt.y - prev.y);
        }
        const offset =
          total > 0 ? acc / total : idx / Math.max(1, inst.points.length - 1);
        return {
          transform: `translate(${pt.x}px, ${pt.y}px)`,
          offset: Math.min(1, Math.max(0, offset)),
        };
      });

      if (typeof el.animate !== 'function') {
        el.style.transform = `translate(${inst.endPoint.x}px, ${inst.endPoint.y}px)`;
        return;
      }

      const anim = el.animate(keyframes, {
        duration: inst.durationMs,
        delay: inst.delayMs,
        easing: 'ease-in-out',
        fill: 'both',
      });

      if (!untracked(() => this.playing())) {
        anim.pause?.();
      }

      animations.push(anim);
      if (anim.finished && typeof anim.finished.then === 'function') {
        promises.push(anim.finished.catch(() => undefined));
      }
    });

    this.activeAnimations = animations;

    if (animations.length === 0) {
      this.packetsDone.emit();
      return;
    }

    if (promises.length > 0) {
      void Promise.all(promises).then(() => {
        if (this.runToken === token) {
          this.packetsDone.emit();
        }
      });
    }
  }
}
