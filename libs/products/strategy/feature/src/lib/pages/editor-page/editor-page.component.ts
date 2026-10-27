import {
  Component,
  computed,
  inject,
  signal,
  effect,
  untracked,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { FinancialStore } from '../../financial.store';
import { ThemeService } from '../../services/theme.service';

import { ScenarioCardComponent } from '../../components/scenario-card/scenario-card.component';
import { ScenarioSelectorComponent } from '../../components/scenario-selector/scenario-selector.component';

@Component({
  selector: 'app-editor-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ScenarioCardComponent,
    ScenarioSelectorComponent,
  ],
  templateUrl: './editor-page.component.html',
  styleUrls: ['./editor-page.component.scss'],
})
export class EditorPageComponent {
  readonly store = inject(FinancialStore);
  readonly themeService = inject(ThemeService);
  readonly route = inject(ActivatedRoute);
  readonly router = inject(Router);

  expandedScenarioId = signal<string | null>(null);
  isDarkMode = this.themeService.isDarkMode;

  /** Reactive signal derived from the :scenarioId route param */
  private scenarioId = toSignal(
    this.route.paramMap.pipe(map((p) => p.get('scenarioId'))),
    { initialValue: this.route.snapshot.paramMap.get('scenarioId') },
  );

  constructor() {
    effect(() => {
      const routeId = this.scenarioId();
      const store = this.store;
      if (store.scenarios().length === 0) {
        this.router.navigate(['../../home'], { relativeTo: this.route });
        return;
      }
      // untrack activeScenarioId so store changes from widget don't trigger a revert
      if (routeId && routeId !== untracked(() => store.activeScenarioId())) {
        store.setActiveScenario(routeId);
      }
    });
  }

  activeScenarioSummary = computed(() => {
    return this.store
      .scenarioSummaries()
      .find((s) => s.id === this.store.activeScenarioId());
  });

  createScenario(name: string) {
    if (name) {
      this.store.addScenario(name);
      const newId = this.store.activeScenarioId();
      this.router.navigate(['../', newId, 'settings'], {
        relativeTo: this.route,
      });
    }
  }

  duplicateScenario(id: string) {
    this.store.duplicateScenario(id);
    const newId = this.store.activeScenarioId();
    this.router.navigate(['../', newId, 'settings'], {
      relativeTo: this.route,
    });
  }

  renameScenario(event: { id: string; name: string }) {
    this.store.updateSpecificScenarioName(event.id, event.name);
  }

  deleteScenario(id: string) {
    const scenarios = this.store.scenarios();
    if (scenarios.length <= 1) return;
    this.store.deleteScenario(id);
    const remaining = this.store.scenarios();
    if (remaining.length > 0) {
      const segments = this.router.url.split('/');
      const tab =
        ['settings', 'incomes', 'expenses', 'goals'].find((t) =>
          segments.includes(t),
        ) ?? 'settings';
      this.router.navigate(['../', this.store.activeScenarioId(), tab], {
        relativeTo: this.route,
      });
    } else {
      this.router.navigate(['../../home'], { relativeTo: this.route });
    }
  }

  /** Called when user picks a scenario from the tab bar — preserves current section tab */
  switchScenario(id: string) {
    const segments = this.router.url.split('/');
    // Last segment is the current tab (settings | incomes | expenses | goals)
    const tab =
      ['settings', 'incomes', 'expenses', 'goals'].find((t) =>
        segments.includes(t),
      ) ?? 'settings';
    this.router.navigate(['../', id, tab], { relativeTo: this.route });
  }

  toggleScenarioDetails(id: string) {
    this.expandedScenarioId.update((current) => (current === id ? null : id));
  }
}
