import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { Icon } from '../icon/icon';
import { PanelState } from './panel-state';

/**
 * A section that folds: its title is a button (a disclosure, with
 * aria-expanded) and the content under it hides when folded. Put it on the
 * section itself, so the page keeps its landmarks:
 *
 *   <section class="panel" scPanel="supply-inputs" [heading]="t().calc.inputs">
 *
 * Folding is remembered per id on this device.
 */
@Component({
  // On the page's own <section> or <article>, so its landmark and the
  // screen's .panel styles stay: an attribute, not an <sc-…> element.
  // eslint-disable-next-line @angular-eslint/component-selector
  selector: 'section[scPanel], article[scPanel]',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.aria-labelledby]': 'headingId()',
    '[class.is-folded]': 'folded()',
  },
  template: `
    @if (eyebrow(); as text) {
      <span class="panel-eyebrow">{{ text }}</span>
    }
    <h3 class="panel-head" [id]="headingId()">
      <button
        type="button"
        class="panel-toggle"
        [attr.aria-expanded]="!folded()"
        [attr.aria-controls]="bodyId()"
        (click)="toggle()"
      >
        <span class="panel-title">{{ heading() }}</span>
        <sc-icon class="panel-chevron" name="chevron" />
      </button>
    </h3>
    <div class="panel-body" [id]="bodyId()" [hidden]="folded()">
      <ng-content />
    </div>
  `,
  styleUrl: './panel.scss',
})
export class Panel {
  /** The section's id: names its heading and remembers its folding. */
  readonly scPanel = input.required<string>();
  readonly heading = input.required<string>();
  /** A small label over the title (the Science page's topic group). */
  readonly eyebrow = input<string>();

  private readonly state = inject(PanelState);
  protected readonly headingId = computed(() => `sc-${this.scPanel()}`);
  protected readonly bodyId = computed(() => `sc-${this.scPanel()}-body`);
  protected readonly folded = computed(() =>
    this.state.isFolded(this.scPanel()),
  );

  protected toggle(): void {
    this.state.setFolded(this.scPanel(), !this.folded());
  }
}
