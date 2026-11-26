import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  type Provider,
  signal,
} from '@angular/core';
import {
  incomingWins,
  recordId,
  type StoredRecord,
  SYNC_LIMITS,
  type SyncDevices,
  type SyncDone,
  type SyncFailure,
  type SyncJoined,
  type SyncPairing,
  type SyncResult,
  type SyncUsage,
} from '@ah/shared/sync';
import {
  readSyncState,
  SYNC_SETUP,
  syncStateKey,
  type SyncProblem,
  type SyncSetup,
  type SyncState,
  type SyncStatus,
  writeSyncState,
} from './sync.model';
import {
  type SyncNoAnswer,
  SYNC_TRANSPORT,
  type SyncReply,
} from './sync-transport';

/** Rounds one sync may take before it waits for the next trigger. */
const MAX_ROUNDS = 20;
/** After a change, wait this long for more before syncing. */
const CHANGE_DELAY_MS = 1500;
/** While the page is in view, sync this often anyway. */
const EVERY_MS = 5 * 60_000;
const FIRST_RETRY_MS = 30_000;
const MAX_RETRY_MS = 15 * 60_000;

/**
 * An app's opt-in cloud sync (ADR-0032), on one device. The app keeps its
 * data and an outbox of changes; this pushes the outbox, pulls what other
 * devices changed, and keeps the device's place in its space.
 *
 * - **When:** shortly after a change, when the connection comes back, when
 *   the page comes back into view, every five minutes while in view.
 * - **One tab at a time** (Web Locks); the others reload what was pulled
 *   (BroadcastChannel).
 * - **Conflicts:** the later edit wins, here as on the server. A pulled
 *   record older than an edit still in the outbox waits; a newer one
 *   replaces the edit.
 * - **Failures** wait and retry, longer each time, as long as the server
 *   asks; a device removed elsewhere stops syncing and keeps its data.
 */
@Injectable()
export class SyncEngine {
  private readonly setup: SyncSetup = inject(SYNC_SETUP);
  private readonly transport = inject(SYNC_TRANSPORT);
  private readonly app = this.setup.app;
  private readonly key = this.setup.stateKey ?? syncStateKey(this.app);

  private readonly state = signal<SyncState | null>(readSyncState(this.key));
  readonly on = computed(() => this.state() !== null);
  readonly deviceId = computed(() => this.state()?.deviceId ?? null);
  readonly lastSyncAt = computed(() => this.state()?.lastSyncAt ?? null);
  readonly status = signal<SyncStatus>(this.state() ? 'syncing' : 'off');
  readonly problem = signal<SyncProblem | null>(null);
  readonly usage = signal<SyncUsage | null>(null);

  private running: Promise<void> | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private retryMs = 0;
  /** This device's other tabs: they share its state, so its key. */
  private readonly channel =
    typeof BroadcastChannel === 'function'
      ? new BroadcastChannel(`ah-sync:${this.key}`)
      : null;

  constructor() {
    if (typeof window === 'undefined') return;
    const soon = () => this.syncSoon(0);
    const onOffline = () => {
      if (this.on()) this.status.set('offline');
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') soon();
    };
    const onStorage = (event: StorageEvent) => {
      if (event.key === this.key) this.reload();
    };
    window.addEventListener('online', soon);
    window.addEventListener('offline', onOffline);
    document.addEventListener('visibilitychange', onVisible);
    window.addEventListener('storage', onStorage);
    if (this.channel) {
      this.channel.onmessage = (event: MessageEvent) => {
        if (event.data === 'pulled') this.setup.onPulled?.();
        if (event.data === 'state') this.reload();
      };
    }
    const every = setInterval(() => {
      if (document.visibilityState === 'visible') soon();
    }, EVERY_MS);
    if (this.on()) this.syncSoon(500);
    inject(DestroyRef).onDestroy(() => {
      window.removeEventListener('online', soon);
      window.removeEventListener('offline', onOffline);
      document.removeEventListener('visibilitychange', onVisible);
      window.removeEventListener('storage', onStorage);
      clearInterval(every);
      if (this.timer) clearTimeout(this.timer);
      this.channel?.close();
    });
  }

  /** The app changed something: sync once the edits settle. */
  changed(): void {
    if (this.on()) this.syncSoon(CHANGE_DELAY_MS);
  }

  /** Starts a space with this device in it, and sends everything here. */
  async turnOn(deviceName: string): Promise<SyncReply<SyncJoined>> {
    const reply = await this.transport.call<SyncJoined>('POST', '/v1/spaces', {
      body: { v: 1, app: this.app, deviceName },
    });
    if (reply.ok) await this.begin(reply);
    return reply;
  }

  /** Joins a space with a code from a device already in it. */
  async join(code: string, deviceName: string): Promise<SyncReply<SyncJoined>> {
    const reply = await this.transport.call<SyncJoined>(
      'POST',
      '/v1/pairings/claim',
      { body: { v: 1, app: this.app, code, deviceName } },
    );
    if (reply.ok) await this.begin(reply);
    return reply;
  }

  /** A code for another device to join with (ten minutes, once). */
  linkCode(): Promise<SyncReply<SyncPairing>> {
    return this.authed<SyncPairing>('POST', '/v1/pairings');
  }

  devices(): Promise<SyncReply<SyncDevices>> {
    return this.authed<SyncDevices>('GET', '/v1/devices');
  }

  /** Unlinks a device; this one too, which turns sync off here. */
  async removeDevice(id: string): Promise<SyncReply<SyncDone>> {
    const reply = await this.authed<SyncDone>('DELETE', `/v1/devices/${id}`);
    if (reply.ok && id === this.deviceId()) await this.end('off');
    else if (!reply.ok) this.handleAuth(reply);
    return reply;
  }

  /**
   * Stops syncing on this device: unlinks it (if the server is reachable)
   * and forgets the space. The data here stays.
   */
  async turnOffHere(): Promise<void> {
    const state = this.state();
    if (!state) return;
    await this.transport.call('DELETE', `/v1/devices/${state.deviceId}`, {
      token: state.token,
    });
    await this.end('off');
  }

  /** Deletes the copy in the cloud; every device keeps its own data. */
  async deleteCloudCopy(): Promise<SyncReply<SyncDone>> {
    const reply = await this.authed<SyncDone>('DELETE', '/v1/spaces/current');
    if (reply.ok) await this.end('off');
    else this.handleAuth(reply);
    return reply;
  }

  /** Syncs now (or joins the sync already running). */
  syncNow(): Promise<void> {
    if (!this.state()) return Promise.resolve();
    this.running ??= this.oneTabAtATime(() => this.rounds()).finally(() => {
      this.running = null;
    });
    return this.running;
  }

  private syncSoon(delayMs: number): void {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      void this.syncNow();
    }, delayMs);
  }

  private async oneTabAtATime(run: () => Promise<void>): Promise<void> {
    const locks =
      typeof navigator !== 'undefined' ? navigator.locks : undefined;
    if (!locks?.request) return run();
    await locks.request(
      `ah-sync:${this.key}`,
      { ifAvailable: true },
      async (lock) => {
        // Another tab is syncing: it tells this one what it pulls.
        if (lock) await run();
      },
    );
  }

  private async rounds(): Promise<void> {
    this.status.set('syncing');
    let problem: SyncProblem | null = null;
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const state = this.state();
      if (!state) return;
      const outbox = await this.setup.local.outbox();
      const push = outbox.slice(0, SYNC_LIMITS.pushRecords);
      const reply = await this.transport.call<SyncResult>('POST', '/v1/sync', {
        token: state.token,
        body: { v: 1, cursor: state.cursor, push },
      });
      if (!reply.ok) {
        this.failed(reply);
        return;
      }

      // A record the server won't take is dropped, unless this device's
      // clock is the cause: then it waits until the clock is put right.
      const waits = new Set(
        reply.rejected
          .filter((r) => r.reason === 'clock_ahead')
          .map((r) => recordId(r)),
      );
      for (const { reason } of reply.rejected) {
        if (reason === 'clock_ahead') problem = 'clock';
        else if (reason === 'quota') problem ??= 'full';
        else if (reason === 'too_large') problem ??= 'too_large';
      }
      const sent = push.filter((r) => !waits.has(recordId(r)));
      await this.setup.local.acknowledge(sent);

      await this.receive(reply.pull, state.deviceId);
      this.save({
        ...state,
        token: reply.token ?? state.token,
        cursor: reply.cursor,
        lastSyncAt: new Date().toISOString(),
      });
      this.usage.set(reply.usage);
      const morePush = outbox.length > push.length && sent.length > 0;
      if (!reply.more && !morePush) break;
    }
    this.retryMs = 0;
    this.problem.set(problem);
    this.status.set(problem ? 'attention' : 'synced');
  }

  /** Saves what other devices changed, keeping newer edits made here. */
  private async receive(
    pulled: readonly StoredRecord[],
    deviceId: string,
  ): Promise<void> {
    const others = pulled.filter((r) => r.by !== deviceId);
    if (others.length === 0) return;
    const pending = new Map(
      (await this.setup.local.outbox()).map((r) => [recordId(r), r]),
    );
    const fresh: StoredRecord[] = [];
    const outdated = [];
    for (const record of others) {
      const mine = pending.get(recordId(record));
      if (mine && !incomingWins(mine, record)) continue;
      if (mine) outdated.push(mine);
      fresh.push(record);
    }
    if (outdated.length) await this.setup.local.acknowledge(outdated);
    if (fresh.length) {
      await this.setup.local.apply(fresh);
      this.setup.onPulled?.();
      this.channel?.postMessage('pulled');
    }
  }

  private failed(reply: SyncFailure | SyncNoAnswer): void {
    if (this.handleAuth(reply)) return;
    if (reply.code === 'NOT_CONFIGURED') {
      this.status.set('unavailable');
      return;
    }
    const offline =
      reply.code === 'OFFLINE' &&
      typeof navigator !== 'undefined' &&
      navigator.onLine === false;
    this.status.set(offline ? 'offline' : 'waiting');
    if (offline) return; // `online` brings it back.
    this.retryMs = Math.min(
      Math.max(this.retryMs * 2, FIRST_RETRY_MS),
      MAX_RETRY_MS,
    );
    const asked =
      'retryAfterSec' in reply && typeof reply.retryAfterSec === 'number'
        ? reply.retryAfterSec * 1000
        : 0;
    this.syncSoon(Math.max(this.retryMs, asked));
  }

  /** A token that no longer works: this device is out of the space. */
  private handleAuth(reply: { code: string }): boolean {
    if (reply.code !== 'REVOKED' && reply.code !== 'UNAUTHORIZED') return false;
    void this.end('removed');
    return true;
  }

  private async begin(joined: SyncJoined): Promise<void> {
    this.save({
      spaceId: joined.spaceId,
      deviceId: joined.deviceId,
      token: joined.token,
      cursor: 0,
      lastSyncAt: null,
    });
    await this.setup.local.queueAll(joined.deviceId);
    this.channel?.postMessage('state');
    await this.syncNow();
  }

  private async end(status: SyncStatus): Promise<void> {
    this.save(null);
    if (this.timer) clearTimeout(this.timer);
    await this.setup.local.clearOutbox();
    this.usage.set(null);
    this.problem.set(null);
    this.status.set(status);
    this.channel?.postMessage('state');
  }

  private authed<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
  ): Promise<SyncReply<T>> {
    const state = this.state();
    if (!state) {
      return Promise.resolve({
        v: 1,
        ok: false,
        code: 'UNAUTHORIZED',
        message: 'Sync is off',
      });
    }
    return this.transport.call<T>(method, path, { token: state.token });
  }

  private save(state: SyncState | null): void {
    writeSyncState(this.key, state);
    this.state.set(state);
  }

  /** Another tab turned sync on or off. */
  private reload(): void {
    const state = readSyncState(this.key);
    this.state.set(state);
    if (!state) this.status.set('off');
    else this.syncSoon(0);
  }
}

/**
 * An app's sync, for the providers of the component that holds it (its
 * shell): `setup` runs in an injection context.
 */
export function provideSync(setup: () => SyncSetup): Provider[] {
  return [SyncEngine, { provide: SYNC_SETUP, useFactory: setup }];
}

/** What kind of device this is, for its default name in the list. */
export type DeviceKind =
  'android' | 'iphone' | 'ipad' | 'windows' | 'mac' | 'linux' | 'other';

export function deviceKind(userAgent = navigator.userAgent): DeviceKind {
  if (/iPad/.test(userAgent)) return 'ipad';
  if (/iPhone|iPod/.test(userAgent)) return 'iphone';
  if (/Android/.test(userAgent)) return 'android';
  if (/Windows/.test(userAgent)) return 'windows';
  if (/Macintosh|Mac OS X/.test(userAgent)) return 'mac';
  if (/Linux/.test(userAgent)) return 'linux';
  return 'other';
}
