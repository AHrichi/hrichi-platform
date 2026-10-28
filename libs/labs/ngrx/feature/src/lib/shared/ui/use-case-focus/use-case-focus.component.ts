import {
  ChangeDetectionStrategy,
  Component,
  input,
  model,
} from '@angular/core';
import { AhButton, SegmentedControl, Tag, type SegmentedOption } from '@ah/ui';

@Component({
  selector: 'ah-ngrx-use-case-focus',
  imports: [SegmentedControl, Tag, AhButton],
  template: `
    <div class="use-case-focus-wrapper">
      <div class="control-row">
        <span class="control-label" id="focus-label">Focus View:</span>
        <ah-segmented-control
          [options]="options()"
          [(value)]="value"
          [label]="ariaLabel()"
        />
      </div>

      @if (value() !== 'all') {
        <div class="active-badge-group">
          <ah-tag> Focused: {{ getActiveLabel() }} </ah-tag>
          <button
            type="button"
            ahButton="ghost"
            size="sm"
            (click)="resetToAll()"
            aria-label="Show all use cases"
          >
            Show All
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .use-case-focus-wrapper {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3, 0.75rem);
      padding: var(--space-3, 0.75rem) var(--space-4, 1rem);
      background: var(--color-surface-sunken, rgba(255, 255, 255, 0.03));
      border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08));
      border-radius: var(--radius-lg, 0.75rem);
      margin-bottom: var(--space-6, 1.5rem);
    }

    .control-row {
      display: flex;
      align-items: center;
      gap: var(--space-3, 0.75rem);
      flex-wrap: wrap;
    }

    .control-label {
      font-size: var(--font-size-xs, 0.75rem);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-text-muted, #94a3b8);
    }

    .active-badge-group {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UseCaseFocusComponent {
  readonly options = input.required<readonly SegmentedOption<string>[]>();
  readonly value = model.required<string>();
  readonly ariaLabel = input<string>('Filter displayed use case');

  onValueChange(next: string): void {
    this.value.set(next);
  }

  resetToAll(): void {
    this.value.set('all');
  }

  getActiveLabel(): string {
    const current = this.options().find((opt) => opt.value === this.value());
    return current?.label ?? this.value();
  }
}
