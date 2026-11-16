import { PushRelayClient } from './push-relay';
import {
  type BrowserLike,
  PushError,
  type RegistrationLike,
  type SubscriptionLike,
  WebPushDevice,
} from './web-push-device';

const KEY =
  'BNcRdreALRFXTkOOUHK1EtK2wtaz5Ry4YfYCA_0QTpQtUbVlUls0VJXg7A8u-Ts1XbjhazAkj7I99e8QcYP7DkM';

function subscription(endpoint: string): SubscriptionLike & { gone: boolean } {
  return {
    endpoint,
    gone: false,
    toJSON: () => ({
      endpoint,
      keys: { p256dh: 'p'.repeat(87), auth: 'a'.repeat(22) },
    }),
    async unsubscribe() {
      this.gone = true;
      return true;
    },
  };
}

function fakeBrowser(
  options: {
    permission?: NotificationPermission;
    answer?: NotificationPermission;
    userAgent?: string;
    push?: boolean;
    worker?: boolean;
  } = {},
) {
  const shown: { title: string; options?: NotificationOptions }[] = [];
  let current: ReturnType<typeof subscription> | null = null;
  const registration: RegistrationLike = {
    pushManager: {
      getSubscription: async () => current,
      subscribe: async () => (current = subscription('https://push.test/new')),
    },
    showNotification: async (title, opts) => {
      shown.push({ title, options: opts });
    },
  };
  const Notification = class {
    static permission: NotificationPermission = options.permission ?? 'default';
    static async requestPermission() {
      Notification.permission = options.answer ?? 'granted';
      return Notification.permission;
    }
    onclick: unknown = null;
    constructor(title: string, opts?: NotificationOptions) {
      shown.push({ title, options: opts });
    }
  };
  const browser: BrowserLike = {
    navigator: {
      userAgent: options.userAgent ?? 'Mozilla/5.0 (Linux; Android 14)',
      ...(options.worker === false
        ? {}
        : { serviceWorker: { getRegistration: async () => registration } }),
    },
    Notification,
    ...(options.push === false ? {} : { PushManager: class {} }),
  };
  return {
    browser,
    shown,
    setCurrent: (s: ReturnType<typeof subscription> | null) => (current = s),
    get current() {
      return current;
    },
  };
}

describe('WebPushDevice', () => {
  it('says what this browser can do', () => {
    expect(new WebPushDevice(fakeBrowser().browser).support()).toBe('ready');
    expect(
      new WebPushDevice(fakeBrowser({ worker: false }).browser).support(),
    ).toBe('no-service-worker');
    expect(
      new WebPushDevice(
        fakeBrowser({
          push: false,
          userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)',
        }).browser,
      ).support(),
    ).toBe('install-first');
    expect(
      new WebPushDevice(fakeBrowser({ push: false }).browser).support(),
    ).toBe('unsupported');
    expect(new WebPushDevice(null).support()).toBe('unsupported');
  });

  it('asks for permission, then subscribes with the server key', async () => {
    const fake = fakeBrowser();
    const device = new WebPushDevice(fake.browser);
    const data = await device.subscribe(KEY);
    expect(data.endpoint).toBe('https://push.test/new');
    expect(device.permission()).toBe('granted');
    expect(await device.current()).toEqual(data);
  });

  it('explains a refusal instead of subscribing', async () => {
    const device = new WebPushDevice(fakeBrowser({ answer: 'denied' }).browser);
    await expect(device.subscribe(KEY)).rejects.toThrow(PushError);
    await expect(device.subscribe(KEY)).rejects.toThrow(/blocked/);
  });

  it('unsubscribes and returns the old endpoint', async () => {
    const fake = fakeBrowser({ permission: 'granted' });
    const old = subscription('https://push.test/old');
    fake.setCurrent(old);
    const device = new WebPushDevice(fake.browser);
    expect(await device.unsubscribe()).toBe('https://push.test/old');
    expect(old.gone).toBe(true);
  });

  it('shows local notifications through the service worker, with a tap target', async () => {
    const fake = fakeBrowser({ permission: 'granted' });
    const device = new WebPushDevice(fake.browser);
    expect(
      await device.show({
        title: 'Lesson ready',
        body: 'x',
        url: '/learn/1',
        tag: 't',
      }),
    ).toBe(true);
    expect(fake.shown[0]).toMatchObject({
      title: 'Lesson ready',
      options: {
        tag: 't',
        data: {
          onActionClick: {
            default: {
              operation: 'navigateLastFocusedOrOpen',
              url: '/learn/1',
            },
          },
        },
      },
    });
    const quiet = new WebPushDevice(
      fakeBrowser({ permission: 'default' }).browser,
    );
    expect(
      await quiet.show({ title: 'x', body: 'y', url: '/', tag: 't' }),
    ).toBe(false);
  });
});

describe('PushRelayClient', () => {
  it('sends the token and reports the server’s message', async () => {
    const calls: { url: string; init?: RequestInit }[] = [];
    let status = 204;
    const fetchFn = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      if (url.endsWith('/push/key')) {
        return new Response(JSON.stringify({ publicKey: KEY }), {
          status: 200,
        });
      }
      return status === 204
        ? new Response(null, { status })
        : new Response(
            JSON.stringify({ message: 'This device is not paired.' }),
            {
              status,
            },
          );
    }) as unknown as typeof fetch;
    const relay = new PushRelayClient('https://edge.test/', fetchFn);
    expect(await relay.publicKey()).toBe(KEY);
    const sub = {
      endpoint: 'https://push.test/x',
      keys: { p256dh: 'p', auth: 'a' },
    };
    expect(await relay.register('studylm', sub, 'tok')).toMatchObject({
      ok: true,
    });
    expect(calls[1].url).toBe('https://edge.test/push/subscription');
    expect(calls[1].init?.method).toBe('PUT');
    expect(
      (calls[1].init?.headers as Record<string, string>)['authorization'],
    ).toBe('Bearer tok');
    expect(JSON.parse(String(calls[1].init?.body))).toEqual({
      app: 'studylm',
      subscription: sub,
    });
    status = 401;
    expect(await relay.test('studylm', sub.endpoint, 'tok')).toEqual({
      ok: false,
      status: 401,
      message: 'This device is not paired.',
    });
  });
});
