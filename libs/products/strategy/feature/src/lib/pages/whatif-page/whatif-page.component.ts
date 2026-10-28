import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { FinancialStore } from '../../financial.store';
import { ThemeService } from '../../services/theme.service';
import { Scenario } from '../../store/models';
import { fmtCurrency } from '../../utils/chart-utils';

import { computeScenarioProjection } from '../../utils/projection-engine';
@Component({
  selector: 'app-whatif-page',
  standalone: true,
  imports: [CommonModule, BaseChartDirective],
  templateUrl: './whatif-page.component.html',
  styleUrl: './whatif-page.component.scss',
})
export class WhatifPageComponent {
  readonly store = inject(FinancialStore);
  readonly themeService = inject(ThemeService);
  readonly isDarkMode = this.themeService.isDarkMode;
  readonly fmtCurrency = fmtCurrency;

  incomeMult = signal(1);
  expenseMult = signal(1);
  yieldOverride = signal<number | null>(null);
  extraSavings = signal(0);
  inflationOverride = signal<number | null>(null);

  updateIncomeMult(event: Event): void {
    this.incomeMult.set(Number((event.target as HTMLInputElement).value));
  }

  updateExpenseMult(event: Event): void {
    this.expenseMult.set(Number((event.target as HTMLInputElement).value));
  }

  updateYieldOverride(event: Event): void {
    this.yieldOverride.set(Number((event.target as HTMLInputElement).value));
  }

  updateExtraSavings(event: Event): void {
    this.extraSavings.set(Number((event.target as HTMLInputElement).value));
  }

  updateInflationOverride(event: Event): void {
    this.inflationOverride.set(
      Number((event.target as HTMLInputElement).value),
    );
  }

  private baseline = computed(() => {
    const scenario = this.store.activeScenario();
    if (!scenario) return { history: [], dateLabels: [] };
    const startDateObj = new Date(scenario.startDate || new Date());
    return computeScenarioProjection(
      scenario,
      this.store.currentBalance(),
      startDateObj,
    );
  });

  private whatif = computed(() => {
    const scenario = this.store.activeScenario();
    if (!scenario) return { history: [], dateLabels: [] };

    const overrides = {
      incomeMult: this.incomeMult(),
      expenseMult: this.expenseMult(),
      inflationOverride: this.inflationOverride() ?? scenario.inflationRate,
      yieldOverride: this.yieldOverride() ?? scenario.investmentYield,
    };

    const startDateObj = new Date(scenario.startDate || new Date());
    const proj = computeScenarioProjection(
      scenario,
      this.store.currentBalance(),
      startDateObj,
      overrides,
    );

    if (this.extraSavings() > 0) {
      proj.history = proj.history.map(
        (v, i) => v + this.extraSavings() * (i + 1),
      );
    }
    return proj;
  });

  baselineFinal = computed(() => {
    const h = this.baseline().history;
    return h.length > 0 ? h[h.length - 1] : 0;
  });

  whatifFinal = computed(() => {
    const h = this.whatif().history;
    return h.length > 0 ? h[h.length - 1] : 0;
  });

  diff = computed(() => this.whatifFinal() - this.baselineFinal());

  chartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const base = this.baseline();
    const wi = this.whatif();
    const labels =
      base.dateLabels.length > wi.dateLabels.length
        ? base.dateLabels
        : wi.dateLabels;
    return {
      labels,
      datasets: [
        {
          label: 'Baseline',
          data: base.history,
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99,102,241,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
        {
          label: 'What-If',
          data: wi.history,
          borderColor: '#f59e0b',
          backgroundColor: 'rgba(245,158,11,0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 0,
        },
      ],
    };
  });

  chartOptions = computed<ChartOptions<'line'>>(() => {
    const isDark = this.isDarkMode();
    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: {
            color: isDark ? '#f8fafc' : '#333',
            usePointStyle: true,
            boxWidth: 8,
          },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ${fmtCurrency(ctx.parsed.y || 0)}`,
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: isDark ? '#f8fafc' : '#333', maxTicksLimit: 10 },
        },
        y: {
          grid: { color: isDark ? '#334155' : '#e2e8f0' },
          ticks: { color: isDark ? '#f8fafc' : '#333' },
          beginAtZero: true,
        },
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
    };
  });

  applyToScenario() {
    const scenario = this.store.activeScenario();
    if (!scenario) return;
    const yieldVal = this.yieldOverride();
    if (yieldVal != null)
      this.store.updateSpecificScenarioYield(scenario.id, yieldVal);
    const inflVal = this.inflationOverride();
    if (inflVal != null)
      this.store.updateSpecificScenarioInflation(scenario.id, inflVal);
  }
}
