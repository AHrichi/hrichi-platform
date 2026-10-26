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
  template: `
    @if (eyebrow()) {
      <p class="ah-eyebrow">{{ eyebrow() }}</p>
    }
    <h3 class="title">
      <a class="ah-card__link" [routerLink]="href()">{{ heading() }}</a>
    </h3>
    <p class="ah-muted">{{ summary() }}</p>
    @if (tags().length) {
      <ul class="ah-cluster tags" role="list" style="--gap: var(--space-2)">
        @for (tag of tags(); track tag) {
          <li>
            <ah-tag>{{ tag }}</ah-tag>
          </li>
        }
      </ul>
    }
  `,
  styles: `
    .title {
      font-size: var(--font-size-400);
    }
    .tags {
      margin-block-start: auto;
      padding-block-start: var(--space-2);
    }
  `,
})
export class LinkCard {
  readonly heading = input.required<string>();
  readonly href = input.required<string>();
  readonly summary = input.required<string>();
  readonly eyebrow = input<string>();
  readonly tags = input<readonly string[]>([]);
}
