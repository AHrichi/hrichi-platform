import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  signal,
} from '@angular/core';
import { NgClass } from '@angular/common';

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
  imports: [NgClass],
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

  readonly showMermaidSource = signal<boolean>(false);
  readonly customDirection = signal<'horizontal' | 'vertical' | null>(null);

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
      // Find explicit outgoing edges
      let outgoing = edges.filter((e) => e.from === node.id);

      // If no explicit edges exist for non-last node, create default sequential edge to next node
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

  toggleDirection(): void {
    const next = this.activeDirection() === 'vertical' ? 'horizontal' : 'vertical';
    this.customDirection.set(next);
  }

  toggleMermaidSource(): void {
    this.showMermaidSource.update((v) => !v);
  }

  getNodeIcon(node: FlowchartNode): string {
    if (node.icon) return node.icon;
    switch (node.type) {
      case 'start':
        return '▶';
      case 'decision':
        return '◆';
      case 'end':
        return '⏹';
      case 'highlight':
        return '⚡';
      default:
        return '●';
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
}
