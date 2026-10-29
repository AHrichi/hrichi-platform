import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';

export interface FlowchartNode {
  id: string;
  label: string;
  subtext?: string;
  type?: 'start' | 'process' | 'decision' | 'end' | 'highlight';
  badge?: string;
  icon?: string;
}

export interface FlowchartEdge {
  from: string;
  to: string;
  label?: string;
  style?: 'solid' | 'dashed';
}

export interface ConceptGraphData {
  title?: string;
  description?: string;
  direction?: 'horizontal' | 'vertical';
  nodes: FlowchartNode[];
  edges?: FlowchartEdge[];
  rawMermaid?: string;
}

export interface ResolvedFlowNode {
  node: FlowchartNode;
  outgoingEdges: FlowchartEdge[];
  isLast: boolean;
}

/**
 * Token-styled, responsive architectural diagram and flowchart component.
 * Visualizes execution paths, state transitions, runtime mechanics, and lifecycle pipelines.
 */
@Component({
  selector: 'ah-flow-chart',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-flow-chart',
    '[class.ah-flow-chart--horizontal]': "activeDirection() === 'horizontal'",
    '[class.ah-flow-chart--vertical]': "activeDirection() === 'vertical'",
  },
  templateUrl: './flow-chart.html',
  styleUrl: './flow-chart.scss',
})
export class FlowChart {
  readonly graph = input<ConceptGraphData | null>(null);
  readonly direction = input<'horizontal' | 'vertical'>('vertical');
  readonly showCodeToggle = input<boolean>(true);
  readonly density = model<'comfortable' | 'compact'>('comfortable');

  readonly showMermaidSource = signal<boolean>(false);
  readonly customDirection = signal<'horizontal' | 'vertical' | null>(null);
  readonly selectedNodeId = signal<string | null>(null);
  readonly zoom = signal<number>(1);
  readonly copiedMermaid = signal<boolean>(false);

  readonly activeDirection = computed<'horizontal' | 'vertical'>(() => {
    return this.customDirection() ?? this.graph()?.direction ?? this.direction();
  });

  readonly resolvedNodes = computed<ResolvedFlowNode[]>(() => {
    const g = this.graph();
    if (!g || !g.nodes || g.nodes.length === 0) {
      return [];
    }

    const nodes = g.nodes;
    const edges = g.edges ?? [];

    return nodes.map((node, index) => {
      let outgoing = edges.filter((e) => e.from === node.id);

      if (outgoing.length === 0 && index < nodes.length - 1) {
        outgoing = [{ from: node.id, to: nodes[index + 1].id }];
      }

      return {
        node,
        outgoingEdges: outgoing,
        isLast: index === nodes.length - 1,
      };
    });
  });

  selectNode(nodeId: string): void {
    if (this.selectedNodeId() === nodeId) {
      this.selectedNodeId.set(null);
    } else {
      this.selectedNodeId.set(nodeId);
    }
  }

  toggleDirection(): void {
    const next = this.activeDirection() === 'vertical' ? 'horizontal' : 'vertical';
    this.customDirection.set(next);
  }

  toggleDensity(): void {
    this.density.update((d) => (d === 'comfortable' ? 'compact' : 'comfortable'));
  }

  toggleMermaidSource(): void {
    this.showMermaidSource.update((v) => !v);
  }

  zoomIn(): void {
    this.zoom.update((z) => Math.min(1.5, +(z + 0.1).toFixed(1)));
  }

  zoomOut(): void {
    this.zoom.update((z) => Math.max(0.7, +(z - 0.1).toFixed(1)));
  }

  resetZoom(): void {
    this.zoom.set(1);
  }

  async copyMermaid(): Promise<void> {
    const raw = this.graph()?.rawMermaid;
    if (!raw) return;
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(raw);
        this.copiedMermaid.set(true);
        setTimeout(() => this.copiedMermaid.set(false), 2000);
      }
    } catch (err) {
      console.warn('Copy failed', err);
    }
  }

  getNodeIcon(node: FlowchartNode): string {
    if (node.icon) return node.icon;
    switch (node.type) {
      case 'start':
        return '▶';
      case 'decision':
        return '◈';
      case 'end':
        return '⏹';
      case 'highlight':
        return '⚡';
      default:
        return '⚙';
    }
  }

  getNodeColor(type?: string): string {
    switch (type) {
      case 'start':
        return '#10b981';
      case 'decision':
        return '#f59e0b';
      case 'end':
        return '#3b82f6';
      case 'highlight':
        return '#a855f7';
      default:
        return '#64748b';
    }
  }

  getNodeTypeClass(type?: string): string {
    switch (type) {
      case 'start':
        return 'node--start';
      case 'decision':
        return 'node--decision';
      case 'end':
        return 'node--end';
      case 'highlight':
        return 'node--highlight';
      default:
        return 'node--process';
    }
  }

  getNodeTypePill(type?: string): string {
    switch (type) {
      case 'start':
        return 'START';
      case 'decision':
        return 'DECISION';
      case 'end':
        return 'TERMINAL';
      case 'highlight':
        return 'KEY SPEC';
      default:
        return 'PROCESS';
    }
  }
}
