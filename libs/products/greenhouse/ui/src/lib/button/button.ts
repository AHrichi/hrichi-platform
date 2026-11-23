import { booleanAttribute, Directive, input } from '@angular/core';

export type GhButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
/** `md` for desks; `field` is a size up for gloves and glare. */
export type GhButtonSize = 'md' | 'field';

/**
 * Button styling for `<button>` (actions) and `<a>` (navigation). The look
 * lives in `styles/greenhouse.scss`, which the apps load once.
 */
@Directive({
  selector: 'a[ghButton], button[ghButton]',
  host: {
    class: 'gh-button',
    '[class.gh-button--primary]': "variant() === 'primary'",
    '[class.gh-button--secondary]': "variant() === 'secondary'",
    '[class.gh-button--danger]': "variant() === 'danger'",
    '[class.gh-button--ghost]': "variant() === 'ghost'",
    '[class.gh-button--field]': "size() === 'field'",
    '[class.gh-button--block]': 'block()',
  },
})
export class GhButton {
  /** A bare `ghButton` attribute binds '' and means the default, primary. */
  readonly variant = input<GhButtonVariant, GhButtonVariant | ''>('primary', {
    alias: 'ghButton',
    transform: (value) => value || 'primary',
  });
  readonly size = input<GhButtonSize>('md');
  readonly block = input(false, { transform: booleanAttribute });
}
