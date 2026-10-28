import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DispatchStore } from '../../store/dispatch.store';

@Component({
  selector: 'ah-pod-modal',
  imports: [CommonModule],
  templateUrl: './pod-modal.component.html',
  styleUrl: './pod-modal.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PodModalComponent {
  readonly store = inject(DispatchStore);

  get targetOrder() {
    const id = this.store.selectedOrderIdForPod();
    return () => this.store.orders().find((o) => o.id === id);
  }
}
