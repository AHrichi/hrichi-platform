import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import {
  EdgeClient,
  LearningApi,
  LearningDatabase,
  LearningLocalStore,
  LearningSyncClient,
} from '@ah/learning/data-access';
import { APP_MODE } from '@ah/platform/app-mode';
import { databaseName } from '@ah/platform/storage';
import { SiteConfigService } from '@ah/shared/site-config';

/** Why this device can't sync, when it can't. */
export type SyncUnavailable = 'demo' | 'no-server';

export interface LearningRuntimeParts {
  local: LearningLocalStore;
  api: LearningApi | null;
  client: LearningSyncClient | null;
  /** The edge Worker for nudges; null until it is deployed. */
  edge: EdgeClient | null;
  /** Set when `api` is null. */
  unavailable: SyncUnavailable | null;
}

/**
 * Opens the device's database and, when this deployment has an API, the
 * sync client. The portfolio's demo opens `ah-demo-learning` and never
 * syncs or pairs (design §9), so trying it never touches real data.
 */
@Injectable({ providedIn: 'root' })
export class LearningRuntime {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly mode = inject(APP_MODE);
  private readonly siteConfig = inject(SiteConfigService);
  private parts: Promise<LearningRuntimeParts> | null = null;

  open(): Promise<LearningRuntimeParts> {
    this.parts ??= this.connect();
    return this.parts;
  }

  private async connect(): Promise<LearningRuntimeParts> {
    if (!this.browser || typeof indexedDB === 'undefined') {
      throw new Error('This browser keeps no data for the Learning Engine.');
    }
    const name = await databaseName(this.mode, 'learning', 'LearningDatabase');
    const local = new LearningLocalStore(new LearningDatabase(name));
    if (this.mode !== 'standalone') {
      return {
        local,
        api: null,
        client: null,
        edge: null,
        unavailable: 'demo',
      };
    }
    const { apiUrl, learningEdgeUrl } = await this.siteConfig.load();
    const edge = learningEdgeUrl ? new EdgeClient(learningEdgeUrl) : null;
    if (!apiUrl) {
      return { local, api: null, client: null, edge, unavailable: 'no-server' };
    }
    const api = new LearningApi(apiUrl);
    const client = new LearningSyncClient(
      local,
      (request, token) => api.sync(request, token),
      (captureId, audio, token) => api.uploadAudio(captureId, audio, token),
    );
    return { local, api, client, edge, unavailable: null };
  }
}
