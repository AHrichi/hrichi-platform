import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LuxPathI18n } from '../../i18n/luxpath-i18n';

/** What each part of LuxPath is for and how to use it, with a link to it. */
@Component({
  selector: 'lp-guide-screen',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './guide-screen.html',
  styleUrl: './guide-screen.scss',
})
export class GuideScreen {
  protected readonly t = inject(LuxPathI18n).t;
}
