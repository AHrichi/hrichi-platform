import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { ProgressBar, ProgressBarVariant } from '@ah/ui';

@Component({
  selector: 'app-ui-progress-bar',
  standalone: true,
  imports: [ProgressBar],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-progress-bar.component.html',
  styleUrl: './ui-progress-bar.component.scss',
})
export class UiProgressBarComponent {
  progress = input.required<number>();
  colorClass = input<'income' | 'expense' | ''>('');
  isOverBudget = input<boolean>(false);

  protected readonly barVariant = computed<ProgressBarVariant>(() => {
    if (this.isOverBudget()) return 'danger';
    if (this.colorClass() === 'income') return 'success';
    return 'primary';
  });
}
