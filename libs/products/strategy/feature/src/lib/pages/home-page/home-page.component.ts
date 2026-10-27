import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FinancialStore } from '../../financial.store';
import { ThemeService } from '../../services/theme.service';
import { fmtCurrency } from '../../utils/chart-utils';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.scss'],
})
export class HomePageComponent {
  readonly store = inject(FinancialStore);
  readonly themeService = inject(ThemeService);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly isDarkMode = this.themeService.isDarkMode;
  readonly fmtCurrency = fmtCurrency;

  scenarioName = signal('');

  readonly Math = Math;

  readonly recentTransactions = computed(() =>
    this.store.transactions().slice(-5).reverse(),
  );

  readonly totalGoalProgress = computed(() => {
    const milestones = this.store.activeGoalMilestones();
    if (!milestones.length) return 0;
    const achieved = milestones.filter((m) => m.status === 'achieved').length;
    return Math.round((achieved / milestones.length) * 100);
  });

  readonly activeSummary = computed(() =>
    this.store
      .scenarioSummaries()
      .find((s) => s.id === this.store.activeScenarioId()),
  );

  createScenario() {
    const name = this.scenarioName().trim() || 'My First Scenario';
    this.store.addScenario(name);
    const newId = this.store.activeScenarioId();
    this.router.navigate(['../editor', newId, 'settings'], {
      relativeTo: this.route,
    });
  }

  goToScenario(id: string) {
    this.store.setActiveScenario(id);
    this.router.navigate(['../editor', id, 'settings'], {
      relativeTo: this.route,
    });
  }
}
