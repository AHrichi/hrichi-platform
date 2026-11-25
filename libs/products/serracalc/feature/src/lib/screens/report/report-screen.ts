import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhButton, AhEmptyState } from '@ah/ui';
import { climateById, greenhouseGeometry } from '@ah/products/serracalc/domain';
import { SerraI18n } from '../../i18n/serra-i18n';
import { SerraStore } from '../../store/serra.store';
import { reportResult } from './report-figures';

/**
 * The project on paper: the house, its climate and every saved result with
 * its figures and findings, worked out again from the saved inputs. Laid
 * out to print, or to save as a PDF from the browser's print dialog, for a
 * client, a supplier or a bank.
 */
@Component({
  selector: 'sc-report-screen',
  imports: [AhButton, AhEmptyState, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './report-screen.html',
  styleUrl: './report-screen.scss',
})
export class ReportScreen {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  private readonly window = inject(DOCUMENT).defaultView;

  protected readonly today = new Date().toISOString();

  protected readonly house = computed(() => {
    const project = this.store.activeProject();
    if (!project) return null;
    const g = greenhouseGeometry(project.greenhouse);
    return {
      climate: climateById(project.climateId),
      geometry: g,
      notes: g.notes.map((note) => this.i18n.note(note)),
    };
  });

  /** Oldest first, as the work was done. */
  protected readonly results = computed(() => {
    const project = this.store.activeProject();
    if (!project) return [];
    return [...project.calculations]
      .sort((a, b) => a.savedAt.localeCompare(b.savedAt))
      .map((c) => reportResult(c, project.currency, this.i18n));
  });

  protected print(): void {
    this.window?.print();
  }
}
