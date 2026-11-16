/**
 * The edge Worker's push routes (apps/learning-edge, design §10): its
 * public key, this device's subscription, a test message, and app state the
 * Worker's cron reads (StudyLM's study reminder). Every call but the key is
 * signed with the app's device token.
 */

export type PushRelayApp = 'learning' | 'studylm';

/** What `PushSubscription.toJSON()` gives, narrowed to what's sent. */
export interface PushSubscriptionData {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}

/** `message` is for the learner, set when `ok` is false. */
export interface RelayOutcome {
  ok: boolean;
  status: number;
  message: string;
}

type Fetch = typeof fetch;

export class PushRelayClient {
  private readonly base: string;

  constructor(
    edgeUrl: string,
    private readonly fetchFn: Fetch = (input, init) => fetch(input, init),
  ) {
    this.base = edgeUrl.replace(/\/+$/, '');
  }

  /** The Worker's VAPID public key; null when push isn't set up there. */
  async publicKey(): Promise<string | null> {
    try {
      const response = await this.fetchFn(`${this.base}/push/key`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (!response.ok) return null;
      const body = (await response.json()) as { publicKey?: unknown };
      return typeof body.publicKey === 'string' ? body.publicKey : null;
    } catch {
      return null;
    }
  }

  register(
    app: PushRelayApp,
    subscription: PushSubscriptionData,
    token: string,
  ): Promise<RelayOutcome> {
    return this.send('PUT', '/push/subscription', { app, subscription }, token);
  }

  unregister(
    app: PushRelayApp,
    endpoint: string,
    token: string,
  ): Promise<RelayOutcome> {
    return this.send('DELETE', '/push/subscription', { app, endpoint }, token);
  }

  test(
    app: PushRelayApp,
    endpoint: string,
    token: string,
  ): Promise<RelayOutcome> {
    return this.send('POST', '/push/test', { app, endpoint }, token);
  }

  /** `PUT <path>` with app state for the cron, e.g. `/studylm/state`. */
  putState(path: string, state: unknown, token: string): Promise<RelayOutcome> {
    return this.send('PUT', path, state, token);
  }

  private async send(
    method: string,
    path: string,
    body: unknown,
    token: string,
  ): Promise<RelayOutcome> {
    try {
      const response = await this.fetchFn(`${this.base}${path}`, {
        method,
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(15_000),
      });
      if (response.ok)
        return { ok: true, status: response.status, message: '' };
      let message = `The server answered ${response.status}.`;
      try {
        const parsed = (await response.json()) as { message?: unknown };
        if (typeof parsed.message === 'string') message = parsed.message;
      } catch {
        // Keep the status line.
      }
      return { ok: false, status: response.status, message };
    } catch {
      return {
        ok: false,
        status: 0,
        message: 'The notification server is out of reach. Try again later.',
      };
    }
  }
}
