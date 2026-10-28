import { Component, inject, computed } from '@angular/core';
import { FinancialStore } from '../../../financial.store';
import { IncomeListComponent } from '../../../components/income-list/income-list.component';

@Component({
  selector: 'app-incomes-view',
  standalone: true,
  imports: [IncomeListComponent],
  templateUrl: './incomes-view.component.html',
  styleUrl: './incomes-view.component.scss',
})
export class IncomesViewComponent {
  store = inject(FinancialStore);

  otherScenarios = computed(() => {
    return this.store
      .scenarios()
      .filter((s) => s.id !== this.store.activeScenarioId());
  });
}
