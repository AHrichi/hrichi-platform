import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type BadgeVariant =
  'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'accent';
export type BadgeSize = 'sm' | 'md';

/**
 * Status indicator badge with semantic variants, optional status dot,
 * and live pulse animation for real-time operations.
 */
@Component({
  selector: 'ah-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-badge',
    '[class.ah-badge--neutral]': "variant() === 'neutral'",
    '[class.ah-badge--success]': "variant() === 'success'",
    '[class.ah-badge--warning]': "variant() === 'warning'",
    '[class.ah-badge--danger]': "variant() === 'danger'",
    '[class.ah-badge--info]': "variant() === 'info'",
    '[class.ah-badge--accent]': "variant() === 'accent'",
    '[class.ah-badge--sm]': "size() === 'sm'",
    '[class.ah-badge--md]': "size() === 'md'",
  },
  template: `
    @if (dot()) {
      <span
        class="ah-badge-dot"
        [class.ah-badge-dot--pulse]="pulse()"
        aria-hidden="true"
      ></span>
    }
    <span class="ah-badge-content">
      <ng-content />
    </span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
      border-radius: var(--radius-pill);
      font-weight: var(--font-weight-semibold);
      line-height: 1;
      white-space: nowrap;
      transition:
        background-color var(--motion-duration-fast) ease,
        color var(--motion-duration-fast) ease;
    }

    :host(.ah-badge--sm) {
      padding-block: 2px;
      padding-inline: var(--space-2);
      font-size: 0.75rem;
    }

    :host(.ah-badge--md) {
      padding-block: var(--space-1);
      padding-inline: var(--space-3);
      font-size: var(--font-size-100);
    }

    /* Neutral */
    :host(.ah-badge--neutral) {
      background: var(--color-border-default);
      color: var(--color-text-default);
    }
    :host(.ah-badge--neutral) .ah-badge-dot {
      background: var(--color-neutral-400);
    }

    /* Success */
    :host(.ah-badge--success) {
      background: rgba(34, 197, 94, 0.12);
      color: var(--color-success-default);
      border: 1px solid rgba(34, 197, 94, 0.25);
    }
    :host(.ah-badge--success) .ah-badge-dot {
      background: var(--color-success-default);
    }

    /* Warning */
    :host(.ah-badge--warning) {
      background: rgba(245, 158, 11, 0.12);
      color: var(--color-amber-300);
      border: 1px solid rgba(245, 158, 11, 0.25);
    }
    :host(.ah-badge--warning) .ah-badge-dot {
      background: var(--color-amber-300);
    }

    /* Danger */
    :host(.ah-badge--danger) {
      background: rgba(239, 68, 68, 0.12);
      color: var(--color-crimson-500);
      border: 1px solid rgba(239, 68, 68, 0.25);
    }
    :host(.ah-badge--danger) .ah-badge-dot {
      background: var(--color-crimson-500);
    }

    /* Info */
    :host(.ah-badge--info) {
      background: rgba(59, 130, 246, 0.12);
      color: var(--color-blue-300);
      border: 1px solid rgba(59, 130, 246, 0.25);
    }
    :host(.ah-badge--info) .ah-badge-dot {
      background: var(--color-blue-300);
    }

    /* Accent */
    :host(.ah-badge--accent) {
      background: var(--color-accent-subtle);
      color: var(--color-accent-default);
      border: 1px solid var(--color-accent-default);
    }
    :host(.ah-badge--accent) .ah-badge-dot {
      background: var(--color-accent-default);
    }

    .ah-badge-dot {
      inline-size: 6px;
      block-size: 6px;
      border-radius: var(--radius-pill);
      flex-shrink: 0;
    }

    .ah-badge-dot--pulse {
      animation: ah-badge-pulse 2s infinite cubic-bezier(0.4, 0, 0.6, 1);
    }

    @keyframes ah-badge-pulse {
      0%,
      100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.35;
        transform: scale(1.35);
      }
    }
  `,
})
export class Badge {
  readonly variant = input<BadgeVariant>('neutral');
  readonly dot = input<boolean>(false);
  readonly pulse = input<boolean>(false);
  readonly size = input<BadgeSize>('md');
}
