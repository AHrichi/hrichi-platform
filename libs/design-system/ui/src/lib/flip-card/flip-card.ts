import {
  ChangeDetectionStrategy,
  Component,
  HostListener,
  input,
  model,
} from '@angular/core';

export type FlipCardAccent = 'default' | 'beginner' | 'intermediate' | 'expert';

/**
 * Accessible 3D double-sided flip card with keyboard support (Space / Enter),
 * semantic competency tier borders, and prefers-reduced-motion safe animation.
 */
@Component({
  selector: 'ah-flip-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-flip-card',
    tabindex: '0',
    role: 'button',
    '[attr.aria-pressed]': 'flipped()',
    '[attr.aria-label]': 'ariaLabel()',
    '[class.ah-flip-card--flipped]': 'flipped()',
    '[class.ah-flip-card--accent-beginner]': "accent() === 'beginner'",
    '[class.ah-flip-card--accent-intermediate]': "accent() === 'intermediate'",
    '[class.ah-flip-card--accent-expert]': "accent() === 'expert'",
  },
  templateUrl: './flip-card.html',
  styleUrl: './flip-card.scss',
})
export class FlipCard {
  readonly flipped = model<boolean>(false);
  readonly accent = input<FlipCardAccent>('default');
  readonly ariaLabel = input<string>('Double-sided card. Press Space or Enter to flip.');

  @HostListener('click', ['$event'])
  onClick(event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    // Prevent flip if clicking an interactive element (link, button, input, code block, etc.)
    if (target?.closest('a, button, input, textarea, select, .ah-code-block')) {
      return;
    }
    this.toggle();
  }

  @HostListener('keydown', ['$event'])
  onKeydown(event: KeyboardEvent): void {
    if (event.code === 'Space' || event.code === 'Enter') {
      const target = event.target as HTMLElement | null;
      if (target?.closest('a, button, input, textarea, select')) {
        return;
      }
      event.preventDefault();
      this.toggle();
    }
  }

  toggle(): void {
    this.flipped.update((f) => !f);
  }
}
