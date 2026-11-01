import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';

/** "How to take the measurements": where each input comes from on site. */
@Component({
  selector: 'lp-how-to',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="how-to" [open]="open()">
      <summary>📏 {{ title() ?? t().howTo.title }}</summary>
      <ol>
        @for (step of steps(); track $index) {
          <li>{{ step }}</li>
        }
      </ol>
      <ng-content />
    </details>
  `,
  styleUrl: './how-to.scss',
})
export class HowTo {
  readonly steps = input.required<readonly string[]>();
  readonly title = input<string>();
  readonly open = input(false);
  protected readonly t = inject(LuxPathI18n).t;
}
