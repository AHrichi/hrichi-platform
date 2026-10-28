import { Component, computed, input } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { UiProgressBarComponent } from '../ui-progress-bar/ui-progress-bar.component';

@Component({
  selector: 'app-ui-stat-cell',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, UiProgressBarComponent],
  templateUrl: './ui-stat-cell.component.html',
  styleUrl: './ui-stat-cell.component.scss',
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
