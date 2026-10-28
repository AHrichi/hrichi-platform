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
  template: `
    <div class="flow-card" [class.is-animating]="activeStage() !== 'idle'">
      <div class="flow-header">
        <div class="title-group">
          <span
            class="pulse-indicator"
            [class.active]="activeStage() !== 'idle'"
          ></span>
          <h4 class="flow-title">NgRx Reactive Unidirectional Cycle</h4>
        </div>
        <ah-tag [class.is-active]="activeStage() !== 'idle'">
          {{ stageLabel() }}
        </ah-tag>
      </div>

      <div class="pipeline-track">
        <!-- Stage 1: Component / View -->
        <div class="stage-node" [class.current]="activeStage() === 'component'">
          <div class="node-icon">UI</div>
          <div class="node-meta">
            <span class="node-name">Component</span>
            <span class="node-desc">User Event</span>
          </div>
        </div>

        <div class="stage-arrow" [class.pulse]="activeStage() === 'dispatch'">
          <span class="arrow-line"></span>
          <span class="arrow-tag">dispatch()</span>
        </div>

        <!-- Stage 2: Action -->
        <div class="stage-node" [class.current]="activeStage() === 'dispatch'">
          <div class="node-icon">⚡</div>
          <div class="node-meta">
            <span class="node-name">Action</span>
            <span class="node-desc">Unique Event</span>
          </div>
        </div>

        <div
          class="stage-arrow"
          [class.pulse]="
            activeStage() === 'effect' || activeStage() === 'reducer'
          "
        >
          <span class="arrow-line"></span>
          <span class="arrow-tag">stream</span>
        </div>

        <!-- Stage 3: Effect (Optional / Parallel) or Reducer -->
        <div class="stage-branch">
          @if (showEffect()) {
            <div
              class="stage-node effect-node"
              [class.current]="activeStage() === 'effect'"
            >
              <div class="node-icon">🔄</div>
              <div class="node-meta">
                <span class="node-name">Effect</span>
                <span class="node-desc">Side-Effect / API</span>
              </div>
            </div>
          }
          <div class="stage-node" [class.current]="activeStage() === 'reducer'">
            <div class="node-icon">⚙️</div>
            <div class="node-meta">
              <span class="node-name">Reducer</span>
              <span class="node-desc">Pure Transition</span>
            </div>
          </div>
        </div>

        <div class="stage-arrow" [class.pulse]="activeStage() === 'store'">
          <span class="arrow-line"></span>
          <span class="arrow-tag">new state</span>
        </div>

        <!-- Stage 4: Store -->
        <div class="stage-node" [class.current]="activeStage() === 'store'">
          <div class="node-icon">📦</div>
          <div class="node-meta">
            <span class="node-name">Store</span>
            <span class="node-desc">Single Source</span>
          </div>
        </div>

        <div class="stage-arrow" [class.pulse]="activeStage() === 'selector'">
          <span class="arrow-line"></span>
          <span class="arrow-tag">slice</span>
        </div>

        <!-- Stage 5: Selector -->
        <div class="stage-node" [class.current]="activeStage() === 'selector'">
          <div class="node-icon">🎯</div>
          <div class="node-meta">
            <span class="node-name">Selector</span>
            <span class="node-desc">Memoized Cache</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: `
    .flow-card {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-4, 1rem) var(--space-5, 1.25rem);
      margin-bottom: var(--space-6, 1.5rem);
      transition:
        border-color 0.3s ease,
        box-shadow 0.3s ease;
    }

    .flow-card.is-animating {
      border-color: var(--color-accent-default);
      box-shadow: 0 0 20px rgba(179, 18, 46, 0.15);
    }

    .flow-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-4, 1rem);
    }

    .title-group {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
    }

    .pulse-indicator {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: var(--color-border-strong);
      transition:
        background 0.3s ease,
        box-shadow 0.3s ease;
    }

    .pulse-indicator.active {
      background: var(--color-success-default, #15803d);
      box-shadow: 0 0 8px var(--color-success-default, #15803d);
      animation: heart-pulse 1.2s infinite;
    }

    @keyframes heart-pulse {
      0%,
      100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.3);
        opacity: 0.8;
      }
    }

    .flow-title {
      margin: 0;
      font-size: var(--font-size-200, 0.9375rem);
      font-weight: 600;
      color: var(--color-text-default);
    }

    .pipeline-track {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      overflow-x: auto;
      padding-bottom: var(--space-2, 0.5rem);
    }

    .stage-node {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      padding: var(--space-2, 0.5rem) var(--space-3, 0.75rem);
      border-radius: var(--radius-md, 0.5rem);
      min-width: 110px;
      transition: all 0.25s ease;
    }

    .stage-node.current {
      background: var(--color-accent-subtle);
      border-color: var(--color-accent-default);
      box-shadow: 0 0 14px rgba(179, 18, 46, 0.2);
      transform: translateY(-2px);
    }

    .node-icon {
      font-size: 1.1rem;
      font-weight: 700;
      width: 26px;
      height: 26px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--color-bg-surface);
      border-radius: var(--radius-sm, 0.375rem);
    }

    .node-meta {
      display: flex;
      flex-direction: column;
    }

    .node-name {
      font-size: var(--font-size-100, 0.8125rem);
      font-weight: 600;
      color: var(--color-text-default);
    }

    .node-desc {
      font-size: 0.65rem;
      color: var(--color-text-muted);
      white-space: nowrap;
    }

    .stage-arrow {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      min-width: 50px;
      position: relative;
    }

    .arrow-line {
      height: 2px;
      width: 100%;
      background: var(--color-border-strong);
      position: relative;
    }

    .arrow-line::after {
      content: '';
      position: absolute;
      right: 0;
      top: -3px;
      width: 0;
      height: 0;
      border-top: 4px solid transparent;
      border-bottom: 4px solid transparent;
      border-left: 6px solid var(--color-border-strong);
    }

    .arrow-tag {
      font-size: 0.6rem;
      font-family: monospace;
      color: var(--color-text-muted);
    }

    .stage-arrow.pulse .arrow-line {
      background: var(--color-accent-default);
      box-shadow: 0 0 6px var(--color-accent-default);
    }

    .stage-arrow.pulse .arrow-line::after {
      border-left-color: var(--color-accent-default);
    }

    .stage-arrow.pulse .arrow-tag {
      color: var(--color-accent-default);
      font-weight: 700;
    }

    .stage-branch {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .effect-node {
      border-style: dashed;
    }
  `,
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
