import { Component, inject, computed } from '@angular/core';
import { FinancialStore } from '../../../financial.store';
import { IncomeListComponent } from '../../../components/income-list/income-list.component';

@Component({
  selector: 'app-incomes-view',
  standalone: true,
  imports: [IncomeListComponent],
  template: `
    <app-income-list
      [incomes]="store.activeScenario().incomes"
      [otherScenarios]="otherScenarios()"
      (add)="store.addIncome($event)"
      (edit)="store.editIncome($event.id, $event.updated)"
      (remove)="store.removeIncome($event)"
      (applyToScenarios)="store.applyIncomeToScenarios($event)"
    ></app-income-list>
  `,
})
export class IncomesViewComponent {
  store = inject(FinancialStore);

  otherScenarios = computed(() => {
    return this.store
      .scenarios()
      .filter((s) => s.id !== this.store.activeScenarioId());
  });
}
