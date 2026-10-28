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
  templateUrl: './time-travel-panel.component.html',
  styleUrl: './time-travel-panel.component.scss',
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
