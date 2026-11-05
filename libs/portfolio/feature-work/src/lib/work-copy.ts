import type { SiteLanguage } from '@ah/shared/state';

export interface WorkCopy {
  list: {
    eyebrow: string;
    heading: string;
    lead: string;
    hubEyebrow: string;
    hubTitle: string;
    hubText: string;
    hubAction: string;
  };
  detail: {
    backToAll: string;
    metaRole: string;
    metaStack: string;
    context: string;
    problem: string;
    decisions: string;
    outcome: string;
    links: string;
    nextStudy: string;
    notFoundTitle: string;
    notFoundText: string;
    notFoundLink: string;
  };
}

export const WORK_COPY: Record<SiteLanguage, WorkCopy> = {
  en: {
    list: {
      eyebrow: 'Work',
      heading: 'Case studies',
      lead: 'The problem, the decisions I made and why, and what changed. Client work stays at the level of my CV: no client code or data.',
      hubEyebrow: 'Interactive Platforms',
      hubTitle: 'Looking for live runnable applications and labs?',
      hubText:
        'Explore PulseOps (commercial logistics & dispatch), StrategyApp (wealth projection engine), Sky Lab (3D planetarium), and our RxJS and NgRx architecture workbenches in our dedicated hub.',
      hubAction: 'Explore Apps & Labs →',
    },
    detail: {
      backToAll: 'All case studies',
      metaRole: 'Role',
      metaStack: 'Stack',
      context: 'Context',
      problem: 'The problem',
      decisions: 'Decisions and why',
      outcome: 'Outcome',
      links: 'Links',
      nextStudy: 'Next case study',
      notFoundTitle: 'Case study not found',
      notFoundText: 'There’s no case study at this address.',
      notFoundLink: 'See all case studies',
    },
  },
  fr: {
    list: {
      eyebrow: 'Réalisations',
      heading: 'Études de cas',
      lead: 'La problématique, les décisions architecturales et l’impact mesurable. Les travaux clients restent décrits au niveau du CV, sans données confidentielles.',
      hubEyebrow: 'Plateformes interactives',
      hubTitle: 'Vous cherchez des applications et laboratoires interactifs ?',
      hubText:
        'Explorez PulseOps (logistique commerciale & dispatch), StrategyApp (simulateur financier), Sky Lab (planétarium 3D) ainsi que nos bancs d’essai RxJS et NgRx dans notre catalogue dédié.',
      hubAction: 'Explorer les Apps & Labs →',
    },
    detail: {
      backToAll: 'Toutes les études de cas',
      metaRole: 'Rôle',
      metaStack: 'Technologies',
      context: 'Contexte',
      problem: 'La problématique',
      decisions: 'Arbitrages techniques et raisons',
      outcome: 'Résultats et impact',
      links: 'Liens utiles',
      nextStudy: 'Étude de cas suivante',
      notFoundTitle: 'Étude de cas introuvable',
      notFoundText: 'Aucune étude de cas ne correspond à cette adresse.',
      notFoundLink: 'Voir toutes les études de cas',
    },
  },
  ar: {
    list: {
      eyebrow: 'الأعمال',
      heading: 'دراسات الحالة',
      lead: 'المشكلة الهندسية، والقرارات المعمارية وأسبابها، والنتائج المحققة. أعمال العملاء موصوفة بمستوى السيرة الذاتية دون بيانات أو شيفرات سرية.',
      hubEyebrow: 'منصات تفاعلية حية',
      hubTitle: 'هل تبحث عن تطبيقات عملية وتجارب حية قابلة للتشغيل؟',
      hubText:
        'استكشف PulseOps (إدارة العمليات اللوجستية والتوجيه التجاري)، وStrategyApp (محرك المحاكاة المالية)، وSky Lab (القبة الفلكية ثلاثية الأبعاد)، ومختبرات RxJS وNgRx في مركزنا المتخصص.',
      hubAction: 'استكشاف التطبيقات والمختبرات ←',
    },
    detail: {
      backToAll: 'كافة دراسات الحالة',
      metaRole: 'الدور',
      metaStack: 'حزمة التقنيات',
      context: 'السياق العام',
      problem: 'المشكلة والدافع',
      decisions: 'القرارات المعمارية وأسبابها',
      outcome: 'النتائج المحققة',
      links: 'روابط مرجعية',
      nextStudy: 'دراسة الحالة التالية',
      notFoundTitle: 'دراسة الحالة غير موجودة',
      notFoundText: 'لا توجد دراسة حالة مسجلة على هذا العنوان.',
      notFoundLink: 'استعراض كافة دراسات الحالة',
    },
  },
  it: {
    list: {
      eyebrow: 'Progetti',
      heading: 'Casi studio',
      lead: 'Il problema, le scelte architetturali adottate e l’impatto generato. I progetti per clienti rimangono descritti a livello di CV, senza dati riservati.',
      hubEyebrow: 'Piattaforme interattive',
      hubTitle: 'Cerchi applicazioni e laboratori eseguibili dal vivo?',
      hubText:
        'Esplora PulseOps (logistica commerciale e dispatch), StrategyApp (motore di simulazione patrimoniale), Sky Lab (planetario 3D) e i nostri banchi di prova RxJS e NgRx nel nostro catalogo dedicato.',
      hubAction: 'Esplora App e Laboratori →',
    },
    detail: {
      backToAll: 'Tutti i casi studio',
      metaRole: 'Ruolo',
      metaStack: 'Tecnologie',
      context: 'Contesto',
      problem: 'Il problema',
      decisions: 'Scelte architetturali e motivazioni',
      outcome: 'Risultati e valore',
      links: 'Link e riferimenti',
      nextStudy: 'Caso studio successivo',
      notFoundTitle: 'Caso studio non trovato',
      notFoundText: 'Nessun caso studio disponibile a questo indirizzo.',
      notFoundLink: 'Vedi tutti i casi studio',
    },
  },
  de: {
    list: {
      eyebrow: 'Projekte',
      heading: 'Fallstudien',
      lead: 'Die Problemstellung, die getroffenen Architekturentscheidungen und die messbaren Ergebnisse. Kundenprojekte bleiben auf Lebenslauf-Ebene ohne vertrauliche Daten.',
      hubEyebrow: 'Interaktive Plattformen',
      hubTitle: 'Suchen Sie nach interaktiven, ausführbaren Live-Anwendungen?',
      hubText:
        'Entdecken Sie PulseOps (Gewerbelogistik & Disposition), StrategyApp (Finanz- und Vermögenssimulation), Sky Lab (3D-Planetarium) sowie unsere RxJS- und NgRx-Architektur-Workbenches im zentralen Hub.',
      hubAction: 'Apps & Labs entdecken →',
    },
    detail: {
      backToAll: 'Alle Fallstudien',
      metaRole: 'Rolle',
      metaStack: 'Stack & Technologien',
      context: 'Kontext',
      problem: 'Die Problemstellung',
      decisions: 'Entscheidungen & Begründungen',
      outcome: 'Ergebnisse & Nutzen',
      links: 'Links & Referenzen',
      nextStudy: 'Nächste Fallstudie',
      notFoundTitle: 'Fallstudie nicht gefunden',
      notFoundText: 'Unter dieser Adresse existiert keine Fallstudie.',
      notFoundLink: 'Alle Fallstudien ansehen',
    },
  },
};
