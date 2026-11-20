import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  ActivatedRoute,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { APP_MODE } from '@ah/platform/app-mode';
import type { ModuleId } from '@ah/products/system-design/domain';
import { SdIcon, SdProgressCard } from '@ah/products/system-design/ui';
import { PreferencesStore } from '@ah/shared/state';
import { SHELL_COPY } from '../copy/shell-copy';
import { handleSystemDesignKey } from '../keyboard/keyboard';
import { SdSearchDialog } from '../search/search-dialog';
import { SdNav } from '../services/sd-nav';
import { SystemDesignStore } from '../store/system-design.store';

/**
 * The app's root shell (`sd-shell`).
 * Carries `data-look="paper"` and pins English, left-to-right, so the course
 * reads the same inside the portfolio whatever the site language (ADR-0025).
 */
@Component({
  selector: 'sd-shell',
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    SdIcon,
    SdProgressCard,
    SdSearchDialog,
  ],
  templateUrl: './system-design-shell.html',
  styleUrl: './system-design-shell.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    'data-look': 'paper',
    lang: 'en',
    dir: 'ltr',
    '(document:keydown)': 'onGlobalKey($event)',
  },
})
export class SystemDesignShell {
  protected readonly copy = SHELL_COPY;
  protected readonly store = inject(SystemDesignStore);
  protected readonly preferences = inject(PreferencesStore);
  protected readonly standalone =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'standalone';

  private readonly nav = inject(SdNav);
  private readonly expandedModules = signal<ReadonlySet<ModuleId>>(
    new Set<ModuleId>(['foundations']),
  );

  protected readonly moduleCountsMap = computed(
    () => new Map(this.store.courseProgress().modules.map((m) => [m.id, m])),
  );

  constructor() {
    this.nav.attach(inject(ActivatedRoute));
    void this.store.load();

    // Auto-expand whichever module owns the active lesson.
    effect(() => {
      const mod = this.store.activeMeta()?.module;
      if (!mod) return;
      this.expandedModules.update((prev) => {
        if (prev.has(mod)) return prev;
        const next = new Set(prev);
        next.add(mod);
        return next;
      });
    });
  }

  protected isModuleExpanded(id: ModuleId): boolean {
    return this.expandedModules().has(id);
  }

  protected toggleModule(id: ModuleId): void {
    this.expandedModules.update((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  protected formatModuleNumber(n: number): string {
    return String(n).padStart(2, '0');
  }

  protected selectLesson(lessonId: string): void {
    const step = (this.store.progressById()[lessonId]?.lastStep ?? 0) + 1;
    this.store.closeDrawer();
    void this.nav.goToLesson(lessonId, step);
  }

  protected onGlobalKey(event: KeyboardEvent): void {
    handleSystemDesignKey(event, {
      openSearch: () => this.store.openSearch(),
      closeOverlays: () => {
        if (this.store.searchOpen()) {
          this.store.closeSearch();
          return true;
        }
        if (this.store.drawerOpen()) {
          this.store.closeDrawer();
          return true;
        }
        return false;
      },
    });
  }
}
