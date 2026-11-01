import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import type { EnergyResult } from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';

const X0 = 120;
const WIDTH = 330;

/** A year of energy as two bars, old lamps against LEDs, and what's saved. */
@Component({
  selector: 'lp-energy-diagram',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './energy-diagram.html',
  styleUrl: './energy-diagram.scss',
})
export class EnergyDiagram {
  readonly result = input.required<EnergyResult>();
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly x0 = X0;

  private readonly scale = computed(() => {
    const r = this.result();
    return WIDTH / Math.max(1, r.oldKwhPerYear, r.ledKwhPerYear);
  });
  protected readonly oldWidth = computed(
    () => this.result().oldKwhPerYear * this.scale(),
  );
  protected readonly ledWidth = computed(
    () => this.result().ledKwhPerYear * this.scale(),
  );
}
