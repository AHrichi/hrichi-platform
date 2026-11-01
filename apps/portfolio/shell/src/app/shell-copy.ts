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
};

/**
 * Pages written in all three languages. Every other page is English only:
 * it keeps lang="en" and left-to-right layout whatever the site language.
 */
export function isTranslatedPage(url: string): boolean {
  const path = url.split(/[?#]/)[0];
  return path === '/apps' || path.startsWith('/apps/lighting');
}
