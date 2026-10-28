import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  form,
  FormField,
  FormRoot,
  min,
  required,
} from '@angular/forms/signals';
import { IncomeSource } from '../../financial.store';

@Component({
  selector: 'app-income-list',
  standalone: true,
  imports: [CommonModule, FormField, FormRoot],
  templateUrl: './income-list.component.html',
  styleUrl: './income-list.component.scss',
})
export class IncomeListComponent {
  incomes = input.required<IncomeSource[]>();

  otherScenarios = input<{ id: string; name: string }[]>([]);

  add = output<Omit<IncomeSource, 'id' | 'isEnabled'>>();
  remove = output<string>();
  edit = output<{ id: string; updated: Omit<IncomeSource, 'id'> }>();

  applyToScenarios = output<{
    income: Omit<IncomeSource, 'id' | 'isEnabled'>;
    targetScenarioIds: string[];
  }>();

  editingId: string | null = null;
  incomeToCopy: IncomeSource | null = null;
  selectedTargetScenarios = new Set<string>();

  readonly incomeModel = signal({
    name: '',
    amount: 0,
    startMonth: 1,
    endMonth: null as number | null,
    growthType: 'none' as 'none' | 'fixed' | 'percentage',
    growthValue: 0,
  });

  readonly incomeForm = form(
    this.incomeModel,
    (schema) => {
      required(schema.name, { message: 'Income name is required' });
      required(schema.amount, { message: 'Amount is required' });
      min(schema.amount, 1, { message: 'Amount must be at least 1' });
      required(schema.startMonth, { message: 'Start month is required' });
      min(schema.startMonth, 1, { message: 'Start month must be at least 1' });
      required(schema.growthType);
      required(schema.growthValue);
    },
    {
      submission: {
        action: async () => this.onSubmit(),
      },
    },
  );

  async onSubmit(): Promise<undefined> {
    const raw = this.incomeModel();
    if (this.editingId) {
      this.edit.emit({
        id: this.editingId,
        updated: raw,
      });
      this.editingId = null;
    } else {
      this.add.emit(raw);
    }
    this.resetForm();
    return undefined;
  }

  onEdit(income: IncomeSource) {
    this.editingId = income.id;
    this.incomeModel.set({
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
    this.incomeModel.set({
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
      const { id, isEnabled, ...incomeData } = this.incomeToCopy;
      this.applyToScenarios.emit({
        income: incomeData,
        targetScenarioIds: Array.from(this.selectedTargetScenarios),
      });
      this.closeCopyModal();
    }
  }
}
