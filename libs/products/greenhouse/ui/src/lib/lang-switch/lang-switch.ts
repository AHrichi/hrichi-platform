import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';

export interface GhLanguage {
  id: string;
  /** Short and in its own script: `ع`, `FR`, `EN`. */
  label: string;
}

/** A row of language toggles, made to sit on the app bar. */
@Component({
  selector: 'gh-lang-switch',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<div class="langs" role="group" [attr.aria-label]="label()">
    @for (lang of languages(); track lang.id) {
      <button
        type="button"
        [attr.aria-pressed]="current() === lang.id"
        [attr.lang]="lang.id"
        (click)="selected.emit(lang.id)"
      >
        {{ lang.label }}
      </button>
    }
  </div>`,
  styleUrl: './lang-switch.scss',
})
export class GhLangSwitch {
  readonly languages = input.required<readonly GhLanguage[]>();
  readonly current = input.required<string>();
  /** The group's name for screen readers ("Language"). */
  readonly label = input.required<string>();
  readonly selected = output<string>();
}
