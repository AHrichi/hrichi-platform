import { Component, inject, computed } from '@angular/core';
import { FinancialStore } from '../../../financial.store';
import { GoalListComponent } from '../../../components/goal-list/goal-list.component';

@Component({
  selector: 'app-goals-view',
  standalone: true,
  imports: [GoalListComponent],
  templateUrl: './goals-view.component.html',
  styleUrl: './goals-view.component.scss',
})
export class GoalsViewComponent {
  store = inject(FinancialStore);

  otherScenarios = computed(() => {
    return this.store
      .scenarios()
      .filter((s) => s.id !== this.store.activeScenarioId());
  });
}
