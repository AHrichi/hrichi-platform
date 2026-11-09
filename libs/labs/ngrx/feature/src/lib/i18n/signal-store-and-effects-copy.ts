import type { SiteLanguage } from '@ah/shared/state';

export interface NgrxSignalStoreCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  focusAriaLabel: string;
  focusOptions: {
    all: string;
    concept: string;
    entities: string;
    rxMethod: string;
    signalState: string;
  };
  categories: {
    all: string;
    core: string;
    reactive: string;
    architectural: string;
  };
  metrics: {
    totalSkillsLabel: string;
    totalSkillsHint: string;
    avgMasteryLabel: string;
    avgMasteryHint: string;
    certifiedCountLabel: string;
    certifiedCountHint: string;
    lastSyncedLabel: string;
    lastSyncedInit: string;
    lastSyncedHint: string;
  };
  conceptCard: {
    badge: string;
    title: string;
    descriptionPart1: string;
    descriptionPart2: string;
    plugin1Desc: string;
    plugin2Desc: string;
    plugin3Desc: string;
    plugin4Desc: string;
    plugin5Desc: string;
    calloutStrong: string;
    calloutPart1: string;
    calloutPart2: string;
  };
  entitiesCard: {
    badge: string;
    title: string;
    descriptionPart1: string;
    descriptionPart2: string;
    descriptionPart3: string;
    addSkillBtn: string;
    syncingBtn: string;
    resetSyncBtn: string;
    verifiedBadge: string;
    boostTitle: string;
    boostBtn: string;
    emptySkills: string;
    naiveTag: string;
    naiveDescPart1: string;
    naiveDescPart2: string;
    normalizedTag: string;
    normalizedDescPart1: string;
    normalizedDescPart2: string;
    normalizedDescPart3: string;
  };
  rxMethodCard: {
    badge: string;
    title: string;
    description: string;
    searchLabel: string;
    searchPlaceholder: string;
    debugTitle: string;
    idsHeader: string;
    entityMapHeader: string;
    explainerStrong: string;
    explainerPart1: string;
    explainerPart2: string;
  };
  signalStateCard: {
    badge: string;
    title: string;
    description: string;
    inspectorModeLabel: string;
    deepInspectionEnabled: string;
    standardView: string;
    toggleInspectionBtn: string;
    interactionsLabel: string;
    snippetTitle: string;
  };
}

export interface NgrxEffectsCycleCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  focusAriaLabel: string;
  focusOptions: {
    all: string;
    simulation: string;
    operators: string;
    deadStream: string;
    timeline: string;
  };
  simulationCard: {
    badge: string;
    title: string;
    description: string;
    operatorConfigTitle: string;
    exhaustMapPill: string;
    switchMapPill: string;
    concatMapPill: string;
    mergeMapPill: string;
    outcomeConfigTitle: string;
    successPill: string;
    errorPill: string;
    effectInProgressBtn: string;
    dispatchLoginBtn: string;
    rapidFireTitle: string;
    rapidFireBtn: string;
    clearTimelineBtn: string;
    codePreviewTitle: string;
  };
  timelineCard: {
    badge: string;
    title: string;
    descriptionPart1: string;
    descriptionPart2: string;
    emptyTimeline: string;
    auditNoteStrong: string;
    auditNotePart1: string;
    auditNotePart2: string;
    auditNotePart3: string;
  };
  operatorsCard: {
    badge: string;
    title: string;
    exhaustMapDesc: string;
    switchMapDesc: string;
    concatMapDesc: string;
    mergeMapDesc: string;
  };
  deadStreamCard: {
    badge: string;
    title: string;
    descriptionPart1: string;
    descriptionPart2: string;
    descriptionPart3: string;
    fatalTag: string;
    safeTag: string;
  };
}

export interface SignalStoreAndEffectsBundle {
  signalStore: NgrxSignalStoreCopy;
  effectsCycle: NgrxEffectsCycleCopy;
}

export const SIGNAL_STORE_AND_EFFECTS_COPY: Record<
  SiteLanguage,
  SignalStoreAndEffectsBundle
> = {
  en: {
    signalStore: {
      eyebrow: '@ngrx/signals & Modern State',
      heading: 'Declarative SignalStore & Entity Normalization',
      lead: 'Explore functional signal composition with withEntities(), withComputed(), withMethods(), rxMethod() for reactive async flows, and withHooks().',
      focusAriaLabel: 'Focus on SignalStore features',
      focusOptions: {
        all: 'All SignalStore Features',
        concept: 'SignalStore Philosophy',
        entities: 'withEntities Normalization',
        rxMethod: 'rxMethod Stream Interop',
        signalState: 'signalState Local State',
      },
      categories: {
        all: 'All Categories',
        core: 'Core Angular',
        reactive: 'Reactive / NgRx',
        architectural: 'Architecture',
      },
      metrics: {
        totalSkillsLabel: 'Total Skills',
        totalSkillsHint: 'via withEntities (ids.length)',
        avgMasteryLabel: 'Avg Mastery',
        avgMasteryHint: 'withComputed auto-tracked',
        certifiedCountLabel: 'Certified Count',
        certifiedCountHint: 'filtered memoized signal',
        lastSyncedLabel: 'Last Synced',
        lastSyncedInit: 'Initializing...',
        lastSyncedHint: 'live rxMethod stream',
      },
      conceptCard: {
        badge: 'Architecture Overview',
        title: 'Why @ngrx/signals? The Modern 5-Plugin Architecture',
        descriptionPart1:
          'Traditional Redux requires 4 separate files per feature (Action, Reducer, Selector, Effect) with high indirection.',
        descriptionPart2:
          'replaces this with a functional, tree-shakeable pipeline that composes modular features into a strongly-typed store:',
        plugin1Desc: 'Immutable state signals',
        plugin2Desc: 'Normalized O(1) dictionary',
        plugin3Desc: 'Auto-tracked derivations',
        plugin4Desc: 'patchState & rxMethod',
        plugin5Desc: 'onInit & onDestroy',
        calloutStrong: 'The "Zero-Boilerplate" Rule:',
        calloutPart1:
          'SignalStore requires no action types, no reducer switch statements, and no selectors. Every state slice is automatically exposed as a direct signal (e.g.',
        calloutPart2:
          ') that triggers zoneless change detection with zero Zone.js overhead!',
      },
      entitiesCard: {
        badge: '1. Entity Management Plugin (withEntities)',
        title: 'Normalized Entities & Operations',
        descriptionPart1: 'maintains normalized state: an',
        descriptionPart2: 'array preserving order and an',
        descriptionPart3: 'for O(1) lookups.',
        addSkillBtn: '+ Add Custom Skill',
        syncingBtn: 'Syncing...',
        resetSyncBtn: 'Reset & Sync via rxMethod',
        verifiedBadge: 'Verified',
        boostTitle: 'Boost mastery by 5%',
        boostBtn: '▲ Boost',
        emptySkills: 'No skills match the current filters.',
        naiveTag: 'Naive Array: O(n) Bottleneck',
        naiveDescPart1:
          'Updating one item in an array requires iterating every element with',
        naiveDescPart2: '. At scale, this forces unnecessary re-allocations.',
        normalizedTag: 'Normalized: O(1) Lookups',
        normalizedDescPart1: 'maintains',
        normalizedDescPart2: '(order) and',
        normalizedDescPart3:
          '(instant key access). Lookups and updates are O(1)!',
      },
      rxMethodCard: {
        badge: '2. rxMethod & Reactive Query',
        title: 'RxJS Stream Interoperability',
        description:
          'bridges RxJS operators (cancellation, switchMap, debounceTime, tapResponse) directly into SignalStore methods while updating signals without manual subscriptions.',
        searchLabel: 'Live Filter Search:',
        searchPlaceholder: 'Filter skills (e.g. Signals, Zoneless)...',
        debugTitle: 'Normalized State Slices (Under the Hood):',
        idsHeader: 'ids: string[] (Order)',
        entityMapHeader: 'entityMap: Record<string, Entity>',
        explainerStrong: 'Why rxMethod() is Essential:',
        explainerPart1:
          'Standard RxJS subscriptions inside components risk memory leaks if not manually unsubscribed.',
        explainerPart2:
          'accepts a static argument, Signal, or Observable, connects to the injection context, and automatically manages the subscription lifecycle with cancellation support.',
      },
      signalStateCard: {
        badge: '3. signalState (Lightweight Local State)',
        title: 'Component-Level Micro Stores',
        description:
          'gives you deep signal state and patchability without creating a class or functional store. Ideal for dialogs, forms, and local component UI state.',
        inspectorModeLabel: 'Active Inspector Mode:',
        deepInspectionEnabled: 'Deep Inspection Enabled',
        standardView: 'Standard View',
        toggleInspectionBtn: 'Toggle Inspection Flag',
        interactionsLabel: 'Interactions:',
        snippetTitle: 'signalState snippet:',
      },
    },
    effectsCycle: {
      eyebrow: 'NgRx Effects & Async Pipelines',
      heading: 'Side-Effect Model & Concurrency Strategies',
      lead: 'Isolate impure asynchronous side-effects (HTTP, WebSockets, LocalStorage) from pure UI components with functional effects, ofType filtering, and tapResponse.',
      focusAriaLabel: 'Focus on NgRx Effects concepts',
      focusOptions: {
        all: 'All Effect Concepts',
        simulation: 'Simulation Runner',
        operators: 'Concurrency Flattening',
        deadStream: 'The Dead Stream Trap',
        timeline: 'Stream Timeline',
      },
      simulationCard: {
        badge: '1. Interactive Effect Runner',
        title: 'Simulate Async Authentication Flow',
        description:
          'Test how effects handle async network latency, success, and errors without ever breaking the component or killing the stream.',
        operatorConfigTitle: 'Concurrency Flattening Operator (4 Strategies):',
        exhaustMapPill: 'exhaustMap (Ignore rapid duplicates)',
        switchMapPill: 'switchMap (Cancel previous in-flight)',
        concatMapPill: 'concatMap (Queue sequentially)',
        mergeMapPill: 'mergeMap (Run in parallel)',
        outcomeConfigTitle: 'Outcome Simulation:',
        successPill: '200 Success',
        errorPill: '401 Unauthorized',
        effectInProgressBtn: 'Effect in Progress...',
        dispatchLoginBtn: 'Dispatch [Auth] Login',
        rapidFireTitle:
          'Dispatch 3 actions in rapid succession to test concurrency',
        rapidFireBtn: '🔥 Rapid-Fire 3 Actions',
        clearTimelineBtn: 'Clear Timeline',
        codePreviewTitle: 'Modern Functional Effect Definition:',
      },
      timelineCard: {
        badge: '2. Live Event Stream Log',
        title: 'Pipeline Trace & tapResponse Audit',
        descriptionPart1: 'Notice that when an HTTP call fails,',
        descriptionPart2:
          'catches the error and dispatches a failure action. The outer effect stream stays alive!',
        emptyTimeline:
          'No events yet. Click "Dispatch [Auth] Login" above to start the cycle.',
        auditNoteStrong: 'Why tapResponse instead of catchError?',
        auditNotePart1: 'Standard RxJS',
        auditNotePart2:
          'can accidentally complete the stream if not nested inside',
        auditNotePart3:
          'guarantees error handling isolation and enforces exhaustiveness for success and failure handlers.',
      },
      operatorsCard: {
        badge: '3. Concurrency Cheatsheet',
        title: 'Choosing the Right Operator',
        exhaustMapDesc:
          'Ignores new source emissions until current inner observable completes. Perfect for submit buttons, logins, and checkout actions to prevent double submissions.',
        switchMapDesc:
          'Unsubscribes from previous inner request when a new action arrives. Perfect for search/autocomplete filters where only the latest query matters.',
        concatMapDesc:
          'Buffers incoming actions and processes them sequentially in strict order. Perfect for queued file uploads or chronological transactions.',
        mergeMapDesc:
          'Executes all inner requests concurrently. Perfect for independent background syncs where ordering and duplicate prevention do not matter.',
      },
      deadStreamCard: {
        badge: 'Production Reliability',
        title: 'The "Dead Stream" Trap & Why tapResponse is Vital',
        descriptionPart1:
          'The #1 most common junior/intermediate bug in NgRx is putting',
        descriptionPart2: 'directly on the outer',
        descriptionPart3: 'stream instead of the inner HTTP observable.',
        fatalTag: '❌ Fatal: Outer catchError Kills Effect',
        safeTag: '✅ Production Safe: tapResponse',
      },
    },
  },
  fr: {
    signalStore: {
      eyebrow: '@ngrx/signals & État moderne',
      heading: 'SignalStore déclaratif & normalisation d’entités',
      lead: 'Explorez la composition fonctionnelle de signaux avec withEntities(), withComputed(), withMethods(), rxMethod() pour les flux asynchrones réactifs, et withHooks().',
      focusAriaLabel: 'Cibler les fonctionnalités SignalStore',
      focusOptions: {
        all: 'Tout SignalStore',
        concept: 'Philosophie SignalStore',
        entities: 'Normalisation withEntities',
        rxMethod: 'Interopérabilité rxMethod',
        signalState: 'État local signalState',
      },
      categories: {
        all: 'Toutes catégories',
        core: 'Cœur Angular',
        reactive: 'Réactif / NgRx',
        architectural: 'Architecture',
      },
      metrics: {
        totalSkillsLabel: 'Compétences totales',
        totalSkillsHint: 'via withEntities (ids.length)',
        avgMasteryLabel: 'Maîtrise moyenne',
        avgMasteryHint: 'withComputed auto-suivi',
        certifiedCountLabel: 'Certifiées',
        certifiedCountHint: 'signal mémoïsé filtré',
        lastSyncedLabel: 'Dernière synchro',
        lastSyncedInit: 'Initialisation...',
        lastSyncedHint: 'flux rxMethod en direct',
      },
      conceptCard: {
        badge: 'Vue d’ensemble architecturale',
        title: 'Pourquoi @ngrx/signals ? L’architecture moderne à 5 plugins',
        descriptionPart1:
          'Le Redux classique impose 4 fichiers distincts par fonctionnalité (Action, Reducer, Selector, Effect) avec une forte indirection.',
        descriptionPart2:
          'remplace cela par un pipeline fonctionnel et tree-shakeable qui compose des briques modulaires dans un store fortement typé :',
        plugin1Desc: 'Signaux d’état immuables',
        plugin2Desc: 'Dictionnaire normalisé O(1)',
        plugin3Desc: 'Dérivations auto-suivies',
        plugin4Desc: 'patchState & rxMethod',
        plugin5Desc: 'onInit & onDestroy',
        calloutStrong: 'La règle « Zéro Boilerplate » :',
        calloutPart1:
          'SignalStore ne nécessite ni types d’actions, ni switch de reducer, ni sélecteurs. Chaque tranche d’état est directement exposée sous forme de signal (ex.',
        calloutPart2:
          ') déclenchant la détection de changements sans zone.js !',
      },
      entitiesCard: {
        badge: '1. Plugin de gestion d’entités (withEntities)',
        title: 'Entités normalisées & opérations',
        descriptionPart1: 'maintient un état normalisé : un tableau',
        descriptionPart2: 'préservant l’ordre et un dictionnaire',
        descriptionPart3: 'pour des accès en O(1).',
        addSkillBtn: '+ Ajouter compétence',
        syncingBtn: 'Synchronisation...',
        resetSyncBtn: 'Réinitialiser & synchro rxMethod',
        verifiedBadge: 'Vérifié',
        boostTitle: 'Augmenter la maîtrise de 5 %',
        boostBtn: '▲ +5 %',
        emptySkills: 'Aucune compétence ne correspond aux filtres actuels.',
        naiveTag: 'Tableau naïf : goulot O(n)',
        naiveDescPart1:
          'Mettre à jour un élément dans un tableau impose d’itérer sur chaque entrée avec',
        naiveDescPart2:
          '. À grande échelle, cela provoque des réallocations inutiles.',
        normalizedTag: 'Normalisé : accès O(1)',
        normalizedDescPart1: 'maintient',
        normalizedDescPart2: '(ordre) et',
        normalizedDescPart3:
          '(accès clé instantané). Les lectures et mises à jour sont en O(1) !',
      },
      rxMethodCard: {
        badge: '2. rxMethod & requête réactive',
        title: 'Interopérabilité avec les flux RxJS',
        description:
          'relie les opérateurs RxJS (annulation, switchMap, debounceTime, tapResponse) directement aux méthodes du SignalStore tout en mettant à jour les signaux sans abonnement manuel.',
        searchLabel: 'Recherche et filtrage en direct :',
        searchPlaceholder: 'Filtrer les compétences (ex. Signals, Zoneless)...',
        debugTitle: 'Tranches d’état normalisées (sous le capot) :',
        idsHeader: 'ids: string[] (Ordre)',
        entityMapHeader: 'entityMap: Record<string, Entity>',
        explainerStrong: 'Pourquoi rxMethod() est essentiel :',
        explainerPart1:
          'Les abonnements RxJS classiques dans les composants risquent des fuites mémoire s’ils ne sont pas désabonnés.',
        explainerPart2:
          'accepte une valeur statique, un Signal ou un Observable, se lie au contexte d’injection et gère automatiquement le cycle de vie et l’annulation.',
      },
      signalStateCard: {
        badge: '3. signalState (État local léger)',
        title: 'Micro-stores au niveau composant',
        description:
          'offre un état signal profond et modifiable par patch sans créer de classe ou de store global. Idéal pour les modales, formulaires et états UI locaux.',
        inspectorModeLabel: 'Mode inspecteur actif :',
        deepInspectionEnabled: 'Inspection approfondie activée',
        standardView: 'Vue standard',
        toggleInspectionBtn: 'Basculer le mode d’inspection',
        interactionsLabel: 'Interactions :',
        snippetTitle: 'Extrait signalState :',
      },
    },
    effectsCycle: {
      eyebrow: 'NgRx Effects & Pipelines asynchrones',
      heading: 'Modèle d’effets de bord & stratégies de concurrence',
      lead: 'Isolez les effets de bord asynchrones impurs (HTTP, WebSockets, LocalStorage) des composants UI purs grâce aux functional effects, au filtrage ofType et à tapResponse.',
      focusAriaLabel: 'Cibler les concepts NgRx Effects',
      focusOptions: {
        all: 'Tous les concepts Effect',
        simulation: 'Simulateur',
        operators: 'Aplatissement & concurrence',
        deadStream: 'Piège du flux mort',
        timeline: 'Chronologie du flux',
      },
      simulationCard: {
        badge: '1. Exécuteur d’Effect interactif',
        title: 'Simuler un flux d’authentification asynchrone',
        description:
          'Testez comment les Effects gèrent la latence réseau, les succès et les erreurs sans jamais casser le composant ni interrompre le flux.',
        operatorConfigTitle:
          'Opérateur d’aplatissement de concurrence (4 stratégies) :',
        exhaustMapPill: 'exhaustMap (Ignorer les doublons rapides)',
        switchMapPill: 'switchMap (Annuler la requête précédente)',
        concatMapPill: 'concatMap (Mettre en file séquentielle)',
        mergeMapPill: 'mergeMap (Exécuter en parallèle)',
        outcomeConfigTitle: 'Simulation du résultat :',
        successPill: '200 Succès',
        errorPill: '401 Non autorisé',
        effectInProgressBtn: 'Effect en cours...',
        dispatchLoginBtn: 'Émettre [Auth] Login',
        rapidFireTitle:
          'Émettre 3 actions en rafale pour tester la concurrence',
        rapidFireBtn: '🔥 Rafale de 3 actions',
        clearTimelineBtn: 'Effacer le journal',
        codePreviewTitle: 'Définition moderne d’un Functional Effect :',
      },
      timelineCard: {
        badge: '2. Journal du flux d’événements en direct',
        title: 'Trace du pipeline & audit tapResponse',
        descriptionPart1: 'Notez que lorsqu’un appel HTTP échoue,',
        descriptionPart2:
          'intercepte l’erreur et émet une action d’échec. Le flux externe de l’Effect reste en vie !',
        emptyTimeline:
          'Aucun événement. Cliquez sur « Émettre [Auth] Login » ci-dessus pour démarrer.',
        auditNoteStrong: 'Pourquoi tapResponse plutôt que catchError ?',
        auditNotePart1: 'Un',
        auditNotePart2:
          'RxJS standard peut accidentellement compléter le flux principal s’il n’est pas imbriqué dans',
        auditNotePart3:
          'garantit l’isolation des erreurs et oblige à gérer explicitement succès et échec.',
      },
      operatorsCard: {
        badge: '3. Aide-mémoire de concurrence',
        title: 'Choisir le bon opérateur',
        exhaustMapDesc:
          'Ignore les nouvelles émissions tant que l’observable interne n’est pas terminé. Parfait pour les boutons de soumission, connexions et paiements afin d’éviter les doubles clics.',
        switchMapDesc:
          'Se désabonne de la requête précédente dès qu’une nouvelle action arrive. Idéal pour la recherche et l’autocomplétion où seule la dernière requête compte.',
        concatMapDesc:
          'Met les actions en file d’attente et les traite séquentiellement dans l’ordre strict. Idéal pour les envois de fichiers ou transactions chronologiques.',
        mergeMapDesc:
          'Exécute toutes les requêtes internes en parallèle. Adapté aux synchronisations indépendantes en arrière-plan.',
      },
      deadStreamCard: {
        badge: 'Fiabilité en production',
        title: 'Le piège du « flux mort » & pourquoi tapResponse est vital',
        descriptionPart1: 'Le bug NgRx le plus fréquent consiste à placer',
        descriptionPart2: 'directement sur le flux externe',
        descriptionPart3: 'au lieu de l’observable HTTP interne.',
        fatalTag: '❌ Fatal : catchError externe tue l’Effect',
        safeTag: '✅ Sûr en production : tapResponse',
      },
    },
  },
  ar: {
    signalStore: {
      eyebrow: '@ngrx/signals وإدارة الحالة الحديثة',
      heading: 'مخزن SignalStore التصريحي وتطبيع الكيانات',
      lead: 'استكشف تركيب الإشارات الوظيفي باستخدام withEntities() وwithComputed() وwithMethods() وrxMethod() للتدفقات غير المتزامنة التفاعلية وwithHooks().',
      focusAriaLabel: 'التركيز على ميزات SignalStore',
      focusOptions: {
        all: 'جميع ميزات SignalStore',
        concept: 'فلسفة SignalStore',
        entities: 'تطبيع withEntities',
        rxMethod: 'توافقية rxMethod',
        signalState: 'الحالة المحلية signalState',
      },
      categories: {
        all: 'جميع الفئات',
        core: 'نواة Angular',
        reactive: 'تفاعلي / NgRx',
        architectural: 'البنية المعمارية',
      },
      metrics: {
        totalSkillsLabel: 'إجمالي المهارات',
        totalSkillsHint: 'عبر withEntities (ids.length)',
        avgMasteryLabel: 'متوسط الإتقان',
        avgMasteryHint: 'متتبع تلقائيًا عبر withComputed',
        certifiedCountLabel: 'المهارات المعتمدة',
        certifiedCountHint: 'إشارة مفلترة ومخزنة مؤقتًا',
        lastSyncedLabel: 'آخر مزامنة',
        lastSyncedInit: 'جارٍ التهيئة...',
        lastSyncedHint: 'تدفق rxMethod مباشر',
      },
      conceptCard: {
        badge: 'نظرة عامة على البنية',
        title: 'لماذا @ngrx/signals؟ البنية الحديثة ذات الإضافات الخمس',
        descriptionPart1:
          'يتطلب Redux التقليدي 4 ملفات منفصلة لكل ميزة (Action وReducer وSelector وEffect) مع تعقيد غير مباشر.',
        descriptionPart2:
          'يستبدل ذلك بخط أنابيب وظيفي قابل للتشذيب (Tree-shakeable) يدمج الميزات المعيارية في مخزن محدد الأنواع بدقة:',
        plugin1Desc: 'إشارات حالة غير قابلة للتغيير',
        plugin2Desc: 'قاموس مطبّع بوقت وصول O(1)',
        plugin3Desc: 'قيم مشتقة متتبعة تلقائيًا',
        plugin4Desc: 'patchState وrxMethod',
        plugin5Desc: 'onInit وonDestroy',
        calloutStrong: 'قاعدة "صفر شيفرة نمطية" (Zero-Boilerplate):',
        calloutPart1:
          'لا يتطلب SignalStore أنواع إجراءات أو عبارات switch للمختزلات أو محددات. يتم كشف كل شريحة حالة تلقائيًا كإشارة مباشرة (مثل',
        calloutPart2: ') تُفعّل اكتشاف التغييرات دون الحاجة إلى Zone.js!',
      },
      entitiesCard: {
        badge: '1. إضافة إدارة الكيانات (withEntities)',
        title: 'الكيانات المطبّعة والعمليات عليها',
        descriptionPart1: 'يحتفظ بحالة مطبّعة: مصفوفة',
        descriptionPart2: 'لحفظ الترتيب وقاموس',
        descriptionPart3: 'للبحث الفوري بتعقيد O(1).',
        addSkillBtn: '+ إضافة مهارة مخصصة',
        syncingBtn: 'جارٍ المزامنة...',
        resetSyncBtn: 'إعادة ضبط ومزامنة عبر rxMethod',
        verifiedBadge: 'معتمد',
        boostTitle: 'زيادة الإتقان بنسبة 5%',
        boostBtn: '▲ تعزيز',
        emptySkills: 'لا توجد مهارات تطابق عوامل التصفية الحالية.',
        naiveTag: 'مصفوفة تقليدية: عنق زجاجة O(n)',
        naiveDescPart1:
          'تحديث عنصر واحد في مصفوفة يتطلب المرور على كل عنصر باستخدام',
        naiveDescPart2:
          '. في التطبيقات الكبيرة، يفرض ذلك إعادة تخصيص غير ضرورية للذاكرة.',
        normalizedTag: 'مطبّع: وصول فوري O(1)',
        normalizedDescPart1: 'يحتفظ بـ',
        normalizedDescPart2: '(للترتيب) و',
        normalizedDescPart3:
          '(وصول فوري بالمفتاح). عمليات البحث والتحديث تتم في O(1)!',
      },
      rxMethodCard: {
        badge: '2. rxMethod والاستعلام التفاعلي',
        title: 'التوافقية مع تدفقات RxJS',
        description:
          'يربط معاملات RxJS (الإلغاء، switchMap، debounceTime، tapResponse) مباشرة بدوال SignalStore مع تحديث الإشارات دون اشتراكات يدوية.',
        searchLabel: 'بحث وتصفية مباشرة:',
        searchPlaceholder: 'تصفية المهارات (مثل Signals، Zoneless)...',
        debugTitle: 'شرائح الحالة المطبّعة (خلف الكواليس):',
        idsHeader: 'ids: string[] (الترتيب)',
        entityMapHeader: 'entityMap: Record<string, Entity>',
        explainerStrong: 'لماذا يُعد rxMethod() ضروريًا:',
        explainerPart1:
          'الاشتراكات اليدوية في RxJS داخل المكونات قد تسبب تسربًا للذاكرة إذا لم يتم إلغاء الاشتراك يدويًا.',
        explainerPart2:
          'يقبل قيمة ثابتة أو إشارة (Signal) أو Observable، ويرتبط بسياق الحقن ويدير دورة حياة الاشتراك والإلغاء تلقائيًا.',
      },
      signalStateCard: {
        badge: '3. signalState (حالة محلية خفيفة)',
        title: 'مخازن مصغّرة على مستوى المكوّن',
        description:
          'يمنحك حالة إشارات عميقة وقابلة للتحديث الجزئي دون إنشاء صنف أو مخزن كامل. مثالي للنوافذ المنبثقة والنماذج وحالة واجهة المكوّن المحلية.',
        inspectorModeLabel: 'وضع الفحص النشط:',
        deepInspectionEnabled: 'الفحص العميق مفعّل',
        standardView: 'العرض القياسي',
        toggleInspectionBtn: 'تبديل راية الفحص',
        interactionsLabel: 'التفاعلات:',
        snippetTitle: 'مقتطف signalState:',
      },
    },
    effectsCycle: {
      eyebrow: 'تأثيرات NgRx وخطوط الأنابيب غير المتزامنة',
      heading: 'نموذج التأثيرات الجانبية واستراتيجيات التزامن',
      lead: 'اعزل التأثيرات الجانبية غير المتزامنة (HTTP وWebSockets وLocalStorage) عن مكونات الواجهة النقية باستخدام التأثيرات الوظيفية وتصفية ofType وtapResponse.',
      focusAriaLabel: 'التركيز على مفاهيم NgRx Effects',
      focusOptions: {
        all: 'جميع مفاهيم التأثيرات',
        simulation: 'مشغّل المحاكاة',
        operators: 'معاملات التزامن',
        deadStream: 'فخ التدفق الميت',
        timeline: 'الخط الزمني للتدفق',
      },
      simulationCard: {
        badge: '1. مشغّل التأثيرات التفاعلي',
        title: 'محاكاة تدفق مصادقة غير متزامن',
        description:
          'اختبر كيف تتعامل التأثيرات مع زمن انتقال الشبكة والنجاح والأخطاء دون تعطيل المكوّن أو إيقاف التدفق.',
        operatorConfigTitle: 'معامل تسطيح التزامن (4 استراتيجيات):',
        exhaustMapPill: 'exhaustMap (تجاهل التكرارات السريعة)',
        switchMapPill: 'switchMap (إلغاء الطلب السابق الجاري)',
        concatMapPill: 'concatMap (طابور متسلسل)',
        mergeMapPill: 'mergeMap (تشغيل متوازٍ)',
        outcomeConfigTitle: 'محاكاة النتيجة:',
        successPill: '200 نجاح',
        errorPill: '401 غير مصرّح',
        effectInProgressBtn: 'التأثير قيد التنفيذ...',
        dispatchLoginBtn: 'إرسال [Auth] Login',
        rapidFireTitle: 'إرسال 3 إجراءات متتالية بسرعة لاختبار التزامن',
        rapidFireBtn: '🔥 إطلاق سريع لـ 3 إجراءات',
        clearTimelineBtn: 'مسح الخط الزمني',
        codePreviewTitle: 'تعريف التأثير الوظيفي الحديث:',
      },
      timelineCard: {
        badge: '2. سجل تدفق الأحداث المباشر',
        title: 'تتبع خط الأنابيب وتدقيق tapResponse',
        descriptionPart1: 'لاحظ أنه عندما يفشل طلب HTTP، يقوم',
        descriptionPart2:
          'بالتقاط الخطأ وإرسال إجراء فشل، مما يبقي التدفق الخارجي للتأثير حيًا!',
        emptyTimeline:
          'لا توجد أحداث بعد. انقر على "إرسال [Auth] Login" أعلاه لبدء الدورة.',
        auditNoteStrong: 'لماذا tapResponse بدلًا من catchError؟',
        auditNotePart1: 'إن',
        auditNotePart2:
          'القياسي في RxJS قد ينهي التدفق الخارجي عن طريق الخطأ إذا لم يكن متداخلًا داخل',
        auditNotePart3:
          'يضمن عزل معالجة الأخطاء ويفرض التعامل الصريح مع حالتي النجاح والفشل.',
      },
      operatorsCard: {
        badge: '3. دليل معاملات التزامن السريع',
        title: 'اختيار المعامل المناسب',
        exhaustMapDesc:
          'يتجاهل الإجراءات الجديدة حتى يكتمل الطلب الداخلي الحالي. مثالي لأزرار الإرسال وتسجيل الدخول والدفع لمنع الإرسال المزدوج.',
        switchMapDesc:
          'يلغي الاشتراك في الطلب الداخلي السابق عند وصول إجراء جديد. مثالي للبحث التلقائي حيث تهم أحدث عبارة بحث فقط.',
        concatMapDesc:
          'يضع الإجراءات الواردة في طابور ويعالجها بالتسلسل الصارم. مثالي لرفع الملفات المتسلسل أو المعاملات المالية المرتبة زمنيًا.',
        mergeMapDesc:
          'ينفذ جميع الطلبات الداخلية بالتوازي. مثالي للمزامنة الخلفية المستقلة حيث لا يهم الترتيب.',
      },
      deadStreamCard: {
        badge: 'الموثوقية في بيئة الإنتاج',
        title: 'فخ "التدفق الميت" ولماذا يُعد tapResponse حيويًا',
        descriptionPart1: 'أشهر خطأ برمجي في NgRx هو وضع',
        descriptionPart2: 'مباشرة على التدفق الخارجي',
        descriptionPart3: 'بدلًا من وضعه داخل تدفق HTTP الداخلي.',
        fatalTag: '❌ خطأ قاتل: catchError الخارجي يقتل التأثير',
        safeTag: '✅ آمن للإنتاج: tapResponse',
      },
    },
  },
  it: {
    signalStore: {
      eyebrow: '@ngrx/signals & Stato Moderno',
      heading: 'SignalStore dichiarativo & normalizzazione delle entità',
      lead: 'Esplora la composizione funzionale di signal con withEntities(), withComputed(), withMethods(), rxMethod() per flussi asincroni reattivi e withHooks().',
      focusAriaLabel: 'Focalizzati sulle funzionalità di SignalStore',
      focusOptions: {
        all: 'Tutte le funzioni SignalStore',
        concept: 'Filosofia SignalStore',
        entities: 'Normalizzazione withEntities',
        rxMethod: 'Interop stream rxMethod',
        signalState: 'Stato locale signalState',
      },
      categories: {
        all: 'Tutte le categorie',
        core: 'Core Angular',
        reactive: 'Reattivo / NgRx',
        architectural: 'Architettura',
      },
      metrics: {
        totalSkillsLabel: 'Competenze totali',
        totalSkillsHint: 'via withEntities (ids.length)',
        avgMasteryLabel: 'Padronanza media',
        avgMasteryHint: 'withComputed auto-tracciato',
        certifiedCountLabel: 'Certificate',
        certifiedCountHint: 'signal memoizzato filtrato',
        lastSyncedLabel: 'Ultima sincr.',
        lastSyncedInit: 'Inizializzazione...',
        lastSyncedHint: 'stream rxMethod live',
      },
      conceptCard: {
        badge: 'Panoramica architetturale',
        title: 'Perché @ngrx/signals? La moderna architettura a 5 plugin',
        descriptionPart1:
          'Il Redux tradizionale richiede 4 file separati per feature (Action, Reducer, Selector, Effect) con elevata indirezione.',
        descriptionPart2:
          'sostituisce tutto ciò con una pipeline funzionale e tree-shakeable che compone funzionalità modulari in uno store fortemente tipizzato:',
        plugin1Desc: 'Signal di stato immutabili',
        plugin2Desc: 'Dizionario normalizzato O(1)',
        plugin3Desc: 'Derivazioni auto-tracciate',
        plugin4Desc: 'patchState & rxMethod',
        plugin5Desc: 'onInit & onDestroy',
        calloutStrong: 'La regola "Zero-Boilerplate":',
        calloutPart1:
          'SignalStore non richiede tipi di action, switch nei reducer o selector. Ogni slice di stato è esposta automaticamente come signal diretto (es.',
        calloutPart2:
          ') che attiva la change detection zoneless con zero overhead di Zone.js!',
      },
      entitiesCard: {
        badge: '1. Plugin gestione entità (withEntities)',
        title: 'Entità normalizzate & operazioni',
        descriptionPart1: 'mantiene uno stato normalizzato: un array',
        descriptionPart2: 'che preserva l’ordine e una mappa',
        descriptionPart3: 'per ricerche istantanee in O(1).',
        addSkillBtn: '+ Aggiungi competenza',
        syncingBtn: 'Sincronizzazione...',
        resetSyncBtn: 'Reset & Sync via rxMethod',
        verifiedBadge: 'Verificata',
        boostTitle: 'Aumenta padronanza del 5%',
        boostBtn: '▲ Boost',
        emptySkills: 'Nessuna competenza corrisponde ai filtri attuali.',
        naiveTag: 'Array naïf: collo di bottiglia O(n)',
        naiveDescPart1:
          'Aggiornare un elemento in un array richiede di iterare ogni elemento con',
        naiveDescPart2: '. Su larga scala ciò impone riallocazioni inutili.',
        normalizedTag: 'Normalizzato: ricerche O(1)',
        normalizedDescPart1: 'mantiene',
        normalizedDescPart2: '(ordine) ed',
        normalizedDescPart3:
          '(accesso chiave istantaneo). Ricerche e aggiornamenti sono O(1)!',
      },
      rxMethodCard: {
        badge: '2. rxMethod & query reattiva',
        title: 'Interoperabilità con gli stream RxJS',
        description:
          'collega gli operatori RxJS (cancellazione, switchMap, debounceTime, tapResponse) direttamente nei metodi del SignalStore aggiornando i signal senza sottoscrizioni manuali.',
        searchLabel: 'Ricerca filtro live:',
        searchPlaceholder: 'Filtra competenze (es. Signals, Zoneless)...',
        debugTitle: 'Slice di stato normalizzate (sotto il cofano):',
        idsHeader: 'ids: string[] (Ordine)',
        entityMapHeader: 'entityMap: Record<string, Entity>',
        explainerStrong: 'Perché rxMethod() è essenziale:',
        explainerPart1:
          'Le sottoscrizioni RxJS standard nei componenti rischiano memory leak se non vengono chiuse manualmente.',
        explainerPart2:
          'accetta un argomento statico, un Signal o un Observable, si collega al contesto di iniezione e gestisce automaticamente il ciclo di vita con supporto alla cancellazione.',
      },
      signalStateCard: {
        badge: '3. signalState (Stato locale leggero)',
        title: 'Micro-store a livello di componente',
        description:
          'offre uno stato signal profondo e aggiornabile con patchState senza creare una classe o uno store completo. Ideale per modali, form e stato UI locale.',
        inspectorModeLabel: 'Modalità Inspector attiva:',
        deepInspectionEnabled: 'Ispezione profonda attiva',
        standardView: 'Vista standard',
        toggleInspectionBtn: 'Attiva/disattiva flag ispezione',
        interactionsLabel: 'Interazioni:',
        snippetTitle: 'Snippet signalState:',
      },
    },
    effectsCycle: {
      eyebrow: 'NgRx Effects & Pipeline Asincrone',
      heading: 'Modello dei Side-Effect & strategie di concorrenza',
      lead: 'Isola i side-effect asincroni impuri (HTTP, WebSocket, LocalStorage) dai componenti UI puri con functional effects, filtro ofType e tapResponse.',
      focusAriaLabel: 'Focalizzati sui concetti di NgRx Effects',
      focusOptions: {
        all: 'Tutti i concetti Effect',
        simulation: 'Simulatore',
        operators: 'Appiattimento concorrenza',
        deadStream: 'Trappola Dead Stream',
        timeline: 'Timeline dello stream',
      },
      simulationCard: {
        badge: '1. Esecutore Effect interattivo',
        title: 'Simula flusso di autenticazione asincrono',
        description:
          'Verifica come gli Effect gestiscono latenza di rete, successi ed errori senza mai bloccare il componente o terminare lo stream.',
        operatorConfigTitle:
          'Operatore di appiattimento concorrenza (4 strategie):',
        exhaustMapPill: 'exhaustMap (Ignora duplicati rapidi)',
        switchMapPill: 'switchMap (Annulla richiesta in corso)',
        concatMapPill: 'concatMap (Accoda in sequenza)',
        mergeMapPill: 'mergeMap (Esegui in parallelo)',
        outcomeConfigTitle: 'Simulazione esito:',
        successPill: '200 Successo',
        errorPill: '401 Non autorizzato',
        effectInProgressBtn: 'Effect in corso...',
        dispatchLoginBtn: 'Invia [Auth] Login',
        rapidFireTitle:
          'Invia 3 action in rapida successione per testare la concorrenza',
        rapidFireBtn: '🔥 Raffica di 3 Action',
        clearTimelineBtn: 'Pulisci timeline',
        codePreviewTitle: 'Definizione moderna di Functional Effect:',
      },
      timelineCard: {
        badge: '2. Log live dello stream di eventi',
        title: 'Traccia pipeline & audit tapResponse',
        descriptionPart1: 'Nota che quando una chiamata HTTP fallisce,',
        descriptionPart2:
          'cattura l’errore ed emette una action di fallimento. Lo stream esterno dell’Effect resta vivo!',
        emptyTimeline:
          'Nessun evento. Clicca su "Invia [Auth] Login" sopra per avviare il ciclo.',
        auditNoteStrong: 'Perché tapResponse invece di catchError?',
        auditNotePart1: 'Il classico',
        auditNotePart2:
          'di RxJS può completare accidentalmente lo stream esterno se non è annidato dentro',
        auditNotePart3:
          'garantisce l’isolamento della gestione errori e impone la gestione esplicita di successo ed errore.',
      },
      operatorsCard: {
        badge: '3. Scheda di riferimento concorrenza',
        title: 'Scegliere l’operatore giusto',
        exhaustMapDesc:
          'Ignora nuove emissioni finché l’observable interno corrente non termina. Perfetto per pulsanti submit, login e checkout per prevenire doppi invii.',
        switchMapDesc:
          'Annulla la sottoscrizione alla richiesta precedente quando arriva una nuova action. Ideale per filtri di ricerca e autocomplete.',
        concatMapDesc:
          'Mette in coda le action in ingresso e le elabora in rigoroso ordine sequenziale. Perfetto per upload di file in coda o transazioni cronologiche.',
        mergeMapDesc:
          'Esegue tutte le richieste interne in parallelo. Ideale per sincronizzazioni indipendenti in background.',
      },
      deadStreamCard: {
        badge: 'Affidabilità in produzione',
        title: 'La trappola del "Dead Stream" & perché tapResponse è vitale',
        descriptionPart1:
          'Il bug #1 più comune in NgRx consiste nel posizionare',
        descriptionPart2: 'direttamente sullo stream esterno',
        descriptionPart3: 'anziché sull’observable HTTP interno.',
        fatalTag: '❌ Fatale: catchError esterno termina l’Effect',
        safeTag: '✅ Sicuro in produzione: tapResponse',
      },
    },
  },
  de: {
    signalStore: {
      eyebrow: '@ngrx/signals & Moderner State',
      heading: 'Deklarativer SignalStore & Entity-Normalisierung',
      lead: 'Erkunden Sie funktionale Signal-Komposition mit withEntities(), withComputed(), withMethods(), rxMethod() für reaktive asynchrone Abläufe und withHooks().',
      focusAriaLabel: 'Auf SignalStore-Funktionen fokussieren',
      focusOptions: {
        all: 'Alle SignalStore-Features',
        concept: 'SignalStore-Philosophie',
        entities: 'withEntities-Normalisierung',
        rxMethod: 'rxMethod-Stream-Interop',
        signalState: 'signalState Lokaler State',
      },
      categories: {
        all: 'Alle Kategorien',
        core: 'Angular Core',
        reactive: 'Reaktiv / NgRx',
        architectural: 'Architektur',
      },
      metrics: {
        totalSkillsLabel: 'Skills gesamt',
        totalSkillsHint: 'via withEntities (ids.length)',
        avgMasteryLabel: 'Ø Beherrschung',
        avgMasteryHint: 'withComputed automatisch verfolgt',
        certifiedCountLabel: 'Zertifiziert',
        certifiedCountHint: 'gefiltertes memoisiertes Signal',
        lastSyncedLabel: 'Letzter Sync',
        lastSyncedInit: 'Initialisiere...',
        lastSyncedHint: 'Live-rxMethod-Stream',
      },
      conceptCard: {
        badge: 'Architektur-Überblick',
        title: 'Warum @ngrx/signals? Die moderne 5-Plugin-Architektur',
        descriptionPart1:
          'Klassisches Redux erfordert 4 separate Dateien pro Feature (Action, Reducer, Selector, Effect) mit hoher Indirektion.',
        descriptionPart2:
          'ersetzt dies durch eine funktionale, tree-shakeable Pipeline, die modulare Features zu einem streng typisierten Store zusammensetzt:',
        plugin1Desc: 'Unveränderliche State-Signals',
        plugin2Desc: 'Normalisiertes O(1)-Wörterbuch',
        plugin3Desc: 'Automatisch verfolgte Ableitungen',
        plugin4Desc: 'patchState & rxMethod',
        plugin5Desc: 'onInit & onDestroy',
        calloutStrong: 'Die „Zero-Boilerplate“-Regel:',
        calloutPart1:
          'SignalStore benötigt keine Action-Typen, keine Reducer-Switch-Blöcke und keine Selectors. Jeder State-Slice wird automatisch als direktes Signal bereitgestellt (z. B.',
        calloutPart2:
          '), das Zoneless Change Detection ohne Zone.js-Overhead auslöst!',
      },
      entitiesCard: {
        badge: '1. Entity-Management-Plugin (withEntities)',
        title: 'Normalisierte Entitäten & Operationen',
        descriptionPart1: 'verwaltet normalisierten State: ein',
        descriptionPart2: '-Array für die Reihenfolge und eine',
        descriptionPart3: 'für O(1)-Zugriffe.',
        addSkillBtn: '+ Eigene Fähigkeit hinzufügen',
        syncingBtn: 'Synchronisiere...',
        resetSyncBtn: 'Reset & Sync via rxMethod',
        verifiedBadge: 'Verifiziert',
        boostTitle: 'Beherrschung um 5 % steigern',
        boostBtn: '▲ +5 %',
        emptySkills: 'Keine Fähigkeiten entsprechen den aktuellen Filtern.',
        naiveTag: 'Naives Array: O(n)-Engpass',
        naiveDescPart1:
          'Das Aktualisieren eines Elements im Array erfordert das Durchlaufen aller Elemente mit',
        naiveDescPart2:
          '. Bei großen Datenmengen führt dies zu unnötigen Neuallokationen.',
        normalizedTag: 'Normalisiert: O(1)-Zugriffe',
        normalizedDescPart1: 'verwaltet',
        normalizedDescPart2: '(Reihenfolge) und',
        normalizedDescPart3:
          '(sofortiger Schlüsselzugriff). Lese- und Schreibzugriffe erfolgen in O(1)!',
      },
      rxMethodCard: {
        badge: '2. rxMethod & Reaktive Abfrage',
        title: 'RxJS-Stream-Interoperabilität',
        description:
          'verbindet RxJS-Operatoren (Abbruch, switchMap, debounceTime, tapResponse) direkt mit SignalStore-Methoden und aktualisiert Signals ohne manuelle Subscriptions.',
        searchLabel: 'Live-Filtersuche:',
        searchPlaceholder: 'Skills filtern (z. B. Signals, Zoneless)...',
        debugTitle: 'Normalisierte State-Slices (unter der Haube):',
        idsHeader: 'ids: string[] (Reihenfolge)',
        entityMapHeader: 'entityMap: Record<string, Entity>',
        explainerStrong: 'Warum rxMethod() unverzichtbar ist:',
        explainerPart1:
          'Manuelle RxJS-Subscriptions in Komponenten bergen das Risiko von Memory Leaks, wenn sie nicht abgemeldet werden.',
        explainerPart2:
          'akzeptiert einen statischen Wert, ein Signal oder ein Observable, nutzt den Injection-Kontext und verwaltet den Subscription-Lebenszyklus inklusive Abbruch automatisch.',
      },
      signalStateCard: {
        badge: '3. signalState (Leichtgewichtiger lokaler State)',
        title: 'Komponenten-Mikro-Stores',
        description:
          'bietet tiefen Signal-State und Patchbarkeit ohne eigene Store-Klasse. Ideal für Dialoge, Formulare und lokalen Komponenten-UI-State.',
        inspectorModeLabel: 'Aktiver Inspektormodus:',
        deepInspectionEnabled: 'Tiefeninspektion aktiviert',
        standardView: 'Standardansicht',
        toggleInspectionBtn: 'Inspektions-Flag umschalten',
        interactionsLabel: 'Interaktionen:',
        snippetTitle: 'signalState-Codebeispiel:',
      },
    },
    effectsCycle: {
      eyebrow: 'NgRx Effects & Asynchrone Pipelines',
      heading: 'Side-Effect-Modell & Nebenläufigkeitsstrategien',
      lead: 'Isolieren Sie asynchrone Seiteneffekte (HTTP, WebSockets, LocalStorage) von reinen UI-Komponenten mit funktionalen Effects, ofType-Filterung und tapResponse.',
      focusAriaLabel: 'Auf NgRx-Effects-Konzepte fokussieren',
      focusOptions: {
        all: 'Alle Effect-Konzepte',
        simulation: 'Simulations-Runner',
        operators: 'Concurrency-Operatoren',
        deadStream: 'Die Dead-Stream-Falle',
        timeline: 'Stream-Timeline',
      },
      simulationCard: {
        badge: '1. Interaktiver Effect-Runner',
        title: 'Asynchronen Authentifizierungsfluss simulieren',
        description:
          'Testen Sie, wie Effects Netzwerklatenz, Erfolge und Fehler verarbeiten, ohne jemals die Komponente zu blockieren oder den Stream zu beenden.',
        operatorConfigTitle: 'Concurrency-Flattening-Operator (4 Strategien):',
        exhaustMapPill: 'exhaustMap (Schnelle Duplikate ignorieren)',
        switchMapPill: 'switchMap (Vorherigen Request abbrechen)',
        concatMapPill: 'concatMap (Sequenziell einreihen)',
        mergeMapPill: 'mergeMap (Parallel ausführen)',
        outcomeConfigTitle: 'Ergebnis-Simulation:',
        successPill: '200 Erfolg',
        errorPill: '401 Nicht autorisiert',
        effectInProgressBtn: 'Effect läuft...',
        dispatchLoginBtn: '[Auth] Login senden',
        rapidFireTitle:
          '3 Actions schnell hintereinander senden, um Nebenläufigkeit zu testen',
        rapidFireBtn: '🔥 3 Schnellfeuer-Actions',
        clearTimelineBtn: 'Timeline leeren',
        codePreviewTitle: 'Moderne funktionale Effect-Definition:',
      },
      timelineCard: {
        badge: '2. Live-Event-Stream-Protokoll',
        title: 'Pipeline-Trace & tapResponse-Audit',
        descriptionPart1:
          'Beachten Sie: Wenn ein HTTP-Aufruf fehlschlägt, fängt',
        descriptionPart2:
          'den Fehler ab und sendet eine Failure-Action. Der äußere Effect-Stream bleibt am Leben!',
        emptyTimeline:
          'Noch keine Events. Klicken Sie oben auf „[Auth] Login senden“, um den Zyklus zu starten.',
        auditNoteStrong: 'Warum tapResponse statt catchError?',
        auditNotePart1: 'Ein normales RxJS-',
        auditNotePart2:
          'kann versehentlich den Hauptstream beenden, wenn es nicht innerhalb von',
        auditNotePart3:
          'garantiert Fehlerisolierung und erzwingt die Behandlung von Erfolgs- und Fehlerfall.',
      },
      operatorsCard: {
        badge: '3. Concurrency-Spickzettel',
        title: 'Den richtigen Operator wählen',
        exhaustMapDesc:
          'Ignoriert neue Actions, bis das aktuelle innere Observable abgeschlossen ist. Perfekt für Submit-Buttons, Logins und Bezahlvorgänge gegen Doppelklicks.',
        switchMapDesc:
          'Bricht die vorherige innere Anfrage ab, sobald eine neue Action eintrifft. Ideal für Such- und Autocomplete-Filter.',
        concatMapDesc:
          'Reiht eingehende Actions in eine Warteschlange ein und arbeitet sie streng nacheinander ab. Perfekt für Datei-Uploads oder chronologische Transaktionen.',
        mergeMapDesc:
          'Führt alle inneren Anfragen parallel aus. Ideal für unabhängige Hintergrund-Synchronisationen.',
      },
      deadStreamCard: {
        badge: 'Produktionszuverlässigkeit',
        title: 'Die „Dead Stream“-Falle & warum tapResponse unverzichtbar ist',
        descriptionPart1: 'Der häufigste NgRx-Fehler besteht darin,',
        descriptionPart2: 'direkt auf dem äußeren',
        descriptionPart3:
          '-Stream statt auf dem inneren HTTP-Observable zu platzieren.',
        fatalTag: '❌ Fatal: Äußeres catchError beendet den Effect',
        safeTag: '✅ Produktionssicher: tapResponse',
      },
    },
  },
};
