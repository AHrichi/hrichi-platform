import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { IncomeSource } from '../../financial.store';

@Component({
  selector: 'app-income-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './income-list.component.html',
  styleUrls: ['./income-list.component.scss'],
})
export class IncomeListComponent {
  incomes = input.required<IncomeSource[]>();

  // NEW: Pass in the list of other scenarios to populate the modal
  otherScenarios = input<{ id: string; name: string }[]>([]);

  add = output<Omit<IncomeSource, 'id' | 'isEnabled'>>();
  remove = output<string>();
  edit = output<{ id: string; updated: Omit<IncomeSource, 'id'> }>();

  // NEW: Emit the copy command back to the parent
  applyToScenarios = output<{
    income: Omit<IncomeSource, 'id' | 'isEnabled'>;
    targetScenarioIds: string[];
  }>();

  private fb = inject(NonNullableFormBuilder);

  editingId: string | null = null;

  // NEW: Modal State
  incomeToCopy: IncomeSource | null = null;
  selectedTargetScenarios = new Set<string>();

  incomeForm = this.fb.group({
    name: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    startMonth: [1, [Validators.required, Validators.min(1)]],
    endMonth: [null as number | null],
    growthType: [
      'none' as 'none' | 'fixed' | 'percentage',
      Validators.required,
    ],
    growthValue: [0, Validators.required],
  });

  onSubmit() {
    if (this.incomeForm.valid) {
      if (this.editingId) {
        this.edit.emit({
          id: this.editingId,
          updated: this.incomeForm.getRawValue(),
        });
        this.editingId = null;
      } else {
        this.add.emit(this.incomeForm.getRawValue());
      }
      this.resetForm();
    }
  }

  onEdit(income: IncomeSource) {
    this.editingId = income.id;
    this.incomeForm.patchValue({
      name: income.name,
      amount: income.amount,
      startMonth: income.startMonth,
      endMonth: income.endMonth,
      growthType: income.growthType,
      growthValue: income.growthValue,
    });
  }

  cancelEdit() {
    this.editingId = null;
    this.resetForm();
  }

  private resetForm() {
    this.incomeForm.reset({
      name: '',
      amount: 0,
      startMonth: 1,
      endMonth: null,
      growthType: 'none',
      growthValue: 0,
    });
  }

  onRemove(id: string | undefined) {
    if (id) {
      this.remove.emit(id);
    }
  }

  // === NEW: Modal Logic ===
  openCopyModal(income: IncomeSource) {
    this.incomeToCopy = income;
    this.selectedTargetScenarios.clear();
  }

  closeCopyModal() {
    this.incomeToCopy = null;
    this.selectedTargetScenarios.clear();
  }

  toggleTargetScenario(id: string) {
    if (this.selectedTargetScenarios.has(id)) {
      this.selectedTargetScenarios.delete(id);
    } else {
      this.selectedTargetScenarios.add(id);
    }
  }

  selectAllTargets() {
    const allIds = this.otherScenarios().map((s) => s.id);
    this.selectedTargetScenarios = new Set(allIds);
  }

  confirmCopy() {
    if (this.incomeToCopy && this.selectedTargetScenarios.size > 0) {
      // Strip out the original ID so the store generates a fresh one
      const { id, isEnabled, ...incomeData } = this.incomeToCopy;

      this.applyToScenarios.emit({
        income: incomeData,
        targetScenarioIds: Array.from(this.selectedTargetScenarios),
      });
      this.closeCopyModal();
    }
  }
}
