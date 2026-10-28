import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from '@angular/core';

let nextTooltipId = 0;

export type TooltipPosition = 'top' | 'bottom';

/**
 * Accessible concept & metric tooltip explaining formulas, terms, and meanings.
 * Keyboard accessible via Tab focus with full ARIA tooltip binding.
 */
@Component({
  selector: 'ah-tooltip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-tooltip-host',
    '[class.ah-tooltip--bottom]': "position() === 'bottom'",
    '(mouseenter)': 'show()',
    '(mouseleave)': 'hide()',
    '(focusin)': 'show()',
    '(focusout)': 'hide()',
  },
  templateUrl: './tooltip.html',
  styleUrl: './tooltip.scss',
})
export class Tooltip {
  readonly title = input<string>();
  readonly body = input.required<string>();
  readonly formula = input<string>();
  readonly meaning = input<string>();
  readonly position = input<TooltipPosition>('top');

  protected readonly tooltipId = `ah-tooltip-${++nextTooltipId}`;
  protected readonly isOpen = signal<boolean>(false);

  show(): void {
    this.isOpen.set(true);
  }

  hide(): void {
    this.isOpen.set(false);
  }
}
