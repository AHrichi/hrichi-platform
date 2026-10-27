import { Component, input, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { FinancialStore } from '../../financial.store';
import {
  TimeView,
  ScenarioSummaryData,
  aggTrajectory,
  aggCashFlow,
  aggMilestones,
  trajectoryGradient,
  getIncomeProgress,
  getExpenseProgress,
  fmtCurrency,
  DOUGHNUT_COLORS,
} from '../../utils/chart-utils';
import { GoalMilestone } from '../../store/models';
import { UiTooltipComponent } from '../../ui/ui-tooltip/ui-tooltip.component';

@Component({
  selector: 'app-scenario-card',
  standalone: true,
  imports: [CommonModule, BaseChartDirective, UiTooltipComponent],
  templateUrl: './scenario-card.component.html',
  styleUrls: ['./scenario-card.component.scss'],
})
export class ScenarioCardComponent {
  summary = input.required<ScenarioSummaryData>();
  isDarkMode = input<boolean>(false);

  store = inject(FinancialStore);

  activeChartTab:
    'trajectory' | 'cashflow' | 'breakdown' | 'variance' | 'goals' =
    'trajectory';
  timeView = signal<TimeView>('monthly');

  getIncomeProgress(): number {
    const perf = this.store.currentMonthPerformance();
    return getIncomeProgress(perf.actualIncome, perf.plannedIncome);
  }

  getExpenseProgress(): number {
    const perf = this.store.currentMonthPerformance();
    return getExpenseProgress(perf.actualExpense, perf.plannedExpense);
  }

  private findMilestone(
    milestones: GoalMilestone[],
    dataIndex: number,
  ): GoalMilestone | undefined {
    return milestones.find((m) => m.achievedMonth === dataIndex + 1);
  }

  trajectoryChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const s = this.summary();
    const view = this.timeView();
    const agg = aggTrajectory(s, view);
    const milestones = aggMilestones(s, view);
    return {
      labels: agg.labels,
      datasets: [
        {
          data: agg.data,
          label: 'Accumulated Capital',
          borderColor: '#4f46e5',
          backgroundColor: trajectoryGradient as any,
          fill: true,
          tension: view === 'all' ? 0 : 0.4,
          pointRadius: (ctx) => {
            if (ctx.dataIndex === undefined || ctx.parsed.y === null) return 0;
            return this.findMilestone(milestones, ctx.dataIndex) ? 7 : 0;
          },
          pointBackgroundColor: (ctx) => {
            if (ctx.dataIndex === undefined || ctx.parsed.y === null)
              return 'transparent';
            const ms = this.findMilestone(milestones, ctx.dataIndex);
            if (!ms) return 'transparent';
            const pct = (ms.rank - 1) / Math.max(ms.totalActiveGoals - 1, 1);
            return `hsl(${pct * 220}, 85%, 55%)`;
          },
          pointBorderColor: (ctx) => {
            if (ctx.dataIndex === undefined || ctx.parsed.y === null)
              return 'transparent';
            return this.findMilestone(milestones, ctx.dataIndex)
              ? '#fff'
              : 'transparent';
          },
          pointBorderWidth: 2,
          pointHoverRadius: 10,
          pointHoverBorderWidth: 3,
          pointHitRadius: 12,
          pointHoverBackgroundColor: '#4f46e5',
          pointHoverBorderColor: '#fff',
        },
      ],
    };
  });

  trajectoryChartOptions = computed<ChartOptions<'line'>>(() => {
    const s = this.summary();
    const isDark = this.isDarkMode();
    const textColor = isDark ? '#f8fafc' : '#333';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const milestones = aggMilestones(s, this.timeView());
    const view = this.timeView();

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              const val = context.parsed.y;
              if (val === null || val === undefined) return '';
              const ms = this.findMilestone(milestones, context.dataIndex);
              if (ms) return `🎯 ${ms.name}: Achieved (${fmtCurrency(val)})`;
              return `Capital: ${fmtCurrency(val)}`;
            },
            afterLabel: (context) => {
              const ms = this.findMilestone(milestones, context.dataIndex);
              if (ms)
                return `Rank #${ms.rank} — Goal: ${ms.amount.toLocaleString()} TND`;
              return '';
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: {
            color: textColor,
            maxTicksLimit: view === 'all' ? 2 : 12,
            font: { size: 11 },
          },
        },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor, font: { size: 11 } },
          beginAtZero: true,
        },
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
    };
  });

  cashFlowChartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const flow = this.store.activeMonthlyCashFlow();
    const s = this.summary();
    const view = this.timeView();
    const agg = aggCashFlow(flow, s, view);
    return {
      labels: agg.labels,
      datasets: [
        {
          label: 'Income',
          data: agg.incomes,
          backgroundColor: 'rgba(16, 185, 129, 0.85)',
          borderRadius: 4,
        },
        {
          label: 'Expenses',
          data: agg.expenses,
          backgroundColor: 'rgba(239, 68, 68, 0.85)',
          borderRadius: 4,
        },
      ],
    };
  });

  cashFlowChartOptions = computed<ChartOptions<'bar'>>(() => {
    const isDark = this.isDarkMode();
    const textColor = isDark ? '#f8fafc' : '#333';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const view = this.timeView();

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: textColor, usePointStyle: true, boxWidth: 8 },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, maxTicksLimit: view === 'all' ? 2 : 12 },
        },
        y: { grid: { color: gridColor }, ticks: { color: textColor } },
      },
      interaction: { mode: 'index', intersect: false },
    };
  });

  breakdownChartData = computed<ChartConfiguration<'doughnut'>['data']>(() => {
    const breakdown = this.store.activeOutflowBreakdown();
    const isDark = this.isDarkMode();
    return {
      labels: breakdown.labels,
      datasets: [
        {
          data: breakdown.data,
          backgroundColor: DOUGHNUT_COLORS,
          borderWidth: 2,
          borderColor: isDark ? '#1e293b' : '#ffffff',
          hoverOffset: 4,
        },
      ],
    };
  });

  breakdownChartOptions = computed<ChartOptions<'doughnut'>>(() => {
    const isDark = this.isDarkMode();
    const textColor = isDark ? '#f8fafc' : '#333';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'right',
          labels: { color: textColor, usePointStyle: true, boxWidth: 8 },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              return ` ${fmtCurrency(context.parsed)}`;
            },
          },
        },
      },
      cutout: '65%',
    };
  });

  goalsChartData = computed<ChartConfiguration<'bar'>['data']>(() => {
    const milestones: GoalMilestone[] = this.summary().goalMilestones || [];
    return {
      labels: milestones.map((m) => m.name),
      datasets: [
        {
          label: 'Accumulated',
          data: milestones.map((m) => m.fundAccumulated),
          backgroundColor: milestones.map((m) => {
            return m.status === 'achieved'
              ? '#10b981'
              : m.status === 'in_progress'
                ? '#4f46e5'
                : '#ef4444';
          }),
          borderRadius: 6,
        },
        {
          label: 'Target',
          data: milestones.map((m) => m.amount),
          backgroundColor: 'rgba(148, 163, 184, 0.3)',
          borderRadius: 6,
        },
      ],
    };
  });

  goalsChartOptions = computed<ChartOptions<'bar'>>(() => {
    const isDark = this.isDarkMode();
    const textColor = isDark ? '#f8fafc' : '#333';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const milestones: GoalMilestone[] = this.summary().goalMilestones || [];

    return {
      responsive: true,
      maintainAspectRatio: false,
      indexAxis: 'y',
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: textColor, usePointStyle: true, boxWidth: 8 },
        },
        tooltip: {
          callbacks: {
            label: (context) => {
              const value = context.parsed.x || 0;
              const milestone = milestones[context.dataIndex];
              const pct =
                milestone && milestone.amount > 0
                  ? Math.min(
                      (milestone.fundAccumulated / milestone.amount) * 100,
                      100,
                    ).toFixed(0)
                  : 0;
              return `${context.dataset.label}: ${fmtCurrency(value)} (${pct}%)`;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { color: gridColor },
          ticks: { color: textColor },
          stacked: false,
        },
        y: {
          grid: { display: false },
          ticks: { color: textColor, font: { size: 11 } },
        },
      },
    };
  });
}
