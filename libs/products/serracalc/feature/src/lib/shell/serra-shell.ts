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
  untracked,
  viewChild,
} from '@angular/core';
import { Title } from '@angular/platform-browser';
import {
  ActivatedRoute,
  NavigationEnd,
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { TourHost, type TourRoute, TourService } from '@ah/platform/tour';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map } from 'rxjs';
import { AhScrollHint } from '@ah/ui';
import { APP_MODE } from '@ah/platform/app-mode';
import { PreferencesStore } from '@ah/shared/state';
import { isoWeek, type SerraScreen } from '@ah/products/serracalc/domain';
import { SerraI18n } from '../i18n/serra-i18n';
import { SerraDbService } from '../services/serra-db.service';
import { SerraUpdates } from '../services/serra-updates';
import { SerraStore } from '../store/serra.store';
import { Icon, type IconName } from '../ui/icon/icon';
import { LangMenu } from '../ui/lang-menu/lang-menu';
import { SERRA_TOUR, serraTourText } from '../tour/serra-tour';
import { SerraAssistant } from '../assistant/serra-assistant';
import { SyncEngine } from '@ah/platform/sync';
import { provideSerraSync } from '../services/serra-sync';

export type { SerraScreen };

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
    SerraAssistant,
    TourHost,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Cloud sync for the screens below (ADR-0032); off until turned on.
  providers: [provideSerraSync()],
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
  /** A new version, downloaded by the service worker (standalone). */
  protected readonly updates = inject(SerraUpdates);
  /** Whether the projects' database is in reach, or held by another tab. */
  protected readonly db = inject(SerraDbService);
  protected readonly week = isoWeek(new Date());
  protected readonly moreOpen = signal(false);
  /** The assistant's panel, and whether its code has been fetched yet. */
  protected readonly assistantOpen = signal(false);
  protected readonly assistantLoaded = signal(false);
  private readonly moreSheet = viewChild<ElementRef<HTMLElement>>('moreSheet');
  private openerButton: HTMLElement | null = null;

  /** The floating header's height, px: what sticky parts sit under. */
  protected readonly topSize = signal(0);
  /** True once the page has scrolled under the floating header. */
  protected readonly stuck = signal(false);
  private readonly top = viewChild.required<ElementRef<HTMLElement>>('top');
  private readonly sentinel =
    viewChild.required<ElementRef<HTMLElement>>('sentinel');

  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly tour = inject(TourService);
  private readonly bottomNav =
    viewChild.required<ElementRef<HTMLElement>>('bottomNav');

  /** The tour's words, in the reader's language. */
  protected readonly tourText = computed(() => serraTourText(this.t()));

  /** Opens a step's screen, inside the app (also under the portfolio). */
  protected readonly tourNavigate = (route: TourRoute) =>
    this.router.navigate([route.path], {
      relativeTo: this.route,
      queryParams: route.query,
    });

  /** Bands the tour's card keeps clear of: the floating header, the phone bar. */
  protected readonly tourInsets = () => ({
    top: this.standalone ? this.topSize() : 0,
    bottom: this.bottomNav().nativeElement.offsetHeight,
  });

  private readonly url = toSignal(
    this.router.events.pipe(
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
    // A change put in the outbox: sync it once the edits settle.
    const sync = inject(SyncEngine);
    effect(() => {
      if (this.db.outboxChanged() > 0) untracked(() => sync.changed());
    });
    if (this.standalone) {
      this.floatHeader();
      afterNextRender(() => this.updates.start());
    }
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
      // One callback can carry several changes (a page that jumps to an
      // anchor right after loading): the last one is the current state.
      const scrolled = new IntersectionObserver((entries) =>
        this.stuck.set(!entries[entries.length - 1].isIntersecting),
      );
      scrolled.observe(this.sentinel().nativeElement);
      destroyRef.onDestroy(() => {
        resize.disconnect();
        scrolled.disconnect();
        root.style.removeProperty('scroll-padding-block-start');
      });
    });
  }

  /** Starts the tour; focus comes back to `opener` when it ends. */
  protected startTour(opener: HTMLElement): void {
    this.closeMore();
    this.tour.start(SERRA_TOUR, opener);
  }

  protected toggleAssistant(): void {
    this.closeMore();
    this.assistantLoaded.set(true);
    this.assistantOpen.update((open) => !open);
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
