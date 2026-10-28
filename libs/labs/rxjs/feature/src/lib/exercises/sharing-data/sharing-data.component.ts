// src/app/exercises/sharing-data/sharing-data.component.ts
import {
  Component,
  ChangeDetectionStrategy,
  signal,
  inject,
  viewChild,
  WritableSignal,
} from '@angular/core';

import { ParentToChildComponent } from './parent-to-child/parent-to-child.component';
import { ChildToParentComponent } from './child-to-parent/child-to-parent.component';
import { ServiceSenderComponent } from './service-sender/service-sender.component';
import { ServiceReceiverComponent } from './service-receiver/service-receiver.component';
import { NotificationService } from '../../shared/services/notification.service';
import { ViewChildExampleComponent } from './view-child-example/view-child-example.component';
import { AhButton, SectionHeading, SegmentedOption, Tag } from '@ah/ui';
import { UseCaseFocusComponent } from '../../shared/ui/use-case-focus/use-case-focus.component';

@Component({
  selector: 'app-sharing-data',
  standalone: true,
  imports: [
    ParentToChildComponent,
    ChildToParentComponent,
    ServiceSenderComponent,
    ServiceReceiverComponent,
    ViewChildExampleComponent,
    UseCaseFocusComponent,
    AhButton,
    Tag,
    SectionHeading,
  ],
  templateUrl: './sharing-data.component.html',
  styleUrls: ['./sharing-data.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SharingDataComponent {
  // --- Focus View Options ---
  readonly focusOptions: readonly SegmentedOption<string>[] = [
    { value: 'all', label: 'All Communication Patterns' },
    { value: 'input', label: 'Parent to Child (input)' },
    { value: 'output', label: 'Child to Parent (output)' },
    { value: 'service', label: 'Shared Service' },
    { value: 'viewChild', label: 'Component Query (viewChild)' },
  ];
  readonly activeCase = signal<string>('all');

  // --- Child Component Instance via modern Angular viewChild() signal query ---
  readonly childComponent = viewChild(ViewChildExampleComponent);

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
  }

  sendParentData() {
    this.triggerAnimation('animateParentToChild');
    this.notificationService.show(
      `Sending "${this.parentData()}" to child`,
      'info',
    );
  }

  onDataFromChild(data: string) {
    this.dataFromChild.set(data);
    this.triggerAnimation('animateChildToParent');
    this.notificationService.show(`Received "${data}" from child`, 'success');
  }

  triggerChildMethod() {
    this.childComponent()?.highlight();
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

  toggleCode(type: 'Input' | 'Output' | 'Service' | 'ViewChild'): void {
    const map: Record<
      'Input' | 'Output' | 'Service' | 'ViewChild',
      WritableSignal<boolean>
    > = {
      Input: this.showInputCode,
      Output: this.showOutputCode,
      Service: this.showServiceCode,
      ViewChild: this.showViewChildCode,
    };
    map[type].update((value: boolean) => !value);
  }
}
