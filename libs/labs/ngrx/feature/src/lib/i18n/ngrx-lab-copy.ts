import { computed, inject, type Signal } from '@angular/core';
import { PreferencesStore, type SiteLanguage } from '@ah/shared/state';
import {
  SHARED_AND_STORE_COPY,
  type SharedAndStoreBundle,
} from './shared-and-store-copy';
import {
  SIGNAL_STORE_AND_EFFECTS_COPY,
  type SignalStoreAndEffectsBundle,
} from './signal-store-and-effects-copy';
import {
  NGRX_VS_SERVICES_COPY,
  type NgrxVsServicesCopy,
} from './ngrx-vs-services-copy';

export type {
  NgrxNavigationCopy,
  NgrxUseCaseFocusCopy,
  NgrxStateFlowDiagramCopy,
  NgrxTimeTravelPanelCopy,
  NgrxStoreFlowCopy,
} from './shared-and-store-copy';
export type {
  NgrxSignalStoreCopy,
  NgrxEffectsCycleCopy,
} from './signal-store-and-effects-copy';
export type {
  NgrxVsServicesCopy,
  InterviewFaqItem,
  MatrixRow,
} from './ngrx-vs-services-copy';

export interface NgrxLabCopy
  extends SharedAndStoreBundle, SignalStoreAndEffectsBundle {
  ngrxVsServices: NgrxVsServicesCopy;
}

const LANGUAGES: readonly SiteLanguage[] = ['en', 'fr', 'ar', 'it', 'de'];

export const NGRX_LAB_COPY: Record<SiteLanguage, NgrxLabCopy> =
  LANGUAGES.reduce(
    (acc, lang) => {
      acc[lang] = {
        ...SHARED_AND_STORE_COPY[lang],
        ...SIGNAL_STORE_AND_EFFECTS_COPY[lang],
        ngrxVsServices: NGRX_VS_SERVICES_COPY[lang],
      };
      return acc;
    },
    {} as Record<SiteLanguage, NgrxLabCopy>,
  );

export function getNgrxLabCopy(lang: SiteLanguage = 'en'): NgrxLabCopy {
  return NGRX_LAB_COPY[lang] ?? NGRX_LAB_COPY.en;
}

export function injectNgrxLabLanguage(): Signal<SiteLanguage> {
  const preferences = inject(PreferencesStore, { optional: true });
  return computed(() => preferences?.language() ?? 'en');
}

export function injectNgrxLabCopy(): Signal<NgrxLabCopy> {
  const lang = injectNgrxLabLanguage();
  return computed(() => getNgrxLabCopy(lang()));
}
