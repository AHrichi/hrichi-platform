// src/app/exercises/sharing-data/view-child-example/view-child-example.component.ts
import { Component, signal } from '@angular/core';
import { injectRxjsLabCopy } from '../../../i18n/rxjs-lab-copy';

@Component({
  selector: 'app-view-child-example',
  standalone: true,
  templateUrl: './view-child-example.component.html',
  styleUrls: ['./view-child-example.component.scss'],
})
export class ViewChildExampleComponent {
  readonly copy = injectRxjsLabCopy();
  isHighlighted = signal(false);

  highlight() {
    this.isHighlighted.set(true);
    setTimeout(() => this.isHighlighted.set(false), 1000);
  }
}
