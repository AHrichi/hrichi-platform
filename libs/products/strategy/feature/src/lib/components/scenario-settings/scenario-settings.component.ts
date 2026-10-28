import { Component, input, output, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  form,
  FormField,
  FormRoot,
  min,
  required,
} from '@angular/forms/signals';

@Component({
  selector: 'app-scenario-settings',
  standalone: true,
  imports: [CommonModule, FormField, FormRoot],
  templateUrl: './scenario-settings.component.html',
  styleUrl: './scenario-settings.component.scss',
})
export class ScenarioSettingsComponent {
  // Signal Inputs receiving data from the parent Smart Component
  years = input.required<number>();
  inflation = input.required<number>();
  investmentYield = input.required<number>();
  startDate = input.required<string>();

  // Signal Output to emit changes back to the store
  settingsChange = output<{
    projectionYears: number;
    inflationRate: number;
    investmentYield: number;
    startDate: string;
  }>();

  readonly settingsModel = signal({
    projectionYears: 0,
    inflationRate: 0,
    investmentYield: 0,
    startDate: '',
  });

  readonly settingsForm = form(
    this.settingsModel,
    (schema) => {
      required(schema.startDate, { message: 'Start date is required' });
      required(schema.projectionYears, { message: 'Must be at least 1 year' });
      min(schema.projectionYears, 1, { message: 'Must be at least 1 year' });
      required(schema.inflationRate, { message: 'Required' });
      required(schema.investmentYield, { message: 'Required' });
    },
    {
      submission: {
        action: async () => this.onSubmit(),
      },
    },
  );

  constructor() {
    // Automatically sync the model when parent inputs change
    effect(() => {
      this.settingsModel.set({
        projectionYears: this.years(),
        inflationRate: this.inflation(),
        investmentYield: this.investmentYield(),
        startDate: this.startDate(),
      });
    });
  }

  async onSubmit(): Promise<undefined> {
    this.settingsChange.emit(this.settingsModel());
    return undefined;
  }
}
