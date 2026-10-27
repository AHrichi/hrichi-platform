import { Component, inject, computed } from '@angular/core';
import { FinancialStore } from '../../../financial.store';
import { ExpenseListComponent } from '../../../components/expense-list/expense-list.component';

@Component({
  selector: 'app-expenses-view',
  standalone: true,
  imports: [ExpenseListComponent],
  template: `
    <app-expense-list
      [expenses]="store.activeScenario().expenses"
      [otherScenarios]="otherScenarios()"
      (applyToScenarios)="store.applyExpenseToScenarios($event)"
      (add)="store.addExpense($event)"
      (remove)="store.removeExpense($event)"
      (toggle)="store.toggleExpense(store.activeScenarioId(), $event)"
      (edit)="store.editExpense($event.id, $event.updated)"
    ></app-expense-list>
  `,
})
export class ExpensesViewComponent {
  store = inject(FinancialStore);

  otherScenarios = computed(() => {
    return this.store
      .scenarios()
      .filter((s) => s.id !== this.store.activeScenarioId());
  });
}
