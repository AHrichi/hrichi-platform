import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  form,
  FormField,
  FormRoot,
  min,
  required,
} from '@angular/forms/signals';
import { Expense } from '../../financial.store';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormField, FormRoot],
  templateUrl: './expense-list.component.html',
  styleUrl: './expense-list.component.scss',
})
export class ExpenseListComponent {
  expenses = input.required<Expense[]>();

  otherScenarios = input<{ id: string; name: string }[]>([]);

  add = output<Omit<Expense, 'id' | 'isEnabled'>>();
  remove = output<string>();
  toggle = output<string>();
  edit = output<{ id: string; updated: Omit<Expense, 'id'> }>();

  applyToScenarios = output<{
    expense: Omit<Expense, 'id' | 'isEnabled'>;
    targetScenarioIds: string[];
  }>();

  editingId: string | null = null;
  expenseToCopy: Expense | null = null;
  selectedTargetScenarios = new Set<string>();

  readonly expenseModel = signal({
    name: '',
    amount: 0,
    startMonth: 1,
    monthsActive: null as number | null,
    recurrenceInterval: 1,
  });

  readonly expenseForm = form(
    this.expenseModel,
    (schema) => {
      required(schema.name, { message: 'Expense name is required' });
      required(schema.amount, { message: 'Amount is required' });
      min(schema.amount, 1, { message: 'Amount must be at least 1' });
      required(schema.startMonth, { message: 'Start month is required' });
      min(schema.startMonth, 1, { message: 'Start month must be at least 1' });
      required(schema.recurrenceInterval, { message: 'Interval is required' });
      min(schema.recurrenceInterval, 1, {
        message: 'Interval must be at least 1',
      });
    },
    {
      submission: {
        action: async () => this.onSubmit(),
      },
    },
  );

  async onSubmit(): Promise<undefined> {
    const raw = this.expenseModel();
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

  onEdit(expense: Expense) {
    this.editingId = expense.id;
    this.expenseModel.set({
      name: expense.name,
      amount: expense.amount,
      startMonth: expense.startMonth || 1,
      monthsActive: expense.monthsActive ?? null,
      recurrenceInterval: expense.recurrenceInterval || 1,
    });
  }

  cancelEdit() {
    this.editingId = null;
    this.resetForm();
  }

  private resetForm() {
    this.expenseModel.set({
      name: '',
      amount: 0,
      startMonth: 1,
      monthsActive: null,
      recurrenceInterval: 1,
    });
  }

  onRemove(id: string | undefined) {
    if (id) this.remove.emit(id);
  }

  onToggle(id: string | undefined) {
    if (id) this.toggle.emit(id);
  }

  openCopyModal(expense: Expense) {
    this.expenseToCopy = expense;
    this.selectedTargetScenarios.clear();
  }

  closeCopyModal() {
    this.expenseToCopy = null;
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
    if (this.expenseToCopy && this.selectedTargetScenarios.size > 0) {
      const { id, isEnabled, ...expenseData } = this.expenseToCopy;
      this.applyToScenarios.emit({
        expense: expenseData,
        targetScenarioIds: Array.from(this.selectedTargetScenarios),
      });
      this.closeCopyModal();
    }
  }
}
