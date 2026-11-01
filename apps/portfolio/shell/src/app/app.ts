import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { getState } from '@ngrx/signals';
import { FederationStore } from '@ah/platform/federation';
import { Inspector, type InspectableStores } from '@ah/platform/inspector';
import { profile, site } from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { AhButton } from '@ah/ui';
import { isTranslatedPage, SHELL_COPY } from './shell-copy';
import { reloadOnNavigationWhenUpdated } from './sw-updates';

@Component({
  imports: [AhButton, Inspector, RouterLink, RouterLinkActive, RouterOutlet],
  selector: 'ah-root',
  templateUrl: './app.html',
})
export class App {
  protected readonly preferences = inject(PreferencesStore);
  protected readonly profile = profile;
  protected readonly repository = site.repository;
  protected readonly designSystem = site.designSystem;
  protected readonly year = new Date().getFullYear();

  protected readonly copy = computed(
    () => SHELL_COPY[this.preferences.language()],
  );
  protected readonly languages = [
    { id: 'fr', label: 'FR', name: 'Français' },
    { id: 'ar', label: 'ع', name: 'العربية' },
    { id: 'en', label: 'EN', name: 'English' },
  ] as const;
  protected readonly nav = computed(() => {
    const nav = this.copy().nav;
    return [
      { label: nav.work, path: '/work' },
      { label: nav.apps, path: '/apps' },
      { label: nav.experience, path: '/experience' },
      { label: nav.services, path: '/services' },
      { label: nav.contact, path: '/contact' },
    ];
  });

  private readonly router = inject(Router);
  private readonly url = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: this.router.url },
  );
  /** In French or Arabic, a page that exists only in English says so and stays ltr. */
  protected readonly englishOnly = computed(
    () => this.preferences.language() !== 'en' && !isTranslatedPage(this.url()),
  );

  protected readonly inspecting = signal(false);
  private readonly hoodButton =
    viewChild<ElementRef<HTMLButtonElement>>('hoodButton');

  /** What the Federation Inspector's State tab shows. */
  protected readonly stores: InspectableStores;

  constructor() {
    const preferences = inject(PreferencesStore);
    const federation = inject(FederationStore);
    this.stores = {
      PreferencesStore: () => getState(preferences),
      FederationStore: () => getState(federation),
    };

    reloadOnNavigationWhenUpdated();

    // Prerendered HTML uses the default audience; switch only once hydrated.
    const window = inject(DOCUMENT).defaultView;
    afterNextRender(() => {
      preferences.restore();
      if (window && new URL(window.location.href).searchParams.has('inspect')) {
        this.inspecting.set(true);
      }
    });
  }

  protected closeInspector(): void {
    this.inspecting.set(false);
    this.hoodButton()?.nativeElement.focus();
  }
}
