import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';

/**
 * How to measure a pole with the phone, in three pictures: stand and hold the
 * phone at eye height, sight the pole's foot, then its top. `active` lights
 * up the step the user is on.
 */
@Component({
  selector: 'lp-camera-guide',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './camera-guide.html',
  styleUrl: './camera-guide.scss',
})
export class CameraGuide {
  /** 1, 2 or 3; 0 highlights nothing. */
  readonly active = input(0);
  protected readonly t = inject(LuxPathI18n).t;
}
