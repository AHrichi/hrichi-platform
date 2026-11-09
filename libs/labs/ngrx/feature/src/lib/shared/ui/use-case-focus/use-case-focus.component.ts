import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  model,
} from '@angular/core';
import { AhButton, SegmentedControl, Tag, type SegmentedOption } from '@ah/ui';
import { injectNgrxLabCopy } from '../../../i18n/ngrx-lab-copy';

@Component({
  selector: 'ah-ngrx-use-case-focus',
  imports: [SegmentedControl, Tag, AhButton],
  templateUrl: './use-case-focus.component.html',
  styleUrl: './use-case-focus.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UseCaseFocusComponent {
  private readonly labCopy = injectNgrxLabCopy();
  readonly copy = computed(() => this.labCopy().useCaseFocus);

  readonly options = input.required<readonly SegmentedOption<string>[]>();
  readonly value = model.required<string>();
  readonly ariaLabel = input<string>('');

  readonly resolvedAriaLabel = computed(
    () => this.ariaLabel() || this.copy().defaultAriaLabel,
  );

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
