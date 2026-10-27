import { Component, input, output, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  ReactiveFormsModule,
  NonNullableFormBuilder,
  Validators,
} from '@angular/forms';
import { DragDropModule, CdkDragDrop } from '@angular/cdk/drag-drop';
import { Goal } from '../../financial.store';
import { GoalMilestone } from '../../store/models';

@Component({
  selector: 'app-goal-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, DragDropModule],
  templateUrl: './goal-list.component.html',
  styleUrls: ['./goal-list.component.scss'],
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

  private fb = inject(NonNullableFormBuilder);

  editingId: string | null = null;
  goalToCopy: Goal | null = null;
  selectedTargetScenarios = new Set<string>();

  goalForm = this.fb.group({
    name: ['', Validators.required],
    amount: [0, [Validators.required, Validators.min(1)]],
    priority: [1, [Validators.required, Validators.min(1)]],
    category: [''],
  });

  onSubmit() {
    if (this.goalForm.valid) {
      const raw = this.goalForm.getRawValue();
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
    }
  }

  onEdit(goal: Goal) {
    this.editingId = goal.id;
    this.goalForm.patchValue({
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
    this.goalForm.reset({ name: '', amount: 0, priority: 1, category: '' });
  }

  onRemove(id: string | undefined) {
    if (id) this.remove.emit(id);
  }

  onToggle(id: string | undefined) {
    if (id) this.toggle.emit(id);
  }

  getMilestone(goalId: string): GoalMilestone | undefined {
    return this.milestoneMap().get(goalId);
  }

  getProgress(goalId: string): number {
    const ms = this.getMilestone(goalId);
    if (!ms || ms.amount <= 0) return 0;
    return Math.min((ms.fundAccumulated / ms.amount) * 100, 100);
  }

  getStatus(goalId: string): string {
    const ms = this.getMilestone(goalId);
    if (!ms) return 'unknown';
    return ms.status;
  }

  getRealityProgress(goalId: string): number {
    const ms = this.realityMilestoneMap().get(goalId);
    if (!ms || ms.amount <= 0) return 0;
    return Math.min((ms.fundAccumulated / ms.amount) * 100, 100);
  }

  getRealityStatus(goalId: string): string {
    const ms = this.realityMilestoneMap().get(goalId);
    if (!ms) return 'unknown';
    return ms.status;
  }

  getRealityFundAccumulated(goalId: string): number {
    return this.realityMilestoneMap().get(goalId)?.fundAccumulated ?? 0;
  }

  getStatusIcon(goalId: string): string {
    const ms = this.getMilestone(goalId);
    if (!ms) return '⚪';
    switch (ms.status) {
      case 'achieved':
        return '🏆';
      case 'in_progress':
        return '⏳';
      case 'pending':
        return '⏸️';
      default:
        return '⚪';
    }
  }

  getStatusLabel(goalId: string): string {
    const ms = this.getMilestone(goalId);
    if (!ms) return '';
    switch (ms.status) {
      case 'achieved':
        return 'Achieved';
      case 'in_progress':
        return 'In Progress';
      case 'pending':
        return 'Pending';
      default:
        return '';
    }
  }

  drop(event: CdkDragDrop<Goal[]>) {
    if (event.previousIndex !== event.currentIndex) {
      this.reorder.emit({
        previousIndex: event.previousIndex,
        currentIndex: event.currentIndex,
      });
    }
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
}
