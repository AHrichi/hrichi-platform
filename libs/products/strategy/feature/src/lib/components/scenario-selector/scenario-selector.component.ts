import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Scenario } from '../../store/models';

@Component({
  selector: 'app-scenario-selector',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="scenario-tabs">
      @if (mode() === 'multiple') {
        <span class="filter-label" *ngIf="showLabel()"
          >👀 Compare Scenarios:</span
        >
      }

      @for (scenario of scenarios(); track scenario.id) {
        <div class="scenario-tab-item">
          @if (mode() === 'single' && renamingId() === scenario.id) {
            <input
              class="rename-input"
              [ngModel]="renameValue()"
              (ngModelChange)="renameValue.set($event)"
              (keyup.enter)="confirmRename(scenario.id)"
              (blur)="confirmRename(scenario.id)"
              (click)="$event.stopPropagation()"
              autofocus
            />
          } @else {
            <button
              [class.active]="isActive(scenario.id)"
              (click)="handleToggle(scenario.id)"
            >
              <span class="indicator" *ngIf="mode() === 'multiple'"></span>
              {{ scenario.name }}
            </button>
          }
          @if (mode() === 'single') {
            <button
              class="btn-icon"
              (click)="startRename(scenario)"
              title="Rename"
            >
              ✏️
            </button>
            <button
              class="btn-icon"
              (click)="handleDuplicate(scenario.id)"
              title="Copy scenario"
            >
              📑
            </button>
            <button
              class="btn-icon danger"
              (click)="handleDelete(scenario.id)"
              [disabled]="scenarios().length <= 1"
              title="Delete"
            >
              🗑️
            </button>
          }
        </div>
      }

      @if (mode() === 'single') {
        <div class="add-scenario-form">
          <input
            type="text"
            placeholder="New Scenario Name"
            [ngModel]="newScenarioName"
            (ngModelChange)="newScenarioName = $event"
            (keyup.enter)="handleAdd()"
          />
          <button class="btn-add" (click)="handleAdd()">➕ Add</button>
        </div>
      }
    </div>
  `,
  styles: [
    `
      .scenario-tabs {
        display: flex;
        align-items: center;
        gap: 12px;
        margin-bottom: 24px;
        overflow-x: auto;
        padding-bottom: 8px;

        &::-webkit-scrollbar {
          display: none;
        }
        -ms-overflow-style: none;
        scrollbar-width: none;
      }

      .scenario-tab-item {
        display: inline-flex;
        align-items: center;
        gap: 4px;
      }

      .filter-label {
        font-weight: 700;
        color: var(--text-muted);
        margin-right: 8px;
      }

      button {
        background: var(--surface);
        border: 1px solid var(--border-light);
        padding: 10px 20px;
        border-radius: 20px;
        font-weight: 600;
        color: var(--text-muted);
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
        cursor: pointer;
        white-space: nowrap;
        transition: all 0.2s ease;
        display: inline-flex;
        align-items: center;
        gap: 6px;

        &:hover:not(.active) {
          border-color: var(--border-dark);
          color: var(--text-main);
        }

        &.active {
          background: var(--primary-light);
          color: var(--primary);
          border-color: var(--primary-light);

          .indicator {
            background-color: var(--primary);
            box-shadow: 0 0 8px var(--primary);
          }
        }
      }

      .btn-icon {
        background: transparent !important;
        border: none !important;
        padding: 4px 6px !important;
        font-size: 0.9rem;
        box-shadow: none !important;
        opacity: 0.4;
        min-width: auto;
        cursor: pointer;
        transition: all 0.2s;

        &:hover:not(:disabled) {
          opacity: 1;
          transform: scale(1.15);
        }

        &:disabled {
          opacity: 0.15;
          cursor: not-allowed;
        }

        &.danger:hover:not(:disabled) {
          opacity: 1;
          color: #ef4444;
        }
      }

      .rename-input {
        padding: 8px 12px;
        border-radius: 20px;
        border: 2px solid var(--primary);
        background: var(--surface);
        color: var(--text-main);
        font-size: 0.95rem;
        font-weight: 600;
        outline: none;
        width: 180px;

        &:focus {
          box-shadow: 0 0 0 3px var(--primary-light);
        }
      }

      .indicator {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background-color: var(--border-dark);
        transition: all 0.3s;
      }

      .add-scenario-form {
        display: flex;
        gap: 8px;

        input {
          padding: 10px 16px;
          border-radius: 20px;
          border: 1px solid var(--border-light);
          background: var(--surface);
          color: var(--text-main);
          outline: none;
          font-weight: 500;

          &:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 3px var(--primary-light);
          }
        }

        .btn-add {
          background: var(--success);
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 20px;

          &:hover {
            background: var(--success-hover);
            transform: translateY(-1px);
          }
        }
      }
    `,
  ],
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

  newScenarioName = '';

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
    if (this.newScenarioName.trim()) {
      this.add.emit(this.newScenarioName.trim());
      this.newScenarioName = '';
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
