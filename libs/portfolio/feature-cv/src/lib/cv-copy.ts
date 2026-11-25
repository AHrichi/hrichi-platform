import type { SiteLanguage } from '@ah/shared/state';

export interface CvCopy {
  downloadPdf: string;
  print: string;
  summary: string;
  skills: string;
  experience: string;
  education: string;
  languages: string;
  /** Energy CV: the engineering projects and the methods they follow. */
  projects: string;
  methods: string;
  /** Energy CV: the software roles, told briefly. */
  softwareExperience: string;
  /** The link from each CV to the other. */
  toEnergyCv: string;
  toSoftwareCv: string;
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
    projects: 'Engineering projects',
    methods: 'Methods & standards',
    softwareExperience: 'Software engineering experience',
    toEnergyCv: 'Energy engineering CV',
    toSoftwareCv: 'Software developer CV',
  },
  fr: {
    downloadPdf: 'Télécharger le PDF',
    print: 'Imprimer',
    summary: 'Profil professionnel',
    skills: 'Compétences clés',
    experience: 'Expérience professionnelle',
    education: 'Formation',
    languages: 'Langues',
    projects: 'Projets d’ingénierie',
    methods: 'Méthodes & normes',
    softwareExperience: 'Expérience en développement logiciel',
    toEnergyCv: 'CV ingénieur énergéticien',
    toSoftwareCv: 'CV développeur logiciel',
  },
  ar: {
    downloadPdf: 'تحميل ملف PDF',
    print: 'طباعة',
    summary: 'الملخص المهني',
    skills: 'المهارات التقنية',
    experience: 'الخبرة المهنية',
    education: 'التعليم والشهادات',
    languages: 'اللغات',
    projects: 'مشاريع هندسية',
    methods: 'الطرق والمعايير',
    softwareExperience: 'الخبرة في تطوير البرمجيات',
    toEnergyCv: 'السيرة الذاتية لمهندس الطاقة',
    toSoftwareCv: 'السيرة الذاتية لمطوّر البرمجيات',
  },
  it: {
    downloadPdf: 'Scarica PDF',
    print: 'Stampa',
    summary: 'Profilo professionale',
    skills: 'Competenze',
    experience: 'Esperienza',
    education: 'Istruzione',
    languages: 'Lingue',
    projects: 'Progetti di ingegneria',
    methods: 'Metodi & norme',
    softwareExperience: 'Esperienza nello sviluppo software',
    toEnergyCv: 'CV ingegnere energetico',
    toSoftwareCv: 'CV sviluppatore software',
  },
  de: {
    downloadPdf: 'PDF herunterladen',
    print: 'Drucken',
    summary: 'Profil & Zusammenfassung',
    skills: 'Kompetenzen',
    experience: 'Berufserfahrung',
    education: 'Ausbildung & Studium',
    languages: 'Sprachen',
    projects: 'Ingenieurprojekte',
    methods: 'Methoden & Normen',
    softwareExperience: 'Erfahrung in der Softwareentwicklung',
    toEnergyCv: 'Lebenslauf Energietechnik',
    toSoftwareCv: 'Lebenslauf Softwareentwicklung',
  },
};
