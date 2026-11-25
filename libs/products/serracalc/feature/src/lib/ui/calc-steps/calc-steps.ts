import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { SerraI18n } from '../../i18n/serra-i18n';
import { injectScreenTopics } from '../../science/screen-topics';
import { Formula } from '../formula/formula';

export interface CalcStep {
  readonly label: string;
  /** The formula with today's numbers in it. */
  readonly math: string;
}

/**
 * "How it's calculated": each formula with the current numbers in it, and
 * links to the phenomena behind them on the Science page.
 */
@Component({
  selector: 'sc-calc-steps',
  imports: [Formula, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <details class="how" [open]="open()">
      <summary>{{ t().calc.how }}</summary>
      <ol>
        @for (step of steps(); track $index) {
          <li>
            <span class="label">{{ step.label }}</span>
            <sc-formula
              class="math"
              [source]="step.math"
              [label]="step.label"
            />
          </li>
        }
      </ol>
    </details>
    @if (topics().length) {
      <nav class="science" [attr.aria-label]="t().calc.science">
        <span class="eyebrow">{{ t().calc.science }}</span>
        @for (id of topics(); track id) {
          <a [routerLink]="['..', 'science']" [queryParams]="{ topic: id }">
            {{ t().science.topics[id].title }}
          </a>
        }
      </nav>
    }
  `,
  styleUrl: './calc-steps.scss',
})
export class CalcSteps {
  readonly steps = input.required<readonly CalcStep[]>();
  readonly open = input(false);
  protected readonly t = inject(SerraI18n).t;
  protected readonly topics = injectScreenTopics();
}
