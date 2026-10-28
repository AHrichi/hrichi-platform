import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Eyebrow, heading and lead paragraph that open a page or section. */
@Component({
  selector: 'ah-section-heading',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ah-stack', style: '--gap: var(--space-3)' },
  templateUrl: './section-heading.html',
  styleUrl: './section-heading.scss',
})
export class SectionHeading {
  readonly heading = input.required<string>();
  readonly eyebrow = input<string>();
  readonly lead = input<string>();
  readonly level = input<1 | 2>(2);
  /** Lets a <section aria-labelledby> point at the heading. */
  readonly headingId = input<string>();
}
