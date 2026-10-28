import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

export type ProgressBarVariant =
  'primary' | 'accent' | 'success' | 'warning' | 'danger';
export type ProgressBarSize = 'sm' | 'md' | 'lg';

/**
 * Accessible, token-styled progress bar with percentage clamping,
 * semantic color variants, and accessible ARIA attributes.
 */
@Component({
  selector: 'ah-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-progress-bar-host',
    '[class.ah-progress--sm]': "size() === 'sm'",
    '[class.ah-progress--md]': "size() === 'md'",
    '[class.ah-progress--lg]': "size() === 'lg'",
  },
  template: `
    @if (label() || showValue()) {
      <div class="ah-progress-header">
        @if (label()) {
          <span class="ah-progress-label">{{ label() }}</span>
        }
        @if (showValue()) {
          <span class="ah-progress-value-text"
            >{{ displayPercent() }}%
            @if (showDetails()) {
              <span class="ah-progress-details"
                >({{ value() }}/{{ max() }})</span
              >
            }
          </span>
        }
      </div>
    }

    <div
      class="ah-progress-track"
      role="progressbar"
      [attr.aria-valuenow]="value()"
      [attr.aria-valuemin]="0"
      [attr.aria-valuemax]="max()"
      [attr.aria-label]="label() || 'Progress'"
    >
      <div
        class="ah-progress-fill"
        [class.ah-progress-fill--primary]="variant() === 'primary'"
        [class.ah-progress-fill--accent]="variant() === 'accent'"
        [class.ah-progress-fill--success]="variant() === 'success'"
        [class.ah-progress-fill--warning]="variant() === 'warning'"
        [class.ah-progress-fill--danger]="variant() === 'danger'"
        [class.ah-progress-fill--striped]="striped()"
        [style.width.%]="percentage()"
      ></div>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      gap: var(--space-1);
      inline-size: 100%;
    }

    .ah-progress-header {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      font-size: var(--font-size-100);
    }

    .ah-progress-label {
      font-weight: var(--font-weight-medium);
      color: var(--color-text-default);
    }

    .ah-progress-value-text {
      font-weight: var(--font-weight-semibold);
      color: var(--color-text-muted);
      font-feature-settings: 'tnum';
    }

    .ah-progress-details {
      margin-inline-start: var(--space-1);
      font-weight: var(--font-weight-regular);
      font-size: 0.9em;
    }

    .ah-progress-track {
      inline-size: 100%;
      background: var(--color-border-default);
      border-radius: var(--radius-pill);
      overflow: hidden;
      display: flex;
    }

    :host(.ah-progress--sm) .ah-progress-track {
      block-size: 4px;
    }

    :host(.ah-progress--md) .ah-progress-track {
      block-size: 8px;
    }

    :host(.ah-progress--lg) .ah-progress-track {
      block-size: 14px;
    }

    .ah-progress-fill {
      block-size: 100%;
      border-radius: var(--radius-pill);
      transition: width var(--motion-duration-slow)
        var(--motion-easing-standard);
      background: var(--color-accent-default);
    }

    .ah-progress-fill--primary {
      background: var(--color-accent-default);
    }

    .ah-progress-fill--accent {
      background: var(--color-data-4);
    }

    .ah-progress-fill--success {
      background: var(--color-success-default);
    }

    .ah-progress-fill--warning {
      background: var(--color-amber-300);
    }

    .ah-progress-fill--danger {
      background: var(--color-crimson-500);
    }

    .ah-progress-fill--striped {
      background-image: linear-gradient(
        45deg,
        rgba(255, 255, 255, 0.15) 25%,
        transparent 25%,
        transparent 50%,
        rgba(255, 255, 255, 0.15) 50%,
        rgba(255, 255, 255, 0.15) 75%,
        transparent 75%,
        transparent
      );
      background-size: 1rem 1rem;
    }
  `,
})
export class ProgressBar {
  readonly value = input.required<number>();
  readonly max = input<number>(100);
  readonly label = input<string>();
  readonly variant = input<ProgressBarVariant>('primary');
  readonly size = input<ProgressBarSize>('md');
  readonly showValue = input<boolean>(false);
  readonly showDetails = input<boolean>(false);
  readonly striped = input<boolean>(false);

  protected readonly percentage = computed(() => {
    const val = Number(this.value()) || 0;
    const maxVal = Number(this.max()) || 100;
    if (maxVal <= 0) return 0;
    const pct = (val / maxVal) * 100;
    return Math.min(100, Math.max(0, pct));
  });

  protected readonly displayPercent = computed(() => {
    return Math.round(this.percentage());
  });
}
