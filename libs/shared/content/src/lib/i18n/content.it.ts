import type { ContentBundle } from './content-i18n.types';
import site from '../site.json';
import { mailto } from '../audiences';

const employerWorkIt =
  'Progetto cliente: descritto a livello di CV professionale, senza codice, dati o schermate riservate.';

export const CONTENT_IT: ContentBundle = {
  profile: {
    name: 'Ahmed Hrichi',
    role: 'Sviluppatore Angular & Full-Stack',
    location: 'Tunisi, Tunisia',
    workSetup:
      'Da remoto in tutto il mondo · disponibile al trasferimento in Europa',
    timezone: 'UTC+1 (sovrapposto agli orari lavorativi UE)',
    availability: 'Disponibile per ruoli a tempo pieno e progetti freelance',
    summary:
      'Sviluppatore Angular e full-stack con oltre 5 anni di esperienza nella progettazione, sviluppo e ottimizzazione di piattaforme SaaS aziendali, micro-frontend e complesse applicazioni web 2D/3D. Opero nell’ecosistema Angular moderno (dalla v12 alla v22, Signals, API standalone, RxJS, monorepo Nx) supportato da servizi NestJS e MongoDB: interfacce guidate da schemi, integrazioni gestionali e logistiche, ed elevate prestazioni nel browser.',
    email: 'ahmed.hrichi.web@gmail.com',
    linkedin: 'https://www.linkedin.com/in/a-hrichi/',
    github: 'https://github.com/AHrichi',
  },
  skills: [
    {
      name: 'Frontend',
      items: [
        'Angular (dalla v12 alla v22)',
        'Signals & NgRx SignalStore',
        'API standalone & zoneless',
        'RxJS',
        'TypeScript',
        'Monorepo Nx',
        'Micro-frontend (Native Federation)',
        'PrimeNG & Angular Material',
        'PWA',
      ],
    },
    {
      name: 'Grafica 2D/3D',
      items: [
        'Three.js (WebGL, shader personalizzati)',
        'Anteprime prodotto 3D',
        'Editor canvas Fabric.js',
        'Integrazione CKEditor',
      ],
    },
    {
      name: 'Backend & integrazioni',
      items: [
        'NestJS',
        'MongoDB',
        'BullMQ',
        'Automazione flussi n8n',
        'Stripe',
        'OAuth 2.0 & JWT',
      ],
    },
    {
      name: 'Desktop, mobile & JVM',
      items: ['Electron', 'Ionic & Capacitor', 'Java & Spring Boot'],
    },
    {
      name: 'Qualità & rilascio software',
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
      title: 'Laurea Magistrale in Ingegneria',
      school: 'Scuola Nazionale di Ingegneri di Monastir (ENIM)',
      period: '2017 – 2020',
    },
    {
      title: 'Certificazione Sviluppo Web Full-Stack',
      school: 'GoMyCode',
      period: '2020 – 2021',
    },
    {
      title: 'Ciclo Preparatorio per gli Studi di Ingegneria',
      school: 'Istituto Preparatorio agli Studi di Ingegneria',
      period: '2015 – 2017',
    },
  ],
  languages: [
    { language: 'Arabo', level: 'Madrelingua' },
    { language: 'Inglese', level: 'Competenza professionale completa' },
    { language: 'Francese', level: 'Competenza professionale operativa' },
  ],
  audiences: {
    recruiter: {
      label: 'Recruiter',
      headline:
        'Sviluppatore Angular & full-stack con oltre 5 anni di esperienza SaaS',
      intro:
        'Progetto e modernizzo piattaforme Angular (monorepo Nx, micro-frontend, strumenti 3D interattivi) e i relativi servizi NestJS. Con sede a Tunisi, lavoro da remoto e sono aperto al trasferimento professionale in Europa.',
      primaryCta: { label: 'Visualizza il CV', href: '/cv' },
      secondaryCta: {
        label: 'Inviami un’email',
        href: mailto('Opportunità per Ahmed Hrichi'),
      },
      sections: ['experience', 'work', 'services', 'platform'],
    },
    engineer: {
      label: 'Ingegnere',
      headline: 'Sviluppo architetture Angular scalabili e modulari',
      intro:
        'Questo sito ne è la dimostrazione: un monorepo Nx di micro-frontend Angular 22 zoneless con Native Federation, pre-renderizzato, funzionante offline e distribuito a costo zero. Codice sorgente e decisioni architetturali sono aperti a tutti.',
      primaryCta: {
        label: 'Come è sviluppato questo sito',
        href: '/work/this-platform',
      },
      secondaryCta: {
        label: 'Codice sorgente su GitHub',
        href: site.repository,
        external: true,
      },
      sections: ['platform', 'work', 'experience', 'services'],
    },
    client: {
      label: 'Cliente',
      headline:
        'Sviluppo Angular, esperienze 3D e integrazioni per team di prodotto',
      intro:
        'Aiuto i team a modernizzare le applicazioni Angular, a rilasciare visualizzatori 3D e a connettere gli strumenti aziendali con NestJS e n8n. Da remoto con orari allineati all’orario di lavoro europeo.',
      primaryCta: {
        label: 'Inizia un progetto',
        href: mailto('Richiesta di progetto'),
      },
      secondaryCta: { label: 'Esplora i servizi', href: '/services' },
      sections: ['services', 'work', 'experience', 'platform'],
    },
  },
  experience: [
    {
      company: 'SeekMake',
      title: 'Sviluppatore Angular & Full-Stack',
      location: 'Tunisi, Tunisia',
      start: '2023-10',
      context:
        'Piattaforma SaaS e marketplace di manifattura B2B: preventivazione 3D istantanea, routing automatico degli ordini, fatturazione ed evasione tramite una rete di partner, su un monorepo Nx di applicazioni Angular e microservizi NestJS.',
      highlights: [
        {
          title: 'Angular moderno & architettura monorepo',
          text: 'Sviluppo e ottimizzazione dei moduli chiave nel portale clienti, dashboard amministrativa e widget integrabile con Angular (fino a v19), Signals, componenti standalone, RxJS e Nx, ottimizzando i calcoli di prezzo 3D per ridurre l’impiego di risorse nel browser.',
        },
        {
          title: 'Framework di integrazione guidato da schemi',
          text: 'Creazione di un framework modulare per corrieri (InPost, DHL, inTime) e software contabili (QuickBooks, Fakturownia, e-boekhouden), con form Angular generati da JSON Schema e worker n8n, consentendo l’onboarding di fornitori senza nuovi rilasci.',
        },
        {
          title: 'Motore di onboarding e replica multi-tenant',
          text: 'Progettazione di un motore di configurazione modulare in NestJS e MongoDB per replicare configurazioni manifatturiere complesse (macchinari, materiali, formule di prezzo, tasse, valute) con anteprima conflitti a secco e ripristino immediato.',
        },
        {
          title: 'Generatore di documenti e PDF multilingua',
          text: 'Realizzazione di un motore di personalizzazione documentale in 13 lingue, con editor visivo Angular per preventivi, fatture e schede di produzione, anteprima in tempo reale e stabilità di rendering garantita.',
        },
        {
          title: 'Automazione delle comunicazioni di marketing',
          text: 'Sviluppo di un motore di lifecycle marketing multicanale: builder visivo di campagne in Angular e coda distribuita BullMQ per garantire l’invio idempotente su ampi database di contatti.',
        },
        {
          title: 'Email transazionali white-label',
          text: 'Migrazione di oltre 16 flussi transazionali verso un motore interno multilingua con server SMTP personalizzati per tenant, rilascio progressivo con feature flag e monitoraggio dello stato di consegna in tempo reale.',
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
      title: 'Sviluppatore Front-End Angular',
      location: 'Parigi, Francia (da remoto da Tunisi)',
      start: '2023-05',
      end: '2023-10',
      context:
        'Thalasso n°1: piattaforma gestionale di back-office e sistema di prenotazione per il settore alberghiero e turistico.',
      highlights: [
        {
          title: 'Dashboard ad alta densità di dati',
          text: 'Sviluppo di schermate operative e viste analitiche in Angular, TypeScript e PrimeNG: tabelle dati avanzate, filtri multifattore e widget interattivi di reportistica.',
        },
        {
          title: 'CMS & ottimizzazione delle prestazioni',
          text: 'Creazione di un sistema di gestione contenuti su misura e abbattimento dei tempi di caricamento grazie a lazy loading delle route, suddivisione del codice e gestione reattiva dello stato con RxJS.',
        },
        {
          title: 'Garanzia di qualità',
          text: 'Miglioramento dell’accessibilità e dell’affidabilità dei rilasci con suite di test unitari automatici in Jasmine e Karma.',
        },
      ],
      stack: ['Angular', 'TypeScript', 'PrimeNG', 'RxJS', 'Jasmine', 'Karma'],
    },
    {
      company: 'Euro Tech Conseil',
      title: 'Sviluppatore Front-End Angular',
      location: 'Parigi, Francia / Kairouan, Tunisia',
      start: '2021-09',
      end: '2023-05',
      context:
        'Quattro applicazioni enterprise fondamentali: librerie grafiche 2D/3D, piattaforme editoriali visive, CRM finanziario e PWA per il settore automobilistico.',
      highlights: [
        {
          title: 'Libreria grafica 2D/3D autonoma (MyEasyLogo)',
          text: 'Sviluppo di una libreria Angular riutilizzabile che combina Three.js (shader WebGL custom per l’anteprima 3D in tempo reale di texture legno e incisioni laser) e Fabric.js (testi curvi, manipolazione immagini, CKEditor e motore di cronologia stato undo/redo).',
        },
        {
          title: 'Piattaforma di composizione grafica web (MyEasyContent)',
          text: 'Realizzazione di un editor grafico multi-formato con gestione dinamica dei livelli, palette cromatiche ed esportazione vettoriale ad alta fedeltà.',
        },
        {
          title: 'Modernizzazione CRM finanziario',
          text: 'Rifattorizzazione di un portale di gestione portafogli di investimento, conversione a componenti Angular modulari e ottimizzazione dei cicli di rilevamento delle modifiche.',
        },
        {
          title: 'PWA per reti di concessionari automotive',
          text: 'Sviluppo di applicazioni web progressive installabili e funzionanti offline per diagnosi e gestione di officine con sincronizzazione in background.',
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
      title: 'Modernizzazione Angular',
      summary:
        'Aggiorna le tue applicazioni Angular esistenti (dalla v12 alle versioni attuali): componenti standalone, Signals e change detection zoneless, con test che blindano la sicurezza dell’aggiornamento.',
      deliverables: [
        'Piano di migrazione dettagliato con mappatura dei rischi',
        'Pull request incrementali e facili da revisionare',
        'Suite di test automatizzati sui percorsi utente critici',
        'Report quantitativo sulle prestazioni prima e dopo',
      ],
      proof: ['instant-3d-quoting', 'this-platform'],
    },
    {
      id: 'monorepos-micro-frontends',
      title: 'Monorepo Nx & micro-frontend',
      summary:
        'Organizza o ottimizza il tuo workspace Nx: confini architetturali chiari, librerie condivise, micro-frontend con Native Federation e pipeline CI che compila solo il codice modificato.',
      deliverables: [
        'Struttura del workspace e standardizzazione delle librerie',
        'Regole ferree sui confini dei moduli e linting',
        'Configurazione micro-frontend con fallback resilienti',
        'CI mirata solo sui progetti toccati dalle modifiche',
      ],
      proof: ['this-platform', 'instant-3d-quoting'],
    },
    {
      id: '3d-product-experiences',
      title: 'Esperienze prodotto 3D & configuratori',
      summary:
        'Anteprime 3D interattive e configuratori di prodotto con Three.js e shader personalizzati, ed editor 2D con Fabric.js integrati nativamente nella tua applicazione Angular.',
      deliverables: [
        'Componente di visualizzazione o configuratore 3D in tempo reale',
        'Materiali fotorealistici e shader grafici personalizzati',
        'Editor grafico 2D con storico azioni annulla/ripristina',
        'Budget prestazionale ottimizzato per dispositivi mobili',
      ],
      proof: ['myeasylogo-graphics-library', 'instant-3d-quoting'],
    },
    {
      id: 'integrations-automation',
      title: 'Integrazioni & automazione flussi',
      summary:
        'Connetti il tuo prodotto con corrieri, gestionali contabili, CRM e servizi email tramite NestJS e workflow n8n, configurabili attraverso form dinamici generati da schemi.',
      deliverables: [
        'Microservizi di integrazione robusti realizzati in NestJS',
        'Flussi di automazione n8n trasparenti e modificabili',
        'Schermate di impostazione generate da schemi JSON',
        'Gestione riprove ed idempotenza per consegne affidabili',
      ],
      proof: ['schema-driven-integrations'],
    },
    {
      id: 'pwa-desktop',
      title: 'PWA & applicazioni desktop',
      summary:
        'Progressive Web App installabili con supporto offline e build desktop Electron realizzate a partire da un’unica base di codice Angular.',
      deliverables: [
        'Strategia di caching offline e service worker personalizzato',
        'PWA pronta per l’installazione su desktop e dispositivi mobili',
        'Distribuzione desktop Electron con aggiornamento automatico',
        'Pipeline di rilascio continua multipiattaforma',
      ],
      proof: ['this-platform'],
    },
  ],
  process: [
    {
      title: 'Comprendere l’obiettivo',
      text: 'Una chiamata conoscitiva e un’analisi approfondita del codice esistente per impostare il piano di lavoro sulla situazione reale del prodotto.',
    },
    {
      title: 'Definire il piano tecnico',
      text: 'Perimetro, rischi e decisioni chiave formalizzati in un documento sintetico e chiaro prima dell’avvio dei lavori.',
    },
    {
      title: 'Rilasciare a piccoli passi',
      text: 'Pull request contenute e demo settimanali per rendere visibile l’avanzamento e consentire correzioni tempestive.',
    },
    {
      title: 'Consegna e autonomia',
      text: 'Test esaustivi, pipeline CI e documentazione completa affinché il vostro team possa procedere in piena indipendenza.',
    },
  ],
  engagement:
    'Progetti a forfait o tariffa continuativa mensile. Lavoro da remoto con orari sovrapposti a quelli europei.',
  caseStudies: [
    {
      slug: 'instant-3d-quoting',
      title: 'Preventivazione istantanea 3D per marketplace manifatturiero B2B',
      summary:
        'Funzionalità centrali di un marketplace B2B in cui i clienti ottengono quotazioni istantanee da file 3D, su portale clienti, dashboard admin e widget esterno integrabile.',
      client: 'SeekMake',
      period: '2023 – presente',
      role: 'Sviluppatore Angular & full-stack',
      context:
        'SeekMake è una piattaforma SaaS e marketplace per la manifattura B2B: i clienti caricano modelli 3D e ricevono quotazioni istantanee, mentre gli ordini vengono instradati e prodotti da officine partner. L’architettura si basa su un monorepo Nx di app Angular e microservizi NestJS.',
      problem:
        'La stessa logica di preventivazione doveva funzionare su tre ambienti distinti (portale clienti, amministrazione e widget esterno) mentre calcoli 3D complessi competevano per le risorse del browser rallentando i caricamenti.',
      approach: [
        {
          decision:
            'Implementare le funzionalità con Signals e componenti standalone (Angular fino a v19).',
          why: 'La reattività granulare aggiorna solo gli elementi interessati dalla variazione di prezzo, senza scatenare cicli completi di change detection sull’intera pagina.',
        },
        {
          decision:
            'Condividere la logica di calcolo tramite librerie Nx condivise tra portale, admin e widget.',
          why: 'Un’unica fonte di verità per regole e interfaccia, con confini di modulo che impediscono l’inclusione di dipendenze inutili.',
        },
        {
          decision:
            'Ottimizzare i calcoli geometrici e tariffari 3D eseguiti nel browser.',
          why: 'Meno carico per interazione si traduce in minor uso di memoria e tempi di risposta istantanei, essenziali nel widget integrato su siti terzi.',
        },
      ],
      outcome: [
        'Funzionalità di preventivazione distribuite su portale, admin e widget esterno da un unico monorepo.',
        'Netta riduzione dell’uso di risorse del browser e dei tempi di caricamento del preventivatore 3D.',
      ],
      stack: [
        'Angular',
        'Signals',
        'Componenti standalone',
        'RxJS',
        'Nx',
        'NestJS',
      ],
      confidentiality: employerWorkIt,
      rank: { recruiter: 1, engineer: 2, client: 2 },
    },
    {
      slug: 'schema-driven-integrations',
      title: 'Piattaforma di integrazione modulare guidata da schemi',
      summary:
        'Corrieri di spedizione e software contabili integrati attraverso form generati da schemi JSON e worker n8n, consentendo nuovi fornitori senza rilasci.',
      client: 'SeekMake',
      period: '2023 – presente',
      role: 'Sviluppatore Angular & full-stack',
      context:
        'I produttori della piattaforma spediscono con vettori diversi e gestiscono la contabilità su vari software gestionali. Ogni fornitore richiede schermate di configurazione dedicate e specifiche modalità di comunicazione.',
      problem:
        'Sviluppare artigianalmente un’interfaccia utente e un connettore backend per ogni nuovo servizio rendeva ogni integrazione un progetto gravoso che imponeva un nuovo rilascio.',
      approach: [
        {
          decision:
            'Descrivere i parametri di ogni fornitore come JSON Schema e generare i form Angular direttamente dallo schema.',
          why: 'Aggiungere un fornitore diventa una configurazione di dati e non di codice: validazioni, valori predefiniti e layout derivano dallo schema.',
        },
        {
          decision:
            'Eseguire la logica di interscambio specifica nei worker webhook su n8n.',
          why: 'I flussi cambiano senza dover ridistribuire il core della piattaforma, rimanendo visibili e testabili in modo indipendente.',
        },
      ],
      outcome: [
        'Corrieri (InPost, DHL, inTime) e software contabili (QuickBooks, Fakturownia, e-boekhouden) integrati con un’unica architettura.',
        'Nuovi fornitori abilitati in produzione senza necessità di compilazione e rilascio.',
      ],
      stack: ['Angular', 'JSON Schema', 'n8n', 'NestJS', 'MongoDB'],
      confidentiality: employerWorkIt,
      rank: { recruiter: 2, engineer: 3, client: 1 },
    },
    {
      slug: 'myeasylogo-graphics-library',
      title: 'Libreria grafica 2D/3D per la personalizzazione di prodotti',
      summary:
        'Libreria Angular riutilizzabile che unisce shader Three.js per anteprime 3D in tempo reale con un editor Fabric.js per testi curvi, immagini e storico azioni.',
      client: 'Euro Tech Conseil (MyEasyLogo)',
      period: '2021 – 2023',
      role: 'Sviluppatore Front-End Angular',
      context:
        'MyEasyLogo consente agli utenti di personalizzare prodotti come legno inciso e segnaletica, visualizzando il risultato prima dell’acquisto. Molteplici applicazioni condividevano questo bisogno.',
      problem:
        'Gli utenti avevano bisogno di un’anteprima 3D fotorealistica dei materiali e dell’incisione laser mentre modificavano testi e grafiche complesse, e la funzione doveva essere riutilizzabile ovunque.',
      approach: [
        {
          decision:
            'Impacchettare studio di progettazione e anteprima in una libreria Angular indipendente.',
          why: 'Ogni applicazione consuma la medesima API del componente senza duplicare codice di gestione canvas.',
        },
        {
          decision:
            'Calcolare i materiali con shader WebGL personalizzati in Three.js.',
          why: 'Anteprime in tempo reale delle venature del legno e dell’incisione laser che si aggiornano istantaneamente a ogni modifica.',
        },
        {
          decision:
            'Utilizzare Fabric.js per l’editor 2D con motore di annulla/ripristina orientato allo stato.',
          why: 'Testi curvi, deformazione immagini, integrazione con CKEditor e tracciamento reversibile di ogni azione.',
        },
      ],
      outcome: [
        'Anteprime 3D fotorealistiche di incisioni e texture legno calcolate in tempo reale nel browser.',
        'Un’unica libreria modulare alla base di tutte le funzioni di design.',
      ],
      stack: [
        'Angular',
        'Three.js',
        'Shader WebGL',
        'Fabric.js',
        'CKEditor',
        'RxJS',
      ],
      confidentiality: employerWorkIt,
      rank: { recruiter: 3, engineer: 4, client: 3 },
    },
    {
      slug: 'this-platform',
      title: 'Questo sito: una piattaforma micro-frontend distribuita a 0 $',
      summary:
        'Monorepo Nx di micro-frontend Angular 22 zoneless con Native Federation, pre-renderizzato, installabile e ospitato su Cloudflare senza costi di infrastruttura.',
      client: 'Progetto personale',
      period: '2026',
      role: 'Architetto e sviluppatore',
      context:
        'I portfolio si limitano spesso a elencare competenze. Questo sito è concepito esattamente come una piattaforma di produzione per clienti: l’architettura stessa ne è la prova, con ogni decisione registrata come ADR.',
      problem:
        'Unire micro-frontend, pre-rendering SEO, supporto offline e Content Security Policy restrittiva su hosting gratuito, senza alcun compromesso o attrito.',
      approach: [
        {
          decision:
            'Native Federation sul builder esbuild ufficiale di Angular anziché Webpack Module Federation.',
          why: 'Angular e Nx adottano esbuild come standard; Native Federation si fonda sugli standard nativi del web garantendo longevità.',
        },
        {
          decision:
            'Pre-rendering dei contenuti nello shell; rendering dei micro-frontend unicamente nel browser.',
          why: 'I motori di ricerca ricevono vero HTML veloce dalla CDN senza carichi server, e ogni remote si aggiorna autonomamente.',
        },
        {
          decision:
            'Trattare ogni remote come servizio potenzialmente fallibile: timeout, verifica di contratto e interfaccia di fallback.',
          why: 'Un’applicazione remota non disponibile mostra un messaggio chiaro senza compromettere il funzionamento del resto del sito.',
        },
        {
          decision:
            'Generare gli header CSP in fase di rilascio tramite hash sha256 dei file HTML generati.',
          why: 'Politica di sicurezza rigorosa contro attacchi XSS pienamente compatibile con la generazione statica.',
        },
      ],
      outcome: [
        'Attivo su Cloudflare a costo zero, distribuito da GitHub Actions unicamente per le applicazioni modificate.',
        'Zero violazioni della Content Security Policy e nessun errore console in produzione.',
        'Funziona perfettamente offline dopo la prima visita, inclusi i moduli Angular federati.',
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
        { label: 'Codice sorgente', href: site.repository, external: true },
        {
          label: 'Decisioni architetturali (ADR)',
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
