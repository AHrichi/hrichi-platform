/** The languages the platform speaks (as `SiteLanguage` in @ah/shared/state). */
export type TourLanguage = 'en' | 'fr' | 'ar' | 'it' | 'de';

/** The card's own buttons and progress, the same in every app. */
export interface TourCopy {
  readonly next: string;
  readonly back: string;
  readonly finish: string;
  readonly close: string;
  readonly progress: (step: number, total: number) => string;
}

export const TOUR_COPY: Readonly<Record<TourLanguage, TourCopy>> = {
  en: {
    next: 'Next',
    back: 'Back',
    finish: 'Finish',
    close: 'Close the tour',
    progress: (step, total) => `Step ${step} of ${total}`,
  },
  fr: {
    next: 'Suivant',
    back: 'Retour',
    finish: 'Terminer',
    close: 'Fermer la visite',
    progress: (step, total) => `Étape ${step} sur ${total}`,
  },
  ar: {
    next: 'التالي',
    back: 'السابق',
    finish: 'إنهاء',
    close: 'إغلاق الجولة',
    progress: (step, total) => `الخطوة ${step} من ${total}`,
  },
  it: {
    next: 'Avanti',
    back: 'Indietro',
    finish: 'Fine',
    close: 'Chiudi il tour',
    progress: (step, total) => `Passo ${step} di ${total}`,
  },
  de: {
    next: 'Weiter',
    back: 'Zurück',
    finish: 'Fertig',
    close: 'Tour schließen',
    progress: (step, total) => `Schritt ${step} von ${total}`,
  },
};

/** The copy for a language, English for one the platform doesn't speak. */
export function tourCopy(lang: string): TourCopy {
  return TOUR_COPY[lang as TourLanguage] ?? TOUR_COPY.en;
}
