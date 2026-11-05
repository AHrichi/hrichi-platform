import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DOCUMENT,
  effect,
  inject,
  signal,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { filter, map } from 'rxjs';
import { AhScrollHint } from '@ah/ui';
import { APP_MODE } from '@ah/platform/app-mode';
import type { SiteLanguage } from '@ah/shared/state';
import { BasecampI18n } from '../i18n/basecamp-i18n';
import { decodeTrip, SHARE_PREFIX } from '../services/share-link';
import { BasecampStore } from '../store/basecamp.store';

export type BasecampScreen =
  'trips' | 'weather' | 'nights' | 'packing' | 'gear' | 'guide';

interface NavItem {
  readonly id: BasecampScreen;
  readonly icon: string;
}

/** Phones show the first four in the bottom bar and the rest under "More". */
const NAV: readonly NavItem[] = [
  { id: 'trips', icon: '🏕️' },
  { id: 'weather', icon: '🌦️' },
  { id: 'nights', icon: '🌌' },
  { id: 'packing', icon: '🎒' },
  { id: 'gear', icon: '🧰' },
  { id: 'guide', icon: '📖' },
];

const LANGUAGES: readonly { id: SiteLanguage; label: string }[] = [
  { id: 'fr', label: 'FR' },
  { id: 'ar', label: 'ع' },
  { id: 'en', label: 'EN' },
  { id: 'it', label: 'IT' },
  { id: 'de', label: 'DE' },
];

@Component({
  selector: 'bc-basecamp-shell',
  imports: [AhScrollHint, RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './basecamp-shell.html',
  styleUrl: './basecamp-shell.scss',
})
export class BasecampShell {
  protected readonly store = inject(BasecampStore);
  protected readonly i18n = inject(BasecampI18n);
  protected readonly t = this.i18n.t;
  /** Inside the portfolio the site header already has a language switch. */
  protected readonly standalone =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone';
  protected readonly nav = NAV;
  protected readonly primary = NAV.slice(0, 4);
  protected readonly secondary = NAV.slice(4);
  protected readonly languages = LANGUAGES;
  protected readonly moreOpen = signal(false);
  /** A short message: a shared trip came in, or its link was damaged. */
  protected readonly notice = signal<string | null>(null);

  private readonly document = inject(DOCUMENT);
  private readonly url = toSignal(
    inject(Router).events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: '' },
  );
  protected readonly inSecondary = computed(() =>
    this.secondary.some((item) => this.url().includes(`/${item.id}`)),
  );

  constructor() {
    void this.start();

    // Routes set the tab's title on navigation; this keeps it in step when
    // the language changes without a navigation.
    const title = inject(Title);
    effect(() => {
      const screen = NAV.find((item) => this.url().includes(`/${item.id}`));
      if (screen) {
        title.setTitle(`${this.t().nav[screen.id]} · Basecamp`);
      }
    });
  }

  private async start(): Promise<void> {
    await this.store.load();
    await this.importFromLink();
  }

  /** Opening a share link (`#trip=…`) adds that trip as the user's copy. */
  private async importFromLink(): Promise<void> {
    const location = this.document.defaultView?.location;
    const hash = location?.hash ?? '';
    if (!hash.startsWith(`#${SHARE_PREFIX}`)) return;
    const read = await decodeTrip(hash);
    // The fragment is spent: a reload must not import the trip again.
    this.document.defaultView?.history.replaceState(
      history.state,
      '',
      location ? location.pathname + location.search : '',
    );
    if ('error' in read) {
      this.notice.set(this.t().share.badLink);
      return;
    }
    const trip = await this.store.importTrip(read.trip);
    this.notice.set(this.t().share.imported(trip.name));
  }

  protected closeMore(): void {
    this.moreOpen.set(false);
  }
}
