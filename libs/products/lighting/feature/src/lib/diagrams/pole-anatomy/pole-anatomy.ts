import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';

/**
 * A lighting pole from the lamp down into its foundation, each part named:
 * what a site engineer orders, checks and signs off.
 */
@Component({
  selector: 'lp-pole-anatomy',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './pole-anatomy.html',
  styleUrl: './pole-anatomy.scss',
})
export class PoleAnatomy {
  protected readonly t = inject(LuxPathI18n).t;
}
