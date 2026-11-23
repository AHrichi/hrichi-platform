import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { APP_MODE } from '@ah/platform/app-mode';
import { DASHBOARD_LANGUAGES, DashboardI18n } from '../i18n/dashboard-i18n';

/** The dashboard's frame. Inside the portfolio the site header has the language switch. */
@Component({
  selector: 'gh-dashboard-shell',
  imports: [RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard-shell.html',
  styleUrl: './dashboard-shell.scss',
})
export class DashboardShell {
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  protected readonly languages = DASHBOARD_LANGUAGES;
  protected readonly standalone =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone';

  constructor() {
    const title = inject(Title);
    effect(() =>
      title.setTitle(`${this.t().plan.title} · ${this.t().app.name}`),
    );
  }
}
