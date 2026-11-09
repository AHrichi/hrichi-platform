import { Component, input } from '@angular/core';
import { injectRxjsLabCopy } from '../../../i18n/rxjs-lab-copy';

@Component({
  selector: 'app-parent-to-child',
  standalone: true,
  templateUrl: './parent-to-child.component.html',
  styleUrls: ['./parent-to-child.component.scss'],
})
export class ParentToChildComponent {
  readonly copy = injectRxjsLabCopy();
  data = input.required<string>();
}
