import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  output,
  untracked,
} from '@angular/core';
import {
  arrayStateAt,
  type BlockOf,
  conceptMapStateAt,
  eventLoopStateAt,
  flowStateAt,
  gitStateAt,
  graphStateAt,
  gridStateAt,
  hashStateAt,
  pipelineStateAt,
  recursionStateAt,
  sequenceStateAt,
  simulateRecursion,
  stackQueueStateAt,
  stateMachineStateAt,
  type Step,
  type SteppedKind,
  stepsOf,
  treeStateAt,
  walkthroughStateAt,
} from '@ah/products/studylm/lessons';
import { ArrayView } from '../visuals/array-view';
import { CodeTraceView } from '../visuals/code-trace-view';
import { FlowView } from '../visuals/flow-view';
import { SequenceView } from '../visuals/sequence-view';
import { StackQueueView } from '../visuals/stack-queue-view';
import {
  GraphView,
  GridView,
  HashView,
  RecursionView,
  TreeView,
} from '../visuals/structure-views';
import {
  ConceptMapView,
  EventLoopView,
  GitView,
  PipelineView,
  StateMachineView,
} from '../visuals/system-views';
import { WalkthroughView } from '../visuals/walkthrough-view';
import { playCodeTrace, playEventLoop } from './executed';
import { injectReducedMotion } from './reduced-motion';
import { StepControls } from './step-controls';
import { StepTimeline } from './step-timeline';

/** A request to show a step, such as a prediction's reveal. */
export interface SeekRequest {
  step: string | null;
  /** Changes with every request, so asking twice works. */
  at: number;
}

/** What a block plays: its steps, and what its view needs besides. */
interface Played {
  steps: readonly Step<unknown>[];
  extra: unknown;
  executed: boolean;
  note: string | null;
}

/**
 * One stepped visual with its controls. The learner moves through discrete
 * steps (Tversky et al., 2002) at their own pace, by buttons, the scrub bar
 * or the keys ←, →, Space, Home and End.
 */
@Component({
  selector: 'sl-stepped-visual',
  imports: [
    ArrayView,
    CodeTraceView,
    ConceptMapView,
    EventLoopView,
    FlowView,
    GitView,
    GraphView,
    GridView,
    HashView,
    PipelineView,
    RecursionView,
    SequenceView,
    StackQueueView,
    StateMachineView,
    StepControls,
    TreeView,
    WalkthroughView,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'group',
    tabindex: '0',
    '[attr.aria-label]': '(block().title ?? "Visual") + ", stepped"',
    '(keydown)': 'onKey($event)',
  },
  template: `
    @let v = view();
    <div class="stage">
      @switch (v.kind) {
        @case ('array') {
          <sl-array-view [state]="$any(v.state)" />
        }
        @case ('stack-queue') {
          <sl-stack-queue-view
            [block]="$any(v.block)"
            [state]="$any(v.state)"
          />
        }
        @case ('flow') {
          <sl-flow-view
            [block]="$any(v.block)"
            [state]="$any(v.state)"
            [speed]="timeline.speed()"
            [reducedMotion]="reducedMotion()"
          />
        }
        @case ('sequence') {
          <sl-sequence-view [block]="$any(v.block)" [state]="$any(v.state)" />
        }
        @case ('code-walkthrough') {
          <sl-walkthrough-view
            [block]="$any(v.block)"
            [state]="$any(v.state)"
          />
        }
        @case ('hash-table') {
          <sl-hash-view [state]="$any(v.state)" />
        }
        @case ('tree') {
          <sl-tree-view [block]="$any(v.block)" [state]="$any(v.state)" />
        }
        @case ('graph') {
          <sl-graph-view [block]="$any(v.block)" [state]="$any(v.state)" />
        }
        @case ('grid') {
          <sl-grid-view [block]="$any(v.block)" [state]="$any(v.state)" />
        }
        @case ('recursion-tree') {
          <sl-recursion-view
            [block]="$any(v.block)"
            [played]="$any(played().extra)"
            [state]="$any(v.state)"
          />
        }
        @case ('state-machine') {
          <sl-state-machine-view
            [block]="$any(v.block)"
            [state]="$any(v.state)"
          />
        }
        @case ('pipeline') {
          <sl-pipeline-view [block]="$any(v.block)" [state]="$any(v.state)" />
        }
        @case ('event-loop') {
          <pre
            class="snippet"
            dir="ltr"
          ><code>{{ $any(v.block).code }}</code></pre>
          <sl-event-loop-view [state]="$any(v.state)" />
        }
        @case ('git-graph') {
          <sl-git-view [block]="$any(v.block)" [state]="$any(v.state)" />
        }
        @case ('concept-map') {
          <sl-concept-map-view
            [block]="$any(v.block)"
            [state]="$any(v.state)"
          />
        }
        @case ('code-trace') {
          <sl-code-trace-view
            [code]="$any(v.block).code"
            [frame]="$any(v.state)"
            [executed]="played().executed"
          />
        }
      }
    </div>
    @if (played().note; as note) {
      <p class="note">{{ note }}</p>
    }
    <sl-step-controls [timeline]="timeline" [steps]="steps()" />
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-3);
      padding: var(--space-3);
      border-radius: var(--radius-lg);
      background: var(--color-stage-bg);
      color: var(--color-stage-text);
      /* --color-stage-muted is for lines; text needs 4.5:1 on the stage. */
      --sl-muted: color-mix(
        in srgb,
        var(--color-stage-text) 72%,
        var(--color-stage-bg)
      );
      --color-text-default: var(--color-stage-text);
      --color-text-muted: var(--sl-muted);
      --color-border-default: var(--color-stage-border);
      --color-bg-raised: color-mix(
        in srgb,
        var(--color-stage-text) 10%,
        transparent
      );
    }
    :host(:focus-visible) {
      outline: 3px solid var(--color-accent-default);
      outline-offset: 2px;
    }
    .stage {
      overflow-x: auto;
      padding-block: var(--space-2);
    }
    .snippet {
      margin: 0 0 var(--space-2);
      font-family: var(--font-family-mono);
      font-size: var(--font-size-200);
      white-space: pre-wrap;
    }
    .note {
      margin: 0;
      color: var(--sl-muted);
      font-size: var(--font-size-200);
    }
  `,
})
export class SteppedVisual {
  readonly block = input.required<BlockOf<SteppedKind | 'code-trace'>>();
  /** Check ids already answered: their `pauseFor` steps no longer hold. */
  readonly answered = input<ReadonlySet<string>>(new Set());
  /** The step to open on, from saved progress. */
  readonly start = input(-1);
  readonly seek = input<SeekRequest | null>(null);
  readonly indexChange = output<number>();

  protected readonly timeline = new StepTimeline();
  protected readonly reducedMotion = injectReducedMotion();

  /**
   * What the block plays: steps computed by a simulator or the tracer where
   * they can be, and anything else its view needs.
   */
  protected readonly played = computed<Played>(() => {
    const block = this.block();
    switch (block.kind) {
      case 'code-trace': {
        const trace = playCodeTrace(block);
        return {
          steps: trace.steps,
          extra: trace.frames,
          executed: trace.executed,
          note: trace.note,
        };
      }
      case 'event-loop': {
        const loop = playEventLoop(block);
        return {
          steps: loop.steps,
          extra: loop.steps,
          executed: block.mode === 'execute',
          note: loop.note,
        };
      }
      case 'recursion-tree': {
        const recursion = simulateRecursion(block);
        return {
          steps: recursion.steps,
          extra: recursion,
          executed: false,
          note: null,
        };
      }
      default:
        return {
          steps: stepsOf(block),
          extra: null,
          executed: false,
          note: null,
        };
    }
  });
  protected readonly steps = computed(() => this.played().steps);

  /** The block and its state at the current step. */
  protected readonly view = computed(() => {
    const block = this.block();
    const i = this.timeline.index();
    const steps = this.steps() as never;
    const extra = this.played().extra as never;
    const state = (() => {
      switch (block.kind) {
        case 'array':
          return arrayStateAt(block, i, steps);
        case 'stack-queue':
          return stackQueueStateAt(block, i);
        case 'flow':
          return flowStateAt(block, i);
        case 'sequence':
          return sequenceStateAt(block, i);
        case 'code-walkthrough':
          return walkthroughStateAt(block, i);
        case 'hash-table':
          return hashStateAt(block, i);
        case 'tree':
          return treeStateAt(block, i, steps);
        case 'graph':
          return graphStateAt(block, i, steps);
        case 'grid':
          return gridStateAt(block, i, steps);
        case 'recursion-tree':
          return recursionStateAt(block, i, extra);
        case 'state-machine':
          return stateMachineStateAt(block, i);
        case 'pipeline':
          return pipelineStateAt(block, i);
        case 'event-loop':
          return eventLoopStateAt({ steps: extra }, i);
        case 'git-graph':
          return gitStateAt(block, i);
        case 'concept-map':
          return conceptMapStateAt(block, i);
        case 'code-trace':
          return (extra as unknown[])[i] ?? null;
      }
    })();
    return { kind: block.kind, block, state };
  });

  constructor() {
    // A new block starts on its saved step.
    effect(() => {
      const count = this.steps().length;
      const start = untracked(() => this.start());
      this.timeline.reset(count, start);
    });
    effect(() => {
      const answered = this.answered();
      const holds = new Set<number>();
      this.steps().forEach((step, i) => {
        if (step.pauseFor && !answered.has(step.pauseFor)) holds.add(i);
      });
      this.timeline.holds.set(holds);
    });
    effect(() => {
      const request = this.seek();
      if (!request) return;
      const index = request.step
        ? this.steps().findIndex((step) => step.id === request.step)
        : untracked(() => this.timeline.limit());
      untracked(() => {
        this.timeline.pause();
        this.timeline.seek(index);
      });
    });
    effect(() => this.indexChange.emit(this.timeline.index()));
    inject(DestroyRef).onDestroy(() => this.timeline.pause());
  }

  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement;
    if (target.matches('input, select, textarea')) return;
    const t = this.timeline;
    const actions: Record<string, () => void> = {
      ArrowRight: () => t.forward(),
      ArrowLeft: () => t.back(),
      ' ': () => t.toggle(),
      Home: () => t.first(),
      End: () => t.last(),
    };
    const act = actions[event.key];
    // Space on a button presses it; the visual shouldn't toggle as well.
    if (!act || (event.key === ' ' && target.matches('button'))) return;
    event.preventDefault();
    act();
  }
}
