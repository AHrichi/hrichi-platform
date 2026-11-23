import { ChangeDetectionStrategy, Component } from '@angular/core';

/** The default mark, a tunnel greenhouse, drawn in the current colour. */
@Component({
  selector: 'gh-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<svg viewBox="0 0 32 32" aria-hidden="true">
    <path class="house" d="M5 26V15C5 9.5 10 6 16 6s11 3.5 11 9v11z" />
    <path class="ribs" d="M11 26V9.5M16 26V6M21 26V9.5M5 26h22" />
  </svg>`,
  styleUrl: './mark.scss',
})
export class GhMark {}
