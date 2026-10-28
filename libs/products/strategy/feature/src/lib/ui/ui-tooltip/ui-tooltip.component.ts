import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tooltip } from '@ah/ui';

@Component({
  selector: 'app-ui-tooltip',
  standalone: true,
  imports: [Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ah-tooltip
      [title]="tipTitle()"
      [body]="tipBody()"
      [formula]="tipFormula()"
      [meaning]="tipMeaning()"
      position="top"
    >
      <ng-content />
    </ah-tooltip>
  `,
})
export class UiTooltipComponent {
  tipTitle = input<string>();
  tipBody = input.required<string>();
  tipFormula = input<string>();
  tipMeaning = input<string>();
}
