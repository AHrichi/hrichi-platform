import { inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export interface SiteConfig {
  apiUrl: string | null;
  turnstileSiteKey: string | null;
}

const disabled: SiteConfig = { apiUrl: null, turnstileSiteKey: null };

/**
 * Runtime config written per environment at deploy time (site-config.json),
 * so one build serves every environment.
 */
@Injectable({ providedIn: 'root' })
export class SiteConfigService {
  private readonly browser = isPlatformBrowser(inject(PLATFORM_ID));
  private config?: Promise<SiteConfig>;

  load(): Promise<SiteConfig> {
    if (!this.browser) {
      return Promise.resolve(disabled);
    }
    this.config ??= fetch('site-config.json')
      .then((response) => (response.ok ? response.json() : disabled))
      .then((config: Partial<SiteConfig>) => ({
        apiUrl: config.apiUrl ?? null,
        turnstileSiteKey: config.turnstileSiteKey ?? null,
      }))
      .catch(() => disabled);
    return this.config;
  }
}
