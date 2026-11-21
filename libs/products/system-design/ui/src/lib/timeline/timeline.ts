import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { LessonStep } from '@ah/products/system-design/domain';

export type TimelineStepItem = Pick<LessonStep, 'id' | 'label' | 'kind'>;

/**
 * Step timeline card (`sd-timeline`): "In this lesson", numbered dots with
 * labels, and "Step n of N".
 */
@Component({
  selector: 'sd-timeline',
  templateUrl: './timeline.html',
  styleUrl: './timeline.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdTimeline {
  readonly steps = input.required<readonly TimelineStepItem[]>();
  /** 0-based active step index. */
  readonly currentIndex = input.required<number>();
  /** Optional furthest visited 0-based index. */
  readonly furthestIndex = input<number | null>(null);

  readonly stepSelected = output<number>();

  protected readonly reachedIndex = computed(() =>
    Math.max(this.currentIndex(), this.furthestIndex() ?? this.currentIndex()),
  );
}
