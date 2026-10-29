import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';

let nextAccordionId = 0;

/**
 * Accessible disclosure/collapsible container with custom header slots,
 * animated expansion, keyboard support, and token-based theming.
 */
@Component({
  selector: 'ah-accordion-item',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-accordion-item',
    '[class.ah-accordion-item--expanded]': 'expanded()',
    '[class.ah-accordion-item--disabled]': 'disabled()',
  },
  templateUrl: './accordion-item.html',
  styleUrl: './accordion-item.scss',
})
export class AccordionItem {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
  readonly icon = input<string>();
  readonly disabled = input<boolean>(false);
  readonly expanded = model<boolean>(false);

  protected readonly id = `ah-accordion-${++nextAccordionId}`;
  protected readonly headerId = `${this.id}-header`;
  protected readonly contentId = `${this.id}-content`;

  toggle(): void {
    if (this.disabled()) return;
    this.expanded.update((v) => !v);
  }
}
