import { DOCUMENT } from '@angular/common';
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  Injector,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NavigationStart, Router } from '@angular/router';
import { SwUpdate } from '@angular/service-worker';
import { filter } from 'rxjs';
import { FederationStore } from '@ah/platform/federation';

/** `ready`: a newer build is deployed. `broken`: the cached copy can't update in place. */
export type UpdateState = 'none' | 'ready' | 'broken';

/** How often an open tab looks for a deploy, and the least time between looks. */
const CHECK_EVERY_MS = 30 * 60 * 1000;
const MIN_GAP_MS = 60 * 1000;

/**
 * Notices when a newer version of the site is out while a page is open.
 * The shell's own build arrives through its service worker; each remote
 * deploys on its own (ADR-0012), so the build it loaded is compared with
 * its live build-info.json. Looks again when the tab comes back into view
 * and every half hour. Once there is an update, the banner offers a reload,
 * and the next in-app navigation loads its page fresh anyway.
 */
@Injectable({ providedIn: 'root' })
export class AppUpdates {
  private readonly worker = inject(SwUpdate, { optional: true });
  private readonly federation = inject(FederationStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly injector = inject(Injector);
  private readonly window = inject(DOCUMENT).defaultView;

  readonly state = signal<UpdateState>('none');
  private readonly dismissed = signal(false);
  readonly visible = computed(
    () => this.state() !== 'none' && !this.dismissed(),
  );

  /** The commit of each remote this page loaded. */
  private readonly loadedBuilds = new Map<string, string>();
  /** Lookups of those commits still in flight; a check waits for them. */
  private readonly recording = new Set<Promise<void>>();
  private manifest?: Promise<Record<string, string>>;
  private workerReady = false;
  private started = false;
  private lastCheck = 0;

  /** Starts watching; call once in the browser, after the first render. */
  start(): void {
    const window = this.window;
    if (!window || this.started) {
      return;
    }
    this.started = true;

    const worker = this.worker?.isEnabled ? this.worker : null;
    worker?.versionUpdates
      .pipe(
        filter((event) => event.type === 'VERSION_READY'),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.workerReady = true;
        this.flag('ready');
      });
    worker?.unrecoverable
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.flag('broken'));

    const seen = new Set<string>();
    effect(
      () => {
        for (const load of this.federation.entities()) {
          if (load.status === 'loaded' && !seen.has(load.name)) {
            seen.add(load.name);
            const recorded = this.liveBuild(load.name).then((sha) => {
              if (sha) this.loadedBuilds.set(load.name, sha);
              this.recording.delete(recorded);
            });
            this.recording.add(recorded);
          }
        }
      },
      { injector: this.injector },
    );

    const onVisible = () => {
      if (window.document.visibilityState === 'visible') void this.check();
    };
    window.document.addEventListener('visibilitychange', onVisible);
    const timer = window.setInterval(() => void this.check(), CHECK_EVERY_MS);
    this.destroyRef.onDestroy(() => {
      window.document.removeEventListener('visibilitychange', onVisible);
      window.clearInterval(timer);
    });

    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationStart),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((event) => {
        if (this.state() !== 'none') {
          void this.reload(event.url);
        }
      });
  }

  /** Looks for a newer shell or remote build. */
  async check(): Promise<void> {
    const now = Date.now();
    if (this.state() !== 'none' || now - this.lastCheck < MIN_GAP_MS) {
      return;
    }
    this.lastCheck = now;
    if (this.worker?.isEnabled) {
      // A newer shell build arrives as VERSION_READY. Not awaited: the
      // promise waits until the worker controls the page, which on a first
      // visit is not until the next load.
      void this.worker.checkForUpdate().catch(() => false);
    }
    await Promise.all(this.recording);
    for (const [name, sha] of this.loadedBuilds) {
      const live = await this.liveBuild(name);
      if (live && live !== sha) {
        this.flag('ready');
        return;
      }
    }
  }

  /** Loads the new version: the worker's update first, if it has one. */
  async reload(url?: string): Promise<void> {
    const window = this.window;
    if (!window) return;
    if (this.workerReady && this.worker) {
      await this.worker.activateUpdate().catch(() => false);
    }
    if (url) {
      window.location.assign(url);
    } else {
      window.location.reload();
    }
  }

  /**
   * Drops the service worker and everything it cached, then reloads, so
   * every file comes from the network. The worker registers again on load.
   */
  async hardReload(): Promise<void> {
    const window = this.window;
    if (!window) return;
    try {
      const registrations =
        (await window.navigator.serviceWorker?.getRegistrations()) ?? [];
      await Promise.all(registrations.map((r) => r.unregister()));
      if ('caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((key) => window.caches.delete(key)));
      }
    } catch {
      // Blocked storage: a plain reload still fetches the new HTML.
    }
    window.location.reload();
  }

  dismiss(): void {
    this.dismissed.set(true);
  }

  private flag(state: Exclude<UpdateState, 'none'>): void {
    if (this.state() !== 'broken') {
      this.state.set(state);
    }
    this.dismissed.set(false);
  }

  /** The commit a remote has live now, or null when it can't be read. */
  private async liveBuild(name: string): Promise<string | null> {
    try {
      this.manifest ??= fetch('federation.manifest.json').then((response) =>
        response.ok ? response.json() : {},
      );
      const entry = (await this.manifest)[name];
      if (!entry) return null;
      const response = await fetch(new URL('build-info.json', entry), {
        cache: 'no-store',
      });
      if (!response.ok) return null;
      const info = (await response.json()) as { sha?: unknown };
      return typeof info.sha === 'string' ? info.sha : null;
    } catch {
      this.manifest = undefined;
      return null;
    }
  }
}
