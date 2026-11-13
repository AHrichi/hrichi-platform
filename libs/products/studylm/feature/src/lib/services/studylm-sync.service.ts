import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import {
  computed,
  DestroyRef,
  effect,
  inject,
  Injectable,
  InjectionToken,
  PLATFORM_ID,
  signal,
  untracked,
} from '@angular/core';
import { APP_MODE } from '@ah/platform/app-mode';
import {
  STUDYLM_PAIRING,
  type StudyLmDeviceSummary,
  type StudyLmSyncResponse,
} from '@ah/products/studylm/domain';
import { SiteConfigService } from '@ah/shared/site-config';
import {
  StudyLmStorageService,
  type StudyLmSyncSession,
} from './studylm-storage.service';
import { StudyLmSyncApi, StudyLmSyncApiError } from './studylm-sync-api';

export type StudyLmSyncStatus =
  | 'starting'
  | 'unavailable'
  | 'unpaired'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'failed';

export type StudyLmSyncUnavailable = 'demo' | 'no-server' | null;

export interface StudyLmPairingState {
  pairingId: string | null;
  expiresAt: string | null;
  busy: boolean;
  error: string | null;
}

export interface StudyLmPullSummary {
  subjects: number;
  lessons: number;
  progress: number;
}

export const STUDYLM_SYNC_API_FACTORY = new InjectionToken<
  (apiUrl: string) => StudyLmSyncApi
>('STUDYLM_SYNC_API_FACTORY', {
  providedIn: 'root',
  factory: () => (apiUrl: string) => new StudyLmSyncApi(apiUrl),
});

const DEBOUNCE_SYNC_MS = 1500;
const MAX_SYNC_ROUNDS = 40;

export function guessStudyLmDeviceName(userAgent: string): string {
  const browser = /Edg\//.test(userAgent)
    ? 'Edge'
    : /Chrome\//.test(userAgent)
      ? 'Chrome'
      : /Firefox\//.test(userAgent)
        ? 'Firefox'
        : /Safari\//.test(userAgent)
          ? 'Safari'
          : 'Browser';
  const os = /iPhone|iPad/.test(userAgent)
    ? 'iOS'
    : /Android/.test(userAgent)
      ? 'Android'
      : /Windows/.test(userAgent)
        ? 'Windows'
        : /Mac OS/.test(userAgent)
          ? 'macOS'
          : /Linux/.test(userAgent)
            ? 'Linux'
            : 'device';
  return `${browser} on ${os}`.slice(0, STUDYLM_PAIRING.deviceNameMax);
}

@Injectable({ providedIn: 'root' })
export class StudyLmSyncService {
  private readonly mode = inject(APP_MODE, { optional: true }) ?? 'standalone';
  private readonly platformId = inject(PLATFORM_ID, { optional: true });
  private readonly document = inject(DOCUMENT, { optional: true });
  private readonly siteConfig = inject(SiteConfigService, { optional: true });
  private readonly storage = inject(StudyLmStorageService);
  private readonly apiFactory = inject(STUDYLM_SYNC_API_FACTORY);
  private readonly destroyRef = inject(DestroyRef);

  private api: StudyLmSyncApi | null = null;
  private initialized: Promise<void> | null = null;
  private running: Promise<void> | null = null;
  private queuedWhileRunning = false;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private lastObservedChangeRev = this.storage.localChangeRevision();

  readonly isStandalone = this.mode === 'standalone';
  readonly unavailable = signal<StudyLmSyncUnavailable>(
    this.isStandalone ? null : 'demo',
  );
  readonly status = signal<StudyLmSyncStatus>(
    this.isStandalone ? 'starting' : 'unavailable',
  );
  readonly device = signal<StudyLmSyncSession | null>(null);
  readonly lastSyncAt = signal<string | null>(null);
  readonly errorMessage = signal<string | null>(null);
  readonly lastPullSummary = signal<StudyLmPullSummary | null>(null);
  readonly devices = signal<StudyLmDeviceSummary[]>([]);
  readonly devicesLoading = signal(false);
  readonly showSyncModal = signal(false);
  readonly pairing = signal<StudyLmPairingState>({
    pairingId: null,
    expiresAt: null,
    busy: false,
    error: null,
  });

  readonly paired = computed(() => this.device() !== null);
  readonly available = computed(
    () => this.isStandalone && this.unavailable() === null,
  );

  /** Revision counters allow screens and stores to refresh reactively after pulls. */
  readonly subjectsPulledRevision = signal(0);
  readonly lessonsPulledRevision = signal(0);
  readonly progressPulledRevision = signal(0);
  readonly lastPulledLessonIds = signal<ReadonlySet<string>>(new Set());

  constructor() {
    effect(() => {
      const rev = this.storage.localChangeRevision();
      const pairedDevice = this.device();
      if (rev === this.lastObservedChangeRev) return;
      this.lastObservedChangeRev = rev;
      if (pairedDevice && this.isStandalone) {
        untracked(() => this.scheduleDebouncedSync());
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
    });
  }

  init(): Promise<void> {
    this.initialized ??= this.bootstrap();
    return this.initialized;
  }

  openModal(): void {
    this.showSyncModal.set(true);
    void this.init().then(() => {
      if (this.device()) {
        void this.loadDevices();
      }
    });
  }

  closeModal(): void {
    this.showSyncModal.set(false);
  }

  cancelPairing(): void {
    this.pairing.set({
      pairingId: null,
      expiresAt: null,
      busy: false,
      error: null,
    });
  }

  async startPairing(deviceName: string): Promise<void> {
    const trimmed = deviceName.trim().slice(0, STUDYLM_PAIRING.deviceNameMax);
    if (!trimmed) {
      this.pairing.update((p) => ({
        ...p,
        error: 'Enter a name for this device.',
      }));
      return;
    }
    this.pairing.update((p) => ({ ...p, busy: true, error: null }));
    await this.init();
    if (!this.api) {
      this.pairing.update((p) => ({
        ...p,
        busy: false,
        error: 'Sync is unavailable on this deployment.',
      }));
      return;
    }
    try {
      const started = await this.api.startPairing(trimmed);
      this.pairing.set({
        pairingId: started.pairingId,
        expiresAt: started.expiresAt,
        busy: false,
        error: null,
      });
    } catch (error) {
      this.pairing.update((p) => ({
        ...p,
        busy: false,
        error: messageOf(error),
      }));
    }
  }

  async confirmPairing(code: string): Promise<boolean> {
    const current = this.pairing();
    if (!current.pairingId || !this.api) return false;
    this.pairing.update((p) => ({ ...p, busy: true, error: null }));
    try {
      const paired = await this.api.confirmPairing(
        current.pairingId,
        code.trim(),
      );
      const session: StudyLmSyncSession = {
        deviceId: paired.deviceId,
        deviceName: paired.deviceName,
        token: paired.token,
        expiresAt: paired.expiresAt,
      };
      await this.storage.setSyncSession(session);
      this.device.set(session);
      this.cancelPairing();
      this.errorMessage.set(null);
      await this.syncNow();
      await this.loadDevices();
      return true;
    } catch (error) {
      this.pairing.update((p) => ({
        ...p,
        busy: false,
        error: messageOf(error),
      }));
      return false;
    }
  }

  async syncNow(): Promise<void> {
    await this.init();
    return this.runSync();
  }

  private runSync(): Promise<void> {
    if (!this.api || !this.device()) return Promise.resolve();
    if (this.running) {
      this.queuedWhileRunning = true;
      return this.running;
    }
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    this.running = this.executeSyncLoop().finally(() => {
      this.running = null;
      if (this.queuedWhileRunning) {
        this.queuedWhileRunning = false;
        void this.runSync();
      }
    });
    return this.running;
  }

  async loadDevices(): Promise<void> {
    await this.init();
    const session = this.device();
    if (!this.api || !session) {
      this.devices.set([]);
      return;
    }
    this.devicesLoading.set(true);
    try {
      const list = await this.api.devices(session.token);
      this.devices.set(list);
    } catch (error) {
      if (
        error instanceof StudyLmSyncApiError &&
        error.kind === 'unauthorized'
      ) {
        await this.handleUnauthorized(error.message);
      }
    } finally {
      this.devicesLoading.set(false);
    }
  }

  async revokeDevice(id: string): Promise<void> {
    const session = this.device();
    if (!this.api || !session) return;
    try {
      await this.api.revokeDevice(id, session.token);
      if (id === session.deviceId) {
        await this.storage.clearSyncSession();
        this.device.set(null);
        this.devices.set([]);
        this.lastPullSummary.set(null);
        this.errorMessage.set(null);
        this.status.set('unpaired');
      } else {
        await this.loadDevices();
      }
    } catch (error) {
      if (
        error instanceof StudyLmSyncApiError &&
        error.kind === 'unauthorized'
      ) {
        await this.handleUnauthorized(error.message);
      } else {
        this.errorMessage.set(messageOf(error));
      }
    }
  }

  private scheduleDebouncedSync(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      this.debounceTimer = null;
      void this.syncNow();
    }, DEBOUNCE_SYNC_MS);
  }

  private async bootstrap(): Promise<void> {
    if (
      !this.isStandalone ||
      (this.platformId !== null && !isPlatformBrowser(this.platformId))
    ) {
      this.unavailable.set('demo');
      this.status.set('unavailable');
      return;
    }

    const [session, lastSyncAt, siteCfg] = await Promise.all([
      this.storage.getSyncSession(),
      this.storage.getLastSyncAt(),
      this.siteConfig?.load().catch(() => ({ apiUrl: null })) ??
        Promise.resolve({ apiUrl: null }),
    ]);

    if (lastSyncAt) this.lastSyncAt.set(lastSyncAt);
    if (session) this.device.set(session);

    if (!siteCfg.apiUrl) {
      this.unavailable.set('no-server');
      this.status.set('unavailable');
      return;
    }

    this.api = this.apiFactory(siteCfg.apiUrl);
    this.attachBrowserListeners();

    if (session) {
      await this.runSync();
    } else {
      this.status.set('unpaired');
    }
  }

  private attachBrowserListeners(): void {
    const doc = this.document;
    const win = doc?.defaultView;
    if (!win || !doc) return;

    const onOnline = () => {
      if (this.device()) void this.syncNow();
    };
    const onVisibilityChange = () => {
      if (!this.device()) return;
      if (doc.visibilityState === 'visible') {
        void this.syncNow();
      } else if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
        void this.syncNow();
      }
    };

    win.addEventListener('online', onOnline);
    doc.addEventListener('visibilitychange', onVisibilityChange);
    this.destroyRef.onDestroy(() => {
      win.removeEventListener('online', onOnline);
      doc.removeEventListener('visibilitychange', onVisibilityChange);
    });
  }

  private async executeSyncLoop(): Promise<void> {
    const session = this.device();
    const api = this.api;
    if (!session || !api) return;

    this.status.set('syncing');
    this.errorMessage.set(null);
    await this.storage.enqueueExistingForSync();

    let subjectsChanged = false;
    let settingsChanged = false;
    let lessonsChanged = false;
    let progressChanged = false;
    let pulledSubjects = 0;
    let pulledLessons = 0;
    let pulledProgress = 0;
    const pulledLessonIds = new Set<string>();
    const activeSession: StudyLmSyncSession = { ...session };

    for (let round = 0; round < MAX_SYNC_ROUNDS; round++) {
      const batch = await this.storage.readOutboxBatch();
      const cursor = await this.storage.getSyncCursor();
      let response: StudyLmSyncResponse;

      try {
        response = await api.sync(
          { cursor, push: batch.push },
          activeSession.token,
        );
      } catch (error) {
        if (
          error instanceof StudyLmSyncApiError &&
          error.kind === 'unauthorized'
        ) {
          await this.handleUnauthorized(error.message);
          return;
        }
        const offline =
          error instanceof StudyLmSyncApiError && error.kind === 'network';
        this.status.set(offline ? 'offline' : 'failed');
        this.errorMessage.set(messageOf(error));
        return;
      }

      const applied = await this.storage.applySyncPull(response.pull);
      subjectsChanged ||= applied.subjectsChanged;
      settingsChanged ||= applied.settingsChanged;
      lessonsChanged ||= applied.lessonsChanged;
      progressChanged ||= applied.progressChanged;
      for (const id of applied.pulledLessonIds) pulledLessonIds.add(id);

      for (const rec of response.pull) {
        if (rec.kind === 'subject' && !rec.data.deletedAt) pulledSubjects++;
        if (rec.kind === 'lesson' && !rec.data.deletedAt) pulledLessons++;
        if (rec.kind === 'progress') pulledProgress++;
      }

      await this.storage.acknowledgeOutbox(batch.acknowledged);
      for (const rejected of response.rejected) {
        await this.storage.dropFromOutbox(rejected.kind, rejected.id);
      }
      await this.storage.setSyncCursor(response.cursor);

      if (response.renewedToken) {
        activeSession.token = response.renewedToken.token;
        activeSession.expiresAt = response.renewedToken.expiresAt;
        await this.storage.setSyncSession({ ...activeSession });
        this.device.set({ ...activeSession });
      }

      if (batch.remaining === 0 && !response.more) break;
    }

    const syncedAt = new Date().toISOString();
    await this.storage.setLastSyncAt(syncedAt);
    this.lastSyncAt.set(syncedAt);
    this.lastPullSummary.set(
      pulledSubjects || pulledLessons || pulledProgress
        ? {
            subjects: pulledSubjects,
            lessons: pulledLessons,
            progress: pulledProgress,
          }
        : null,
    );
    this.status.set('synced');

    if (pulledLessonIds.size > 0) {
      this.lastPulledLessonIds.set(pulledLessonIds);
    }
    if (subjectsChanged || settingsChanged) {
      this.subjectsPulledRevision.update((n) => n + 1);
    }
    if (lessonsChanged) {
      this.lessonsPulledRevision.update((n) => n + 1);
    }
    if (progressChanged) {
      this.progressPulledRevision.update((n) => n + 1);
    }
  }

  private async handleUnauthorized(message: string): Promise<void> {
    await this.storage.clearSyncSession();
    this.device.set(null);
    this.devices.set([]);
    this.status.set('unpaired');
    this.errorMessage.set(message);
  }
}

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : 'StudyLM sync failed.';
}
