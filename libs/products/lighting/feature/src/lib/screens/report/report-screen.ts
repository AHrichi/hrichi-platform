import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhButton, AhEmptyState } from '@ah/ui';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';
import { LightingStore } from '../../store/lighting.store';
import { summarizeCalculation } from '../projects/saved-results/saved-results';

/**
 * The project on paper: details, progress, every pole with its photos, the
 * plan and the saved results, laid out to print or save as a PDF from the
 * browser's print dialog, to hand to a client or a municipality.
 */
@Component({
  selector: 'lp-report-screen',
  imports: [AhButton, AhEmptyState, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './report-screen.html',
  styleUrl: './report-screen.scss',
})
export class ReportScreen {
  protected readonly store = inject(LightingStore);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly today = new Date().toISOString();
  protected readonly milestones = computed(() =>
    [...(this.store.activeProject()?.milestones ?? [])].sort((a, b) =>
      a.date.localeCompare(b.date),
    ),
  );
  protected readonly results = computed(() =>
    [...this.store.calculations()]
      .sort((a, b) => a.savedAt.localeCompare(b.savedAt))
      .map((c) => ({
        id: c.id,
        kind: this.t().saved.kinds[c.kind],
        label: c.label,
        summary: summarizeCalculation(c, this.i18n),
      })),
  );

  protected print(): void {
    this.window?.print();
  }
}
