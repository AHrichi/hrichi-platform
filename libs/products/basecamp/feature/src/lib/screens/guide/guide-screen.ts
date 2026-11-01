import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BasecampI18n } from '../../i18n/basecamp-i18n';

/** Every screen of Basecamp: what it is for and how to use it. */
@Component({
  selector: 'bc-guide-screen',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guide-screen.html',
  styleUrl: './guide-screen.scss',
})
export class GuideScreen {
  protected readonly t = inject(BasecampI18n).t;
}
