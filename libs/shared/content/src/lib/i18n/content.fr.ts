import type { ContentBundle } from './content-i18n.types';
import site from '../site.json';
import { mailto } from '../audiences';

const employerWorkFr =
  'Projet client : décrit selon le niveau de mon CV, sans code, données ni captures confidentielles.';

export const CONTENT_FR: ContentBundle = {
  profile: {
    name: 'Ahmed Hrichi',
    role: 'Développeur Angular & Full-Stack',
    location: 'Tunis, Tunisie',
    workSetup: 'Télétravail mondial · ouvert à la relocalisation en Europe',
    timezone: 'UTC+1 (aligné sur les horaires ouvrés UE)',
    availability: 'Disponible pour postes CDI et missions freelance',
    summary:
      'Développeur Angular et full-stack avec plus de 5 ans d’expérience dans la conception, la construction et l’optimisation de plateformes SaaS d’entreprise, de micro-frontends et d’applications web 2D/3D complexes. J’évolue au sein de l’écosystème Angular moderne (v12 à v22, Signals, API standalone, RxJS, monorepos Nx) adossé à des services NestJS et MongoDB : interfaces pilotées par schémas, intégrations ERP et logistiques, et haute performance dans le navigateur.',
    email: 'ahmed.hrichi.web@gmail.com',
    linkedin: 'https://www.linkedin.com/in/a-hrichi/',
    github: 'https://github.com/AHrichi',
  },
  skills: [
    {
      name: 'Frontend',
      items: [
        'Angular (v12 à v22)',
        'Signals & NgRx SignalStore',
        'APIs standalone & zoneless',
        'RxJS',
        'TypeScript',
        'Monorepos Nx',
        'Micro-frontends (Native Federation)',
        'PrimeNG & Angular Material',
        'PWA',
      ],
    },
    {
      name: 'Graphismes 2D/3D',
      items: [
        'Three.js (WebGL, shaders personnalisés)',
        'Aperçus produits 3D',
        'Éditeurs canvas Fabric.js',
        'Intégration CKEditor',
      ],
    },
    {
      name: 'Backend & intégrations',
      items: [
        'NestJS',
        'MongoDB',
        'BullMQ',
        'Automatisation de flux n8n',
        'Stripe',
        'OAuth 2.0 & JWT',
      ],
    },
    {
      name: 'Desktop, mobile & JVM',
      items: ['Electron', 'Ionic & Capacitor', 'Java & Spring Boot'],
    },
    {
      name: 'Qualité & livraison',
      items: [
        'Vitest, Jest, Jasmine & Karma',
        'Playwright',
        'GitHub Actions',
        'Agile / Scrum',
      ],
    },
  ],
  education: [
    {
      title: 'Diplôme National d’Ingénieur',
      school: 'École Nationale d’Ingénieurs de Monastir (ENIM)',
      period: '2017 – 2020',
    },
    {
      title: 'Certification Développeur Web Full-Stack',
      school: 'GoMyCode',
      period: '2020 – 2021',
    },
    {
      title: 'Cycle Préparatoire aux Études d’Ingénieur',
      school: 'Institut Préparatoire aux Études d’Ingénieurs',
      period: '2015 – 2017',
    },
  ],
  languages: [
    { language: 'Arabe', level: 'Langue maternelle' },
    { language: 'Anglais', level: 'Courant professionnel' },
    { language: 'Français', level: 'Capacité professionnelle' },
  ],
  audiences: {
    recruiter: {
      label: 'Recruteur',
      headline:
        'Développeur Angular & full-stack avec plus de 5 ans d’expérience SaaS',
      intro:
        'Je conçois et modernise des plateformes Angular (monorepos Nx, micro-frontends, outils 3D interactifs) ainsi que les services NestJS associés. Basé à Tunis, en télétravail international, ouvert à la relocalisation en Europe.',
      primaryCta: { label: 'Consulter mon CV', href: '/cv' },
      secondaryCta: {
        label: 'M’écrire par e-mail',
        href: mailto('Opportunité pour Ahmed Hrichi'),
      },
      sections: ['experience', 'work', 'services', 'platform'],
    },
    engineer: {
      label: 'Ingénieur',
      headline: 'Je conçois des architectures Angular prêtes pour l’échelle',
      intro:
        'Ce site en est la preuve vivante : un monorepo Nx de micro-frontends Angular 22 zoneless sous Native Federation, pré-rendu, installable hors-ligne et déployé pour 0 $. Le code source et toutes les décisions d’architecture sont publics.',
      primaryCta: {
        label: 'Comment ce site est conçu',
        href: '/work/this-platform',
      },
      secondaryCta: {
        label: 'Code source sur GitHub',
        href: site.repository,
        external: true,
      },
      sections: ['platform', 'work', 'experience', 'services'],
    },
    client: {
      label: 'Client',
      headline:
        'Développement Angular, 3D et intégrations pour équipes produit',
      intro:
        'J’aide les équipes à moderniser leurs applications Angular, à déployer des expériences produit 3D et à connecter leurs outils via NestJS et n8n. En télétravail avec des horaires alignés sur l’Europe.',
      primaryCta: {
        label: 'Démarrer un projet',
        href: mailto('Demande de projet'),
      },
      secondaryCta: { label: 'Voir les services', href: '/services' },
      sections: ['services', 'work', 'experience', 'platform'],
    },
  },
  experience: [
    {
      company: 'SeekMake',
      title: 'Développeur Angular & Full-Stack',
      location: 'Tunis, Tunisie',
      start: '2023-10',
      context:
        'Plateforme SaaS de fabrication B2B et marketplace : devis instantané 3D, routage automatisé des commandes, facturation et exécution partenaires via un monorepo Nx d’applications Angular et microservices NestJS.',
      highlights: [
        {
          title: 'Angular moderne & monorepo',
          text: 'Conception et optimisation des fonctionnalités clés sur le portail client, le tableau de bord administrateur et le widget de devis instantané avec Angular (jusqu’à v19), Signals, composants standalone, RxJS et Nx, optimisant le calcul de prix 3D pour alléger la consommation mémoire.',
        },
        {
          title: 'Plateforme d’intégrations pilotée par schémas',
          text: 'Développement d’un framework d’intégration modulaire pour transporteurs (InPost, DHL, inTime) et logiciels comptables (QuickBooks, Fakturownia, e-boekhouden), avec formulaires Angular générés par schémas JSON et workers n8n, permettant d’ajouter des prestataires sans redéploiement.',
        },
        {
          title: 'Moteur d’onboarding & réplication multi-tenant',
          text: 'Conception d’un moteur de configuration modulaire en NestJS et MongoDB dupliquant des environnements industriels complexes (machines, matériaux, formules tarifaires, taxes, devises) avec prévisualisation des conflits à blanc et retour arrière immédiat.',
        },
        {
          title: 'Moteur de documents & génération PDF',
          text: 'Mise en place d’un moteur de personnalisation documentaire tolérant aux pannes en 13 langues, avec éditeur visuel Angular pour devis, factures et bons de production, aperçu en temps réel et rendu garanti.',
        },
        {
          title: 'Automatisation marketing',
          text: 'Création d’un moteur de marketing de cycle de vie multi-scénarios : générateur visuel de campagnes en Angular et file distribuée BullMQ pour garantir l’idempotence d’envoi sur de volumineuses bases de prospects.',
        },
        {
          title: 'E-mails transactionnels en marque blanche',
          text: 'Migration de plus de 16 flux d’e-mails transactionnels vers un moteur de templates multilingue interne avec serveurs SMTP personnalisés par organisation, déploiement progressif par feature flags et suivi de distribution en direct.',
        },
      ],
      stack: [
        'Angular',
        'Signals',
        'RxJS',
        'Nx',
        'NestJS',
        'MongoDB',
        'BullMQ',
        'n8n',
      ],
    },
    {
      company: 'E-NOVATIONDUWEB',
      title: 'Développeur Front-End Angular',
      location: 'Paris, France (télétravail depuis Tunis)',
      start: '2023-05',
      end: '2023-10',
      context:
        'Thalasso n°1 : plateforme de gestion back-office et système de réservation pour le secteur de l’hôtellerie et du tourisme.',
      highlights: [
        {
          title: 'Tableaux de bord à forte densité de données',
          text: 'Conception d’écrans de gestion back-office réactifs et de vues analytiques en Angular, TypeScript et PrimeNG : tables de données avancées, filtres multicritères et widgets interactifs de reporting.',
        },
        {
          title: 'CMS & optimisation des performances',
          text: 'Développement d’un CMS sur mesure et réduction des temps de chargement grâce au lazy loading granulaire des routes, au découpage de bundle et à la gestion d’état réactive sous RxJS.',
        },
        {
          title: 'Exigence de qualité logicielle',
          text: 'Amélioration de l’accessibilité et de la fiabilité des livraisons via des suites de tests unitaires automatisés sous Jasmine et Karma.',
        },
      ],
      stack: ['Angular', 'TypeScript', 'PrimeNG', 'RxJS', 'Jasmine', 'Karma'],
    },
    {
      company: 'Euro Tech Conseil',
      title: 'Développeur Front-End Angular',
      location: 'Paris, France / Kairouan, Tunisie',
      start: '2021-09',
      end: '2023-05',
      context:
        'Quatre applications web d’entreprise d’envergure : librairies graphiques 2D/3D, plateformes d’édition visuelle, CRM financier et PWAs automobiles.',
      highlights: [
        {
          title: 'Bibliothèque graphique 2D/3D standalone (MyEasyLogo)',
          text: 'Développement d’une bibliothèque Angular réutilisable combinant Three.js (shaders WebGL sur mesure pour l’aperçu 3D temps réel de gravures laser et textures bois) et Fabric.js (textes courbes, déformations d’images, intégration CKEditor et historique annuler/rétablir orienté état).',
        },
        {
          title: 'Plateforme d’édition visuelle sur le web (MyEasyContent)',
          text: 'Création d’un studio de composition graphique multi-formats avec disposition dynamique des calques, gestion de palettes chromatiques et export vectoriel haute fidélité.',
        },
        {
          title: 'Modernisation de CRM financier',
          text: 'Refonte modulaire d’un portail de gestion de portefeuilles et de simulation d’investissements, conversion vers des composants Angular découplés et optimisation du cycle de détection des changements.',
        },
        {
          title: 'PWA pour le réseau concessionnaire automobile',
          text: 'Développement d’applications web progressives installables fonctionnant en mode déconnecté pour le diagnostic et le suivi d’ateliers mécaniques avec synchronisation en arrière-plan.',
        },
      ],
      stack: [
        'Angular',
        'Three.js',
        'Fabric.js',
        'WebGL',
        'TypeScript',
        'RxJS',
        'PWA',
      ],
    },
  ],
  services: [
    {
      id: 'angular-modernization',
      title: 'Modernisation Angular',
      summary:
        'Faites évoluer vos applications Angular existantes (de la v12 aux versions récentes) : composants standalone, Signals et détection de changement zoneless, avec des tests qui sécurisent chaque palier.',
      deliverables: [
        'Plan de migration avec analyse des risques et phasage précis',
        'Pull requests incrémentales et faciles à relire',
        'Couverture de tests sur les parcours utilisateurs critiques',
        'Rapport de gains de performance avant / après',
      ],
      proof: ['instant-3d-quoting', 'this-platform'],
    },
    {
      id: 'monorepos-micro-frontends',
      title: 'Monorepos Nx & micro-frontends',
      summary:
        'Structurez ou assainissez votre espace Nx : frontières de modules strictes, bibliothèques partagées, micro-frontends avec Native Federation et CI optimisée ne compilant que le différentiel.',
      deliverables: [
        'Organisation d’espace de travail et arborescence de bibliothèques',
        'Frontières architecturales strictes et règles de linting',
        'Configuration micro-frontend avec pages de secours résilientes',
        'Pipeline CI/CD ciblant uniquement les projets affectés',
      ],
      proof: ['this-platform', 'instant-3d-quoting'],
    },
    {
      id: '3d-product-experiences',
      title: 'Expériences produit 3D & configurateurs',
      summary:
        'Aperçus 3D interactifs et configurateurs de produits avec Three.js et shaders personnalisés, ainsi qu’éditeurs graphiques 2D avec Fabric.js intégrés dans vos applications Angular.',
      deliverables: [
        'Composant d’aperçu ou configurateur 3D temps réel',
        'Matériaux réalistes et shaders graphiques sur mesure',
        'Éditeur graphique 2D avec historique annuler/rétablir',
        'Budget de performance optimisé pour appareils mobiles',
      ],
      proof: ['myeasylogo-graphics-library', 'instant-3d-quoting'],
    },
    {
      id: 'integrations-automation',
      title: 'Intégrations & automatisation',
      summary:
        'Connectez vos logiciels aux transporteurs, outils comptables, CRM et services d’envoi d’e-mails avec NestJS et n8n, configurables via des formulaires dynamiques basés sur des schémas.',
      deliverables: [
        'Microservices d’intégration développés sous NestJS',
        'Workflows d’automatisation n8n auditables et évolutifs',
        'Écrans de paramétrage pilotés par schémas JSON',
        'Idempotence et gestion robuste des nouvelles tentatives',
      ],
      proof: ['schema-driven-integrations'],
    },
    {
      id: 'pwa-desktop',
      title: 'PWA & applications desktop',
      summary:
        'Applications web progressives installables et fonctionnant hors-ligne, ainsi que versions desktop Electron à partir d’une base de code Angular unifiée.',
      deliverables: [
        'Stratégie de cache hors-ligne et service worker dédié',
        'PWA certifiée installable sur mobile et ordinateur',
        'Exécutables desktop Electron avec mises à jour automatisées',
        'Pipeline de publication multi-plateforme',
      ],
      proof: ['this-platform'],
    },
  ],
  process: [
    {
      title: 'Comprendre l’objectif',
      text: 'Un échange concis et une revue approfondie de votre code existant pour bâtir un plan ancré dans la réalité de votre produit.',
    },
    {
      title: 'Cadrer et documenter',
      text: 'Périmètre clair, risques identifiés et arbitrages techniques clés formalisés dans un document synthétique validé avant tout démarrage.',
    },
    {
      title: 'Livrer par petites étapes',
      text: 'Pull requests ciblées et démonstrations hebdomadaires pour visualiser l’avancement et ajuster le cap sans délai.',
    },
    {
      title: 'Transmettre sereinement',
      text: 'Tests complets, chaînes CI et documentation détaillée afin que vos équipes continuent en toute autonomie.',
    },
  ],
  engagement:
    'Projets au forfait ou accompagnement mensuel en régie. Télétravail avec des horaires alignés sur l’Europe.',
  caseStudies: [
    {
      slug: 'instant-3d-quoting',
      title:
        'Devis instantané 3D pour une marketplace industrielle de fabrication',
      summary:
        'Fonctionnalités centrales d’une marketplace B2B où les clients obtiennent un tarif instantané depuis des fichiers 3D : portail client, tableau de bord administrateur et widget intégrable.',
      client: 'SeekMake',
      period: '2023 – actuel',
      role: 'Développeur Angular & full-stack',
      context:
        'SeekMake est une plateforme SaaS et marketplace de fabrication industrielle B2B : les clients téléversent leurs pièces et reçoivent des devis 3D instantanés, puis les commandes sont routées, facturées et usinées par des ateliers partenaires. L’écosystème repose sur un monorepo Nx d’applications Angular couplé à des microservices NestJS.',
      problem:
        'L’expérience de chiffrage devait opérer de manière identique sur trois environnements distincts (portail client, administration et widget embarqué externe) alors que les calculs géométriques et volumétriques 3D sollicitaient fortement le navigateur.',
      approach: [
        {
          decision:
            'Bâtir les fonctionnalités sur les Signals et les composants standalone (Angular jusqu’à v19).',
          why: 'La réactivité à granularité fine ne recalcule que ce qui varie lors d’un changement tarifaire, sans exécuter de détection de changement lourde sur toute la page.',
        },
        {
          decision:
            'Mutualiser la logique de calcul au sein de bibliothèques Nx partagées entre le portail, l’admin et le widget.',
          why: 'Une source de vérité unique pour les formules et l’interface, avec des frontières de modules empêchant l’inclusion de dépendances superflues.',
        },
        {
          decision:
            'Optimiser et alléger les calculs de prix 3D exécutés côté navigateur.',
          why: 'Moins de cycles CPU par interaction pour une consommation de ressources réduite et un temps d’affichage ultra rapide, vital pour le widget tiers.',
        },
      ],
      outcome: [
        'Modules de devis délivrés sur le portail client, l’admin et le widget externe à partir d’un monorepo unique.',
        'Réduction notable de l’empreinte mémoire et des temps de calcul pour le chiffrage 3D.',
      ],
      stack: [
        'Angular',
        'Signals',
        'Composants standalone',
        'RxJS',
        'Nx',
        'NestJS',
      ],
      confidentiality: employerWorkFr,
      rank: { recruiter: 1, engineer: 2, client: 2 },
    },
    {
      slug: 'schema-driven-integrations',
      title: 'Plateforme d’intégrations modulaire pilotée par schémas',
      summary:
        'Transporteurs logistiques et suites comptables interconnectés par des formulaires dynamiques basés sur des schémas JSON et des workers n8n, permettant d’ajouter des prestataires sans déploiement.',
      client: 'SeekMake',
      period: '2023 – actuel',
      role: 'Développeur Angular & full-stack',
      context:
        'Les industriels de la plateforme expédient via différents transporteurs et gèrent leurs bilans sur divers logiciels comptables. Chaque intégration requiert son propre écran de paramétrage et sa propre logique de communication.',
      problem:
        'Développer à la main une interface et un connecteur backend dédié pour chaque prestataire transformait chaque intégration en un projet lourd imposant un déploiement complet.',
      approach: [
        {
          decision:
            'Modéliser les réglages de chaque prestataire sous forme de schéma JSON pour en dériver automatiquement les formulaires Angular.',
          why: 'Ajouter un connecteur devient une configuration de données plutôt qu’une modification de code : validations, valeurs par défaut et agencements découlent du schéma.',
        },
        {
          decision:
            'Déléguer la logique métier spécifique à des workers webhook sous n8n.',
          why: 'Les flux peuvent évoluer sans redéployer le cœur de la plateforme, tout en étant testables et observables de façon autonome.',
        },
      ],
      outcome: [
        'Transporteurs (InPost, DHL, inTime) et outils comptables (QuickBooks, Fakturownia, e-boekhouden) intégrés via une mécanique unifiée.',
        'Mise en service de nouveaux prestataires sans aucun nouveau déploiement.',
      ],
      stack: ['Angular', 'JSON Schema', 'n8n', 'NestJS', 'MongoDB'],
      confidentiality: employerWorkFr,
      rank: { recruiter: 2, engineer: 3, client: 1 },
    },
    {
      slug: 'myeasylogo-graphics-library',
      title: 'Librairie graphique 2D/3D pour personnalisation de produits',
      summary:
        'Bibliothèque Angular réutilisable combinant des shaders Three.js pour le rendu 3D temps réel avec un éditeur vectoriel Fabric.js pour les textes courbes, images et gestion d’historique.',
      client: 'Euro Tech Conseil (MyEasyLogo)',
      period: '2021 – 2023',
      role: 'Développeur Front-End Angular',
      context:
        'MyEasyLogo permet aux clients de personnaliser des objets physiques (gravure sur bois, signalétique) et de visualiser le rendu avant commande. Plusieurs applications partageaient ce besoin.',
      problem:
        'Les utilisateurs devaient voir un aperçu 3D réaliste des matériaux et de la profondeur de gravure tout en composant textes et graphismes, le tout packagé de manière réutilisable.',
      approach: [
        {
          decision:
            'Packager le studio de personnalisation et le prévisualiseur sous forme de bibliothèque Angular autonome.',
          why: 'Chaque application cliente consomme une API de composant propre sans dupliquer de code de manipulation canvas.',
        },
        {
          decision:
            'Calculer les matériaux avec des shaders WebGL personnalisés dans Three.js.',
          why: 'Rendu temps réel des veines du bois et de la texture de gravure au fur et à mesure des modifications apportées par le client.',
        },
        {
          decision:
            'Exploiter Fabric.js pour l’éditeur 2D avec moteur d’historique orienté état.',
          why: 'Gestion fluide des textes en arc de cercle, distorsions, intégration CKEditor et garantie d’annulation/rétablissement instantanée.',
        },
      ],
      outcome: [
        'Aperçus 3D réalistes de gravures et textures bois calculés en temps réel dans le navigateur.',
        'Une bibliothèque modulaire unique alimentant l’ensemble des fonctionnalités de conception.',
      ],
      stack: [
        'Angular',
        'Three.js',
        'Shaders WebGL',
        'Fabric.js',
        'CKEditor',
        'RxJS',
      ],
      confidentiality: employerWorkFr,
      rank: { recruiter: 3, engineer: 4, client: 3 },
    },
    {
      slug: 'this-platform',
      title: 'Ce site : une plateforme de micro-frontends déployée pour 0 $',
      summary:
        'Monorepo Nx de micro-frontends Angular 22 zoneless orchestrés avec Native Federation, pré-rendus, installables et déployés sur Cloudflare sans aucun coût d’infrastructure.',
      client: 'Projet personnel',
      period: '2026',
      role: 'Architecte et développeur',
      context:
        'Un portfolio se limite souvent à énumérer des compétences. Celui-ci est conçu exactement comme une plateforme de production pour client : l’architecture constitue la preuve matérielle, consignée dans des ADRs.',
      problem:
        'Marier micro-frontends, pré-rendu SEO, exécution hors-ligne et politique CSP stricte sur un hébergement gratuit, sans qu’aucune contrainte n’entre en conflit avec une autre.',
      approach: [
        {
          decision:
            'Native Federation sur le bundler esbuild officiel d’Angular au lieu de Webpack Module Federation.',
          why: 'Angular et Nx convergent vers le système de build natif esbuild ; Native Federation respecte les standards du web et garantit la pérennité.',
        },
        {
          decision:
            'Pré-rendre le contenu dans le shell ; instancier les micro-frontends côté navigateur.',
          why: 'Les moteurs d’indexation reçoivent du HTML réel ultra-rapide depuis le CDN sans serveur actif, et chaque micro-application reste déployable séparément.',
        },
        {
          decision:
            'Traiter chaque remote comme un service non fiable : délai d’expiration, vérification de contrat et interface de repli.',
          why: 'Si une application distante est indisponible ou lente, un message explicatif s’affiche sans jamais faire planter la plateforme globale.',
        },
        {
          decision:
            'Générer les en-têtes CSP lors de la phase de déploiement à partir des hachages sha256 du HTML produit.',
          why: 'Maintien d’une politique de sécurité sans compromis tout en restant compatible avec la génération statique.',
        },
      ],
      outcome: [
        'En ligne sur Cloudflare à coût nul, avec déploiement continu par GitHub Actions uniquement pour les projets modifiés.',
        'Zéro violation de Content Security Policy et aucune erreur console en production.',
        'Fonctionne intégralement hors-ligne après la première consultation, y compris les modules Angular fédérés.',
      ],
      stack: [
        'Angular 22',
        'Zoneless',
        'Native Federation',
        'Nx 24',
        'NgRx SignalStore',
        'Cloudflare Workers',
        'Playwright',
      ],
      links: [
        { label: 'Code source', href: site.repository, external: true },
        {
          label: 'Décisions d’architecture (ADR)',
          href: `${site.repository}/tree/main/docs/adr`,
          external: true,
        },
        {
          label: 'Design system',
          href: site.designSystem,
          external: true,
        },
      ],
      rank: { recruiter: 4, engineer: 1, client: 4 },
    },
  ],
};
