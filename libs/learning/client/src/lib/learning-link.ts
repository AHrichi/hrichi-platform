import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  type Provider,
  signal,
} from '@angular/core';
import {
  CONNECT_KEY,
  decodeLink,
  encodeConnect,
  type HostApp,
  type HostCaptureItem,
  type HostItemState,
  type HostRating,
} from '@ah/learning/contracts';
import { LEARNING_APP_URL } from './learning-client';
import {
  type CachedState,
  HostLinkCore,
  type LinkOutcome,
  type LinkStorage,
} from './link-core';

export interface LearningHostConfig {
  app: HostApp;
  /** The engine's API, from the host's site config; null: none. */
  apiUrl: Promise<string | null>;
}

/** Which host app this is; null where nothing declared one (the portfolio). */
export const LEARNING_HOST = new InjectionToken<LearningHostConfig | null>(
  'LEARNING_HOST',
  { providedIn: 'root', factory: () => null },
);

/**
 * Declares a standalone app a host of the Learning Engine (design §9), in
 * its app config. `apiUrl` runs in an injection context, so it can read the
 * app's site config. The portfolio declares none: inside it, host apps run
 * as demos and never link.
 */
export function provideLearningHost(
  app: HostApp,
  apiUrl: () => Promise<string | null>,
): Provider[] {
  return [
    {
      provide: LEARNING_HOST,
      useFactory: (): LearningHostConfig => ({ app, apiUrl: apiUrl() }),
    },
  ];
}

/** Why the last call didn't go through. */
export type LinkProblem = 'offline' | 'failed' | 'ended';

/** Cards and answers wait this long, so a run of answers is one request. */
const FLUSH_DELAY_MS = 2000;

function storageOf(window: Window | null): LinkStorage | null {
  try {
    return window?.localStorage ?? null;
  } catch {
    return null;
  }
}

/**
 * A host app's link to the Learning Engine (design §9): once linked, cards
 * and answers go to the engine through its API, with no tab to open, and
 * the engine's progress comes back for the host's stats. Not linked, the
 * host falls back to the hand-off (`LearningClient.capture`).
 */
@Injectable({ providedIn: 'root' })
export class LearningLink {
  private readonly config = inject(LEARNING_HOST);
  private readonly appUrl = inject(LEARNING_APP_URL);
  private readonly window = inject(DOCUMENT).defaultView;
  private readonly core: HostLinkCore | null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private refreshing: Promise<void> | null = null;

  /** This app can link: a declared host, standalone, in a browser. */
  readonly available: boolean;
  private readonly isLinked = signal(false);
  readonly linked = this.isLinked.asReadonly();
  private readonly cached = signal<CachedState | null>(null);
  /** The engine's progress, as last read (kept across visits). */
  readonly state = computed(() => this.cached()?.state ?? null);
  readonly stateAt = computed(() => this.cached()?.at ?? null);
  /** Cards and answers waiting to be sent. */
  readonly pending = signal(0);
  readonly busy = signal(false);
  readonly problem = signal<LinkProblem | null>(null);
  /** True after the learning app has just sent the link back. */
  readonly justLinked = signal(false);
  /** Bumped when cards are queued, so `isSent` reads again. */
  private readonly sentVersion = signal(0);
  private readonly items = computed(
    () =>
      new Map(
        (this.state()?.items ?? []).map((item) => [
          `${item.objectType}:${item.objectId}`,
          item,
        ]),
      ),
  );

  constructor() {
    const browser = isPlatformBrowser(inject(PLATFORM_ID));
    const config = this.config;
    this.available = browser && !!config && !!this.window;
    this.core =
      this.available && config && this.window
        ? new HostLinkCore({
            app: config.app,
            storage: storageOf(this.window),
            fetch: this.window.fetch.bind(this.window),
            apiUrl: config.apiUrl,
          })
        : null;
    if (!this.core || !this.window) return;

    this.readIncomingLink();
    this.update();
    if (this.isLinked()) this.flushSoon(0);

    const window = this.window;
    const onOnline = () => this.flushSoon(0);
    const onHidden = () => {
      if (window.document.visibilityState === 'hidden') void this.flush();
    };
    window.addEventListener('online', onOnline);
    window.document.addEventListener('visibilitychange', onHidden);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', onOnline);
      window.document.removeEventListener('visibilitychange', onHidden);
      if (this.timer) clearTimeout(this.timer);
    });
  }

  /**
   * Opens the learning app to allow the link; it sends the learner back to
   * `returnTo` (this page by default) with the link in the fragment.
   */
  connect(returnTo?: string): void {
    const app = this.config?.app;
    const here = this.window?.location.href;
    if (!this.available || !app || !here) return;
    const request = encodeConnect({ app, returnTo: returnTo ?? here });
    this.window?.location.assign(
      `${this.appUrl.replace(/\/+$/, '')}/connect#${CONNECT_KEY}=${request}`,
    );
  }

  /** Ends the link here and on the server. Waiting cards stay queued. */
  async disconnect(): Promise<void> {
    if (!this.core) return;
    this.busy.set(true);
    try {
      await this.core.unlink();
    } finally {
      this.busy.set(false);
      this.problem.set(null);
      this.update();
    }
  }

  /**
   * Sends cards to the engine (each once, ever). Returns how many were new;
   * nothing happens while unlinked.
   */
  send(items: readonly HostCaptureItem[]): number {
    if (!this.core || !this.isLinked()) return 0;
    const added = this.core.enqueueCaptures(items);
    if (added) {
      this.sentVersion.update((n) => n + 1);
      this.update();
      this.flushSoon();
    }
    return added;
  }

  /** An answer in the host app; it counts once its card is in the reviews. */
  answer(
    objectType: string,
    objectId: string,
    rating: HostRating,
    ms?: number,
  ): void {
    if (!this.core || !this.isLinked()) return;
    this.core.enqueueAnswer({ objectType, objectId, rating, ms });
    this.update();
    this.flushSoon();
  }

  /** Whether a card was sent (or is waiting to go). */
  isSent(objectType: string, objectId: string): boolean {
    this.sentVersion();
    return this.core?.isSent(objectType, objectId) ?? false;
  }

  /** Where one of this app's cards is in the engine, as last read. */
  itemState(objectType: string, objectId: string): HostItemState | null {
    return this.items().get(`${objectType}:${objectId}`) ?? null;
  }

  /**
   * Sends what waits, then reads the engine's progress. Calls during a
   * read share it, so a screen opening right after linking reads once.
   */
  refresh(): Promise<void> {
    const core = this.core;
    if (!core || !this.isLinked()) return Promise.resolve();
    this.refreshing ??= (async () => {
      this.busy.set(true);
      try {
        this.settle(await core.refresh());
      } finally {
        this.busy.set(false);
        this.refreshing = null;
      }
    })();
    return this.refreshing;
  }

  private async flush(): Promise<void> {
    if (!this.core || !this.isLinked()) return;
    this.settle(await this.core.flush());
  }

  private flushSoon(delay = FLUSH_DELAY_MS): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.flush();
    }, delay);
  }

  private settle(outcome: LinkOutcome): void {
    const wasLinked = this.isLinked();
    this.update();
    if (outcome === 'unlinked') {
      this.problem.set(wasLinked ? 'ended' : null);
    } else if (outcome === 'offline' || outcome === 'failed') {
      this.problem.set(outcome);
    } else {
      this.problem.set(null);
    }
  }

  private update(): void {
    if (!this.core) return;
    this.isLinked.set(!!this.core.link());
    this.cached.set(this.core.cachedState());
    this.pending.set(this.core.pending());
  }

  /** `#learning-link=…`, from the learning app after the learner allowed it. */
  private readIncomingLink(): void {
    const location = this.window?.location;
    const link = location ? decodeLink(location.hash) : null;
    if (!link || !location || !this.core) return;
    this.core.setLink(link);
    this.justLinked.set(true);
    this.window?.history.replaceState(
      this.window.history.state,
      '',
      `${location.pathname}${location.search}`,
    );
    queueMicrotask(() => void this.refresh());
  }
}
