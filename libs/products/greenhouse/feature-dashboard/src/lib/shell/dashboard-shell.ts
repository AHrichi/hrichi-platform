import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterOutlet } from '@angular/router';
import { APP_MODE } from '@ah/platform/app-mode';
import {
  GhAppBar,
  GhLangSwitch,
  GREENHOUSE_BRAND,
} from '@ah/products/greenhouse/ui';
import { isSiteLanguage } from '@ah/shared/state';
import { DASHBOARD_LANGUAGES, DashboardI18n } from '../i18n/dashboard-i18n';

/**
 * The dashboard's frame: the greenhouse look (and a brand pack's colours),
 * the app bar, and the demo notice. Inside the portfolio the site header
 * has the language switch.
 */
@Component({
  selector: 'gh-dashboard-shell',
  imports: [GhAppBar, GhLangSwitch, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-look': 'greenhouse', '[attr.data-brand]': 'brand.id' },
  templateUrl: './dashboard-shell.html',
  styleUrl: './dashboard-shell.scss',
})
export class DashboardShell {
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  protected readonly brand = inject(GREENHOUSE_BRAND);
  protected readonly languages = DASHBOARD_LANGUAGES;
  protected readonly standalone =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone';

  constructor() {
    const title = inject(Title);
    effect(() =>
      title.setTitle(`${this.t().plan.title} · ${this.t().app.name}`),
    );
  }

  protected setLanguage(id: string): void {
    if (isSiteLanguage(id)) this.i18n.setLanguage(id);
  }
}
