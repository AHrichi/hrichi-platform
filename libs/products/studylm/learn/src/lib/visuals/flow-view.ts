import {
  afterRenderEffect,
  ChangeDetectionStrategy,
  Component,
  computed,
  type ElementRef,
  input,
  viewChildren,
} from '@angular/core';
import {
  type BlockOf,
  type FlowState,
  layeredLayout,
} from '@ah/products/studylm/lessons';

const NODE_W = 132;
const NODE_H = 56;
const PAD = 24;
/** How long a packet takes to cross an edge, at 1×. */
const TRAVEL_MS = 900;

const ICONS: Record<string, string> = {
  user: '👤',
  browser: '🌐',
  client: '💻',
  gateway: '🚪',
  server: '🖥️',
  service: '⚙️',
  function: 'ƒ',
  database: '🗄️',
  cache: '⚡',
  queue: '📬',
  storage: '📦',
  external: '☁️',
  process: '🔄',
};

/**
 * A system as boxes and arrows, laid out in layers along the flow, with
 * packets that travel the edges on the steps that send them.
 */
@Component({
  selector: 'sl-flow-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = state();
    <svg
      class="diagram"
      [attr.viewBox]="viewBox()"
      [style.min-inline-size.px]="minWidth()"
      role="img"
      [attr.aria-label]="label()"
    >
      <defs>
        <marker
          [attr.id]="arrowId()"
          viewBox="0 0 10 10"
          refX="9"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" class="arrowhead" />
        </marker>
      </defs>
      @for (edge of edges(); track edge.id) {
        <g
          class="edge"
          [class.visited]="s.visitedEdges.includes(edge.id)"
          [class.highlighted]="s.highlighted.includes(edge.id)"
          [class.failed]="s.failedEdges.includes(edge.id)"
        >
          <path
            [attr.d]="edge.d"
            [attr.marker-end]="'url(#' + arrowId() + ')'"
          />
          @if (edge.label) {
            <text
              [attr.x]="edge.mid[0]"
              [attr.y]="edge.mid[1] - 6"
              class="edge-label"
            >
              {{ edge.label }}
            </text>
          }
        </g>
      }
      @for (node of nodes(); track node.id) {
        <g
          class="node"
          [attr.transform]="'translate(' + node.x + ' ' + node.y + ')'"
          [class.visited]="s.visitedNodes.includes(node.id)"
          [class.highlighted]="s.highlighted.includes(node.id)"
          [attr.data-status]="s.nodes[node.id] ?? 'idle'"
        >
          <rect
            [attr.x]="-w / 2"
            [attr.y]="-h / 2"
            [attr.width]="w"
            [attr.height]="h"
            rx="10"
          />
          <text class="icon" x="0" y="-6" aria-hidden="true">
            {{ node.icon }}
          </text>
          <text class="node-label" x="0" y="14">{{ node.label }}</text>
        </g>
      }
      @for (packet of packets(); track packet.key) {
        <g #packet class="packet" [attr.data-path]="packet.path">
          <circle r="9" />
          <text y="-14">{{ packet.label }}</text>
        </g>
      }
    </svg>
    @if (payloads().length) {
      <ul class="payloads">
        @for (packet of payloads(); track packet.key) {
          <li>
            <span class="packet-name">{{ packet.label }}</span>
            <code>{{ packet.payload }}</code>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: block;
    }
    .diagram {
      display: block;
      inline-size: 100%;
      max-block-size: 26rem;
    }
    .edge path {
      fill: none;
      stroke: var(--color-stage-muted);
      stroke-width: 2;
    }
    .edge.visited path {
      stroke: var(--color-data-2);
    }
    .edge.highlighted path {
      stroke: var(--color-data-3);
      stroke-width: 3;
    }
    .edge.failed path {
      stroke: var(--color-data-5);
      stroke-dasharray: 6 4;
    }
    .arrowhead {
      fill: var(--color-stage-muted);
    }
    .edge-label,
    .node-label,
    .icon,
    .packet text {
      fill: var(--color-stage-text);
      font-size: 12px;
      text-anchor: middle;
    }
    .edge-label {
      fill: var(--sl-muted);
      font-size: 11px;
    }
    .icon {
      font-size: 16px;
    }
    .node rect {
      fill: var(--color-stage-bg);
      stroke: var(--color-stage-border);
      stroke-width: 2;
    }
    .node.visited rect {
      stroke: var(--color-data-2);
    }
    .node.highlighted rect,
    .node[data-status='active'] rect {
      stroke: var(--color-data-3);
      stroke-width: 3;
    }
    .node[data-status='stored'] rect {
      stroke: var(--color-data-1);
      stroke-width: 3;
    }
    .node[data-status='failed'] rect {
      stroke: var(--color-data-5);
      stroke-width: 3;
    }
    .packet circle {
      fill: var(--color-data-3);
    }
    .packet text {
      font-family: var(--font-family-mono);
      font-weight: 600;
    }
    .payloads {
      display: grid;
      gap: var(--space-1);
      margin: var(--space-2) 0 0;
      padding: 0;
      list-style: none;
    }
    .payloads li {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2);
      align-items: baseline;
    }
    .packet-name {
      color: var(--color-data-3);
      font-family: var(--font-family-mono);
      font-weight: var(--font-weight-semibold);
    }
    code {
      overflow-wrap: anywhere;
      color: var(--color-stage-text);
      font-family: var(--font-family-mono);
      font-size: var(--font-size-100);
    }
  `,
})
export class FlowView {
  readonly block = input.required<BlockOf<'flow'>>();
  readonly state = input.required<FlowState>();
  readonly speed = input(1);
  readonly reducedMotion = input(false);

  protected readonly w = NODE_W;
  protected readonly h = NODE_H;
  protected readonly arrowId = computed(() => `sl-arrow-${this.block().id}`);

  private readonly layout = computed(() => {
    const block = this.block();
    return layeredLayout({
      direction: block.direction,
      nodes: block.nodes.map((node) => ({
        id: node.id,
        width: NODE_W,
        height: NODE_H,
      })),
      edges: block.edges,
    });
  });

  protected readonly viewBox = computed(() => {
    const { width, height } = this.layout();
    return `${-PAD} ${-PAD - 8} ${width + PAD * 2} ${height + PAD * 2 + 8}`;
  });

  /** On a phone the diagram scrolls sideways rather than shrink unreadably. */
  protected readonly minWidth = computed(() => this.layout().width * 0.6);

  protected readonly nodes = computed(() => {
    const at = new Map(this.layout().nodes.map((n) => [n.id, n]));
    return this.block().nodes.map((node) => ({
      ...node,
      icon: ICONS[node.type] ?? '•',
      x: at.get(node.id)?.x ?? 0,
      y: at.get(node.id)?.y ?? 0,
    }));
  });

  private readonly points = computed(
    () => new Map(this.layout().edges.map((e) => [e.id, e.points])),
  );

  protected readonly edges = computed(() =>
    this.block().edges.map((edge) => {
      const points = this.points().get(edge.id) ?? [];
      const mid = points[Math.floor(points.length / 2)] ?? [0, 0];
      return {
        ...edge,
        d: points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' '),
        mid,
      };
    }),
  );

  protected readonly packets = computed(() =>
    this.state().packets.map((packet, i) => {
      const points = [...(this.points().get(packet.edge) ?? [])];
      if (packet.direction === 'back') points.reverse();
      return {
        key: `${packet.edge}-${i}-${packet.direction}`,
        label: packet.label ?? '',
        payload: packet.payload,
        path: JSON.stringify(points),
      };
    }),
  );

  protected readonly payloads = computed(() =>
    this.packets().filter((packet) => packet.payload),
  );

  protected readonly label = computed(() => {
    const block = this.block();
    return `${block.title ?? 'Data flow'}: ${block.nodes.map((n) => n.label).join(', ')}`;
  });

  private readonly packetRefs = viewChildren<ElementRef<SVGGElement>>('packet');

  constructor() {
    // Packets travel their edge; with reduced motion they appear at the end.
    afterRenderEffect(() => {
      const duration = TRAVEL_MS / this.speed();
      const instant = this.reducedMotion();
      for (const ref of this.packetRefs()) {
        const el = ref.nativeElement;
        const points = JSON.parse(el.dataset['path'] ?? '[]') as [
          number,
          number,
        ][];
        if (!points.length) continue;
        const frames = points.map(([x, y]) => ({
          transform: `translate(${x}px, ${y}px)`,
        }));
        if (instant || typeof el.animate !== 'function') {
          el.style.transform = frames[frames.length - 1].transform;
          continue;
        }
        el.getAnimations().forEach((a) => a.cancel());
        el.animate(frames, {
          duration,
          easing: 'ease-in-out',
          fill: 'forwards',
        });
      }
    });
  }
}
