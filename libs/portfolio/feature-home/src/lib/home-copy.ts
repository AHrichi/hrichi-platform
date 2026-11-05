import type { SiteLanguage } from '@ah/shared/state';

export interface HomeCopy {
  viewAs: string;
  viewAsLabel: string;
  facts: {
    basedIn: string;
    works: string;
    now: string;
    at: string;
  };
  work: {
    eyebrow: string;
    heading: string;
    lead: string;
    allLink: string;
  };
  services: {
    eyebrow: string;
    heading: string;
    allLink: string;
  };
  experience: {
    eyebrow: string;
    heading: string;
    fullLink: string;
    cvLink: string;
  };
  platform: {
    eyebrow: string;
    heading: string;
    lead: string;
    cards: {
      mfeTitle: string;
      mfeText: string;
      zonelessTitle: string;
      zonelessText: string;
      prerenderTitle: string;
      prerenderText: string;
      cspTitle: string;
      cspText: string;
    };
    links: {
      apps: string;
      howBuilt: string;
      source: string;
      designSystem: string;
    };
  };
}

export const HOME_COPY: Record<SiteLanguage, HomeCopy> = {
  en: {
    viewAs: 'View as',
    viewAsLabel: 'View this site as',
    facts: {
      basedIn: 'Based in',
      works: 'Works',
      now: 'Now',
      at: 'at',
    },
    work: {
      eyebrow: 'Selected work',
      heading: 'Case studies',
      lead: 'What I built, the decisions behind it and what changed.',
      allLink: 'All case studies',
    },
    services: {
      eyebrow: 'Freelance',
      heading: 'How I can help',
      allLink: 'All services and how I work',
    },
    experience: {
      eyebrow: 'Experience',
      heading: '5+ years of Angular, from v12 to v22',
      fullLink: 'Full experience',
      cvLink: 'CV',
    },
    platform: {
      eyebrow: 'Open the hood',
      heading: 'This site is the proof',
      lead: 'Built the way I would build a client’s platform, with every decision written down.',
      cards: {
        mfeTitle: 'Micro-frontends',
        mfeText:
          'Native Federation remotes, deployed on their own, each with a fallback if it’s down.',
        zonelessTitle: 'Zoneless Angular 22',
        zonelessText: 'Signals and NgRx SignalStore, no zone.js in any bundle.',
        prerenderTitle: 'Prerendered & offline',
        prerenderText: 'Real HTML from a CDN, then a PWA that works offline.',
        cspTitle: 'Strict CSP, $0 hosting',
        cspText: 'Hash-based security policy, deployed to Cloudflare by CI.',
      },
      links: {
        apps: 'Explore Apps & Labs →',
        howBuilt: 'How it’s built',
        source: 'Source and ADRs on GitHub',
        designSystem: 'Design system (Storybook)',
      },
    },
  },
  fr: {
    viewAs: 'Afficher en tant que',
    viewAsLabel: 'Consulter ce site en tant que',
    facts: {
      basedIn: 'Localisation',
      works: 'Disponibilité',
      now: 'Poste actuel',
      at: 'chez',
    },
    work: {
      eyebrow: 'Projets sélectionnés',
      heading: 'Études de cas',
      lead: 'Ce que j’ai conçu, les arbitrages techniques et l’impact généré.',
      allLink: 'Toutes les études de cas',
    },
    services: {
      eyebrow: 'Freelance',
      heading: 'Comment je peux vous aider',
      allLink: 'Tous les services et méthodologie',
    },
    experience: {
      eyebrow: 'Expérience',
      heading: 'Plus de 5 ans d’Angular, de la v12 à la v22',
      fullLink: 'Parcours complet',
      cvLink: 'CV',
    },
    platform: {
      eyebrow: 'Sous le capot',
      heading: 'Ce site en est la preuve vivante',
      lead: 'Conçu exactement comme une plateforme client, avec chaque arbitrage consigné dans un ADR.',
      cards: {
        mfeTitle: 'Micro-frontends',
        mfeText:
          'Remotes Native Federation déployés de façon autonome, avec écran de secours résilient.',
        zonelessTitle: 'Angular 22 Zoneless',
        zonelessText:
          'Signals et NgRx SignalStore, aucun zone.js dans les bundles.',
        prerenderTitle: 'Pré-rendu & hors-ligne',
        prerenderText:
          'HTML réel depuis un CDN, puis PWA fonctionnant hors-ligne.',
        cspTitle: 'CSP stricte, hébergement 0 $',
        cspText:
          'Sécurité par hachages sha256, déploiement sur Cloudflare par CI.',
      },
      links: {
        apps: 'Explorer les Apps & Labs →',
        howBuilt: 'Comment c’est construit',
        source: 'Code source et ADR sur GitHub',
        designSystem: 'Design system (Storybook)',
      },
    },
  },
  ar: {
    viewAs: 'عرض حسب الفئة',
    viewAsLabel: 'تصفح هذا الموقع كـ',
    facts: {
      basedIn: 'المقر',
      works: 'نظام العمل',
      now: 'العمل الحالي',
      at: 'في',
    },
    work: {
      eyebrow: 'مشاريع مختارة',
      heading: 'دراسات الحالة',
      lead: 'ما قمت ببنائه، والقرارات المعمارية خلفه، والنتائج المحققة.',
      allLink: 'كافة دراسات الحالة',
    },
    services: {
      eyebrow: 'العمل الحر والاستشارات',
      heading: 'كيف يمكنني مساعدتك',
      allLink: 'جميع الخدمات ومنهجية العمل',
    },
    experience: {
      eyebrow: 'الخبرة المهنية',
      heading: 'أكثر من 5 سنوات مع Angular، من v12 إلى v22',
      fullLink: 'الخبرة الكاملة',
      cvLink: 'السيرة الذاتية',
    },
    platform: {
      eyebrow: 'نظرة من الداخل',
      heading: 'هذا الموقع هو الدليل العملي',
      lead: 'تم بناؤه بذات المعايير التي أعتمدها لمنصات عملائي، مع توثيق كل قرار معماري كـ ADR.',
      cards: {
        mfeTitle: 'واجهات مصغرة (Micro-Frontends)',
        mfeText:
          'تطبيقات Native Federation مستقلة النشر، مع واجهات بديلة عند انقطاع الخدمة.',
        zonelessTitle: 'أنغولار 22 بدون Zone.js',
        zonelessText:
          'اعتماد كامل على الإشارات Signals وNgRx SignalStore دون zone.js.',
        prerenderTitle: 'تقديم مسبق وعمل دون اتصال',
        prerenderText: 'ملفات HTML حقيقية وسريعة من الـ CDN وتطبيق PWA متكامل.',
        cspTitle: 'أمان CSP صارم، استضافة 0$',
        cspText:
          'سياسة حماية مشددة بالبصمات المشفرة مع نشر آلي على Cloudflare.',
      },
      links: {
        apps: 'استكشاف التطبيقات والمختبرات ←',
        howBuilt: 'كيف تم البناء',
        source: 'الشيفرة المصدرية وADR على GitHub',
        designSystem: 'نظام التصميم (Storybook)',
      },
    },
  },
  it: {
    viewAs: 'Visualizza come',
    viewAsLabel: 'Esplora questo sito come',
    facts: {
      basedIn: 'Sede',
      works: 'Modalità',
      now: 'Attualmente',
      at: 'presso',
    },
    work: {
      eyebrow: 'Progetti selezionati',
      heading: 'Casi studio',
      lead: 'Cosa ho realizzato, le scelte architetturali e i risultati ottenuti.',
      allLink: 'Tutti i casi studio',
    },
    services: {
      eyebrow: 'Freelance & Consulenza',
      heading: 'Come posso aiutarti',
      allLink: 'Tutti i servizi e metodologia di lavoro',
    },
    experience: {
      eyebrow: 'Esperienza',
      heading: 'Oltre 5 anni di Angular, dalla v12 alla v22',
      fullLink: 'Percorso completo',
      cvLink: 'CV',
    },
    platform: {
      eyebrow: 'Sotto il cofano',
      heading: 'Questo sito è la prova concreta',
      lead: 'Costruito esattamente come una piattaforma enterprise per clienti, con ogni decisione registrata come ADR.',
      cards: {
        mfeTitle: 'Micro-frontend',
        mfeText:
          'Remote Native Federation distribuiti in modo autonomo, con pagina di fallback resiliente.',
        zonelessTitle: 'Angular 22 Zoneless',
        zonelessText:
          'Signals e NgRx SignalStore, nessun zone.js in alcun bundle.',
        prerenderTitle: 'Pre-renderizzato & offline',
        prerenderText:
          'HTML reale servito da CDN, poi PWA funzionante offline.',
        cspTitle: 'CSP restrittiva, hosting 0 $',
        cspText:
          'Politica di sicurezza basata su hash, distribuita su Cloudflare via CI.',
      },
      links: {
        apps: 'Esplora App e Laboratori →',
        howBuilt: 'Come è sviluppato',
        source: 'Codice sorgente e ADR su GitHub',
        designSystem: 'Design system (Storybook)',
      },
    },
  },
  de: {
    viewAs: 'Ansicht für',
    viewAsLabel: 'Diese Seite anzeigen für',
    facts: {
      basedIn: 'Standort',
      works: 'Arbeitsmodell',
      now: 'Aktuell',
      at: 'bei',
    },
    work: {
      eyebrow: 'Ausgewählte Projekte',
      heading: 'Fallstudien',
      lead: 'Was ich entwickelt habe, die Architekturentscheidungen und die messbaren Resultate.',
      allLink: 'Alle Fallstudien',
    },
    services: {
      eyebrow: 'Freelance & Beratung',
      heading: 'Wie ich helfen kann',
      allLink: 'Alle Leistungen & Vorgehensweise',
    },
    experience: {
      eyebrow: 'Berufserfahrung',
      heading: '5+ Jahre Angular, von v12 bis v22',
      fullLink: 'Vollständiger Werdegang',
      cvLink: 'Lebenslauf',
    },
    platform: {
      eyebrow: 'Hinter den Kulissen',
      heading: 'Diese Website ist der Beweis',
      lead: 'Exakt so gebaut wie eine Enterprise-Plattform für Kunden, mit jeder Architekturentscheidung als ADR dokumentiert.',
      cards: {
        mfeTitle: 'Micro-Frontends',
        mfeText:
          'Native Federation Remotes, autonom deployt, jeweils mit resilientem Fallback.',
        zonelessTitle: 'Zoneless Angular 22',
        zonelessText: 'Signals und NgRx SignalStore, kein zone.js im Bundle.',
        prerenderTitle: 'Vorgerendert & offlinefähig',
        prerenderText: 'Echtes HTML über CDN, danach PWA für Offline-Nutzung.',
        cspTitle: 'Strikte CSP, 0 $ Hosting',
        cspText:
          'Hash-basierte Sicherheitsrichtlinie, kontinuierlich via GitHub Actions auf Cloudflare deployt.',
      },
      links: {
        apps: 'Apps & Labs entdecken →',
        howBuilt: 'Architektur & Aufbau',
        source: 'Quellcode & ADRs auf GitHub',
        designSystem: 'Design-System (Storybook)',
      },
    },
  },
};
