import { Component, input, output, effect, inject } from '@angular/core';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';

@Component({
  selector: 'app-scenario-settings',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './scenario-settings.component.html',
  styleUrls: ['./scenario-settings.component.scss'],
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

  private fb = inject(NonNullableFormBuilder);

  settingsForm = this.fb.group({
    projectionYears: [0, [Validators.required, Validators.min(1)]],
    inflationRate: [0, [Validators.required]],
    investmentYield: [0, [Validators.required]],
    startDate: ['', [Validators.required]],
  });

  constructor() {
    // Automatically sync the reactive form when the parent inputs change
    effect(() => {
      this.settingsForm.patchValue(
        {
          projectionYears: this.years(),
          inflationRate: this.inflation(),
          investmentYield: this.investmentYield(),
          startDate: this.startDate(),
        },
        { emitEvent: false },
      );
    });
  }

  onSubmit() {
    if (this.settingsForm.valid) {
      this.settingsChange.emit(this.settingsForm.getRawValue());
    }
  }
}
