import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FinancialStore } from '../../financial.store';
import { fmtCurrency } from '../../utils/chart-utils';

type CalcMode = 'basic' | 'finance';
type FinanceTool = 'fv' | 'pmt' | 'save';

@Component({
  selector: 'app-calculator-widget',
  standalone: true,
  imports: [CommonModule, DragDropModule],
  templateUrl: './calculator-widget.component.html',
  styleUrl: './calculator-widget.component.scss',
})
export class CalculatorWidgetComponent {
  private store = inject(FinancialStore);

  mode = signal<CalcMode>('basic');
  collapsed = signal(false);
  history = signal<string[]>([]);

  // Basic calc state
  display = signal('0');
  previousValue: number | null = null;
  currentOp: string | null = null;
  resetOnNext = false;
  memory = signal(0);

  // Finance tool selection
  financeTool = signal<FinanceTool>('fv');

  // FV inputs
  fvPv = 0;
  fvRate = 0;
  fvYears = 1;
  fvResult = signal(0);

  // PMT inputs
  pmtPrincipal = 0;
  pmtRate = 0;
  pmtMonths = 1;
  pmtResult = signal(0);

  // Save inputs
  saveTarget = 0;
  saveMonths = 1;
  saveStart = 0;
  saveResult = signal(0);

  onFvPvChange(event: Event): void {
    this.fvPv = Number((event.target as HTMLInputElement).value);
    this.calcFv();
  }
  onFvRateChange(event: Event): void {
    this.fvRate = Number((event.target as HTMLInputElement).value);
    this.calcFv();
  }
  onFvYearsChange(event: Event): void {
    this.fvYears = Number((event.target as HTMLInputElement).value);
    this.calcFv();
  }
  onPmtPrincipalChange(event: Event): void {
    this.pmtPrincipal = Number((event.target as HTMLInputElement).value);
    this.calcPmt();
  }
  onPmtRateChange(event: Event): void {
    this.pmtRate = Number((event.target as HTMLInputElement).value);
    this.calcPmt();
  }
  onPmtMonthsChange(event: Event): void {
    this.pmtMonths = Number((event.target as HTMLInputElement).value);
    this.calcPmt();
  }
  onSaveTargetChange(event: Event): void {
    this.saveTarget = Number((event.target as HTMLInputElement).value);
    this.calcSave();
  }
  onSaveMonthsChange(event: Event): void {
    this.saveMonths = Number((event.target as HTMLInputElement).value);
    this.calcSave();
  }
  onSaveStartChange(event: Event): void {
    this.saveStart = Number((event.target as HTMLInputElement).value);
    this.calcSave();
  }

  constructor() {
    this.listenKeyboard();
    this.calcFv();
    this.calcPmt();
    this.calcSave();
  }

  toggleMode() {
    this.mode.update((m) => (m === 'basic' ? 'finance' : 'basic'));
  }

  // ─── Snap: pull scenario values into finance inputs ───
  snap(field: string) {
    const s = this.store.activeScenario();
    const balance = this.store.currentBalance();
    const totalIncome = s.incomes.reduce(
      (sum, i) => (i.isEnabled !== false ? sum + i.amount : sum),
      0,
    );
    const totalExpenses = s.expenses.reduce(
      (sum, e) => (e.isEnabled !== false ? sum + e.amount : sum),
      0,
    );
    const totalGoals = s.goals.reduce(
      (sum, g) => (g.isEnabled !== false ? sum + g.amount : sum),
      0,
    );
    const projMonths = s.projectionYears * 12;

    const valMap: Record<string, number> = {
      currentBalance: balance,
      balance,
      income: totalIncome,
      expenses: totalExpenses,
      yield: s.investmentYield,
      totalGoals,
      projectionMonths: projMonths,
    };

    const value = valMap[field];
    if (value === undefined) return;

    switch (this.financeTool()) {
      case 'fv':
        if (field === 'currentBalance' || field === 'balance')
          this.fvPv = value;
        if (field === 'yield') this.fvRate = value;
        this.calcFv();
        break;
      case 'pmt':
        if (field === 'currentBalance' || field === 'balance')
          this.pmtPrincipal = value;
        if (field === 'yield') this.pmtRate = value;
        this.calcPmt();
        break;
      case 'save':
        if (field === 'totalGoals') this.saveTarget = value;
        if (field === 'currentBalance' || field === 'balance')
          this.saveStart = value;
        if (field === 'projectionMonths') this.saveMonths = value;
        this.calcSave();
        break;
    }
  }

  calcFv() {
    const r = this.fvRate / 100 / 12;
    const n = this.fvYears * 12;
    this.fvResult.set(this.fvPv * Math.pow(1 + r, n));
  }

  calcPmt() {
    const r = this.pmtRate / 100 / 12;
    if (r === 0) {
      this.pmtResult.set(this.pmtPrincipal / this.pmtMonths);
    } else {
      this.pmtResult.set(
        (this.pmtPrincipal * r * Math.pow(1 + r, this.pmtMonths)) /
          (Math.pow(1 + r, this.pmtMonths) - 1),
      );
    }
  }

  calcSave() {
    const remaining = this.saveTarget - this.saveStart;
    if (remaining <= 0 || this.saveMonths <= 0) {
      this.saveResult.set(0);
    } else {
      this.saveResult.set(remaining / this.saveMonths);
    }
  }

  fmtRes(val: number): string {
    if (Math.abs(val) >= 1000) return fmtCurrency(val);
    return val.toLocaleString(undefined, { maximumFractionDigits: 2 });
  }

  // ─── Basic Calculator ───
  private listenKeyboard() {
    document.addEventListener('keydown', (e: KeyboardEvent) => {
      if (this.collapsed() || this.mode() !== 'basic') return;
      const el = document.activeElement;
      if (
        el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT')
      )
        return;

      if (e.key >= '0' && e.key <= '9') {
        this.inputDigit(e.key);
        return;
      }
      if (e.key === '.') {
        this.inputDot();
        return;
      }
      if (e.key === '+') {
        this.inputOp('+');
        return;
      }
      if (e.key === '-') {
        this.inputOp('-');
        return;
      }
      if (e.key === '*') {
        this.inputOp('*');
        return;
      }
      if (e.key === '/') {
        e.preventDefault();
        this.inputOp('/');
        return;
      }
      if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        this.compute();
        return;
      }
      if (e.key === 'Escape') {
        this.clear();
        return;
      }
      if (e.key === 'Backspace') {
        e.preventDefault();
        this.backspace();
        return;
      }
      if (e.key === '%') {
        this.percent();
        return;
      }
    });
  }

  inputDigit(d: string) {
    if (this.resetOnNext) {
      this.display.set(d);
      this.resetOnNext = false;
    } else {
      this.display.set(this.display() === '0' ? d : this.display() + d);
    }
  }

  inputDot() {
    if (this.resetOnNext) {
      this.display.set('0.');
      this.resetOnNext = false;
      return;
    }
    if (!this.display().includes('.')) this.display.set(this.display() + '.');
  }

  inputOp(op: string) {
    const current = parseFloat(this.display());
    if (this.previousValue !== null && !this.resetOnNext) {
      this.display.set(
        this.calc(this.previousValue, current, this.currentOp!).toString(),
      );
    } else {
      this.previousValue = current;
    }
    this.currentOp = op;
    this.resetOnNext = true;
  }

  compute() {
    if (this.previousValue === null || this.currentOp === null) return;
    const current = parseFloat(this.display());
    const result = this.calc(this.previousValue, current, this.currentOp);
    this.addHistory(
      `${this.previousValue} ${this.currentOp} ${current} = ${result}`,
    );
    this.display.set(result.toString());
    this.previousValue = null;
    this.currentOp = null;
    this.resetOnNext = true;
  }

  percent() {
    const val = parseFloat(this.display());
    this.display.set((val / 100).toString());
  }

  clear() {
    this.display.set('0');
    this.previousValue = null;
    this.currentOp = null;
    this.resetOnNext = false;
  }

  backspace() {
    if (this.display().length > 1)
      this.display.set(this.display().slice(0, -1));
    else this.display.set('0');
  }

  toggleSign() {
    this.display.set((parseFloat(this.display()) * -1).toString());
  }

  memoryClear() {
    this.memory.set(0);
  }
  memoryRecall() {
    this.display.set(this.memory().toString());
    this.resetOnNext = true;
  }
  memoryAdd() {
    this.memory.update((v) => v + parseFloat(this.display()));
    this.resetOnNext = true;
  }
  memorySubtract() {
    this.memory.update((v) => v - parseFloat(this.display()));
    this.resetOnNext = true;
  }

  private addHistory(entry: string) {
    this.history.update((h) => [entry, ...h].slice(0, 5));
  }

  private calc(a: number, b: number, op: string): number {
    let result = 0;
    switch (op) {
      case '+':
        result = a + b;
        break;
      case '-':
        result = a - b;
        break;
      case '*':
        result = a * b;
        break;
      case '/':
        result = b !== 0 ? a / b : 0;
        break;
    }
    return parseFloat(result.toFixed(10));
  }
}
