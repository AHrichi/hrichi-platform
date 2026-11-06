import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { Seo } from '@ah/portfolio/util-seo';
import { isAppEnabled } from '@ah/shared/content';
import { PreferencesStore, type SiteLanguage } from '@ah/shared/state';
import { AhButton, AhScrollHint, Badge, SectionHeading, Tag } from '@ah/ui';

interface AppItem {
  id: string;
  title: string;
  category: 'production' | 'lab';
  badge: {
    label: string;
    variant: 'success' | 'accent' | 'info' | 'warning' | 'neutral';
    pulse?: boolean;
  };
  eyebrow: string;
  summary: string;
  route: string;
  stack: string[];
  features: string[];
  architectureNotes: string;
  credentialsNote?: string;
  icon: string;
  ctaLabel?: string;
}

type LabText = Pick<
  AppItem,
  'title' | 'eyebrow' | 'summary' | 'features' | 'architectureNotes'
> & {
  badge: string;
};

const LAB_COPY: Partial<Record<SiteLanguage, Record<string, LabText>>> = {
  fr: {
    sky: {
      title: 'Sky Lab · Planétarium 3D interactif et éphémérides',
      badge: '🌌 Moteur 3D WebGL',
      eyebrow: 'Astronomie et 3D · WebGL et Orekit Spring Boot',
      summary:
        'Choisissez un lieu sur Terre, plongez depuis l’orbite jusqu’au sol et explorez le ciel nocturne en temps réel : 5 000 étoiles réelles, constellations, phases exactes de la Lune, planètes visibles, Voie lactée et étoiles filantes.',
      features: [
        'Globe terrestre 3D avec plongée fluide jusqu’au point de vue de l’observateur',
        'Ciel de 5 000 étoiles réelles avec les figures des constellations',
        'Phase de la Lune et position des planètes pour n’importe quelle date',
        'Crépuscules, fenêtres de nuit noire et planificateur des meilleures nuits',
      ],
      architectureNotes:
        'Moteur Three.js sans framework, rendu à la demande, pause hors écran et adaptation automatique pour tenir 60 i/s sur mobile comme sur ordinateur.',
    },
    rxjs: {
      title: 'Labo RxJS · Opérateurs de flux et architecture réactive',
      badge: '🧪 Labo réactif',
      eyebrow: 'Programmation réactive · Diagrammes marbre et contre-pression',
      summary:
        'Un laboratoire interactif pour maîtriser les flux RxJS : diagrammes marbre animés, comparaison d’opérateurs, stratégies de contre-pression, sujets multicast et interopérabilité avec les signaux.',
      features: [
        'Diagrammes marbre en direct : émissions asynchrones et propagation des erreurs',
        'Contre-pression côte à côte : debounceTime, throttleTime, auditTime, sampleTime',
        'Simulateur d’opérateurs : switchMap, mergeMap, concatMap, exhaustMap',
        'Modèles robustes : nouvelle tentative exponentielle et dédoublonnage des requêtes',
      ],
      architectureNotes:
        'Visualiseur réactif sans zone.js reliant directement les Observables RxJS aux Signals Angular.',
    },
    ngrx: {
      title: 'Labo NgRx · SignalStore et architecture Redux',
      badge: '🏛️ Labo d’architecture',
      eyebrow: 'Architecture d’état · NgRx Store et @ngrx/signals',
      summary:
        'Un atelier complet sur les architectures d’état : flux Redux unidirectionnel visualisé, effets asynchrones, SignalStore déclaratif avec entités normalisées et matrice de comparaison.',
      features: [
        'Cycle Redux interactif en 4 étapes (action → reducer → sélecteur → effet)',
        'SignalStore déclaratif avec withEntities(), withComputed() et rxMethod()',
        'Débogage « voyage dans le temps » : instantanés, relecture et retour arrière',
        'Comparatif détaillé : NgRx Store, SignalStore et état par services',
      ],
      architectureNotes:
        'Montre les modèles d’état Angular modernes sans zone.js, entre composition fonctionnelle légère et invariants solides.',
    },
  },
  ar: {
    sky: {
      title: 'مختبر السماء · قبة فلكية ثلاثية الأبعاد ومحرّك تقويم فلكي',
      badge: '🌌 محرّك WebGL ثلاثي الأبعاد',
      eyebrow:
        'علم الفلك والرسوم ثلاثية الأبعاد · WebGL وOrekit مع Spring Boot',
      summary:
        'اختر أي مكان على الأرض، واهبط من المدار إلى سطح الأرض، واستكشف سماء الليل في الوقت الحقيقي: 5000 نجم حقيقي، والكوكبات، وأطوار القمر الدقيقة، والكواكب المرئية، ودرب التبانة، وزخات الشهب.',
      features: [
        'كرة أرضية ثلاثية الأبعاد مع هبوط سلس حتى منظور الراصد على الأرض',
        'سماء من 5000 نجم حقيقي مع رسوم الكوكبات',
        'طور القمر ومواقع الكواكب لأي تاريخ ماضٍ أو قادم',
        'الشفق ونوافذ الظلام ومخطِّط لأفضل ليالي الرصد',
      ],
      architectureNotes:
        'محرّك Three.js دون إطار عمل، يرسم عند الحاجة فقط ويتوقف خارج الشاشة ويتكيّف تلقائيًا ليحافظ على 60 إطارًا في الثانية على الهاتف والحاسوب.',
    },
    rxjs: {
      title: 'مختبر RxJS · مشغّلات التدفق والبنية التفاعلية',
      badge: '🧪 مختبر تفاعلي',
      eyebrow: 'البرمجة التفاعلية · مخططات الكرات والضغط العكسي',
      summary:
        'مختبر تفاعلي لإتقان تدفقات RxJS: مخططات كرات متحركة، ومقارنة المشغّلات، واستراتيجيات الضغط العكسي، والمواضيع متعددة البث، والتكامل مع الإشارات.',
      features: [
        'مخططات كرات حيّة للقيم غير المتزامنة وانتشار الأخطاء',
        'مقارنة الضغط العكسي جنبًا إلى جنب: debounceTime وthrottleTime وauditTime وsampleTime',
        'محاكي المشغّلات: switchMap وmergeMap وconcatMap وexhaustMap',
        'أنماط متينة: إعادة المحاولة بتأخير متزايد وإزالة الطلبات المكررة',
      ],
      architectureNotes:
        'أداة عرض تفاعلية دون zone.js تربط Observables من RxJS مباشرة بإشارات Angular.',
    },
    ngrx: {
      title: 'مختبر NgRx · SignalStore وبنية Redux',
      badge: '🏛️ مختبر البنية',
      eyebrow: 'بنية الحالة · NgRx Store و@ngrx/signals',
      summary:
        'ورشة شاملة لبُنى إدارة الحالة: تدفق Redux أحادي الاتجاه مرئيًا، والتأثيرات غير المتزامنة، وSignalStore التصريحي مع الكيانات المنظَّمة، ومصفوفة مقارنة.',
      features: [
        'دورة Redux تفاعلية من 4 مراحل (إجراء ← مُخفِّض ← مُحدِّد ← تأثير)',
        'SignalStore تصريحي مع withEntities() وwithComputed() وrxMethod()',
        'تصحيح بالسفر عبر الزمن: لقطات وإعادة تشغيل وتراجع',
        'مقارنة مفصّلة بين NgRx Store وSignalStore والحالة عبر الخدمات',
      ],
      architectureNotes:
        'يعرض أنماط الحالة الحديثة في Angular دون zone.js، بين التركيب الوظيفي الخفيف والثوابت المتينة.',
    },
  },
  it: {
    sky: {
      title: 'Sky Lab · Planetario 3D interattivo ed effemeridi celesti',
      badge: '🌌 Motore 3D WebGL',
      eyebrow: 'Astronomia e Grafica 3D · WebGL & Orekit Spring Boot',
      summary:
        'Scegli qualsiasi punto sulla Terra, scendi dall’orbita al suolo ed esplora la volta celeste in tempo reale: 5.000 stelle reali, costellazioni, fasi lunari esatte, pianeti visibili, Via Lattea e sciami meteorici.',
      features: [
        'Globo terrestre 3D con discesa orbitale fluida fino alla prospettiva dell’osservatore',
        'Cielo stellato in tempo reale con 5.000 stelle reali e tracciati delle costellazioni',
        'Effemeridi esatte di fasi lunari e posizioni planetarie per qualsiasi data storica o futura',
        'Crepuscoli astronomici, finestre di buio profondo e pianificatore delle migliori notti',
      ],
      architectureNotes:
        'Motore Three.js framework-free con rendering on-demand, pausa automatica fuori schermo e adattamento prestazionale per garantire 60 fps su smartphone e desktop.',
    },
    rxjs: {
      title: 'Laboratorio RxJS · Operatori di flusso e architettura reattiva',
      badge: '🧪 Lab Reattivo',
      eyebrow: 'Programmazione Reattiva · Diagrammi a biglie e contropressione',
      summary:
        'Un laboratorio interattivo per padroneggiare i flussi RxJS complessi: diagrammi a biglie (marble) animati, comparatore di operatori, strategie di contropressione, subject multicast e interoperabilità con i Signals.',
      features: [
        'Diagrammi marble dal vivo con emissioni asincrone e propagazione degli errori',
        'Confronto contropressione: debounceTime, throttleTime, auditTime, sampleTime',
        'Simulatore di combinazione operatori: switchMap, mergeMap, concatMap, exhaustMap',
        'Pattern di resilienza enterprise: retry con backoff esponenziale e deduplicazione richieste',
      ],
      architectureNotes:
        'Visualizzatore reattivo zoneless che collega gli Observable RxJS direttamente ai Signals di Angular senza overhead di zone.js.',
    },
    ngrx: {
      title: 'Laboratorio NgRx · SignalStore e architettura Redux',
      badge: '🏛️ Lab Architetturale',
      eyebrow: 'Architettura di Stato · NgRx Store e @ngrx/signals',
      summary:
        'Un banco di prova completo sulle architetture di stato: flusso unidirezionale Redux visualizzato, effetti asincroni, SignalStore dichiarativo con normalizzazione delle entità e matrice comparativa.',
      features: [
        'Ciclo Redux interattivo in 4 fasi (Dispatch Action → Reducer → Selector → Effect)',
        'SignalStore dichiarativo con withEntities(), withComputed() e pipeline rxMethod()',
        'Pannello di time-travel debugging: snapshot di stato, replay e rollback',
        'Confronto dettagliato: NgRx Store, SignalStore e stato basato su servizi',
      ],
      architectureNotes:
        'Dimostra i moderni pattern di stato di Angular senza zone.js, combinando composizione funzionale leggera e invarianti enterprise rigorosi.',
    },
  },
  de: {
    sky: {
      title: 'Sky Lab · Interaktives 3D-Planetarium & Himmelsephemeriden',
      badge: '🌌 3D-WebGL-Engine',
      eyebrow: 'Astronomie & 3D-Computergrafik · WebGL & Orekit Spring Boot',
      summary:
        'Wähle einen beliebigen Ort auf der Erde, tauche vom Orbit auf Bodenhöhe ab und erkunde den Nachthimmel in Echtzeit: 5.000 reale Sterne, Sternbilder, exakte Mondphasen, sichtbare Planeten, Milchstraße und Sternschnuppen.',
      features: [
        'Interaktiver 3D-Erdglobus mit stufenlosem Orbitalflug bis zur Beobachterperspektive',
        'Echtzeit-Sternenhimmel aus 5.000 realen Sternen mit projizierten Sternbildfiguren',
        'Exakte Mondphasen- und Planetenpositionsberechnungen für beliebige historische oder künftige Daten',
        'Astronomische Dämmerung, Dunkelfenster und Beobachtungsplaner',
      ],
      architectureNotes:
        'Framework-freie Three.js-Engine mit On-Demand-Rendering, Off-Screen-Pause und automatischer Leistungsskalierung für stabile 60 fps auf Mobilgeräten und Desktops.',
    },
    rxjs: {
      title: 'RxJS-Praxislabor · Stream-Operatoren & Reaktive Architektur',
      badge: '🧪 Reaktives Labor',
      eyebrow: 'Reaktive Programmierung · Marble-Diagramme & Gegendruck',
      summary:
        'Ein interaktives Experimentierfeld zur Beherrschung von RxJS-Datenströmen: Animierte Marble-Diagramme, Operator-Vergleiche, Backpressure-Strategien, Multicast-Subjects und Signal-Interoperabilität.',
      features: [
        'Interaktive Marble-Diagramme mit asynchronen Emissionen und Fehlerfortpflanzung',
        'Backpressure-Direktvergleich: debounceTime, throttleTime, auditTime, sampleTime',
        'Operator-Simulator im Vergleich: switchMap, mergeMap, concatMap, exhaustMap',
        'Resiliente Produktions-Muster: Exponentielles Retry-Backoff und Request-Deduplizierung',
      ],
      architectureNotes:
        'Zoneless reaktive Pipeline, die RxJS-Observables ohne Zone.js-Overhead direkt mit Angular Signals verbindet.',
    },
    ngrx: {
      title: 'NgRx-Zustandslabor · SignalStore & Redux-Workbench',
      badge: '🏛️ Architektur-Labor',
      eyebrow: 'State-Architektur · NgRx Store & @ngrx/signals',
      summary:
        'Umfassende Workbench für Enterprise-State-Architekturen: Unidirektionaler Redux-Datenfluss visualisiert, asynchrone Effekte, deklarativer SignalStore mit Entitäts-Normalisierung und Vergleichsmatrix.',
      features: [
        'Interaktiver 4-Stufen-Redux-Zyklus (Action Dispatch → Reducer Transition → Selector Query → Effect Execution)',
        'Deklarativer SignalStore mit withEntities(), withComputed() und rxMethod() Pipelines',
        'Time-Travel-Debugging: State-Snapshots, Replay-Steuerung und Rollback',
        'Architektur-Vergleich: NgRx Store vs. SignalStore vs. Service-basierter State',
      ],
      architectureNotes:
        'Demonstriert moderne Angular-State-Muster ohne Zone.js – verbindet leichtgewichtige funktionale Komposition mit robusten Enterprise-Invarianten.',
    },
  },
};

@Component({
  selector: 'ah-apps-page',
  standalone: true,
  imports: [AhButton, AhScrollHint, Badge, RouterLink, SectionHeading, Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './apps-page.html',
  styleUrl: './apps-page.scss',
})
export class AppsPage {
  /** The site's language, set by the header's switch (PreferencesStore). */
  readonly currentLang = inject(PreferencesStore).language;
  /** "Go" arrows point the way the text reads. */
  protected readonly arrow = computed(() =>
    this.currentLang() === 'ar' ? '←' : '→',
  );

  readonly t = computed(() => {
    const l = this.currentLang();
    switch (l) {
      case 'ar':
        return {
          heroEyebrow: 'هندسة المحفظة والحلول البرمجية',
          heroHeading: 'التطبيقات والمختبرات الهندسية التفاعلية',
          heroLead:
            'استكشف منصات الإنتاج والمختبرات الهندسية المتقدمة المبنية بتقنيات Angular 22 Zoneless وNative Federation وThree.js WebGL وNestJS وهياكل الحالة التفاعلية. جميع المنصات أدناه تفاعلية بالكامل وموثقة بدقة.',
          jumpProduction: 'تطبيقات الإنتاج',
          jumpLabs: 'المختبرات الهندسية التفاعلية',
          prodEyebrow: 'المنصات التجارية والهندسية',
          prodHeading: 'تطبيقات بيئة الإنتاج المباشرة',
          prodLead:
            'أنظمة برمجية متكاملة مصممة لسير العمل الواقعي، والعمليات الموزعة، والحوسبة التي تركز أولاً على الخصوصية.',
          labsEyebrow: 'البحوث التخصصية والأدوات',
          labsHeading: 'المختبرات الهندسية التفاعلية',
          labsLead:
            'بيئات عمل عملية توضح رسوميات الحاسوب ثلاثية الأبعاد WebGL، تدفقات البرمجة التفاعلية المعقدة، وهياكل الحالة الحديثة.',
          keyCapabilities: 'المميزات والقدرات الرئيسية:',
          interactiveExperiments: 'التجارب التفاعلية:',
          architectureTitle: 'الهندسة المعمارية والأمان:',
          howToTestTitle: 'طريقة التجربة:',
          launchPrefix: 'تشغيل',
          expandTicket: 'توسيع',
          collapseTicket: 'طي',
          expandAll: 'توسيع الكل',
          collapseAll: 'طي الكل',
        };
      case 'fr':
        return {
          heroEyebrow: 'Architecture de Portfolio & Solutions',
          heroHeading: 'Applications & Laboratoires Interactifs',
          heroLead:
            "Explorez des plateformes de production et des bancs d'essai d'ingénierie spécialisés conçus avec Angular 22 Zoneless, Native Federation, Three.js WebGL, NestJS et des architectures d'état réactives. Chaque système ci-dessous est 100% interactif et documenté.",
          jumpProduction: 'Applications de Production',
          jumpLabs: "Laboratoires d'Ingénierie",
          prodEyebrow: 'Plateformes Métier & Commerciales',
          prodHeading: 'Applications en Production',
          prodLead:
            'Systèmes complets conçus pour de véritables flux opérationnels, la logistique distribuée et la confidentialité des données.',
          labsEyebrow: 'Recherche Appliquée & Outillage',
          labsHeading: "Laboratoires d'Ingénierie Interactifs",
          labsLead:
            "Bancs d'essai interactifs démontrant le rendu 3D WebGL, les flux réactifs RxJS complexes et les architectures d'état modernes.",
          keyCapabilities: 'Capacités & Fonctionnalités Clés :',
          interactiveExperiments: 'Expériences Interactives :',
          architectureTitle: 'Architecture & Sécurité :',
          howToTestTitle: 'Comment tester :',
          launchPrefix: 'Lancer',
          expandTicket: 'Développer',
          collapseTicket: 'Réduire',
          expandAll: 'Tout développer',
          collapseAll: 'Tout réduire',
        };
      case 'it':
        return {
          heroEyebrow: 'Architettura del Portfolio & Soluzioni',
          heroHeading: 'Applicazioni & Laboratori Interattivi',
          heroLead:
            'Esplora piattaforme pronte per la produzione e banchi di prova ingegneristici specializzati realizzati con Angular 22 Zoneless, Native Federation, Three.js WebGL, NestJS e architetture di stato reattive. Ogni sistema qui sotto è completamente interattivo e documentato.',
          jumpProduction: 'Applicazioni di Produzione',
          jumpLabs: 'Laboratori di Ingegneria',
          prodEyebrow: 'Piattaforme Aziendali & Industriali',
          prodHeading: 'Applicazioni in Produzione',
          prodLead:
            'Sistemi full-stack progettati per flussi operativi reali, logistica distribuita ed elaborazione orientata alla massima privacy.',
          labsEyebrow: 'Ricerca Applicata & Strumenti',
          labsHeading: 'Laboratori di Ingegneria Interattivi',
          labsLead:
            'Banchi di lavoro pratici che dimostrano la computer grafica 3D WebGL, complessi flussi reattivi RxJS e moderne architetture di stato.',
          keyCapabilities: 'Caratteristiche e Funzionalità Chiave:',
          interactiveExperiments: 'Esperimenti Interattivi:',
          architectureTitle: 'Architettura & Protezione Quote:',
          howToTestTitle: 'Come testare:',
          launchPrefix: 'Avvia',
          expandTicket: 'Espandi',
          collapseTicket: 'Riduci',
          expandAll: 'Espandi tutto',
          collapseAll: 'Riduci tutto',
        };
      case 'de':
        return {
          heroEyebrow: 'Portfolio-Architektur & Softwarelösungen',
          heroHeading: 'Anwendungen & Interaktive Labore',
          heroLead:
            'Erkunden Sie produktionsreife Plattformen und spezialisierte Ingenieur-Workbenches, entwickelt mit zoneless Angular 22, Native Federation, Three.js WebGL, NestJS und reaktiven Zustandsarchitekturen. Jedes System ist vollständig interaktiv und dokumentiert.',
          jumpProduction: 'Produktionsanwendungen',
          jumpLabs: 'Ingenieur-Labore',
          prodEyebrow: 'Unternehmensplattformen & Industrie',
          prodHeading: 'Anwendungen im Produktiveinsatz',
          prodLead:
            'Ganzheitliche, domänengetriebene Systeme für reale Geschäftsprozesse, verteilte Abläufe und datenschutzorientierte Berechnungen.',
          labsEyebrow: 'Angewandte Forschung & Tooling',
          labsHeading: 'Interaktive Ingenieur-Labore',
          labsLead:
            'Praxisorientierte Workbenches zur Demonstration von 3D-WebGL-Computergrafik, komplexen reaktiven RxJS-Streams und modernen Zustandsarchitekturen.',
          keyCapabilities: 'Wesentliche Fähigkeiten & Funktionen:',
          interactiveExperiments: 'Interaktive Experimente:',
          architectureTitle: 'Architektur & Kontingentschutz:',
          howToTestTitle: 'Testanleitung:',
          launchPrefix: 'Starten',
          expandTicket: 'Erweitern',
          collapseTicket: 'Einklappen',
          expandAll: 'Alle erweitern',
          collapseAll: 'Alle einklappen',
        };
      case 'en':
      default:
        return {
          heroEyebrow: 'Portfolio Architecture & Solutions',
          heroHeading: 'Applications & Interactive Labs',
          heroLead:
            'Explore production-grade platforms and specialized engineering workbenches built with modern zoneless Angular 22, Native Federation, Three.js WebGL, NestJS, and reactive state architectures. Every platform below is fully interactive and documented.',
          jumpProduction: 'Production Applications',
          jumpLabs: 'Interactive Engineering Labs',
          prodEyebrow: 'Commercial Platforms',
          prodHeading: 'Production Applications',
          prodLead:
            'Full-stack, domain-driven systems designed for real business workflows, distributed operations, and privacy-first computation.',
          labsEyebrow: 'Specialized Research & Tooling',
          labsHeading: 'Interactive Engineering Labs',
          labsLead:
            'Hands-on interactive workbenches demonstrating 3D WebGL computer graphics, complex reactive streams, and modern state architectures.',
          keyCapabilities: 'Key Capabilities & Features:',
          interactiveExperiments: 'Interactive Experiments:',
          architectureTitle: 'Architecture & Quota Safeguards:',
          howToTestTitle: 'How to test:',
          launchPrefix: 'Launch',
          expandTicket: 'Expand',
          collapseTicket: 'Collapse',
          expandAll: 'Expand all',
          collapseAll: 'Collapse all',
        };
    }
  });

  /** Set of ticket/card IDs that are currently collapsed. */
  readonly collapsedCardIds = signal<Set<string>>(new Set());

  isCollapsed(id: string): boolean {
    return this.collapsedCardIds().has(id);
  }

  toggleCard(id: string, event?: Event): void {
    event?.stopPropagation();
    this.collapsedCardIds.update((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  onHeaderClick(appId: string, event: MouseEvent): void {
    const target = event.target as HTMLElement | null;
    if (target?.closest('a, button')) {
      return;
    }
    this.toggleCard(appId);
  }

  readonly allAppIds = computed(() => [
    ...this.productionApps().map((a) => a.id),
    ...this.engineeringLabs().map((l) => l.id),
  ]);

  readonly areAllCollapsed = computed(() => {
    const all = this.allAppIds();
    return all.length > 0 && all.every((id) => this.collapsedCardIds().has(id));
  });

  toggleAll(): void {
    if (this.areAllCollapsed()) {
      this.collapsedCardIds.set(new Set());
    } else {
      this.collapsedCardIds.set(new Set(this.allAppIds()));
    }
  }

  private filterApps(apps: AppItem[]): AppItem[] {
    return apps.filter((app) => isAppEnabled(app.id));
  }

  protected readonly productionApps = computed<AppItem[]>(() => {
    const l = this.currentLang();
    if (l === 'ar') {
      return this.filterApps([
        {
          id: 'lighting',
          title:
            'LuxPath (SolarLux) · منصة هندسة الإنارة العمومية والطاقة الشمسية',
          category: 'production',
          badge: {
            label: '☀️ الإنارة والطاقة الشمسية',
            variant: 'success',
            pulse: true,
          },
          eyebrow:
            'الهندسة المدنية والضوئية الميدانية · EN 13201 / Eurocode 7 / NF EN 206',
          summary:
            'منصة هندسية ميدانية متكاملة لمهندسي ومشرفي تركيب الإنارة العامة (الشبكة التقليدية والأعمدة الشمسية المستقلة). حساب تباعد الأعمدة وفق EN 13201، التحقق من عمق الحفر والكتل الخرسانية وفق Eurocode 7، اختبار هبوط الخرسانة ومقاومة 7 أيام، ميزان شاقولي رقمي لانحراف الأعمدة (EN 40)، مقياس مسافات وارتفاع بالكاميرا، وخريطة تفاعلية لتحديد مواقع الأعمدة دون إنترنت.',
          route: '/apps/lighting',
          icon: '💡',
          ctaLabel: 'LuxPath',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Leaflet OpenStreetMap',
            'DeviceOrientation Gyroscope',
            'Camera WebRTC',
            'IndexedDB Local Storage',
            'Trilingual RTL (FR/AR/EN)',
            'NgRx SignalStore',
          ],
          features: [
            'حساب تباعد الأعمدة والشدة الضوئية وفق معيار EN 13201 (فئات الطرق M و C و P)',
            'التحقق من كتل الأساس الخرسانية ومقاومة الرياح تحت معيار Eurocode 7',
            'التحقق من جودة الخرسانة واختبار مخروط أبرامز ومقاومة 7 أيام وفق NF EN 206',
            'ميزان شاقولي رقمي لانحراف واستقامة العمود مع خطوات تعديل الصواميل (EN 40)',
            'مقياس مسافات وارتفاع الأعمدة عبر كاميرا الهاتف وزاوية الميلان',
            'خريطة جغرافية تفاعلية لتحديد مواقع الأعمدة وحساب المسافات بنظام GPS',
            'حساب أحجام الألواح الشمسية وبطاريات LiFePO4 مع فترات التعتيم الليلي',
            'تصدير تذكيرات المواعيد للتقويم (.ics) وإرسال البريد بنقرة واحدة',
          ],
          architectureNotes:
            'معمارية تعمل 100% دون الحاجة إلى إنترنت، مع حفظ المشاريع وسجلات الفحص محلياً في IndexedDB.',
        },
        {
          id: 'autosphere',
          title:
            'AutoSphere · صالة عرض رقمية وتطبيق ضبط سيارات كهربائية ثلاثي الأبعاد',
          category: 'production',
          badge: {
            label: '🚗 Contentful CDA + سيارات 800V',
            variant: 'accent',
            pulse: true,
          },
          eyebrow:
            'التجربة الرقمية للسيارات · إدارة المحتوى دون رأس Contentful وتكوين فوري',
          summary:
            'صالة عرض سيارات وتطبيق ضبط سيارات كهربائية فوري مبني لتحقيق صفر تحول في التصميم (CLS = 0) وسرعة استجابة فائقة (INP < 50ms). يتكامل مع CMS بدون رأس Contentful مع معاينة مباشرة وتزامن في الكتالوج، واختيار محركات 800V، وعينات ألوان طلاء متعددة، وحساب تأثير العجلات على مدى WLTP، وحسابات تأجير فوري.',
          route: '/apps/autosphere',
          icon: '⚡',
          ctaLabel: 'AutoSphere',
          stack: [
            'Zoneless Angular 22 Signals',
            'Contentful CDA & Live Preview',
            'Design System (@ah/ui)',
            'Vector SVG Zero-CLS Engine',
            'Core Web Vitals Optimized',
          ],
          features: [
            'تكامل Contentful Headless CMS: معاينة المسودات وتزامن بيانات الفئات والألوان والخيارات',
            'منصة عرض متجهية Zero-CLS بنسبة 16:9 وزوايا ثلاثية الأبعاد ومخطط هندسي',
            'محرك دهان ديناميكي بتأثيرات لماعة وميتاليك ومطفأة عبر نظام التصميم',
            'إعادة حساب مدى WLTP فوري وفق ديناميكا الهواء وأبعاد العجلات',
            'حساب خطة التمويل والتأجير الشهري التفاعلي',
            'إصدار كود حجز وتخصيص سيارة مع دفعة مقدمة رمزية',
          ],
          architectureNotes:
            'مخزن إشارات تفاعلي zoneless متصل مباشرة بـ Contentful CDA بدون أي طلبات صور معطلة للحصول على LCP < 0.4 ثانية.',
        },
        {
          id: 'basecamp',
          title: 'Basecamp · مخطط رحلات التخييم',
          category: 'production',
          badge: { label: '🏕️ تخييم ونجوم', variant: 'success' },
          eyebrow: 'الطقس · رصد السماء · قوائم الحقيبة · يعمل دون اتصال',
          summary:
            'خطّط لرحلة تخييم على هاتفك: حدّد مكان المخيم على الخريطة، وتابع توقعات الطقس حتى 16 يومًا مع تنبيهات الصقيع والرياح والمطر، واعرف أفضل ليلة لرصد النجوم (ساعات الظلام، القمر، زخات الشهب)، وجهّز قائمة حقيبة على مقاس المجموعة، ثم شارك الرحلة مع أصدقائك برابط دون حساب ولا خادم.',
          route: '/apps/basecamp',
          icon: '🏕️',
          ctaLabel: 'Basecamp',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Leaflet OpenStreetMap',
            'Open-Meteo API',
            'astronomy-engine',
            'CompressionStream share links',
            'IndexedDB Local Storage',
            'Trilingual RTL (FR/AR/EN)',
            'NgRx SignalStore',
          ],
          features: [
            'مكان المخيم على خريطة OpenStreetMap مع البحث وتحديد الموقع',
            'توقعات Open-Meteo يومًا بيوم مع تنبيهات الصقيع والرياح والمطر والحر',
            'ليالي الرحلة محسوبة على الهاتف: الظلام التام، طور القمر، الشهب، ونتيجة للرصد',
            'رابط إلى مختبر السماء لرؤية نجوم أفضل ليلة',
            'قائمة حقيبة حسب نوع الرحلة وعدد المشاركين والليالي، مع توزيع من يحضر ماذا',
            'أغراض يضيفها الطقس تلقائيًا (غطاء مشمّع، طبقة دافئة، حبال شدّ)',
            'جرد المعدات الشخصية لمعرفة ما يجب شراؤه أو استعارته',
            'مشاركة الرحلة برابط مضغوط في جزء العنوان، ونسخة احتياطية JSON',
          ],
          architectureNotes:
            'يعمل دون اتصال: الرحلات والمعدات وآخر توقعات في IndexedDB، وحسابات السماء على الجهاز.',
        },
        {
          id: 'alarm-engine',
          title: 'Nightly Alarm Decision Engine · محرك قرارات المنبه الليلي',
          category: 'production',
          badge: { label: '🌙 بروتوكول النوم', variant: 'accent', pulse: true },
          eyebrow: 'التكرار المتباعد وجدولة العادات اليومية · د-3 / د-7 / د-14',
          summary:
            'خوارزمية ليلية دقيقة تنظم مواعيد الاستيقاظ والمراجعة الذكية وتنهي العشوائية. أجب عن استبيان سريع حول أداء التعلم اليوم، ليحسب المحرك مراجعات التكرار المتباعد (بعد 3 و 7 و 14 يوماً)، ويكتشف محطات التثبيت كل 6 فصول، ويولد عناوين منبهات الغد الجاهزة للنسخ بنقرة واحدة.',
          route: '/apps/alarm-engine',
          icon: '⏰',
          ctaLabel: 'المنبهات الليلية',
          stack: [
            'Zoneless Angular 22',
            'Spaced Repetition Engine',
            'IndexedDB & Local Storage',
            '@ah/ui Design Tokens',
            'Mobile-First Dark Mode',
          ],
          features: [
            'قائمة تفاعلية لطقوس النوم في 9 خطوات مع شريط تقدم لحظي',
            'استبيان تشخيصي قبل النوم يقيس إنجاز الفصول ونتائج الاختبارات',
            'تحديد تلقائي للفصول الضعيفة والمهام البرمجية المرحلة للغد',
            'قاعدة الترحيل التلقائي: ترحيل المراجعات الفائتة لمنبه 06:00 دون تشويه تواريخ الدراسة الأصلية',
            'اكتشاف أيام التثبيت الشامل (محطة 6 فصول أو 3 فصول ضعيفة فأكثر)',
            'قوالب طاقة أيام الأسبوع: العادي، الصيام (إغلاق IDE في 15:15)، والاستشفاء',
            'زر نسخ عنوان المنبه بنقرة واحدة لكل فترة ونسخ الجدول الكامل المنسق',
            'جدول تتبع دراسي تفاعلي مع تبديل حالات المراجعة ونسخ احتياطي واستعادة JSON',
            'دليل مرجعي دائم للمنبهات الثمانية لضبط تطبيق الساعة على هاتفك',
          ],
          architectureNotes:
            'حوسبة محلية وخاصة 100% في التخزين المحلي للمتصفح دون إرسال أي بيانات لأي خادم.',
        },
        {
          id: 'dispatch',
          title: 'PulseOps · مركز التحكم اللوجستي وعمليات التوزيع',
          category: 'production',
          badge: {
            label: '🟢 مباشر بالإنتاج',
            variant: 'success',
            pulse: true,
          },
          eyebrow: 'إدارة اللوجستيات والمقاولين الفرعيين · لندن',
          summary:
            'مركز قيادة متكامل للتنسيق اللوجستي التجاري وإدارة المغاسل والفنادق. إدارة الاستلام اليومي، وتخطيط مسارات السائقين، وبيانات المقاولين الفرعيين، وتتبع القطع المفقودة، وتقارير تسليم الورديات آلياً.',
          route: '/apps/dispatch',
          icon: '🧺',
          ctaLabel: 'PulseOps',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'NestJS REST API',
            'MongoDB Atlas M0',
            'AES-256-GCM',
            'PBKDF2 Auth',
            'NgRx SignalStore',
          ],
          features: [
            'لوحة كانبان بـ 6 مراحل لحظية لتتبع الطلبيات من الاستلام حتى الفوترة',
            'توزيع أسطول السائقين وترتيب محطات التوصيل مع طلب رحلات الطوارئ',
            'إدارة مصانع المقاولين الفرعيين وتتبع السعة وجودة الغسيل',
            'محاكاة مركز رسائل واتساب مع العملاء والسائقين ووحدات الإنتاج',
            'إثبات التسليم الرقمي (POD) مع التقاط التوقيع ورمز بوابة التحميل',
            'تقارير تسليم الوردية التلقائية مع قائمة الحوادث والمتابعات',
          ],
          architectureNotes:
            'حماية مشددة لقواعد البيانات مع تشفير AES-256-GCM للبيانات الحساسة كأرقام الهواتف والتواقيع.',
        },
        {
          id: 'strategy',
          title: 'StrategyApp · محرك التخطيط المالي وتوقعات الثروة',
          category: 'production',
          badge: { label: '⚡ منصة تفاعلية', variant: 'accent' },
          eyebrow: 'التكنولوجيا المالية · محاكاة السيناريوهات وموازنة التدفقات',
          summary:
            'منصة استشراف مالي متعددة السيناريوهات تحسب صافي الثروة، وفترات الأمان المالي، ومعدلات الادخار وصناديق الطوارئ عبر سنوات دون إرسال أي بيانات مالية حساسة لخوادم خارجية.',
          route: '/apps/strategy',
          icon: '📈',
          ctaLabel: 'StrategyApp',
          stack: [
            'Angular 22',
            'NgRx SignalStore',
            'Chart.js',
            'IndexedDB Local Storage',
            'PDF Export Engine',
            '@ah/ui Design Tokens',
          ],
          features: [
            'محاكاة السيناريوهات المالية (الأساسي، الادخار المكثف، المحافظ، التحول المهني)',
            'دفتر أستاذ تفاعلي بقيد مزدوج مع تتبع بنود الدخل والمصروفات',
            'توقعات بيانية لحظية لصافي الثروة ورسوم تفاعلية',
            'تصدير تقرير مالي تنفيذي بصيغة PDF بنقرة واحدة',
          ],
          architectureNotes:
            'حوسبة محلية 100% مع خصوصية مطلقة للبيانات في IndexedDB دون أي اتصال خارجي.',
        },
        {
          id: 'studylm',
          title: 'StudyLM · منصة التقييم والتدريب الهندسي بالذكاء الاصطناعي',
          category: 'production',
          badge: {
            label: '🤖 محرك الذكاء الاصطناعي Groq 120B',
            variant: 'accent',
            pulse: true,
          },
          eyebrow: 'بناء المناهج البرمجية وتقييم الكفاءات التقنية خطوة بخطوة',
          summary:
            'منصة إتقان هندسة البرمجيات تعتمد على مسارات عمل n8n ونماذج Groq LPU (120B). تفكك المواضيع المعقدة إلى فصول تدريجية مع أسئلة تشخيصية وبطاقات استذكار موثقة من المراجع الرسمية.',
          route: '/apps/studylm',
          icon: '📚',
          ctaLabel: 'StudyLM',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'n8n AI Workflow Engine',
            'Groq LPU (120B / 27B)',
            'NgRx SignalStore',
            'Dexie IndexedDB',
          ],
          features: [
            'حاجز ذكي يضمن اقتصار المواضيع على هندسة البرمجيات وتطوير الأنظمة',
            'تفكيك المناهج إلى فصول وأقسام ذرية مستندة إلى التوثيق الرسمي (MDN, React, PostgreSQL)',
            'بطاقات استذكار فنية مع أمثلة برمجية، ودروس تفاعلية خطوة بخطوة',
            'اختبارات تشخيصية بـ 4 خيارات مع شرح مفصل لسبب صحة الجواب وخطأ الخيارات الأخرى',
          ],
          architectureNotes:
            'تنسيق ذكاء اصطناعي متعدد المستويات عبر n8n مع تبديل تلقائي بين النماذج لضمان التوافر.',
        },
        {
          id: 'whatsapp',
          title: 'ChatPulse · محلل محادثات واتساب وذكاء العلاقات',
          category: 'production',
          badge: {
            label: '💬 تحليل محلي + ذكاء اصطناعي n8n',
            variant: 'success',
            pulse: true,
          },
          eyebrow: 'تحليلات المراسلة الفورية المعززة بالخصوصية',
          summary:
            'جناح استخباراتي للمحادثات يحلل أرشيفات واتساب (.zip / .txt) في الذاكرة دون رفع الوسائط، ويحسب أوقات الردود، وخريطة النشاط الأسبوعية، وبطاقة الملخص السنوية مع ربط مباشر بـ n8n للتحليل السلوكي.',
          route: '/apps/whatsapp',
          icon: '💬',
          ctaLabel: 'ChatPulse',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Web DecompressionStream',
            'NgRx SignalStore',
            'n8n AI Webhook',
          ],
          features: [
            'فك ضغط وقراءة المحادثات في الذاكرة مع تخطي ملفات الصور والفيديو الكبيرة',
            'كشف تلقائي لتنسيق التاريخ (يوم/شهر مقابل شهر/يوم) لأجهزة iOS و Android',
            'تحليل سرعة الرد ومبادرة المحادثات ومؤشر الرسائل المتتالية',
            'خريطة نشاط أسبوعية 7×24 مع بطاقة ملخص قابلة للمشاركة',
          ],
          architectureNotes:
            'معالجة سحابية صفرية؛ يتم التحليل بالكامل داخل متصفح المستخدم دون تخزين على أي خادم.',
        },
      ]);
    }

    if (l === 'fr') {
      return this.filterApps([
        {
          id: 'lighting',
          title:
            "LuxPath (SolarLux) · Plateforme d'Ingénierie Éclairage Public & Solaire",
          category: 'production',
          badge: {
            label: '☀️ Éclairage Solaire & Réseau',
            variant: 'success',
            pulse: true,
          },
          eyebrow:
            'Génie Civil & Photométrie de Terrain · EN 13201 / Eurocode 7 / NF EN 206',
          summary:
            "Suite technique tout-en-un pour ingénieurs et superviseurs de chantiers d'éclairage public (réseau AC et candélabres solaires autonomes). Calcul d'espacement EN 13201, validation de profondeur de fouille et massifs béton Eurocode 7, formule béton & cône d'Abrams NF EN 206, jauge d'aplomb EN 40, télémètre optique caméra et cartographie GPS hors-ligne.",
          route: '/apps/lighting',
          icon: '💡',
          ctaLabel: 'LuxPath',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Leaflet OpenStreetMap',
            'DeviceOrientation Gyroscope',
            'Camera WebRTC',
            'IndexedDB Local Storage',
            'Trilingual RTL (FR/AR/EN)',
            'NgRx SignalStore',
          ],
          features: [
            "Calcul d'implantation et d'éclairement EN 13201-2 (Ratios S/H, lux moyen et uniformité U0)",
            'Validation géotechnique des massifs béton et prise au vent panneau solaire Eurocode 7',
            "Contrôle formulation béton C25/30, affaissement cône d'Abrams et levage J+7 sous NF EN 206",
            "Niveau à bulle numérique et contrôle de verticalité EN 40 avec correction des écrous d'ancrage",
            'Télémètre optique caméra & clinomètre trigonométrique pour distance sol et hauteur mât',
            'Cartographie terrain GPS OpenStreetMap avec calcul des distances réelles inter-candélabres',
            "Dimensionnement panneau photovoltaïque Wc et batterie LiFePO4 avec profils d'abaissement nocturne",
            'Rappels jalons de chantier par email en 1 clic et téléchargement calendrier (.ics)',
          ],
          architectureNotes:
            'Architecture 100% hors-ligne avec persistance locale IndexedDB et calculs locaux sans aucun serveur externe requis.',
        },
        {
          id: 'autosphere',
          title:
            'AutoSphere · Showroom Digital Automobile Headless & Configurateur 3D',
          category: 'production',
          badge: {
            label: '🚗 Contentful CDA + VE 800V',
            variant: 'accent',
            pulse: true,
          },
          eyebrow:
            'Expérience Numérique Automobile · CMS Headless & Configurateur VE',
          summary:
            'Showroom automobile haute performance et configurateur VE en temps réel conçu pour un CLS nul (CLS = 0) et une réactivité optimale (INP < 50ms). Intègre le CMS headless Contentful (CDA & Live Preview) pour la gestion dynamique du catalogue, le choix des motorisations 800V, des nuanciers multi-finitions, le calcul de l’impact aérodynamique sur l’autonomie WLTP et la simulation de leasing.',
          route: '/apps/autosphere',
          icon: '⚡',
          ctaLabel: 'AutoSphere',
          stack: [
            'Zoneless Angular 22 Signals',
            'Contentful CDA & Live Preview',
            'Design System (@ah/ui)',
            'Moteur Vectoriel SVG Zero-CLS',
            'Optimisation Core Web Vitals',
            'Tokens Design System',
          ],
          features: [
            'Intégration CMS Headless Contentful : Live Preview des brouillons et synchronisation des finitions, teintes et options',
            'Visualiseur Responsive Zero-CLS : Scène vectorielle 16:9 avec angles 3/4 dynamique, profil aérodynamique et plan CAD blueprint',
            'Moteur de Teintes Dynamique : Finitions vernies, métallisées, mates et nacrées via le composant ColorSwatch du Design System',
            'Autonomie WLTP & Aérodynamisme : Recalcul instantané de l’autonomie selon le diamètre des jantes et la traînée aéro',
            'Moteur Financier & Leasing : Mensualité de leasing calculée en temps réel selon l’apport, la durée et les packs d’options',
            'Fiche de Spécification & Réservation : Modal avec récapitulatif complet et génération de jeton de fabrication unique',
          ],
          architectureNotes:
            'Store réactif zoneless Signals sous Angular 22 connecté à Contentful. Rendu vectoriel instantané sans requêtes d’images bloquantes pour un LCP < 0,4s.',
        },
        {
          id: 'basecamp',
          title: 'Basecamp · Planificateur de sorties camping',
          category: 'production',
          badge: { label: '🏕️ Camping & étoiles', variant: 'success' },
          eyebrow: 'Météo · Observation du ciel · Listes de sac · Hors ligne',
          summary:
            'Préparez une sortie camping sur votre téléphone : placez le camp sur la carte, suivez jusqu’à 16 jours de prévisions avec alertes gel, vent et pluie, trouvez la meilleure nuit pour les étoiles (nuit noire, Lune, étoiles filantes), préparez un sac à la taille du groupe, puis partagez la sortie par un lien, sans compte ni serveur.',
          route: '/apps/basecamp',
          icon: '🏕️',
          ctaLabel: 'Basecamp',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Leaflet OpenStreetMap',
            'Open-Meteo API',
            'astronomy-engine',
            'CompressionStream share links',
            'IndexedDB Local Storage',
            'Trilingual RTL (FR/AR/EN)',
            'NgRx SignalStore',
          ],
          features: [
            'Lieu de camp sur une carte OpenStreetMap, avec recherche et position',
            'Prévisions Open-Meteo jour par jour, avec alertes gel, vent, pluie et chaleur',
            'Nuits calculées sur le téléphone : nuit noire, phase de la Lune, étoiles filantes et score d’observation',
            'Lien vers le Sky lab pour voir les étoiles de la meilleure nuit',
            'Liste de sac selon le type de sortie, le groupe et les nuits, avec qui apporte quoi',
            'Articles ajoutés par la météo (bâche, couche chaude, haubans)',
            'Inventaire du matériel pour savoir quoi acheter ou emprunter',
            'Partage par lien compressé dans le fragment de l’URL, et sauvegarde JSON',
          ],
          architectureNotes:
            'Conçu hors ligne : sorties, matériel et dernières prévisions dans IndexedDB, calculs du ciel sur l’appareil.',
        },
        {
          id: 'alarm-engine',
          title: 'Nightly Alarm Decision Engine · Moteur de Décision de Réveil',
          category: 'production',
          badge: { label: '🌙 Protocole Soir', variant: 'accent', pulse: true },
          eyebrow:
            'Répétition Espacée & Planification des Habitudes · J-3 / J-7 / J-14',
          summary:
            "Un algorithme structuré pour la routine du coucher éliminant les réveils aléatoires. Répondez à un court questionnaire sur l'étude du jour : le moteur calcule les révisions J-3/J-7/J-14, signale les faiblesses, détecte les paliers de consolidation à 6 chapitres et génère les intitulés exacts des réveils de demain, prêts à copier en 1 clic.",
          route: '/apps/alarm-engine',
          icon: '⏰',
          ctaLabel: 'Réveils du Soir',
          stack: [
            'Zoneless Angular 22',
            'Spaced Repetition Engine',
            'Stockage Local & Sauvegarde JSON',
            '@ah/ui Design Tokens',
            'Dark Mode Mobile-First',
          ],
          features: [
            'Checklist interactive du rituel du soir en 9 étapes avec barre de progression',
            'Questionnaire diagnostique avec validation des chapitres et scores de quiz',
            'Détection automatique des chapitres critiques (≥ 3 erreurs ou score < 75%) et reports de code',
            'Règle de report Rollover : les révisions non effectuées glissent au réveil de 06h00 sans fausser les dates',
            'Détection des journées de consolidation (palier de 6 chapitres ou ≥ 3 chapitres faibles)',
            'Gabarits énergétiques : Standard, Jeûne (fermeture IDE 15h15) et Récupération (pause totale dès 15h15)',
            'Bouton Copier l’intitulé en 1 clic par créneau et Copier tout le planning formaté',
            'Tableau de suivi d’apprentissage interactif avec bascule des révisions et sauvegarde/restauration JSON',
            'Guide de référence permanent des 8 réveils pour l’application Horloge native',
          ],
          architectureNotes:
            '100% privé et hors-ligne dans le localStorage avec export/import JSON. Architecture réactive par signaux Angular 22 Zoneless.',
        },
        {
          id: 'dispatch',
          title:
            'PulseOps · Centre de Contrôle Opérationnel & Dispatch Logistique',
          category: 'production',
          badge: {
            label: '🟢 Production Live',
            variant: 'success',
            pulse: true,
          },
          eyebrow: 'Logistique Commerciale & Hub Sous-traitance · Londres',
          summary:
            "Centre de commande pour coordinateur logistique dans le secteur hôtelier et pressing commercial. Gestion des réceptions, optimisation des tournées chauffeurs, manifestes d'ateliers sous-traitants et rapports automatiques de fin de shift.",
          route: '/apps/dispatch',
          icon: '🧺',
          ctaLabel: 'PulseOps',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'NestJS REST API',
            'MongoDB Atlas M0',
            'AES-256-GCM',
            'PBKDF2 Auth',
            'NgRx SignalStore',
          ],
          features: [
            'Kanban temps réel en 6 étapes (Réception, Lavage, Prêt, Dispatché, Livré, Facturé)',
            "Dispatch flotte chauffeurs avec ordonnancement des arrêts et coursiers d'urgence",
            "Gestion des usines sous-traitantes avec suivi de capacité et fiches d'incidents qualité",
            'Hub de communication WhatsApp simulé (canaux Clients, Chauffeurs et Production)',
            "Preuve de livraison numérique (POD) avec signature et code d'accès quai de chargement",
            'Rapports de transmission de shift automatisés avec récapitulatif des litiges',
          ],
          architectureNotes:
            'Chiffrement AES-256-GCM des données sensibles et régulation stricte des quotas MongoDB Atlas Free Tier.',
        },
        {
          id: 'strategy',
          title:
            'StrategyApp · Simulateur de Projection Financière & Patrimoine',
          category: 'production',
          badge: { label: '⚡ Plateforme Interactive', variant: 'accent' },
          eyebrow: 'Fintech · Modélisation de Scénarios & Trésorerie',
          summary:
            "Plateforme de prévision financière multi-scénarios projetant le patrimoine net, le runway d'urgence et les taux d'épargne sur plusieurs années sans transmettre la moindre donnée financière vers l'extérieur.",
          route: '/apps/strategy',
          icon: '📈',
          ctaLabel: 'StrategyApp',
          stack: [
            'Angular 22',
            'NgRx SignalStore',
            'Chart.js',
            'IndexedDB Local Storage',
            'PDF Export Engine',
            '@ah/ui Design Tokens',
          ],
          features: [
            'Simulations financières multi-scénarios (Base, Épargne offensive, Prudent, Reconversion)',
            'Grand livre interactif en partie double avec ventilation budgétaire',
            'Projections du patrimoine net en temps réel et visualisations graphiques',
            'Export automatisé de rapport de synthèse patrimoniale au format PDF',
          ],
          architectureNotes:
            'Confidentialité absolue : calcul 100% côté client avec base locale IndexedDB et zéro télémétrie.',
        },
        {
          id: 'studylm',
          title:
            "StudyLM · Moteur d'Évaluation & Parcours d'Ingénierie Logicielle IA",
          category: 'production',
          badge: {
            label: '🤖 Moteur Groq 120B IA',
            variant: 'accent',
            pulse: true,
          },
          eyebrow: 'Architecte Pédagogique Autonome & Quiz Diagnostiques',
          summary:
            "Plateforme de montée en compétences logicielles orchestrée par n8n et les modèles Groq LPU (120B). Décompose les sujets d'ingénierie en chapitres progressifs avec flashcards illimitées et quiz diagnostiques à 4 options.",
          route: '/apps/studylm',
          icon: '📚',
          ctaLabel: 'StudyLM',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'n8n AI Workflow Engine',
            'Groq LPU (120B / 27B)',
            'NgRx SignalStore',
            'Dexie IndexedDB',
          ],
          features: [
            "Garde-fou thématique validant rigoureusement les sujets d'ingénierie logicielle",
            'Décomposition en chapitres et sections atomiques adossées aux documentations officielles',
            'Flashcards techniques approfondies avec extraits de code, et leçons interactives pas à pas',
            'Quiz diagnostiques à 4 choix avec explications détaillées de chaque distracteur',
          ],
          architectureNotes:
            'Orchestration IA multi-paliers via n8n avec basculement automatique Groq 120B / Qwen 27B.',
        },
        {
          id: 'whatsapp',
          title:
            'ChatPulse · Analyseur de Conversations WhatsApp & Intelligence Relationnelle',
          category: 'production',
          badge: {
            label: '💬 Analyse ZIP Locale + IA n8n',
            variant: 'success',
            pulse: true,
          },
          eyebrow: 'Télémétrie Relationnelle & Respect Strict de la Vie Privée',
          summary:
            "Suite d'analyse d'exports WhatsApp (.txt / .zip) directement dans la mémoire vive sans téléversement de médias. Calcule les temps de latence de réponse, les matrices d'activité 7×24, et se connecte à un webhook n8n pour l'analyse comportementale.",
          route: '/apps/whatsapp',
          icon: '💬',
          ctaLabel: 'ChatPulse',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Web DecompressionStream',
            'NgRx SignalStore',
            'n8n AI Webhook',
          ],
          features: [
            "Extraction d'archive en mémoire via DecompressionStream ignorant les médias lourds",
            'Détection intelligente des formats de date iOS et Android (JJ/MM vs MM/JJ)',
            'Statistiques de vitesse de réponse, initiateurs de conversations et double-texting',
            "Matrice heatmap d'activité 7×24 et carte Wrapped récapitulative partageable",
          ],
          architectureNotes:
            'Traitement localisé en RAM sans stockage distant pour une sécurité et une confidentialité maximales.',
        },
      ]);
    }

    if (l === 'it') {
      return this.filterApps([
        {
          id: 'lighting',
          title:
            'LuxPath (SolarLux) · Piattaforma di Ingegneria per Illuminazione Pubblica e Solare',
          category: 'production',
          badge: {
            label: '☀️ Suite Campo Solare & Rete',
            variant: 'success',
            pulse: true,
          },
          eyebrow:
            'Ingegneria Civile e Fotometria sul Campo · EN 13201 / Eurocode 7 / NF EN 206',
          summary:
            "Suite tecnica per ingegneri e supervisori di cantieri di illuminazione pubblica (rete AC e pali solari fotovoltaici autonomi). Calcolo dell'interdistanza EN 13201, verifica geotecnica della profondità di scavo e dei plinti Eurocode 7, controllo dell'impasto calcestruzzo e cono di Abrams NF EN 206, livella digitale per la verticalità dei pali (EN 40), telemetro ottico da fotocamera e cartografia GPS offline.",
          route: '/apps/lighting',
          icon: '💡',
          ctaLabel: 'LuxPath',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Leaflet OpenStreetMap',
            'DeviceOrientation Gyroscope',
            'Camera WebRTC',
            'IndexedDB Local Storage',
            'Multilingue (IT/DE/FR/AR/EN)',
            'NgRx SignalStore',
          ],
          features: [
            'Motore fotometrico e spaziatura EN 13201-2: valutazione rapporti S/H, illuminamento medio ed uniformità U0 per classi stradali M, C e P',
            'Verifica geotecnica dei plinti di fondazione Eurocode 7: momento ribaltante da vento, spinta aerodinamica del pannello e tirafondi M16-M24',
            'Formulazione calcestruzzo e cono di Abrams NF EN 206: verifica dosaggio 350 kg/m³, Rck, rapporto A/C ≤ 0,50 e curva di disarmo a 7 giorni',
            'Controllo verticalità e piombo EN 40: livella a bolla digitale 2D con inclinometro giroscopico e compensazione con dadi di ancoraggio',
            'Telemetro ottico con fotocamera & clinometro trigonometrico per distanza al suolo e altezza del palo',
            'Mappa di cantiere GPS interattiva: OpenStreetMap con posizionamento punti luce e calcolo distanze inter-palo',
            'Dimensionamento solare fotovoltaico e batterie LiFePO4 con profili di dimmerazione notturna',
            'Esportazione scadenze di cantiere in calendario (.ics) e invio promemoria email con un clic',
          ],
          architectureNotes:
            'Architettura da campo 100% offline-first con memorizzazione locale in IndexedDB. Tutti i calcoli tecnici vengono eseguiti localmente sul dispositivo.',
        },
        {
          id: 'autosphere',
          title:
            'AutoSphere · Showroom Digitale Headless & Configuratore Auto Elettriche 3D',
          category: 'production',
          badge: {
            label: '🚗 Contentful CDA + EV 800V',
            variant: 'accent',
            pulse: true,
          },
          eyebrow:
            'Automotive Digital Experience · Headless CMS & Configuratore Real-Time',
          summary:
            'Showroom digitale ad alte prestazioni e configuratore dinamico per veicoli elettrici con Cumulative Layout Shift nullo (CLS = 0) e latenza ultra-bassa (INP < 50ms). Integrazione con Contentful Headless CMS (CDA & Live Preview), architettura 800V, campioni colore multi-finitura, impatto aerodinamico dei cerchi su autonomia WLTP e calcolatore leasing istantaneo.',
          route: '/apps/autosphere',
          icon: '⚡',
          ctaLabel: 'AutoSphere',
          stack: [
            'Zoneless Angular 22 Signals',
            'Contentful CDA & Live Preview',
            'Design System (@ah/ui)',
            'Vector SVG Zero-CLS Engine',
            'Core Web Vitals Optimized',
          ],
          features: [
            'Integrazione CMS Headless Contentful: Live preview e sincronizzazione schema catalogo',
            'Visualizzatore Responsive Zero-CLS: Canvas 16:9 con vista 3/4 dinamica, profilo aerodinamico e blueprint CAD',
            'Motore Finiture Dinamico: Vernici lucide, metallizzate, opache e perlate tramite AhColorSwatch',
            'Autonomia WLTP & Aerodinamica: Ricalcolo in tempo reale in base a diametro cerchi e resistenza aerodinamica',
            'Calcolatore Leasing e Finanziamento: Rata mensile stimata istantanea in base ad anticipo e durata',
            'Riepilogo Specifica & Prenotazione: Finestra modale interattiva con generazione build token',
          ],
          architectureNotes:
            'Store reattivo con Angular Signals privo di zone.js connesso a Contentful CDA per un LCP < 0,4s.',
        },
        {
          id: 'basecamp',
          title: 'Basecamp · Pianificatore di Spedizioni e Campeggio',
          category: 'production',
          badge: { label: '🏕️ Campeggio & Stelle', variant: 'success' },
          eyebrow:
            'Meteo · Osservazione Astronomica · Liste Bagagli · Offline-first',
          summary:
            "Organizza una spedizione in tenda direttamente dallo smartphone: posiziona il campo sulla mappa, monitora fino a 16 giorni di previsioni con avvisi per gelo, raffiche di vento e pioggia, individua la notte ideale per osservare le stelle (finestra di buio astronomico, fase lunare, sciami meteorici), genera la checklist per l'attrezzatura e condividi il viaggio con gli amici tramite link, senza registrazione né server.",
          route: '/apps/basecamp',
          icon: '🏕️',
          ctaLabel: 'Basecamp',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Leaflet OpenStreetMap',
            'Open-Meteo API',
            'astronomy-engine',
            'CompressionStream share links',
            'IndexedDB Local Storage',
            'Multilingue (IT/DE/FR/AR/EN)',
            'NgRx SignalStore',
          ],
          features: [
            'Posizione del campo su mappa OpenStreetMap, con ricerca toponomastica e geolocalizzazione',
            'Previsioni dettagliate Open-Meteo con allerte automatiche per gelate, raffiche di vento, precipitazioni e ondate di calore',
            'Calcolo astronomico su smartphone: buio astronomico profondo, fase lunare, sciami di meteore e punteggio di visibilità',
            'Collegamento diretto al laboratorio Sky Lab per visualizzare le costellazioni della notte prescelta',
            'Checklist dinamica personalizzata in base al tipo di uscita, numero di persone e notti, con assegnazione dei compiti',
            'Suggerimenti automatici legati alle condizioni meteo (teli antivento, strati termici, tiranti rinforzati)',
            "Inventario dell'attrezzatura personale con identificazione immediata di elementi mancanti da noleggiare o acquistare",
            'Condivisione istantanea tramite link compresso nel frammento URL e backup completo in formato JSON',
          ],
          architectureNotes:
            'Concepito offline-first: viaggi, equipaggiamento e bollettini meteo salvati in IndexedDB; effemeridi celesti calcolate sul dispositivo.',
        },
        {
          id: 'alarm-engine',
          title:
            'Nightly Alarm Decision Engine · Algoritmo di Pianificazione Sveglie',
          category: 'production',
          badge: {
            label: '🌙 Protocollo Notturno',
            variant: 'accent',
            pulse: true,
          },
          eyebrow:
            'Ripetizione Spaziata & Abitudini Quotidiane · D-3 / D-7 / D-14',
          summary:
            "Un algoritmo rigoroso per la routine serale che elimina le sveglie casuali. Rispondendo a un breve questionario sull'andamento dello studio odierno, il motore calcola le sessioni di ripetizione spaziata D-3 / D-7 / D-14, segnala gli argomenti critici, individua i traguardi di consolidamento a 6 capitoli e genera le etichette esatte per le sveglie di domani, pronte per la copia con 1 clic.",
          route: '/apps/alarm-engine',
          icon: '⏰',
          ctaLabel: 'Sveglie Notturne',
          stack: [
            'Zoneless Angular 22',
            'Spaced Repetition Engine',
            'Local Storage Persistence & JSON Backup',
            '@ah/ui Design Tokens',
            'Mobile-First Dark Mode',
          ],
          features: [
            'Checklist interattiva del rituale notturno in 9 passaggi con barra di avanzamento in tempo reale',
            'Questionario diagnostico pre-sonno con verifica del completamento dei capitoli e punteggio del quiz',
            'Segnalazione automatica dei capitoli CRITICI (≥ 3 errori o punteggio < 75%) e dei task pratici in sospeso',
            'Regola di recupero Rollover: i capitoli non ripassati slittano automaticamente alla sveglia delle 06:00 senza alterare le date originali',
            'Rilevamento delle giornate di Consolidamento (traguardo di 6 capitoli o ≥ 3 capitoli deboli) con intervallo Cap. A–B',
            'Template energetici per i giorni feriali: Standard, Digiuno (chiusura IDE 15:15) e Recupero (stacco totale dopo le 15:15)',
            "Pulsante di copia del titolo con 1 clic per ciascuno slot e copia dell'intero programma sveglie formattato",
            'Tabella interattiva per il monitoraggio dello studio con attivazione manuale dei ripassi ed esportazione/ripristino JSON',
            "Guida di riferimento permanente alle 8 sveglie per la configurazione nell'app Orologio nativa dello smartphone",
          ],
          architectureNotes:
            '100% confidenziale e offline-first in localStorage con esportazione/importazione JSON. Architettura reattiva con Signals Zoneless di Angular 22.',
        },
        {
          id: 'dispatch',
          title:
            'PulseOps · Centro di Controllo Operativo e Smistamento Logistico',
          category: 'production',
          badge: {
            label: '🟢 Produzione Live',
            variant: 'success',
            pulse: true,
          },
          eyebrow: 'Logistica Commerciale e Hub Subappalti · Zone 1–4 Londra',
          summary:
            'Centro di comando per la supervisione logistica nel settore alberghiero e delle lavanderie commerciali. Gestione delle prese giornaliere, pianificazione degli itinerari autisti, manifesti dei laboratori in subappalto, gestione capi smarriti e reportistica automatica di fine turno.',
          route: '/apps/dispatch',
          icon: '🧺',
          ctaLabel: 'PulseOps',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'NestJS REST API',
            'MongoDB Atlas M0',
            'AES-256-GCM',
            'PBKDF2 Auth',
            'NgRx SignalStore',
          ],
          features: [
            'Kanban in tempo reale a 6 fasi (Ingresso, Lavaggio, Pronto, In Consegna, Consegnato, Fatturato)',
            'Gestione flotta autisti in tempo reale con ottimizzazione tappe e prenotazione corrieri urgenti',
            'Supervisione stabilimenti in subappalto con monitoraggio capacità produttiva e contestazioni qualità',
            'Hub simulato di comunicazioni WhatsApp (canali Clienti, Autisti e Produzione con buffer circolare FIFO)',
            'Prova di consegna digitale (POD) con firma su schermo e codice di sicurezza banchina di carico',
            'Report automatici di cambio turno con riepilogo ordini completati, incidenti e pendenze aperte',
          ],
          architectureNotes:
            'Crittografia AES-256-GCM dei dati sensibili a riposo e protezione rigorosa dei limiti di carico del database MongoDB Atlas Free Tier.',
        },
        {
          id: 'strategy',
          title:
            'StrategyApp · Simulatore di Pianificazione Finanziaria & Patrimonio',
          category: 'production',
          badge: { label: '⚡ Piattaforma Interattiva', variant: 'accent' },
          eyebrow: 'Fintech · Modelli di Scenario & Flussi di Cassa',
          summary:
            'Piattaforma di previsione finanziaria multi-scenario che proietta patrimonio netto, runway di emergenza e tasso di risparmio su più anni, senza mai trasmettere dati finanziari sensibili a server esterni.',
          route: '/apps/strategy',
          icon: '📈',
          ctaLabel: 'StrategyApp',
          stack: [
            'Angular 22',
            'NgRx SignalStore',
            'Chart.js',
            'IndexedDB Local Storage',
            'PDF Export Engine',
            '@ah/ui Design Tokens',
          ],
          features: [
            'Simulazioni finanziarie multi-scenario (Base, Risparmio aggressivo, Conservativo, Transizione di carriera)',
            'Mastro contabile a partita doppia interattivo con tracciamento per categorie di entrate e uscite',
            'Proiezioni del patrimonio netto in tempo reale con visualizzazioni grafiche interattive',
            'Calcolo del fondo di emergenza e avanzamento verso i traguardi finanziari',
            'Esportazione automatizzata del report esecutivo di sintesi finanziaria in formato PDF',
          ],
          architectureNotes:
            'Riservatezza assoluta: calcolo 100% lato client con persistenza locale IndexedDB e zero telemetria remota.',
        },
        {
          id: 'studylm',
          title:
            'StudyLM · Piattaforma di Formazione ed Esercitazione in Ingegneria del Software con IA',
          category: 'production',
          badge: {
            label: '🤖 Motore IA Groq 120B',
            variant: 'accent',
            pulse: true,
          },
          eyebrow:
            'Architetto Didattico Autonomo & Valutazione Sezione per Sezione',
          summary:
            "Piattaforma per la padronanza dell'ingegneria del software orchestrata tramite workflow n8n e modelli Groq LPU (120B). Scompone argomenti complessi in capitoli progressivi con flashcard illimitate e quiz diagnostici a 4 scelte.",
          route: '/apps/studylm',
          icon: '📚',
          ctaLabel: 'StudyLM',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'n8n AI Workflow Engine',
            'Groq LPU (120B / 27B)',
            'NgRx SignalStore',
            'Dexie IndexedDB',
          ],
          features: [
            'Guardrail tematico intelligente che convalida rigorosamente solo argomenti di ingegneria del software',
            'Scomposizione didattica strutturata su documentazioni ufficiali (MDN, React, PostgreSQL)',
            'Flashcard tecniche dettagliate con snippet di codice e lezioni interattive passo-passo',
            'Quiz diagnostici a 4 opzioni con spiegazioni approfondite per ciascun distrattore',
          ],
          architectureNotes:
            'Orchestrazione IA multi-livello via n8n con modello principale Groq 120B e failover automatico su Qwen 27B.',
        },
        {
          id: 'whatsapp',
          title:
            'ChatPulse · Analizzatore di Chat WhatsApp & Intelligence Relazionale con IA',
          category: 'production',
          badge: {
            label: '💬 Elaborazione ZIP Locale + IA n8n',
            variant: 'success',
            pulse: true,
          },
          eyebrow:
            'Analisi Messaggistica Privacy-First · Telemetria Comportamentale',
          summary:
            "Suite di analisi per archivi WhatsApp (.txt/.zip) eseguita direttamente nella RAM del browser senza caricare file multimediali. Calcola la distribuzione dei tempi di risposta, mappe termiche delle attività 7×24, schede riassuntive stile Wrapped e integrazione webhook n8n per l'analisi comportamentale con IA.",
          route: '/apps/whatsapp',
          icon: '💬',
          ctaLabel: 'ChatPulse',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Web DecompressionStream',
            'NgRx SignalStore',
            'n8n AI Webhook',
          ],
          features: [
            'Importazione ed elaborazione in-memory di archivi ZIP e TXT ignorando file multimediali pesanti',
            'Rilevamento intelligente del formato data per iOS e Android (GG/MM vs MM/GG)',
            'Dinamiche di risposta: tempi di reazione, promotori delle conversazioni e indice di messaggi consecutivi',
            'Mappa termica di attività settimanale 7×24 e scheda di riepilogo annuale condivisibile',
          ],
          architectureNotes:
            'Estrazione e analisi 100% lato client senza alcun caricamento di dati su server esterni.',
        },
      ]);
    }

    if (l === 'de') {
      return this.filterApps([
        {
          id: 'lighting',
          title:
            'LuxPath (SolarLux) · Feld-Engineering-Plattform für Straßen- und Solarbeleuchtung',
          category: 'production',
          badge: {
            label: '☀️ Solar- & Netzbeleuchtung',
            variant: 'success',
            pulse: true,
          },
          eyebrow:
            'Bauingenieurwesen & Feld-Photometrie · EN 13201 / Eurocode 7 / NF EN 206',
          summary:
            'Mobile All-in-One-Engineering-Suite für Bauleiter und Ingenieure im Bereich der Straßenbeleuchtung (konventionelles Netz und autarke Solarleuchten). Berechnung von Mastabständen nach EN 13201, geotechnische Bemessung von Fundamentblöcken nach Eurocode 7, Betonkonsistenzprüfung mit Setzkegel nach NF EN 206, digitale Mastlot-Wasserwaage (EN 40), optischer Kamera-Entfernungsmesser und Offline-GPS-Kartierung.',
          route: '/apps/lighting',
          icon: '💡',
          ctaLabel: 'LuxPath',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Leaflet OpenStreetMap',
            'DeviceOrientation Gyroscope',
            'Camera WebRTC',
            'IndexedDB Local Storage',
            'Mehrsprachig (DE/IT/FR/AR/EN)',
            'NgRx SignalStore',
          ],
          features: [
            'Photometrie- und Abstandsrechner nach EN 13201-2: Berechnung von S/H-Verhältnissen, mittlerer Beleuchtungsstärke und Gleichmäßigkeit U0 (Beleuchtungsklassen M, C, P)',
            'Fundamentbemessung nach Eurocode 7: Windlastmoment, aerodynamische Segelfläche des Solarmoduls, Aushubtiefe und Ankerbolzendimensionierung (M16–M24)',
            'Betontechnologische Prüfung nach NF EN 206: Verifizierung von Bindemittelgehalt, W/Z-Wert ≤ 0,50, Setzmaßprüfung und 7-Tage-Ausschalreife',
            'Mastlot- und Vertikalitätsprüfung nach EN 40: Digitale 2D-Wasserwaage mit Neigungssensor, Auslenkung in mm und Justieranweisung für Fundamentmuttern',
            'Optischer Kamera-Entfernungsmesser: Fadenkreuz-Klinometer zur trigonometrischen Ermittlung von Mastabständen und Lichthöhen',
            'Interaktive GPS-Feldkarte: OpenStreetMap mit Markern, automatischem Geotagging und exakter intermuraler Distanzberechnung',
            'Auslegung autonomer Photovoltaik- und LiFePO4-Batteriesysteme mit Nachtabsenkungsprofilen und Wintersolstitium-Reserven',
            'Projektmeilensteine & E-Mail-Erinnerungen: 1-Klick-Export für Kalenderdateien (.ics) und automatische E-Mail-Verteiler an Auftraggeber',
          ],
          architectureNotes:
            '100% Offline-First-Architektur mit lokaler IndexedDB-Persistenz. Sämtliche ingenieurtechnischen Berechnungen laufen clientseitig ohne Serverlatenz.',
        },
        {
          id: 'autosphere',
          title:
            'AutoSphere · Headless Digital Showroom & 3D-Fahrzeugkonfigurator',
          category: 'production',
          badge: {
            label: '🚗 Contentful CDA + 800V EV',
            variant: 'accent',
            pulse: true,
          },
          eyebrow:
            'Automotive Digital Experience · Headless CMS & Echtzeit-Konfigurator',
          summary:
            'Leistungsstarker digitaler Showroom und dynamischer EV-Konfigurator mit garantiertem Null-CLS (CLS = 0) und minimaler Latenz (INP < 50ms). Nahtlose Contentful Headless-CMS-Integration (CDA & Live Preview) zur Echtzeit-Katalogverwaltung, 800V-Antriebswahl, dynamische Mehrschichtlack-Swatches, Aero-Radeinfluss auf WLTP-Reichweite und Leasingrechner.',
          route: '/apps/autosphere',
          icon: '⚡',
          ctaLabel: 'AutoSphere',
          stack: [
            'Zoneless Angular 22 Signals',
            'Contentful CDA & Live Preview',
            'Design System (@ah/ui)',
            'Vector SVG Zero-CLS Engine',
            'Core Web Vitals Optimiert',
            'Design System Tokens',
          ],
          features: [
            'Contentful Headless CMS: Live-Entwurfsvorschau und CDA-Katalogsynchronisierung für Modellvarianten, Farben und Pakete',
            'Zero-CLS Visualizer: Reaktionsschnelle 16:9-Bühne mit 3/4-Perspektive, Seitenprofil und technischer CAD-Blueprint-Ansicht',
            'Lackierungs-Shader: Mehrschicht-Gloss, Metallic, Matt und Perleffekt über das Design-System AhColorSwatch',
            'WLTP-Reichweitenanpassung: Berechnung aerodynamischer Einflüsse je nach Felgengröße und Rollwiderstand',
            'Echtzeit-Finanzierungsrechner: Sofortige Leasingratenberechnung basierend auf Anzahlung, Laufzeit und Ausstattung',
            'Konfigurationsabschluss & Reservierung: Interaktives Datenblatt mit Bau-Token-Generierung und 500 € Anzahlung',
          ],
          architectureNotes:
            'Zoneless Angular 22 SignalStore direkt an Contentful CDA angebunden. Vektorielle Vorausschau ohne blockierende Bilddownloads für LCP < 0,4s.',
        },
        {
          id: 'basecamp',
          title: 'Basecamp · Camping- & Outdoor-Tourenplaner',
          category: 'production',
          badge: { label: '🏕️ Camping & Sternenhimmel', variant: 'success' },
          eyebrow: 'Wetter · Himmelsbeobachtung · Packlisten · Offline-First',
          summary:
            'Planen Sie Outdoor-Touren direkt auf dem Smartphone: Stecken Sie das Camp auf der Karte ab, verfolgen Sie bis zu 16 Tage Wetterprognosen mit Frost-, Wind- und Regenwarnungen, finden Sie die ideale Nacht zur Sternenbeobachtung (astronomische Dunkelheit, Mondphase, Meteorströme), packen Sie eine bedarfsgerechte Ausrüstungsliste und teilen Sie die Tour per Link – ohne Nutzerkonto und ohne Server.',
          route: '/apps/basecamp',
          icon: '🏕️',
          ctaLabel: 'Basecamp',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Leaflet OpenStreetMap',
            'Open-Meteo API',
            'astronomy-engine',
            'CompressionStream share links',
            'IndexedDB Local Storage',
            'Mehrsprachig (DE/IT/FR/AR/EN)',
            'NgRx SignalStore',
          ],
          features: [
            'Camp-Standort auf OpenStreetMap mit Ortssuche und GPS-Zentrierung',
            'Tagesgenaue Open-Meteo-Vorhersagen mit automatischen Warnungen vor Bodenfrost, Sturm, Starkregen und Hitze',
            'Auf dem Gerät berechnete Beobachtungsfenster: Astronomische Dunkelheit, Mondphase, Sternschnuppen und Himmels-Score',
            'Direkte Verlinkung ins Sky Lab zur Vorschau des Sternenhimmels der besten Nacht',
            'Modulare Packliste nach Tourenart, Teilnehmerzahl und Übernachtungen mit individueller Zuteilung',
            'Wetterabhängige Ausrüstungszusätze (Abspannleinen, Tarp, Kälteschutzschichten)',
            'Persönliches Ausrüstungsinventar zur schnellen Prüfung von Leih- und Anschaffungsbedarf',
            'Tourenfreigabe über komprimierte URL-Hash-Links und vollständige JSON-Sicherung',
          ],
          architectureNotes:
            'Konsequentes Offline-First-Design: Touren, Ausrüstung und Wetterdaten in IndexedDB; Himmelsmechanik wird direkt auf dem Endgerät berechnet.',
        },
        {
          id: 'alarm-engine',
          title:
            'Nightly Alarm Decision Engine · Entscheidungsalgorithmus für Weckzeiten',
          category: 'production',
          badge: {
            label: '🌙 Abend-Protokoll',
            variant: 'accent',
            pulse: true,
          },
          eyebrow: 'Spaced Repetition & Tagesroutinen · D-3 / D-7 / D-14',
          summary:
            'Ein strukturierter Abend-Entscheidungsalgorithmus, der willkürliche Wecker überflüssig macht. Ein kurzer Fragebogen zur heutigen Lernleistung genügt: Die Engine berechnet automatisch Spaced-Repetition-Wiederholungen nach dem D-3/D-7/D-14-Schema, markiert Schwachstellen, erkennt 6-Kapitel-Konsolidierungsmeilensteine und generiert exakte Wecker-Titeltexte für den Folgetag mit 1-Klick-Kopierfunktion.',
          route: '/apps/alarm-engine',
          icon: '⏰',
          ctaLabel: 'Abend-Wecker',
          stack: [
            'Zoneless Angular 22',
            'Spaced Repetition Engine',
            'Local Storage Persistence & JSON Backup',
            '@ah/ui Design Tokens',
            'Mobile-First Dark Mode',
          ],
          features: [
            '9-stufige interaktive Abend-Checkliste mit Live-Fortschrittsbalken',
            'Diagnostischer Abend-Fragebogen mit Überprüfung abgeschlossener Kapitel und Quiz-Ergebnissen',
            'Automatische Kennzeichnung SCHWACHER Kapitel (≥ 3 Fehler oder Score < 75%) sowie offener Coding-Aufgaben',
            'Rollover-Wiederholungsregel: Ausstehende Wiederholungen wandern in den 06:00-Uhr-Slot, ohne das ursprüngliche Lerndatum zu verfälschen',
            'Erkennung von Konsolidierungstagen (6-Kapitel-Meilenstein oder ≥ 3 schwache Kapitel) mit Meilensteinbereich Kap. A–B',
            'Wochentags-Energievorlagen: Standard, Fasten (IDE-Schluss 15:15 Uhr) und Erholung (ab 15:15 Uhr komplett frei)',
            '1-Klick-Kopierfunktion für Weckertitel pro Zeitfenster sowie Gesamtexport des formatierten Weckplans',
            'Interaktiver Lernfortschritts-Tracker mit manuellen Wiederholungs-Schaltern und vollständigem JSON-Backup/Restore',
            'Permanenter 8-Wecker-Leitfaden für die native Uhr-App auf dem Smartphone',
          ],
          architectureNotes:
            '100% lokal und privat im Browser-LocalStorage mit JSON-Export/Import. Reaktive zoneless Signals-Architektur auf Angular-22-Basis.',
        },
        {
          id: 'dispatch',
          title: 'PulseOps · Operatives Logistik- und Dispositions-Leitzentrum',
          category: 'production',
          badge: {
            label: '🟢 Produktivbetrieb',
            variant: 'success',
            pulse: true,
          },
          eyebrow:
            'Gewerbliche Logistik & Subunternehmer-Hub · London Zonen 1–4',
          summary:
            'Umfassende Leitstelle für die logistische Koordination im Bereich gewerblicher Wäschereien und Hotellerie. Steuerung von täglichen Warenannahmen, Tourenplanung der Fahrerflotte, Lohnwäsche-Manifeste für Subunternehmer, Nachverfolgung vermisster Artikel und automatische Schichtübergabeberichte.',
          route: '/apps/dispatch',
          icon: '🧺',
          ctaLabel: 'PulseOps',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'NestJS REST API',
            'MongoDB Atlas M0',
            'AES-256-GCM',
            'PBKDF2 Auth',
            'NgRx SignalStore',
          ],
          features: [
            '6-stufiges Echtzeit-Kanban-Board (Annahme, Wäsche, Fertig, Disponiert, Zugestellt, Abgerechnet)',
            'Live-Flottendisposition für Fahrer mit Tourenoptimierung und Notfallkurier-Buchung',
            'Subunternehmer-Management mit Kapazitätsüberwachung und Qualitätsreklamations-Tracking',
            'Simulierter WhatsApp-Kommunikations-Hub (Kunden-, Fahrer- und Produktionskanäle im FIFO-Ringspeicher)',
            'Digitaler Abliefernachweis (POD) mit digitaler Unterschrift und Rampen-Zugangscode',
            'Automatisierte Schichtübergabe-Berichte mit abgeschlossenen Aufträgen, Vorfällen und Nachfassaktionen',
          ],
          architectureNotes:
            'Strikter Schutz vor Datenbanküberlastung im MongoDB-Atlas-Free-Tier. Sensible Felder werden im Ruhezustand via AES-256-GCM verschlüsselt.',
        },
        {
          id: 'strategy',
          title: 'StrategyApp · Finanzplanungs- und Vermögensprognose-Engine',
          category: 'production',
          badge: { label: '⚡ Interaktive Plattform', variant: 'accent' },
          eyebrow: 'Fintech · Szenariomodellierung & Cashflow-Buchhaltung',
          summary:
            'Plattform für mehrjährige finanzielle Mehr-Szenarien-Prognosen von Nettovermögen, Liquiditätsreichweite (Runway) und Sparquoten – ohne Übertragung sensibler Finanzdaten an externe Server.',
          route: '/apps/strategy',
          icon: '📈',
          ctaLabel: 'StrategyApp',
          stack: [
            'Angular 22',
            'NgRx SignalStore',
            'Chart.js',
            'IndexedDB Local Storage',
            'PDF Export Engine',
            '@ah/ui Design Tokens',
          ],
          features: [
            'Mehr-Szenarien-Finanzsimulationen (Basis, Offensives Sparen, Konservativ, Berufliche Neuorientierung)',
            'Interaktive doppelte Buchführung mit kategorisierter Erfassung von Einnahmen und Ausgaben',
            'Echtzeit-Vermögensprognosen mit interaktiven SVG-/Chart-Visualisierungen',
            'Berechnung der Notgroschen-Reichweite und Fortschrittsanzeige für finanzielle Meilensteine',
            'Automatisierter PDF-Export für Management-Finanzberichte auf Knopfdruck',
          ],
          architectureNotes:
            'Keine externe Datenübertragung: 100% clientseitige Berechnungen mit lokaler IndexedDB-Persistenz.',
        },
        {
          id: 'studylm',
          title:
            'StudyLM · KI-gestützte Plattform für Software-Engineering-Curricula & Drill-Training',
          category: 'production',
          badge: {
            label: '🤖 Groq 120B KI-Engine',
            variant: 'accent',
            pulse: true,
          },
          eyebrow:
            'Autonomer Didaktik-Architekt & Schrittweise Wissensüberprüfung',
          summary:
            'Lern- und Vertiefungsplattform für Software Engineering, angetrieben von n8n-Workflows und Groq-LPU-Modellen (120B). Zerlegt komplexe Informatikthemen in progressive Kapitel mit unbegrenzten Karteikartendecks und 4-Optionen-Diagnosequizzen.',
          route: '/apps/studylm',
          icon: '📚',
          ctaLabel: 'StudyLM',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'n8n AI Workflow Engine',
            'Groq LPU (120B / 27B)',
            'NgRx SignalStore',
            'Dexie IndexedDB',
          ],
          features: [
            'Intelligenter thematischer Guardrail: Schließt Nicht-Software-Engineering-Themen verlässlich aus',
            'Didaktische Dekonstruktion auf Basis offizieller Dokumentationen (MDN, React, PostgreSQL)',
            'Tiefgehende technische Flashcards mit Code-Beispielen und interaktive Schritt-für-Schritt-Lektionen',
            'Diagnostische Multiple-Choice-Quizze mit detaillierter didaktischer Begründung aller Antwortoptionen',
          ],
          architectureNotes:
            'Mehrstufige KI-Orchestrierung über n8n mit Groq-120B-Reasoning und automatischem Failover auf Qwen 27B.',
        },
        {
          id: 'whatsapp',
          title: 'ChatPulse · WhatsApp-Chat-Analyse & KI-Beziehungsanalytik',
          category: 'production',
          badge: {
            label: '💬 Lokale ZIP-Verarbeitung + n8n-KI',
            variant: 'success',
            pulse: true,
          },
          eyebrow: 'Datenschutzorientierte Chat-Analytik · Verhaltensmetriken',
          summary:
            'Browserbasierte Suite zur Analyse exportierter WhatsApp-Chats (.txt/.zip) direkt im Arbeitsspeicher, ohne Upload von Mediendateien. Berechnet Antwortlatenzen, 7×24-Aktivitäts-Heatmaps, teilbare Jahresrückblick-Karten (Wrapped) und verbindet sich für KI-gestützte Einblicke mit einem n8n-Webhook.',
          route: '/apps/whatsapp',
          icon: '💬',
          ctaLabel: 'ChatPulse',
          stack: [
            'Zoneless Angular 22',
            'Native Federation',
            'Web DecompressionStream',
            'NgRx SignalStore',
            'n8n AI Webhook',
          ],
          features: [
            'Direkte ZIP- und TXT-Verarbeitung im RAM unter Auslassung speicherintensiver Mediendateien',
            'Automatische Erkennung von iOS- und Android-Datumsformaten (TT/MM vs. MM/TT)',
            'Analyse von Reaktionszeiten, Gesprächsinitiatoren und Double-Texting-Raten',
            '7×24-Aktivitäts-Heatmap und teilbare interaktive Jahresrückblicks-Karte',
          ],
          architectureNotes:
            'Vollständig clientseitige Archiv-Entpackung und Auswertung ohne externe Serverübertragung.',
        },
      ]);
    }

    // Default: English
    return this.filterApps([
      {
        id: 'lighting',
        title:
          'LuxPath (SolarLux) · Public & Solar Street Lighting Field Engineering Platform',
        category: 'production',
        badge: {
          label: '☀️ Solar & AC Field Suite',
          variant: 'success',
          pulse: true,
        },
        eyebrow:
          'Field Civil & Photometric Engineering · EN 13201 / Eurocode 7 / NF EN 206',
        summary:
          'A mobile-first on-site engineering suite for public lighting supervisors installing autonomous photovoltaic solar and conventional AC streetlights. Features real-time EN 13201 pole spacing calculations, Eurocode 7 excavation massif depth validation, Abrams slump & concrete mix verification, digital bubble level verticality audit (EN 40 plumb tolerance ≤ 1.0°), optical camera rangefinder, interactive OpenStreetMap pole placement, commercial equipment catalog (BOM), and 1-click milestone calendar export (.ics) and email reminders.',
        route: '/apps/lighting',
        icon: '💡',
        ctaLabel: 'LuxPath',
        stack: [
          'Zoneless Angular 22',
          'Native Federation',
          'Leaflet OpenStreetMap',
          'DeviceOrientation Gyroscope',
          'Camera WebRTC',
          'IndexedDB Local Storage',
          'Trilingual RTL (FR/AR/EN)',
          'NgRx SignalStore',
        ],
        features: [
          'EN 13201-2 Photometrics & Spacing Engine: Evaluates S/H ratios, average lux, and overall uniformity across M1-M6, C0-C5, and P1-P6 road classes',
          'Eurocode 7 Foundation Massif Validator: Wind moment, aerodynamic solar sail drag, minimum excavation depth, and anchor bolt sizing (M16–M24)',
          'NF EN 206 Concrete Formulation & Abrams Cone: Verifies 350 kg/m³ dosage, W/C ≤ 0.50, and Eurocode 2 7-day erection permit curve',
          'EN 40 Pole Verticality & Plumb Gauge: 2D digital spirit level with real-time accelerometer tilt degrees, tip deflection mm, and nut adjustment steps',
          'Optical Camera Rangefinder: Phone camera reticle with trigonometric pitch inclinometer to measure ground distance and pole height',
          'Interactive GPS Field Map: OpenStreetMap with tap-to-place markers, inter-pole distance calculation, and geolocation centering',
          'Autonomous Solar PV & LiFePO4 Sizing: Photovoltaic peak watts, battery Ah/Wh with multi-step dimming profiles and winter solstice coverage',
          'Project Milestones & Email Reminders: 1-click .ics calendar export and mailto: reminder dispatch to clients and municipal supervisors',
        ],
        architectureNotes:
          '100% offline-first field architecture storing projects, poles, and calculation logs in local IndexedDB. All calculations execute locally on device with zero required cloud roundtrips.',
      },
      {
        id: 'autosphere',
        title:
          'AutoSphere · Headless Digital Automotive Showroom & 3D Configurator',
        category: 'production',
        badge: {
          label: '🚗 Contentful CDA + 800V EV',
          variant: 'accent',
          pulse: true,
        },
        eyebrow:
          'Automotive Digital Experience · Headless CMS & Real-time EV Configurator',
        summary:
          'A high-performance automotive digital showroom and dynamic EV configurator engineered for zero Cumulative Layout Shift (CLS = 0) and sub-50ms Interaction to Next Paint (INP). Integrates Contentful Headless CMS (Content Delivery API & Live Preview) for real-time catalog changes, reactive 800V powertrain selection, interactive multi-finish paint swatches with sheen shaders, aerodynamic wheel drag impact on WLTP range, autonomous driving packages, and instant lease financing calculations.',
        route: '/apps/autosphere',
        icon: '⚡',
        ctaLabel: 'AutoSphere',
        stack: [
          'Zoneless Angular 22 Signals',
          'Contentful CDA & Live Preview',
          'Design System (@ah/ui)',
          'Vector SVG Zero-CLS Engine',
          'Core Web Vitals Optimized',
          'Tailwind CSS & Token System',
        ],
        features: [
          'Contentful Headless CMS Integration: Live draft preview and CDA GraphQL/REST schema synchronization for vehicle trims, colorways, and option packs',
          'Zero CLS Responsive Visualizer: 16:9 vector stage with perspective 3/4 view, side aero profile, and CAD engineering blueprint modes',
          'Dynamic Exterior Paint Engine: Multi-coat gloss, metallic, matte, and pearl finish shaders driven by design system color swatches',
          'Real-Time WLTP Range & Aero Sizing: Dynamically recalculates usable battery range based on wheel diameter and aerodynamic drag factors',
          'Instant Leasing & Financing Engine: Live monthly rate computation based on down payment, term duration, and optional equipment packages',
          'Direct Build Spec & Reservation: Interactive modal specification sheet generating unique factory build tokens and €500 deposit allocation',
        ],
        architectureNotes:
          'Pure Angular 22 zoneless Signals reactive store directly linked to Contentful CDA. Zero blocking image requests on initial render ensures exceptional Largest Contentful Paint (LCP < 0.4s).',
      },
      {
        id: 'basecamp',
        title: 'Basecamp · Camping Trip Planner',
        category: 'production',
        badge: { label: '🏕️ Camping & stars', variant: 'success' },
        eyebrow: 'Weather · Stargazing · Packing lists · Offline-first',
        summary:
          'Plan a camping trip on your phone: pin the campsite on a map, follow up to 16 days of forecast with frost, wind and rain warnings, find the best night for stargazing (true darkness, the Moon, meteor showers), pack a list sized to the group, then share the trip with friends as a link, with no account and no server.',
        route: '/apps/basecamp',
        icon: '🏕️',
        ctaLabel: 'Basecamp',
        stack: [
          'Zoneless Angular 22',
          'Native Federation',
          'Leaflet OpenStreetMap',
          'Open-Meteo API',
          'astronomy-engine',
          'CompressionStream share links',
          'IndexedDB Local Storage',
          'Trilingual RTL (FR/AR/EN)',
          'NgRx SignalStore',
        ],
        features: [
          'Campsite on an OpenStreetMap map, with place search and your location',
          'Open-Meteo forecast day by day, with frost, wind, rain and heat warnings',
          'Nights worked out on the phone: astronomical darkness, Moon phase, meteor showers and a stargazing score',
          'A link into the Sky lab to see the best night’s stars',
          'Packing list by trip type, sized to the people and nights, with who brings what',
          'Items the weather calls for added automatically (tarp, warm layer, guy lines)',
          'Your own gear inventory, showing what to buy or borrow',
          'Trips shared as a link compressed into the URL fragment, plus JSON backups',
        ],
        architectureNotes:
          'Offline-first: trips, gear and the last forecast live in IndexedDB, and the sky is computed on the device.',
      },
      {
        id: 'alarm-engine',
        title: 'Nightly Alarm Decision Engine',
        category: 'production',
        badge: { label: '🌙 Bedtime Protocol', variant: 'accent', pulse: true },
        eyebrow:
          'Spaced Repetition & Daily Habit Scheduling · D-3 / D-7 / D-14',
        summary:
          'A repeatable bedtime decision algorithm that eliminates random alarms. Answer a short questionnaire about today’s study performance, and the engine calculates D-3/D-7/D-14 spaced repetition reviews, flags weak subtopics, detects 6-chapter Consolidation milestones, and generates the exact alarm title strings for tomorrow with 1-click copy.',
        route: '/apps/alarm-engine',
        icon: '⏰',
        ctaLabel: 'Nightly Alarms',
        stack: [
          'Zoneless Angular 22',
          'Spaced Repetition Engine',
          'Local Storage Persistence & JSON Backup',
          '@ah/ui Design Tokens',
          'Mobile-First Dark Mode',
        ],
        features: [
          '9-Step Interactive Nightly Ritual Checklist with real-time progress bar',
          'Bedtime Diagnostic Questionnaire with chapter completion and quiz scoring',
          'Auto-flags WEAK chapters (missed ≥ 3 or score < 75%) and unfinished coding carryover',
          'Rollover Review Rule: unreviewed chapters roll into 06:00 alarm without altering original study dates',
          'Consolidation Day detection (6-chapter milestone or ≥3 weak chapters) with milestone range Ch. A–B',
          'Weekday energy templates: Standard, Fasting (15:15 IDE close), and Recovery (15:15 onward OFF)',
          '1-Click Copy Title button per slot and Copy All formatted alarm schedule',
          'Interactive Study Tracker Table with direct review toggles and full JSON backup/restore',
          'Permanent 8-Alarm Phone Reference Guide for native Clock app setup',
        ],
        architectureNotes:
          '100% private and offline-first in browser localStorage with JSON export/import. Reactive Angular 22 Zoneless signals architecture.',
      },
      {
        id: 'dispatch',
        title: 'PulseOps · Commercial Operations & Dispatch Control Center',
        category: 'production',
        badge: { label: '🟢 Production Live', variant: 'success', pulse: true },
        eyebrow: 'Commercial Logistics & Subcontractor Hub · London Zones 1–4',
        summary:
          'A comprehensive remote coordinator command center for commercial laundry and hospitality logistics. Manages daily intake, route planning, driver transport, subcontractor wash manifests, missing item chases, and automated shift handovers.',
        route: '/apps/dispatch',
        icon: '🧺',
        ctaLabel: 'PulseOps',
        stack: [
          'Zoneless Angular 22',
          'Native Federation',
          'NestJS REST API',
          'MongoDB Atlas M0',
          'AES-256-GCM',
          'PBKDF2 Auth',
          'NgRx SignalStore',
        ],
        features: [
          '6-Stage Real-Time Order Kanban (Intake, Wash, Ready, Dispatched, Delivered, Invoiced)',
          'Live Fleet Driver Dispatch with stop sequence ordering and emergency courier booking',
          'Subcontractor Plant Management with capacity tracking, wash claims, and QA defect flags',
          'Simulated WhatsApp Comms Hub (Customer, Driver, and Production channels with FIFO ring buffers)',
          'Digital Proof of Delivery (POD) with signature capture and Loading Bay Gate Code security',
          'Shift Handover Automated Reporting with completed orders, incidents, and pending chases',
        ],
        architectureNotes:
          'Enforces strict database overload protection for MongoDB Atlas Free Tier. Sensitive fields are encrypted with AES-256-GCM at rest.',
      },
      {
        id: 'strategy',
        title: 'StrategyApp · Financial Planning & Wealth Projection Engine',
        category: 'production',
        badge: { label: '⚡ Interactive Platform', variant: 'accent' },
        eyebrow: 'Fintech · Scenario Modeling & Cashflow Ledgers',
        summary:
          'Multi-scenario financial forecasting platform that projects net worth, runway, savings rates, and emergency fund coverage over multi-year horizons without transmitting sensitive financial data to any external server.',
        route: '/apps/strategy',
        icon: '📈',
        ctaLabel: 'StrategyApp',
        stack: [
          'Angular 22',
          'NgRx SignalStore',
          'Chart.js',
          'IndexedDB Local Storage',
          'PDF Export Engine',
          '@ah/ui Design Tokens',
        ],
        features: [
          'Multi-Scenario Financial Simulations (Base, Aggressive Savings, Conservative, Career Transition)',
          'Interactive Double-Entry Ledger with categorical income and expense budget tracking',
          'Real-time Net Worth Projections and interactive SVG/Chart visualizers',
          'Emergency Fund Runway & Milestone Target progress calculation',
          'Automated Executive Financial PDF report export',
        ],
        architectureNotes:
          'Zero external data transmission: 100% client-side privacy-first computation with IndexedDB local persistence.',
      },
      {
        id: 'studylm',
        title:
          'StudyLM · Grounded AI Software Engineering Curriculum & Drill Engine',
        category: 'production',
        badge: {
          label: '🤖 Groq 120B AI Engine',
          variant: 'accent',
          pulse: true,
        },
        eyebrow:
          'Autonomous Curriculum Architect & Section-by-Section Assessment Engine',
        summary:
          'A software engineering mastery platform powered by self-hosted n8n workflows and Groq LPU models (120B). Deconstructs complex SE topics into progressive pedagogical branches with uncapped flashcard decks and 4-option diagnostic quizzes.',
        route: '/apps/studylm',
        icon: '📚',
        ctaLabel: 'StudyLM',
        stack: [
          'Zoneless Angular 22',
          'Native Federation',
          'n8n AI Workflow Engine',
          'Groq LPU (120B / 27B)',
          'NgRx SignalStore',
          'Dexie IndexedDB',
        ],
        features: [
          'Software Engineering Topic Guardrail: Intelligent validator rejecting non-SE subjects',
          'Pedagogical Roadmap Deconstruction citing official documentation (MDN, React, PostgreSQL)',
          'Technical flashcards with code snippets, and interactive step-by-step lessons',
          'Diagnostic 4-Option Quizzes with comprehensive explanations for every distractor',
        ],
        architectureNotes:
          'Multi-tier AI orchestration via n8n with primary Groq 120B reasoning and automated failover.',
      },
      {
        id: 'whatsapp',
        title:
          'ChatPulse · WhatsApp Chat & AI Relationship Intelligence Analyzer',
        category: 'production',
        badge: {
          label: '💬 In-Browser ZIP + n8n AI',
          variant: 'success',
          pulse: true,
        },
        eyebrow: 'Privacy-First Messaging Analytics · Behavioral Telemetry',
        summary:
          'In-browser WhatsApp export (.txt/.zip) intelligence suite. Extracts transcripts in RAM while bypassing media, computes reply latency distributions, 7×24 activity heatmaps, shareable Wrapped summary cards, and connects to an n8n webhook for AI analysis.',
        route: '/apps/whatsapp',
        icon: '💬',
        ctaLabel: 'ChatPulse',
        stack: [
          'Zoneless Angular 22',
          'Native Federation',
          'Web DecompressionStream',
          'NgRx SignalStore',
          'n8n AI Webhook',
        ],
        features: [
          'In-Memory ZIP & TXT Ingestion: Extracts text while skipping heavy media files',
          'Multi-Format iOS & Android Parser: Auto-detects DD/MM vs MM/DD ordering',
          'Reply & Initiation Dynamics: Turnaround times, session starters, and double-texting index',
          '7×24 Activity Heatmap and shareable Wrapped card',
        ],
        architectureNotes:
          '100% client-side archive extraction and parsing with zero server uploads.',
      },
    ]);
  });

  private readonly labsEn: AppItem[] = [
    {
      id: 'sky',
      title:
        'Sky Lab · Interactive 3D Planetarium & Celestial Ephemeris Engine',
      category: 'lab',
      badge: { label: '🌌 3D WebGL Engine', variant: 'info' },
      eyebrow: 'Astronomy & 3D Graphics · WebGL & Orekit Spring Boot',
      summary:
        'Pick any location on Earth, dive down from orbit to ground level, and explore the night sky in real time: 5,000 accurate stars, constellations, exact Moon phases, visible planets, the Milky Way, and meteor showers.',
      route: '/labs/sky',
      icon: '✨',
      ctaLabel: 'Sky Lab',
      stack: [
        'Three.js WebGL',
        'Custom GLSL Shaders',
        'Astronomy Engine',
        'Spring Boot 4 + Orekit',
        'Render Hosted Orbit API',
      ],
      features: [
        'Interactive 3D Earth Globe with smooth orbital dive down to ground observer perspective',
        'Real-Time Starfield of 5,000 real stars with constellation figure projections',
        'True Moon Phase & Planet ephemerides calculations for any historical or future date',
        'Astronomical Twilight, darkness windows, and observation condition planner',
      ],
      architectureNotes:
        'Framework-free Three.js engine with on-demand frame rendering, off-screen pausing, and automated tier scaling for 60fps performance across mobile and desktop.',
    },
    {
      id: 'rxjs',
      title: 'RxJS Interactive Lab · Stream Operators & Reactive Architecture',
      category: 'lab',
      badge: { label: '🧪 Reactive Lab', variant: 'warning' },
      eyebrow: 'Reactive Programming · Marble Visualizers & Backpressure',
      summary:
        'An interactive laboratory for mastering complex RxJS stream mechanics: animated marble diagrams, operator comparisons, backpressure strategies, multicast subjects, and signal interoperability.',
      route: '/labs/rxjs',
      icon: '⚡',
      ctaLabel: 'RxJS Lab',
      stack: [
        'Angular 22 Zoneless',
        'RxJS 7+',
        'SVG Animated Pipelines',
        'Signal-to-Observable Interop',
      ],
      features: [
        'Live Marble Diagrams showing asynchronous value emission and error propagation',
        'Side-by-Side Backpressure Showdown: debounceTime vs throttleTime vs auditTime vs sampleTime',
        'Combination Operator Simulator: switchMap vs mergeMap vs concatMap vs exhaustMap',
        'Production Resilient Patterns: exponential backoff retry and request deduplication',
      ],
      architectureNotes:
        'Zoneless reactive pipeline visualizer connecting RxJS Observables directly to Angular Signals without zone.js overhead.',
    },
    {
      id: 'ngrx',
      title: 'NgRx State Architecture Lab · SignalStore & Redux Workbench',
      category: 'lab',
      badge: { label: '🏛️ Architecture Lab', variant: 'neutral' },
      eyebrow: 'State Architecture · NgRx Store & @ngrx/signals',
      summary:
        'Comprehensive workbench exploring enterprise state architectures: visual Redux unidirectional data flow, asynchronous side-effects, declarative SignalStore with entity normalization, and an architectural comparison matrix.',
      route: '/labs/ngrx',
      icon: '🧠',
      ctaLabel: 'NgRx Lab',
      stack: [
        'Angular 22',
        '@ngrx/signals',
        '@ngrx/signals/entities',
        'NgRx Store & Effects',
        '@ah/ui Design System',
      ],
      features: [
        'Interactive 4-Stage Redux Cycle (Dispatch Action → Reducer Transition → Selector Query → Effect Execution)',
        'Declarative SignalStore with withEntities(), withComputed(), and rxMethod() async pipelines',
        'Time-Travel Debugging Panel with state snapshots, replay controls, and rollback capability',
        'Architectural Showdown: In-depth comparison matrix of NgRx Store vs SignalStore vs Service-based state',
      ],
      architectureNotes:
        'Demonstrates modern Angular state patterns with zero zone.js overhead, combining lightweight functional composition with robust enterprise invariants.',
    },
  ];

  /** The labs in the site's language: English, with French and Arabic text over it. */
  protected readonly engineeringLabs = computed<AppItem[]>(() => {
    const copy = LAB_COPY[this.currentLang()];
    const all = this.labsEn.map((lab) => {
      const text = copy?.[lab.id];
      return text
        ? { ...lab, ...text, badge: { ...lab.badge, label: text.badge } }
        : lab;
    });
    return all.filter((lab) => isAppEnabled(lab.id));
  });

  constructor() {
    inject(Seo).update({
      title: 'Applications & Interactive Engineering Labs · Ahmed Hrichi',
      description:
        'Explore live production applications and interactive engineering laboratories: LuxPath public lighting, Basecamp camping planner, PulseOps commercial dispatch, StrategyApp financial planning, Sky Lab 3D planetarium, RxJS and NgRx architectures.',
      path: '/apps',
    });
  }
}
