import type { Lesson } from '../model/lesson';
import type {
  MetricTone,
  PacketKind,
  SceneEdge,
  SceneNode,
  SceneNote,
  SceneOp,
  SceneZone,
} from '../model/scene';
import { foldSteps } from './fold';

export interface MetricValue {
  value: string;
  tone: MetricTone;
}

/** A packet the current step animates. */
export interface PacketPlay {
  edge: string;
  kind: PacketKind;
  reverse: boolean;
  count: number;
  label: string | null;
  wave: number;
}

/** What the diagram shows at one step. */
export interface SceneState {
  nodes: readonly SceneNode[];
  edges: readonly SceneEdge[];
  zones: readonly SceneZone[];
  notes: readonly SceneNote[];
  metrics: Readonly<Record<string, MetricValue>>;
  /** This step's packets only, by wave. */
  packets: readonly PacketPlay[];
  /** Union of the `learns` of steps 0..n. */
  learned: ReadonlySet<number>;
  /** Ids added or updated by this step itself. */
  fresh: ReadonlySet<string>;
}

/** The mutable working copy one fold builds. */
export class SceneDraft {
  readonly nodes = new Map<string, SceneNode>();
  readonly edges = new Map<string, SceneEdge>();
  readonly zones = new Map<string, SceneZone>();
  readonly notes = new Map<string, SceneNote>();
  readonly metrics = new Map<string, MetricValue>();
  readonly packets: PacketPlay[] = [];
  readonly fresh = new Set<string>();

  constructor(lesson: Pick<Lesson, 'scene' | 'hud'>) {
    for (const n of lesson.scene.nodes) this.nodes.set(n.id, n);
    for (const e of lesson.scene.edges) this.edges.set(e.id, e);
    for (const z of lesson.scene.zones) this.zones.set(z.id, z);
    for (const n of lesson.scene.notes) this.notes.set(n.id, n);
    for (const m of lesson.hud)
      this.metrics.set(m.id, { value: m.value, tone: 'normal' });
  }

  /**
   * Applies one op. Returns a problem in plain English when the op refers to
   * something that doesn't exist at this point, or adds a duplicate id;
   * the op is then skipped.
   */
  apply(op: SceneOp, current: boolean): string | null {
    switch (op.op) {
      case 'add-node':
        if (this.nodes.has(op.node.id))
          return `node "${op.node.id}" already exists`;
        this.nodes.set(op.node.id, op.node);
        return this.mark(op.node.id, current);
      case 'update-node': {
        const node = this.nodes.get(op.id);
        if (!node) return `unknown node "${op.id}"`;
        this.nodes.set(op.id, { ...node, ...op.patch });
        return this.mark(op.id, current);
      }
      case 'remove-node': {
        if (!this.nodes.delete(op.id)) return `unknown node "${op.id}"`;
        const gone = new Set<string>();
        for (const [id, e] of this.edges) {
          if (e.from === op.id || e.to === op.id) {
            this.edges.delete(id);
            gone.add(id);
          }
        }
        for (const [id, n] of this.notes) {
          const a = n.anchor;
          if (
            ('node' in a && a.node === op.id) ||
            ('edge' in a && gone.has(a.edge))
          )
            this.notes.delete(id);
        }
        return null;
      }
      case 'add-edge': {
        const e = op.edge;
        if (this.edges.has(e.id)) return `edge "${e.id}" already exists`;
        if (!this.nodes.has(e.from))
          return `edge "${e.id}" starts at unknown node "${e.from}"`;
        if (!this.nodes.has(e.to))
          return `edge "${e.id}" ends at unknown node "${e.to}"`;
        this.edges.set(e.id, e);
        return this.mark(e.id, current);
      }
      case 'update-edge': {
        const edge = this.edges.get(op.id);
        if (!edge) return `unknown edge "${op.id}"`;
        this.edges.set(op.id, { ...edge, ...op.patch });
        return this.mark(op.id, current);
      }
      case 'remove-edge': {
        if (!this.edges.delete(op.id)) return `unknown edge "${op.id}"`;
        for (const [id, n] of this.notes)
          if ('edge' in n.anchor && n.anchor.edge === op.id)
            this.notes.delete(id);
        return null;
      }
      case 'add-zone':
        if (this.zones.has(op.zone.id))
          return `zone "${op.zone.id}" already exists`;
        this.zones.set(op.zone.id, op.zone);
        return this.mark(op.zone.id, current);
      case 'remove-zone':
        return this.zones.delete(op.id) ? null : `unknown zone "${op.id}"`;
      case 'add-note': {
        if (this.notes.has(op.note.id))
          return `note "${op.note.id}" already exists`;
        const problem = this.anchorProblem(op.note);
        if (problem) return problem;
        this.notes.set(op.note.id, op.note);
        return this.mark(op.note.id, current);
      }
      case 'update-note': {
        const note = this.notes.get(op.id);
        if (!note) return `unknown note "${op.id}"`;
        const next = { ...note, ...op.patch };
        const problem = this.anchorProblem(next);
        if (problem) return problem;
        this.notes.set(op.id, next);
        return this.mark(op.id, current);
      }
      case 'remove-note':
        return this.notes.delete(op.id) ? null : `unknown note "${op.id}"`;
      case 'set-metric':
        if (!this.metrics.has(op.id)) return `unknown metric "${op.id}"`;
        this.metrics.set(op.id, { value: op.value, tone: op.tone ?? 'normal' });
        return this.mark(op.id, current);
      case 'packet':
        if (!this.edges.has(op.edge))
          return `packet on unknown edge "${op.edge}"`;
        if (current)
          this.packets.push({
            edge: op.edge,
            kind: op.kind,
            reverse: op.reverse ?? false,
            count: op.count ?? 1,
            label: op.label ?? null,
            wave: op.wave ?? 0,
          });
        return null;
    }
  }

  private mark(id: string, current: boolean): null {
    if (current) this.fresh.add(id);
    return null;
  }

  private anchorProblem(note: SceneNote): string | null {
    const a = note.anchor;
    if ('node' in a && !this.nodes.has(a.node))
      return `note "${note.id}" is anchored to unknown node "${a.node}"`;
    if ('edge' in a && !this.edges.has(a.edge))
      return `note "${note.id}" is anchored to unknown edge "${a.edge}"`;
    return null;
  }

  freeze(learned: ReadonlySet<number>): SceneState {
    return {
      nodes: [...this.nodes.values()],
      edges: [...this.edges.values()],
      zones: [...this.zones.values()],
      notes: [...this.notes.values()],
      metrics: Object.fromEntries(this.metrics),
      packets: [...this.packets].sort((a, b) => a.wave - b.wave),
      learned,
      fresh: new Set(this.fresh),
    };
  }
}

/**
 * The diagram at step `n` (0-based; −1 is the scene before step 1). Pure: it
 * replays the ops of steps 0..n over the lesson's baseline. Throws on an op
 * that refers to something missing; `validateLesson` reports those first.
 */
export function sceneAt(lesson: Lesson, n: number): SceneState {
  const draft = new SceneDraft(lesson);
  const last = Math.min(n, lesson.steps.length - 1);
  foldSteps(lesson.steps, last, (op, current) => {
    const problem = draft.apply(op, current);
    if (problem) throw new Error(`Lesson "${lesson.id}": ${problem}`);
  });
  const learned = new Set<number>();
  for (let s = 0; s <= last; s++)
    for (const i of lesson.steps[s].learns ?? []) learned.add(i);
  return draft.freeze(learned);
}
