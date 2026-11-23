import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { APP_MODE } from '@ah/platform/app-mode';
import {
  GhAppBar,
  GhButton,
  GhLangSwitch,
  GREENHOUSE_BRAND,
} from '@ah/products/greenhouse/ui';
import { isSiteLanguage } from '@ah/shared/state';
import { CreateFarm } from '../auth/create-farm';
import { DashboardSignIn } from '../auth/dashboard-sign-in';
import { DASHBOARD_LANGUAGES, DashboardI18n } from '../i18n/dashboard-i18n';
import { FarmStore } from '../store/farm.store';

const SECTIONS = [
  'plan',
  'performance',
  'absences',
  'workers',
  'teams',
  'greenhouses',
  'people',
] as const;

/**
 * The dashboard's frame: the greenhouse look (and a brand pack's colours),
 * the app bar, and whatever the farm's state calls for: the sign-in, the
 * farm to create, or the sections. Inside the portfolio the site header
 * has the language switch.
 */
@Component({
  selector: 'gh-dashboard-shell',
  imports: [
    CreateFarm,
    DashboardSignIn,
    GhAppBar,
    GhButton,
    GhLangSwitch,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-look': 'greenhouse', '[attr.data-brand]': 'brand.id' },
  templateUrl: './dashboard-shell.html',
  styleUrl: './dashboard-shell.scss',
})
export class DashboardShell {
  protected readonly i18n = inject(DashboardI18n);
  protected readonly t = this.i18n.t;
  protected readonly store = inject(FarmStore);
  protected readonly brand = inject(GREENHOUSE_BRAND);
  protected readonly languages = DASHBOARD_LANGUAGES;
  protected readonly sections = SECTIONS;
  protected readonly standalone =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone';

  protected readonly problemText = computed(() => {
    const problem = this.store.problem();
    return problem ? this.t().problems[problem] : null;
  });

  constructor() {
    void this.store.start();
    const title = inject(Title);
    effect(() =>
      title.setTitle(
        [this.store.access()?.farmName, this.t().app.name]
          .filter(Boolean)
          .join(' · '),
      ),
    );
  }

  protected setLanguage(id: string): void {
    if (isSiteLanguage(id)) this.i18n.setLanguage(id);
  }

  protected chooseFarm(farmId: string): void {
    const access = this.store.farms().find((f) => f.farmId === farmId);
    if (access) void this.store.openFarm(access);
  }
}
