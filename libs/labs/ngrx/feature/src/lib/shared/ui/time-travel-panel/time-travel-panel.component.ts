import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
} from '@angular/core';
import { AhButton, Tag } from '@ah/ui';

export interface ActionRecord<T = unknown> {
  id: number;
  type: string;
  payload?: unknown;
  timestamp: string;
  stateSnapshot: T;
}

@Component({
  selector: 'ah-time-travel-panel',
  imports: [AhButton, Tag],
  template: `
    <div class="time-travel-container">
      <div class="panel-header">
        <div class="title-meta">
          <span class="icon">⏱️</span>
          <h4 class="title">Time-Travel State History</h4>
          <ah-tag>{{ history().length }} actions recorded</ah-tag>
        </div>

        <div class="scrubber-controls">
          <button
            type="button"
            ahButton="ghost"
            size="sm"
            [disabled]="currentIndex() <= 0"
            (click)="stepPrevious()"
            aria-label="Step backward one action"
          >
            ◀ Back
          </button>
          <span class="index-indicator">
            Snapshot {{ currentIndex() + 1 }} / {{ history().length }}
          </span>
          <button
            type="button"
            ahButton="ghost"
            size="sm"
            [disabled]="currentIndex() >= history().length - 1"
            (click)="stepNext()"
            aria-label="Step forward one action"
          >
            Forward ▶
          </button>
          <button
            type="button"
            ahButton="secondary"
            size="sm"
            [disabled]="currentIndex() === history().length - 1"
            (click)="jumpToLatest()"
          >
            Latest ⏭️
          </button>
        </div>
      </div>

      <div class="history-list" role="list">
        @for (record of history(); track record.id; let idx = $index) {
          <button
            type="button"
            class="history-item"
            [class.active]="idx === currentIndex()"
            (click)="selectSnapshot(idx)"
          >
            <div class="item-left">
              <span class="seq">#{{ record.id }}</span>
              <span class="action-type">{{ record.type }}</span>
            </div>
            <div class="item-right">
              @if (record.payload) {
                <span class="payload-badge">{{
                  stringifyPayload(record.payload)
                }}</span>
              }
              <span class="time">{{ record.timestamp }}</span>
            </div>
          </button>
        }
      </div>

      <div class="active-snapshot-view">
        <div class="snapshot-header">
          <span class="view-title"
            >Snapshot State (#{{ currentSnapshot()?.id ?? 0 }})</span
          >
          @if (isTimeTravelling()) {
            <ah-tag>⚠️ Time Travelling</ah-tag>
          }
        </div>
        <pre class="json-code"><code>{{ formattedSnapshot() }}</code></pre>
      </div>
    </div>
  `,
  styles: `
    .time-travel-container {
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-lg, 0.75rem);
      padding: var(--space-4, 1rem);
      margin-top: var(--space-5, 1.25rem);
    }

    .panel-header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-3, 0.75rem);
      padding-bottom: var(--space-3, 0.75rem);
      border-bottom: 1px solid var(--color-border-default);
    }

    .title-meta {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
    }

    .title {
      margin: 0;
      font-size: var(--font-size-200, 0.9375rem);
      font-weight: 600;
      color: var(--color-text-default);
    }

    .scrubber-controls {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
    }

    .index-indicator {
      font-size: var(--font-size-100, 0.8125rem);
      font-family: monospace;
      color: var(--color-text-muted);
      padding: 0 var(--space-2, 0.5rem);
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
      max-height: 180px;
      overflow-y: auto;
      margin: var(--space-3, 0.75rem) 0;
      padding-right: 4px;
    }

    .history-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: var(--space-2, 0.5rem);
      padding: 8px var(--space-3, 0.75rem);
      background: var(--color-bg-raised);
      border: 1px solid var(--color-border-default);
      border-radius: var(--radius-md, 0.5rem);
      color: var(--color-text-default);
      cursor: pointer;
      user-select: none;
      width: 100%;
      text-align: left;
      font: inherit;
      font-size: var(--font-size-100, 0.8125rem);
      transition:
        background var(--motion-duration-fast) var(--motion-easing-standard),
        border-color var(--motion-duration-fast) var(--motion-easing-standard);
    }

    .history-item:hover {
      background: var(--color-bg-canvas);
      border-color: var(--color-border-strong);
    }

    .history-item.active {
      background: var(--color-accent-subtle);
      border-color: var(--color-accent-default);
    }

    .item-left {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
    }

    .seq {
      font-family: monospace;
      color: var(--color-text-muted);
      font-weight: 600;
    }

    .action-type {
      font-family: monospace;
      font-weight: 600;
      color: var(--color-accent-default);
    }

    .item-right {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
    }

    .payload-badge {
      font-family: monospace;
      font-size: 0.7rem;
      background: var(--color-bg-surface);
      border: 1px solid var(--color-border-default);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--color-text-muted);
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .time {
      font-size: 0.7rem;
      color: var(--color-text-muted);
    }

    .active-snapshot-view {
      background: var(--color-stage-bg, #0f0f12);
      border: 1px solid var(--color-stage-border, #26262b);
      border-radius: var(--radius-md, 0.5rem);
      padding: var(--space-3, 0.75rem);
    }

    .snapshot-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: var(--space-2, 0.5rem);
    }

    .view-title {
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--color-stage-muted, #9a9aa3);
    }

    .json-code {
      margin: 0;
      font-family: monospace;
      font-size: 0.75rem;
      line-height: 1.4;
      color: var(--color-stage-text, #f7f7f8);
      overflow-x: auto;
      max-height: 140px;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TimeTravelPanelComponent {
  readonly history = input.required<readonly ActionRecord[]>();
  readonly currentIndex = input.required<number>();
  readonly timeTravelIndexChange = output<number>();

  selectSnapshot(index: number): void {
    this.timeTravelIndexChange.emit(index);
  }

  stepPrevious(): void {
    if (this.currentIndex() > 0) {
      this.timeTravelIndexChange.emit(this.currentIndex() - 1);
    }
  }

  stepNext(): void {
    if (this.currentIndex() < this.history().length - 1) {
      this.timeTravelIndexChange.emit(this.currentIndex() + 1);
    }
  }

  jumpToLatest(): void {
    this.timeTravelIndexChange.emit(this.history().length - 1);
  }

  currentSnapshot(): ActionRecord | undefined {
    return this.history()[this.currentIndex()];
  }

  isTimeTravelling(): boolean {
    return this.currentIndex() < this.history().length - 1;
  }

  formattedSnapshot(): string {
    const snap = this.currentSnapshot();
    if (!snap) return '{}';
    return JSON.stringify(snap.stateSnapshot, null, 2);
  }

  stringifyPayload(payload: unknown): string {
    if (payload == null) return '';
    if (typeof payload === 'object') {
      try {
        return JSON.stringify(payload);
      } catch {
        return '[Object]';
      }
    }
    return String(payload);
  }
}
