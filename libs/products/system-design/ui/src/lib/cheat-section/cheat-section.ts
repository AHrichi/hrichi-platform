import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import type { CheatSection } from '@ah/products/system-design/domain';

export interface CheatSectionLabels {
  when: string;
  how: string;
  watch: string;
}

const DEFAULT_LABELS: CheatSectionLabels = {
  when: 'When',
  how: 'How',
  watch: 'Watch out',
};

/**
 * One cheatsheet section (`sd-cheat-section`), drawn by kind: `numbers` as a
 * label/value/note list, `table` as a scrollable data table, `list` as a
 * bulleted list, `pattern` as When / How / Watch out. A pattern's lesson link
 * is projected by the feature into `[sdCheatLink]`, since routing lives there.
 */
@Component({
  selector: 'sd-cheat-section',
  templateUrl: './cheat-section.html',
  styleUrl: './cheat-section.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '[attr.data-kind]': 'section().kind' },
})
export class SdCheatSection {
  readonly section = input.required<CheatSection>();
  /** The section's DOM id; its heading gets `<id>-title`. */
  readonly sectionId = input.required<string>();
  readonly labels = input<CheatSectionLabels>(DEFAULT_LABELS);
}
