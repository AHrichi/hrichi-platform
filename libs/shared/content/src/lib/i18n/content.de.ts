import type { ContentBundle } from './content-i18n.types';
import site from '../site.json';
import { mailto } from '../audiences';

const employerWorkDe =
  'Kundenprojekt: Auf Lebenslauf-Ebene beschrieben, ohne vertraulichen Code, Daten oder Screenshots.';

export const CONTENT_DE: ContentBundle = {
  profile: {
    name: 'Ahmed Hrichi',
    role: 'Angular- & Full-Stack-Entwickler',
    location: 'Tunis, Tunesien',
    workSetup: 'Weltweit remote · offen für Umzug nach Europa',
    timezone: 'UTC+1 (Überschneidung mit europäischen Geschäftszeiten)',
    availability: 'Offen für Vollzeitstellen und Freelance-Projekte',
    summary:
      'Angular- und Full-Stack-Entwickler mit über 5 Jahren Erfahrung in Konzeption, Aufbau und Optimierung von Enterprise-SaaS-Plattformen, Micro-Frontends und anspruchsvollen 2D/3D-Webanwendungen. Ich arbeite im modernen Angular-Ökosystem (v12 bis v22, Signals, Standalone-APIs, RxJS, Nx-Monorepos) gestützt durch NestJS- und MongoDB-Dienste: schemagesteuerte UIs, ERP- und Versand-Integrationen sowie maximale Browser-Performance.',
    email: 'ahmed.hrichi.web@gmail.com',
    linkedin: 'https://www.linkedin.com/in/a-hrichi/',
    github: 'https://github.com/AHrichi',
  },
  skills: [
    {
      name: 'Frontend',
      items: [
        'Angular (v12 bis v22)',
        'Signals & NgRx SignalStore',
        'Standalone-APIs & zoneless',
        'RxJS',
        'TypeScript',
        'Nx-Monorepos',
        'Micro-Frontends (Native Federation)',
        'PrimeNG & Angular Material',
        'PWA',
      ],
    },
    {
      name: '2D/3D-Grafik',
      items: [
        'Three.js (WebGL, eigene Shader)',
        '3D-Produktvorschauen',
        'Fabric.js Canvas-Editoren',
        'CKEditor-Integration',
      ],
    },
    {
      name: 'Backend & Integrationen',
      items: [
        'NestJS',
        'MongoDB',
        'BullMQ',
        'n8n-Workflow-Automatisierung',
        'Stripe',
        'OAuth 2.0 & JWT',
      ],
    },
    {
      name: 'Desktop, Mobile & JVM',
      items: ['Electron', 'Ionic & Capacitor', 'Java & Spring Boot'],
    },
    {
      name: 'Qualität & Software-Lieferung',
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
      title: 'Staatliches Ingenieurdiplom',
      school: 'Nationale Ingenieurschule von Monastir (ENIM)',
      period: '2017 – 2020',
    },
    {
      title: 'Full-Stack-Webentwicklung Zertifizierung',
      school: 'GoMyCode',
      period: '2020 – 2021',
    },
    {
      title: 'Vorbereitungszyklus für Ingenieurstudien',
      school: 'Vorbereitungsinstitut für Ingenieurstudien',
      period: '2015 – 2017',
    },
  ],
  languages: [
    { language: 'Arabisch', level: 'Muttersprache' },
    { language: 'Englisch', level: 'Verhandlungssicher' },
    { language: 'Französisch', level: 'Gute Arbeitskenntnisse' },
  ],
  audiences: {
    recruiter: {
      label: 'Recruiter',
      headline: 'Angular- & Full-Stack-Entwickler mit 5+ Jahren SaaS-Erfahrung',
      intro:
        'Ich entwickle und modernisiere Angular-Plattformen (Nx-Monorepos, Micro-Frontends, interaktive 3D-Tools) und die dazugehörigen NestJS-Services. Wohnhaft in Tunis, weltweit remote tätig, offen für Umzug nach Europa.',
      primaryCta: { label: 'Lebenslauf ansehen', href: '/cv' },
      secondaryCta: {
        label: 'E-Mail schreiben',
        href: mailto('Karrierechance für Ahmed Hrichi'),
      },
      sections: ['experience', 'work', 'services', 'platform'],
    },
    engineer: {
      label: 'Entwickler',
      headline: 'Ich baue skalierbare, modulare Angular-Plattformen',
      intro:
        'Diese Website ist der beste Beweis: ein Nx-Monorepo aus zoneless Angular 22 Micro-Frontends via Native Federation, vorgerendert, offlinefähig und für 0 $ gehostet. Der gesamte Quellcode und alle Architekturentscheidungen sind öffentlich.',
      primaryCta: {
        label: 'Wie diese Website aufgebaut ist',
        href: '/work/this-platform',
      },
      secondaryCta: {
        label: 'Quellcode auf GitHub',
        href: site.repository,
        external: true,
      },
      sections: ['platform', 'work', 'experience', 'services'],
    },
    client: {
      label: 'Auftraggeber',
      headline:
        'Angular-Entwicklung, 3D-Erlebnisse und Integrationen für Produktteams',
      intro:
        'Ich unterstütze Teams bei der Modernisierung von Angular-Apps, der Bereitstellung von 3D-Produktkonfiguratoren und der Anbindung von Unternehmenssystemen via NestJS und n8n. Remote mit Zeiten, die die EU-Geschäftszeiten abdecken.',
      primaryCta: {
        label: 'Projekt anfragen',
        href: mailto('Projektanfrage'),
      },
      secondaryCta: { label: 'Leistungen ansehen', href: '/services' },
      sections: ['services', 'work', 'experience', 'platform'],
    },
  },
  experience: [
    {
      company: 'SeekMake',
      title: 'Angular- & Full-Stack-Entwickler',
      location: 'Tunis, Tunesien',
      start: '2023-10',
      context:
        'B2B-Fertigungs-SaaS-Plattform und Marktplatz: Sofortige 3D-Preiskalkulation, automatisiertes Auftrags-Routing, Rechnungsstellung und Partner-Fertigung über ein Nx-Monorepo aus Angular-Anwendungen und NestJS-Microservices.',
      highlights: [
        {
          title: 'Modernes Angular & Monorepo-Architektur',
          text: 'Entwicklung und Optimierung von Kernmodulen im Kundenportal, Admin-Dashboard und einbettbaren Sofortkalkulations-Widget mit Angular (bis v19), Signals, Standalone-Komponenten, RxJS und Nx, wodurch 3D-Berechnungen beschleunigt und Browser-Ressourcen geschont wurden.',
        },
        {
          title: 'Schemagesteuerte Integrationsplattform',
          text: 'Aufbau eines modularen Integrations-Frameworks für Versanddienstleister (InPost, DHL, inTime) und Buchhaltungssoftware (QuickBooks, Fakturownia, e-boekhouden), mit aus JSON-Schemas generierten Angular-Formularen und n8n-Webhook-Workern für Zero-Deployment-Onboarding neuer Partner.',
        },
        {
          title: 'Multi-Tenant Onboarding- & Replikations-Engine',
          text: 'Konzeption einer modularen Konfigurations-Engine in NestJS und MongoDB zur Replikation komplexer Fertigungs-Setups (Maschinen, Werkstoffe, Preisformeln, Steuersätze, Währungen) mit Trockenlauf-Konfliktprüfung und Sofort-Rollback.',
        },
        {
          title: 'Dokumenten- & PDF-Design-Engine',
          text: 'Entwicklung einer fehlertoleranten Dokumenten-Engine in 13 Sprachen mit visuellem Angular-Editor für Angebote, Rechnungen und Arbeitsaufträge, Live-Vorschau und garantierter Rendering-Stabilität.',
        },
        {
          title: 'Lifecycle-Marketing-Automatisierung',
          text: 'Erstellung einer mehrstufigen Marketing-Engine: visueller Kampagnen-Builder in Angular und verteilte BullMQ-Warteschlange zur Durchsetzung idempotenter Versandlimits bei umfangreichen Lead-Datenbanken.',
        },
        {
          title: 'White-Label Transaktions-E-Mails',
          text: 'Migration von über 16 Transaktions-E-Mail-Workflows auf eine hauseigene mehrsprachige Template-Engine mit mandanteneigenem SMTP, Feature-Flag-Rollouts und Echtzeit-Zustellungsüberwachung.',
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
      title: 'Frontend-Angular-Entwickler',
      location: 'Paris, Frankreich (remote aus Tunis)',
      start: '2023-05',
      end: '2023-10',
      context:
        'Thalasso n°1: Backoffice-Verwaltungs- und Buchungsplattform für die Reise- und Hotelbranche.',
      highlights: [
        {
          title: 'Datenintensive Dashboards',
          text: 'Aufbau responsiver Backoffice-Workflows und Analyseansichten mit Angular, TypeScript und PrimeNG: komplexe Datentabellen, Mehrfachfilterung und interaktive Reporting-Widgets.',
        },
        {
          title: 'CMS & Performance-Optimierung',
          text: 'Entwicklung eines maßgeschneiderten Content-Management-Systems und Senkung der Ladezeiten durch Lazy Loading auf Routenebene, Code-Splitting und reaktives Zustandsmanagement mit RxJS.',
        },
        {
          title: 'Qualitätssicherung',
          text: 'Verbesserung der Barrierefreiheit und Zuverlässigkeit der Releases durch automatisierte Unit-Tests in Jasmine und Karma.',
        },
      ],
      stack: ['Angular', 'TypeScript', 'PrimeNG', 'RxJS', 'Jasmine', 'Karma'],
    },
    {
      company: 'Euro Tech Conseil',
      title: 'Frontend-Angular-Entwickler',
      location: 'Paris, Frankreich / Kairouan, Tunesien',
      start: '2021-09',
      end: '2023-05',
      context:
        'Vier Enterprise-Kernanwendungen: 2D/3D-Grafikbibliotheken, visuelle Publishing-Plattformen, ein Finanz-CRM und Automobil-PWAs.',
      highlights: [
        {
          title: 'Eigenständige 2D/3D-Grafikbibliothek (MyEasyLogo)',
          text: 'Entwicklung einer wiederverwendbaren Angular-Bibliothek, die Three.js (eigene WebGL-Shader für fotorealistische 3D-Echtzeitvorschauen von Holzmaserungen und Lasergravuren) und Fabric.js (gebogene Texte, Bildverzerrung, CKEditor und zustandsbasiertes Undo/Redo) kombiniert.',
        },
        {
          title: 'Webbasierte Designplattform (MyEasyContent)',
          text: 'Erstellung eines visuellen Designstudios mit ebenenbasierter Komposition, Farbpaletten-Management und hochauflösendem Vektorexport.',
        },
        {
          title: 'Finanz-CRM-Modernisierung',
          text: 'Refaktorisierung eines Anlage- und Portfolio-Portals, Modularisierung in eigenständige Angular-Komponenten und Optimierung der Change-Detection-Zyklen.',
        },
        {
          title: 'PWA für das Automobil-Händlernetzwerk',
          text: 'Entwicklung installierbarer und offlinefähiger Progressive Web Apps für Werkstattdiagnose und Inspektionsprozesse mit Hintergrundsynchronisierung.',
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
      title: 'Angular-Modernisierung',
      summary:
        'Bringen Sie bestehende Angular-Anwendungen (ab v12) auf den neuesten Stand: Standalone-Komponenten, Signals und zoneless Change Detection, abgesichert durch zuverlässige Tests.',
      deliverables: [
        'Migrationsplan mit Risikoanalyse und klarer Priorisierung',
        'Inkrementelle, leicht überprüfbare Pull Requests',
        'Automatisierte Tests für geschäftskritische Benutzerpfade',
        'Vorher/Nachher-Performance-Audit',
      ],
      proof: ['instant-3d-quoting', 'this-platform'],
    },
    {
      id: 'monorepos-micro-frontends',
      title: 'Nx-Monorepos & Micro-Frontends',
      summary:
        'Strukturieren oder optimieren Sie Ihren Nx-Workspace: klare Modulgrenzen, gemeinsame Bibliotheken, Micro-Frontends mit Native Federation und CI, die nur Änderungen baut.',
      deliverables: [
        'Workspace-Architektur und Bibliotheksstruktur',
        'Erzwungene Modulgrenzen und Linting-Regeln',
        'Micro-Frontend-Setup mit resilienten Fallbacks',
        'CI/CD-Pipeline mit automatischer Erkennung betroffener Projekte',
      ],
      proof: ['this-platform', 'instant-3d-quoting'],
    },
    {
      id: '3d-product-experiences',
      title: '3D-Produkterlebnisse & Konfiguratoren',
      summary:
        'Interaktive 3D-Produktvorschauen und Konfiguratoren mit Three.js und Shadern sowie 2D-Design-Editoren mit Fabric.js, nahtlos integriert in Ihre Angular-App.',
      deliverables: [
        'Echtzeit-3D-Vorschau oder Konfiguratorkomponente',
        'Fotorealistische Materialien und maßgeschneiderte Shader',
        '2D-Editor mit stabiler Undo/Redo-Historie',
        'Performance-Budget optimiert für Mobilgeräte',
      ],
      proof: ['myeasylogo-graphics-library', 'instant-3d-quoting'],
    },
    {
      id: 'integrations-automation',
      title: 'Integrationen & Prozessautomatisierung',
      summary:
        'Verbinden Sie Ihre Plattform mit Logistikern, Buchhaltungstools, CRM und E-Mail-Diensten via NestJS und n8n-Workflows, steuerbar über schemagesteuerte Oberflächen.',
      deliverables: [
        'Robuste Integrations-Microservices in NestJS',
        'Visuelle, wartbare n8n-Automatisierungs-Workflows',
        'Konfigurationsmasken basierend auf JSON-Schemas',
        'Retry-Mechanismen und Idempotenz für zuverlässige Übertragung',
      ],
      proof: ['schema-driven-integrations'],
    },
    {
      id: 'pwa-desktop',
      title: 'PWA & Desktop-Anwendungen',
      summary:
        'Installierbare, offlinefähige Progressive Web Apps und Electron-Desktop-Builds aus einer einzigen, gemeinsamen Angular-Codebasis.',
      deliverables: [
        'Offline-Caching-Strategie und dedizierter Service Worker',
        'Installierbare PWA für Desktop und Mobilgeräte',
        'Electron-Desktop-Builds mit automatischer Update-Funktion',
        'Plattformübergreifende Release-Pipeline',
      ],
      proof: ['this-platform'],
    },
  ],
  process: [
    {
      title: 'Ziel verstehen',
      text: 'Ein konzentriertes Gespräch und eine Code-Analyse, damit der Plan direkt auf dem tatsächlichen Projektstand aufsetzt.',
    },
    {
      title: 'Plan dokumentieren',
      text: 'Scope, Risiken und Kernentscheidungen präzise in einem kurzen Dokument zusammengefasst, bevor die Umsetzung beginnt.',
    },
    {
      title: 'In kleinen Schritten liefern',
      text: 'Überschaubare Pull Requests und wöchentliche Demos, um Fortschritte sichtbar zu machen und frühzeitig nachzujustieren.',
    },
    {
      title: 'Saubere Übergabe',
      text: 'Vollständige Tests, CI-Pipelines und Dokumentation, damit Ihr Team eigenständig und sicher weiterarbeiten kann.',
    },
  ],
  engagement:
    'Festpreisprojekte oder monatliche Retainer-Begleitung. Remote mit flexiblen Arbeitszeiten abgestimmt auf die EU.',
  caseStudies: [
    {
      slug: 'instant-3d-quoting',
      title: 'Sofortige 3D-Preiskalkulation für B2B-Fertigungsmarktplatz',
      summary:
        'Kernfunktionen eines B2B-Marktplatzes für sofortige Preisermittlung aus 3D-Dateien – über Kundenportal, Admin-Dashboard und einbettbares Widget.',
      client: 'SeekMake',
      period: '2023 – heute',
      role: 'Angular- & Full-Stack-Entwickler',
      context:
        'SeekMake ist eine B2B-Fertigungs-SaaS-Plattform und Marktplatz: Kunden laden 3D-CAD-Modelle hoch und erhalten Sofortangebote, während Aufträge an Partnerbetriebe verteilt werden. Die Plattform basiert auf einem Nx-Monorepo aus Angular-Apps und NestJS-Microservices.',
      problem:
        'Derselbe Kalkulationsablauf musste in drei Umgebungen identisch funktionieren (Kundenportal, Dashboard, externes Widget), während rechenintensive 3D-Berechnungen die UI-Performance im Browser beanspruchten.',
      approach: [
        {
          decision:
            'Implementierung auf Basis von Signals und Standalone-Komponenten (Angular bis v19).',
          why: 'Feingranulare Reaktivität rendert nur diejenigen Elemente neu, die sich durch Preisänderungen ändern, ohne die gesamte Seite zu scannen.',
        },
        {
          decision:
            'Gemeinsame Kalkulationslogik über modulare Nx-Bibliotheken zwischen Portal, Dashboard und Widget.',
          why: 'Eine einzige Quelle der Wahrheit für Preisformeln und UI mit strikten Grenzen gegen überflüssige Abhängigkeiten.',
        },
        {
          decision: 'Optimierung der 3D-Berechnungen direkt im Browser.',
          why: 'Geringere CPU-Last pro Interaktion sorgte für minimale Ladezeiten und sofortiges Feedback, was im Drittanbieter-Widget entscheidend ist.',
        },
      ],
      outcome: [
        'Kalkulationsfunktionen erfolgreich in Portal, Admin und Widget aus einem einzigen Monorepo bereitgestellt.',
        'Spürbare Reduzierung des Speicherverbrauchs und der Ladezeiten für 3D-Preiskalkulationen.',
      ],
      stack: [
        'Angular',
        'Signals',
        'Standalone-Komponenten',
        'RxJS',
        'Nx',
        'NestJS',
      ],
      confidentiality: employerWorkDe,
      rank: { recruiter: 1, engineer: 2, client: 2 },
    },
    {
      slug: 'schema-driven-integrations',
      title: 'Modulare, schemagesteuerte Integrationsplattform',
      summary:
        'Versanddienstleister und Buchhaltungssoftware über JSON-Schema-Formulare und n8n-Worker angebunden – Onboarding neuer Partner ohne Software-Release.',
      client: 'SeekMake',
      period: '2023 – heute',
      role: 'Angular- & Full-Stack-Entwickler',
      context:
        'Hersteller auf der Plattform versenden mit unterschiedlichen Logistikern und buchen auf verschiedenen Buchhaltungssystemen. Jede Integration benötigt eigene Konfigurationsmasken und Schnittstellen.',
      problem:
        'Das manuelle Erstellen einer UI und eines Backend-Konnektors pro Anbieter machte jede Anbindung zu einem zeitaufwändigen Projekt mit neuem Deployment.',
      approach: [
        {
          decision:
            'Konfigurationen als JSON-Schema modellieren und Angular-Formulare daraus dynamisch rendern.',
          why: 'Ein neuer Anbieter wird zur reinen Datenkonfiguration: Validierungen, Defaults und Layouts entstehen automatisch aus dem Schema.',
        },
        {
          decision:
            'Anbieterspezifische Logik in n8n-Webhook-Workern ausführen.',
          why: 'Konnektoren lassen sich ohne Redeployment der Plattform anpassen und sind separat test- und überwachbar.',
        },
      ],
      outcome: [
        'Logistiker (InPost, DHL, inTime) und Buchhaltungssuiten (QuickBooks, Fakturownia, e-boekhouden) über ein einheitliches Framework integriert.',
        'Neue Anbieter werden ohne Programmänderung oder Deployment produktiv geschaltet.',
      ],
      stack: ['Angular', 'JSON Schema', 'n8n', 'NestJS', 'MongoDB'],
      confidentiality: employerWorkDe,
      rank: { recruiter: 2, engineer: 3, client: 1 },
    },
    {
      slug: 'myeasylogo-graphics-library',
      title: '2D/3D-Grafikbibliothek für Produktpersonalisierung',
      summary:
        'Wiederverwendbare Angular-Bibliothek, die Three.js-Shader für 3D-Echtzeitvorschauen mit einem Fabric.js-Editor für gebogene Texte, Bilder und Undo/Redo verbindet.',
      client: 'Euro Tech Conseil (MyEasyLogo)',
      period: '2021 – 2023',
      role: 'Frontend-Angular-Entwickler',
      context:
        'MyEasyLogo ermöglicht Kunden das Personalisieren von Produkten wie Holzgravuren und Schildern mit sofortiger Vorschau vor dem Kauf. Mehrere Applikationen benötigten dieselben Funktionen.',
      problem:
        'Kunden brauchten eine fotorealistische 3D-Vorschau von Holzmaserung und Lasergravur während der Gestaltung, und die Funktionalität musste anwendungsübergreifend wiederverwendbar sein.',
      approach: [
        {
          decision:
            'Editor und 3D-Vorschau als eigenständige Angular-Bibliothek verpacken.',
          why: 'Jede Applikation nutzt dieselbe saubere Komponenten-API, anstatt Canvas-Code zu duplizieren.',
        },
        {
          decision:
            'Materialien mit maßgeschneiderten WebGL-Shadern in Three.js rendern.',
          why: 'Echtzeit-Simulation von Holzfasern und Gravurtiefe, die sich bei jeder Anpassung sofort aktualisiert.',
        },
        {
          decision:
            'Fabric.js für den 2D-Editor mit zustandsbasierter Undo/Redo-Engine einsetzen.',
          why: 'Gebogene Texte, Bildtransformationen, CKEditor-Integration und verlässliches Rückgängigmachen jedes Schrittes.',
        },
      ],
      outcome: [
        'Fotorealistische 3D-Gravur- und Holz-Vorschauen in Echtzeit direkt im Browser.',
        'Eine zentrale, wartbare Bibliothek für alle Personalisierungsfunktionen.',
      ],
      stack: [
        'Angular',
        'Three.js',
        'WebGL-Shader',
        'Fabric.js',
        'CKEditor',
        'RxJS',
      ],
      confidentiality: employerWorkDe,
      rank: { recruiter: 3, engineer: 4, client: 3 },
    },
    {
      slug: 'this-platform',
      title: 'Diese Website: Micro-Frontend-Plattform für 0 $ gehostet',
      summary:
        'Ein Nx-Monorepo aus zoneless Angular 22 Micro-Frontends mit Native Federation, vorgerendert, installierbar und über Cloudflare völlig kostenlos bereitgestellt.',
      client: 'Persönliches Projekt',
      period: '2026',
      role: 'Architekt und Entwickler',
      context:
        'Ein Portfolio listet oft nur Fertigkeiten auf. Diese Seite ist genau wie eine Kundenplattform für die Produktion gebaut: Die Architektur selbst liefert den Beweis, dokumentiert in ADRs.',
      problem:
        'Micro-Frontends, SEO-Vorab-Rendering, Offline-Fähigkeit und eine strikte Content Security Policy auf kostenlosem Hosting vereinen, ohne Konflikte zu verursachen.',
      approach: [
        {
          decision:
            'Native Federation auf Angulars offiziellem esbuild-Builder anstelle von Webpack Module Federation.',
          why: 'Angular und Nx setzen nativ auf esbuild; Native Federation nutzt offizielle Web-Standards und ist zukunftssicher.',
        },
        {
          decision:
            'Inhalte in der Shell vorrendern; Micro-Frontends erst im Browser dynamisch laden.',
          why: 'Suchmaschinen erhalten echtes, schnelles HTML von der CDN ohne Serverbetrieb, während Remotes unabhängig deploybar bleiben.',
        },
        {
          decision:
            'Jedes Remote als potenziell unzuverlässig behandeln: Timeout, Vertragskontrolle und Fallback-Ansicht.',
          why: 'Ein nicht erreichbares Remote zeigt einen hilfreichen Hinweis an, anstatt die gesamte Website zum Absturz zu bringen.',
        },
        {
          decision:
            'CSP-Header beim Build-Prozess anhand von SHA256-Hashes der HTML-Ausgabe generieren.',
          why: 'Höchste XSS-Sicherheit ohne Einschränkungen für das statische Prerendering.',
        },
      ],
      outcome: [
        'Live auf Cloudflare zu null Kosten, automatisch per GitHub Actions nur für geänderte Apps deployt.',
        'Null Content-Security-Policy-Verletzungen und keine Konsolenfehler im Produktivbetrieb.',
        'Funktioniert nach dem ersten Besuch vollständig offline, inklusive aller föderierten Angular-Module.',
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
        { label: 'Quellcode', href: site.repository, external: true },
        {
          label: 'Architekturentscheidungen (ADRs)',
          href: `${site.repository}/tree/main/docs/adr`,
          external: true,
        },
        {
          label: 'Design-System',
          href: site.designSystem,
          external: true,
        },
      ],
      rank: { recruiter: 4, engineer: 1, client: 4 },
    },
  ],
};
