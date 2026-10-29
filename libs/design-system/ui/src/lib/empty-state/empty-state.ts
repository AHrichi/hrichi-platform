import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * Empty or unpopulated state container with icon, titles, guidance text,
 * and customizable action buttons.
 */
@Component({
  selector: 'ah-empty-state',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-empty-state',
  },
  templateUrl: './empty-state.html',
  styleUrl: './empty-state.scss',
})
export class EmptyState {
  readonly icon = input<string>('📂');
  readonly eyebrow = input<string>();
  readonly title = input.required<string>();
  readonly description = input<string>();
}
