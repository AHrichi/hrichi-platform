import { isPlatformBrowser } from '@angular/common';
import { inject, Injectable, PLATFORM_ID } from '@angular/core';

/** Backends per environment; `null` turns a feature's live path off. */
export interface SiteConfig {
  /** Lead API (NestJS), for the contact form. */
  apiUrl: string | null;
  turnstileSiteKey: string | null;
  /** Orbit API (Spring Boot), for the Orbit lab. */
  orbitApiUrl: string | null;
}

const disabled: SiteConfig = {
  apiUrl: null,
  turnstileSiteKey: null,
  orbitApiUrl: null,
};

/**
 * Runtime config written per environment at deploy time (site-config.json,
 * from tools/hosting/environments.json), so one build serves every
 * environment. Shared as a federation singleton: a remote inside the shell
 * reads the shell's file, and the same remote standalone reads its own.
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
        orbitApiUrl: config.orbitApiUrl ?? null,
      }))
      .catch(() => disabled);
    return this.config;
  }
}
