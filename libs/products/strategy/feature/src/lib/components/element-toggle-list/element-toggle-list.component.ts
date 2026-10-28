import { Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TogglableItem } from '../../store/models';

@Component({
  selector: 'app-element-toggle-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './element-toggle-list.component.html',
  styleUrl: './element-toggle-list.component.scss',
})
export class ElementToggleListComponent {
  items = input.required<TogglableItem[]>();
  emptyMessage = input<string>('No items');

  toggle = output<string>();

  handleToggle(id: string) {
    this.toggle.emit(id);
  }
}
