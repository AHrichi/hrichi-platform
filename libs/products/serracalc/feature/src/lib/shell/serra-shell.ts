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
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AhScrollHint } from '@ah/ui';
import { APP_MODE } from '@ah/platform/app-mode';
import { PreferencesStore } from '@ah/shared/state';
import { SERRA_LANGUAGES, SerraI18n } from '../i18n/serra-i18n';
import { SerraStore } from '../store/serra.store';

export type SerraScreen =
  | 'projects'
  | 'greenhouse'
  | 'heating'
  | 'cooling'
  | 'water'
  | 'air'
  | 'climate'
  | 'report'
  | 'guide';

interface NavItem {
  readonly id: SerraScreen;
  readonly icon: string;
}

/** Phones show the first four in the bottom bar and the rest under "More". */
const NAV: readonly NavItem[] = [
  { id: 'projects', icon: '📋' },
  { id: 'heating', icon: '🔥' },
  { id: 'cooling', icon: '🌬️' },
  { id: 'water', icon: '💧' },
  { id: 'air', icon: '💡' },
  { id: 'greenhouse', icon: '🏠' },
  { id: 'climate', icon: '🌤️' },
  { id: 'report', icon: '🖨️' },
  { id: 'guide', icon: '📖' },
];

@Component({
  selector: 'sc-serra-shell',
  imports: [AhScrollHint, RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-look': 'greenhouse' },
  templateUrl: './serra-shell.html',
  styleUrl: './serra-shell.scss',
})
export class SerraShell {
  protected readonly store = inject(SerraStore);
  protected readonly i18n = inject(SerraI18n);
  protected readonly t = this.i18n.t;
  /** Light or dark: the portfolio's choice, or the standalone app's own. */
  protected readonly preferences = inject(PreferencesStore);
  /** Inside the portfolio the site header already has a language switch. */
  protected readonly standalone =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone';
  protected readonly nav = NAV;
  protected readonly primary = NAV.slice(0, 4);
  protected readonly secondary = NAV.slice(4);
  protected readonly languages = SERRA_LANGUAGES;
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
    // the language changes without one.
    const title = inject(Title);
    effect(() => {
      const screen = NAV.find((item) => this.url().includes(`/${item.id}`));
      if (screen) {
        title.setTitle(`${this.t().nav[screen.id]} · SerraCalc`);
      }
    });
  }

  protected toggleMore(trigger: HTMLElement): void {
    if (this.moreOpen()) {
      this.closeMore();
      return;
    }
    this.openerButton = trigger;
    this.moreOpen.set(true);
    setTimeout(() => {
      const sheet = this.moreSheet()?.nativeElement;
      (sheet?.querySelector<HTMLElement>('a') ?? sheet)?.focus();
    }, 0);
  }

  protected closeMore(): void {
    if (!this.moreOpen()) return;
    this.moreOpen.set(false);
    this.openerButton?.focus();
    this.openerButton = null;
  }
}
