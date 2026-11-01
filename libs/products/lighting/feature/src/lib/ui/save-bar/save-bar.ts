import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhButton } from '@ah/ui';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { LightingStore } from '../../store/lighting.store';

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
  selector: 'lp-save-bar',
  imports: [AhButton, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './save-bar.html',
  styleUrl: './save-bar.scss',
})
export class SaveBar {
  /** The label suggested for a new save, e.g. "Spacing · M3 · 28 m". */
  readonly suggestedLabel = input.required<string>();
  /** The label of the saved result being edited, if any. */
  readonly editingLabel = input<string | null>(null);
  readonly save = output<SaveRequest>();
  readonly stopEditing = output<void>();

  protected readonly store = inject(LightingStore);
  protected readonly t = inject(LuxPathI18n).t;
  protected readonly id = `lp-save-${nextId++}`;
  protected readonly label = signal('');
  protected readonly saved = signal(false);
  /** The label follows the suggestion until the user types their own. */
  private typed = false;

  constructor() {
    effect(() => {
      const editing = this.editingLabel();
      const suggested = this.suggestedLabel();
      if (editing !== null) {
        this.typed = false;
        this.label.set(editing);
      } else if (!this.typed) {
        this.label.set(suggested);
      }
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
    setTimeout(() => this.saved.set(false), 4000);
  }
}
