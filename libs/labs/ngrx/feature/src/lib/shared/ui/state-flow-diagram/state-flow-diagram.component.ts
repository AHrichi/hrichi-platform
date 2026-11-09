import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { AhTag } from '@ah/ui';
import { injectNgrxLabCopy } from '../../../i18n/ngrx-lab-copy';

export type FlowStage =
  | 'idle'
  | 'dispatch'
  | 'effect'
  | 'reducer'
  | 'store'
  | 'selector'
  | 'component';

@Component({
  selector: 'ah-state-flow-diagram',
  imports: [AhTag],
  templateUrl: './state-flow-diagram.component.html',
  styleUrl: './state-flow-diagram.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StateFlowDiagramComponent {
  private readonly labCopy = injectNgrxLabCopy();
  readonly copy = computed(() => this.labCopy().stateFlowDiagram);

  readonly activeStage = input<FlowStage>('idle');
  readonly showEffect = input<boolean>(true);

  stageLabel(): string {
    const stages = this.copy().stages;
    return stages[this.activeStage()] ?? stages.idle;
  }
}
