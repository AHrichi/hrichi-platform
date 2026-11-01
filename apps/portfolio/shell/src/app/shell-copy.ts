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
