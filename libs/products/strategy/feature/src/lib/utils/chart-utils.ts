import { Chart, ScriptableContext } from 'chart.js';
import { GoalMilestone, ScenarioSummary } from '../store/models';

export type TimeView = 'monthly' | 'yearly' | 'all';

export type ScenarioSummaryData = ScenarioSummary;

export function monthlyLabels(s: ScenarioSummaryData): string[] {
  return (
    s.dateLabels ||
    Array.from({ length: s.years * 12 }, (_, i) => `Mo ${i + 1}`)
  );
}

export function aggTrajectory(
  s: ScenarioSummaryData,
  view: TimeView,
): { labels: string[]; data: number[]; realityData: (number | null)[] } {
  if (view === 'monthly') {
    const realityData = s.realityTrajectory || [];
    const paddedRealityData = Array.from(
      { length: s.history?.length || 0 },
      (_, i) => (i < realityData.length ? realityData[i] : null),
    );
    return {
      labels: monthlyLabels(s),
      data: s.history || [],
      realityData: paddedRealityData,
    };
  }
  if (view === 'yearly') {
    const labels: string[] = [];
    const data: number[] = [];
    const realityData: (number | null)[] = [];
    const realHist = s.realityTrajectory || [];
    for (let y = 0; y < s.years; y++) {
      const idx = (y + 1) * 12 - 1;
      if (idx < (s.history || []).length) {
        data.push(s.history[idx]);
        labels.push(`Yr ${y + 1}`);
        realityData.push(idx < realHist.length ? realHist[idx] : null);
      }
    }
    return { labels, data, realityData };
  }

  const realityDataAll = s.realityTrajectory || [];
  const paddedRealityDataAll = Array.from(
    { length: s.history?.length || 0 },
    (_, i) => (i < realityDataAll.length ? realityDataAll[i] : null),
  );
  return {
    labels: monthlyLabels(s),
    data: s.history || [],
    realityData: paddedRealityDataAll,
  };
}

export function aggCashFlow(
  flow: { incomes: number[]; expenses: number[] },
  s: ScenarioSummaryData,
  view: TimeView,
): { labels: string[]; incomes: number[]; expenses: number[] } {
  if (view === 'monthly') {
    return {
      labels: monthlyLabels(s),
      incomes: flow.incomes,
      expenses: flow.expenses,
    };
  }
  if (view === 'yearly') {
    const labels: string[] = [];
    const incomes: number[] = [];
    const expenses: number[] = [];
    for (let y = 0; y < s.years; y++) {
      const start = y * 12;
      const end = Math.min(start + 12, flow.incomes.length);
      incomes.push(
        flow.incomes
          .slice(start, end)
          .reduce((a: number, b: number) => a + b, 0),
      );
      expenses.push(
        flow.expenses
          .slice(start, end)
          .reduce((a: number, b: number) => a + b, 0),
      );
      labels.push(`Yr ${y + 1}`);
    }
    return { labels, incomes, expenses };
  }
  const totInc = flow.incomes.reduce((a: number, b: number) => a + b, 0);
  const totExp = flow.expenses.reduce((a: number, b: number) => a + b, 0);
  return {
    labels: ['Total Income', 'Total Expenses'],
    incomes: [totInc],
    expenses: [totExp],
  };
}

export function aggMilestones(
  s: ScenarioSummaryData,
  view: TimeView,
): GoalMilestone[] {
  const all = s.goalMilestones || [];
  if (view === 'monthly') return all;
  if (view === 'yearly') {
    return all.map((m) => ({
      ...m,
      achievedMonth:
        m.achievedMonth !== null
          ? Math.max(1, Math.ceil(m.achievedMonth / 12))
          : null,
    }));
  }
  return all.map((m) => ({
    ...m,
    achievedMonth: m.achievedMonth !== null ? 1 : null,
  }));
}

export function trajectoryGradient(
  context: ScriptableContext<'line'>,
): string | CanvasGradient {
  const chart = context.chart;
  if (!chart.chartArea) return 'rgba(79, 70, 229, 0.1)';
  const gradient = chart.ctx.createLinearGradient(
    0,
    chart.chartArea.top,
    0,
    chart.chartArea.bottom,
  );
  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.25)');
  gradient.addColorStop(0.6, 'rgba(79, 70, 229, 0.08)');
  gradient.addColorStop(1, 'rgba(79, 70, 229, 0.01)');
  return gradient;
}

export function getIncomeProgress(
  actualIncome: number,
  plannedIncome: number,
): number {
  if (!plannedIncome) return 0;
  return Math.min((actualIncome / plannedIncome) * 100, 100);
}

export function getExpenseProgress(
  actualExpense: number,
  plannedExpense: number,
): number {
  if (!plannedExpense) return 0;
  return Math.min((actualExpense / plannedExpense) * 100, 100);
}

export function fmtCurrency(val: number): string {
  return new Intl.NumberFormat('en-TN', {
    style: 'currency',
    currency: 'TND',
    maximumFractionDigits: 0,
  }).format(val);
}

export const DOUGHNUT_COLORS = [
  '#4f46e5',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
];
