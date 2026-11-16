import { inject, Injectable, signal } from '@angular/core';
import {
  PushRelayClient,
  type PushTarget,
  WebPush,
} from '@ah/platform/web-push';
import { SiteConfigService } from '@ah/shared/site-config';
import { LearningRuntime } from './learning-runtime';

/** Why this device can't turn push on, when it can't. */
export type PushBlocker = 'demo' | 'no-edge' | 'unpaired' | null;

/**
 * Push notifications for the Daily Set nudges and the Sunday recap (design
 * §10). The edge Worker sends them alongside Telegram; this device only
 * subscribes, which needs a paired device (its token) and the Worker.
 */
@Injectable({ providedIn: 'root' })
export class LearningNotifications {
  private readonly runtime = inject(LearningRuntime);
  private readonly siteConfig = inject(SiteConfigService);
  readonly push = inject(WebPush);
  readonly blocker = signal<PushBlocker>(null);
  private resynced = false;

  /** Reads this device's state; registers it again once per visit. */
  async refresh(): Promise<void> {
    await this.push.refresh();
    const target = await this.target();
    if (target && !this.resynced) {
      this.resynced = true;
      await this.push.resync(target);
    }
  }

  async enable(): Promise<void> {
    const target = await this.target();
    if (target) await this.push.enable(target);
  }

  async disable(): Promise<void> {
    const target = await this.target();
    if (target) await this.push.disable(target);
  }

  async test(): Promise<void> {
    const target = await this.target();
    if (target) await this.push.test(target);
  }

  private async target(): Promise<PushTarget | null> {
    try {
      const { local, unavailable } = await this.runtime.open();
      if (unavailable === 'demo') {
        this.blocker.set('demo');
        return null;
      }
      const { learningEdgeUrl } = await this.siteConfig.load();
      if (!learningEdgeUrl) {
        this.blocker.set('no-edge');
        return null;
      }
      const session = await local.session();
      if (!session) {
        this.blocker.set('unpaired');
        return null;
      }
      this.blocker.set(null);
      return {
        app: 'learning',
        relay: new PushRelayClient(learningEdgeUrl),
        token: session.token,
      };
    } catch {
      this.blocker.set('demo');
      return null;
    }
  }
}
