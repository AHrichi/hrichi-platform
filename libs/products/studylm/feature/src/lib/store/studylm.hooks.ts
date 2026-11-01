import { inject } from '@angular/core';
import { patchState, signalStoreFeature, type, withHooks } from '@ngrx/signals';
import type { StudyLmState } from './studylm.state';
import { StudyLmApiService } from '../services/studylm-api.service';
import { StudyLmStorageService } from '../services/studylm-storage.service';

export function withStudyLmHooks() {
  return signalStoreFeature(
    { state: type<StudyLmState>() },
    withHooks({
      onInit(
        store,
        apiService = inject(StudyLmApiService),
        storageService = inject(StudyLmStorageService),
      ) {
        // 1. Hydrate subjects from IndexedDB
        storageService
          .getAllSubjects()
          .then((saved) => {
            if (saved && saved.length > 0) {
              patchState(store, {
                subjects: saved,
                activeSubjectId: saved[0].id,
              });
            }
          })
          .catch(() => {
            // Keep initial in-memory subjects
          });

        // 2. Pick the n8n endpoint from site config, then check it
        apiService.getDefaultConfig().then(async (defaultCfg) => {
          patchState(store, (s) => ({
            n8nConfig: {
              ...s.n8nConfig,
              mode: defaultCfg.mode,
              tunnelUrl: defaultCfg.tunnelUrl,
              activeEndpoint: defaultCfg.activeEndpoint,
            },
          }));
          const res = await apiService.testConnection(
            defaultCfg.activeEndpoint,
          );
          if (res.ok) {
            patchState(store, (s) => ({
              n8nConfig: {
                ...s.n8nConfig,
                isConnected: true,
                lastPingMs: res.latencyMs,
                lastError: undefined,
              },
            }));
          } else {
            apiService.testConnection(defaultCfg.localUrl).then((localRes) => {
              if (localRes.ok) {
                patchState(store, (s) => ({
                  n8nConfig: {
                    ...s.n8nConfig,
                    mode: 'local' as const,
                    activeEndpoint: defaultCfg.localUrl,
                    isConnected: true,
                    lastPingMs: localRes.latencyMs,
                    lastError: undefined,
                  },
                }));
              } else {
                patchState(store, (s) => ({
                  n8nConfig: {
                    ...s.n8nConfig,
                    isConnected: false,
                    lastError:
                      res.error || localRes.error || 'Connection failed',
                  },
                }));
              }
            });
          }
        });
      },
    }),
  );
}
