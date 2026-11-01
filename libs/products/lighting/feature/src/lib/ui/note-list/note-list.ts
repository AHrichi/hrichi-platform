import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { CalcNote } from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';

const ICONS: Record<CalcNote['severity'], string> = {
  ok: '✓',
  info: 'i',
  warn: '!',
  error: '✕',
};

/** A calculation's findings in the reader's language. */
@Component({
  selector: 'lp-note-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ul role="list" aria-live="polite">
      @for (note of notes(); track note.code) {
        <li [attr.data-severity]="note.severity">
          <span class="icon" aria-hidden="true">{{
            icons[note.severity]
          }}</span>
          <span>{{ i18n.note(note) }}</span>
        </li>
      }
    </ul>
  `,
  styleUrl: './note-list.scss',
})
export class NoteList {
  readonly notes = input.required<readonly CalcNote[]>();
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly icons = ICONS;
}
