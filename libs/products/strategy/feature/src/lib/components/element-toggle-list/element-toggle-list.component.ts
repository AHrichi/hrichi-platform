import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TogglableItem } from '../../store/models';

@Component({
  selector: 'app-element-toggle-list',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="element-toggle-list">
      @for (item of items(); track item.id) {
        <div
          class="copy-item-card"
          style="padding: 0.5rem 1rem !important; margin-bottom: 0.3rem"
        >
          <span
            class="scenario-name"
            [class.disabled]="item.isEnabled === false"
          >
            {{ item.name }}
          </span>
          <label class="toggle-switch">
            <input
              type="checkbox"
              [checked]="item.isEnabled !== false"
              (change)="handleToggle(item.id)"
            />
            <span class="slider"></span>
          </label>
        </div>
      }

      @if (items().length === 0) {
        <span class="text-muted empty-msg">{{ emptyMessage() }}</span>
      }
    </div>
  `,
  styles: [
    `
      .element-toggle-list {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }
      .text-muted {
        color: var(--text-muted);
      }
      .empty-msg {
        font-size: 0.9em;
        font-style: italic;
      }
    `,
  ],
})
export class ElementToggleListComponent {
  items = input.required<TogglableItem[]>();
  emptyMessage = input<string>('No items');

  toggle = output<string>();

  handleToggle(id: string) {
    this.toggle.emit(id);
  }
}
