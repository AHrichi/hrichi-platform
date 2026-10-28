import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { AhTag } from '@ah/ui';

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
  readonly activeStage = input<FlowStage>('idle');
  readonly showEffect = input<boolean>(true);

  stageLabel(): string {
    switch (this.activeStage()) {
      case 'dispatch':
        return 'Dispatching Action';
      case 'effect':
        return 'Intercepted by Effect (Async)';
      case 'reducer':
        return 'Pure State Transition';
      case 'store':
        return 'Store Tree Updated';
      case 'selector':
        return 'Emitting Memoized Slices';
      case 'component':
        return 'Component Re-rendered';
      default:
        return 'Idle (Awaiting Action)';
    }
  }
}
