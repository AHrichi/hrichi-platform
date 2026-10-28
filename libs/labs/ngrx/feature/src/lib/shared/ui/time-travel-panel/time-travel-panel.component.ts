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
          <div
            class="history-item"
            [class.active]="idx === currentIndex()"
            (click)="selectSnapshot(idx)"
            role="button"
            tabindex="0"
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
          </div>
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
      background: var(--color-surface-sunken, rgba(15, 23, 42, 0.7));
      border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.08));
      border-radius: var(--radius-xl, 1rem);
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
      border-bottom: 1px solid
        var(--color-border-subtle, rgba(255, 255, 255, 0.08));
    }

    .title-meta {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
    }

    .title {
      margin: 0;
      font-size: var(--font-size-sm, 0.875rem);
      font-weight: 600;
      color: var(--color-text-primary, #f8fafc);
    }

    .scrubber-controls {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
    }

    .index-indicator {
      font-size: var(--font-size-xs, 0.75rem);
      font-family: monospace;
      color: var(--color-text-muted, #94a3b8);
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
      padding: 6px var(--space-3, 0.75rem);
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid transparent;
      border-radius: var(--radius-md, 0.5rem);
      cursor: pointer;
      font-size: var(--font-size-xs, 0.75rem);
      transition:
        background 0.2s ease,
        border-color 0.2s ease;
    }

    .history-item:hover {
      background: rgba(255, 255, 255, 0.05);
    }

    .history-item.active {
      background: rgba(99, 102, 241, 0.15);
      border-color: #6366f1;
    }

    .item-left {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
    }

    .seq {
      font-family: monospace;
      color: var(--color-text-muted, #64748b);
      font-weight: 600;
    }

    .action-type {
      font-family: monospace;
      font-weight: 600;
      color: #38bdf8;
    }

    .item-right {
      display: flex;
      align-items: center;
      gap: var(--space-2, 0.5rem);
    }

    .payload-badge {
      font-family: monospace;
      font-size: 0.65rem;
      background: rgba(255, 255, 255, 0.08);
      padding: 2px 6px;
      border-radius: 4px;
      color: var(--color-text-muted, #cbd5e1);
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .time {
      font-size: 0.65rem;
      color: var(--color-text-muted, #64748b);
    }

    .active-snapshot-view {
      background: rgba(0, 0, 0, 0.35);
      border: 1px solid var(--color-border-subtle, rgba(255, 255, 255, 0.06));
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
      color: var(--color-text-muted, #94a3b8);
    }

    .json-code {
      margin: 0;
      font-family: monospace;
      font-size: 0.75rem;
      line-height: 1.4;
      color: #a5f3fc;
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
