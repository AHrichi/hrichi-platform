import { Component, inject, computed } from '@angular/core';
import { FinancialStore } from '../../../financial.store';
import { GoalListComponent } from '../../../components/goal-list/goal-list.component';

@Component({
  selector: 'app-goals-view',
  standalone: true,
  imports: [GoalListComponent],
  template: `
    <app-goal-list
      [goals]="store.activeScenario().goals"
      [startDate]="store.activeScenario().startDate"
      [milestones]="store.currentGoalProgress()"
      [realityMilestones]="store.realityGoalProgress()"
      [otherScenarios]="otherScenarios()"
      (applyToScenarios)="store.applyGoalToScenarios($event)"
      (add)="store.addGoal($event)"
      (remove)="store.removeGoal($event)"
      (toggle)="store.toggleGoal(store.activeScenarioId(), $event)"
      (edit)="store.editGoal($event.id, $event.updated)"
      (reorder)="
        store.reorderGoals(
          store.activeScenarioId(),
          $event.previousIndex,
          $event.currentIndex
        )
      "
    ></app-goal-list>
  `,
})
export class GoalsViewComponent {
  store = inject(FinancialStore);

  otherScenarios = computed(() => {
    return this.store
      .scenarios()
      .filter((s) => s.id !== this.store.activeScenarioId());
  });
}
