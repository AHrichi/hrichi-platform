import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { StreakSummary } from '@ah/learning/domain';

/**
 * Displays the learner's current streak in daily or weekly mode, along with
 * banked freezes or weekly goal progress when not compact.
 */
@Component({
  selector: 'lrn-streak-flame',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (compact()) {
      <span class="flame-compact" [attr.aria-label]="ariaLabel()">
        <span aria-hidden="true">🔥</span>
        {{ compactLabel() }}
      </span>
    } @else {
      <p class="flame-full" [attr.aria-label]="ariaLabel()">
        <span aria-hidden="true">🔥</span>
        {{ fullLabel() }}
        @if (streak().mode === 'weekly') {
          <span class="meta">
            · {{ streak().thisWeekCount }}/{{ streak().weeklyTarget }} this week
          </span>
        } @else if (streak().freezesBanked) {
          <span class="meta">
            · <span aria-hidden="true">❄️</span>
            {{ streak().freezesBanked }} freeze{{
              streak().freezesBanked === 1 ? '' : 's'
            }}
            banked
          </span>
        }
      </p>
    }
  `,
  styleUrl: './streak-flame.scss',
})
export class StreakFlame {
  readonly streak = input.required<StreakSummary>();
  readonly compact = input(false);

  protected readonly fullLabel = computed(() => {
    const { current, mode } = this.streak();
    const unit = mode === 'weekly' ? 'week' : 'day';
    return `${current} ${unit}${current === 1 ? '' : 's'}`;
  });

  protected readonly compactLabel = computed(() => {
    const { current, mode, thisWeekCount, weeklyTarget } = this.streak();
    return mode === 'weekly'
      ? `${current}w (${thisWeekCount}/${weeklyTarget})`
      : String(current);
  });

  protected readonly ariaLabel = computed(() => {
    const s = this.streak();
    if (s.mode === 'weekly') {
      return `${s.current} week streak, ${s.thisWeekCount} of ${s.weeklyTarget} days this week`;
    }
    const freezes = s.freezesBanked
      ? `, ${s.freezesBanked} freeze${s.freezesBanked === 1 ? '' : 's'} banked`
      : '';
    return `${s.current} day streak${freezes}`;
  });
}
