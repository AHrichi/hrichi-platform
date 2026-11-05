import { computed, inject, Injectable } from '@angular/core';
import { PreferencesStore, type SiteLanguage } from '@ah/shared/state';
import type { PackingItem } from '@ah/products/basecamp/domain';
import { AR } from './copy.ar';
import { DE } from './copy.de';
import { type BasecampCopy, EN } from './copy.en';
import { FR } from './copy.fr';
import { IT } from './copy.it';

const COPY: Record<SiteLanguage, BasecampCopy> = {
  en: EN,
  fr: FR,
  ar: AR,
  it: IT,
  de: DE,
};

/** Arabic keeps Latin digits, as LuxPath does, so numbers read the same. */
const LOCALES: Record<SiteLanguage, string> = {
  en: 'en-GB',
  fr: 'fr-FR',
  ar: 'ar-u-nu-latn',
  it: 'it-IT',
  de: 'de-DE',
};

/**
 * Basecamp's words in the site's language, set once for every app by the
 * shell's switch (or the standalone app's) through PreferencesStore.
 */
@Injectable({ providedIn: 'root' })
export class BasecampI18n {
  private readonly preferences = inject(PreferencesStore);

  readonly lang = this.preferences.language;
  readonly isRtl = this.preferences.isRtl;
  readonly t = computed(() => COPY[this.lang()]);
  readonly locale = computed(() => LOCALES[this.lang()]);

  setLanguage(lang: SiteLanguage): void {
    this.preferences.setLanguage(lang);
  }

  /** A number in the reader's locale, with at most `digits` decimals. */
  num(value: number, digits = 0): string {
    return new Intl.NumberFormat(this.locale(), {
      maximumFractionDigits: digits,
    }).format(value);
  }

  /** `Sat 7 Nov` */
  day(iso: string): string {
    return new Intl.DateTimeFormat(this.locale(), {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      timeZone: 'UTC',
    }).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));
  }

  /** `7 Nov 2026` */
  date(iso: string): string {
    return new Intl.DateTimeFormat(this.locale(), {
      dateStyle: 'medium',
      timeZone: 'UTC',
    }).format(new Date(`${iso.slice(0, 10)}T12:00:00Z`));
  }

  /** `21:40`, in the campsite's zone when known, else the reader's. */
  time(date: Date | null, timeZone?: string): string {
    if (!date) return '—';
    return new Intl.DateTimeFormat(this.locale(), {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
      ...(timeZone ? { timeZone } : {}),
    }).format(date);
  }

  /** A packing item's name: the list's word for it, or the user's label. */
  itemName(item: Pick<PackingItem, 'key' | 'label'>): string {
    return (item.key && this.t().items[item.key]) || item.label || '';
  }
}
