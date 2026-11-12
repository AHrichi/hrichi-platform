import type { HostCaptureItem, HostState } from '@ah/learning/contracts';
import { HostLinkCore, type LinkStorage } from './link-core';

class MemoryStorage implements LinkStorage {
  readonly data = new Map<string, string>();
  getItem(key: string): string | null {
    return this.data.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.data.set(key, value);
  }
  removeItem(key: string): void {
    this.data.delete(key);
  }
}

const link = {
  token: `v1.0b6f0c30-0000-4000-8000-00000000000b.1800000000.${'a'.repeat(43)}`,
  expiresAt: '2027-05-11T00:00:00.000Z',
};
const card = (objectId: string): HostCaptureItem => ({
  text: `Card ${objectId}`,
  source: {
    app: 'studylm',
    objectType: 'lesson-card',
    objectId,
    deepLink: null,
    excerpt: null,
  },
});

interface Call {
  method: string;
  url: string;
  body: Record<string, unknown> | null;
  auth: string | null;
}

function setup(reply: (call: Call) => Response | Promise<Response>) {
  const storage = new MemoryStorage();
  const calls: Call[] = [];
  let ids = 0;
  const core = new HostLinkCore({
    app: 'studylm',
    storage,
    apiUrl: Promise.resolve('https://api.example/'),
    now: () => new Date('2026-11-12T09:00:00.000Z'),
    timeZone: () => 'Europe/Paris',
    newId: () => `id-${++ids}`,
    fetch: (async (url: string, init: RequestInit) => {
      const call: Call = {
        method: init.method ?? 'GET',
        url,
        body: init.body ? JSON.parse(String(init.body)) : null,
        auth: (init.headers as Record<string, string>)['authorization'] ?? null,
      };
      calls.push(call);
      return reply(call);
    }) as typeof fetch,
  });
  return { core, storage, calls };
}

const ok = (body: unknown = {}) =>
  new Response(JSON.stringify(body), { status: 200 });

describe('HostLinkCore', () => {
  it('does nothing until linked, then sends cards before answers', async () => {
    const { core, calls } = setup(() => ok());
    core.enqueueCaptures([card('a')]);
    core.enqueueAnswer({
      objectType: 'lesson-card',
      objectId: 'a',
      rating: 'good',
    });
    expect(await core.flush()).toBe('unlinked');
    expect(calls).toHaveLength(0);
    expect(core.pending()).toBe(2);

    core.setLink(link);
    expect(await core.flush()).toBe('done');
    expect(calls.map((c) => `${c.method} ${c.url}`)).toEqual([
      'POST https://api.example/learning/host/captures',
      'POST https://api.example/learning/host/answers',
    ]);
    expect(calls[0].auth).toBe(`Bearer ${link.token}`);
    expect(calls[1].body).toEqual({
      timeZone: 'Europe/Paris',
      answers: [
        {
          id: 'id-1',
          objectType: 'lesson-card',
          objectId: 'a',
          rating: 'good',
          at: '2026-11-12T09:00:00.000Z',
          ms: 0,
        },
      ],
    });
    expect(core.pending()).toBe(0);
    expect(await core.flush()).toBe('idle');
  });

  it('sends a card once, ever, and as this app', async () => {
    const { core, calls } = setup(() => ok());
    core.setLink(link);
    expect(core.enqueueCaptures([card('a'), card('a')])).toBe(1);
    expect(core.isSent('lesson-card', 'a')).toBe(true);
    await core.flush();
    expect(core.enqueueCaptures([card('a'), card('b')])).toBe(1);
    await core.flush();
    expect(
      calls.map((c) =>
        (c.body?.['items'] as HostCaptureItem[]).map((i) => i.source.objectId),
      ),
    ).toEqual([['a'], ['b']]);
    expect((calls[0].body?.['items'] as HostCaptureItem[])[0].source.app).toBe(
      'studylm',
    );
  });

  it('keeps everything while offline or the server fails, and drops what it refuses', async () => {
    let mode: 'offline' | 'down' | 'refuse' = 'offline';
    const { core } = setup(() => {
      if (mode === 'offline') throw new TypeError('Failed to fetch');
      return new Response('{}', { status: mode === 'down' ? 503 : 400 });
    });
    core.setLink(link);
    core.enqueueCaptures([card('a')]);
    expect(await core.flush()).toBe('offline');
    mode = 'down';
    expect(await core.flush()).toBe('failed');
    expect(core.pending()).toBe(1);
    mode = 'refuse';
    expect(await core.flush()).toBe('done');
    expect(core.pending()).toBe(0);
    // A refused card isn't "sent": it can be tried again later.
    expect(core.isSent('lesson-card', 'a')).toBe(false);
  });

  it('forgets an ended link, keeping the outbox for the next one', async () => {
    const { core } = setup(() => new Response('{}', { status: 401 }));
    core.setLink(link);
    core.enqueueCaptures([card('a')]);
    expect(await core.flush()).toBe('unlinked');
    expect(core.link()).toBeNull();
    expect(core.pending()).toBe(1);
  });

  it('reads progress, keeps it, and takes a renewed link', async () => {
    const renewed = { ...link, expiresAt: '2027-11-11T00:00:00.000Z' };
    const state = {
      localDate: '2026-11-12',
      renewedToken: renewed,
    } as HostState;
    const { core, calls } = setup(() => ok(state));
    core.setLink(link);
    expect(await core.refresh()).toBe('done');
    expect(calls[0].url).toBe(
      'https://api.example/learning/host/state?timeZone=Europe%2FParis',
    );
    expect(core.cachedState()?.state.localDate).toBe('2026-11-12');
    expect(core.link()).toEqual(renewed);
  });

  it('unlinks on the server and here', async () => {
    const { core, calls } = setup(() => new Response(null, { status: 204 }));
    core.setLink(link);
    await core.unlink();
    expect(calls[0].method).toBe('DELETE');
    expect(core.link()).toBeNull();
  });
});
