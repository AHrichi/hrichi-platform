import type { SiteLanguage } from '@ah/shared/state';

export interface ExperienceCopy {
  eyebrow: string;
  heading: string;
  cvButton: string;
  skillsHeading: string;
  educationHeading: string;
  languagesHeading: string;
}

export const EXPERIENCE_COPY: Record<SiteLanguage, ExperienceCopy> = {
  en: {
    eyebrow: 'Experience',
    heading: 'Where I’ve worked',
    cvButton: 'Printable CV & PDF',
    skillsHeading: 'Skills',
    educationHeading: 'Education',
    languagesHeading: 'Languages',
  },
  fr: {
    eyebrow: 'Expérience',
    heading: 'Mon parcours professionnel',
    cvButton: 'CV imprimable & PDF',
    skillsHeading: 'Compétences clés',
    educationHeading: 'Formation académique',
    languagesHeading: 'Langues',
  },
  ar: {
    eyebrow: 'الخبرة المهنية',
    heading: 'محطات مسيرتي المهنية',
    cvButton: 'نسخة السيرة الذاتية وPDF',
    skillsHeading: 'المهارات التقنية',
    educationHeading: 'التعليم الأكاديمي',
    languagesHeading: 'اللغات',
  },
  it: {
    eyebrow: 'Esperienza',
    heading: 'Dove ho lavorato',
    cvButton: 'CV stampabile & PDF',
    skillsHeading: 'Competenze tecniche',
    educationHeading: 'Istruzione e titoli',
    languagesHeading: 'Lingue',
  },
  de: {
    eyebrow: 'Berufserfahrung',
    heading: 'Bisherige Stationen',
    cvButton: 'Druckbarer Lebenslauf & PDF',
    skillsHeading: 'Kompetenzen & Skills',
    educationHeading: 'Ausbildung & Studium',
    languagesHeading: 'Sprachen',
  },
};
