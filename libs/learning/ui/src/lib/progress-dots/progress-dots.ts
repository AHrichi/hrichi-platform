import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

/**
 * Progress dots for a Daily Set or bonus round, carrying accessible progress
 * attributes (`role="progressbar"`) and an optional trailing slot (e.g. streak flame).
 */
@Component({
  selector: 'lrn-progress-dots',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      class="progress"
      role="progressbar"
      [attr.aria-label]="label()"
      [attr.aria-valuenow]="clampedDone()"
      aria-valuemin="0"
      [attr.aria-valuemax]="safeTotal()"
    >
      <div class="dots" aria-hidden="true">
        @for (filled of dots(); track $index) {
          <span class="dot" [class.is-done]="filled"></span>
        }
      </div>
      <div class="trailing">
        <ng-content />
      </div>
    </div>
  `,
  styleUrl: './progress-dots.scss',
})
export class ProgressDots {
  readonly total = input.required<number>();
  readonly done = input.required<number>();
  readonly label = input("Today's set");

  protected readonly safeTotal = computed(() => Math.max(0, this.total()));
  protected readonly clampedDone = computed(() =>
    Math.min(this.safeTotal(), Math.max(0, this.done())),
  );
  protected readonly dots = computed(() =>
    Array.from({ length: this.safeTotal() }, (_, i) => i < this.clampedDone()),
  );
}
