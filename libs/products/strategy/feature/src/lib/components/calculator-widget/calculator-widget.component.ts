import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { FinancialStore } from '../../financial.store';
import { fmtCurrency } from '../../utils/chart-utils';

type CalcMode = 'basic' | 'finance';
type FinanceTool = 'fv' | 'pmt' | 'save';

@Component({
  selector: 'app-calculator-widget',
  standalone: true,
  imports: [CommonModule, FormsModule, DragDropModule],
  template: `
    <div
      class="calc-widget"
      [class.finance-mode]="mode() === 'finance'"
      cdkDrag
      cdkDragBoundary=".theme-wrapper"
    >
      <div class="calc-header" cdkDragHandle>
        <span class="calc-title">🧮 Calculator</span>
        <div class="calc-header-actions">
          <button
            class="header-btn-sm"
            (click)="toggleMode()"
            [title]="mode() === 'basic' ? 'Financial Tools' : 'Basic'"
          >
            {{ mode() === 'basic' ? '📊' : '🔢' }}
          </button>
          <button class="header-btn-sm" (click)="collapsed.set(!collapsed())">
            {{ collapsed() ? '▸' : '▾' }}
          </button>
        </div>
      </div>

      @if (!collapsed()) {
        <div class="calc-body">
          @if (mode() === 'basic') {
            <div class="calc-display">
              <input type="text" readonly [ngModel]="display()" />
            </div>
            <div class="calc-memory">
              <button
                class="calc-btn mem"
                (click)="memoryClear()"
                title="Memory Clear"
              >
                MC
              </button>
              <button
                class="calc-btn mem"
                (click)="memoryRecall()"
                title="Memory Recall"
              >
                MR
              </button>
              <button
                class="calc-btn mem"
                (click)="memoryAdd()"
                title="Add to Memory"
              >
                M+
              </button>
              <button
                class="calc-btn mem"
                (click)="memorySubtract()"
                title="Subtract from Memory"
              >
                M−
              </button>
            </div>
            <div class="calc-buttons">
              <button class="calc-btn fn" (click)="clear()">C</button>
              <button class="calc-btn fn" (click)="backspace()">⌫</button>
              <button class="calc-btn fn" (click)="percent()">%</button>
              <button class="calc-btn op" (click)="inputOp('/')">÷</button>
              <button class="calc-btn" (click)="inputDigit('7')">7</button>
              <button class="calc-btn" (click)="inputDigit('8')">8</button>
              <button class="calc-btn" (click)="inputDigit('9')">9</button>
              <button class="calc-btn op" (click)="inputOp('*')">×</button>
              <button class="calc-btn" (click)="inputDigit('4')">4</button>
              <button class="calc-btn" (click)="inputDigit('5')">5</button>
              <button class="calc-btn" (click)="inputDigit('6')">6</button>
              <button class="calc-btn op" (click)="inputOp('-')">−</button>
              <button class="calc-btn" (click)="inputDigit('1')">1</button>
              <button class="calc-btn" (click)="inputDigit('2')">2</button>
              <button class="calc-btn" (click)="inputDigit('3')">3</button>
              <button class="calc-btn op" (click)="inputOp('+')">+</button>
              <button class="calc-btn zero" (click)="inputDigit('0')">0</button>
              <button class="calc-btn" (click)="inputDot()">.</button>
              <button class="calc-btn eq" (click)="compute()">=</button>
            </div>
          }

          @if (mode() === 'finance') {
            <div class="finance-tabs">
              <button
                [class.active]="financeTool() === 'fv'"
                (click)="financeTool.set('fv')"
              >
                FV
              </button>
              <button
                [class.active]="financeTool() === 'pmt'"
                (click)="financeTool.set('pmt')"
              >
                PMT
              </button>
              <button
                [class.active]="financeTool() === 'save'"
                (click)="financeTool.set('save')"
              >
                Goal
              </button>
            </div>

            <div class="finance-body">
              @if (financeTool() === 'fv') {
                <div class="fin-row">
                  <label>Present Value</label>
                  <input
                    type="number"
                    [ngModel]="fvPv"
                    (ngModelChange)="fvPv = $event; calcFv()"
                  />
                  <button
                    class="snap-btn"
                    (click)="snap('currentBalance')"
                    title="Use current balance"
                  >
                    📋
                  </button>
                </div>
                <div class="fin-row">
                  <label>Rate (% yearly)</label>
                  <input
                    type="number"
                    [ngModel]="fvRate"
                    (ngModelChange)="fvRate = $event; calcFv()"
                  />
                  <button
                    class="snap-btn"
                    (click)="snap('yield')"
                    title="Use scenario yield"
                  >
                    📋
                  </button>
                </div>
                <div class="fin-row">
                  <label>Years</label>
                  <input
                    type="number"
                    [ngModel]="fvYears"
                    (ngModelChange)="fvYears = $event; calcFv()"
                  />
                </div>
                <div class="fin-result">
                  Future Value: <strong>{{ fmtRes(fvResult()) }}</strong>
                </div>
              }

              @if (financeTool() === 'pmt') {
                <div class="fin-row">
                  <label>Loan Amount</label>
                  <input
                    type="number"
                    [ngModel]="pmtPrincipal"
                    (ngModelChange)="pmtPrincipal = $event; calcPmt()"
                  />
                </div>
                <div class="fin-row">
                  <label>Annual Rate (%)</label>
                  <input
                    type="number"
                    [ngModel]="pmtRate"
                    (ngModelChange)="pmtRate = $event; calcPmt()"
                  />
                </div>
                <div class="fin-row">
                  <label>Term (months)</label>
                  <input
                    type="number"
                    [ngModel]="pmtMonths"
                    (ngModelChange)="pmtMonths = $event; calcPmt()"
                  />
                </div>
                <div class="fin-result">
                  Monthly Payment: <strong>{{ fmtRes(pmtResult()) }}</strong>
                </div>
              }

              @if (financeTool() === 'save') {
                <div class="fin-row">
                  <label>Goal Amount</label>
                  <input
                    type="number"
                    [ngModel]="saveTarget"
                    (ngModelChange)="saveTarget = $event; calcSave()"
                  />
                  <button
                    class="snap-btn"
                    (click)="snap('totalGoals')"
                    title="Use total goals"
                  >
                    📋
                  </button>
                </div>
                <div class="fin-row">
                  <label>Target (months)</label>
                  <input
                    type="number"
                    [ngModel]="saveMonths"
                    (ngModelChange)="saveMonths = $event; calcSave()"
                  />
                  <button
                    class="snap-btn"
                    (click)="snap('projectionMonths')"
                    title="Use projection length"
                  >
                    📋
                  </button>
                </div>
                <div class="fin-row">
                  <label>Starting Amount</label>
                  <input
                    type="number"
                    [ngModel]="saveStart"
                    (ngModelChange)="saveStart = $event; calcSave()"
                  />
                  <button
                    class="snap-btn"
                    (click)="snap('currentBalance')"
                    title="Use current balance"
                  >
                    📋
                  </button>
                </div>
                <div class="fin-result">
                  Monthly Save: <strong>{{ fmtRes(saveResult()) }}</strong>
                </div>
              }
            </div>

            <div class="snap-quickpick">
              <span class="snap-label">Snap Values:</span>
              <button class="chip" (click)="snap('income')">Income</button>
              <button class="chip" (click)="snap('expenses')">Expenses</button>
              <button class="chip" (click)="snap('balance')">Balance</button>
              <button class="chip" (click)="snap('yield')">Yield</button>
            </div>
          }

          @if (history().length > 0) {
            <div class="calc-history">
              @for (h of history(); track $index) {
                <div class="history-item">{{ h }}</div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: [
    `
      .calc-widget {
        position: fixed;
        bottom: 24px;
        right: 24px;
        width: 240px;
        background: var(--surface);
        border: 1px solid var(--border-light);
        border-radius: 16px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        overflow: hidden;
        user-select: none;
        transition: width 0.2s ease;
      }

      .calc-widget.finance-mode {
        width: 300px;
      }

      .calc-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        cursor: grab;
        background: var(--bg-body);
        border-bottom: 1px solid var(--border-light);
        &:active {
          cursor: grabbing;
        }
      }

      .calc-title {
        font-weight: 700;
        font-size: 0.9rem;
        color: var(--text-main);
      }

      .calc-header-actions {
        display: flex;
        gap: 4px;
      }

      .header-btn-sm {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        color: var(--text-muted);
        padding: 2px 6px;
        border-radius: 6px;
        &:hover {
          background: var(--border-light);
          color: var(--text-main);
        }
      }

      .calc-body {
        padding: 12px;
      }

      .calc-display input {
        width: 100%;
        padding: 12px;
        border-radius: 10px;
        border: 1px solid var(--border-light);
        background: var(--input-bg);
        color: var(--text-main);
        font-size: 1.4rem;
        font-weight: 700;
        text-align: right;
        outline: none;
        box-sizing: border-box;
        margin-bottom: 10px;
        font-family: monospace;
      }

      .calc-memory {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 4px;
        margin-bottom: 6px;
      }

      .calc-memory .calc-btn.mem {
        padding: 6px 0;
        font-size: 0.7rem;
        background: var(--bg-body);
        color: var(--text-muted);
        border-radius: 6px;
        font-weight: 600;
        &:hover {
          background: var(--border-light);
          color: var(--text-main);
        }
      }

      .calc-buttons {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 6px;
      }

      .calc-btn {
        padding: 12px 0;
        border: none;
        border-radius: 10px;
        font-size: 1.05rem;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.15s;
        background: var(--input-bg);
        color: var(--text-main);
        &:hover {
          background: var(--border-light);
          transform: scale(0.95);
        }
        &.fn {
          color: var(--primary);
          font-size: 0.9rem;
        }
        &.op {
          background: var(--primary-light);
          color: var(--primary);
        }
        &.op:hover {
          background: var(--primary);
          color: white;
        }
        &.eq {
          background: var(--primary);
          color: white;
        }
        &.eq:hover {
          background: var(--primary-hover);
        }
        &.zero {
          grid-column: span 1;
        }
      }

      .finance-tabs {
        display: flex;
        gap: 4px;
        margin-bottom: 10px;
        button {
          flex: 1;
          padding: 6px;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          background: var(--input-bg);
          color: var(--text-muted);
          font-weight: 600;
          font-size: 0.8rem;
          cursor: pointer;
          transition: all 0.15s;
          &.active {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
          }
          &:hover:not(.active) {
            background: var(--border-light);
          }
        }
      }

      .finance-body {
        display: flex;
        flex-direction: column;
        gap: 8px;
        margin-bottom: 10px;
      }

      .fin-row {
        display: flex;
        align-items: center;
        gap: 6px;
        label {
          font-size: 0.75rem;
          font-weight: 600;
          color: var(--text-muted);
          width: 70px;
          flex-shrink: 0;
        }
        input {
          flex: 1;
          padding: 6px 8px;
          border: 1px solid var(--border-light);
          border-radius: 8px;
          background: var(--input-bg);
          color: var(--text-main);
          font-size: 0.85rem;
          outline: none;
          font-family: inherit;
          &:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 2px var(--primary-light);
          }
        }
      }

      .snap-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 0.9rem;
        padding: 2px 4px;
        border-radius: 4px;
        color: var(--text-muted);
        &:hover {
          background: var(--border-light);
          color: var(--primary);
        }
      }

      .fin-result {
        padding: 8px 10px;
        background: var(--primary-light);
        border-radius: 8px;
        font-size: 0.85rem;
        color: var(--text-main);
        text-align: center;
        margin-top: 4px;
        strong {
          color: var(--primary);
        }
      }

      .snap-quickpick {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 4px;
        padding-top: 8px;
        border-top: 1px solid var(--border-light);
        margin-top: 8px;
      }

      .snap-label {
        font-size: 0.7rem;
        font-weight: 600;
        color: var(--text-muted);
        margin-right: 2px;
      }

      .chip {
        padding: 3px 8px;
        border: 1px solid var(--border-light);
        border-radius: 12px;
        background: var(--input-bg);
        color: var(--text-muted);
        font-size: 0.7rem;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.15s;
        &:hover {
          background: var(--primary-light);
          color: var(--primary);
          border-color: var(--primary);
        }
      }

      .calc-history {
        margin-top: 8px;
        padding-top: 6px;
        border-top: 1px solid var(--border-light);
      }

      .history-item {
        font-size: 0.7rem;
        color: var(--text-muted);
        font-family: monospace;
        padding: 2px 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
    `,
  ],
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
