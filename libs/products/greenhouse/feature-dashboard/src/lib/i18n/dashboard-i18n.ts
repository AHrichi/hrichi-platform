import { computed, inject, Injectable } from '@angular/core';
import { PreferencesStore, type SiteLanguage } from '@ah/shared/state';
import { AR } from './copy.ar';
import { type DashboardCopy, EN } from './copy.en';
import { FR } from './copy.fr';

export const DASHBOARD_LANGUAGES: readonly {
  id: SiteLanguage;
  label: string;
}[] = [
  { id: 'fr', label: 'FR' },
  { id: 'ar', label: 'ع' },
  { id: 'en', label: 'EN' },
];

// Italian and German readers of the portfolio get English.
const COPY: Record<SiteLanguage, DashboardCopy> = {
  ar: AR,
  fr: FR,
  en: EN,
  it: EN,
  de: EN,
};

/**
 * Arabic keeps Latin digits, as farm records do, and the international
 * separators: ar-TN groups thousands with a point, which reads like
 * millimes (60.970).
 */
const LOCALES: Record<SiteLanguage, string> = {
  ar: 'ar-u-nu-latn',
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

/** The dashboard's words and number formats in the site's language. */
@Injectable({ providedIn: 'root' })
export class DashboardI18n {
  private readonly preferences = inject(PreferencesStore);

  readonly lang = this.preferences.language;
  readonly isRtl = this.preferences.isRtl;
  readonly t = computed(() => COPY[this.lang()]);
  readonly locale = computed(() => LOCALES[this.lang()]);

  readonly fill = fill;

  setLanguage(lang: SiteLanguage): void {
    this.preferences.setLanguage(lang);
  }

  num(value: number, digits = 0): string {
    return new Intl.NumberFormat(this.locale(), {
      maximumFractionDigits: digits,
    }).format(value);
  }

  /** `Mon 23` */
  shortDay(date: string): string {
    return new Intl.DateTimeFormat(this.locale(), {
      weekday: 'short',
      day: 'numeric',
      timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00Z`));
  }

  /** `Monday 23 November` */
  longDay(date: string): string {
    return new Intl.DateTimeFormat(this.locale(), {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00Z`));
  }

  /** `23 November 2026` */
  date(date: string): string {
    return new Intl.DateTimeFormat(this.locale(), {
      dateStyle: 'long',
      timeZone: 'UTC',
    }).format(new Date(`${date}T12:00:00Z`));
  }
}
