import { inject } from '@angular/core';
import { signalStoreFeature, type, withHooks } from '@ngrx/signals';
import type { StudyLmState } from './studylm.state';
import { StudyLmApiService } from '../services/studylm-api.service';

export function withStudyLmHooks() {
  return signalStoreFeature(
    { state: type<StudyLmState>() },
    withHooks({
      onInit(store, apiService = inject(StudyLmApiService)) {
        // Auto-detect optimal default n8n endpoint based on browser environment
        const defaultCfg = apiService.getDefaultConfig();
        // Fire non-blocking ping
        apiService.testConnection(defaultCfg.activeEndpoint).then((res) => {
          if (!res.ok) {
            // If tunnel failed, try local, or fallback
            apiService.testConnection(defaultCfg.localUrl).then((localRes) => {
              if (localRes.ok) {
                // local worked
                // Store can stay connected
              }
            });
          }
        });
      },
    }),
  );
}
