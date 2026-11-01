import { computed, inject, Injectable } from '@angular/core';
import { PreferencesStore, type SiteLanguage } from '@ah/shared/state';
import type { CalcNote } from '@ah/products/lighting/domain';
import { AR } from './copy.ar';
import { EN, type LuxPathCopy } from './copy.en';
import { FR } from './copy.fr';

const COPY: Record<SiteLanguage, LuxPathCopy> = { en: EN, fr: FR, ar: AR };

/**
 * Arabic keeps Latin digits and a decimal point, as engineering documents
 * in the Maghreb do, so results match what the number fields show.
 */
const LOCALES: Record<SiteLanguage, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  ar: 'ar-u-nu-latn',
};

/**
 * LuxPath's words in the site's language: the shell's switch (or the
 * standalone app's) sets it once for every app (PreferencesStore).
 */
@Injectable({ providedIn: 'root' })
export class LuxPathI18n {
  private readonly preferences = inject(PreferencesStore);

  readonly lang = this.preferences.language;
  readonly isRtl = this.preferences.isRtl;
  readonly t = computed(() => COPY[this.lang()]);
  readonly locale = computed(() => LOCALES[this.lang()]);
  /** The shared map picker's words. */
  readonly mapLabels = computed(() => ({
    ...this.t().mapPicker,
    noGps: this.t().map.noGps,
  }));

  setLanguage(lang: SiteLanguage): void {
    this.preferences.setLanguage(lang);
  }

  /** A number in the reader's locale, with at most `digits` decimals. */
  num(value: number, digits = 1): string {
    return new Intl.NumberFormat(this.locale(), {
      maximumFractionDigits: digits,
    }).format(value);
  }

  /** Euros: whole when round, with cents otherwise (cable is €1.40 a metre). */
  money(value: number): string {
    const cents = !Number.isInteger(Math.round(value * 100) / 100);
    return new Intl.NumberFormat(this.locale(), {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: cents ? 2 : 0,
      maximumFractionDigits: cents ? 2 : 0,
    }).format(value);
  }

  /**
   * Isolates a translated word inside a left-to-right formula or drawing
   * label, so an Arabic word next to a number keeps its place.
   */
  word(text: string): string {
    return `\u2068${text}\u2069`;
  }

  date(iso: string): string {
    const date = new Date(iso.length === 10 ? `${iso}T12:00:00` : iso);
    return Number.isNaN(date.getTime())
      ? iso
      : new Intl.DateTimeFormat(this.locale(), { dateStyle: 'medium' }).format(
          date,
        );
  }

  /** A calculation's finding as a sentence; numbers in the reader's locale. */
  note(note: CalcNote): string {
    const write = this.t().notes[note.code];
    if (!write) {
      return note.code;
    }
    const values: Record<string, string> = {};
    for (const [key, value] of Object.entries(note.values ?? {})) {
      values[key] = typeof value === 'number' ? this.num(value, 2) : value;
    }
    return write(values, this.t().soils);
  }
}
