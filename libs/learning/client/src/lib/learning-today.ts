import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { LearningClient } from './learning-client';

function localDate(now: Date): string {
  // The summary's day starts at 04:00 (design §5.2); close enough for a chip.
  const shifted = new Date(now.getTime() - 4 * 3_600_000);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${shifted.getFullYear()}-${pad(shifted.getMonth() + 1)}-${pad(shifted.getDate())}`;
}

/**
 * A small chip with today's set and the streak, linking to the review
 * (design §9). It shows only where the learning app runs on the same
 * origin and has published today's summary; elsewhere it renders nothing.
 */
@Component({
  selector: 'ah-learning-today',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (view(); as v) {
      <a class="chip" [href]="href">
        <span aria-hidden="true">🔥</span> {{ v.streak }} ·
        {{ v.left ? v.left + ' to review' : 'done for today ✓' }}
      </a>
    }
  `,
  styles: `
    .chip {
      display: inline-flex;
      gap: var(--space-1);
      align-items: center;
      min-height: 2rem;
      padding-inline: var(--space-3);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-pill);
      color: var(--color-text-default);
      font-size: var(--font-size-200);
      text-decoration: none;
    }

    .chip:focus-visible {
      outline: 2px solid var(--color-focus-ring);
      outline-offset: 2px;
    }
  `,
})
export class LearningToday {
  private readonly client = inject(LearningClient);
  protected readonly href = this.client.urlFor('today');
  protected readonly view = computed(() => {
    const summary = this.client.today();
    if (!summary || summary.localDate !== localDate(new Date())) return null;
    return {
      streak: summary.streak,
      left: Math.max(0, summary.total - summary.done),
    };
  });
}
