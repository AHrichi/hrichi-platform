import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration, ChartOptions } from 'chart.js';
import { FinancialStore } from '../../financial.store';
import { ThemeService } from '../../services/theme.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

import { ScenarioSelectorComponent } from '../scenario-selector/scenario-selector.component';
import { UiStatCellComponent } from '../../ui/ui-stat-cell/ui-stat-cell.component';
import { ElementToggleListComponent } from '../element-toggle-list/element-toggle-list.component';
import { UiTooltipComponent } from '../../ui/ui-tooltip/ui-tooltip.component';
import { IncomeSource, Expense, Loan, TogglableItem } from '../../store/models';
import { ScenarioSummaryData, fmtCurrency } from '../../utils/chart-utils';
import { computeScenarioProjection } from '../../utils/projection-engine';

interface ScenarioSummaryWithVariance extends ScenarioSummaryData {
  variance: {
    actualIncome: number;
    actualExpense: number;
    plannedIncome: number;
    plannedExpense: number;
    incomeVariance: number;
    expenseVariance: number;
    incomeProgress: number;
    expenseProgress: number;
  };
}

function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number,
): number {
  if (termMonths <= 0) return 0;
  if (annualRate === 0) return principal / termMonths;
  const r = annualRate / 100 / 12;
  return (
    (principal * (r * Math.pow(1 + r, termMonths))) /
    (Math.pow(1 + r, termMonths) - 1)
  );
}

@Component({
  selector: 'app-scenario-compare',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    BaseChartDirective,
    ScenarioSelectorComponent,
    UiStatCellComponent,
    ElementToggleListComponent,
    UiTooltipComponent,
  ],
  templateUrl: './scenario-compare.component.html',
  styleUrls: ['./scenario-compare.component.scss'],
})
export class ScenarioCompareComponent {
  store = inject(FinancialStore);
  themeService = inject(ThemeService);
  isDarkMode = this.themeService.isDarkMode;

  hiddenScenarioIds = signal<Set<string>>(new Set());
  collapsedSections = signal<Set<string>>(new Set());

  // Slider controls
  incomeMult = signal(1);
  expenseMult = signal(1);
  inflationOverride = signal<number | null>(null);
  yieldOverride = signal<number | null>(null);

  localSummaries = computed(() => {
    const overrides = {
      incomeMult: this.incomeMult(),
      expenseMult: this.expenseMult(),
      inflationOverride: this.inflationOverride() ?? undefined,
      yieldOverride: this.yieldOverride() ?? undefined,
    };
    return this.store.scenarios().map((scenario) => {
      const startDateObj = new Date(scenario.startDate || new Date());
      const proj = computeScenarioProjection(
        scenario,
        this.store.currentBalance(),
        startDateObj,
        overrides,
      );
      return {
        id: scenario.id,
        name: scenario.name,
        years: scenario.projectionYears,
        inflationRate: overrides.inflationOverride ?? scenario.inflationRate,
        investmentYield: overrides.yieldOverride ?? scenario.investmentYield,
        totalIncome: proj.totalIncome,
        totalExpenses: proj.totalExpenses,
        totalGoals: proj.totalGoals,
        monthlyAverage:
          (proj.totalIncome - proj.totalExpenses) /
          (scenario.projectionYears * 12),
        finalReserve:
          proj.history[proj.history.length > 0 ? proj.history.length - 1 : 0],
        incomes: scenario.incomes,
        expenses: scenario.expenses,
        goals: scenario.goals,
        loans: scenario.loans || [],
        goalMilestones: proj.goalMilestones,
        history: proj.history,
        dateLabels: proj.dateLabels,
        startDate: scenario.startDate,
      };
    });
  });

  localChartDatasets = computed(() => {
    const chartColors = ['#166534', '#2563eb', '#ca8a04', '#dc2626', '#9333ea'];
    return this.localSummaries().map((summary, index) => ({
      data: summary.history,
      label: summary.name,
      fill: false,
      tension: 0.4,
      borderColor: chartColors[index % chartColors.length],
      backgroundColor: chartColors[index % chartColors.length],
      pointRadius: 0,
      pointHoverRadius: 6,
      borderWidth: 3,
    }));
  });

  toggleVisibility(id: string) {
    this.hiddenScenarioIds.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  }

  toggleSection(section: string) {
    this.collapsedSections.update((set) => {
      const newSet = new Set(set);
      if (newSet.has(section)) newSet.delete(section);
      else newSet.add(section);
      return newSet;
    });
  }

  visibleSummaries = computed<ScenarioSummaryWithVariance[]>(() => {
    const summaries = this.localSummaries().filter(
      (s) => !this.hiddenScenarioIds().has(s.id),
    );

    const transactions = this.store.transactions();
    const now = new Date();
    const currentMonthActuals = transactions.filter((t) => {
      const d = new Date(t.date);
      return (
        d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
      );
    });

    const actualIncome = currentMonthActuals
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const actualExpense = currentMonthActuals
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return summaries.map((summary) => {
      const scenarioStart = summary.startDate
        ? new Date(summary.startDate)
        : new Date();
      const currentMonthIndex =
        (now.getFullYear() - scenarioStart.getFullYear()) * 12 +
        (now.getMonth() - scenarioStart.getMonth()) +
        1;

      let plannedIncome = 0;
      summary.incomes.forEach((i: IncomeSource) => {
        if (
          i.isEnabled !== false &&
          currentMonthIndex >= i.startMonth &&
          (!i.endMonth || currentMonthIndex <= i.endMonth)
        ) {
          let amount = i.amount;
          const yPassed = Math.floor((currentMonthIndex - i.startMonth) / 12);
          if (i.growthType === 'fixed') amount += yPassed * i.growthValue;
          else if (i.growthType === 'percentage')
            amount *= Math.pow(1 + i.growthValue / 100, yPassed);
          plannedIncome += amount;
        }
      });

      let plannedExpense = 0;
      summary.expenses.forEach((e: Expense) => {
        const s = e.startMonth || 1;
        const interval = e.recurrenceInterval || 1;
        if (
          e.isEnabled !== false &&
          currentMonthIndex >= s &&
          (!e.monthsActive || currentMonthIndex < s + e.monthsActive)
        ) {
          if ((currentMonthIndex - s) % interval === 0) {
            plannedExpense += e.amount;
          }
        }
      });
      summary.loans.forEach((l: Loan) => {
        const endMonth = l.startMonth + l.termMonths - 1;
        if (
          l.isEnabled !== false &&
          currentMonthIndex >= l.startMonth &&
          currentMonthIndex <= endMonth
        ) {
          plannedExpense += calculateMonthlyPayment(
            l.principal,
            l.annualInterestRate,
            l.termMonths,
          );
        }
      });

      const incomeProgress = plannedIncome
        ? Math.min((actualIncome / plannedIncome) * 100, 100)
        : 0;
      const expenseProgress = plannedExpense
        ? Math.min((actualExpense / plannedExpense) * 100, 100)
        : 0;

      return {
        ...summary,
        variance: {
          actualIncome,
          actualExpense,
          plannedIncome,
          plannedExpense,
          incomeVariance: actualIncome - plannedIncome,
          expenseVariance: plannedExpense - actualExpense,
          incomeProgress,
          expenseProgress,
        },
      };
    });
  });

  combinedChartData = computed<ChartConfiguration<'line'>['data']>(() => {
    const maxMonths = this.store.maxProjectionMonths();
    const allDatasets = this.localChartDatasets();
    const scenarios = this.store.scenarios();
    const summaries = this.localSummaries();

    const visibleDatasets = allDatasets.filter((_, index) => {
      const scenarioId = scenarios[index].id;
      return !this.hiddenScenarioIds().has(scenarioId);
    });

    const longestSummary = summaries.reduce(
      (longest, current) =>
        (current.dateLabels?.length || 0) > (longest?.dateLabels?.length || 0)
          ? current
          : longest,
      summaries[0],
    );

    const labels = longestSummary?.dateLabels
      ? longestSummary.dateLabels.slice(0, maxMonths)
      : Array.from({ length: maxMonths }, (_, i) => `Month ${i + 1}`);

    return {
      labels: labels,
      datasets: visibleDatasets,
    };
  });

  combinedChartOptions = computed<ChartOptions<'line'>>(() => {
    const isDark = this.isDarkMode();
    const textColor = isDark ? '#f8fafc' : '#333';
    const gridColor = isDark ? '#334155' : '#e2e8f0';

    return {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: { color: textColor },
        },
        tooltip: {
          mode: 'index',
          intersect: false,
          callbacks: {
            label: (context) => {
              let label = context.dataset.label || '';
              if (label) label += ': ';
              if (context.parsed.y !== null) {
                label += new Intl.NumberFormat('en-TN', {
                  style: 'currency',
                  currency: 'TND',
                  maximumFractionDigits: 0,
                }).format(context.parsed.y);
              }
              return label;
            },
          },
        },
      },
      scales: {
        x: {
          grid: { display: false },
          ticks: { color: textColor, maxTicksLimit: 24 },
        },
        y: { grid: { color: gridColor }, ticks: { color: textColor } },
      },
      interaction: { mode: 'nearest', axis: 'x', intersect: false },
    };
  });

  exportJson() {
    const fullState = {
      accounts: this.store.accounts(),
      categories: this.store.categories(),
      currentBalance: this.store.currentBalance(),
      transactions: this.store.transactions(),
      scenarios: this.store.scenarios(),
      activeScenarioId: this.store.activeScenarioId(),
    };
    const defaultName = `backup_${new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').substring(0, 19)}`;
    let fileName = defaultName;
    try {
      const input = prompt(
        'Enter a name for your JSON backup file:',
        defaultName,
      );
      if (input === null) return;
      fileName = input.trim() || defaultName;
    } catch {}
    if (!fileName.endsWith('.json')) fileName += '.json';

    const dataStr = JSON.stringify(fullState, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  importJson(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const parsedData = JSON.parse(e.target?.result as string);
        let scenarios;
        let activeScenarioId;
        let accounts;
        let categories;
        let currentBalance;
        let transactions;

        if (Array.isArray(parsedData)) {
          scenarios = parsedData;
          activeScenarioId =
            parsedData.length > 0 ? parsedData[0].id : crypto.randomUUID();
          accounts = [
            {
              id: crypto.randomUUID(),
              name: 'Cash',
              type: 'cash' as const,
              initialBalance: 0,
            },
          ];
          categories = [];
          currentBalance = 0;
          transactions = [];
        } else if (parsedData && parsedData.scenarios) {
          scenarios = parsedData.scenarios;
          activeScenarioId =
            parsedData.activeScenarioId || parsedData.scenarios[0].id;
          accounts = parsedData.accounts || [
            {
              id: crypto.randomUUID(),
              name: 'Cash',
              type: 'cash' as const,
              initialBalance: parsedData.currentBalance || 0,
            },
          ];
          categories = parsedData.categories || [];
          currentBalance = parsedData.currentBalance || 0;
          transactions = (parsedData.transactions || []).map(
            (t: { accountId?: string }) => ({
              ...t,
              accountId: t.accountId || '',
            }),
          );
        } else {
          throw new Error('Invalid save file format');
        }

        this.store.loadState({
          scenarios,
          activeScenarioId,
          accounts,
          categories,
          budgets: [],
          currentBalance,
          transactions,
        });
        alert('Data imported successfully!');
      } catch (err) {
        console.error('Import Error:', err);
        alert('Error parsing the JSON file. Make sure it is a valid backup.');
      }
    };
    reader.readAsText(file);
    input.value = '';
  }

  async exportPdf() {
    const scenario = this.store.activeScenario();
    if (!scenario) return;
    const safeName = scenario.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const summaries = this.store.scenarioSummaries();
    const summary = summaries.find((s) => s.id === scenario.id);
    const pdf = new jsPDF('p', 'mm', 'a4');
    const pw = pdf.internal.pageSize.getWidth();
    const margin = 14;
    const contentW = pw - 2 * margin;
    let y = margin;

    const writeLine = (
      text: string,
      fontSize = 11,
      color?: [number, number, number],
      bold = false,
    ) => {
      if (bold) pdf.setFont('helvetica', 'bold');
      else pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(fontSize);
      if (color) pdf.setTextColor(color[0], color[1], color[2]);
      else pdf.setTextColor(30, 41, 59);
      const lines = pdf.splitTextToSize(text, contentW);
      for (const line of lines) {
        if (y + 6 > 285) {
          pdf.addPage();
          y = margin;
        }
        pdf.text(line, margin, y);
        y += 6;
      }
    };

    const writeTable = (headers: string[], rows: string[][]) => {
      const colW = contentW / headers.length;
      const rowH = 6;
      if (y + rowH * (rows.length + 2) > 280) {
        pdf.addPage();
        y = margin;
      }
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.setTextColor(255, 255, 255);
      pdf.setFillColor(79, 70, 229);
      headers.forEach((h, i) => {
        pdf.rect(margin + i * colW, y, colW, rowH, 'F');
        pdf.text(h, margin + i * colW + 1, y + 4);
      });
      y += rowH;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(8);
      rows.forEach((row, ri) => {
        if (y + rowH > 285) {
          pdf.addPage();
          y = margin;
        }
        pdf.setTextColor(30, 41, 59);
        if (ri % 2 === 0) {
          pdf.setFillColor(241, 245, 249);
          row.forEach((_, i) =>
            pdf.rect(margin + i * colW, y, colW, rowH, 'F'),
          );
        }
        row.forEach((c, i) => pdf.text(c, margin + i * colW + 1, y + 4));
        y += rowH;
      });
      y += 4;
    };

    // Title
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(20);
    pdf.setTextColor(79, 70, 229);
    pdf.text('Financial Strategy Report', margin, y);
    y += 8;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.setTextColor(100, 116, 139);
    pdf.text(
      `Scenario: ${scenario.name}  |  Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
      margin,
      y,
    );
    y += 12;

    // Summary
    writeLine('SCENARIO OVERVIEW', 13, [79, 70, 229], true);
    y += 2;
    writeTable(
      ['Parameter', 'Value'],
      [
        ['Projection Period', `${scenario.projectionYears} years`],
        ['Inflation Rate', `${scenario.inflationRate}%`],
        ['Investment Yield', `${scenario.investmentYield}%`],
        ['Start Date', scenario.startDate],
      ],
    );

    // Income Sources
    const activeIncomes = scenario.incomes.filter((i) => i.isEnabled !== false);
    if (activeIncomes.length > 0) {
      writeLine('INCOME SOURCES', 13, [79, 70, 229], true);
      y += 2;
      writeTable(
        ['Name', 'Monthly', 'Start', 'End', 'Growth'],
        activeIncomes.map((i) => [
          i.name,
          fmtCurrency(i.amount),
          `Mo ${i.startMonth}`,
          i.endMonth ? `Mo ${i.endMonth}` : 'Ongoing',
          i.growthType === 'none'
            ? '—'
            : `${i.growthValue}${i.growthType === 'percentage' ? '%' : ' TND'}/yr`,
        ]),
      );
    }

    // Expenses
    const activeExpenses = scenario.expenses.filter(
      (e) => e.isEnabled !== false,
    );
    if (activeExpenses.length > 0) {
      writeLine('EXPENSES', 13, [79, 70, 229], true);
      y += 2;
      writeTable(
        ['Name', 'Monthly', 'Start', 'Duration'],
        activeExpenses.map((e) => [
          e.name,
          fmtCurrency(e.amount),
          `Mo ${e.startMonth || 1}`,
          e.monthsActive ? `${e.monthsActive} mo` : 'Ongoing',
        ]),
      );
    }

    // Goals
    const activeGoals = scenario.goals.filter((g) => g.isEnabled !== false);
    if (activeGoals.length > 0) {
      writeLine('GOALS', 13, [79, 70, 229], true);
      y += 2;
      writeTable(
        ['Goal', 'Target', 'Priority', 'Status'],
        activeGoals.map((g) => {
          const ms = summary?.goalMilestones?.find((m) => m.id === g.id);
          const status = ms?.status || '—';
          return [
            g.name,
            fmtCurrency(g.amount),
            `${g.priority || 1}`,
            status.replace(/_/g, ' '),
          ];
        }),
      );
    }

    // Loans
    const activeLoans = (scenario.loans || []).filter(
      (l) => l.isEnabled !== false,
    );
    if (activeLoans.length > 0) {
      writeLine('LOANS', 13, [79, 70, 229], true);
      y += 2;
      writeTable(
        ['Name', 'Principal', 'Rate', 'Term', 'Start'],
        activeLoans.map((l) => [
          l.name,
          fmtCurrency(l.principal),
          `${l.annualInterestRate}%`,
          `${l.termMonths} mo`,
          `Mo ${l.startMonth}`,
        ]),
      );
    }

    // Key Figures
    writeLine('KEY FIGURES', 13, [79, 70, 229], true);
    y += 2;
    if (summary) {
      writeTable(
        ['Metric', 'Value'],
        [
          ['Total Income', fmtCurrency(summary.totalIncome)],
          ['Total Expenses', fmtCurrency(summary.totalExpenses)],
          ['Total Goals', fmtCurrency(summary.totalGoals)],
          ['Final Reserve', fmtCurrency(summary.finalReserve)],
          ['Monthly Average', fmtCurrency(summary.monthlyAverage)],
        ],
      );
    }

    // Dashboard Screenshot
    const element = document.querySelector(
      '.dashboard-container',
    ) as HTMLElement;
    if (element) {
      pdf.addPage();
      const origBg = element.style.background;
      element.style.background = this.isDarkMode() ? '#0f172a' : '#f8fafc';
      try {
        const canvas = await html2canvas(element, {
          scale: 2,
          useCORS: true,
          logging: false,
        });
        const imgData = canvas.toDataURL('image/png');
        const imgH = (canvas.height * pw) / canvas.width;
        pdf.addImage(imgData, 'PNG', 0, margin, pw, imgH);
      } finally {
        element.style.background = origBg;
      }
    }

    pdf.save(
      `Financial_Report_${safeName}_${new Date().toISOString().replace(/[:.]/g, '-').replace('T', '_').substring(0, 19)}.pdf`,
    );
  }
}
