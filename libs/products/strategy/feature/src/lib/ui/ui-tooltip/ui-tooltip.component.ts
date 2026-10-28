import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Tooltip } from '@ah/ui';

@Component({
  selector: 'app-ui-tooltip',
  standalone: true,
  imports: [Tooltip],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ui-tooltip.component.html',
  styleUrl: './ui-tooltip.component.scss',
})
export class UiTooltipComponent {
  tipTitle = input<string>();
  tipBody = input.required<string>();
  tipFormula = input<string>();
  tipMeaning = input<string>();
}
