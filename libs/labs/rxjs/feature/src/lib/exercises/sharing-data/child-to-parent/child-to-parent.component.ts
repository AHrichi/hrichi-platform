import { Component, output } from '@angular/core';
import { AhButton } from '@ah/ui';
import { injectRxjsLabCopy } from '../../../i18n/rxjs-lab-copy';

@Component({
  selector: 'app-child-to-parent',
  standalone: true,
  imports: [AhButton],
  templateUrl: './child-to-parent.component.html',
  styleUrls: ['./child-to-parent.component.scss'],
})
export class ChildToParentComponent {
  readonly copy = injectRxjsLabCopy();
  dataEvent = output<string>();

  sendData() {
    const data = `Event #${Math.floor(Math.random() * 100)}`;
    this.dataEvent.emit(data);
  }
}
