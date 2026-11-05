import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import {
  constellation,
  type ConstellationParams,
  degrees,
  type GraphEdge,
  type GraphNode,
  legend,
  nodeLinks,
  nodeRadius,
  project,
  scopeColour,
  viewBox,
} from '@ah/three/constellation';
import { SceneHost } from '@ah/three/angular';
import { PreferencesStore } from '@ah/shared/state';
import { CONSTELLATION_COPY } from './constellation-copy';

/** What each linked project is called in the caption. */
const linkLabels: Record<string, string> = {
  shell: 'How this site is built',
  'product-strategy': 'Financial strategy dashboard',
  'product-dispatch': 'PulseOps · Commercial dispatch control center',
  'product-lighting': 'LuxPath · Street lighting field kit',
  'product-basecamp': 'Basecamp · Camping trip planner',
  'lab-rxjs': 'RxJS practice pad',
  'lab-sky': 'Sky lab',
  'design-system': 'Design system & Storybook',
  api: 'The API behind the contact form',
};

const PRESET_PARTS: Array<{
  id: string;
  kind: 'app' | 'lib' | 'e2e';
  scope: string;
  targetId: string;
}> = [
  {
    id: 'product-ai-agent',
    kind: 'app',
    scope: 'portfolio',
    targetId: 'shell',
  },
  {
    id: 'lib-voice-stream',
    kind: 'lib',
    scope: 'shared',
    targetId: 'shared-state',
  },
  {
    id: 'product-analytics',
    kind: 'app',
    scope: 'platform',
    targetId: 'platform-federation',
  },
  {
    id: 'lib-wasm-sim',
    kind: 'lib',
    scope: 'shared',
    targetId: 'shared-content',
  },
  {
    id: 'product-copilot',
    kind: 'app',
    scope: 'portfolio',
    targetId: 'shell',
  },
  {
    id: 'lib-edge-cache',
    kind: 'lib',
    scope: 'platform',
    targetId: 'platform-federation',
  },
  {
    id: 'e2e-stress-suite',
    kind: 'e2e',
    scope: 'test',
    targetId: 'shell',
  },
];

/**
 * The hero figure: this repository's real Nx graph (ADR-0011).
 * Features full 360° spin, touch/gesture orbit, dynamic part addition & removal,
 * layer filtering, and responsive mobile support.
 */
@Component({
  selector: 'ah-constellation-figure',
  imports: [SceneHost, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './constellation-figure.html',
  styleUrl: './constellation-figure.scss',
})
export class ConstellationFigure {
  private readonly router = inject(Router);
  private readonly preferences = inject(PreferencesStore);

  protected readonly copy = computed(
    () =>
      CONSTELLATION_COPY[this.preferences.language()] ?? CONSTELLATION_COPY.en,
  );

  protected readonly viewBox = viewBox;
  protected readonly legend = legend;
  protected readonly nodeLinks = nodeLinks;

  // Interactive dynamic controls state
  protected readonly selectedKind = signal<'all' | 'app' | 'lib' | 'e2e'>(
    'all',
  );
  protected readonly showEdges = signal<boolean>(true);
  protected readonly showStars = signal<boolean>(true);
  protected readonly customNodes = signal<GraphNode[]>([]);
  protected readonly customEdges = signal<
    Array<[string, string, GraphEdge[2]]>
  >([]);
  protected readonly removedNodeIds = signal<Set<string>>(new Set());
  protected readonly spinCount = signal<number>(0);
  protected readonly resetCount = signal<number>(0);
  protected readonly selectedNodeId = signal<string | null>(null);
  protected readonly statusNotice = signal<string | null>(null);
  protected readonly highlight = signal<string | null>(null);

  private noticeTimeout: ReturnType<typeof setTimeout> | null = null;

  /** Active nodes based on filters, added parts and removed parts */
  protected readonly activeNodes = computed<GraphNode[]>(() => {
    const removed = this.removedNodeIds();
    const kind = this.selectedKind();

    const base = constellation.nodes.filter(
      (n) => !removed.has(n.id) && (kind === 'all' || n.kind === kind),
    );
    const custom = this.customNodes().filter(
      (n) => !removed.has(n.id) && (kind === 'all' || n.kind === kind),
    );
    return [...base, ...custom];
  });

  /** Active edges mapped to current activeNodes array indexes */
  protected readonly activeEdges = computed<GraphEdge[]>(() => {
    if (!this.showEdges()) return [];
    const nodes = this.activeNodes();
    const idToIndex = new Map<string, number>();
    nodes.forEach((n, idx) => idToIndex.set(n.id, idx));

    const result: GraphEdge[] = [];

    // Base workspace edges
    for (const [s, t, kind] of constellation.edges) {
      const sourceNode = constellation.nodes[s];
      const targetNode = constellation.nodes[t];
      if (sourceNode && targetNode) {
        const sIdx = idToIndex.get(sourceNode.id);
        const tIdx = idToIndex.get(targetNode.id);
        if (sIdx !== undefined && tIdx !== undefined) {
          result.push([sIdx, tIdx, kind]);
        }
      }
    }

    // Dynamic custom edges
    for (const [sId, tId, kind] of this.customEdges()) {
      const sIdx = idToIndex.get(sId);
      const tIdx = idToIndex.get(tId);
      if (sIdx !== undefined && tIdx !== undefined) {
        result.push([sIdx, tIdx, kind]);
      }
    }

    return result;
  });

  protected readonly projectCount = computed(() => this.activeNodes().length);
  protected readonly dependencyCount = computed(
    () => this.activeEdges().length,
  );

  protected readonly canAddPart = computed(() => {
    const activeIds = new Set(this.activeNodes().map((n) => n.id));
    return PRESET_PARTS.some((p) => !activeIds.has(p.id));
  });

  protected readonly canRemovePart = computed(
    () =>
      this.customNodes().length > 0 ||
      this.selectedNodeId() !== null ||
      this.removedNodeIds().size > 0,
  );

  // Fallback SVG projected points
  protected readonly placedNodes = computed(() => {
    const nodes = this.activeNodes();
    const edges = this.activeEdges();
    const degs = degrees({ nodes, edges });
    return nodes.map((node, i) => {
      const point = project(node);
      return {
        ...node,
        ...point,
        r: nodeRadius(node, degs[i] ?? 0) * point.scale,
        token: scopeColour(node.scope),
      };
    });
  });

  protected readonly svgEdges = computed(() => {
    const placed = this.placedNodes();
    return this.activeEdges().map(([s, t, kind]) => ({
      x1: placed[s]?.x ?? 0,
      y1: placed[s]?.y ?? 0,
      x2: placed[t]?.x ?? 0,
      y2: placed[t]?.y ?? 0,
      kind,
      token: placed[s]?.token ?? 'color-data-1',
    }));
  });

  protected readonly links = constellation.nodes
    .filter((node) => linkLabels[node.id])
    .map((node) => ({
      id: node.id,
      href: nodeLinks[node.id],
      isExternal: (nodeLinks[node.id] ?? '').startsWith('http'),
      label: linkLabels[node.id] ?? node.id,
    }));

  protected readonly params = computed<ConstellationParams>(() => ({
    highlight: this.selectedNodeId() ?? this.highlight(),
    theme: this.preferences.isDark() ? 'dark' : 'light',
    nodes: this.activeNodes(),
    edges: this.activeEdges(),
    showEdges: this.showEdges(),
    showStars: this.showStars(),
    spinCount: this.spinCount(),
    resetCount: this.resetCount(),
  }));

  protected readonly loadScene = () =>
    import('@ah/three/scenes/constellation').then((m) => m.constellationScene);

  protected fullSpin(): void {
    this.spinCount.update((c) => c + 1);
  }

  protected addPart(): void {
    const activeIds = new Set(this.activeNodes().map((n) => n.id));
    const nextPreset = PRESET_PARTS.find((p) => !activeIds.has(p.id));
    if (!nextPreset) return;

    // Golden spiral point on sphere
    const seed = this.customNodes().length + 1;
    const phi = seed * 2.399963;
    const y = 0.7 - seed * 0.22;
    const radiusAtY = Math.sqrt(Math.max(0.1, 1 - y * y));
    const dist = 0.75 + (seed % 3) * 0.08;
    const x = Math.cos(phi) * radiusAtY * dist;
    const z = Math.sin(phi) * radiusAtY * dist;

    const newNode: GraphNode = {
      id: nextPreset.id,
      kind: nextPreset.kind,
      scope: nextPreset.scope,
      layer: 'feature',
      runtime: 'browser',
      x: Number(x.toFixed(3)),
      y: Number(y.toFixed(3)),
      z: Number(z.toFixed(3)),
    };

    this.customNodes.update((nodes) => [...nodes, newNode]);
    this.customEdges.update((edges) => [
      ...edges,
      [nextPreset.id, nextPreset.targetId, 'dynamic'],
      ['shell', nextPreset.id, 'federated'],
    ]);

    this.selectedNodeId.set(nextPreset.id);
    this.flashNotice(this.copy().addedNotice(nextPreset.id));
  }

  protected removePart(): void {
    const selected = this.selectedNodeId();
    if (selected) {
      this.removeSpecificNode(selected);
      return;
    }
    const customs = this.customNodes();
    if (customs.length > 0) {
      const last = customs[customs.length - 1];
      this.removeSpecificNode(last.id);
    }
  }

  protected removeSpecificNode(id: string): void {
    const customs = this.customNodes();
    const isCustom = customs.some((n) => n.id === id);

    if (isCustom) {
      this.customNodes.update((nodes) => nodes.filter((n) => n.id !== id));
      this.customEdges.update((edges) =>
        edges.filter(([s, t]) => s !== id && t !== id),
      );
    } else {
      this.removedNodeIds.update((set) => {
        const next = new Set(set);
        next.add(id);
        return next;
      });
    }

    if (this.selectedNodeId() === id) {
      this.selectedNodeId.set(null);
    }
    this.flashNotice(this.copy().removedNotice(id));
  }

  protected resetGraph(): void {
    this.customNodes.set([]);
    this.customEdges.set([]);
    this.removedNodeIds.set(new Set());
    this.selectedKind.set('all');
    this.showEdges.set(true);
    this.showStars.set(true);
    this.selectedNodeId.set(null);
    this.resetCount.update((c) => c + 1);
    this.flashNotice(this.copy().resetNotice);
  }

  protected setFilterKind(kind: 'all' | 'app' | 'lib' | 'e2e'): void {
    this.selectedKind.set(kind);
  }

  protected toggleEdges(): void {
    this.showEdges.update((v) => !v);
  }

  protected toggleStars(): void {
    this.showStars.update((v) => !v);
  }

  protected onPicked(id: string | null): void {
    this.selectedNodeId.set(id);
  }

  private flashNotice(text: string): void {
    if (this.noticeTimeout) clearTimeout(this.noticeTimeout);
    this.statusNotice.set(text);
    this.noticeTimeout = setTimeout(() => {
      this.statusNotice.set(null);
    }, 3200);
  }

  protected open(href: string): void {
    if (typeof window !== 'undefined' && href) {
      if (href.startsWith('http')) {
        window.open(href, '_blank', 'noopener,noreferrer');
      } else {
        void this.router.navigateByUrl(href);
      }
    }
  }
}
