import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import {
  type BlockOf,
  type ConceptMapState,
  type EventLoopState,
  type GitState,
  layeredLayout,
  type PipelineState,
  type StateMachineState,
} from '@ah/products/studylm/lessons';

const DIAGRAM_STYLES = `
  .diagram { display: block; inline-size: 100%; max-block-size: 26rem; margin-inline: auto; }
  text { fill: var(--color-stage-text); font-size: 13px; text-anchor: middle; dominant-baseline: central; }
  .muted { fill: var(--sl-muted); font-size: 11px; }
  path, line { stroke: var(--color-stage-border); stroke-width: 2; fill: none; }
  rect, circle { fill: var(--color-stage-bg); stroke: var(--color-stage-border); stroke-width: 2; }
  .visited rect, .visited circle { stroke: var(--color-data-2); }
  .current rect, .current circle { stroke: var(--color-data-3); stroke-width: 3; }
  .hot { stroke: var(--color-data-3); stroke-width: 3; }
  .head { fill: var(--color-stage-border); stroke: none; }
  .note { margin: var(--space-2) 0 0; color: var(--color-data-5); font-size: var(--font-size-200); }
`;

interface Box {
  id: string;
  label: string;
}

/** Boxes laid out in layers along their edges, with polylines between. */
function layered(
  boxes: Box[],
  edges: { id: string; from: string; to: string }[],
  width = 120,
  height = 44,
) {
  const layout = layeredLayout({
    direction: 'lr',
    nodes: boxes.map((b) => ({ id: b.id, width, height })),
    edges,
  });
  return {
    viewBox: `-20 -20 ${layout.width + 40} ${layout.height + 40}`,
    width: layout.width,
    at: new Map(layout.nodes.map((n) => [n.id, n])),
    paths: new Map(
      layout.edges.map((e) => [
        e.id,
        {
          d: e.points.map(([x, y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' '),
          mid: e.points[Math.floor(e.points.length / 2)] ?? [0, 0],
        },
      ]),
    ),
  };
}

// --- state machine --------------------------------------------------------------------

@Component({
  selector: 'sl-state-machine-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = state();
    @let l = layout();
    <svg
      class="diagram"
      [attr.viewBox]="l.viewBox"
      role="img"
      [attr.aria-label]="
        (block().title ?? 'States') + ', now ' + labelOf(s.current)
      "
      [style.min-inline-size.px]="l.width * 0.6"
      [style.max-inline-size.px]="l.width * 1.4"
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
          <path d="M0,0 L10,5 L0,10 z" class="head" />
        </marker>
      </defs>
      @for (t of block().transitions; track t.id) {
        @let p = l.paths.get(t.id);
        @if (p) {
          <path
            [attr.d]="p.d"
            [class.hot]="s.fired === t.id"
            [attr.marker-end]="'url(#' + arrowId() + ')'"
          />
          <text class="muted" [attr.x]="p.mid[0]" [attr.y]="p.mid[1] - 10">
            {{ t.event }}
          </text>
        }
      }
      @for (st of block().states; track st.id) {
        @let at = l.at.get(st.id);
        @if (at) {
          <g
            [attr.transform]="'translate(' + at.x + ' ' + at.y + ')'"
            [class.visited]="s.visited.includes(st.id)"
            [class.current]="s.current === st.id"
          >
            <rect
              x="-60"
              y="-22"
              width="120"
              height="44"
              [attr.rx]="st.final ? 22 : 10"
            />
            <text>{{ st.label }}</text>
          </g>
        }
      }
    </svg>
    @if (s.rejected) {
      <p class="note">
        “{{ s.rejected }}” is ignored: {{ labelOf(s.current) }} has no
        transition for it.
      </p>
    }
  `,
  styles: DIAGRAM_STYLES,
})
export class StateMachineView {
  readonly block = input.required<BlockOf<'state-machine'>>();
  readonly state = input.required<StateMachineState>();
  protected readonly arrowId = computed(() => `sl-sm-${this.block().id}`);
  protected readonly layout = computed(() =>
    layered(this.block().states, this.block().transitions),
  );
  protected labelOf(id: string | null): string {
    return this.block().states.find((s) => s.id === id)?.label ?? '—';
  }
}

// --- pipeline ----------------------------------------------------------------------------

@Component({
  selector: 'sl-pipeline-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = state();
    <ol class="stages" dir="ltr">
      @for (stage of block().stages; track stage.id) {
        <li
          [class.active]="s.active === stage.id"
          [class.failed]="s.failed === stage.id"
        >
          <p class="name">{{ stage.label }}</p>
          @if (stage.detail) {
            <p class="detail">{{ stage.detail }}</p>
          }
          @if (s.data[stage.id] !== undefined) {
            <code>{{ s.data[stage.id] }}</code>
          }
        </li>
      }
    </ol>
    @if (s.emitted.length) {
      <p class="out">
        Out: <code>{{ s.emitted.at(-1) }}</code>
      </p>
    }
  `,
  styles: `
    .stages {
      display: flex;
      gap: var(--space-2);
      margin: 0;
      padding: 0;
      overflow-x: auto;
      list-style: none;
    }
    li {
      flex: 1 0 9rem;
      display: grid;
      align-content: start;
      gap: var(--space-1);
      padding: var(--space-2);
      border: 2px solid var(--color-stage-border);
      border-radius: var(--radius-md);
    }
    li.active {
      border-color: var(--color-data-3);
    }
    li.failed {
      border-color: var(--color-data-5);
    }
    p {
      margin: 0;
    }
    .name {
      font-weight: var(--font-weight-semibold);
    }
    .detail {
      color: var(--sl-muted);
      font-size: var(--font-size-100);
    }
    code {
      overflow-wrap: anywhere;
      font-family: var(--font-family-mono);
      font-size: var(--font-size-100);
      color: var(--color-data-2);
    }
    .out {
      margin: var(--space-2) 0 0;
    }
  `,
})
export class PipelineView {
  readonly block = input.required<BlockOf<'pipeline'>>();
  readonly state = input.required<PipelineState>();
}

// --- event loop --------------------------------------------------------------------------

/** The call stack, the Web APIs, both queues and the console, side by side. */
@Component({
  selector: 'sl-event-loop-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = state();
    <div class="panels" dir="ltr">
      <section aria-label="Call stack">
        <p class="title">Call stack</p>
        <ol class="stack">
          @for (frame of s.stack; track $index) {
            <li [class.top]="$last">{{ frame }}</li>
          }
        </ol>
      </section>
      <section aria-label="Web APIs">
        <p class="title">Web APIs</p>
        <ol>
          @for (item of s.webApis; track $index) {
            <li>{{ item }}</li>
          }
        </ol>
      </section>
      <section aria-label="Microtask queue">
        <p class="title">Microtasks</p>
        <ol>
          @for (item of s.microtasks; track $index) {
            <li class="micro">{{ item }}</li>
          }
        </ol>
      </section>
      <section aria-label="Task queue">
        <p class="title">Tasks</p>
        <ol>
          @for (item of s.tasks; track $index) {
            <li class="task">{{ item }}</li>
          }
        </ol>
      </section>
      <section class="console" aria-label="Console">
        <p class="title">Console</p>
        <ol>
          @for (line of s.console; track $index) {
            <li [class.new]="$last && s.last?.op === 'log'">{{ line }}</li>
          }
        </ol>
      </section>
    </div>
  `,
  styles: `
    .panels {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(8.5rem, 1fr));
      gap: var(--space-2);
    }
    section {
      padding: var(--space-2);
      border: 1px solid var(--color-stage-border);
      border-radius: var(--radius-md);
      min-block-size: 7rem;
    }
    .title {
      margin: 0 0 var(--space-1);
      color: var(--sl-muted);
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-bold);
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    ol {
      display: grid;
      gap: 4px;
      margin: 0;
      padding: 0;
      list-style: none;
      font-family: var(--font-family-mono);
      font-size: var(--font-size-100);
    }
    .stack {
      display: flex;
      flex-direction: column-reverse;
    }
    li {
      padding: 2px var(--space-2);
      border-radius: var(--radius-sm);
      background: color-mix(in srgb, var(--color-data-2) 25%, transparent);
      overflow-wrap: anywhere;
    }
    .top {
      outline: 2px solid var(--color-data-3);
    }
    .micro {
      background: color-mix(in srgb, var(--color-data-4) 30%, transparent);
    }
    .task {
      background: color-mix(in srgb, var(--color-data-6) 30%, transparent);
    }
    .console li {
      background: none;
    }
    .console .new {
      color: var(--color-data-3);
      font-weight: 700;
    }
  `,
})
export class EventLoopView {
  readonly state = input.required<EventLoopState>();
}

// --- git graph ------------------------------------------------------------------------------

const COL = 56;
const LANE = 48;

/** Commits left to right, one lane per branch, with the refs at their tips. */
@Component({
  selector: 'sl-git-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = state();
    <svg
      class="diagram"
      [attr.viewBox]="viewBox()"
      role="img"
      [attr.aria-label]="(block().title ?? 'History') + ', HEAD on ' + s.head"
      [style.min-inline-size.px]="width() * 0.7"
      [style.max-inline-size.px]="width() * 1.4"
    >
      @for (edge of edges(); track edge.key) {
        <path [attr.d]="edge.d" />
      }
      @for (c of commits(); track c.id) {
        <g
          [attr.transform]="'translate(' + c.x + ' ' + c.y + ')'"
          [class.current]="s.active.includes(c.id)"
          [class.visited]="c.parents.length > 1"
        >
          <circle r="11" />
          <text class="muted" y="22">{{ c.id }}</text>
        </g>
      }
      @for (r of refs(); track r.name) {
        <g
          [attr.transform]="
            'translate(' + r.x + ' ' + (r.y - 30 - r.stack * 16) + ')'
          "
        >
          <text [class.muted]="!r.head" [attr.font-weight]="r.head ? 700 : 400">
            {{ r.head ? 'HEAD → ' : '' }}{{ r.tag ? '🏷 ' : '' }}{{ r.name }}
          </text>
        </g>
      }
    </svg>
  `,
  styles: DIAGRAM_STYLES,
})
export class GitView {
  readonly block = input.required<BlockOf<'git-graph'>>();
  readonly state = input.required<GitState>();

  private readonly pos = computed(() => {
    const s = this.state();
    return new Map(
      s.commits.map((c, i) => [
        c.id,
        {
          x: 40 + i * COL,
          y: 50 + Math.max(0, s.lanes.indexOf(c.branch)) * LANE,
        },
      ]),
    );
  });
  protected readonly width = computed(
    () => this.state().commits.length * COL + 80,
  );
  protected readonly viewBox = computed(
    () => `0 0 ${this.width()} ${this.state().lanes.length * LANE + 70}`,
  );
  protected readonly commits = computed(() =>
    this.state().commits.map((c) => ({
      ...c,
      ...(this.pos().get(c.id) ?? { x: 0, y: 0 }),
    })),
  );
  protected readonly edges = computed(() =>
    this.state().commits.flatMap((c) =>
      c.parents.flatMap((p) => {
        const a = this.pos().get(p);
        const b = this.pos().get(c.id);
        if (!a || !b) return [];
        const mid = (a.x + b.x) / 2;
        return [
          {
            key: `${p}-${c.id}`,
            d: `M${a.x},${a.y} C${mid},${a.y} ${mid},${b.y} ${b.x},${b.y}`,
          },
        ];
      }),
    ),
  );
  protected readonly refs = computed(() => {
    const s = this.state();
    const stacked = new Map<string, number>();
    const place = (name: string, commit: string, tag: boolean) => {
      const at = this.pos().get(commit) ?? { x: 0, y: 0 };
      const stack = stacked.get(commit) ?? 0;
      stacked.set(commit, stack + 1);
      return { name, tag, head: !tag && name === s.head, stack, ...at };
    };
    return [
      ...Object.entries(s.branches).map(([name, commit]) =>
        place(name, commit, false),
      ),
      ...Object.entries(s.tags).map(([name, commit]) =>
        place(name, commit, true),
      ),
    ];
  });
}

// --- concept map ------------------------------------------------------------------------------

@Component({
  selector: 'sl-concept-map-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let s = state();
    @let l = layout();
    <svg
      class="diagram"
      [attr.viewBox]="l.viewBox"
      role="img"
      [attr.aria-label]="block().title ?? 'Concept map'"
      [style.min-inline-size.px]="l.width * 0.6"
      [style.max-inline-size.px]="l.width * 1.4"
    >
      @for (link of block().links; track link.id) {
        @let p = l.paths.get(link.id);
        @if (p && s.shown.includes(link.id)) {
          <path [attr.d]="p.d" [class.hot]="s.highlighted.includes(link.id)" />
          <text class="muted" [attr.x]="p.mid[0]" [attr.y]="p.mid[1] - 10">
            {{ link.label }}
          </text>
        }
      }
      @for (node of block().nodes; track node.id) {
        @let at = l.at.get(node.id);
        @if (at && s.shown.includes(node.id)) {
          <g
            [attr.transform]="'translate(' + at.x + ' ' + at.y + ')'"
            [class.current]="s.highlighted.includes(node.id)"
          >
            <rect x="-66" y="-20" width="132" height="40" rx="20" />
            <text>{{ node.label }}</text>
          </g>
        }
      }
    </svg>
  `,
  styles: DIAGRAM_STYLES,
})
export class ConceptMapView {
  readonly block = input.required<BlockOf<'concept-map'>>();
  readonly state = input.required<ConceptMapState>();
  protected readonly layout = computed(() =>
    layered(this.block().nodes, this.block().links, 132, 40),
  );
}
