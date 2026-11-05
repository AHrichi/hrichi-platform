import type { SiteLanguage } from '@ah/shared/state';

/** The shell's own words: header, footer and the English-only note. */
export interface ShellCopy {
  skip: string;
  mainNav: string;
  nav: {
    work: string;
    apps: string;
    experience: string;
    services: string;
    contact: string;
  };
  cv: string;
  language: string;
  toLight: string;
  toDark: string;
  email: string;
  source: string;
  designSystem: string;
  hood: string;
  englishOnly: string;
  update: {
    ready: string;
    broken: string;
    reload: string;
    hardReload: string;
    hardReloadHint: string;
    dismiss: string;
  };
}

export const SHELL_COPY: Record<SiteLanguage, ShellCopy> = {
  en: {
    skip: 'Skip to content',
    mainNav: 'Main',
    nav: {
      work: 'Work',
      apps: 'Apps & Labs',
      experience: 'Experience',
      services: 'Services',
      contact: 'Contact',
    },
    cv: 'CV',
    language: 'Language',
    toLight: 'Switch to light mode',
    toDark: 'Switch to dark mode',
    email: 'Email',
    source: 'Source & ADRs',
    designSystem: 'Design system',
    hood: 'Open the hood',
    englishOnly: '',
    update: {
      ready: 'A new version of this site is available.',
      broken:
        'The saved copy of this site is out of date and can’t update in place.',
      reload: 'Reload',
      hardReload: 'Hard reload',
      hardReloadHint:
        'Clears the site’s offline copy, then loads everything fresh.',
      dismiss: 'Dismiss',
    },
  },
  fr: {
    skip: 'Aller au contenu',
    mainNav: 'Principale',
    nav: {
      work: 'Réalisations',
      apps: 'Applications',
      experience: 'Expérience',
      services: 'Services',
      contact: 'Contact',
    },
    cv: 'CV',
    language: 'Langue',
    toLight: 'Passer en mode clair',
    toDark: 'Passer en mode sombre',
    email: 'E-mail',
    source: 'Code source et ADR',
    designSystem: 'Design system',
    hood: 'Sous le capot',
    englishOnly: 'Cette page n’existe qu’en anglais pour l’instant.',
    update: {
      ready: 'Une nouvelle version du site est disponible.',
      broken:
        'La copie enregistrée du site est périmée et ne peut pas se mettre à jour.',
      reload: 'Recharger',
      hardReload: 'Rechargement complet',
      hardReloadHint:
        'Efface la copie hors ligne du site, puis recharge tout depuis le réseau.',
      dismiss: 'Fermer',
    },
  },
  ar: {
    skip: 'الانتقال إلى المحتوى',
    mainNav: 'القائمة الرئيسية',
    nav: {
      work: 'الأعمال',
      apps: 'التطبيقات والمختبرات',
      experience: 'الخبرة',
      services: 'الخدمات',
      contact: 'تواصل',
    },
    cv: 'السيرة الذاتية',
    language: 'اللغة',
    toLight: 'التبديل إلى الوضع الفاتح',
    toDark: 'التبديل إلى الوضع الداكن',
    email: 'البريد',
    source: 'الشيفرة المصدرية وADR',
    designSystem: 'نظام التصميم',
    hood: 'نظرة من الداخل',
    englishOnly: 'هذه الصفحة متاحة بالإنجليزية فقط حاليًا.',
    update: {
      ready: 'يتوفر إصدار جديد من هذا الموقع.',
      broken: 'النسخة المحفوظة من الموقع قديمة ولا يمكن تحديثها تلقائيًا.',
      reload: 'إعادة التحميل',
      hardReload: 'إعادة تحميل كاملة',
      hardReloadHint: 'تمسح النسخة المحفوظة للموقع ثم تحمّل كل شيء من جديد.',
      dismiss: 'إغلاق',
    },
  },
  it: {
    skip: 'Salta al contenuto',
    mainNav: 'Menu principale',
    nav: {
      work: 'Progetti',
      apps: 'App e Laboratori',
      experience: 'Esperienza',
      services: 'Servizi',
      contact: 'Contatti',
    },
    cv: 'CV',
    language: 'Lingua',
    toLight: 'Passa alla modalità chiara',
    toDark: 'Passa alla modalità scura',
    email: 'Email',
    source: 'Codice sorgente e ADR',
    designSystem: 'Design system',
    hood: 'Sotto il cofano',
    englishOnly: 'Questa pagina è disponibile solo in inglese per il momento.',
    update: {
      ready: 'È disponibile una nuova versione di questo sito.',
      broken:
        'La copia salvata di questo sito non è aggiornata e non può essere aggiornata automaticamente.',
      reload: 'Ricarica',
      hardReload: 'Ricarica completa',
      hardReloadHint:
        'Cancella la copia offline del sito e ricarica tutto da capo.',
      dismiss: 'Chiudi',
    },
  },
  de: {
    skip: 'Zum Inhalt springen',
    mainNav: 'Hauptnavigation',
    nav: {
      work: 'Projekte',
      apps: 'Apps & Labs',
      experience: 'Erfahrung',
      services: 'Leistungen',
      contact: 'Kontakt',
    },
    cv: 'Lebenslauf',
    language: 'Sprache',
    toLight: 'Zum hellen Modus wechseln',
    toDark: 'Zum dunklen Modus wechseln',
    email: 'E-Mail',
    source: 'Quellcode & ADRs',
    designSystem: 'Design-System',
    hood: 'Hinter den Kulissen',
    englishOnly: 'Diese Seite ist derzeit nur auf Englisch verfügbar.',
    update: {
      ready: 'Eine neue Version dieser Website ist verfügbar.',
      broken:
        'Die gespeicherte Version dieser Website ist veraltet und kann nicht direkt aktualisiert werden.',
      reload: 'Neu laden',
      hardReload: 'Vollständig neu laden',
      hardReloadHint:
        'Löscht die Offline-Kopie der Website und lädt alles neu.',
      dismiss: 'Schließen',
    },
  },
};

/**
 * Pages written in all supported languages (the apps page, LuxPath, Basecamp, Alarm Engine). Every other page is English only:
 * it keeps lang="en" and left-to-right layout whatever the site language.
 */
export function isTranslatedPage(url: string): boolean {
  const path = url.split(/[?#]/)[0];
  return (
    path === '/apps' ||
    path.startsWith('/apps/lighting') ||
    path.startsWith('/apps/basecamp') ||
    path.startsWith('/apps/alarm-engine')
  );
}
