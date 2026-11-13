import { DOCUMENT } from '@angular/common';
import {
  DestroyRef,
  inject,
  Injectable,
  InjectionToken,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import {
  type CaptureItem,
  encodeHandoff,
  HANDOFF_KEY,
  type LearningTodaySummary,
  readTodaySummary,
  resolveStandaloneLearningUrl,
  TODAY_SUMMARY_KEY,
} from '@ah/learning/contracts';
import { APP_MODE } from '@ah/platform/app-mode';

function isLocalHostname(hostname: string): boolean {
  return hostname === 'localhost' || hostname === '127.0.0.1';
}

/**
 * Where the learning app lives. Inside the portfolio it is a route of the
 * same shell (`/apps/learning`); a standalone app opens the deployed app,
 * whose origin is `product-learning` in tools/federation/remotes.json.
 */
export const LEARNING_APP_URL = new InjectionToken<string>('LEARNING_APP_URL', {
  providedIn: 'root',
  factory: () => {
    if (inject(APP_MODE, { optional: true }) === 'embedded-demo') {
      return '/apps/learning';
    }
    const host = inject(DOCUMENT).defaultView?.location.hostname ?? '';
    return resolveStandaloneLearningUrl(isLocalHostname(host));
  },
});

/**
 * The Learning Engine for host apps (design §9): the only thing they may
 * import (scope:learning-client). It never touches the engine's database:
 * captures are handed to the learning app, which asks before saving, and
 * today's progress is read from the summary the app publishes.
 */
@Injectable({ providedIn: 'root' })
export class LearningClient {
  private readonly appUrl = inject(LEARNING_APP_URL);
  private readonly router = inject(Router);
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly summary = signal<LearningTodaySummary | null>(this.read());

  /** True when the host runs inside the portfolio's embedded demo shell. */
  readonly isEmbeddedDemo =
    (inject(APP_MODE, { optional: true }) ?? 'standalone') === 'embedded-demo';

  /** Today's set, when the learning app runs on this origin. */
  readonly today = this.summary.asReadonly();

  constructor() {
    const onStorage = (event: StorageEvent) => {
      if (event.key === TODAY_SUMMARY_KEY) this.summary.set(this.read());
    };
    this.window?.addEventListener('storage', onStorage);
    inject(DestroyRef).onDestroy(() =>
      this.window?.removeEventListener('storage', onStorage),
    );
  }

  /** The learning app's address for `path` (e.g. `today`). */
  urlFor(path: string): string {
    return `${this.appUrl.replace(/\/+$/, '')}/${path}`;
  }

  /** The standalone learning app's address for `path`, even inside a demo shell. */
  standaloneUrlFor(path: string, isLocalHost = false): string {
    return `${resolveStandaloneLearningUrl(isLocalHost)}/${path}`;
  }

  /**
   * Builds the Inbox hand-off URL (`#capture=...`), or `null` when no item has
   * text to capture. The fragment never reaches a server.
   */
  captureHref(
    items: CaptureItem | readonly CaptureItem[],
    options?: { standalone?: boolean; isLocalHost?: boolean },
  ): string | null {
    const list = Array.isArray(items) ? items : [items as CaptureItem];
    if (!list.some((item) => item.text.trim())) return null;
    const inboxUrl = options?.standalone
      ? this.standaloneUrlFor('inbox', options.isLocalHost)
      : this.urlFor('inbox');
    return `${inboxUrl}#${HANDOFF_KEY}=${encodeHandoff(list)}`;
  }

  /**
   * Hands captures to the learning app: an in-app navigation inside the
   * portfolio, a new tab for the standalone engine. The text rides in the
   * fragment, which never reaches a server.
   */
  capture(
    items: CaptureItem | readonly CaptureItem[],
    options?: { standalone?: boolean; isLocalHost?: boolean },
  ): void {
    const url = this.captureHref(items, options);
    if (!url) return;
    if (url.startsWith('/')) {
      void this.router.navigateByUrl(url);
    } else {
      this.window?.open(url, '_blank', 'noopener');
    }
  }

  private read(): LearningTodaySummary | null {
    try {
      return readTodaySummary(
        this.window?.localStorage.getItem(TODAY_SUMMARY_KEY) ?? null,
      );
    } catch {
      return null;
    }
  }
}
