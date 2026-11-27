import { ChangeDetectionStrategy, Component } from '@angular/core';

/** BARQ's mark: a lightning bolt. Decorative: the brand name is text nearby. */
@Component({
  selector: 'lt-bolt-mark',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg viewBox="0 0 64 64" aria-hidden="true" focusable="false">
      <path class="bolt" d="M36 4 12 36h16l-6 24 26-34H32l4-22z" />
    </svg>
  `,
  styleUrl: './bolt-mark.scss',
})
export class BoltMark {}
