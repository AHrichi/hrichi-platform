import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { MaterialItem } from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';

export type ArtKind =
  | 'pole'
  | 'conic'
  | 'solarPole'
  | 'luminaire'
  | 'solarLuminaire'
  | 'panel'
  | 'battery'
  | 'bolts'
  | 'cable'
  | 'abc'
  | 'box';

/** Which drawing a catalogue item gets, from its category and id. */
export function artKind(
  category: MaterialItem['category'],
  id: string,
): ArtKind {
  switch (category) {
    case 'pole':
      return id.includes('solar')
        ? 'solarPole'
        : id.includes('conic')
          ? 'conic'
          : 'pole';
    case 'luminaire':
      return id.includes('solar') ? 'solarLuminaire' : 'luminaire';
    case 'solar_panel':
      return 'panel';
    case 'battery':
      return 'battery';
    case 'anchor_bolts':
      return 'bolts';
    case 'overhead_cable':
      return 'abc';
    case 'electrical':
      return 'box';
    default:
      return 'cable';
  }
}

/** A small line drawing of a catalogue item, in the theme's colours. */
@Component({
  selector: 'lp-material-art',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './material-art.html',
  styleUrl: './material-art.scss',
})
export class MaterialArt {
  readonly kind = input.required<ArtKind>();
  protected readonly t = inject(LuxPathI18n).t;
  protected readonly label = computed(() => this.t().art.kinds[this.kind()]);
}
