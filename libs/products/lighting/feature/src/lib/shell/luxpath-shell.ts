import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AhScrollHint } from '@ah/ui';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { APP_MODE } from '@ah/platform/app-mode';
import type { SiteLanguage } from '@ah/shared/state';
import { LuxPathI18n } from '../i18n/luxpath-i18n';
import { LightingStore } from '../store/lighting.store';

export type LuxPathScreen =
  | 'projects'
  | 'calculations'
  | 'camera'
  | 'map'
  | 'verticality'
  | 'concrete'
  | 'standards'
  | 'materials'
  | 'report'
  | 'guide';

interface NavItem {
  readonly id: LuxPathScreen;
  readonly icon: string;
}

/** Phones show the first four in the bottom bar and the rest under "More". */
const NAV: readonly NavItem[] = [
  { id: 'projects', icon: '📋' },
  { id: 'calculations', icon: '📐' },
  { id: 'camera', icon: '📷' },
  { id: 'map', icon: '🗺️' },
  { id: 'verticality', icon: '🎯' },
  { id: 'concrete', icon: '🧱' },
  { id: 'standards', icon: '📜' },
  { id: 'materials', icon: '📦' },
  { id: 'report', icon: '🖨️' },
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
  selector: 'lp-luxpath-shell',
  imports: [AhScrollHint, RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './luxpath-shell.html',
  styleUrl: './luxpath-shell.scss',
})
export class LuxPathShell {
  protected readonly store = inject(LightingStore);
  protected readonly i18n = inject(LuxPathI18n);
  protected readonly t = this.i18n.t;
  /** Inside the portfolio the site header already has a language switch. */
  protected readonly standalone =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone';
  protected readonly nav = NAV;
  protected readonly primary = NAV.slice(0, 4);
  protected readonly secondary = NAV.slice(4);
  protected readonly languages = LANGUAGES;
  protected readonly moreOpen = signal(false);
  private readonly moreSheet = viewChild<ElementRef<HTMLElement>>('moreSheet');
  private openerButton: HTMLElement | null = null;

  private readonly url = toSignal(
    inject(Router).events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map((event) => event.urlAfterRedirects),
    ),
    { initialValue: '' },
  );
  /** "More" stays highlighted while one of its screens is open. */
  protected readonly inSecondary = computed(() =>
    this.secondary.some((item) => this.url().includes(`/${item.id}`)),
  );

  constructor() {
    // Routes set the tab's title on navigation; this keeps it in step when
    // the language changes without a navigation.
    const title = inject(Title);
    effect(() => {
      const screen = NAV.find((item) => this.url().includes(`/${item.id}`));
      if (screen) {
        title.setTitle(`${this.t().nav[screen.id]} · LuxPath`);
      }
    });
  }

  protected toggleMore(trigger?: HTMLElement): void {
    if (this.moreOpen()) {
      this.closeMore();
    } else {
      this.openerButton =
        trigger ?? (document.activeElement as HTMLElement | null);
      this.moreOpen.set(true);
      setTimeout(() => {
        const sheet = this.moreSheet()?.nativeElement;
        if (sheet) {
          const firstLink = sheet.querySelector<HTMLElement>('a');
          (firstLink ?? sheet).focus();
        }
      }, 0);
    }
  }

  protected closeMore(): void {
    if (!this.moreOpen()) return;
    this.moreOpen.set(false);
    if (this.openerButton) {
      this.openerButton.focus();
      this.openerButton = null;
    }
  }
}
