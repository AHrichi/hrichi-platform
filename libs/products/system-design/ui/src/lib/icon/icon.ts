import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { IconName } from '@ah/products/system-design/domain';
import { ICON_PATHS } from './icon-paths';

/**
 * Renders one of the 28 closed-set System Design line icons (24×24 viewBox,
 * 1.75 stroke in `currentColor`).
 */
@Component({
  selector: 'sd-icon',
  templateUrl: './icon.html',
  styleUrl: './icon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SdIcon {
  readonly name = input.required<IconName>();
  readonly size = input<number>(24);
  readonly label = input<string | null>(null);

  protected readonly paths = computed(() => ICON_PATHS[this.name()] ?? []);
}
