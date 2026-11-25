import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
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
import { isoWeek } from '@ah/products/serracalc/domain';
import { SerraI18n } from '../i18n/serra-i18n';
import { SerraStore } from '../store/serra.store';
import { Icon, type IconName } from '../ui/icon/icon';
import { LangMenu } from '../ui/lang-menu/lang-menu';

export type SerraScreen =
  | 'projects'
  | 'site'
  | 'energy'
  | 'calendar'
  | 'greenhouse'
  | 'heating'
  | 'cooling'
  | 'water'
  | 'supply'
  | 'air'
  | 'operations'
  | 'data'
  | 'climate'
  | 'science'
  | 'report'
  | 'guide';

/** Sections of the side rail, in order. */
export type NavGroup = 'plan' | 'climate' | 'water' | 'operate' | 'reference';

interface NavItem {
  readonly id: SerraScreen;
  readonly icon: IconName;
  readonly group: NavGroup;
}

/** Phones show the first four in the bottom bar and the rest under "More". */
const NAV: readonly NavItem[] = [
  { id: 'projects', icon: 'projects', group: 'plan' },
  { id: 'heating', icon: 'heating', group: 'climate' },
  { id: 'cooling', icon: 'cooling', group: 'climate' },
  { id: 'water', icon: 'water', group: 'water' },
  { id: 'site', icon: 'site', group: 'plan' },
  { id: 'calendar', icon: 'calendar', group: 'plan' },
  { id: 'supply', icon: 'wave', group: 'water' },
  { id: 'greenhouse', icon: 'greenhouse', group: 'plan' },
  { id: 'air', icon: 'air', group: 'climate' },
  { id: 'energy', icon: 'energy', group: 'climate' },
  { id: 'operations', icon: 'operations', group: 'operate' },
  { id: 'data', icon: 'data', group: 'operate' },
  { id: 'climate', icon: 'climate', group: 'reference' },
  { id: 'science', icon: 'science', group: 'reference' },
  { id: 'report', icon: 'report', group: 'reference' },
  { id: 'guide', icon: 'guide', group: 'reference' },
];

const GROUPS: readonly NavGroup[] = [
  'plan',
  'climate',
  'water',
  'operate',
  'reference',
];

@Component({
  selector: 'sc-serra-shell',
  imports: [
    AhScrollHint,
    Icon,
    LangMenu,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'data-look': 'desert' },
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
  /** The order the side rail and the wide tabs read in. */
  protected readonly nav = GROUPS.flatMap((group) =>
    NAV.filter((item) => item.group === group),
  );
  protected readonly groups = GROUPS.map((id) => ({
    id,
    items: NAV.filter((item) => item.group === id),
  }));
  protected readonly primary = NAV.slice(0, 4);
  protected readonly secondary = NAV.slice(4);
  protected readonly week = isoWeek(new Date());
  protected readonly moreOpen = signal(false);
  private readonly moreSheet = viewChild<ElementRef<HTMLElement>>('moreSheet');
  private openerButton: HTMLElement | null = null;

  /** The floating header's height, px: what sticky parts sit under. */
  protected readonly topSize = signal(0);
  /** True once the page has scrolled under the floating header. */
  protected readonly stuck = signal(false);
  private readonly top = viewChild.required<ElementRef<HTMLElement>>('top');
  private readonly sentinel =
    viewChild.required<ElementRef<HTMLElement>>('sentinel');

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
    if (this.standalone) this.floatHeader();
  }

  /**
   * Standalone, the header stays at the top while the page scrolls. Its
   * height is shared (as --sc-top) with the parts that stick under it, and
   * the page scrolls anchors clear of it.
   */
  private floatHeader(): void {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const top = this.top().nativeElement;
      const root = document.documentElement;
      const resize = new ResizeObserver(() => {
        const size = Math.ceil(top.getBoundingClientRect().height);
        this.topSize.set(size);
        root.style.setProperty('scroll-padding-block-start', `${size + 12}px`);
      });
      resize.observe(top);
      const scrolled = new IntersectionObserver(([entry]) =>
        this.stuck.set(!entry.isIntersecting),
      );
      scrolled.observe(this.sentinel().nativeElement);
      destroyRef.onDestroy(() => {
        resize.disconnect();
        scrolled.disconnect();
        root.style.removeProperty('scroll-padding-block-start');
      });
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
