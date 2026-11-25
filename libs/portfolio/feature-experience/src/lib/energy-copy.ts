import type { SiteLanguage } from '@ah/shared/state';

/** The /energy page's own words; the facts come from @ah/shared/content. */
export interface EnergyCopy {
  eyebrow: string;
  heading: string;
  cvButton: string;
  pdfButton: string;
  degreeHeading: string;
  rolesHeading: string;
  projectsHeading: string;
  projectsLead: string;
  methods: string;
  /** Followed by the app's name: "Open SerraCalc". */
  open: string;
  skillsHeading: string;
}

export const ENERGY_COPY: Record<SiteLanguage, EnergyCopy> = {
  en: {
    eyebrow: 'Energy engineering',
    heading: 'An energy engineer who builds the tools',
    cvButton: 'Energy engineering CV',
    pdfButton: 'Download the PDF',
    degreeHeading: 'Degree',
    rolesHeading: 'Roles I’m open to',
    projectsHeading: 'Engineering projects',
    projectsLead:
      'Two field apps in this portfolio put the degree to work. Each screen shows how its result is worked out, with the current numbers in every formula.',
    methods: 'Methods and standards',
    open: 'Open',
    skillsHeading: 'Energy engineering skills',
  },
  fr: {
    eyebrow: 'Génie énergétique',
    heading: 'Un ingénieur énergéticien qui construit ses outils',
    cvButton: 'CV ingénieur énergéticien',
    pdfButton: 'Télécharger le PDF',
    degreeHeading: 'Diplôme',
    rolesHeading: 'Postes recherchés',
    projectsHeading: 'Projets d’ingénierie',
    projectsLead:
      'Deux applications de terrain de ce portfolio mettent le diplôme en pratique. Chaque écran montre comment son résultat est obtenu, avec les valeurs en cours dans chaque formule.',
    methods: 'Méthodes et normes',
    open: 'Ouvrir',
    skillsHeading: 'Compétences en génie énergétique',
  },
  ar: {
    eyebrow: 'الهندسة الطاقية',
    heading: 'مهندس طاقة يبني أدواته بنفسه',
    cvButton: 'السيرة الذاتية لمهندس الطاقة',
    pdfButton: 'تحميل ملف PDF',
    degreeHeading: 'الشهادة',
    rolesHeading: 'الوظائف التي أبحث عنها',
    projectsHeading: 'مشاريع هندسية',
    projectsLead:
      'تطبيقان ميدانيان في هذا الموقع يضعان الشهادة موضع التطبيق. كل شاشة تبيّن كيف تُحسب نتيجتها، مع الأرقام الحالية في كل معادلة.',
    methods: 'الطرق والمعايير',
    open: 'فتح',
    skillsHeading: 'مهارات الهندسة الطاقية',
  },
  it: {
    eyebrow: 'Ingegneria energetica',
    heading: 'Un ingegnere energetico che costruisce i propri strumenti',
    cvButton: 'CV ingegnere energetico',
    pdfButton: 'Scarica il PDF',
    degreeHeading: 'Titolo di studio',
    rolesHeading: 'Ruoli che cerco',
    projectsHeading: 'Progetti di ingegneria',
    projectsLead:
      'Due app da campo di questo portfolio mettono in pratica la laurea. Ogni schermata mostra come si ottiene il risultato, con i valori attuali in ogni formula.',
    methods: 'Metodi e norme',
    open: 'Apri',
    skillsHeading: 'Competenze di ingegneria energetica',
  },
  de: {
    eyebrow: 'Energietechnik',
    heading: 'Ein Energieingenieur, der seine Werkzeuge selbst baut',
    cvButton: 'Lebenslauf Energietechnik',
    pdfButton: 'PDF herunterladen',
    degreeHeading: 'Abschluss',
    rolesHeading: 'Gesuchte Positionen',
    projectsHeading: 'Ingenieurprojekte',
    projectsLead:
      'Zwei Feld-Apps dieses Portfolios setzen das Studium in die Praxis um. Jeder Bildschirm zeigt, wie sein Ergebnis zustande kommt, mit den aktuellen Werten in jeder Formel.',
    methods: 'Methoden und Normen',
    open: 'Öffnen',
    skillsHeading: 'Kompetenzen Energietechnik',
  },
};
