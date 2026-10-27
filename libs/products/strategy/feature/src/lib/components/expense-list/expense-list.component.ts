import { Component, input, output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { Expense } from '../../financial.store';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.scss'],
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

  private fb = inject(NonNullableFormBuilder);

  editingId: string | null = null;
  expenseToCopy: Expense | null = null;
  selectedTargetScenarios = new Set<string>();

  expenseForm = this.fb.group({
    name: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    startMonth: [1, [Validators.required, Validators.min(1)]],
    monthsActive: [null as number | null],
    recurrenceInterval: [1, [Validators.required, Validators.min(1)]],
  });

  onSubmit() {
    if (this.expenseForm.valid) {
      if (this.editingId) {
        this.edit.emit({
          id: this.editingId,
          updated: this.expenseForm.getRawValue(),
        });
        this.editingId = null;
      } else {
        this.add.emit(this.expenseForm.getRawValue());
      }
      this.resetForm();
    }
  }

  onEdit(expense: Expense) {
    this.editingId = expense.id;
    this.expenseForm.patchValue({
      name: expense.name,
      amount: expense.amount,
      startMonth: expense.startMonth || 1,
      monthsActive: expense.monthsActive,
      recurrenceInterval: expense.recurrenceInterval || 1,
    });
  }

  cancelEdit() {
    this.editingId = null;
    this.resetForm();
  }

  private resetForm() {
    this.expenseForm.reset({
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
