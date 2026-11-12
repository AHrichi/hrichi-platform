import {
  HOST_LIMITS,
  type HostAnswer,
  type HostApp,
  type HostCaptureItem,
  type HostLink,
  type HostState,
  parseLink,
} from '@ah/learning/contracts';

/** The part of `Storage` the link uses (localStorage in the browser). */
export interface LinkStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface LinkCoreDeps {
  app: HostApp;
  storage: LinkStorage | null;
  fetch: typeof fetch;
  /** The engine's API, from the host's site config; null: none. */
  apiUrl: Promise<string | null>;
  now?: () => Date;
  timeZone?: () => string;
  newId?: () => string;
}

interface Outbox {
  captures: HostCaptureItem[];
  answers: HostAnswer[];
}

export interface CachedState {
  state: HostState;
  /** When it was read. */
  at: string;
}

/**
 * What a flush or a read came to: `unlinked` means the API refused the
 * link (revoked or expired), so it is forgotten; `offline` and `failed`
 * keep everything for the next try.
 */
export type LinkOutcome = 'done' | 'idle' | 'unlinked' | 'offline' | 'failed';

/** Outbox caps: the oldest go first, a host never fills the storage. */
const MAX_CAPTURES = 200;
const MAX_ANSWERS = 500;
/** Cards already sent, so a lesson opened again isn't sent again. */
const MAX_SENT = 3000;
/** A cold Render instance takes about a minute to wake. */
const TIMEOUT_MS = 90_000;

function keyOf(item: { objectType: string; objectId: string }): string {
  return `${item.objectType}:${item.objectId}`;
}

function chunks<T>(list: readonly T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < list.length; i += size) out.push(list.slice(i, i + size));
  return out;
}

/**
 * A host app's link to the Learning Engine, without Angular (design §9):
 * the link itself, an outbox of cards and answers that survives reloads,
 * offline and a sleeping server, and the last progress read. Everything
 * lives in the host's localStorage, under keys named for the app.
 */
export class HostLinkCore {
  private readonly now: () => Date;
  private readonly timeZone: () => string;
  private readonly newId: () => string;
  private flushing: Promise<LinkOutcome> | null = null;

  constructor(private readonly deps: LinkCoreDeps) {
    this.now = deps.now ?? (() => new Date());
    this.timeZone =
      deps.timeZone ??
      (() => Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
    this.newId = deps.newId ?? (() => crypto.randomUUID());
  }

  private key(name: string): string {
    return `ah.learning.${this.deps.app}.${name}`;
  }

  private read<T>(name: string, fallback: T): T {
    try {
      const raw = this.deps.storage?.getItem(this.key(name));
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private write(name: string, value: unknown): void {
    try {
      this.deps.storage?.setItem(this.key(name), JSON.stringify(value));
    } catch {
      // Storage full or blocked: the link works for this visit only.
    }
  }

  private remove(name: string): void {
    try {
      this.deps.storage?.removeItem(this.key(name));
    } catch {
      // Nothing to clean.
    }
  }

  link(): HostLink | null {
    try {
      return parseLink(this.deps.storage?.getItem(this.key('link')) ?? null);
    } catch {
      return null;
    }
  }

  setLink(link: HostLink): void {
    this.write('link', link);
  }

  /** Forgets the link and the last progress; the outbox waits for a new link. */
  forget(): void {
    this.remove('link');
    this.remove('state');
  }

  cachedState(): CachedState | null {
    return this.read<CachedState | null>('state', null);
  }

  pending(): number {
    const outbox = this.outbox();
    return outbox.captures.length + outbox.answers.length;
  }

  isSent(objectType: string, objectId: string): boolean {
    const key = keyOf({ objectType, objectId });
    return (
      this.read<string[]>('sent', []).includes(key) ||
      this.outbox().captures.some((item) => keyOf(item.source) === key)
    );
  }

  /** Queues cards not sent before; returns how many were new. */
  enqueueCaptures(items: readonly HostCaptureItem[]): number {
    const sent = new Set(this.read<string[]>('sent', []));
    const outbox = this.outbox();
    const queued = new Set(outbox.captures.map((item) => keyOf(item.source)));
    let added = 0;
    for (const item of items) {
      const key = keyOf(item.source);
      if (!item.text.trim() || sent.has(key) || queued.has(key)) continue;
      queued.add(key);
      outbox.captures.push({
        text: item.text.trim().slice(0, 4000),
        source: { ...item.source, app: this.deps.app },
      });
      added += 1;
    }
    outbox.captures = outbox.captures.slice(-MAX_CAPTURES);
    this.write('outbox', outbox);
    return added;
  }

  enqueueAnswer(answer: {
    objectType: string;
    objectId: string;
    rating: HostAnswer['rating'];
    ms?: number;
  }): void {
    const outbox = this.outbox();
    outbox.answers.push({
      id: this.newId(),
      objectType: answer.objectType,
      objectId: answer.objectId,
      rating: answer.rating,
      at: this.now().toISOString(),
      ms: Math.min(3_600_000, Math.max(0, Math.round(answer.ms ?? 0))),
    });
    outbox.answers = outbox.answers.slice(-MAX_ANSWERS);
    this.write('outbox', outbox);
  }

  /** Sends the outbox: cards first, so a card's answers find it later. */
  flush(): Promise<LinkOutcome> {
    this.flushing ??= this.run().finally(() => {
      this.flushing = null;
    });
    return this.flushing;
  }

  /** The engine's progress for this host, after sending the outbox. */
  async refresh(): Promise<LinkOutcome> {
    const flushed = await this.flush();
    if (flushed === 'unlinked') return flushed;
    const response = await this.call(
      'GET',
      `/learning/host/state?timeZone=${encodeURIComponent(this.timeZone())}`,
    );
    if (typeof response === 'string') return response;
    if (!response.ok) return 'failed';
    const state = (await response.json()) as HostState;
    if (state.renewedToken) this.setLink(state.renewedToken);
    this.write('state', { state, at: this.now().toISOString() });
    return 'done';
  }

  /** "Disconnect": ends the link on the server too, when it can. */
  async unlink(): Promise<void> {
    await this.call('DELETE', '/learning/host').catch(() => undefined);
    this.forget();
  }

  private outbox(): Outbox {
    const outbox = this.read<Partial<Outbox>>('outbox', {});
    return {
      captures: Array.isArray(outbox.captures) ? outbox.captures : [],
      answers: Array.isArray(outbox.answers) ? outbox.answers : [],
    };
  }

  private async run(): Promise<LinkOutcome> {
    const start = this.outbox();
    if (!start.captures.length && !start.answers.length) return 'idle';

    for (const batch of chunks(start.captures, HOST_LIMITS.captures)) {
      const response = await this.call('POST', '/learning/host/captures', {
        items: batch,
      });
      if (response === 'unlinked' || response === 'offline') return response;
      if (response === 'failed') return 'failed';
      // Sent (or refused as malformed, which retrying won't fix).
      const done = new Set(batch.map((item) => keyOf(item.source)));
      if (response.ok) {
        const sent = [...this.read<string[]>('sent', []), ...done];
        this.write('sent', [...new Set(sent)].slice(-MAX_SENT));
      }
      const outbox = this.outbox();
      outbox.captures = outbox.captures.filter(
        (item) => !done.has(keyOf(item.source)),
      );
      this.write('outbox', outbox);
    }

    for (const batch of chunks(start.answers, HOST_LIMITS.answers)) {
      const response = await this.call('POST', '/learning/host/answers', {
        timeZone: this.timeZone(),
        answers: batch,
      });
      if (response === 'unlinked' || response === 'offline') return response;
      if (response === 'failed') return 'failed';
      const done = new Set(batch.map((answer) => answer.id));
      const outbox = this.outbox();
      outbox.answers = outbox.answers.filter((answer) => !done.has(answer.id));
      this.write('outbox', outbox);
    }
    return 'done';
  }

  /**
   * One API call with the link. A 400 comes back as the response (the
   * caller drops what can never succeed); 401 forgets the link; a network
   * error or a 5xx keeps everything for later.
   */
  private async call(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: unknown,
  ): Promise<Response | Exclude<LinkOutcome, 'done' | 'idle'>> {
    const link = this.link();
    const apiUrl = await this.deps.apiUrl;
    if (!link || !apiUrl) return 'unlinked';
    let response: Response;
    try {
      response = await this.deps.fetch(`${apiUrl.replace(/\/+$/, '')}${path}`, {
        method,
        headers: {
          authorization: `Bearer ${link.token}`,
          ...(body ? { 'content-type': 'application/json' } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      return 'offline';
    }
    if (response.status === 401) {
      this.forget();
      return 'unlinked';
    }
    if (response.ok || response.status === 400) return response;
    return 'failed';
  }
}
