import { inject } from '@angular/core';
import { patchState, signalStoreFeature, type, withHooks } from '@ngrx/signals';
import type { StudyLmState } from './studylm.state';
import { StudyLmApiService } from '../services/studylm-api.service';

export function withStudyLmHooks() {
  return signalStoreFeature(
    { state: type<StudyLmState>() },
    withHooks({
      onInit(store, apiService = inject(StudyLmApiService)) {
        const defaultCfg = apiService.getDefaultConfig();
        // Check primary endpoint
        apiService.testConnection(defaultCfg.activeEndpoint).then((res) => {
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
            // Try fallback to local Docker endpoint if on localhost or tunnel failed
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
                    lastError: res.error || localRes.error || 'Connection failed',
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
