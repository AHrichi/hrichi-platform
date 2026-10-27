import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-ui-progress-bar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="progress-track mt-2">
      <div
        class="progress-fill"
        [ngClass]="colorClass()"
        [class.over-budget]="isOverBudget()"
        [style.width.%]="progress()"
      ></div>
    </div>
  `,
  styles: [
    `
      .progress-track {
        background: var(--border-light);
        border-radius: 8px;
        height: 8px;
        overflow: hidden;
        margin-top: 8px;
      }
      .progress-fill {
        height: 100%;
        border-radius: 8px;
        transition: width 0.3s ease;
        background: var(--primary); /* default fallback */

        &.income {
          background: var(--success);
        }
        &.expense {
          background: var(--primary);
        }
        &.over-budget {
          background: var(--danger);
        }
      }
    `,
  ],
})
export class UiProgressBarComponent {
  progress = input.required<number>();
  colorClass = input<'income' | 'expense' | ''>('');
  isOverBudget = input<boolean>(false);
}
