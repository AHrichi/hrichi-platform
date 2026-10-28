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
  templateUrl: './badge.html',
  styleUrl: './badge.scss',
})
export class Badge {
  readonly variant = input<BadgeVariant>('neutral');
  readonly dot = input<boolean>(false);
  readonly pulse = input<boolean>(false);
  readonly size = input<BadgeSize>('md');
}
