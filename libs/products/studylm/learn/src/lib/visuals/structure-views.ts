import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  type BlockOf,
  circleLayout,
  type GraphState,
  type GridState,
  type HashState,
  layeredLayout,
  type PlayedRecursion,
  type RecursionState,
  treeLayout,
  type TreeState,
} from '@ah/products/studylm/lessons';

/** Shared look for the SVG diagrams on the dark stage. */
const DIAGRAM_STYLES = `
  .diagram { display: block; inline-size: 100%; max-block-size: 26rem; margin-inline: auto; }
  text { fill: var(--color-stage-text); font-size: 13px; text-anchor: middle; dominant-baseline: central; }
  .muted { fill: var(--sl-muted); font-size: 11px; }
  line, path { stroke: var(--color-stage-border); stroke-width: 2; fill: none; }
  circle, rect { fill: var(--color-stage-bg); stroke: var(--color-stage-border); stroke-width: 2; }
  .visited circle, .visited rect { stroke: var(--color-data-2); }
  .active circle, .active rect { stroke: var(--color-data-3); stroke-width: 3; }
  .done circle, .done rect { stroke: var(--color-data-1); }
  .hot { stroke: var(--color-data-3); stroke-width: 3; }
  .tree-edge { stroke: var(--color-data-2); stroke-width: 3; }
  .strip { display: flex; flex-wrap: wrap; gap: var(--space-1); align-items: center; margin: var(--space-2) 0 0; padding: 0; list-style: none; font-size: var(--font-size-200); }
  .strip .label { color: var(--sl-muted); margin-inline-end: var(--space-1); }
  .chip { padding: 0 var(--space-2); border-radius: var(--radius-pill); background: color-mix(in srgb, var(--color-data-2) 30%, transparent); font-family: var(--font-family-mono); }
`;

// --- hash table ----------------------------------------------------------------

/** Buckets in rows, each with its chain of keys. */
@Component({
  selector: 'sl-hash-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = state();
    <ol class="buckets" dir="ltr">
      @for (chain of s.buckets; track $index) {
        <li [class.active]="s.active?.bucket === $index">
          <span class="index">{{ $index }}</span>
          @for (entry of chain; track entry.key) {
            <span class="entry" [class.key]="s.active?.key === entry.key">
              {{ entry.key
              }}{{ entry.value !== null ? ': ' + entry.value : '' }}
            </span>
          } @empty {
            <span class="empty">empty</span>
          }
        </li>
      }
    </ol>
    @if (s.found !== null) {
      <p class="note">{{ s.found ? 'Found it.' : 'Not in the table.' }}</p>
    }
    @if (s.resized) {
      <p class="note">
        Resized to {{ s.buckets.length }} buckets: every key is hashed again.
      </p>
    }
  `,
  styles: `
    .buckets {
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
      list-style: none;
      font-family: var(--font-family-mono);
    }
    li {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
      padding: var(--space-1) var(--space-2);
      border: 1px solid var(--color-stage-border);
      border-radius: var(--radius-sm);
    }
    li.active {
      border-color: var(--color-data-3);
    }
    .index {
      inline-size: 2ch;
      color: var(--sl-muted);
      text-align: end;
    }
    .entry {
      padding: 0 var(--space-2);
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--color-data-2) 30%, transparent);
    }
    .entry.key {
      outline: 2px solid var(--color-data-3);
    }
    .empty {
      color: var(--sl-muted);
    }
    .note {
      margin: var(--space-2) 0 0;
      color: var(--color-data-3);
    }
  `,
})
export class HashView {
  readonly state = input.required<HashState>();
}

// --- tree ----------------------------------------------------------------------------

const SLOT = 56;
const LEVEL = 64;

/** A tree drawn top-down, with what a traversal has output so far. */
@Component({
  selector: 'sl-tree-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = state();
    <svg
      class="diagram"
      [attr.viewBox]="viewBox()"
      role="img"
      [attr.aria-label]="label()"
      [style.min-inline-size.px]="width() * 0.7"
      [style.max-inline-size.px]="width() * 1.4"
    >
      @for (edge of edges(); track edge.id) {
        <line
          [attr.x1]="edge.x1"
          [attr.y1]="edge.y1"
          [attr.x2]="edge.x2"
          [attr.y2]="edge.y2"
        />
      }
      @for (node of nodes(); track node.id) {
        <g
          [attr.transform]="'translate(' + node.x + ' ' + node.y + ')'"
          [class.visited]="s.visited.includes(node.id)"
          [class.active]="s.active.includes(node.id)"
        >
          <circle r="20" />
          <text>{{ node.label }}</text>
        </g>
      }
    </svg>
    @if (s.compared; as c) {
      <p class="strip">
        <span class="label">Compare</span> {{ c.value }} with
        {{ labelOf(c.node) }}
      </p>
    }
    @if (s.output.length) {
      <ol class="strip" aria-label="Output">
        <li class="label">Output</li>
        @for (value of s.output; track $index) {
          <li class="chip">{{ value }}</li>
        }
      </ol>
    }
  `,
  styles: DIAGRAM_STYLES,
})
export class TreeView {
  readonly block = input.required<BlockOf<'tree'>>();
  readonly state = input.required<TreeState>();

  private readonly layout = computed(() =>
    treeLayout(this.state().nodes, this.block().variant !== 'general'),
  );
  protected readonly width = computed(() => this.layout().width * SLOT + SLOT);
  protected readonly viewBox = computed(
    () => `0 0 ${this.width()} ${this.layout().depth * LEVEL + 24}`,
  );
  private readonly at = (id: string) => {
    const p = this.layout().at.get(id) ?? { x: 0, y: 0 };
    return { x: p.x * SLOT + SLOT, y: p.y * LEVEL + 36 };
  };
  protected readonly nodes = computed(() =>
    this.state().nodes.map((node) => ({ ...node, ...this.at(node.id) })),
  );
  protected readonly edges = computed(() =>
    this.state().nodes.flatMap((node) => {
      if (!node.parent) return [];
      const a = this.at(node.parent);
      const b = this.at(node.id);
      return [{ id: node.id, x1: a.x, y1: a.y + 20, x2: b.x, y2: b.y - 20 }];
    }),
  );
  protected readonly label = computed(
    () => `${this.block().title ?? 'Tree'}: ${this.state().nodes.length} nodes`,
  );

  protected labelOf(id: string): string {
    return this.state().nodes.find((n) => n.id === id)?.label ?? id;
  }
}

// --- graph ------------------------------------------------------------------------

/**
 * A graph: laid out along its edges when directed, on a circle otherwise.
 * The queue or stack and the output show beneath it.
 */
@Component({
  selector: 'sl-graph-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = state();
    <svg
      class="diagram"
      [attr.viewBox]="viewBox()"
      role="img"
      [attr.aria-label]="label()"
      [style.min-inline-size.px]="size().w * 0.6"
      [style.max-inline-size.px]="size().w * 1.4"
    >
      <defs>
        <marker
          [attr.id]="arrowId()"
          viewBox="0 0 10 10"
          refX="10"
          refY="5"
          markerWidth="7"
          markerHeight="7"
          orient="auto-start-reverse"
        >
          <path d="M0,0 L10,5 L0,10 z" class="head" />
        </marker>
      </defs>
      @for (edge of edges(); track edge.id) {
        <line
          [attr.x1]="edge.x1"
          [attr.y1]="edge.y1"
          [attr.x2]="edge.x2"
          [attr.y2]="edge.y2"
          [class.tree-edge]="s.treeEdges.includes(edge.id)"
          [class.hot]="s.activeEdges.includes(edge.id)"
          [attr.marker-end]="
            block().directed ? 'url(#' + arrowId() + ')' : null
          "
        />
        @if (edge.weight !== null) {
          <text class="muted" [attr.x]="edge.mx" [attr.y]="edge.my - 9">
            {{ edge.weight }}
          </text>
        }
      }
      @for (node of nodes(); track node.id) {
        <g
          [attr.transform]="'translate(' + node.x + ' ' + node.y + ')'"
          [class.visited]="s.visited.includes(node.id)"
          [class.active]="s.activeNodes.includes(node.id)"
        >
          <circle r="20" />
          <text>{{ node.label }}</text>
          @if (s.distances[node.id] !== undefined) {
            <text class="muted" y="32">d = {{ s.distances[node.id] }}</text>
          }
        </g>
      }
    </svg>
    <ol class="strip" aria-label="Frontier">
      <li class="label">{{ frontierName() }}</li>
      @for (id of s.frontier; track $index) {
        <li class="chip">{{ labelOf(id) }}</li>
      } @empty {
        <li class="label">empty</li>
      }
    </ol>
    @if (s.output.length) {
      <ol class="strip" aria-label="Order">
        <li class="label">Order</li>
        @for (value of s.output; track $index) {
          <li class="chip">{{ value }}</li>
        }
      </ol>
    }
  `,
  styles: [
    DIAGRAM_STYLES,
    `
      .head {
        fill: var(--color-stage-border);
        stroke: none;
      }
    `,
  ],
})
export class GraphView {
  readonly block = input.required<BlockOf<'graph'>>();
  readonly state = input.required<GraphState>();

  protected readonly arrowId = computed(() => `sl-graph-${this.block().id}`);

  private readonly positions = computed(() => {
    const block = this.block();
    if (!block.directed) {
      const r = Math.max(90, block.nodes.length * 22);
      return circleLayout(
        block.nodes.map((n) => n.id),
        r,
      );
    }
    const layout = layeredLayout({
      direction: 'lr',
      nodes: block.nodes.map((n) => ({ id: n.id, width: 48, height: 48 })),
      edges: block.edges,
    });
    return new Map(layout.nodes.map((n) => [n.id, { x: n.x, y: n.y }]));
  });

  protected readonly size = computed(() => {
    const ps = [...this.positions().values()];
    return {
      w: Math.max(...ps.map((p) => p.x), 0) + 48,
      h: Math.max(...ps.map((p) => p.y), 0) + 48,
    };
  });
  protected readonly viewBox = computed(
    () => `-40 -40 ${this.size().w + 40} ${this.size().h + 40}`,
  );

  protected readonly nodes = computed(() =>
    this.block().nodes.map((n) => ({
      ...n,
      ...(this.positions().get(n.id) ?? { x: 0, y: 0 }),
    })),
  );

  protected readonly edges = computed(() =>
    this.block().edges.map((edge) => {
      const a = this.positions().get(edge.from) ?? { x: 0, y: 0 };
      const b = this.positions().get(edge.to) ?? { x: 0, y: 0 };
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const ux = (b.x - a.x) / len;
      const uy = (b.y - a.y) / len;
      return {
        id: edge.id,
        weight: edge.weight,
        x1: a.x + ux * 20,
        y1: a.y + uy * 20,
        x2: b.x - ux * 22,
        y2: b.y - uy * 22,
        mx: (a.x + b.x) / 2,
        my: (a.y + b.y) / 2,
      };
    }),
  );

  protected readonly frontierName = computed(() => {
    const algorithm = this.block().simulate?.algorithm;
    return algorithm === 'dfs'
      ? 'Stack'
      : algorithm === 'dijkstra'
        ? 'Settled'
        : 'Queue';
  });

  protected readonly label = computed(
    () =>
      `${this.block().title ?? 'Graph'}: ${this.block()
        .nodes.map((n) => n.label)
        .join(', ')}`,
  );

  protected labelOf(id: string): string {
    return this.block().nodes.find((n) => n.id === id)?.label ?? id;
  }
}

// --- grid ------------------------------------------------------------------------------

/** A grid or DP table: walls, the frontier, the path, and values written in. */
@Component({
  selector: 'sl-grid-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = state();
    <table class="grid" dir="ltr" [attr.aria-label]="block().title ?? 'Grid'">
      @if (s.labels; as labels) {
        <tr>
          <th></th>
          <th></th>
          @for (ch of chars(labels.cols); track $index) {
            <th>{{ ch }}</th>
          }
        </tr>
      }
      @for (row of s.cells; track r; let r = $index) {
        <tr>
          @if (s.labels; as labels) {
            <th>{{ r === 0 ? '' : labels.rows[r - 1] }}</th>
          }
          @for (cell of row; track c; let c = $index) {
            <td
              [class.wall]="cell === '#'"
              [class.visited]="s.visited[r][c]"
              [class.frontier]="s.frontier[r][c]"
              [class.path]="s.path[r][c]"
              [class.active]="isActive(r, c)"
            >
              {{ s.values[r][c] ?? (cell === '.' || cell === '#' ? '' : cell) }}
            </td>
          }
        </tr>
      }
    </table>
  `,
  styles: `
    .grid {
      margin-inline: auto;
      border-collapse: separate;
      border-spacing: 3px;
      font-family: var(--font-family-mono);
    }
    td,
    th {
      inline-size: 2.4rem;
      block-size: 2.4rem;
      padding: 0;
      text-align: center;
      font-size: var(--font-size-200);
    }
    th {
      color: var(--sl-muted);
      font-weight: var(--font-weight-semibold);
    }
    td {
      border: 1px solid var(--color-stage-border);
      border-radius: var(--radius-sm);
    }
    .wall {
      background: repeating-linear-gradient(
        45deg,
        var(--sl-muted) 0 3px,
        transparent 3px 7px
      );
    }
    .frontier {
      border-color: var(--color-data-4);
      border-width: 2px;
    }
    .visited {
      background: color-mix(in srgb, var(--color-data-2) 28%, transparent);
    }
    .path {
      background: color-mix(in srgb, var(--color-data-1) 45%, transparent);
    }
    .active {
      outline: 3px solid var(--color-data-3);
    }
  `,
})
export class GridView {
  readonly block = input.required<BlockOf<'grid'>>();
  readonly state = input.required<GridState>();

  protected chars(text: string): string[] {
    return ['', ...text];
  }

  protected isActive(r: number, c: number): boolean {
    return this.state().active.some(([ar, ac]) => ar === r && ac === c);
  }
}

// --- recursion tree --------------------------------------------------------------------

/** Calls as a tree, coloured by state, with the call stack beside it. */
@Component({
  selector: 'sl-recursion-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = state();
    <svg
      class="diagram"
      [attr.viewBox]="viewBox()"
      role="img"
      [attr.aria-label]="block().fn + ' calls'"
      [style.min-inline-size.px]="width() * 0.7"
      [style.max-inline-size.px]="width() * 1.4"
    >
      @for (edge of edges(); track edge.id) {
        <line
          [attr.x1]="edge.x1"
          [attr.y1]="edge.y1"
          [attr.x2]="edge.x2"
          [attr.y2]="edge.y2"
        />
      }
      @for (call of calls(); track call.id) {
        @if (s.status[call.id] !== 'waiting') {
          <g
            [attr.transform]="'translate(' + call.x + ' ' + call.y + ')'"
            [class.active]="s.active.includes(call.id)"
            [class.visited]="s.status[call.id] === 'open'"
            [class.done]="
              s.status[call.id] === 'returned' || s.status[call.id] === 'memo'
            "
          >
            <rect x="-34" y="-14" width="68" height="28" rx="8" />
            <text>{{ call.label }}</text>
            @if (s.values[call.id] !== undefined) {
              <text class="muted" y="24">
                {{ s.status[call.id] === 'memo' ? 'cached ' : '= '
                }}{{ s.values[call.id] }}
              </text>
            }
          </g>
        }
      }
    </svg>
    <ol class="strip" aria-label="Call stack">
      <li class="label">Stack</li>
      @for (id of s.stack; track id) {
        <li class="chip">{{ labelOf(id) }}</li>
      } @empty {
        <li class="label">empty</li>
      }
    </ol>
  `,
  styles: DIAGRAM_STYLES,
})
export class RecursionView {
  readonly block = input.required<BlockOf<'recursion-tree'>>();
  readonly played = input.required<PlayedRecursion>();
  readonly state = input.required<RecursionState>();

  private readonly layout = computed(() =>
    treeLayout(
      this.played().calls.map((c) => ({
        id: c.id,
        label: c.label,
        parent: c.parent,
        side: null,
      })),
      false,
    ),
  );
  private readonly slot = 80;
  protected readonly width = computed(
    () => this.layout().width * this.slot + this.slot,
  );
  protected readonly viewBox = computed(
    () => `0 0 ${this.width()} ${this.layout().depth * 70 + 30}`,
  );
  private readonly at = (id: string) => {
    const p = this.layout().at.get(id) ?? { x: 0, y: 0 };
    return { x: p.x * this.slot + this.slot, y: p.y * 70 + 24 };
  };
  protected readonly calls = computed(() =>
    this.played().calls.map((c) => ({ ...c, ...this.at(c.id) })),
  );
  protected readonly edges = computed(() =>
    this.played().calls.flatMap((c) => {
      if (!c.parent || this.state().status[c.id] === 'waiting') return [];
      const a = this.at(c.parent);
      const b = this.at(c.id);
      return [{ id: c.id, x1: a.x, y1: a.y + 14, x2: b.x, y2: b.y - 14 }];
    }),
  );

  protected labelOf(id: string): string {
    return this.played().calls.find((c) => c.id === id)?.label ?? id;
  }
}
