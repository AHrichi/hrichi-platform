import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type GhSyncStatus = 'pending' | 'synced' | 'rejected';

/**
 * Where an entry stands: a coloured dot and a word, never colour alone.
 */
@Component({
  selector: 'gh-status-chip',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-status]': 'status()' },
  template: `<span class="dot" aria-hidden="true"></span
    ><span>{{ label() }}</span>`,
  styleUrl: './status-chip.scss',
})
export class GhStatusChip {
  readonly status = input.required<GhSyncStatus>();
  readonly label = input.required<string>();
}
