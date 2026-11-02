import { inject } from '@angular/core';
import { patchState, signalStoreFeature, type, withHooks } from '@ngrx/signals';
import type {
  N8nConnectionConfig,
  N8nConnectionMode,
} from '@ah/products/studylm/domain';
import type { StudyLmState } from './studylm.state';
import { ACTIVE_SUBJECT_SETTING, N8N_SETTING } from './studylm.methods';
import { StudyLmApiService } from '../services/studylm-api.service';
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
          const localUrl = choice?.localUrl || defaultCfg.localUrl;
          const customUrl = choice?.customUrl ?? '';
          const mode = choice?.mode ?? defaultCfg.mode;
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
              isChecking: true,
            },
          }));
          const res = await apiService.testConnection(activeEndpoint);
          if (res.ok) {
            report({
              isConnected: true,
              lastPingMs: res.latencyMs,
              lastError: undefined,
            });
            return;
          }
          // The site's tunnel is down: try n8n on this machine before giving up.
          const localRes =
            choice || activeEndpoint === localUrl
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
