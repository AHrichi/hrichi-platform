import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Small label for a technology or category. */
@Component({
  selector: 'ah-tag',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '<ng-content />',
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      padding-block: var(--space-1);
      padding-inline: var(--space-3);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-pill);
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-medium);
      color: var(--color-text-muted);
      white-space: nowrap;
    }
  `,
})
export class Tag {}
