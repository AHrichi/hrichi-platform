import { computed, inject, Injectable, signal } from '@angular/core';
import { PreferencesStore } from '@ah/shared/state';
import type { AutoSphereDictionary, AutoSphereLanguage } from './i18n.types';
import { enDictionary } from './en';
import { deDictionary } from './de';
import { frDictionary } from './fr';
import { itDictionary } from './it';
import { arDictionary } from './ar';

export * from './i18n.types';
export * from './en';
export * from './de';
export * from './fr';
export * from './it';
export * from './ar';

export const AUTOSPHERE_DICTIONARIES: Record<
  AutoSphereLanguage,
  AutoSphereDictionary
> = {
  en: enDictionary,
  de: deDictionary,
  fr: frDictionary,
  it: itDictionary,
  ar: arDictionary,
};

const LOCALES: Record<AutoSphereLanguage, string> = {
  en: 'en-GB',
  de: 'de-DE',
  fr: 'fr-FR',
  it: 'it-IT',
  ar: 'ar-u-nu-latn',
};

@Injectable({ providedIn: 'root' })
export class AutoSphereI18n {
  private readonly preferences = inject(PreferencesStore, { optional: true });
  private readonly fallbackLang = signal<AutoSphereLanguage>('en');

  readonly lang = computed<AutoSphereLanguage>(() => {
    return this.preferences?.language() ?? this.fallbackLang();
  });

  readonly isRtl = computed(() => {
    return this.preferences?.isRtl() ?? this.lang() === 'ar';
  });

  readonly t = computed<AutoSphereDictionary>(() => {
    const current = this.lang();
    return AUTOSPHERE_DICTIONARIES[current] ?? AUTOSPHERE_DICTIONARIES.en;
  });

  readonly locale = computed(() => {
    return LOCALES[this.lang()] ?? 'en-GB';
  });

  readonly availableLanguages: Array<{
    code: AutoSphereLanguage;
    label: string;
  }> = [
    { code: 'en', label: 'EN' },
    { code: 'de', label: 'DE' },
    { code: 'fr', label: 'FR' },
    { code: 'it', label: 'IT' },
    { code: 'ar', label: 'AR' },
  ];

  setLanguage(lang: AutoSphereLanguage): void {
    if (this.preferences) {
      this.preferences.setLanguage(lang);
    } else {
      this.fallbackLang.set(lang);
    }
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat(this.locale(), {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(amount);
  }

  formatNumber(val: number, maxDecimals = 1): string {
    return new Intl.NumberFormat(this.locale(), {
      maximumFractionDigits: maxDecimals,
    }).format(val);
  }
}
