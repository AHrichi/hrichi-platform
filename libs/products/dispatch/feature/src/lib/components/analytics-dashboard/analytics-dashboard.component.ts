import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DispatchStore } from '../../store/dispatch.store';
import { Badge, ProgressBar } from '@ah/ui';

@Component({
  selector: 'ah-analytics-dashboard',
  imports: [CommonModule, Badge, ProgressBar],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnalyticsDashboardComponent {
  readonly store = inject(DispatchStore);
}
