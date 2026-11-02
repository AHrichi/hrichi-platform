import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { Step } from '@ah/products/studylm/lessons';
import { SPEEDS, type StepTimeline } from './step-timeline';

/**
 * Play, pause, step, scrub and speed for one stepped visual, with the step's
 * title and narration read out as it changes. The keys (←, →, Space, Home,
 * End) are handled by the visual around it, so they work wherever focus is
 * inside it.
 */
@Component({
  selector: 'sl-step-controls',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @let t = timeline();
    <div class="narration" aria-live="polite">
      @if (current(); as step) {
        <p class="title">
          <span class="count">Step {{ t.index() + 1 }} of {{ t.count() }}</span>
          {{ step.title }}
        </p>
        <p>{{ step.narration }}</p>
      } @else {
        <p class="title">
          <span class="count">{{ t.count() }} steps</span>
          Press play, or → to go one step at a time.
        </p>
      }
      @if (t.held()) {
        <p class="held">Answer the question below to go on.</p>
      }
    </div>
    <div class="controls" role="group" aria-label="Step controls">
      <button
        type="button"
        (click)="t.first()"
        [disabled]="!t.canBack()"
        aria-label="Back to the start"
      >
        ⏮
      </button>
      <button
        type="button"
        (click)="t.back()"
        [disabled]="!t.canBack()"
        aria-label="Previous step"
      >
        ◀
      </button>
      <button
        type="button"
        class="play"
        (click)="t.toggle()"
        [disabled]="
          !t.playing() && !t.canForward() && t.index() < t.count() - 1
        "
        [attr.aria-label]="t.playing() ? 'Pause' : 'Play'"
      >
        {{ t.playing() ? '⏸' : '▶' }}
      </button>
      <button
        type="button"
        (click)="t.forward()"
        [disabled]="!t.canForward()"
        aria-label="Next step"
      >
        ▶▶
      </button>
      <input
        class="scrub"
        type="range"
        min="-1"
        [max]="t.count() - 1"
        [value]="t.index()"
        (input)="scrub($event)"
        aria-label="Step"
        [attr.aria-valuetext]="
          t.index() < 0 ? 'Before the first step' : 'Step ' + (t.index() + 1)
        "
      />
      <label class="speed">
        <span class="visually-hidden">Speed</span>
        <select (change)="setSpeed($event)" aria-label="Speed">
          @for (speed of speeds; track speed) {
            <option [value]="speed" [selected]="speed === t.speed()">
              {{ speed }}×
            </option>
          }
        </select>
      </label>
    </div>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--space-2);
    }
    .narration {
      min-block-size: 4.5em;
      p {
        margin: 0;
      }
    }
    .title {
      font-weight: var(--font-weight-semibold);
    }
    .count {
      margin-inline-end: var(--space-2);
      color: var(--color-text-muted);
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-medium);
    }
    .held {
      margin-block-start: var(--space-1);
      color: var(--color-warning-default);
      font-size: var(--font-size-200);
    }
    .controls {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2);
    }
    button,
    select {
      min-inline-size: 2.75rem;
      min-block-size: 2.75rem;
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md);
      background: var(--color-bg-raised);
      color: var(--color-text-default);
      font: inherit;
      cursor: pointer;
    }
    button:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }
    .play {
      background: var(--color-accent-default);
      color: var(--color-accent-on);
    }
    .scrub {
      flex: 1 1 8rem;
      accent-color: var(--color-accent-default);
    }
    .visually-hidden {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }
  `,
})
export class StepControls {
  readonly timeline = input.required<StepTimeline>();
  readonly steps = input.required<readonly Step<unknown>[]>();
  protected readonly speeds = SPEEDS;

  protected readonly current = computed(
    () => this.steps()[this.timeline().index()] ?? null,
  );

  protected scrub(event: Event): void {
    const timeline = this.timeline();
    timeline.pause();
    timeline.seek(Number((event.target as HTMLInputElement).value));
  }

  protected setSpeed(event: Event): void {
    this.timeline().setSpeed(Number((event.target as HTMLSelectElement).value));
  }
}
