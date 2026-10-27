import { Component, input } from '@angular/core';

@Component({
  selector: 'app-parent-to-child',
  standalone: true,
  templateUrl: './parent-to-child.component.html',
  styleUrls: ['./parent-to-child.component.scss'],
})
export class ParentToChildComponent {
  data = input.required<string>();
}
