import { DOCUMENT } from '@angular/common';
import {
  afterNextRender,
  afterRenderEffect,
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
import { AhButton, AhScrollHint } from '@ah/ui';
import { isTranslatedPage, SHELL_COPY } from './shell-copy';
import { AppUpdates } from './app-updates';

@Component({
  imports: [
    AhButton,
    AhScrollHint,
    Inspector,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  selector: 'ah-root',
  templateUrl: './app.html',
})
export class App {
  protected readonly preferences = inject(PreferencesStore);
  protected readonly updates = inject(AppUpdates);
  protected readonly profile = profile;
  protected readonly repository = site.repository;
  protected readonly designSystem = site.designSystem;
  protected readonly year = new Date().getFullYear();

  protected readonly copy = computed(
    () => SHELL_COPY[this.preferences.language()],
  );
  protected readonly languages = [
    { id: 'en', label: 'EN', name: 'English', nativeName: 'English' },
    { id: 'de', label: 'DE', name: 'Deutsch', nativeName: 'Deutsch' },
    { id: 'fr', label: 'FR', name: 'Français', nativeName: 'Français' },
    { id: 'it', label: 'IT', name: 'Italiano', nativeName: 'Italiano' },
    { id: 'ar', label: 'ع', name: 'العربية', nativeName: 'العربية' },
  ] as const;

  /** The short code shown in the compact language button (EN, FR, ع …). */
  protected readonly languageCode = computed(
    () =>
      this.languages.find((l) => l.id === this.preferences.language())?.label ??
      'EN',
  );

  protected onLanguageSelect(event: Event): void {
    const select = event.target as HTMLSelectElement | null;
    if (select?.value) {
      this.preferences.setLanguage(
        select.value as 'en' | 'de' | 'fr' | 'it' | 'ar',
      );
    }
  }
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

  private readonly header = viewChild<ElementRef<HTMLElement>>('header');

  constructor() {
    // On phones the page links scroll sideways: after each navigation, bring
    // the current page's link into view, so the strip shows where you are.
    afterRenderEffect(() => {
      this.url();
      const active =
        this.header()?.nativeElement.querySelector<HTMLElement>('nav a.active');
      const strip = active?.closest('ul');
      if (!active || !strip || strip.scrollWidth <= strip.clientWidth) return;
      const target =
        active.offsetLeft - (strip.clientWidth - active.offsetWidth) / 2;
      strip.scrollTo({ left: Math.max(0, target) });
    });

    const preferences = inject(PreferencesStore);
    const federation = inject(FederationStore);
    this.stores = {
      PreferencesStore: () => getState(preferences),
      FederationStore: () => getState(federation),
    };

    // Prerendered HTML uses the default audience; switch only once hydrated.
    const window = inject(DOCUMENT).defaultView;
    afterNextRender(() => {
      preferences.restore();
      this.updates.start();
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
