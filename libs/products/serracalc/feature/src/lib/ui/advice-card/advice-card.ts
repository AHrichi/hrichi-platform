import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import type {
  CoolingAdvice,
  CoolingStrategy,
} from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import { Icon, type IconName } from '../icon/icon';
import { NoteList } from '../note-list/note-list';

const ICONS: Record<CoolingStrategy, IconName> = {
  vents: 'cooling',
  ventsAndShade: 'air',
  shadeAndFog: 'fog',
  shadeAndPad: 'water',
};

/**
 * The cooling advisor's verdict: the strategy for the design afternoon,
 * the vent area it would otherwise take, what shade and evaporative
 * cooling achieve, and why.
 */
@Component({
  selector: 'sc-advice-card',
  imports: [Icon, NoteList],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="advice"
      [attr.data-strategy]="advice().strategy"
      aria-labelledby="sc-advice-title"
    >
      <header>
        <span class="badge"><sc-icon [name]="icon()" /></span>
        <div>
          <span class="eyebrow">{{ t().advice.title }}</span>
          <h3 id="sc-advice-title">
            {{ t().advice.strategies[advice().strategy] }}
          </h3>
        </div>
      </header>
      <dl class="compare">
        <div [class.bad]="advice().ventPct > limit()">
          <dt>{{ t().advice.ventsNeeded }}</dt>
          <dd>{{ i18n.num(advice().ventPct, 1) }} %</dd>
        </div>
        <div>
          <dt>{{ t().advice.withShade(i18n.num(advice().shadePct, 0)) }}</dt>
          <dd>{{ i18n.num(advice().shadedVentPct, 1) }} %</dd>
        </div>
        <div>
          <dt>{{ t().advice.fogInside }}</dt>
          <dd>{{ i18n.num(advice().fogInsideC, 1) }} °C</dd>
        </div>
        <div>
          <dt>{{ t().advice.padOutlet }}</dt>
          <dd>{{ i18n.num(advice().padOutletC, 1) }} °C</dd>
        </div>
      </dl>
      <sc-note-list [notes]="advice().notes" />
      @if (showFog()) {
        <button type="button" class="go" (click)="openFog.emit()">
          <sc-icon name="fog" /> {{ t().advice.openFog }}
        </button>
      }
      <p class="rule">{{ t().advice.rule }}</p>
    </section>
  `,
  styleUrl: './advice-card.scss',
})
export class AdviceCard {
  readonly advice = input.required<CoolingAdvice>();
  /** Vent share the roof can open, percent: above it reads as not buildable. */
  readonly limit = input(25);
  readonly showFog = input(false);
  readonly openFog = output<void>();

  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  protected readonly icon = computed(() => ICONS[this.advice().strategy]);
}
