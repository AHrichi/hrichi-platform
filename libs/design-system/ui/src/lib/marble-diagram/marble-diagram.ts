import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
} from '@angular/core';

export type MarbleShape = 'circle' | 'square' | 'diamond';
export type MarbleVariant =
  | 'accent'
  | 'success'
  | 'warning'
  | 'info'
  | 'danger'
  | 'neutral'
  | 'data-1'
  | 'data-2'
  | 'data-3'
  | 'data-4'
  | 'data-5';

export interface MarbleItem {
  readonly id: string;
  readonly value: string | number;
  readonly variant?: MarbleVariant;
  readonly color?: string;
  readonly positionPercent?: number;
  readonly shape?: MarbleShape;
  readonly tooltip?: string;
  readonly isEmitting?: boolean;
}

export interface StreamLane {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
  readonly badge?: string;
  readonly marbles: readonly MarbleItem[];
  readonly isCompleted?: boolean;
  readonly error?: string | boolean;
  readonly isPrimary?: boolean;
}

export interface OperatorTransform {
  readonly name: string;
  readonly description?: string;
  readonly formula?: string;
}

/**
 * Interactive Marble Diagram component for visualizing reactive streams,
 * operators, concurrency, and time-based emissions across light and dark themes.
 */
@Component({
  selector: 'ah-marble-diagram',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'ah-marble-diagram',
    role: 'region',
    '[attr.aria-label]': 'ariaLabel()',
  },
  templateUrl: './marble-diagram.html',
  styleUrl: './marble-diagram.scss',
})
export class MarbleDiagram {
  /** The streams to render (inputs and optional output). */
  readonly streams = input.required<readonly StreamLane[]>();

  /** Optional operator block displayed between input streams and output stream. */
  readonly operator = input<OperatorTransform | null>(null);

  /** Title displayed at the top of the diagram card. */
  readonly title = input<string>('');

  /** Description or key architectural rule. */
  readonly description = input<string>('');

  /** Accessible label for the marble diagram canvas. */
  readonly ariaLabel = input<string>('Reactive stream marble diagram');

  /** Whether to show time tick markers on stream tracks. */
  readonly showTimeTicks = input<boolean>(true);

  /** Emitted when a user selects or clicks on an individual marble. */
  readonly marbleClick = output<{ streamId: string; marble: MarbleItem }>();

  /** Currently selected marble for active highlight. */
  readonly selectedMarbleId = signal<string | null>(null);

  /** Active marble metadata for accessible inspection panel. */
  readonly activeMarble = computed<{
    streamLabel: string;
    marble: MarbleItem;
  } | null>(() => {
    const id = this.selectedMarbleId();
    if (!id) return null;
    for (const stream of this.streams()) {
      const match = stream.marbles.find((m) => m.id === id);
      if (match) {
        return { streamLabel: stream.label, marble: match };
      }
    }
    return null;
  });

  clearSelection(): void {
    this.selectedMarbleId.set(null);
  }

  /** Screen-reader announcement log for dynamic emissions. */
  readonly announcements = computed(() => {
    const list: string[] = [];
    for (const stream of this.streams()) {
      if (stream.marbles.length > 0) {
        const last = stream.marbles[stream.marbles.length - 1];
        list.push(`${stream.label} emitted ${last.value}`);
      }
      if (stream.isCompleted) {
        list.push(`${stream.label} completed`);
      }
      if (stream.error) {
        list.push(
          `${stream.label} terminated with error: ${typeof stream.error === 'string' ? stream.error : 'Stream error'}`,
        );
      }
    }
    return list.join('. ');
  });

  protected onMarbleClick(streamId: string, marble: MarbleItem): void {
    this.selectedMarbleId.set(marble.id);
    this.marbleClick.emit({ streamId, marble });
  }

  protected getPosition(
    marble: MarbleItem,
    index: number,
    total: number,
  ): number {
    if (typeof marble.positionPercent === 'number') {
      return Math.min(Math.max(marble.positionPercent, 6), 88);
    }
    if (total <= 1) return 50;
    const step = 76 / (total + 1);
    return Math.round(10 + (index + 1) * step);
  }

  protected getVariantClass(variant?: MarbleVariant): string {
    switch (variant) {
      case 'success':
        return 'marble--success';
      case 'warning':
        return 'marble--warning';
      case 'info':
        return 'marble--info';
      case 'danger':
        return 'marble--danger';
      case 'neutral':
        return 'marble--neutral';
      case 'data-1':
        return 'marble--data-1';
      case 'data-2':
        return 'marble--data-2';
      case 'data-3':
        return 'marble--data-3';
      case 'data-4':
        return 'marble--data-4';
      case 'data-5':
        return 'marble--data-5';
      case 'accent':
      default:
        return 'marble--accent';
    }
  }
}
