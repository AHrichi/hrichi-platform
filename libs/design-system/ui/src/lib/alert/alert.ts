import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';

export type AlertVariant = 'info' | 'success' | 'warning' | 'danger';
export type AlertHeadingLevel = 2 | 3 | 4 | null;

/**
 * Semantic alert banner for system feedback, guardrails, and validation errors.
 */
@Component({
  selector: 'ah-alert',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-alert',
    '[class.ah-alert--info]': "variant() === 'info'",
    '[class.ah-alert--success]': "variant() === 'success'",
    '[class.ah-alert--warning]': "variant() === 'warning'",
    '[class.ah-alert--danger]': "variant() === 'danger'",
    '[attr.role]': "variant() === 'danger' ? 'alert' : 'status'",
    '[hidden]': 'isDismissed()',
  },
  templateUrl: './alert.html',
  styleUrl: './alert.scss',
})
export class Alert {
  readonly variant = input<AlertVariant>('info');
  readonly title = input<string>();
  /** Semantic heading level for `title`, or `null` for plain block text inside a landmark with no matching subheading level. */
  readonly headingLevel = input<AlertHeadingLevel>(4);
  readonly dismissible = input<boolean>(false);

  readonly dismissed = output<void>();

  readonly isDismissed = signal<boolean>(false);

  dismiss(): void {
    this.isDismissed.set(true);
    this.dismissed.emit();
  }
}
