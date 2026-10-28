import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { FinancialStore } from '../../financial.store';
import { ThemeService } from '../../services/theme.service';
import { ScenarioSelectorComponent } from '../../components/scenario-selector/scenario-selector.component';
import { UiTooltipComponent } from '../../ui/ui-tooltip/ui-tooltip.component';
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
import { computeScenarioProjection } from '../../utils/projection-engine';

export interface Insight {
  id: string;
  type: 'positive' | 'neutral' | 'warning';
  title: string;
  description: string;
  actionText: string;
}

@Component({
  selector: 'app-analytics-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    BaseChartDirective,
    ScenarioSelectorComponent,
    UiTooltipComponent,
  ],
  templateUrl: './analytics-page.component.html',
  styleUrls: ['./analytics-page.component.scss'],
})
export class AnalyticsPageComponent {
  readonly store = inject(FinancialStore);
  readonly themeService = inject(ThemeService);
  readonly router = inject(Router);
  readonly route = inject(ActivatedRoute);
  readonly isDarkMode = this.themeService.isDarkMode;
  readonly Math = Math;

  activeAnalyticsTab: 'overview' | 'trajectory' | 'goals' = 'overview';
  timeView = signal<TimeView>('monthly');

  todayLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  activeSummary = computed<ScenarioSummaryData | null>(() => {
    return (
      this.store
        .scenarioSummaries()
        .find((s) => s.id === this.store.activeScenarioId()) ||
      this.store.scenarioSummaries()[0] ||
      null
    );
  });

  hasData = computed(
    () => this.store.scenarios().length > 0 && !!this.activeSummary(),
  );

  financialOverview = computed(() => {
    const s = this.activeSummary();
    const perf = this.store.currentMonthPerformance();
    const balance = this.store.currentBalance();
    if (!s) {
      return {
        currentBalance: balance,
        totalIncome: perf.plannedIncome,
        totalExpenses: perf.plannedExpense,
        monthlyNet: perf.plannedNet,
        finalReserve: 0,
        totalGoals: 0,
        years: 0,
      };
    }
    return {
      currentBalance: balance,
      totalIncome: s.totalIncome,
      totalExpenses: s.totalExpenses,
      monthlyNet: perf.plannedNet,
      finalReserve: s.finalReserve,
      totalGoals: s.totalGoals,
      years: s.years,
    };
  });

  getAchievedDate(monthOffset?: number): string {
    if (!monthOffset) return '';
    const s = this.activeSummary();
    if (!s) return '';
    const scenario = this.store.scenarios().find((sc) => sc.id === s.id);
    if (!scenario || !scenario.startDate) return '';

    const d = new Date(scenario.startDate);
    d.setMonth(d.getMonth() + monthOffset - 1);
    return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }

  private findMilestone(
    milestones: GoalMilestone[],
    dataIndex: number,
  ): GoalMilestone | undefined {
    return milestones.find((m) => m.achievedMonth === dataIndex + 1);
  }

  trajectoryChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const s = this.activeSummary();
    if (!s) return { labels: [], datasets: [] };
    const view = this.timeView();
    const agg = aggTrajectory(s, view);
    const milestones = aggMilestones(s, view);
    return {
      labels: agg.labels,
      datasets: [
        {
          data: agg.data,
          label: 'Projected Capital',
          borderColor: '#4f46e5',
          backgroundColor: trajectoryGradient,
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
        {
          data: agg.realityData,
          label: 'Reality (Ledger)',
          borderColor: '#10b981',
          backgroundColor: 'transparent',
          fill: false,
          tension: 0.4,
          borderDash: [5, 5],
          pointRadius: 3,
          pointHoverRadius: 6,
          pointBackgroundColor: '#10b981',
        },
      ],
    };
  });

  trajectoryChartOptions = computed<ChartOptions<'line'>>(() => {
    const s = this.activeSummary();
    const isDark = this.isDarkMode();
    const textColor = isDark ? '#f8fafc' : '#333';
    const gridColor = isDark ? '#334155' : '#e2e8f0';
    const milestones = s ? aggMilestones(s, this.timeView()) : [];
    const view = this.timeView();

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true, labels: { color: textColor } },
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
    const s = this.activeSummary();
    if (!s) return { labels: [], datasets: [] };
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
    const milestones: GoalMilestone[] = this.currentGoalProgress();
    const reality: GoalMilestone[] = this.realityGoalProgress();
    return {
      labels: milestones.map((m) => m.name),
      datasets: [
        {
          label: 'Projected',
          data: milestones.map((m) => m.fundAccumulated),
          backgroundColor: 'rgba(79, 70, 229, 0.85)',
          borderRadius: 4,
        },
        {
          label: 'Target',
          data: milestones.map((m) => m.amount),
          backgroundColor: 'rgba(148, 163, 184, 0.4)',
          borderRadius: 4,
        },
        {
          label: 'Reality',
          data: reality.map((m) => m.fundAccumulated),
          backgroundColor: 'rgba(16, 185, 129, 0.75)',
          borderRadius: 4,
        },
      ],
    };
  });

  goalsChartOptions = computed<ChartOptions<'bar'>>(() => {
    const isDark = this.isDarkMode();
    const textColor = isDark ? '#f8fafc' : '#333';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'bottom',
          labels: { color: textColor, usePointStyle: true, boxWidth: 8 },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              const value = context.parsed.y || 0;
              return `${context.dataset.label}: ${fmtCurrency(value)}`;
            },
          },
        },
      },
      scales: {
        x: { grid: { display: false }, ticks: { color: textColor } },
        y: {
          grid: { color: gridColor },
          ticks: { color: textColor },
          beginAtZero: true,
        },
      },
    };
  });

  overallGoalScore = computed(() => {
    const milestones = this.currentGoalProgress();
    if (milestones.length === 0) return 0;
    const totalTarget = milestones.reduce((sum, m) => sum + m.amount, 0);
    if (totalTarget <= 0) return 0;
    const totalAccumulated = milestones.reduce(
      (sum, m) => sum + m.fundAccumulated,
      0,
    );
    return Math.min((totalAccumulated / totalTarget) * 100, 100);
  });

  overallRealityScore = computed(() => {
    const milestones = this.realityGoalProgress();
    if (milestones.length === 0) return 0;
    const totalTarget = milestones.reduce((sum, m) => sum + m.amount, 0);
    if (totalTarget <= 0) return 0;
    const totalAccumulated = milestones.reduce(
      (sum, m) => sum + m.fundAccumulated,
      0,
    );
    return Math.min((totalAccumulated / totalTarget) * 100, 100);
  });

  goalScoreDetails = computed(() => {
    const milestones = this.currentGoalProgress();
    return {
      achieved: milestones.filter((m) => m.status === 'achieved').length,
      onTrack: milestones.filter((m) => m.status === 'in_progress').length,
      atRisk: 0,
      offTrack: milestones.filter((m) => m.status === 'pending').length,
    };
  });

  realityScoreDetails = computed(() => {
    const milestones = this.realityGoalProgress();
    return {
      achieved: milestones.filter((m) => m.status === 'achieved').length,
      onTrack: milestones.filter((m) => m.status === 'in_progress').length,
      atRisk: 0,
      offTrack: milestones.filter((m) => m.status === 'pending').length,
    };
  });

  selectScenario(id: string) {
    this.store.setActiveScenario(id);
  }

  createScenario(name: string) {
    this.store.addScenario(name);
  }

  duplicateScenario(id: string) {
    this.store.duplicateScenario(id);
  }

  renameScenario(event: { id: string; name: string }) {
    this.store.updateSpecificScenarioName(event.id, event.name);
  }

  deleteScenario(id: string) {
    const scenarios = this.store.scenarios();
    if (scenarios.length <= 1) return;
    this.store.deleteScenario(id);
    if (this.store.scenarios().length === 0) {
      this.router.navigate(['../home'], { relativeTo: this.route });
    }
  }

  getIncomeProgress(): number {
    const perf = this.store.currentMonthPerformance();
    return getIncomeProgress(perf.actualIncome, perf.plannedIncome);
  }

  getExpenseProgress(): number {
    const perf = this.store.currentMonthPerformance();
    return getExpenseProgress(perf.actualExpense, perf.plannedExpense);
  }

  trajectoryStartDate = computed(
    () => this.activeSummary()?.dateLabels?.[0] || 'N/A',
  );

  trajectoryFinalCapital = computed(() => {
    const h = this.activeSummary()?.history;
    return h ? h[h.length - 1] : 0;
  });

  trajectoryTotalOutflow = computed(() => {
    const s = this.activeSummary();
    return (s?.totalExpenses || 0) + (s?.totalGoals || 0);
  });

  trajectoryYears = computed(() => this.activeSummary()?.years || 0);
  trajectoryTotalIncome = computed(
    () => this.activeSummary()?.totalIncome || 0,
  );
  trajectoryReserveAfterGoals = computed(
    () => this.activeSummary()?.finalReserve || 0,
  );
  activeGoalMilestones = computed(
    () => this.activeSummary()?.goalMilestones || [],
  );
  currentGoalProgress = computed(() => this.store.currentGoalProgress());
  realityGoalProgress = computed(() => this.store.realityGoalProgress());
  realityMonthlyCashFlow = computed(() => this.store.realityMonthlyCashFlow());
  projectedBalance = computed(() => this.store.projectedBalance());
  activeScenario = computed(() => this.store.activeScenario());

  smartInsights = computed<Insight[]>(() => {
    const scenario = this.activeScenario();
    if (!scenario || !scenario.goals.length) return [];

    const balance = this.store.currentBalance();
    const startDateObj = new Date(scenario.startDate || new Date());

    const baseline = computeScenarioProjection(scenario, balance, startDateObj);
    const cutExpenses = computeScenarioProjection(
      scenario,
      balance,
      startDateObj,
      { expenseMult: 0.9 },
    );
    const boostIncome = computeScenarioProjection(
      scenario,
      balance,
      startDateObj,
      { incomeMult: 1.1 },
    );

    const insights: Insight[] = [];

    const expSavedGoal = cutExpenses.goalMilestones.find((m) => {
      const baseM = baseline.goalMilestones.find((b) => b.id === m.id);
      return (
        baseM &&
        m.achievedMonth !== null &&
        baseM.achievedMonth !== null &&
        m.achievedMonth < baseM.achievedMonth
      );
    });

    if (expSavedGoal) {
      const baseM = baseline.goalMilestones.find(
        (b) => b.id === expSavedGoal.id,
      )!;
      const monthsSaved = baseM.achievedMonth! - expSavedGoal.achievedMonth!;
      insights.push({
        id: 'cut-expenses',
        type: 'positive',
        title: `Save ${monthsSaved} months on '${expSavedGoal.name}'`,
        description: `If you reduce your total monthly expenses by 10%, you could achieve your goal for ${expSavedGoal.name} ${monthsSaved} month${monthsSaved > 1 ? 's' : ''} earlier.`,
        actionText: 'Review Expenses',
      });
    }

    const incSavedGoal = boostIncome.goalMilestones.find((m) => {
      const baseM = baseline.goalMilestones.find((b) => b.id === m.id);
      return (
        baseM &&
        m.achievedMonth !== null &&
        baseM.achievedMonth !== null &&
        m.achievedMonth < baseM.achievedMonth
      );
    });

    if (incSavedGoal && incSavedGoal.id !== expSavedGoal?.id) {
      const baseM = baseline.goalMilestones.find(
        (b) => b.id === incSavedGoal.id,
      )!;
      const monthsSaved = baseM.achievedMonth! - incSavedGoal.achievedMonth!;
      insights.push({
        id: 'boost-income',
        type: 'positive',
        title: `Accelerate '${incSavedGoal.name}'`,
        description: `Increasing your income by 10% (e.g. side hustle or raise) would fund ${incSavedGoal.name} ${monthsSaved} month${monthsSaved > 1 ? 's' : ''} sooner.`,
        actionText: 'Plan Income',
      });
    }

    if (insights.length === 0) {
      insights.push({
        id: 'on-track',
        type: 'neutral',
        title: 'Steady and Stable',
        description:
          "Your current projection is solid. Minor 10% tweaks to expenses or income won't drastically alter your immediate goal timeline.",
        actionText: 'View Timeline',
      });
    }

    return insights;
  });

  calcTargetDate(month: number | null): string {
    const scenario = this.activeScenario();
    if (!scenario || !scenario.startDate || month == null) return '—';
    const start = new Date(scenario.startDate);
    const target = new Date(start.getFullYear(), start.getMonth() + month, 1);
    return target.toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });
  }

  avgMonthlyIncome = computed(() => {
    const info = this.financialOverview();
    const months = Math.max(info.years * 12, 1);
    return info.totalIncome / months;
  });

  avgMonthlyExpenses = computed(() => {
    const info = this.financialOverview();
    const months = Math.max(info.years * 12, 1);
    return info.totalExpenses / months;
  });

  calendarDays = computed(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const transactions = this.store.transactions();
    const dayMap: Record<number, { income: number; expense: number }> = {};
    for (const t of transactions) {
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() === month) {
        const dd = d.getDate();
        if (!dayMap[dd]) dayMap[dd] = { income: 0, expense: 0 };
        if (t.type === 'income') dayMap[dd].income += t.amount;
        else if (t.type === 'expense') dayMap[dd].expense += t.amount;
      }
    }
    const result: {
      day: number;
      date: string;
      dow: number;
      income: number;
      expense: number;
      tooltip: string;
    }[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      const rec = dayMap[d] || { income: 0, expense: 0 };
      const parts: string[] = [];
      if (rec.income > 0) parts.push(`Income: ${fmtCurrency(rec.income)}`);
      if (rec.expense > 0) parts.push(`Expense: ${fmtCurrency(rec.expense)}`);
      result.push({
        day: d,
        date: date.toISOString().slice(0, 10),
        dow: date.getDay(),
        income: rec.income,
        expense: rec.expense,
        tooltip:
          parts.length > 0
            ? parts.join(' | ')
            : date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              }),
      });
    }
    return result;
  });

  fmtCurrency = (val: number) => fmtCurrency(val);

  fmtPct = (val: number) => `${val.toFixed(1)}%`;

  goalPct(accumulated: number, target: number): number {
    if (target <= 0) return 0;
    return Math.min((accumulated / target) * 100, 100);
  }

  realityMonthlyNetAvg = computed(() => {
    const flow = this.realityMonthlyCashFlow();
    const totalInc = flow.incomes.reduce((a, b) => a + b, 0);
    const totalExp = flow.expenses.reduce((a, b) => a + b, 0);
    const months = Math.max(flow.labels.length, 1);
    return (totalInc - totalExp) / months;
  });

  statusClass(status: string): string {
    switch (status) {
      case 'achieved':
        return 'status-achieved';
      case 'in_progress':
        return 'status-ontrack';
      default:
        return 'status-offtrack';
    }
  }

  formatStatus(status: string): string {
    switch (status) {
      case 'achieved':
        return 'Achieved';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return status;
    }
  }
}
