import {
  ChangeDetectionStrategy,
  Component,
  inject,
} from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import {
  AhAlert,
  AhBadge,
  AhButton,
  AhCodeBlock,
  AhFlowChart,
  AhModal,
} from '@ah/ui';
import { StudyLmStore } from '../../store/studylm.store';

@Component({
  selector: 'ah-elaboration-modal',
  imports: [
    CommonModule,
    UpperCasePipe,
    AhModal,
    AhBadge,
    AhCodeBlock,
    AhFlowChart,
    AhAlert,
    AhButton,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './elaboration-modal.component.html',
  styleUrl: './elaboration-modal.component.scss',
})
export class ElaborationModalComponent {
  readonly store = inject(StudyLmStore);

  close(): void {
    this.store.closeElaborationModal();
  }
}
