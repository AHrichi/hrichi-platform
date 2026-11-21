import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { SdIcon } from '../icon/icon';
import { SdInlineText } from '../inline-text/inline-text';

/**
 * Right-column "You'll learn" checklist (`sd-learn-list`), ticked from
 * `sceneAt(lesson, n).learned`.
 */
@Component({
  selector: 'sd-learn-list',
  imports: [SdIcon, SdInlineText],
  templateUrl: './learn-list.html',
  styleUrl: './learn-list.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdLearnList {
  readonly items = input.required<readonly string[]>();
  readonly learned = input<ReadonlySet<number>>(new Set());
  readonly heading = input<string>("You'll learn");

  protected readonly learnedCount = computed(() => {
    const set = this.learned();
    const total = this.items().length;
    let count = 0;
    for (let i = 0; i < total; i++) {
      if (set.has(i)) count++;
    }
    return count;
  });
}
