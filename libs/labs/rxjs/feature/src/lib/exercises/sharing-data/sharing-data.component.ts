// src/app/exercises/sharing-data/sharing-data.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  ViewChild,
} from '@angular/core';

import { ParentToChildComponent } from './parent-to-child/parent-to-child.component';
import { ChildToParentComponent } from './child-to-parent/child-to-parent.component';
import { ServiceSenderComponent } from './service-sender/service-sender.component';
import { ServiceReceiverComponent } from './service-receiver/service-receiver.component';
import { NotificationService } from '../../shared/services/notification.service';
import { ViewChildExampleComponent } from './view-child-example/view-child-example.component';

@Component({
  selector: 'app-sharing-data',
  standalone: true,
  imports: [
    ParentToChildComponent,
    ChildToParentComponent,
    ServiceSenderComponent,
    ServiceReceiverComponent,
    ViewChildExampleComponent,
  ],
  templateUrl: './sharing-data.component.html',
  styleUrls: ['./sharing-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharingDataComponent {
  // --- Child Component Instance via @ViewChild ---
  @ViewChild(ViewChildExampleComponent)
  childComponent!: ViewChildExampleComponent;

  // --- Parent to Child (@Input) ---
  parentData = signal('Hello from Parent!');

  // --- Child to Parent (@Output) ---
  dataFromChild = signal<string | null>(null);

  // --- Animation Signals ---
  animateParentToChild = signal(false);
  animateChildToParent = signal(false);

  // --- Code Snippet Toggles ---
  showInputCode = signal(false);
  showOutputCode = signal(false);
  showServiceCode = signal(false);
  showViewChildCode = signal(false);

  private notificationService = inject(NotificationService);

  onParentInputChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.parentData.set(value);
    this.triggerAnimation('animateParentToChild');
    this.notificationService.show(`Sending "${value}" to child`, 'info');
  }

  onDataFromChild(data: string) {
    this.dataFromChild.set(data);
    this.triggerAnimation('animateChildToParent');
    this.notificationService.show(`Received "${data}" from child`, 'success');
  }

  triggerChildMethod() {
    this.childComponent.highlight();
    this.notificationService.show(
      'Calling a method on the child component!',
      'info',
    );
  }

  private triggerAnimation(
    signalName: 'animateParentToChild' | 'animateChildToParent',
  ) {
    this[signalName].set(true);
    setTimeout(() => this[signalName].set(false), 1000);
  }

  toggleCode(type: 'Input' | 'Output' | 'Service' | 'ViewChild') {
    const signal = this[`show${type}Code` as keyof this] as any;
    signal.update((value: boolean) => !value);
  }
}
