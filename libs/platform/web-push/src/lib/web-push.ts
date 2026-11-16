import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  inject,
  Injectable,
  PLATFORM_ID,
  signal,
} from '@angular/core';
import type { PushRelayApp, PushRelayClient } from './push-relay';
import {
  type BrowserLike,
  type LocalNotification,
  type PushPermission,
  PushError,
  type PushSupport,
  WebPushDevice,
} from './web-push-device';

/** What `enable`, `disable` and `test` need from the app. */
export interface PushTarget {
  app: PushRelayApp;
  relay: PushRelayClient;
  token: string;
}

/**
 * Notifications on this device, as signals for the settings screens.
 * Push goes through the edge Worker (`PushRelayClient`); local
 * notifications need only the permission.
 */
@Injectable({ providedIn: 'root' })
export class WebPush {
  private readonly device = new WebPushDevice(
    isPlatformBrowser(inject(PLATFORM_ID))
      ? (globalThis as unknown as BrowserLike)
      : null,
  );

  readonly support = signal<PushSupport>(this.device.support());
  readonly permission = signal<PushPermission>(this.device.permission());
  /** This device's push endpoint, when subscribed. */
  readonly endpoint = signal<string | null>(null);
  readonly subscribed = computed(() => !!this.endpoint());
  readonly busy = signal(false);
  /** The last problem, in words for the learner. */
  readonly problem = signal<string | null>(null);
  /** The last good news ("Test sent"). */
  readonly info = signal<string | null>(null);
  readonly installed = this.device.installed();

  /** Reads the permission and subscription again. */
  async refresh(): Promise<void> {
    this.support.set(this.device.support());
    this.permission.set(this.device.permission());
    this.endpoint.set((await this.device.current())?.endpoint ?? null);
  }

  /**
   * Keeps the Worker in step with this device: when the browser still has
   * a subscription, register it again (cheap, and it heals a cleared KV).
   */
  async resync(target: PushTarget): Promise<void> {
    const current = await this.device.current();
    this.endpoint.set(current?.endpoint ?? null);
    if (current) await target.relay.register(target.app, current, target.token);
  }

  async enable(target: PushTarget): Promise<boolean> {
    return this.run(async () => {
      const key = await target.relay.publicKey();
      if (!key) {
        throw new PushError(
          'Notifications aren’t set up on the server yet. Try again later.',
        );
      }
      const subscription = await this.device.subscribe(key);
      this.permission.set(this.device.permission());
      const outcome = await target.relay.register(
        target.app,
        subscription,
        target.token,
      );
      if (!outcome.ok) {
        await this.device.unsubscribe();
        throw new PushError(outcome.message);
      }
      this.endpoint.set(subscription.endpoint);
      this.info.set('Notifications are on for this device.');
    });
  }

  async disable(target: PushTarget): Promise<boolean> {
    return this.run(async () => {
      const endpoint = await this.device.unsubscribe();
      this.endpoint.set(null);
      // Best effort: the Worker also forgets it on the next failed send.
      if (endpoint) {
        await target.relay.unregister(target.app, endpoint, target.token);
      }
      this.info.set('Notifications are off for this device.');
    });
  }

  async test(target: PushTarget): Promise<boolean> {
    return this.run(async () => {
      const endpoint = this.endpoint();
      if (!endpoint) throw new PushError('Turn notifications on first.');
      const outcome = await target.relay.test(
        target.app,
        endpoint,
        target.token,
      );
      if (!outcome.ok) throw new PushError(outcome.message);
      this.info.set('Test sent. It should arrive in a few seconds.');
    });
  }

  /** Permission for notifications the page shows itself. */
  async allowLocal(): Promise<boolean> {
    const Ctor = (globalThis as unknown as BrowserLike).Notification;
    if (!Ctor) return false;
    const result =
      Ctor.permission === 'default'
        ? await Ctor.requestPermission()
        : Ctor.permission;
    this.permission.set(result);
    return result === 'granted';
  }

  /** Shows a notification from the page; false when it can't. */
  notify(message: LocalNotification): Promise<boolean> {
    return this.device.show(message);
  }

  private async run(work: () => Promise<void>): Promise<boolean> {
    this.busy.set(true);
    this.problem.set(null);
    this.info.set(null);
    try {
      await work();
      return true;
    } catch (error) {
      this.problem.set(
        error instanceof PushError
          ? error.message
          : 'Something went wrong. Try again.',
      );
      return false;
    } finally {
      this.permission.set(this.device.permission());
      this.busy.set(false);
    }
  }
}
