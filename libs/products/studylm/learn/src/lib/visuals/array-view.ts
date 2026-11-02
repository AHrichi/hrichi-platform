import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import type { ArrayState } from '@ah/products/studylm/lessons';

/** An array as a row of cells, with its pointers under the indexes. */
@Component({
  selector: 'sl-array-view',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ol class="cells" dir="ltr">
      @for (cell of cells(); track $index) {
        <li
          class="cell"
          [class.compared]="cell.compared"
          [class.swapped]="cell.swapped"
          [class.changed]="cell.changed"
          [class.found]="cell.found"
          [class.out]="cell.out"
          [class.marked]="cell.mark !== null"
        >
          <span class="value">{{ cell.value }}</span>
          <span class="index">{{ $index }}</span>
          @if (cell.mark) {
            <span class="mark">{{ cell.mark }}</span>
          }
          @for (name of cell.pointers; track name) {
            <span class="pointer">{{ name }}</span>
          }
        </li>
      }
    </ol>
    @if (state().notFound) {
      <p class="result">Not found</p>
    }
  `,
  styles: `
    .cells {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--space-1);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .cell {
      display: grid;
      justify-items: center;
      gap: 2px;
      min-inline-size: 2.75rem;
    }
    .value {
      display: grid;
      place-items: center;
      inline-size: 2.75rem;
      block-size: 2.75rem;
      border: 2px solid var(--color-stage-border);
      border-radius: var(--radius-sm);
      font-family: var(--font-family-mono);
      font-weight: var(--font-weight-semibold);
      transition:
        background-color var(--duration-fast, 150ms),
        transform var(--duration-fast, 150ms);
    }
    .index,
    .mark {
      color: var(--sl-muted);
      font-size: var(--font-size-100);
    }
    .pointer {
      padding: 0 var(--space-1);
      border-radius: var(--radius-pill);
      background: var(--color-data-2);
      color: var(--color-stage-bg);
      font-family: var(--font-family-mono);
      font-size: var(--font-size-100);
      font-weight: var(--font-weight-bold);
    }
    .compared .value {
      border-color: var(--color-data-3);
      transform: translateY(-4px);
    }
    .swapped .value,
    .changed .value {
      background: color-mix(in srgb, var(--color-data-3) 35%, transparent);
    }
    .marked .value {
      border-color: var(--color-data-4);
    }
    .found .value {
      border-color: var(--color-data-1);
      background: color-mix(in srgb, var(--color-data-1) 35%, transparent);
    }
    /* Out of play: dashed and muted, still readable. */
    .out .value {
      border-style: dashed;
      color: var(--sl-muted);
    }
    .result {
      margin: var(--space-2) 0 0;
      text-align: center;
      color: var(--color-data-5);
      font-weight: var(--font-weight-semibold);
    }
    @media (prefers-reduced-motion: reduce) {
      .value {
        transition: none;
      }
      .compared .value {
        transform: none;
      }
    }
  `,
})
export class ArrayView {
  readonly state = input.required<ArrayState>();

  protected readonly cells = computed(() => {
    const s = this.state();
    const pointers = Object.entries(s.pointers);
    return s.values.map((value, i) => ({
      value,
      compared: s.compared?.includes(i) ?? false,
      swapped: s.swapped?.includes(i) ?? false,
      changed: s.changed.includes(i),
      found: s.found.includes(i),
      out: s.range !== null && (i < s.range[0] || i > s.range[1]),
      mark: s.marks[i] ?? null,
      pointers: pointers.filter(([, at]) => at === i).map(([name]) => name),
    }));
  });
}
