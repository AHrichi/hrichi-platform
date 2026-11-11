import { computed, DestroyRef, inject } from '@angular/core';
import {
  patchState,
  signalStore,
  withComputed,
  withHooks,
  withMethods,
  withState,
} from '@ngrx/signals';
import { LearningApiError, type SyncOutcome } from '@ah/learning/data-access';
import {
  type Capture,
  type Concept,
  type ConceptDraft,
  conceptFromDraft,
  type DeviceSummary,
  SERVER_WRITER,
} from '@ah/learning/domain';
import { LearningRuntime, type SyncUnavailable } from './learning-runtime';

export type SyncState =
  | 'starting'
  | 'unavailable'
  | 'unpaired'
  | 'syncing'
  | 'synced'
  | 'offline'
  | 'failed';

export interface PairingState {
  pairingId: string | null;
  deviceName: string;
  expiresAt: string | null;
  busy: boolean;
  error: string | null;
}

export interface LearningState {
  ready: boolean;
  /** The database couldn't be opened (private mode, storage blocked). */
  fatal: string | null;
  concepts: Concept[];
  captures: Capture[];
  /** Concepts the server is rewriting ("make it simpler"). */
  revising: string[];
  /** A short confirmation for the live region ("Got it"). */
  notice: string | null;
  /** Local changes not yet on the server. */
  pending: number;
  device: { id: string; name: string } | null;
  unavailable: SyncUnavailable | null;
  sync: { state: SyncState; message: string | null; at: string | null };
  pairing: PairingState;
  devices: DeviceSummary[];
}

const initialState: LearningState = {
  ready: false,
  fatal: null,
  concepts: [],
  captures: [],
  revising: [],
  notice: null,
  pending: 0,
  device: null,
  unavailable: null,
  sync: { state: 'starting', message: null, at: null },
  pairing: {
    pairingId: null,
    deviceName: '',
    expiresAt: null,
    busy: false,
    error: null,
  },
  devices: [],
};

/** Local changes wait this long, so typing a few in a row syncs once. */
const SYNC_DELAY_MS = 1500;
/**
 * While the server is still turning a capture into concepts, sync again
 * after this long. Only then: there is no polling otherwise (design 4.3).
 */
const FOLLOW_UP_MS = 15_000;

const IN_FLIGHT: readonly Capture['status'][] = ['queued', 'processing'];

function messageOf(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export const LearningStore = signalStore(
  { providedIn: 'root' },
  withState<LearningState>(initialState),
  withComputed(({ concepts, captures }) => ({
    /** The digest: drafts the AI wrote, waiting to be kept or discarded. */
    drafts: computed(() => concepts().filter((c) => c.status === 'draft')),
    /** The library: concepts the learner kept. */
    library: computed(() => concepts().filter((c) => c.status !== 'draft')),
    /** Captures not yet turned into drafts, or that need the learner. */
    inProgress: computed(() =>
      captures().filter((capture) => capture.status !== 'ready'),
    ),
  })),
  withMethods((store) => {
    const runtime = inject(LearningRuntime);
    let timer: ReturnType<typeof setTimeout> | null = null;
    let followUp: ReturnType<typeof setTimeout> | null = null;
    let noticeTimer: ReturnType<typeof setTimeout> | null = null;

    function notify(notice: string): void {
      patchState(store, { notice });
      if (noticeTimer) clearTimeout(noticeTimer);
      noticeTimer = setTimeout(() => patchState(store, { notice: null }), 4000);
    }

    async function refresh(): Promise<void> {
      const { local, unavailable } = await runtime.open();
      const [concepts, captures, pending, session] = await Promise.all([
        local.concepts(),
        local.captures(),
        local.pendingCount(),
        local.session(),
      ]);
      patchState(store, {
        concepts,
        captures,
        pending,
        unavailable,
        device: session
          ? { id: session.deviceId, name: session.deviceName }
          : null,
      });
    }

    function applyOutcome(outcome: SyncOutcome): void {
      const at = new Date().toISOString();
      switch (outcome.status) {
        case 'synced':
          patchState(store, {
            sync: {
              state: 'synced',
              at,
              message: outcome.rejected.length
                ? `${outcome.rejected.length} change(s) were refused: this device's clock is ahead. Check its date and time.`
                : null,
            },
          });
          return;
        case 'unpaired':
          patchState(store, {
            sync: { state: 'unpaired', at: null, message: null },
          });
          return;
        case 'failed':
          patchState(store, {
            sync: {
              state: outcome.offline ? 'offline' : 'failed',
              at: store.sync().at,
              message: outcome.message,
            },
          });
      }
    }

    async function syncNow(): Promise<void> {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
      const { client, unavailable } = await runtime.open();
      if (!client) {
        patchState(store, {
          unavailable,
          sync: { state: 'unavailable', at: null, message: null },
        });
        return;
      }
      patchState(store, { sync: { ...store.sync(), state: 'syncing' } });
      const outcome = await client.sync();
      applyOutcome(outcome);
      await refresh();
      if (followUp) clearTimeout(followUp);
      followUp = null;
      const waiting = store
        .captures()
        .some((capture) => IN_FLIGHT.includes(capture.status));
      if (outcome.status === 'synced' && waiting) {
        followUp = setTimeout(() => void syncNow(), FOLLOW_UP_MS);
      }
    }

    function newCapture(fields: Partial<Capture>): Capture {
      const at = new Date().toISOString();
      return {
        id: crypto.randomUUID(),
        updatedAt: at,
        deletedAt: null,
        modality: 'text',
        text: null,
        hasAudio: false,
        transcript: null,
        source: null,
        status: 'queued',
        attempts: 0,
        error: null,
        force: false,
        conceptIds: [],
        capturedAt: at,
        ...fields,
      };
    }

    async function updateCapture(
      id: string,
      change: Partial<Capture>,
    ): Promise<void> {
      const { local } = await runtime.open();
      const capture = (await local.captures()).find((c) => c.id === id);
      if (!capture) return;
      await local.saveCapture({ ...capture, ...change });
      await refresh();
      syncSoon();
    }

    async function updateConcept(
      id: string,
      change: Partial<Concept>,
    ): Promise<void> {
      const { local } = await runtime.open();
      const concept = (await local.concepts()).find((c) => c.id === id);
      if (!concept) return;
      await local.saveConcept({ ...concept, ...change });
      await refresh();
      syncSoon();
    }

    function syncSoon(): void {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void syncNow(), SYNC_DELAY_MS);
    }

    return {
      async load(): Promise<void> {
        try {
          await refresh();
          patchState(store, { ready: true });
          await syncNow();
        } catch (error) {
          patchState(store, { ready: true, fatal: messageOf(error) });
        }
      },

      syncNow,
      syncSoon,

      /** A typed capture: saved at once, processed by the server (design 1). */
      async capture(text: string): Promise<void> {
        const { local } = await runtime.open();
        await local.saveCapture(
          newCapture({ text: text.trim().slice(0, 4000) }),
        );
        await refresh();
        notify('Got it ✓');
        syncSoon();
      },

      /** A voice note: the audio waits on the device until the server has it. */
      async captureVoice(audio: {
        bytes: ArrayBuffer;
        mimeType: string;
      }): Promise<void> {
        const { local } = await runtime.open();
        await local.addVoiceCapture(
          newCapture({ modality: 'voice', hasAudio: true }),
          audio,
        );
        await refresh();
        notify('Got it ✓');
        syncSoon();
      },

      /** Try again after the AI failed three times. */
      retryCapture(id: string): Promise<void> {
        return updateCapture(id, {
          status: 'queued',
          attempts: 0,
          error: null,
        });
      },

      /** Triage thought it wasn't learnable; the learner disagrees. */
      processAnyway(id: string): Promise<void> {
        return updateCapture(id, {
          status: 'queued',
          force: true,
          attempts: 0,
          error: null,
        });
      },

      dismissCapture(id: string): Promise<void> {
        return updateCapture(id, { deletedAt: new Date().toISOString() });
      },

      /** Keep a draft: it joins the library and, from L3, the reviews. */
      async keep(id: string): Promise<void> {
        await updateConcept(id, {
          status: 'active',
          confirmedAt: new Date().toISOString(),
        });
        notify('Kept ✓');
      },

      async discard(id: string): Promise<void> {
        const { local } = await runtime.open();
        await local.deleteConcept(id);
        await refresh();
        syncSoon();
      },

      /** "Make it simpler": the server rewrites; offline, it says so. */
      async simpler(id: string): Promise<void> {
        const { api, local } = await runtime.open();
        const session = await local.session();
        if (!api || !session) {
          notify('Rewriting needs a paired device and a connection.');
          return;
        }
        patchState(store, { revising: [...store.revising(), id] });
        try {
          // The server must have the draft before it can rewrite it.
          await syncNow();
          const concept = await api.revise(id, 'simpler', session.token);
          await local.applyPull([
            { kind: 'concept', seq: 0, by: SERVER_WRITER, data: concept },
          ]);
          await refresh();
        } catch (error) {
          notify(messageOf(error));
        } finally {
          patchState(store, {
            revising: store.revising().filter((revising) => revising !== id),
          });
        }
      },

      async addConcept(draft: ConceptDraft): Promise<void> {
        const { local } = await runtime.open();
        await local.saveConcept(conceptFromDraft(draft, new Date()));
        await refresh();
        syncSoon();
      },

      async deleteConcept(id: string): Promise<void> {
        const { local } = await runtime.open();
        await local.deleteConcept(id);
        await refresh();
        syncSoon();
      },

      setDeviceName(deviceName: string): void {
        patchState(store, { pairing: { ...store.pairing(), deviceName } });
      },

      /** Asks the server to send a code to the owner's Telegram. */
      async startPairing(): Promise<void> {
        const { api } = await runtime.open();
        const pairing = store.pairing();
        if (!api || pairing.busy) return;
        patchState(store, { pairing: { ...pairing, busy: true, error: null } });
        try {
          const started = await api.startPairing(pairing.deviceName);
          patchState(store, {
            pairing: {
              ...store.pairing(),
              busy: false,
              pairingId: started.pairingId,
              expiresAt: started.expiresAt,
            },
          });
        } catch (error) {
          patchState(store, {
            pairing: {
              ...store.pairing(),
              busy: false,
              error: messageOf(error),
            },
          });
        }
      },

      async confirmPairing(code: string): Promise<void> {
        const { api, local } = await runtime.open();
        const pairing = store.pairing();
        if (!api || !pairing.pairingId || pairing.busy) return;
        patchState(store, { pairing: { ...pairing, busy: true, error: null } });
        try {
          const paired = await api.confirmPairing(pairing.pairingId, code);
          await local.setSession({
            deviceId: paired.deviceId,
            deviceName: paired.deviceName,
            token: paired.token,
            expiresAt: paired.expiresAt,
          });
          patchState(store, { pairing: { ...initialState.pairing } });
          await refresh();
          await syncNow();
        } catch (error) {
          // An expired or spent pairing can't take more codes: start over.
          const gone =
            error instanceof LearningApiError && error.status === 404;
          patchState(store, {
            pairing: {
              ...store.pairing(),
              busy: false,
              pairingId: gone ? null : pairing.pairingId,
              error: messageOf(error),
            },
          });
        }
      },

      cancelPairing(): void {
        patchState(store, {
          pairing: {
            ...initialState.pairing,
            deviceName: store.pairing().deviceName,
          },
        });
      },

      async loadDevices(): Promise<void> {
        const { api, local } = await runtime.open();
        const session = await local.session();
        if (!api || !session) {
          patchState(store, { devices: [] });
          return;
        }
        try {
          patchState(store, { devices: await api.devices(session.token) });
        } catch (error) {
          if (
            error instanceof LearningApiError &&
            error.kind === 'unauthorized'
          ) {
            await local.clearSession();
            await refresh();
          }
          patchState(store, {
            sync: { ...store.sync(), message: messageOf(error) },
          });
        }
      },

      async removeDevice(id: string): Promise<void> {
        const { api, local } = await runtime.open();
        const session = await local.session();
        if (!api || !session) return;
        try {
          await api.revokeDevice(id, session.token);
          if (id === session.deviceId) {
            await local.clearSession();
            await refresh();
            patchState(store, {
              devices: [],
              sync: { state: 'unpaired', at: null, message: null },
            });
            return;
          }
          patchState(store, {
            devices: store.devices().filter((device) => device.id !== id),
          });
        } catch (error) {
          patchState(store, {
            sync: { ...store.sync(), message: messageOf(error) },
          });
        }
      },
    };
  }),
  withHooks({
    onInit(store) {
      if (typeof window === 'undefined') return;
      const onOnline = () => void store.syncNow();
      const onVisible = () => {
        if (document.visibilityState === 'visible') void store.syncNow();
      };
      window.addEventListener('online', onOnline);
      document.addEventListener('visibilitychange', onVisible);
      inject(DestroyRef).onDestroy(() => {
        window.removeEventListener('online', onOnline);
        document.removeEventListener('visibilitychange', onVisible);
      });
    },
  }),
);
