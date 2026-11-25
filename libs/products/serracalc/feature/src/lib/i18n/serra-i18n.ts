import { computed, inject, Injectable } from '@angular/core';
import { PreferencesStore, type SiteLanguage } from '@ah/shared/state';
import type { CalcNote, Currency } from '@ah/products/serracalc/domain';
import { AR } from './copy.ar';
import { DE } from './copy.de';
import { EN, type SerraCopy } from './copy.en';
import { FR } from './copy.fr';
import { IT } from './copy.it';

/** The languages SerraCalc speaks: the portfolio's five. */
export const SERRA_LANGUAGES: readonly { id: SiteLanguage; label: string }[] = [
  { id: 'fr', label: 'FR' },
  { id: 'ar', label: 'ع' },
  { id: 'en', label: 'EN' },
  { id: 'it', label: 'IT' },
  { id: 'de', label: 'DE' },
];

const COPY: Record<SiteLanguage, SerraCopy> = {
  en: EN,
  fr: FR,
  ar: AR,
  it: IT,
  de: DE,
};

/**
 * Arabic keeps Latin digits and a decimal point, as engineering documents in
 * the Maghreb do, so results match what the number fields show.
 */
const LOCALES: Record<SiteLanguage, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  ar: 'ar-u-nu-latn',
  it: 'it-IT',
  de: 'de-DE',
};

/** Left-to-right isolate and its pop, to keep a unit whole in Arabic. */
const LRI = String.fromCharCode(0x2066);
const PDI = String.fromCharCode(0x2069);

/** Note values that hold a month (0–11), written as the month's name. */
const MONTH_VALUES = new Set(['month', 'peak']);

/**
 * SerraCalc's words in the site's language: the shell's switch (or the
 * standalone app's) sets it once for every app (PreferencesStore).
 */
@Injectable({ providedIn: 'root' })
export class SerraI18n {
  private readonly preferences = inject(PreferencesStore);

  readonly lang = this.preferences.language;
  readonly isRtl = this.preferences.isRtl;
  readonly t = computed(() => COPY[this.lang()]);
  readonly locale = computed(() => LOCALES[this.lang()]);

  setLanguage(lang: SiteLanguage): void {
    this.preferences.setLanguage(lang);
  }

  /** A number in the reader's locale, with at most `digits` decimals. */
  num(value: number, digits = 1): string {
    return new Intl.NumberFormat(this.locale(), {
      maximumFractionDigits: digits,
    }).format(value);
  }

  /** Money in the project's currency, whole when large. */
  money(value: number, currency: Currency): string {
    const small = Math.abs(value) < 100;
    return new Intl.NumberFormat(this.locale(), {
      style: 'currency',
      currency,
      currencyDisplay: 'narrowSymbol',
      minimumFractionDigits: small ? 2 : 0,
      maximumFractionDigits: small ? 2 : 0,
    }).format(value);
  }

  /**
   * Isolates a translated word inside a left-to-right formula or drawing
   * label, so an Arabic word next to a number keeps its place.
   */
  word(text: string): string {
    return `⁨${text}⁩`;
  }

  /**
   * A unit (°C, m³/d…) kept whole inside right-to-left text: without the
   * isolate, Arabic turns "°C" into "C°".
   */
  unit(text: string): string {
    return `${LRI}${text}${PDI}`;
  }

  date(iso: string): string {
    const date = new Date(iso);
    return Number.isNaN(date.getTime())
      ? iso
      : new Intl.DateTimeFormat(this.locale(), { dateStyle: 'medium' }).format(
          date,
        );
  }

  month(index: number): string {
    return this.t().months[index] ?? String(index + 1);
  }

  /** A calculation's finding as a sentence; numbers in the reader's locale. */
  note(note: CalcNote): string {
    const write = this.t().notes[note.code];
    if (!write) {
      return note.code;
    }
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(note.values ?? {})) {
      if (MONTH_VALUES.has(key) && typeof value === 'number') {
        values[key] = this.month(value);
      } else {
        values[key] = typeof value === 'number' ? this.num(value, 2) : value;
      }
    }
    return write(values);
  }
}
