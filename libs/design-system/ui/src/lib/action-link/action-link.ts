import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { AhButton, ButtonSize, ButtonVariant } from '../button/button';

export interface ActionLinkTarget {
  label: string;
  href: string;
  external?: boolean;
}

/**
 * A button-styled link that picks the right element: a router link for
 * site paths, a plain link for mailto: and external URLs.
 */
@Component({
  selector: 'ah-action-link',
  imports: [RouterLink, AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { style: 'display: contents' },
  template: `
    @if (internal()) {
      <a [ahButton]="variant()" [size]="size()" [routerLink]="link().href">{{
        link().label
      }}</a>
    } @else {
      <a
        [ahButton]="variant()"
        [size]="size()"
        [href]="link().href"
        [attr.target]="link().external ? '_blank' : null"
        [attr.rel]="link().external ? 'noopener' : null"
        >{{ link().label }}</a
      >
    }
  `,
})
export class ActionLink {
  readonly link = input.required<ActionLinkTarget>();
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');

  protected readonly internal = computed(() =>
    this.link().href.startsWith('/'),
  );
}
