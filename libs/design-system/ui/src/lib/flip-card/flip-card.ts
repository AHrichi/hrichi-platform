import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';

export type FlipCardAccent = 'default' | 'beginner' | 'intermediate' | 'expert';

let nextFlipCardId = 0;

/**
 * Double-sided card. A real toggle button (`aria-pressed`) flips it, so the
 * card can hold links, buttons and code without nesting them inside another
 * interactive element. The face that isn't showing is `inert`: its links are
 * neither focusable nor read out. Clicking the card surface also flips it
 * (a pointer shortcut; the button is the accessible control).
 * Respects prefers-reduced-motion.
 */
@Component({
  selector: 'ah-flip-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-flip-card',
    '[class.ah-flip-card--flipped]': 'flipped()',
    '[class.ah-flip-card--accent-beginner]': "accent() === 'beginner'",
    '[class.ah-flip-card--accent-intermediate]': "accent() === 'intermediate'",
    '[class.ah-flip-card--accent-expert]': "accent() === 'expert'",
    '(click)': 'onSurfaceClick($event)',
  },
  templateUrl: './flip-card.html',
  styleUrl: './flip-card.scss',
})
export class FlipCard {
  readonly flipped = model<boolean>(false);
  readonly accent = input<FlipCardAccent>('default');
  /** Visible text of the flip button, in the page's language. */
  readonly flipLabel = input<string>('Flip card');
  /** Extra description of the card, read with the flip button. */
  readonly ariaLabel = input<string>('Double-sided card.');

  protected readonly descriptionId = `ah-flip-card-desc-${++nextFlipCardId}`;

  protected onSurfaceClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    // Interactive content and the toggle itself handle their own clicks.
    if (
      target?.closest(
        'a, button, input, textarea, select, label, .ah-code-block',
      )
    ) {
      return;
    }
    this.toggle();
  }

  /**
   * Space/Enter on the toggle are handled by the button itself; stop them
   * here so page-level shortcuts (e.g. a deck's "Space flips") don't flip
   * the card a second time.
   */
  protected onToggleKeydown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.stopPropagation();
    }
  }

  toggle(): void {
    this.flipped.update((f) => !f);
  }
}
