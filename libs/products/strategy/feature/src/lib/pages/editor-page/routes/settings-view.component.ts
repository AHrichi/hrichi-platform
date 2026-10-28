import { Component, inject } from '@angular/core';
import { FinancialStore } from '../../../financial.store';
import { ToastService } from '../../../services/toast.service';
import { ScenarioSettingsComponent } from '../../../components/scenario-settings/scenario-settings.component';

@Component({
  selector: 'app-settings-view',
  standalone: true,
  imports: [ScenarioSettingsComponent],
  templateUrl: './settings-view.component.html',
  styleUrl: './settings-view.component.scss',
})
export class SettingsViewComponent {
  store = inject(FinancialStore);
  toast = inject(ToastService);

  onSettingsChange(settings: {
    projectionYears: number;
    inflationRate: number;
    investmentYield: number;
    startDate: string;
  }) {
    this.store.updateProjectionYears(settings.projectionYears);
    this.store.updateInflationRate(settings.inflationRate);
    this.store.updateInvestmentYield(settings.investmentYield);
    this.store.updateStartDate(settings.startDate);
    this.toast.show('Settings saved successfully', 'success');
  }
}
