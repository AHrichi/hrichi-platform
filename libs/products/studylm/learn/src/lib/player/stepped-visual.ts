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
  flowStateAt,
  sequenceStateAt,
  stackQueueStateAt,
  type SteppedKind,
  stepsOf,
  walkthroughStateAt,
} from '@ah/products/studylm/lessons';
import { ArrayView } from '../visuals/array-view';
import { FlowView } from '../visuals/flow-view';
import { SequenceView } from '../visuals/sequence-view';
import { StackQueueView } from '../visuals/stack-queue-view';
import { WalkthroughView } from '../visuals/walkthrough-view';
import { injectReducedMotion } from './reduced-motion';
import { StepControls } from './step-controls';
import { StepTimeline } from './step-timeline';

/** A request to show a step, such as a prediction's reveal. */
export interface SeekRequest {
  step: string | null;
  /** Changes with every request, so asking twice works. */
  at: number;
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
    FlowView,
    SequenceView,
    StackQueueView,
    StepControls,
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
      }
    </div>
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
  `,
})
export class SteppedVisual {
  readonly block = input.required<BlockOf<SteppedKind>>();
  /** Check ids already answered: their `pauseFor` steps no longer hold. */
  readonly answered = input<ReadonlySet<string>>(new Set());
  /** The step to open on, from saved progress. */
  readonly start = input(-1);
  readonly seek = input<SeekRequest | null>(null);
  readonly indexChange = output<number>();

  protected readonly timeline = new StepTimeline();
  protected readonly reducedMotion = injectReducedMotion();

  protected readonly steps = computed(() => stepsOf(this.block()));

  /** The block and its state at the current step. */
  protected readonly view = computed(() => {
    const block = this.block();
    const i = this.timeline.index();
    const state = (() => {
      switch (block.kind) {
        case 'array':
          return arrayStateAt(block, i, this.steps() as never);
        case 'stack-queue':
          return stackQueueStateAt(block, i);
        case 'flow':
          return flowStateAt(block, i);
        case 'sequence':
          return sequenceStateAt(block, i);
        case 'code-walkthrough':
          return walkthroughStateAt(block, i);
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
