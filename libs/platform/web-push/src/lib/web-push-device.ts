import type { PushSubscriptionData } from './push-relay';

/**
 * What this browser can do with notifications.
 * - `ready`: push works here.
 * - `install-first`: iPhone and iPad only deliver push to an app added to
 *   the Home Screen.
 * - `no-service-worker`: this build or page has no service worker (a
 *   development build, or the app inside the portfolio).
 * - `unsupported`: no Push API at all.
 */
export type PushSupport =
  'ready' | 'install-first' | 'no-service-worker' | 'unsupported';

export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

/** A notification, shown by the page or by the Worker's push. */
export interface LocalNotification {
  title: string;
  body: string;
  /** Path inside the app, opened on a tap. */
  url: string;
  tag: string;
}

/** The browser APIs this class uses, injectable for tests. */
export interface BrowserLike {
  navigator: {
    serviceWorker?: {
      getRegistration(): Promise<RegistrationLike | undefined>;
    };
    userAgent: string;
    maxTouchPoints?: number;
    standalone?: boolean;
  };
  Notification?: {
    permission: NotificationPermission;
    requestPermission(): Promise<NotificationPermission>;
    new (title: string, options?: NotificationOptions): { onclick: unknown };
  };
  PushManager?: unknown;
  matchMedia?(query: string): { matches: boolean };
  focus?(): void;
}

export interface RegistrationLike {
  pushManager: {
    getSubscription(): Promise<SubscriptionLike | null>;
    subscribe(options: {
      userVisibleOnly: boolean;
      applicationServerKey: Uint8Array<ArrayBuffer>;
    }): Promise<SubscriptionLike>;
  };
  showNotification(title: string, options?: NotificationOptions): Promise<void>;
}

export interface SubscriptionLike {
  endpoint: string;
  toJSON(): { endpoint?: string; keys?: Record<string, string> };
  unsubscribe(): Promise<boolean>;
  options?: { applicationServerKey?: ArrayBuffer | null };
}

export class PushError extends Error {}

function keyBytes(base64Url: string): Uint8Array<ArrayBuffer> {
  const base64 = base64Url.replaceAll('-', '+').replaceAll('_', '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function sameKey(a: ArrayBuffer | null | undefined, b: Uint8Array): boolean {
  if (!a) return true; // The browser doesn't say: assume it matches.
  const left = new Uint8Array(a);
  return left.length === b.length && left.every((byte, i) => byte === b[i]);
}

/**
 * Notifications on this device: permission, the push subscription, and
 * notifications the page shows itself. Both apps are built with the
 * Angular service worker, which shows push messages and opens the app at
 * the notification's `data.onActionClick` URL; local ones use the same
 * format, so a tap behaves the same.
 */
export class WebPushDevice {
  constructor(private readonly browser: BrowserLike | null) {}

  support(): PushSupport {
    const b = this.browser;
    if (!b?.Notification)
      return this.isAppleMobile() ? 'install-first' : 'unsupported';
    if (!b.PushManager) {
      return this.isAppleMobile() ? 'install-first' : 'unsupported';
    }
    if (!b.navigator.serviceWorker) return 'no-service-worker';
    return 'ready';
  }

  permission(): PushPermission {
    return this.browser?.Notification?.permission ?? 'unsupported';
  }

  /** Whether the app runs installed (Home Screen, standalone window). */
  installed(): boolean {
    const b = this.browser;
    return (
      !!b?.navigator.standalone ||
      !!b?.matchMedia?.('(display-mode: standalone)').matches
    );
  }

  private isAppleMobile(): boolean {
    const nav = this.browser?.navigator;
    if (!nav) return false;
    return (
      /iPhone|iPad|iPod/.test(nav.userAgent) ||
      // iPadOS says it's a Mac.
      (/Macintosh/.test(nav.userAgent) && (nav.maxTouchPoints ?? 0) > 1)
    );
  }

  /** The service worker, when one controls this page within a few seconds. */
  async registration(): Promise<RegistrationLike | null> {
    const container = this.browser?.navigator.serviceWorker;
    if (!container) return null;
    const found = await Promise.race([
      container.getRegistration().catch(() => undefined),
      new Promise<undefined>((resolve) => setTimeout(resolve, 4000)),
    ]);
    return found ?? null;
  }

  /** This device's subscription, if it has one. */
  async current(): Promise<PushSubscriptionData | null> {
    const registration = await this.registration();
    const subscription = await registration?.pushManager
      .getSubscription()
      .catch(() => null);
    return subscription ? this.toData(subscription) : null;
  }

  /**
   * Asks for permission when needed and subscribes with the server's key.
   * Throws a `PushError` with a message for the learner.
   */
  async subscribe(publicKey: string): Promise<PushSubscriptionData> {
    const notification = this.browser?.Notification;
    if (!notification || this.support() !== 'ready') {
      throw new PushError('This browser can’t receive notifications.');
    }
    let permission = notification.permission;
    if (permission === 'default') {
      permission = await notification.requestPermission();
    }
    if (permission !== 'granted') {
      throw new PushError(
        permission === 'denied'
          ? 'Notifications are blocked for this site. Allow them in the browser’s site settings, then try again.'
          : 'Notifications weren’t allowed.',
      );
    }
    const registration = await this.registration();
    if (!registration) {
      throw new PushError(
        'The app’s offline worker isn’t running yet. Reload the page and try again.',
      );
    }
    const key = keyBytes(publicKey);
    const existing = await registration.pushManager.getSubscription();
    if (existing && sameKey(existing.options?.applicationServerKey, key)) {
      return this.toData(existing);
    }
    // A subscription made for another key can't be reused.
    await existing?.unsubscribe().catch(() => false);
    try {
      return this.toData(
        await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: key,
        }),
      );
    } catch {
      throw new PushError(
        'The browser’s push service didn’t answer. Check the connection and try again.',
      );
    }
  }

  /** Ends this device's subscription; returns its endpoint, if it had one. */
  async unsubscribe(): Promise<string | null> {
    const registration = await this.registration();
    const existing = await registration?.pushManager
      .getSubscription()
      .catch(() => null);
    if (!existing) return null;
    await existing.unsubscribe().catch(() => false);
    return existing.endpoint;
  }

  /**
   * Shows a notification from the page (for work that finished while the
   * app was in the background). Android allows only the service worker's
   * `showNotification`; elsewhere a plain `Notification` is the fallback.
   */
  async show(message: LocalNotification): Promise<boolean> {
    if (this.permission() !== 'granted') return false;
    const options: NotificationOptions = {
      body: message.body,
      tag: message.tag,
      icon: 'icons/icon-192x192.png',
      badge: 'icons/icon-192x192.png',
      data: {
        url: message.url,
        onActionClick: {
          default: { operation: 'navigateLastFocusedOrOpen', url: message.url },
        },
      },
    };
    const registration = await this.registration();
    if (registration) {
      try {
        await registration.showNotification(message.title, options);
        return true;
      } catch {
        // Fall back to a page notification.
      }
    }
    const Ctor = this.browser?.Notification;
    if (!Ctor) return false;
    try {
      const shown = new Ctor(message.title, options);
      shown.onclick = () => this.browser?.focus?.();
      return true;
    } catch {
      return false;
    }
  }

  private toData(subscription: SubscriptionLike): PushSubscriptionData {
    const json = subscription.toJSON();
    const p256dh = json.keys?.['p256dh'];
    const auth = json.keys?.['auth'];
    if (!p256dh || !auth) {
      throw new PushError('The browser returned an incomplete subscription.');
    }
    return {
      endpoint: json.endpoint ?? subscription.endpoint,
      keys: { p256dh, auth },
    };
  }
}
