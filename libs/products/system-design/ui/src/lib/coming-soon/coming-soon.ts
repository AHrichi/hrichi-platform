import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** A plain card for screens that aren't built yet. */
@Component({
  selector: 'sd-coming-soon',
  templateUrl: './coming-soon.html',
  styleUrl: './coming-soon.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ComingSoon {
  readonly heading = input.required<string>();
  readonly body = input.required<string>();
}
