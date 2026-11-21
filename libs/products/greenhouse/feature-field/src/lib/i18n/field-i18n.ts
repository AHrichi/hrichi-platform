import { computed, inject, Injectable } from '@angular/core';
import { PreferencesStore, type SiteLanguage } from '@ah/shared/state';
import { AR } from './copy.ar';
import { EN, type FieldCopy } from './copy.en';
import { FR } from './copy.fr';

/** The languages the field app speaks; Arabic first, for the supervisors. */
export const FIELD_LANGUAGES: readonly { id: SiteLanguage; label: string }[] = [
  { id: 'ar', label: 'ع' },
  { id: 'fr', label: 'FR' },
  { id: 'en', label: 'EN' },
];

// Italian and German readers of the portfolio get English.
const COPY: Record<SiteLanguage, FieldCopy> = {
  ar: AR,
  fr: FR,
  en: EN,
  it: EN,
  de: EN,
};

/** Arabic keeps Latin digits, as on the farm's scales and badges. */
const LOCALES: Record<SiteLanguage, string> = {
  ar: 'ar-TN-u-nu-latn',
  fr: 'fr-TN',
  en: 'en-GB',
  it: 'en-GB',
  de: 'en-GB',
};

/** Fills `{name}` placeholders. */
export function fill(
  template: string,
  values: Record<string, string | number>,
): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? String(values[key]) : match,
  );
}

/**
 * The field app's words in the user's language, from the platform's
 * PreferencesStore (which also sets `lang` and `dir` on the page).
 */
@Injectable({ providedIn: 'root' })
export class FieldI18n {
  private readonly preferences = inject(PreferencesStore);

  readonly lang = this.preferences.language;
  readonly isRtl = this.preferences.isRtl;
  readonly t = computed(() => COPY[this.lang()]);
  readonly locale = computed(() => LOCALES[this.lang()]);

  setLanguage(lang: SiteLanguage): void {
    this.preferences.setLanguage(lang);
  }

  fill = fill;

  /** A number in the reader's locale, with at most `digits` decimals. */
  num(value: number, digits = 0): string {
    return new Intl.NumberFormat(this.locale(), {
      maximumFractionDigits: digits,
    }).format(value);
  }

  /** `14:05` on the farm's clock. */
  time(iso: string | null): string {
    if (!iso) return '';
    return new Intl.DateTimeFormat(this.locale(), {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      timeZone: 'Africa/Tunis',
    }).format(new Date(iso));
  }

  /** `Monday 23 November` */
  day(date: string): string {
    return new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00Z`));
  }
}
