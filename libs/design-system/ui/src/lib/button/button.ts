import { Directive, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'md' | 'sm';

/**
 * Button styling for both `<a>` (navigation, router links) and `<button>`
 * (actions), so the element always matches what the control does.
 */
@Directive({
  selector: 'a[ahButton], button[ahButton]',
  host: {
    class: 'ah-button',
    '[class.ah-button--primary]': "variant() === 'primary'",
    '[class.ah-button--secondary]': "variant() === 'secondary'",
    '[class.ah-button--ghost]': "variant() === 'ghost'",
    '[class.ah-button--sm]': "size() === 'sm'",
  },
})
export class AhButton {
  /** A bare `ahButton` attribute binds '' and means the default, primary. */
  readonly variant = input<ButtonVariant, ButtonVariant | ''>('primary', {
    alias: 'ahButton',
    transform: (value) => value || 'primary',
  });
  readonly size = input<ButtonSize>('md');
}
