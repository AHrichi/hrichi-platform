import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  linkedSignal,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhButton } from '@ah/ui';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';

export interface SaveRequest {
  label: string;
  /** True to replace the result being edited; false saves a new one. */
  replace: boolean;
}

let nextId = 0;

/**
 * Saves a result to the active project, or, while editing a saved one,
 * updates it in place or keeps it and saves a copy.
 */
@Component({
  selector: 'sc-save-bar',
  host: { 'data-tour': 'save-bar' },
  imports: [AhButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './save-bar.html',
  styleUrl: './save-bar.scss',
})
export class SaveBar {
  readonly suggestedLabel = input.required<string>();
  readonly editingLabel = input<string | null>(null);
  readonly save = output<SaveRequest>();
  readonly stopEditing = output<void>();

  protected readonly store = inject(SerraStore);
  protected readonly t = inject(SerraI18n).t;
  protected readonly id = `sc-save-${nextId++}`;
  protected readonly saved = signal(false);
  private timer: ReturnType<typeof setTimeout> | null = null;
  /** The label follows the suggestion until the user types their own. */
  private typed = false;

  protected readonly label = linkedSignal(() => {
    const editing = this.editingLabel();
    if (editing !== null) {
      this.typed = false;
      return editing;
    }
    return this.typed ? '' : this.suggestedLabel();
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => {
      if (this.timer) clearTimeout(this.timer);
    });
  }

  protected onType(value: string): void {
    this.typed = true;
    this.label.set(value);
  }

  protected submit(replace: boolean): void {
    const label = this.label().trim() || this.suggestedLabel();
    this.save.emit({ label, replace });
    this.saved.set(true);
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => this.saved.set(false), 4000);
  }
}
