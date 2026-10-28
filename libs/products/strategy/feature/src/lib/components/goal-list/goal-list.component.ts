import { Component, input, output, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  form,
  FormField,
  FormRoot,
  min,
  required,
} from '@angular/forms/signals';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Goal } from '../../financial.store';
import { GoalMilestone } from '../../store/models';

@Component({
  selector: 'app-goal-list',
  standalone: true,
  imports: [CommonModule, FormField, FormRoot, DragDropModule],
  templateUrl: './goal-list.component.html',
  styleUrl: './goal-list.component.scss',
})
export class GoalListComponent {
  goals = input.required<Goal[]>();
  startDate = input<string>('');
  milestones = input<GoalMilestone[]>([]);
  realityMilestones = input<GoalMilestone[]>([]);

  otherScenarios = input<{ id: string; name: string }[]>([]);

  milestoneMap = computed(() => {
    const map = new Map<string, GoalMilestone>();
    for (const m of this.milestones()) {
      map.set(m.id, m);
    }
    return map;
  });

  realityMilestoneMap = computed(() => {
    const map = new Map<string, GoalMilestone>();
    for (const m of this.realityMilestones()) {
      map.set(m.id, m);
    }
    return map;
  });

  add = output<Omit<Goal, 'id' | 'isEnabled'>>();
  remove = output<string>();
  toggle = output<string>();
  edit = output<{ id: string; updated: Omit<Goal, 'id'> }>();
  reorder = output<{ previousIndex: number; currentIndex: number }>();

  applyToScenarios = output<{
    goal: Omit<Goal, 'id' | 'isEnabled'>;
    targetScenarioIds: string[];
  }>();

  editingId: string | null = null;
  goalToCopy: Goal | null = null;
  selectedTargetScenarios = new Set<string>();

  readonly goalModel = signal({
    name: '',
    amount: 0,
    priority: 1,
    category: '',
  });

  readonly goalForm = form(
    this.goalModel,
    (schema) => {
      required(schema.name, { message: 'Goal name is required' });
      required(schema.amount, { message: 'Target amount is required' });
      min(schema.amount, 1, { message: 'Target amount must be at least 1' });
      required(schema.priority, { message: 'Priority is required' });
      min(schema.priority, 1, { message: 'Priority must be at least 1' });
    },
    {
      submission: {
        action: async () => this.onSubmit(),
      },
    },
  );

  async onSubmit(): Promise<undefined> {
    const raw = this.goalModel();
    const goalData = {
      name: raw.name,
      amount: raw.amount,
      priority: raw.priority ?? 1,
      category: raw.category ?? '',
    };
    if (this.editingId) {
      this.edit.emit({
        id: this.editingId,
        updated: goalData,
      });
      this.editingId = null;
    } else {
      this.add.emit(goalData);
    }
    this.resetForm();
    return undefined;
  }

  onEdit(goal: Goal) {
    this.editingId = goal.id;
    this.goalModel.set({
      name: goal.name,
      amount: goal.amount,
      priority: goal.priority ?? 1,
      category: goal.category ?? '',
    });
  }

  cancelEdit() {
    this.editingId = null;
    this.resetForm();
  }

  private resetForm() {
    this.goalModel.set({
      name: '',
      amount: 0,
      priority: 1,
      category: '',
    });
  }

  onRemove(id: string | undefined) {
    if (id) this.remove.emit(id);
  }

  onToggle(id: string | undefined) {
    if (id) this.toggle.emit(id);
  }

  drop(event: CdkDragDrop<Goal[]>) {
    this.reorder.emit({
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex,
    });
  }

  openCopyModal(goal: Goal) {
    this.goalToCopy = goal;
    this.selectedTargetScenarios.clear();
  }

  closeCopyModal() {
    this.goalToCopy = null;
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
    if (this.goalToCopy && this.selectedTargetScenarios.size > 0) {
      const { id, isEnabled, ...goalData } = this.goalToCopy;
      this.applyToScenarios.emit({
        goal: goalData,
        targetScenarioIds: Array.from(this.selectedTargetScenarios),
      });
      this.closeCopyModal();
    }
  }

  formatTargetMonth(targetMonth: number | undefined): string {
    if (!targetMonth || targetMonth <= 0) return 'N/A';

    const start = this.startDate();
    if (!start) {
      return `Month ${targetMonth}`;
    }

    const [yearStr, monthStr] = start.split('-');
    const startYear = parseInt(yearStr, 10);
    const startMonth = parseInt(monthStr, 10) - 1;

    const targetDate = new Date(startYear, startMonth + targetMonth - 1, 1);
    const monthNames = [
      'Jan',
      'Feb',
      'Mar',
      'Apr',
      'May',
      'Jun',
      'Jul',
      'Aug',
      'Sep',
      'Oct',
      'Nov',
      'Dec',
    ];

    return `${monthNames[targetDate.getMonth()]} ${targetDate.getFullYear()} (M${targetMonth})`;
  }
}
