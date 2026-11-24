import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { SerraI18n } from '../../i18n/serra-i18n';

export interface CalcStep {
  readonly label: string;
  /** The formula with today's numbers in it. */
  readonly math: string;
}

/** "How it's calculated": each formula with the current numbers in it. */
@Component({
  selector: 'sc-calc-steps',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="how" [open]="open()">
      <summary>🧮 {{ t().calc.how }}</summary>
      <ol>
        @for (step of steps(); track $index) {
          <li>
            <span class="label">{{ step.label }}</span>
            <code dir="ltr">{{ step.math }}</code>
          </li>
        }
      </ol>
    </details>
  `,
  styleUrl: './calc-steps.scss',
})
export class CalcSteps {
  readonly steps = input.required<readonly CalcStep[]>();
  readonly open = input(false);
  protected readonly t = inject(SerraI18n).t;
}
