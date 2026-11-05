import type { SiteLanguage } from '@ah/shared/state';

export interface CvCopy {
  downloadPdf: string;
  print: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  languages: string;
}

export const CV_COPY: Record<SiteLanguage, CvCopy> = {
  en: {
    downloadPdf: 'Download PDF',
    print: 'Print',
    summary: 'Summary',
    skills: 'Skills',
    experience: 'Experience',
    education: 'Education',
    languages: 'Languages',
  },
  fr: {
    downloadPdf: 'Télécharger le PDF',
    print: 'Imprimer',
    summary: 'Profil professionnel',
    skills: 'Compétences clés',
    experience: 'Expérience professionnelle',
    education: 'Formation',
    languages: 'Langues',
  },
  ar: {
    downloadPdf: 'تحميل ملف PDF',
    print: 'طباعة',
    summary: 'الملخص المهني',
    skills: 'المهارات التقنية',
    experience: 'الخبرة المهنية',
    education: 'التعليم والشهادات',
    languages: 'اللغات',
  },
  it: {
    downloadPdf: 'Scarica PDF',
    print: 'Stampa',
    summary: 'Profilo professionale',
    skills: 'Competenze',
    experience: 'Esperienza',
    education: 'Istruzione',
    languages: 'Lingue',
  },
  de: {
    downloadPdf: 'PDF herunterladen',
    print: 'Drucken',
    summary: 'Profil & Zusammenfassung',
    skills: 'Kompetenzen',
    experience: 'Berufserfahrung',
    education: 'Ausbildung & Studium',
    languages: 'Sprachen',
  },
};
