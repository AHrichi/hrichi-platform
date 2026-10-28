import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Tag } from '../tag/tag';

/**
 * A card whose title is the only link; a pseudo-element stretches it over the
 * whole card, so screen readers hear one link instead of a wall of text.
 */
@Component({
  selector: 'ah-link-card',
  imports: [RouterLink, Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'ah-card ah-card--link' },
  templateUrl: './link-card.html',
  styleUrl: './link-card.scss',
})
export class LinkCard {
  readonly heading = input.required<string>();
  readonly href = input.required<string>();
  readonly summary = input.required<string>();
  readonly eyebrow = input<string>();
  readonly tags = input<readonly string[]>([]);
}
