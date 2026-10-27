import { Component, computed, input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { UiProgressBarComponent } from '../ui-progress-bar/ui-progress-bar.component';

@Component({
  selector: 'app-ui-stat-cell',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, UiProgressBarComponent],
  template: `
    <div class="stat-cell-container">
      <div class="stat-row">
        <span class="label">{{ labelActual() }}:</span>
        <span class="value" [ngClass]="actualValueClass()">
          {{ actualValue() | currency: 'TND' : 'symbol' : '1.0-0' }}
        </span>
      </div>
      <div class="stat-row">
        <span class="label">{{ labelPlanned() }}:</span>
        <span class="value text-muted">
          {{ plannedValue() | currency: 'TND' : 'symbol' : '1.0-0' }}
        </span>
      </div>

      <app-ui-progress-bar
        [progress]="progress()"
        [colorClass]="isExpense() ? 'expense' : 'income'"
        [isOverBudget]="isExpense() && varianceAmount() < 0"
      ></app-ui-progress-bar>

      <div class="alert-text mt-1 text-right" *ngIf="showVariance()">
        <span [ngClass]="varianceClass()">
          {{ varianceIcon() }} {{ varianceText() }}
          {{
            Math.abs(varianceAmount()) | currency: 'TND' : 'symbol' : '1.0-0'
          }}
        </span>
      </div>
    </div>
  `,
  styles: [
    `
      .stat-cell-container {
        display: flex;
        flex-direction: column;
        gap: 6px;
        padding: 12px;
        background: var(--surface);
        border-radius: 12px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
        border: 1px solid var(--border-light);
      }
      .stat-row {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        font-size: 0.95rem;

        .label {
          font-weight: 500;
          color: var(--text-muted);
        }
        .value {
          font-weight: 700;
          color: var(--text-main);
        }
      }
      .text-success {
        color: var(--success) !important;
        font-weight: 800 !important;
      }
      .text-danger {
        color: var(--danger) !important;
        font-weight: 800 !important;
      }
      .text-muted {
        color: var(--text-muted) !important;
        font-weight: 500 !important;
      }
      .alert-text {
        font-size: 0.8rem;
        font-weight: 700;
        margin-top: 4px;
      }
    `,
  ],
})
export class UiStatCellComponent {
  actualValue = input.required<number>();
  plannedValue = input.required<number>();
  labelActual = input.required<string>();
  labelPlanned = input.required<string>();
  progress = input.required<number>();
  varianceAmount = input.required<number>();
  isExpense = input<boolean>(false);
  showVariance = input<boolean>(true);

  public Math = Math;

  actualValueClass = computed(() => {
    if (this.isExpense()) {
      return this.varianceAmount() < 0 ? 'text-danger' : '';
    } else {
      return 'text-success';
    }
  });

  varianceClass = computed(() => {
    if (this.isExpense()) {
      return this.varianceAmount() < 0 ? 'text-danger' : 'text-success';
    } else {
      return this.varianceAmount() < 0 ? 'text-danger' : 'text-success';
    }
  });

  varianceIcon = computed(() => {
    if (this.isExpense()) {
      return this.varianceAmount() < 0 ? '⚠️' : '✓';
    } else {
      return this.varianceAmount() < 0 ? '📉' : '📈';
    }
  });

  varianceText = computed(() => {
    if (this.isExpense()) {
      return this.varianceAmount() < 0 ? 'Over by' : 'Under by';
    } else {
      return this.varianceAmount() < 0 ? 'Missed by' : 'Exceeded by';
    }
  });
}
