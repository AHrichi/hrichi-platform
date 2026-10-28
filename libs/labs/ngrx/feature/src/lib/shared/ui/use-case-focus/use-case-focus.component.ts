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
  templateUrl: './use-case-focus.component.html',
  styleUrl: './use-case-focus.component.scss',
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
