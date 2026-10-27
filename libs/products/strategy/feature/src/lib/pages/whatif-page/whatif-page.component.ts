import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, FormsModule, BaseChartDirective],
  template: `
    <div class="whatif-container" [class.dark]="isDarkMode()">
      <div class="whatif-header">
        <h1>🔮 What-If Simulator</h1>
        <p class="whatif-subtitle">
          Tweak key parameters and see how they affect your financial future
        </p>
      </div>

      <div class="whatif-layout">
        <div class="whatif-controls">
          <h3>Adjustments</h3>

          <div class="control-group">
            <label>Income Multiplier</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              [(ngModel)]="incomeMult"
            />
            <span class="control-val">{{ incomeMult().toFixed(2) }}×</span>
          </div>

          <div class="control-group">
            <label>Expense Multiplier</label>
            <input
              type="range"
              min="0.5"
              max="2"
              step="0.05"
              [(ngModel)]="expenseMult"
            />
            <span class="control-val">{{ expenseMult().toFixed(2) }}×</span>
          </div>

          <div class="control-group">
            <label>Investment Yield (%)</label>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              [(ngModel)]="yieldOverride"
            />
            <span class="control-val">{{ yieldOverride() }}%</span>
          </div>

          <div class="control-group">
            <label>Extra Monthly Savings</label>
            <input
              type="range"
              min="0"
              max="5000"
              step="100"
              [(ngModel)]="extraSavings"
            />
            <span class="control-val">{{ fmtCurrency(extraSavings()) }}</span>
          </div>

          <div class="control-group">
            <label>Inflation Rate (%)</label>
            <input
              type="range"
              min="0"
              max="15"
              step="0.5"
              [(ngModel)]="inflationOverride"
            />
            <span class="control-val">{{ inflationOverride() }}%</span>
          </div>

          <div class="whatif-results">
            <div class="result-item">
              <span class="result-label">Baseline Final</span>
              <span class="result-val baseline">{{
                fmtCurrency(baselineFinal())
              }}</span>
            </div>
            <div class="result-item">
              <span class="result-label">What-If Final</span>
              <span
                class="result-val"
                [class.positive]="whatifFinal() >= baselineFinal()"
                [class.negative]="whatifFinal() < baselineFinal()"
              >
                {{ fmtCurrency(whatifFinal()) }}
              </span>
            </div>
            <div class="result-item result-diff">
              <span class="result-label">Difference</span>
              <span
                class="result-val"
                [class.positive]="diff() >= 0"
                [class.negative]="diff() < 0"
              >
                {{ diff() >= 0 ? '+' : '' }}{{ fmtCurrency(diff()) }}
              </span>
            </div>
          </div>
        </div>

        <div class="whatif-chart">
          <canvas
            baseChart
            type="line"
            [data]="chartData()"
            [options]="chartOptions()"
          ></canvas>
        </div>
      </div>

      <button class="btn-apply" (click)="applyToScenario()">
        Apply Parameters to Current Scenario
      </button>
    </div>
  `,
  styles: [
    `
      .whatif-container {
        padding: 24px;
        max-width: 1200px;
        margin: 0 auto;
        color: #334155;
        &.dark {
          color: #f1f5f9;
          .whatif-controls {
            background: #1e293b;
            border-color: #334155;
          }
          .result-item {
            background: #0f172a;
          }
          .result-label {
            color: #94a3b8;
          }
          input[type='range'] {
            accent-color: #818cf8;
          }
        }
      }
      .whatif-header {
        margin-bottom: 24px;
        h1 {
          margin: 0 0 4px;
          font-size: 1.3rem;
        }
        .whatif-subtitle {
          font-size: 0.85rem;
          color: #64748b;
          margin: 0;
        }
      }
      .whatif-layout {
        display: grid;
        grid-template-columns: 300px 1fr;
        gap: 24px;
        margin-bottom: 20px;
      }
      @media (max-width: 768px) {
        .whatif-layout {
          grid-template-columns: 1fr;
        }
      }
      .whatif-controls {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 20px;
        h3 {
          margin: 0 0 16px;
          font-size: 1rem;
        }
      }
      .control-group {
        margin-bottom: 16px;
        label {
          display: block;
          font-size: 0.8rem;
          font-weight: 600;
          margin-bottom: 4px;
        }
        input {
          width: 100%;
        }
        .control-val {
          font-size: 0.75rem;
          color: #64748b;
          font-weight: 700;
        }
      }
      .whatif-results {
        margin-top: 20px;
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .result-item {
        background: #f8fafc;
        border-radius: 8px;
        padding: 10px 12px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        &.result-diff {
          border-top: 1px solid #e2e8f0;
          padding-top: 12px;
        }
      }
      .result-label {
        font-size: 0.75rem;
        color: #64748b;
      }
      .result-val {
        font-size: 0.9rem;
        font-weight: 700;
        &.baseline {
          color: #6366f1;
        }
        &.positive {
          color: #059669;
        }
        &.negative {
          color: #dc2626;
        }
      }
      .whatif-chart {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 14px;
        padding: 20px;
        min-height: 350px;
        .dark & {
          background: #1e293b;
          border-color: #334155;
        }
      }
      .btn-apply {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 10px 20px;
        font-size: 0.85rem;
        font-weight: 600;
        background: #4f46e5;
        color: #fff;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        &:hover {
          background: #4338ca;
        }
      }
    `,
  ],
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
