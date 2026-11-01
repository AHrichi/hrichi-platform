import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';

/**
 * How to hold the phone for a plumb check: where on the pole, how the phone
 * sits on it, keeping still, then the opposite side. Below, the usual
 * mistakes next to the right way. `active` lights up the current step.
 */
@Component({
  selector: 'lp-plumb-guide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './plumb-guide.html',
  styleUrl: './plumb-guide.scss',
})
export class PlumbGuide {
  /** 1 to 4; 0 highlights nothing. */
  readonly active = input(0);
  protected readonly t = inject(LuxPathI18n).t;
}
