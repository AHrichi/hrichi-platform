import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Puts the kit's shared classes (`gh-button`, `gh-card`, `gh-input`…) on
 * the page. Each app's shell renders it once, so the kit styles itself
 * wherever it runs: standalone, or as a remote inside the portfolio shell,
 * which loads no product's global stylesheet.
 */
@Component({
  selector: 'gh-kit-styles',
  template: '',
  styleUrl: '../../styles/greenhouse.scss',
  // The classes are global on purpose: every greenhouse screen uses them.
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { hidden: '' },
})
export class GhKitStyles {}
