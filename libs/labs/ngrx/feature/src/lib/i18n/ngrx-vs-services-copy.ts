import type { SiteLanguage } from '@ah/shared/state';
import type {
  ArchitectureComparison,
  PatternKey,
} from '../exercises/ngrx-vs-services/ngrx-vs-services.component';

export interface InterviewFaqItem {
  id: string;
  question: string;
  answer: string;
  takeaway: string;
}

export interface MatrixRow {
  dimension: string;
  serviceSignals: string;
  serviceRxjs: string;
  signalStore: string;
  globalStore: string;
}

export interface NgrxVsServicesCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  spectrum: {
    title: string;
    subtitle: string;
    tier1Num: string;
    tier1Title: string;
    tier1Desc: string;
    tier2Num: string;
    tier2Title: string;
    tier2Desc: string;
    tier3Num: string;
    tier3Title: string;
    tier3Desc: string;
    tier4Num: string;
    tier4Title: string;
    tier4Desc: string;
  };
  advisor: {
    title: string;
    subtitle: string;
    badge: string;
    q1Label: string;
    q1Local: string;
    q1Modular: string;
    q1Global: string;
    q2Label: string;
    q2Simple: string;
    q2Streams: string;
    q2Choreography: string;
    q3Label: string;
    q3Standard: string;
    q3Strict: string;
    recommendedLabel: string;
    inspectBtn: string;
    recommendations: Record<
      PatternKey,
      { winner: string; rationale: string }
    >;
  };
  detail: {
    eyebrow: string;
    bundleImpactLabel: string;
    learningCurveLabel: string;
    timeTravelLabel: string;
    whenToUseTitle: string;
    whenToAvoidTitle: string;
    codeExampleTitle: string;
  };
  patterns: readonly ArchitectureComparison[];
  matrix: {
    heading: string;
    colDimension: string;
    colServiceSignals: string;
    colServiceRxjs: string;
    colSignalStore: string;
    colGlobalStore: string;
    rows: readonly MatrixRow[];
  };
  interview: {
    eyebrow: string;
    title: string;
    keyRuleLabel: string;
    faqs: readonly InterviewFaqItem[];
  };
}

const CODE_SAMPLES: Record<PatternKey, string> = {
  'service-signals': `@Injectable({ providedIn: 'root' })
export class CounterService {
  private readonly _count = signal(0);
  readonly count = this._count.asReadonly();
  readonly double = computed(() => this._count() * 2);

  increment(): void {
    this._count.update(c => c + 1);
  }
}`,
  'service-rxjs': `@Injectable({ providedIn: 'root' })
export class SearchService {
  private readonly query$ = new Subject<string>();
  readonly results$ = this.query$.pipe(
    debounceTime(300),
    distinctUntilChanged(),
    switchMap(q => this.http.get<Item[]>(\`/api/search?q=\${q}\`))
  );

  search(q: string): void {
    this.query$.next(q);
  }
}`,
  'signal-store': `export const UsersStore = signalStore(
  { providedIn: 'root' },
  withEntities<User>(),
  withState({ isLoading: false }),
  withMethods((store, usersApi = inject(UsersApi)) => ({
    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { isLoading: true })),
        exhaustMap(() => usersApi.getAll().pipe(
          tapResponse({
            next: users => patchState(store, setAllEntities(users), { isLoading: false }),
            error: err => patchState(store, { isLoading: false })
          })
        ))
      )
    )
  }))
);`,
  'global-store': `export const OrdersActions = createActionGroup({
  source: 'Orders',
  events: {
    'Load Orders': emptyProps(),
    'Load Orders Success': props<{ orders: Order[] }>(),
  }
});

export const ordersFeature = createFeature({
  name: 'orders',
  reducer: createReducer(
    initialState,
    on(OrdersActions.loadOrdersSuccess, (state, { orders }) => ({ ...state, orders }))
  )
});`,
};

export const NGRX_VS_SERVICES_COPY: Record<SiteLanguage, NgrxVsServicesCopy> = {
  en: {
    eyebrow: 'Architectural Showdown',
    heading: 'NgRx vs Services: State Strategy Matrix',
    lead: 'A recruiter-ready, senior-level evaluation: when to use plain Services (Signals/RxJS), when to pick NgRx SignalStore, and when to reach for the Global Redux Store.',
    spectrum: {
      title: 'The Angular State Architecture Spectrum',
      subtitle: 'From Lightweight UI Reactivity to Mission-Critical Enterprise Orchestration',
      tier1Num: 'Tier 1',
      tier1Title: 'Component Signal',
      tier1Desc: 'Local UI flags, toggles, forms',
      tier2Num: 'Tier 2',
      tier2Title: 'Signal Service',
      tier2Desc: 'Feature-scoped, single API service',
      tier3Num: 'Tier 3 ⭐',
      tier3Title: 'NgRx SignalStore',
      tier3Desc: 'Modular, normalized O(1), rxMethod',
      tier4Num: 'Tier 4',
      tier4Title: 'Global Redux Store',
      tier4Desc: 'Multi-team, cross-feature events',
    },
    advisor: {
      title: 'State Architecture Advisor',
      subtitle: 'Answer 3 questions to generate an architectural recommendation for your project.',
      badge: 'Interactive Wizard',
      q1Label: '1. State Scope & Sharing:',
      q1Local: 'Feature / Component Local',
      q1Modular: 'Shared Across Related Features',
      q1Global: 'App-Wide Global Cache',
      q2Label: '2. Async & Event Choreography:',
      q2Simple: 'Simple HTTP fetch / mutations',
      q2Streams: 'Debounced search, polling, WebSockets',
      q2Choreography: 'Cross-feature action choreography',
      q3Label: '3. Team Scale & Time-Travel Audit:',
      q3Standard: 'Standard Dev (Console / Tests)',
      q3Strict: 'Strict Compliance / Redux DevTools Replay',
      recommendedLabel: 'Recommended Architecture:',
      inspectBtn: 'Inspect Pattern Specifications & Code Snippet ↓',
      recommendations: {
        'global-store': {
          winner: 'NgRx Global Store + Effects',
          rationale: 'Your requirement for strict compliance, time-travel auditability, or cross-feature event choreography makes the classic NgRx Store and Effects the safest choice. Actions document every transaction in Redux DevTools.',
        },
        'service-signals': {
          winner: 'Service with Signals (signal & computed)',
          rationale: 'For co-located UI state or single-feature components with straightforward CRUD, a plain injectable Service with Signals offers zero boilerplate and instantaneous push-pull reactivity with 0kB overhead.',
        },
        'service-rxjs': {
          winner: 'Service with RxJS (BehaviorSubject)',
          rationale: 'When you need complex stream coordination, debounced search, or WebSockets within a local component without global entity indexing, an RxJS Service leverages full operator power.',
        },
        'signal-store': {
          winner: 'NgRx SignalStore (@ngrx/signals)',
          rationale: 'The modern gold standard for Angular 22 Zoneless! SignalStore provides modular state composition (withEntities, withMethods, rxMethod), type-safety, and native signals with a tiny 1.5kB footprint.',
        },
      },
    },
    detail: {
      eyebrow: 'Architecture Profile',
      bundleImpactLabel: 'Bundle Impact',
      learningCurveLabel: 'Learning Curve',
      timeTravelLabel: 'Time-Travel',
      whenToUseTitle: '✅ When To Use (Prime Fit)',
      whenToAvoidTitle: '⚠️ When To Avoid (Pitfalls)',
      codeExampleTitle: 'Idiomatic Angular 22 Implementation Example:',
    },
    patterns: [
      {
        key: 'service-signals',
        name: 'Service with Signals',
        tagline: 'Pure Angular 22 signals, writable signal() and derived computed().',
        badge: 'simplest',
        bundleWeight: '0 kB (Built-in)',
        reactivityModel: 'Push-Pull Glitch-Free',
        learningCurve: 'Gentle',
        timeTravelSupport: 'None',
        whenToUse: [
          'Component-local UI state (modals, tabs, pagination, active rows)',
          'Simple CRUD services without normalized cross-entity relationships',
          'Small to medium applications where team wants zero third-party dependencies',
          'Direct synchronous derivations using computed()',
        ],
        whenToAvoid: [
          'Multi-entity normalized collections needing O(1) lookups by ID',
          'Complex cross-feature state orchestration across independent micro-frontends',
          'Regulated applications requiring Redux DevTools time-travel auditing',
        ],
        codeSample: CODE_SAMPLES['service-signals'],
      },
      {
        key: 'service-rxjs',
        name: 'Service with RxJS',
        tagline: 'Observable event streaming with BehaviorSubject and higher-order operators.',
        badge: 'stream-heavy',
        bundleWeight: '~4 kB (RxJS)',
        reactivityModel: 'Push Stream Observables',
        learningCurve: 'Moderate',
        timeTravelSupport: 'Manual',
        whenToUse: [
          'Complex stream orchestration (switchMap, debounceTime, combineLatest)',
          'Real-time streaming inputs (WebSockets, SSE, Canvas animation loops)',
          'Managing async request cancellation and retry-backoff policies',
        ],
        whenToAvoid: [
          'Simple synchronous state where async pipes clutter templates',
          'Zoneless components where signal-first change detection is preferred',
          'Teams prone to memory leaks from unclosed subscriptions',
        ],
        codeSample: CODE_SAMPLES['service-rxjs'],
      },
      {
        key: 'signal-store',
        name: 'NgRx SignalStore',
        tagline: 'Modern functional composition: withEntities, withMethods, rxMethod & withHooks.',
        badge: 'recommended',
        bundleWeight: '~1.5 kB (@ngrx/signals)',
        reactivityModel: 'Native Signals + rxMethod',
        learningCurve: 'Moderate',
        timeTravelSupport: 'Custom Plugin',
        whenToUse: [
          'Recommended default for modern Angular 22 & Zoneless applications',
          'Modular feature state requiring entity normalization (ids array + entityMap)',
          'Async stream integration using rxMethod without manual subscriptions',
          'Composing reusable custom plugins across multiple feature teams',
        ],
        whenToAvoid: [
          'Extremely strict enterprise requirements strictly demanding Redux DevTools extension replay',
          'Tiny single-line ephemeral states where a simple signal() suffices',
        ],
        codeSample: CODE_SAMPLES['signal-store'],
      },
      {
        key: 'global-store',
        name: 'NgRx Global Store + Effects',
        tagline: 'Classic Redux: ActionGroups, Feature Reducers, Memoized Selectors, and Effects.',
        badge: 'enterprise',
        bundleWeight: '~15-20 kB (@ngrx/store+effects)',
        reactivityModel: 'Action-Driven Redux',
        learningCurve: 'Steep',
        timeTravelSupport: 'Full Redux DevTools',
        whenToUse: [
          'Large enterprise apps with multiple distributed development teams',
          'Mission-critical financial or compliance workflows requiring full action auditing',
          'Complex cross-feature event choreography and multi-entity global caching',
          'Strict architectural boundaries where components are completely decoupled from side-effects',
        ],
        whenToAvoid: [
          'Simple CRUD applications where Redux boilerplate slows down development velocity',
          'Performance-sensitive micro-frontends prioritizing tiny bundle footprints',
        ],
        codeSample: CODE_SAMPLES['global-store'],
      },
    ],
    matrix: {
      heading: 'Comprehensive Architectural Comparison Matrix',
      colDimension: 'Evaluation Dimension',
      colServiceSignals: 'Service + Signals',
      colServiceRxjs: 'Service + RxJS',
      colSignalStore: 'NgRx SignalStore',
      colGlobalStore: 'NgRx Global Store',
      rows: [
        {
          dimension: 'Reactivity Model',
          serviceSignals: 'Push-pull Glitch-free Signals',
          serviceRxjs: 'Push Observable Streams',
          signalStore: 'Push-pull Signals + rxMethod',
          globalStore: 'Observable Slices (or toSignal)',
        },
        {
          dimension: 'Boilerplate Level',
          serviceSignals: 'Lowest (Zero framework)',
          serviceRxjs: 'Low-Medium (Subjects)',
          signalStore: 'Low (Declarative plugins)',
          globalStore: 'High (Actions/Reducers/Effects)',
        },
        {
          dimension: 'Zoneless Ergonomics',
          serviceSignals: 'First-class native',
          serviceRxjs: 'Requires async pipe / rxResource',
          signalStore: 'First-class native',
          globalStore: 'Requires selectSignal / toSignal',
        },
        {
          dimension: 'Entity Normalization',
          serviceSignals: 'Manual object mapping',
          serviceRxjs: 'Manual object mapping',
          signalStore: 'Built-in withEntities()',
          globalStore: 'Built-in @ngrx/entity',
        },
        {
          dimension: 'DevTools & Time-Travel',
          serviceSignals: 'Standard Browser DevTools',
          serviceRxjs: 'Console logs / taps',
          signalStore: 'Custom Signal plugins',
          globalStore: 'Full Redux DevTools Extension',
        },
        {
          dimension: 'Best Use Case',
          serviceSignals: 'Component UI / Form state',
          serviceRxjs: 'Real-time stream aggregation',
          signalStore: 'Modular features (Recommended)',
          globalStore: 'Large enterprise cross-team state',
        },
      ],
    },
    interview: {
      eyebrow: 'Senior Developer & Recruiter Q&A',
      title: 'Critical State Management Architecture Questions',
      keyRuleLabel: 'Key Rule of Thumb:',
      faqs: [
        {
          id: 'signals-vs-ngrx',
          question: 'Does Angular Signals replace NgRx in Angular 22?',
          answer: 'No. Angular Signals is a fine-grained reactivity and change detection primitive (solving how the UI updates synchronously without Zone.js overhead). NgRx is a state architecture framework (solving how state is organized, normalized in O(1) dictionaries, shared across lazy features, audited via DevTools, and coordinated across complex asynchronous streams). They work in synergy: NgRx exposes signals for template binding.',
          takeaway: 'Use Signals to expose data to templates; use NgRx to architect, normalize, and coordinate state lifecycle.',
        },
        {
          id: 'anti-pattern',
          question: 'When is NgRx considered an anti-pattern or over-engineering?',
          answer: 'NgRx is an anti-pattern for simple CRUD applications with independent pages, isolated forms, and zero cross-feature state sharing. Writing Actions, Reducers, and Selectors just to toggle an isModalOpen boolean or submit a 3-field form introduces needless ceremony and indirection without tangible benefit.',
          takeaway: 'Default to simple Signal Services or Component state; promote to SignalStore when state is shared or requires normalized caching.',
        },
        {
          id: 'signalstore-vs-global',
          question: 'Why choose NgRx SignalStore over traditional NgRx Global Store?',
          answer: 'SignalStore reduces boilerplate by ~80% while retaining full type-safety and immutability. It requires no action types or reducer switch statements, is 100% tree-shakeable, supports modular plugin composition (withEntities, withComputed, withMethods), and connects seamlessly to RxJS via rxMethod.',
          takeaway: 'For new Angular features in 2026, SignalStore is the recommended default standard.',
        },
        {
          id: 'optimistic-rollback',
          question: 'How do you handle optimistic UI updates with rollback in NgRx?',
          answer: 'In SignalStore, call patchState(store, updateEntity(optimisticData)) immediately upon user action. The rxMethod then triggers the backend HTTP call; if the network call fails, the tapResponse error callback executes patchState(store, updateEntity(previousSnapshot)) and displays a user error toast.',
          takeaway: 'Always capture previous state before optimistic mutations to enable instant rollback upon error.',
        },
      ],
    },
  },
  fr: {
    eyebrow: 'Confrontation architecturale',
    heading: 'NgRx vs Services : matrice de stratégie d’état',
    lead: 'Une évaluation niveau Senior Architect : quand utiliser de simples Services (Signals/RxJS), quand adopter NgRx SignalStore et quand opter pour le Global Store Redux.',
    spectrum: {
      title: 'Le spectre de l’architecture d’état Angular',
      subtitle: 'De la réactivité UI légère à l’orchestration critique d’entreprise',
      tier1Num: 'Niveau 1',
      tier1Title: 'Signal de composant',
      tier1Desc: 'Drapeaux UI locaux, bascules, formulaires',
      tier2Num: 'Niveau 2',
      tier2Title: 'Service à Signaux',
      tier2Desc: 'Portée fonctionnalité, service API unique',
      tier3Num: 'Niveau 3 ⭐',
      tier3Title: 'NgRx SignalStore',
      tier3Desc: 'Modulaire, normalisé O(1), rxMethod',
      tier4Num: 'Niveau 4',
      tier4Title: 'Global Store Redux',
      tier4Desc: 'Multi-équipes, événements inter-modules',
    },
    advisor: {
      title: 'Conseiller d’architecture d’état',
      subtitle: 'Répondez à 3 questions pour générer une recommandation architecturale adaptée à votre projet.',
      badge: 'Assistant interactif',
      q1Label: '1. Portée & partage de l’état :',
      q1Local: 'Local au composant / module',
      q1Modular: 'Partagé entre fonctionnalités liées',
      q1Global: 'Cache global à toute l’application',
      q2Label: '2. Chorégraphie asynchrone & événements :',
      q2Simple: 'Requête HTTP simple / mutations',
      q2Streams: 'Recherche avec debounce, polling, WebSockets',
      q2Choreography: 'Chorégraphie d’actions inter-fonctionnalités',
      q3Label: '3. Taille d’équipe & audit Time-Travel :',
      q3Standard: 'Développement standard (Console / Tests)',
      q3Strict: 'Conformité stricte / Rejeu Redux DevTools',
      recommendedLabel: 'Architecture recommandée :',
      inspectBtn: 'Inspecter les spécifications & l’exemple de code ↓',
      recommendations: {
        'global-store': {
          winner: 'NgRx Global Store + Effects',
          rationale: 'Vos exigences de conformité stricte, d’audit temporel ou de chorégraphie d’événements inter-modules font du Store NgRx classique avec Effects le choix le plus sûr.',
        },
        'service-signals': {
          winner: 'Service avec Signaux (signal & computed)',
          rationale: 'Pour un état UI localisé ou un CRUD simple, un Service injectable avec Signaux offre zéro boilerplate et une réactivité push-pull instantanée sans surcoût.',
        },
        'service-rxjs': {
          winner: 'Service avec RxJS (BehaviorSubject)',
          rationale: 'Lorsque vous devez coordonner des flux complexes, une recherche debouncée ou des WebSockets localement sans indexation globale d’entités, un Service RxJS exploite toute la puissance des opérateurs.',
        },
        'signal-store': {
          winner: 'NgRx SignalStore (@ngrx/signals)',
          rationale: 'Le standard d’excellence pour Angular 22 Zoneless ! SignalStore offre une composition modulaire (withEntities, withMethods, rxMethod), un typage fort et des signaux natifs pour seulement ~1,5 ko.',
        },
      },
    },
    detail: {
      eyebrow: 'Profil architectural',
      bundleImpactLabel: 'Impact Bundle',
      learningCurveLabel: 'Apprentissage',
      timeTravelLabel: 'Time-Travel',
      whenToUseTitle: '✅ Quand l’utiliser (Cas idéaux)',
      whenToAvoidTitle: '⚠️ Quand l’éviter (Pièges)',
      codeExampleTitle: 'Exemple d’implémentation idiomatique Angular 22 :',
    },
    patterns: [
      {
        key: 'service-signals',
        name: 'Service avec Signaux',
        tagline: 'Signaux Angular 22 purs : signal() modifiable et computed() dérivé.',
        badge: 'simplest',
        bundleWeight: '0 kB (Intégré)',
        reactivityModel: 'Push-Pull sans glitch',
        learningCurve: 'Gentle',
        timeTravelSupport: 'None',
        whenToUse: [
          'État UI local au composant (modales, onglets, pagination, lignes actives)',
          'Services CRUD simples sans relations normalisées inter-entités',
          'Applications petites à moyennes sans dépendances tierces',
          'Dérivations synchrones directes avec computed()',
        ],
        whenToAvoid: [
          'Collections multi-entités normalisées nécessitant des accès O(1) par ID',
          'Orchestration complexe entre micro-frontends indépendants',
          'Applications réglementées exigeant l’audit temporel Redux DevTools',
        ],
        codeSample: CODE_SAMPLES['service-signals'],
      },
      {
        key: 'service-rxjs',
        name: 'Service avec RxJS',
        tagline: 'Flux d’événements Observable avec BehaviorSubject et opérateurs d’ordre supérieur.',
        badge: 'stream-heavy',
        bundleWeight: '~4 kB (RxJS)',
        reactivityModel: 'Flux Push Observables',
        learningCurve: 'Moderate',
        timeTravelSupport: 'Manual',
        whenToUse: [
          'Orchestration complexe de flux (switchMap, debounceTime, combineLatest)',
          'Entrées temps réel en continu (WebSockets, SSE, boucles Canvas)',
          'Gestion de l’annulation de requêtes et politiques de retry avec backoff',
        ],
        whenToAvoid: [
          'État synchrone simple où le pipe async alourdit les templates',
          'Composants zoneless privilégiant la détection par signaux',
          'Équipes exposées aux fuites mémoire liées aux abonnements non fermés',
        ],
        codeSample: CODE_SAMPLES['service-rxjs'],
      },
      {
        key: 'signal-store',
        name: 'NgRx SignalStore',
        tagline: 'Composition fonctionnelle moderne : withEntities, withMethods, rxMethod & withHooks.',
        badge: 'recommended',
        bundleWeight: '~1.5 kB (@ngrx/signals)',
        reactivityModel: 'Signaux natifs + rxMethod',
        learningCurve: 'Moderate',
        timeTravelSupport: 'Custom Plugin',
        whenToUse: [
          'Choix par défaut recommandé pour les applications Angular 22 & Zoneless',
          'État de fonctionnalité modulaire nécessitant la normalisation d’entités (ids + entityMap)',
          'Intégration de flux asynchrones via rxMethod sans abonnement manuel',
          'Composition de plugins réutilisables entre plusieurs équipes',
        ],
        whenToAvoid: [
          'Contraintes d’entreprise exigeant strictement le rejeu natif Redux DevTools',
          'Micro-états éphémères d’une ligne où un simple signal() suffit',
        ],
        codeSample: CODE_SAMPLES['signal-store'],
      },
      {
        key: 'global-store',
        name: 'NgRx Global Store + Effects',
        tagline: 'Redux classique : ActionGroups, Feature Reducers, Selectors mémoïsés et Effects.',
        badge: 'enterprise',
        bundleWeight: '~15-20 kB (@ngrx/store+effects)',
        reactivityModel: 'Redux piloté par Actions',
        learningCurve: 'Steep',
        timeTravelSupport: 'Full Redux DevTools',
        whenToUse: [
          'Grandes applications d’entreprise avec plusieurs équipes distribuées',
          'Workflows financiers ou réglementaires critiques exigeant un audit complet des actions',
          'Chorégraphie complexe d’événements inter-modules et cache global multi-entités',
          'Frontières architecturales strictes découplant totalement l’UI des effets de bord',
        ],
        whenToAvoid: [
          'Applications CRUD simples où le boilerplate Redux ralentit la vélocité',
          'Micro-frontends ultra-légers sensibles au poids du bundle',
        ],
        codeSample: CODE_SAMPLES['global-store'],
      },
    ],
    matrix: {
      heading: 'Matrice comparative complète des architectures',
      colDimension: 'Critère d’évaluation',
      colServiceSignals: 'Service + Signaux',
      colServiceRxjs: 'Service + RxJS',
      colSignalStore: 'NgRx SignalStore',
      colGlobalStore: 'NgRx Global Store',
      rows: [
        {
          dimension: 'Modèle de réactivité',
          serviceSignals: 'Signaux Push-pull sans glitch',
          serviceRxjs: 'Flux Push Observable',
          signalStore: 'Signaux Push-pull + rxMethod',
          globalStore: 'Tranches Observable (ou toSignal)',
        },
        {
          dimension: 'Volume de boilerplate',
          serviceSignals: 'Minimal (Zéro framework)',
          serviceRxjs: 'Faible-Moyen (Subjects)',
          signalStore: 'Faible (Plugins déclaratifs)',
          globalStore: 'Élevé (Actions/Reducers/Effects)',
        },
        {
          dimension: 'Ergonomie Zoneless',
          serviceSignals: 'Native de première classe',
          serviceRxjs: 'Requiert async pipe / rxResource',
          signalStore: 'Native de première classe',
          globalStore: 'Requiert selectSignal / toSignal',
        },
        {
          dimension: 'Normalisation d’entités',
          serviceSignals: 'Mapping manuel d’objets',
          serviceRxjs: 'Mapping manuel d’objets',
          signalStore: 'withEntities() intégré',
          globalStore: '@ngrx/entity intégré',
        },
        {
          dimension: 'DevTools & Time-Travel',
          serviceSignals: 'DevTools navigateur standard',
          serviceRxjs: 'Logs console / tap()',
          signalStore: 'Plugins Signal personnalisés',
          globalStore: 'Extension Redux DevTools complète',
        },
        {
          dimension: 'Cas d’usage idéal',
          serviceSignals: 'UI composant / État formulaire',
          serviceRxjs: 'Agrégation de flux temps réel',
          signalStore: 'Modules métier (Recommandé)',
          globalStore: 'État global inter-équipes',
        },
      ],
    },
    interview: {
      eyebrow: 'Questions & Réponses Senior Architect / Recruteur',
      title: 'Questions clés d’architecture de gestion d’état',
      keyRuleLabel: 'Règle d’or :',
      faqs: [
        {
          id: 'signals-vs-ngrx',
          question: 'Les Signaux Angular remplacent-ils NgRx dans Angular 22 ?',
          answer: 'Non. Les Signaux Angular sont une primitive de réactivité fine et de détection de changements (résolvant la mise à jour synchrone de l’UI sans Zone.js). NgRx est un framework d’architecture d’état (organisant, normalisant en O(1), partageant entre routes lazy et coordonnant les flux asynchrones complexes). Les deux fonctionnent en synergie : NgRx expose des signaux pour le template.',
          takeaway: 'Utilisez les Signaux pour lier les données aux templates ; utilisez NgRx pour structurer, normaliser et orchestrer le cycle de vie de l’état.',
        },
        {
          id: 'anti-pattern',
          question: 'Quand NgRx est-il considéré comme un anti-pattern ou de la sur-ingénierie ?',
          answer: 'NgRx est un anti-pattern pour les applications CRUD simples aux pages indépendantes et sans partage d’état transversal. Écrire des Actions, Reducers et Selectors juste pour ouvrir une modale ou soumettre un formulaire à 3 champs introduit une cérémonie inutile.',
          takeaway: 'Commencez par un Service à Signaux ou un état composant ; passez à SignalStore lorsque l’état est partagé ou nécessite une normalisation.',
        },
        {
          id: 'signalstore-vs-global',
          question: 'Pourquoi choisir NgRx SignalStore plutôt que le Global Store NgRx traditionnel ?',
          answer: 'SignalStore réduit le boilerplate d’environ 80 % tout en conservant le typage fort et l’immuabilité. Il ne nécessite ni types d’actions ni switch de reducer, est 100 % tree-shakeable, compose des plugins modulaires (withEntities, withComputed, withMethods) et s’intègre à RxJS via rxMethod.',
          takeaway: 'Pour les nouvelles fonctionnalités Angular en 2026, SignalStore est le standard recommandé par défaut.',
        },
        {
          id: 'optimistic-rollback',
          question: 'Comment gérer les mises à jour UI optimistes avec annulation (rollback) dans NgRx ?',
          answer: 'Dans SignalStore, appelez patchState(store, updateEntity(optimisticData)) dès l’action utilisateur. La rxMethod lance ensuite l’appel HTTP ; en cas d’échec réseau, le bloc error de tapResponse restaure patchState(store, updateEntity(previousSnapshot)) et affiche une notification d’erreur.',
          takeaway: 'Capturez toujours l’instantané précédent avant une mutation optimiste pour permettre un retour arrière instantané.',
        },
      ],
    },
  },
  ar: {
    eyebrow: 'المقارنة المعمارية الشاملة',
    heading: 'مقارنة NgRx والخدمات: مصفوفة استراتيجية الحالة',
    lead: 'تقييم بمستوى مهندس برمجيات خبير: متى تستخدم الخدمات البسيطة (Signals/RxJS)، ومتى تختار NgRx SignalStore، ومتى تلجأ إلى مخزن Redux العالمي.',
    spectrum: {
      title: 'طيف بنية إدارة الحالة في Angular',
      subtitle: 'من التفاعلية الخفيفة للواجهة إلى التنسيق المؤسسي الحرج',
      tier1Num: 'المستوى 1',
      tier1Title: 'إشارة المكوّن',
      tier1Desc: 'رايات الواجهة المحلية والأزرار والنماذج',
      tier2Num: 'المستوى 2',
      tier2Title: 'خدمة الإشارات',
      tier2Desc: 'نطاق ميزة واحدة وخدمة API مفردة',
      tier3Num: 'المستوى 3 ⭐',
      tier3Title: 'NgRx SignalStore',
      tier3Desc: 'معياري، تطبيع O(1)، ودعم rxMethod',
      tier4Num: 'المستوى 4',
      tier4Title: 'مخزن Redux العالمي',
      tier4Desc: 'لفرق متعددة وأحداث عابرة للميزات',
    },
    advisor: {
      title: 'مستشار بنية إدارة الحالة',
      subtitle: 'أجب عن 3 أسئلة لتوليد توصية معمارية مخصصة لمشروعك.',
      badge: 'معالج تفاعلي',
      q1Label: '1. نطاق الحالة ومشاركتها:',
      q1Local: 'محلي داخل المكوّن / الميزة',
      q1Modular: 'مشترك بين ميزات مترابطة',
      q1Global: 'ذاكرة تخزين عالمية للتطبيق بالكامل',
      q2Label: '2. التعقيد غير المتزامن وتنسيق الأحداث:',
      q2Simple: 'طلبات HTTP وتعديلات بسيطة',
      q2Streams: 'بحث مؤجل (Debounce)، استطلاع، WebSockets',
      q2Choreography: 'تنسيق إجراءات متشابك عبر الميزات',
      q3Label: '3. حجم الفريق وتدقيق السفر عبر الزمن:',
      q3Standard: 'تطوير قياسي (وحدة التحكم / الاختبارات)',
      q3Strict: 'امتثال صارم / إعادة تشغيل Redux DevTools',
      recommendedLabel: 'البنية الموصى بها:',
      inspectBtn: 'فحص مواصفات النمط ومقتطف الكود ↓',
      recommendations: {
        'global-store': {
          winner: 'NgRx Global Store + Effects',
          rationale: 'متطلباتك للامتثال الصارم أو التدقيق عبر الزمن أو تنسيق الأحداث عبر الميزات تجعل مخزن NgRx الكلاسيكي مع التأثيرات الخيار الأكثر أمانًا.',
        },
        'service-signals': {
          winner: 'Service with Signals (signal & computed)',
          rationale: 'للحالة المحلية للواجهة أو المكونات ذات عمليات CRUD المباشرة، توفر الخدمة القابلة للحقن مع الإشارات تفاعلية فورية دون أي شيفرة نمطية أو عبء إضافي.',
        },
        'service-rxjs': {
          winner: 'Service with RxJS (BehaviorSubject)',
          rationale: 'عندما تحتاج إلى تنسيق تدفقات معقدة أو بحث مؤجل أو WebSockets داخل نطاق محلي دون فهرسة كيانات عالمية، تمنحك خدمة RxJS القوة الكاملة للمعاملات.',
        },
        'signal-store': {
          winner: 'NgRx SignalStore (@ngrx/signals)',
          rationale: 'المعيار الذهبي الحديث لـ Angular 22 بدون Zone.js! يوفر SignalStore تركيبًا معياريًا للحالة (withEntities وwithMethods وrxMethod) وأمان أنواع كامل بحجم خفيف جدًا (~1.5 ك.ب).',
        },
      },
    },
    detail: {
      eyebrow: 'الملف المعماري',
      bundleImpactLabel: 'حجم الحزمة',
      learningCurveLabel: 'منحنى التعلم',
      timeTravelLabel: 'السفر عبر الزمن',
      whenToUseTitle: '✅ متى يُستخدم (الأنسب)',
      whenToAvoidTitle: '⚠️ متى يُتجنب (المخاطر)',
      codeExampleTitle: 'مثال تنفيذي قياسي في Angular 22:',
    },
    patterns: [
      {
        key: 'service-signals',
        name: 'خدمة مع الإشارات (Signals)',
        tagline: 'إشارات Angular 22 نقية: signal() القابلة للكتابة وcomputed() المشتقة.',
        badge: 'simplest',
        bundleWeight: '0 kB (مدمج)',
        reactivityModel: 'دفع-سحب خالٍ من الوميض',
        learningCurve: 'Gentle',
        timeTravelSupport: 'None',
        whenToUse: [
          'حالة واجهة المستخدم المحلية للمكوّن (النوافذ المنبثقة، التبويبات، الترقيم)',
          'خدمات CRUD البسيطة دون علاقات متشابكة بين الكيانات',
          'التطبيقات الصغيرة والمتوسطة التي تفضل عدم إضافة مكتبات خارجية',
          'الاشتقاقات المتزامنة المباشرة باستخدام computed()',
        ],
        whenToAvoid: [
          'مجموعات الكيانات المتعددة التي تتطلب بحثًا فوريًا O(1) بواسطة المعرّف',
          'تنسيق الحالة المعقد عبر واجهات مصغّرة (Micro-frontends) مستقلة',
          'التطبيقات الخاضعة للرقابة التي تتطلب سجل تدقيق Redux DevTools',
        ],
        codeSample: CODE_SAMPLES['service-signals'],
      },
      {
        key: 'service-rxjs',
        name: 'خدمة مع RxJS',
        tagline: 'تدفق أحداث Observable باستخدام BehaviorSubject ومعاملات الرتب العليا.',
        badge: 'stream-heavy',
        bundleWeight: '~4 kB (RxJS)',
        reactivityModel: 'تدفقات دفع Observable',
        learningCurve: 'Moderate',
        timeTravelSupport: 'Manual',
        whenToUse: [
          'تنسيق التدفقات المعقدة (switchMap وdebounceTime وcombineLatest)',
          'المدخلات المتدفقة في الوقت الفعلي (WebSockets وSSE وحلقات الرسوم)',
          'إدارة إلغاء الطلبات غير المتزامنة وسياسات إعادة المحاولة',
        ],
        whenToAvoid: [
          'الحالة المتزامنة البسيطة حيث يربك أنبوب async القوالب',
          'المكونات الخالية من Zone.js التي تفضل اكتشاف التغيير بالإشارات',
          'الفرق المعرضة لتسرب الذاكرة بسبب الاشتراكات غير المغلقة',
        ],
        codeSample: CODE_SAMPLES['service-rxjs'],
      },
      {
        key: 'signal-store',
        name: 'NgRx SignalStore',
        tagline: 'تركيب وظيفي حديث: withEntities وwithMethods وrxMethod وwithHooks.',
        badge: 'recommended',
        bundleWeight: '~1.5 kB (@ngrx/signals)',
        reactivityModel: 'إشارات أصلية + rxMethod',
        learningCurve: 'Moderate',
        timeTravelSupport: 'Custom Plugin',
        whenToUse: [
          'الخيار الافتراضي الموصى به لتطبيقات Angular 22 الحديثة بدون Zone.js',
          'حالة الميزات المعيارية التي تتطلب تطبيع الكيانات (ids + entityMap)',
          'دمج التدفقات غير المتزامنة عبر rxMethod دون اشتراكات يدوية',
          'بناء إضافات مخصصة قابلة لإعادة الاستخدام عبر فرق متعددة',
        ],
        whenToAvoid: [
          'المتطلبات المؤسسية الصارمة التي تفرض إعادة تشغيل امتداد Redux DevTools حصريًا',
          'الحالات المؤقتة الصغيرة جدًا حيث تكفي إشارة signal() بسيطة',
        ],
        codeSample: CODE_SAMPLES['signal-store'],
      },
      {
        key: 'global-store',
        name: 'NgRx Global Store + Effects',
        tagline: 'نمط Redux الكلاسيكي: مجموعات الإجراءات والمختزلات والمحددات والتأثيرات.',
        badge: 'enterprise',
        bundleWeight: '~15-20 kB (@ngrx/store+effects)',
        reactivityModel: 'Redux موجّه بالإجراءات',
        learningCurve: 'Steep',
        timeTravelSupport: 'Full Redux DevTools',
        whenToUse: [
          'تطبيقات المؤسسات الضخمة التي تضم فرق تطوير متعددة وموزعة',
          'سير العمل المالي أو الرقابي الحرج الذي يتطلب تدقيقًا كاملًا للإجراءات',
          'تنسيق الأحداث المعقد عبر الميزات والتخزين المؤقت العالمي متعدد الكيانات',
          'الحدود المعمارية الصارمة التي تفصل المكونات تمامًا عن التأثيرات الجانبية',
        ],
        whenToAvoid: [
          'تطبيقات CRUD البسيطة حيث تبطئ الشيفرة النمطية لـ Redux سرعة التطوير',
          'الواجهات المصغّرة الحساسة جدًا لحجم الحزمة',
        ],
        codeSample: CODE_SAMPLES['global-store'],
      },
    ],
    matrix: {
      heading: 'مصفوفة المقارنة المعمارية الشاملة',
      colDimension: 'بُعد التقييم',
      colServiceSignals: 'خدمة + إشارات',
      colServiceRxjs: 'خدمة + RxJS',
      colSignalStore: 'NgRx SignalStore',
      colGlobalStore: 'مخزن NgRx العالمي',
      rows: [
        {
          dimension: 'نموذج التفاعلية',
          serviceSignals: 'إشارات دفع-سحب خالية من الوميض',
          serviceRxjs: 'تدفقات دفع Observable',
          signalStore: 'إشارات دفع-سحب + rxMethod',
          globalStore: 'شرائح Observable (أو toSignal)',
        },
        {
          dimension: 'مستوى الشيفرة النمطية',
          serviceSignals: 'الأدنى (بدون إطار خارجي)',
          serviceRxjs: 'منخفض-متوسط (Subjects)',
          signalStore: 'منخفض (إضافات تصريحية)',
          globalStore: 'مرتفع (إجراءات/مختزلات/تأثيرات)',
        },
        {
          dimension: 'التوافق مع الوضع بدون Zone.js',
          serviceSignals: 'دعم أصلي من الدرجة الأولى',
          serviceRxjs: 'يتطلب async pipe / rxResource',
          signalStore: 'دعم أصلي من الدرجة الأولى',
          globalStore: 'يتطلب selectSignal / toSignal',
        },
        {
          dimension: 'تطبيع الكيانات',
          serviceSignals: 'تحويل كائنات يدوي',
          serviceRxjs: 'تحويل كائنات يدوي',
          signalStore: 'مدمج عبر withEntities()',
          globalStore: 'مدمج عبر @ngrx/entity',
        },
        {
          dimension: 'أدوات المطور والسفر عبر الزمن',
          serviceSignals: 'أدوات متصفح قياسية',
          serviceRxjs: 'سجلات Console / معاملات tap',
          signalStore: 'إضافات Signal مخصصة',
          globalStore: 'امتداد Redux DevTools الكامل',
        },
        {
          dimension: 'أفضل حالة استخدام',
          serviceSignals: 'حالة واجهة المكوّن والنماذج',
          serviceRxjs: 'تجميع التدفقات الفورية',
          signalStore: 'الميزات المعيارية (موصى به)',
          globalStore: 'حالة المؤسسات الكبيرة عبر الفرق',
        },
      ],
    },
    interview: {
      eyebrow: 'أسئلة وأجوبة كبار المطورين ومسؤولي التوظيف',
      title: 'أسئلة جوهرية في هندسة إدارة الحالة',
      keyRuleLabel: 'القاعدة الذهبية:',
      faqs: [
        {
          id: 'signals-vs-ngrx',
          question: 'هل تغني إشارات Angular عن NgRx في Angular 22؟',
          answer: 'لا. إشارات Angular هي أداة أولية للتفاعلية الدقيقة واكتشاف التغييرات في الواجهة دون عبء Zone.js. أما NgRx فهو إطار معماري لإدارة الحالة (ينظم الحالة ويطبّعها في قواميس O(1) ويشاركها عبر الميزات الكسولة ويدققها عبر DevTools وينسق التدفقات غير المتزامنة). كلاهما يعمل بتكامل: NgRx يصدر إشارات لربط القوالب.',
          takeaway: 'استخدم الإشارات لعرض البيانات في القوالب؛ واستخدم NgRx لهندسة وتطبيع وتنسيق دورة حياة الحالة.',
        },
        {
          id: 'anti-pattern',
          question: 'متى يُعتبر استخدام NgRx مبالغة هندسية أو نمطًا غير مناسب؟',
          answer: 'يُعد NgRx نمطًا غير مناسب لتطبيقات CRUD البسيطة ذات الصفحات المستقلة والنماذج المعزولة التي لا تتشارك الحالة. كتابة إجراءات ومختزلات ومحددات لمجرد فتح نافذة منبثقة يضيف تعقيدًا غير مبرر.',
          takeaway: 'ابدأ بخدمات الإشارات البسيطة أو حالة المكوّن؛ وانتقل إلى SignalStore عندما تصبح الحالة مشتركة أو تحتاج إلى تطبيع.',
        },
        {
          id: 'signalstore-vs-global',
          question: 'لماذا نختار NgRx SignalStore بدلًا من مخزن NgRx العالمي التقليدي؟',
          answer: 'يقلل SignalStore الشيفرة النمطية بنسبة ~80% مع الحفاظ على أمان الأنواع وعدم القابلية للتغيير. لا يتطلب تعريف أنواع إجراءات أو جمل switch، ويدعم التشذيب الكامل (Tree-shaking) وتركيب الإضافات (withEntities وwithComputed وwithMethods) والتكامل مع RxJS عبر rxMethod.',
          takeaway: 'للميزات الجديدة في Angular 22، يُعد SignalStore المعيار الافتراضي الموصى به.',
        },
        {
          id: 'optimistic-rollback',
          question: 'كيف تتعامل مع التحديثات المتفائلة للواجهة (Optimistic UI) مع التراجع عند الفشل في NgRx؟',
          answer: 'في SignalStore، استدعِ patchState(store, updateEntity(optimisticData)) فور تفاعل المستخدم. ثم يطلق rxMethod طلب الشبكة؛ وإذا فشل الطلب، ينفذ معالج الخطأ في tapResponse التراجع إلى اللقطة السابقة ويعرض تنبيهًا للمستخدم.',
          takeaway: 'احتفظ دائمًا بنسخة من الحالة السابقة قبل التعديل المتفائل لتمكين التراجع الفوري عند حدوث خطأ.',
        },
      ],
    },
  },
  it: {
    eyebrow: 'Confronto Architetturale',
    heading: 'NgRx vs Servizi: matrice strategica dello stato',
    lead: 'Una valutazione di livello Senior Architect: quando usare semplici Servizi (Signals/RxJS), quando scegliere NgRx SignalStore e quando adottare il Global Redux Store.',
    spectrum: {
      title: 'Lo spettro dell’architettura di stato in Angular',
      subtitle: 'Dalla reattività UI leggera all’orchestrazione enterprise mission-critical',
      tier1Num: 'Livello 1',
      tier1Title: 'Signal di componente',
      tier1Desc: 'Flag UI locali, toggle, form',
      tier2Num: 'Livello 2',
      tier2Title: 'Servizio a Signal',
      tier2Desc: 'Scope di feature, singolo servizio API',
      tier3Num: 'Livello 3 ⭐',
      tier3Title: 'NgRx SignalStore',
      tier3Desc: 'Modulare, normalizzato O(1), rxMethod',
      tier4Num: 'Livello 4',
      tier4Title: 'Global Redux Store',
      tier4Desc: 'Multi-team, eventi cross-feature',
    },
    advisor: {
      title: 'Consulente di architettura dello stato',
      subtitle: 'Rispondi a 3 domande per generare una raccomandazione architetturale per il tuo progetto.',
      badge: 'Wizard interattivo',
      q1Label: '1. Ambito & condivisione dello stato:',
      q1Local: 'Locale a feature / componente',
      q1Modular: 'Condiviso tra feature correlate',
      q1Global: 'Cache globale dell’intera app',
      q2Label: '2. Complessità asincrona & coreografia eventi:',
      q2Simple: 'Fetch HTTP semplici / mutazioni',
      q2Streams: 'Ricerca con debounce, polling, WebSocket',
      q2Choreography: 'Coreografia di action cross-feature',
      q3Label: '3. Scala del team & audit Time-Travel:',
      q3Standard: 'Sviluppo standard (Console / Test)',
      q3Strict: 'Conformità rigorosa / Replay Redux DevTools',
      recommendedLabel: 'Architettura consigliata:',
      inspectBtn: 'Ispeziona specifiche del pattern & codice ↓',
      recommendations: {
        'global-store': {
          winner: 'NgRx Global Store + Effects',
          rationale: 'I requisiti di conformità rigorosa, auditabilità time-travel o coreografia di eventi cross-feature rendono il classico NgRx Store con Effects la scelta più sicura.',
        },
        'service-signals': {
          winner: 'Service with Signals (signal & computed)',
          rationale: 'Per stato UI co-locato o componenti con CRUD lineare, un semplice Servizio iniettabile con Signals offre zero boilerplate e reattività push-pull istantanea a costo 0 kB.',
        },
        'service-rxjs': {
          winner: 'Service with RxJS (BehaviorSubject)',
          rationale: 'Quando servono coordinamento complesso di stream, ricerca con debounce o WebSocket in un componente locale senza indicizzazione globale, un Servizio RxJS sfrutta tutta la potenza degli operatori.',
        },
        'signal-store': {
          winner: 'NgRx SignalStore (@ngrx/signals)',
          rationale: 'Il moderno punto di riferimento per Angular 22 Zoneless! SignalStore offre composizione modulare (withEntities, withMethods, rxMethod), type-safety e signal nativi in soli ~1,5 kB.',
        },
      },
    },
    detail: {
      eyebrow: 'Profilo Architetturale',
      bundleImpactLabel: 'Impatto Bundle',
      learningCurveLabel: 'Curva di apprendimento',
      timeTravelLabel: 'Time-Travel',
      whenToUseTitle: '✅ Quando usarlo (Scelta ideale)',
      whenToAvoidTitle: '⚠️ Quando evitarlo (Insidie)',
      codeExampleTitle: 'Esempio di implementazione idiomatica Angular 22:',
    },
    patterns: [
      {
        key: 'service-signals',
        name: 'Servizio con Signals',
        tagline: 'Puri signal Angular 22: signal() scrivibile e computed() derivato.',
        badge: 'simplest',
        bundleWeight: '0 kB (Integrato)',
        reactivityModel: 'Push-Pull Glitch-Free',
        learningCurve: 'Gentle',
        timeTravelSupport: 'None',
        whenToUse: [
          'Stato UI locale al componente (modali, tab, paginazione, righe attive)',
          'Servizi CRUD semplici senza relazioni normalizzate tra entità',
          'Applicazioni piccole o medie senza dipendenze di terze parti',
          'Derivazioni sincrone dirette tramite computed()',
        ],
        whenToAvoid: [
          'Collezioni normalizzate multi-entità che richiedono lookup O(1) per ID',
          'Orchestrazione complessa dello stato tra micro-frontend indipendenti',
          'Applicazioni regolamentate che richiedono audit time-travel con Redux DevTools',
        ],
        codeSample: CODE_SAMPLES['service-signals'],
      },
      {
        key: 'service-rxjs',
        name: 'Servizio con RxJS',
        tagline: 'Streaming di eventi Observable con BehaviorSubject e operatori di ordine superiore.',
        badge: 'stream-heavy',
        bundleWeight: '~4 kB (RxJS)',
        reactivityModel: 'Stream Push Observable',
        learningCurve: 'Moderate',
        timeTravelSupport: 'Manual',
        whenToUse: [
          'Orchestrazione complessa di stream (switchMap, debounceTime, combineLatest)',
          'Input streaming real-time (WebSocket, SSE, loop di animazione Canvas)',
          'Gestione cancellazione richieste asincrone e politiche di retry-backoff',
        ],
        whenToAvoid: [
          'Stato sincrono semplice dove la pipe async appesantisce i template',
          'Componenti zoneless in cui si preferisce change detection basata su signal',
          'Team esposti a memory leak per sottoscrizioni non chiuse',
        ],
        codeSample: CODE_SAMPLES['service-rxjs'],
      },
      {
        key: 'signal-store',
        name: 'NgRx SignalStore',
        tagline: 'Composizione funzionale moderna: withEntities, withMethods, rxMethod & withHooks.',
        badge: 'recommended',
        bundleWeight: '~1.5 kB (@ngrx/signals)',
        reactivityModel: 'Signal nativi + rxMethod',
        learningCurve: 'Moderate',
        timeTravelSupport: 'Custom Plugin',
        whenToUse: [
          'Scelta predefinita consigliata per applicazioni moderne Angular 22 & Zoneless',
          'Stato modulare di feature che richiede normalizzazione entità (array ids + entityMap)',
          'Integrazione di stream asincroni tramite rxMethod senza sottoscrizioni manuali',
          'Composizione di plugin personalizzati riutilizzabili tra più team',
        ],
        whenToAvoid: [
          'Requisiti enterprise che impongono tassativamente il replay con estensione Redux DevTools',
          'Stati effimeri di una sola riga in cui basta un semplice signal()',
        ],
        codeSample: CODE_SAMPLES['signal-store'],
      },
      {
        key: 'global-store',
        name: 'NgRx Global Store + Effects',
        tagline: 'Redux classico: ActionGroups, Feature Reducers, Selector memoizzati ed Effects.',
        badge: 'enterprise',
        bundleWeight: '~15-20 kB (@ngrx/store+effects)',
        reactivityModel: 'Redux guidato da Action',
        learningCurve: 'Steep',
        timeTravelSupport: 'Full Redux DevTools',
        whenToUse: [
          'Grandi app enterprise con molteplici team di sviluppo distribuiti',
          'Flussi finanziari o di compliance mission-critical con audit completo delle action',
          'Coreografia complessa di eventi cross-feature e caching globale multi-entità',
          'Confini architetturali rigorosi in cui i componenti sono totalmente disaccoppiati dai side-effect',
        ],
        whenToAvoid: [
          'Semplici applicazioni CRUD in cui il boilerplate Redux rallenta la velocità di sviluppo',
          'Micro-frontend sensibili alle prestazioni che danno priorità a bundle ridotti',
        ],
        codeSample: CODE_SAMPLES['global-store'],
      },
    ],
    matrix: {
      heading: 'Matrice di confronto architetturale completa',
      colDimension: 'Dimensione di valutazione',
      colServiceSignals: 'Servizio + Signals',
      colServiceRxjs: 'Servizio + RxJS',
      colSignalStore: 'NgRx SignalStore',
      colGlobalStore: 'NgRx Global Store',
      rows: [
        {
          dimension: 'Modello di reattività',
          serviceSignals: 'Signal Push-pull senza glitch',
          serviceRxjs: 'Stream Push Observable',
          signalStore: 'Signal Push-pull + rxMethod',
          globalStore: 'Slice Observable (o toSignal)',
        },
        {
          dimension: 'Livello di boilerplate',
          serviceSignals: 'Minimo (Zero framework)',
          serviceRxjs: 'Basso-Medio (Subject)',
          signalStore: 'Basso (Plugin dichiarativi)',
          globalStore: 'Alto (Action/Reducer/Effect)',
        },
        {
          dimension: 'Ergonomia Zoneless',
          serviceSignals: 'Nativa di prima classe',
          serviceRxjs: 'Richiede async pipe / rxResource',
          signalStore: 'Nativa di prima classe',
          globalStore: 'Richiede selectSignal / toSignal',
        },
        {
          dimension: 'Normalizzazione entità',
          serviceSignals: 'Mapping manuale oggetti',
          serviceRxjs: 'Mapping manuale oggetti',
          signalStore: 'withEntities() integrato',
          globalStore: '@ngrx/entity integrato',
        },
        {
          dimension: 'DevTools & Time-Travel',
          serviceSignals: 'DevTools browser standard',
          serviceRxjs: 'Log console / tap',
          signalStore: 'Plugin Signal personalizzati',
          globalStore: 'Estensione Redux DevTools completa',
        },
        {
          dimension: 'Caso d’uso ideale',
          serviceSignals: 'UI componente / Stato form',
          serviceRxjs: 'Aggregazione stream real-time',
          signalStore: 'Feature modulari (Consigliato)',
          globalStore: 'Stato enterprise cross-team',
        },
      ],
    },
    interview: {
      eyebrow: 'Q&A per Senior Developer & Recruiter',
      title: 'Domande chiave sull’architettura di gestione dello stato',
      keyRuleLabel: 'Regola pratica fondamentale:',
      faqs: [
        {
          id: 'signals-vs-ngrx',
          question: 'Angular Signals sostituisce NgRx in Angular 22?',
          answer: 'No. Angular Signals è una primitiva di reattività fine e change detection (risolve come la UI si aggiorna in modo sincrono senza Zone.js). NgRx è un framework di architettura dello stato (risolve come lo stato è organizzato, normalizzato in dizionari O(1), condiviso tra feature lazy, ispezionato via DevTools e coordinato su flussi asincroni complessi). Lavorano in sinergia: NgRx espone signal per il binding nei template.',
          takeaway: 'Usa i Signals per esporre i dati ai template; usa NgRx per progettare, normalizzare e coordinare il ciclo di vita dello stato.',
        },
        {
          id: 'anti-pattern',
          question: 'Quando NgRx è considerato un anti-pattern o over-engineering?',
          answer: 'NgRx è un anti-pattern per semplici applicazioni CRUD con pagine indipendenti, form isolati e zero condivisione di stato tra feature. Scrivere Action, Reducer e Selector solo per commutare un booleano isModalOpen o inviare un form a 3 campi introduce cerimonia inutile.',
          takeaway: 'Usa per default semplici Servizi a Signal o stato di componente; passa a SignalStore quando lo stato è condiviso o richiede caching normalizzato.',
        },
        {
          id: 'signalstore-vs-global',
          question: 'Perché scegliere NgRx SignalStore rispetto al tradizionale NgRx Global Store?',
          answer: 'SignalStore riduce il boilerplate di circa l’80% mantenendo piena type-safety e immutabilità. Non richiede tipi di action o switch nei reducer, è 100% tree-shakeable, supporta la composizione modulare di plugin (withEntities, withComputed, withMethods) e si collega a RxJS tramite rxMethod.',
          takeaway: 'Per le nuove feature Angular nel 2026, SignalStore è lo standard predefinito raccomandato.',
        },
        {
          id: 'optimistic-rollback',
          question: 'Come gestisci gli aggiornamenti UI ottimistici con rollback in NgRx?',
          answer: 'In SignalStore chiama patchState(store, updateEntity(optimisticData)) subito dopo l’azione utente. La rxMethod avvia poi la chiamata HTTP; se la rete fallisce, il callback error di tapResponse esegue patchState(store, updateEntity(previousSnapshot)) e mostra un toast di errore.',
          takeaway: 'Salva sempre lo stato precedente prima di una mutazione ottimistica per consentire un rollback istantaneo in caso di errore.',
        },
      ],
    },
  },
  de: {
    eyebrow: 'Architektur-Showdown',
    heading: 'NgRx vs. Services: State-Strategie-Matrix',
    lead: 'Eine fundierte Senior-Architect-Bewertung: Wann einfache Services (Signals/RxJS) genügen, wann NgRx SignalStore glänzt und wann der globale Redux Store gefragt ist.',
    spectrum: {
      title: 'Das Angular-State-Architektur-Spektrum',
      subtitle: 'Von leichtgewichtiger UI-Reaktivität bis zur unternehmenskritischen Orchestrierung',
      tier1Num: 'Stufe 1',
      tier1Title: 'Komponenten-Signal',
      tier1Desc: 'Lokale UI-Flags, Toggles, Formulare',
      tier2Num: 'Stufe 2',
      tier2Title: 'Signal-Service',
      tier2Desc: 'Feature-bezogen, einzelner API-Service',
      tier3Num: 'Stufe 3 ⭐',
      tier3Title: 'NgRx SignalStore',
      tier3Desc: 'Modular, O(1)-normalisiert, rxMethod',
      tier4Num: 'Stufe 4',
      tier4Title: 'Globaler Redux Store',
      tier4Desc: 'Multi-Team, Feature-übergreifende Events',
    },
    advisor: {
      title: 'State-Architektur-Berater',
      subtitle: 'Beantworten Sie 3 Fragen, um eine Architekturempfehlung für Ihr Projekt zu erhalten.',
      badge: 'Interaktiver Assistent',
      q1Label: '1. State-Umfang & gemeinsame Nutzung:',
      q1Local: 'Lokal in Feature / Komponente',
      q1Modular: 'Geteilt zwischen verwandten Features',
      q1Global: 'App-weiter globaler Cache',
      q2Label: '2. Asynchrone & Event-Choreografie:',
      q2Simple: 'Einfache HTTP-Abfragen / Mutationen',
      q2Streams: 'Debounced-Suche, Polling, WebSockets',
      q2Choreography: 'Feature-übergreifende Action-Choreografie',
      q3Label: '3. Teamgröße & Time-Travel-Audit:',
      q3Standard: 'Standard-Entwicklung (Konsole / Tests)',
      q3Strict: 'Strikte Compliance / Redux-DevTools-Replay',
      recommendedLabel: 'Empfohlene Architektur:',
      inspectBtn: 'Architekturprofil & Codebeispiel ansehen ↓',
      recommendations: {
        'global-store': {
          winner: 'NgRx Global Store + Effects',
          rationale: 'Ihre Anforderungen an strikte Compliance, Time-Travel-Auditierbarkeit oder Feature-übergreifende Event-Choreografie machen den klassischen NgRx Store mit Effects zur sichersten Wahl.',
        },
        'service-signals': {
          winner: 'Service with Signals (signal & computed)',
          rationale: 'Für lokalen UI-State oder einzelne Feature-Komponenten mit einfachem CRUD bietet ein injizierbarer Service mit Signals null Boilerplate und sofortige Push-Pull-Reaktivität bei 0 kB Zusatzgewicht.',
        },
        'service-rxjs': {
          winner: 'Service with RxJS (BehaviorSubject)',
          rationale: 'Wenn Sie komplexe Stream-Koordination, Debounced-Suche oder WebSockets lokal benötigen, schöpft ein RxJS-Service die volle Operator-Stärke aus.',
        },
        'signal-store': {
          winner: 'NgRx SignalStore (@ngrx/signals)',
          rationale: 'Der moderne Goldstandard für Zoneless Angular 22! SignalStore bietet modulare State-Komposition (withEntities, withMethods, rxMethod), Typsicherheit und native Signals bei nur ~1,5 kB.',
        },
      },
    },
    detail: {
      eyebrow: 'Architekturprofil',
      bundleImpactLabel: 'Bundle-Größe',
      learningCurveLabel: 'Lernkurve',
      timeTravelLabel: 'Time-Travel',
      whenToUseTitle: '✅ Wann einsetzen (Idealer Einsatzbereich)',
      whenToAvoidTitle: '⚠️ Wann vermeiden (Fallstricke)',
      codeExampleTitle: 'Idiomatisches Angular-22-Implementierungsbeispiel:',
    },
    patterns: [
      {
        key: 'service-signals',
        name: 'Service mit Signals',
        tagline: 'Reine Angular-22-Signals: schreibbares signal() und abgeleitetes computed().',
        badge: 'simplest',
        bundleWeight: '0 kB (Integriert)',
        reactivityModel: 'Push-Pull Glitch-frei',
        learningCurve: 'Gentle',
        timeTravelSupport: 'None',
        whenToUse: [
          'Komponentenlokaler UI-State (Modals, Tabs, Paginierung, aktive Zeilen)',
          'Einfache CRUD-Services ohne normalisierte Entitätsbeziehungen',
          'Kleine bis mittlere Anwendungen ohne Drittanbieter-Abhängigkeiten',
          'Direkte synchrone Ableitungen mittels computed()',
        ],
        whenToAvoid: [
          'Normalisierte Multi-Entity-Sammlungen mit O(1)-Zugriff per ID',
          'Komplexe Feature-übergreifende Orchestrierung über unabhängige Micro-Frontends',
          'Regulierte Anwendungen mit Pflicht zu Redux-DevTools-Time-Travel-Audits',
        ],
        codeSample: CODE_SAMPLES['service-signals'],
      },
      {
        key: 'service-rxjs',
        name: 'Service mit RxJS',
        tagline: 'Observable-Event-Streaming mit BehaviorSubject und Higher-Order-Operatoren.',
        badge: 'stream-heavy',
        bundleWeight: '~4 kB (RxJS)',
        reactivityModel: 'Push-Stream-Observables',
        learningCurve: 'Moderate',
        timeTravelSupport: 'Manual',
        whenToUse: [
          'Komplexe Stream-Orchestrierung (switchMap, debounceTime, combineLatest)',
          'Echtzeit-Streaming-Eingaben (WebSockets, SSE, Canvas-Animationsschleifen)',
          'Steuerung von Request-Abbruch und Retry-Backoff-Strategien',
        ],
        whenToAvoid: [
          'Einfacher synchroner State, bei dem Async-Pipes Templates unnötig aufblähen',
          'Zoneless-Komponenten mit Fokus auf signalbasierte Change Detection',
          'Teams mit Risiko für Memory Leaks durch nicht geschlossene Subscriptions',
        ],
        codeSample: CODE_SAMPLES['service-rxjs'],
      },
      {
        key: 'signal-store',
        name: 'NgRx SignalStore',
        tagline: 'Moderne funktionale Komposition: withEntities, withMethods, rxMethod & withHooks.',
        badge: 'recommended',
        bundleWeight: '~1.5 kB (@ngrx/signals)',
        reactivityModel: 'Native Signals + rxMethod',
        learningCurve: 'Moderate',
        timeTravelSupport: 'Custom Plugin',
        whenToUse: [
          'Empfohlener Standard für moderne Angular-22- & Zoneless-Anwendungen',
          'Modularer Feature-State mit Entity-Normalisierung (ids-Array + entityMap)',
          'Asynchrone Stream-Integration über rxMethod ohne manuelle Subscriptions',
          'Wiederverwendbare Custom-Plugins über mehrere Feature-Teams hinweg',
        ],
        whenToAvoid: [
          'Strikte Enterprise-Vorgaben, die zwingend Redux-DevTools-Replay voraussetzen',
          'Winzige lokale Einzeiler-States, für die ein einfaches signal() ausreicht',
        ],
        codeSample: CODE_SAMPLES['signal-store'],
      },
      {
        key: 'global-store',
        name: 'NgRx Global Store + Effects',
        tagline: 'Klassisches Redux: ActionGroups, Feature Reducers, memoisierte Selectors und Effects.',
        badge: 'enterprise',
        bundleWeight: '~15-20 kB (@ngrx/store+effects)',
        reactivityModel: 'Action-getriebenes Redux',
        learningCurve: 'Steep',
        timeTravelSupport: 'Full Redux DevTools',
        whenToUse: [
          'Große Enterprise-Anwendungen mit mehreren verteilten Entwicklungsteams',
          'Geschäftskritische Finanz- oder Compliance-Workflows mit vollständigem Action-Audit',
          'Komplexe Feature-übergreifende Event-Choreografie und globaler Multi-Entity-Cache',
          'Strikte Architekturgrenzen mit vollständiger Entkopplung von UI und Seiteneffekten',
        ],
        whenToAvoid: [
          'Einfache CRUD-Anwendungen, in denen Redux-Boilerplate die Entwicklungsgeschwindigkeit bremst',
          'Performance-kritische Micro-Frontends mit Fokus auf minimale Bundle-Größe',
        ],
        codeSample: CODE_SAMPLES['global-store'],
      },
    ],
    matrix: {
      heading: 'Umfassende Architektur-Vergleichsmatrix',
      colDimension: 'Bewertungsdimension',
      colServiceSignals: 'Service + Signals',
      colServiceRxjs: 'Service + RxJS',
      colSignalStore: 'NgRx SignalStore',
      colGlobalStore: 'NgRx Global Store',
      rows: [
        {
          dimension: 'Reaktivitätsmodell',
          serviceSignals: 'Push-Pull Glitch-freie Signals',
          serviceRxjs: 'Push-Observable-Streams',
          signalStore: 'Push-Pull Signals + rxMethod',
          globalStore: 'Observable-Slices (oder toSignal)',
        },
        {
          dimension: 'Boilerplate-Aufwand',
          serviceSignals: 'Am geringsten (Kein Framework)',
          serviceRxjs: 'Niedrig–Mittel (Subjects)',
          signalStore: 'Niedrig (Deklarative Plugins)',
          globalStore: 'Hoch (Actions/Reducers/Effects)',
        },
        {
          dimension: 'Zoneless-Ergonomie',
          serviceSignals: 'Erstklassig nativ',
          serviceRxjs: 'Erfordert Async-Pipe / rxResource',
          signalStore: 'Erstklassig nativ',
          globalStore: 'Erfordert selectSignal / toSignal',
        },
        {
          dimension: 'Entity-Normalisierung',
          serviceSignals: 'Manuelles Objekt-Mapping',
          serviceRxjs: 'Manuelles Objekt-Mapping',
          signalStore: 'Integriertes withEntities()',
          globalStore: 'Integriertes @ngrx/entity',
        },
        {
          dimension: 'DevTools & Time-Travel',
          serviceSignals: 'Standard-Browser-DevTools',
          serviceRxjs: 'Konsolen-Logs / tap',
          signalStore: 'Eigene Signal-Plugins',
          globalStore: 'Volle Redux-DevTools-Extension',
        },
        {
          dimension: 'Bester Anwendungsfall',
          serviceSignals: 'Komponenten-UI / Formular-State',
          serviceRxjs: 'Echtzeit-Stream-Aggregation',
          signalStore: 'Modulare Features (Empfohlen)',
          globalStore: 'Teamübergreifender Enterprise-State',
        },
      ],
    },
    interview: {
      eyebrow: 'Senior-Developer- & Recruiter-Q&A',
      title: 'Wichtige Architekturfragen zum State Management',
      keyRuleLabel: 'Faustregel:',
      faqs: [
        {
          id: 'signals-vs-ngrx',
          question: 'Ersetzen Angular Signals in Angular 22 NgRx?',
          answer: 'Nein. Angular Signals sind ein feingranulares Reaktivitäts- und Change-Detection-Primitiv (sie lösen, wie die UI synchron ohne Zone.js aktualisiert wird). NgRx ist ein State-Architektur-Framework (es löst, wie State strukturiert, in O(1)-Wörterbüchern normalisiert, über Lazy-Features geteilt und über asynchrone Streams koordiniert wird). Beide ergänzen sich: NgRx stellt Signals für das Template bereit.',
          takeaway: 'Nutzen Sie Signals zur Datenbindung im Template; nutzen Sie NgRx zur Strukturierung, Normalisierung und Orchestrierung des State-Lebenszyklus.',
        },
        {
          id: 'anti-pattern',
          question: 'Wann gilt NgRx als Anti-Pattern oder Over-Engineering?',
          answer: 'NgRx ist ein Anti-Pattern für einfache CRUD-Apps mit unabhängigen Seiten, isolierten Formularen und ohne Feature-übergreifenden State. Actions, Reducers und Selectors nur für ein Modal-Flag oder ein 3-Felder-Formular zu schreiben, erzeugt unnötige Indirektion.',
          takeaway: 'Starten Sie mit einfachen Signal-Services oder Komponenten-State; wechseln Sie zu SignalStore, sobald State geteilt oder normalisiert gecacht werden muss.',
        },
        {
          id: 'signalstore-vs-global',
          question: 'Warum NgRx SignalStore gegenüber dem klassischen NgRx Global Store wählen?',
          answer: 'SignalStore reduziert Boilerplate um rund 80 % bei voller Typsicherheit und Unveränderlichkeit. Er benötigt keine Action-Typen oder Reducer-Switches, ist zu 100 % tree-shakeable, unterstützt modulare Plugins (withEntities, withComputed, withMethods) und bindet RxJS nahtlos über rxMethod ein.',
          takeaway: 'Für neue Angular-Features im Jahr 2026 ist SignalStore der empfohlene Standard.',
        },
        {
          id: 'optimistic-rollback',
          question: 'Wie setzt man optimistische UI-Updates mit Rollback in NgRx um?',
          answer: 'In SignalStore rufen Sie direkt bei der Nutzeraktion patchState(store, updateEntity(optimisticData)) auf. Die rxMethod startet danach den HTTP-Aufruf; schlägt dieser fehl, setzt der error-Callback von tapResponse den Zustand per patchState(store, updateEntity(previousSnapshot)) zurück und zeigt eine Fehlermeldung an.',
          takeaway: 'Sichern Sie vor optimistischen Mutationen immer den vorherigen Snapshot, um im Fehlerfall sofort zurückrollen zu können.',
        },
      ],
    },
  },
};
