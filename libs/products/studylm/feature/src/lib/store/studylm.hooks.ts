import { inject } from '@angular/core';
import { patchState, signalStoreFeature, type, withHooks } from '@ngrx/signals';
import type {
  N8nConnectionConfig,
  N8nConnectionMode,
} from '@ah/products/studylm/domain';
import type { StudyLmState } from './studylm.state';
import { ACTIVE_SUBJECT_SETTING, N8N_SETTING } from './studylm.methods';
import {
  AI_UNAVAILABLE_MESSAGE,
  isLocalPage,
  StudyLmApiService,
} from '../services/studylm-api.service';
import { StudyLmStorageService } from '../services/studylm-storage.service';

/** The connection the learner picked in Settings, kept across reloads. */
interface SavedN8nChoice {
  mode: N8nConnectionMode;
  localUrl: string;
  customUrl: string;
}

export function withStudyLmHooks() {
  return signalStoreFeature(
    { state: type<StudyLmState>() },
    withHooks({
      onInit(
        store,
        apiService = inject(StudyLmApiService),
        storageService = inject(StudyLmStorageService),
      ) {
        // 1. Hydrate subjects from IndexedDB, reopening the last one.
        Promise.all([
          storageService.getAllSubjects(),
          storageService.getSetting<string>(ACTIVE_SUBJECT_SETTING),
        ])
          .then(([saved, lastId]) => {
            if (saved && saved.length > 0) {
              patchState(store, {
                subjects: saved,
                activeSubjectId: saved.some((s) => s.id === lastId)
                  ? (lastId as string)
                  : saved[0].id,
              });
            }
          })
          .catch(() => {
            // Keep initial in-memory subjects
          });

        // 2. Pick the endpoint (the learner's choice, else site config), then check it.
        const report = (change: Partial<N8nConnectionConfig>) =>
          patchState(store, (s) => ({
            n8nConfig: { ...s.n8nConfig, isChecking: false, ...change },
          }));

        Promise.all([
          apiService.getDefaultConfig(),
          storageService
            .getSetting<SavedN8nChoice>(N8N_SETTING)
            .catch(() => null),
        ]).then(async ([defaultCfg, choice]) => {
          const local = isLocalPage();
          // A saved "localhost" choice only applies on the machine itself.
          const usable =
            choice && (local || choice.mode !== 'local') ? choice : null;
          const localUrl = usable?.localUrl || defaultCfg.localUrl;
          const customUrl = usable?.customUrl ?? '';
          const mode = usable?.mode ?? defaultCfg.mode;
          const activeEndpoint =
            mode === 'custom' && customUrl
              ? customUrl
              : mode === 'local'
                ? localUrl
                : defaultCfg.activeEndpoint;
          patchState(store, (s) => ({
            n8nConfig: {
              ...s.n8nConfig,
              mode,
              localUrl,
              customUrl,
              tunnelUrl: defaultCfg.tunnelUrl,
              activeEndpoint,
              isChecking: mode !== 'unavailable',
            },
          }));
          if (mode === 'unavailable' || !activeEndpoint) {
            report({ isConnected: false, lastError: AI_UNAVAILABLE_MESSAGE });
            return;
          }
          const res = await apiService.testConnection(activeEndpoint);
          if (res.ok) {
            report({
              isConnected: true,
              lastPingMs: res.latencyMs,
              lastError: undefined,
            });
            return;
          }
          // The tunnel is down: on the developer's machine, try the local n8n
          // before giving up. A public page never does (Local Network Access).
          const localRes =
            !local || usable || activeEndpoint === localUrl
              ? res
              : await apiService.testConnection(localUrl);
          if (localRes !== res && localRes.ok) {
            report({
              mode: 'local',
              activeEndpoint: localUrl,
              isConnected: true,
              lastPingMs: localRes.latencyMs,
              lastError: undefined,
            });
          } else {
            report({
              isConnected: false,
              lastError: res.error || localRes.error || 'Connection failed',
            });
          }
        });
      },
    }),
  );
}
