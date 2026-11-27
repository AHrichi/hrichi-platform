import { computed, inject, Injectable } from '@angular/core';
import type { Lang } from '@ah/products/lasertag/domain';
import { PreferencesStore, type SiteLanguage } from '@ah/shared/state';
import { AR } from './copy.ar';
import { type BarqCopy, EN } from './copy.en';
import { FR } from './copy.fr';

export interface BarqLanguage {
  readonly id: Lang;
  /** The language's name in itself. */
  readonly nativeName: string;
}

/** BARQ speaks three of the site's five languages (ADR-0033). */
export const BARQ_LANGUAGES: readonly BarqLanguage[] = [
  { id: 'ar', nativeName: 'العربية' },
  { id: 'fr', nativeName: 'Français' },
  { id: 'en', nativeName: 'English' },
];

const COPY: Record<Lang, BarqCopy> = { en: EN, fr: FR, ar: AR };

/** Arabic keeps Latin digits, as the platform's other apps do (ADR-0018). */
const LOCALES: Record<Lang, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  ar: 'ar-u-nu-latn',
};

/** Left-to-right isolate and its pop: a handle stays whole in Arabic. */
const LRI = String.fromCharCode(0x2066);
const PDI = String.fromCharCode(0x2069);

/** The site's language, or English for the two BARQ doesn't speak yet. */
export function barqLang(language: SiteLanguage): Lang {
  return language === 'ar' || language === 'fr' ? language : 'en';
}

/**
 * BARQ's words in the reader's language. The language itself lives in the
 * platform's PreferencesStore, which sets `lang` and `dir` on the page.
 */
@Injectable({ providedIn: 'root' })
export class BarqI18n {
  private readonly preferences = inject(PreferencesStore);

  readonly lang = computed(() => barqLang(this.preferences.language()));
  readonly isRtl = computed(() => this.lang() === 'ar');
  readonly t = computed(() => COPY[this.lang()]);
  readonly locale = computed(() => LOCALES[this.lang()]);

  setLanguage(lang: Lang): void {
    this.preferences.setLanguage(lang);
  }

  /** A handle, code or label kept left to right inside any sentence. */
  ltr(text: string): string {
    return `${LRI}${text}${PDI}`;
  }

  time(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? iso
      : new Intl.DateTimeFormat(this.locale(), { timeStyle: 'short' }).format(
          date,
        );
  }

  dateTime(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? iso
      : new Intl.DateTimeFormat(this.locale(), {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(date);
  }

  num(value: number): string {
    return new Intl.NumberFormat(this.locale(), {
      maximumFractionDigits: 1,
    }).format(value);
  }

  /** The words for a failed call: the server's code, or a passkey's reason. */
  error(code: string | undefined): string {
    const errors = this.t().errors as Record<string, string>;
    return (code && errors[code]) || errors['generic'];
  }
}
