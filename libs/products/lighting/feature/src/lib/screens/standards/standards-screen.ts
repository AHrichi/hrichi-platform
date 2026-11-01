import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhSegmentedControl } from '@ah/ui';
import {
  LIGHTING_STANDARDS,
  type StandardRegulationItem,
} from '@ah/products/lighting/domain';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import type { LuxPathScreen } from '../../shell/luxpath-shell';

type Category = StandardRegulationItem['category'] | 'all';

/** Where each rule in LuxPath comes from, and the tool that applies it. */
const TOOL_FOR: Partial<Record<string, LuxPathScreen>> = {
  'en-13201-2': 'calculations',
  'en-40-3': 'verticality',
  'eurocode-7': 'calculations',
  'nf-en-206': 'concrete',
  'iec-61215-62133': 'calculations',
  'nf-c-17-200': 'calculations',
};

@Component({
  selector: 'lp-standards-screen',
  imports: [AhSegmentedControl, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './standards-screen.html',
  styleUrl: './standards-screen.scss',
})
export class StandardsScreen {
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  protected readonly toolFor = TOOL_FOR;

  protected readonly query = signal('');
  protected readonly category = signal<Category>('all');
  protected readonly categories = computed(() =>
    (
      [
        'all',
        'photometrics',
        'civil_works',
        'solar_pv',
        'electrical_safety',
        'mechanical_protection',
      ] as const
    ).map((value) => ({ value, label: this.t().standards.categories[value] })),
  );

  protected readonly standards = computed(() => {
    const q = this.query().trim().toLowerCase();
    const category = this.category();
    return LIGHTING_STANDARDS.filter(
      (s) =>
        (category === 'all' || s.category === category) &&
        (!q || `${s.code} ${s.title} ${s.summary}`.toLowerCase().includes(q)),
    );
  });

  protected value(event: Event): string {
    return (event.target as HTMLInputElement).value;
  }
}
