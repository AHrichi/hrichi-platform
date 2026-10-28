import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { form, FormField, FormRoot } from '@angular/forms/signals';
import { Scenario } from '../../store/models';

@Component({
  selector: 'app-scenario-selector',
  standalone: true,
  imports: [CommonModule, FormField, FormRoot],
  templateUrl: './scenario-selector.component.html',
  styleUrl: './scenario-selector.component.scss',
})
export class ScenarioSelectorComponent {
  scenarios = input.required<Scenario[]>();
  mode = input<'single' | 'multiple'>('single');

  // Single mode state
  activeId = input<string | null>(null);
  showLabel = input<boolean>(true);

  // Multiple mode state
  hiddenIds = input<Set<string>>(new Set());

  // Outputs
  toggle = output<string>();
  add = output<string>();
  duplicate = output<string>();
  rename = output<{ id: string; name: string }>();
  delete = output<string>();

  readonly addModel = signal({ name: '' });
  readonly addForm = form(this.addModel, {
    submission: {
      action: async () => {
        this.handleAdd();
      },
    },
  });

  renamingId = signal<string | null>(null);
  renameValue = signal('');

  isActive(id: string): boolean {
    if (this.mode() === 'single') {
      return this.activeId() === id;
    }
    return !this.hiddenIds().has(id);
  }

  handleToggle(id: string) {
    this.toggle.emit(id);
  }

  handleDuplicate(id: string) {
    this.duplicate.emit(id);
  }

  handleAdd() {
    const val = this.addModel().name.trim();
    if (val) {
      this.add.emit(val);
      this.addModel.set({ name: '' });
    }
  }

  startRename(scenario: Scenario) {
    this.renameValue.set(scenario.name);
    this.renamingId.set(scenario.id);
  }

  confirmRename(id: string) {
    const name = this.renameValue().trim();
    if (name && name !== this.scenarios().find((s) => s.id === id)?.name) {
      this.rename.emit({ id, name });
    }
    this.renamingId.set(null);
  }

  handleDelete(id: string) {
    if (confirm('Delete this scenario? This cannot be undone.')) {
      this.delete.emit(id);
    }
  }
}
