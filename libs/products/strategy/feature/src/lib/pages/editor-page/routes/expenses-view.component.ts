import { Component, inject, computed } from '@angular/core';
import { FinancialStore } from '../../../financial.store';
import { ExpenseListComponent } from '../../../components/expense-list/expense-list.component';

@Component({
  selector: 'app-expenses-view',
  standalone: true,
  imports: [ExpenseListComponent],
  templateUrl: './expenses-view.component.html',
  styleUrl: './expenses-view.component.scss',
})
export class ExpensesViewComponent {
  store = inject(FinancialStore);

  otherScenarios = computed(() => {
    return this.store
      .scenarios()
      .filter((s) => s.id !== this.store.activeScenarioId());
  });
}
