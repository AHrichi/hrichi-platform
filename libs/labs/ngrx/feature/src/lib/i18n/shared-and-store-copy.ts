import type { SiteLanguage } from '@ah/shared/state';
import type { FlowStage } from '../shared/ui/state-flow-diagram/state-flow-diagram.component';

export interface NgrxNavigationCopy {
  ariaLabel: string;
  storeFlow: string;
  signalStore: string;
  effectsCycle: string;
  ngrxVsServices: string;
}

export interface NgrxUseCaseFocusCopy {
  defaultAriaLabel: string;
  focusViewLabel: string;
  focusedPrefix: string;
  showAll: string;
  showAllAriaLabel: string;
}

export interface NgrxStateFlowDiagramCopy {
  title: string;
  stages: Record<FlowStage, string>;
  nodes: {
    componentName: string;
    componentDesc: string;
    actionName: string;
    actionDesc: string;
    effectName: string;
    effectDesc: string;
    reducerName: string;
    reducerDesc: string;
    storeName: string;
    storeDesc: string;
    selectorName: string;
    selectorDesc: string;
  };
  arrows: {
    dispatch: string;
    stream: string;
    newState: string;
    slice: string;
  };
}

export interface NgrxTimeTravelPanelCopy {
  title: string;
  actionsRecorded: (count: number) => string;
  backBtn: string;
  backAriaLabel: string;
  snapshotIndicator: (current: number, total: number) => string;
  forwardBtn: string;
  forwardAriaLabel: string;
  latestBtn: string;
  snapshotStateTitle: (id: number) => string;
  timeTravellingBadge: string;
}

export interface NgrxStoreFlowCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  focusAriaLabel: string;
  focusOptions: {
    all: string;
    concept: string;
    actions: string;
    reducers: string;
    selectors: string;
    timeTravel: string;
  };
  conceptCard: {
    badge: string;
    title: string;
    descriptionPrefix: string;
    descriptionSuffix: string;
    pillar1Title: string;
    pillar1Desc: string;
    pillar2Title: string;
    pillar2Desc: string;
    pillar3Title: string;
    pillar3DescPrefix: string;
    pillar3DescSuffix: string;
    calloutStrong: string;
    calloutPart1: string;
    calloutEm: string;
    calloutPart2: string;
    calloutPart3: string;
    calloutPart4: string;
  };
  actionsCard: {
    badge: string;
    title: string;
    description: string;
    addBookBtn: string;
    applyCouponBtn: string;
    clearCartBtn: string;
    unrelatedActionBtn: string;
    hygieneTitle: string;
    hygienePart1: string;
    hygieneStrong: string;
    hygienePart2: string;
    hygienePart3: string;
    codePreviewTitle: string;
  };
  reducersCard: {
    badge: string;
    title: string;
    descriptionPrefix: string;
    descriptionSuffix: string;
    removeBtn: string;
    emptyCart: string;
    couponAppliedLabel: string;
    offSuffix: string;
    noteTitle: string;
    notePart1: string;
    notePart2: string;
    notePart3: string;
  };
  selectorsCard: {
    badge: string;
    title: string;
    description: string;
    itemsCountLabel: string;
    subtotalLabel: string;
    discountedTotalLabel: string;
    lastActionPrefix: string;
    cacheHitStrong: string;
    projectorExecutedStrong: string;
    projectorExecutionsLabel: string;
    cacheHitsLabel: string;
    tipText: string;
  };
}

export interface SharedAndStoreBundle {
  navigation: NgrxNavigationCopy;
  useCaseFocus: NgrxUseCaseFocusCopy;
  stateFlowDiagram: NgrxStateFlowDiagramCopy;
  timeTravelPanel: NgrxTimeTravelPanelCopy;
  storeFlow: NgrxStoreFlowCopy;
}

export const SHARED_AND_STORE_COPY: Record<SiteLanguage, SharedAndStoreBundle> = {
  en: {
    navigation: {
      ariaLabel: 'NgRx lab modules',
      storeFlow: 'Store Flow & Time-Travel',
      signalStore: 'SignalStore & Entities',
      effectsCycle: 'Effects & Async',
      ngrxVsServices: 'NgRx vs Services Guide',
    },
    useCaseFocus: {
      defaultAriaLabel: 'Filter displayed use case',
      focusViewLabel: 'Focus View:',
      focusedPrefix: 'Focused:',
      showAll: 'Show All',
      showAllAriaLabel: 'Show all use cases',
    },
    stateFlowDiagram: {
      title: 'NgRx Reactive Unidirectional Cycle',
      stages: {
        idle: 'Idle (Awaiting Action)',
        dispatch: 'Dispatching Action',
        effect: 'Intercepted by Effect (Async)',
        reducer: 'Pure State Transition',
        store: 'Store Tree Updated',
        selector: 'Emitting Memoized Slices',
        component: 'Component Re-rendered',
      },
      nodes: {
        componentName: 'Component',
        componentDesc: 'User Event',
        actionName: 'Action',
        actionDesc: 'Unique Event',
        effectName: 'Effect',
        effectDesc: 'Side-Effect / API',
        reducerName: 'Reducer',
        reducerDesc: 'Pure Transition',
        storeName: 'Store',
        storeDesc: 'Single Source',
        selectorName: 'Selector',
        selectorDesc: 'Memoized Cache',
      },
      arrows: {
        dispatch: 'dispatch()',
        stream: 'stream',
        newState: 'new state',
        slice: 'slice',
      },
    },
    timeTravelPanel: {
      title: 'Time-Travel State History',
      actionsRecorded: (count) => `${count} actions recorded`,
      backBtn: '◀ Back',
      backAriaLabel: 'Step backward one action',
      snapshotIndicator: (current, total) => `Snapshot ${current} / ${total}`,
      forwardBtn: 'Forward ▶',
      forwardAriaLabel: 'Step forward one action',
      latestBtn: 'Latest ⏭️',
      snapshotStateTitle: (id) => `Snapshot State (#${id})`,
      timeTravellingBadge: '⚠️ Time Travelling',
    },
    storeFlow: {
      eyebrow: 'NgRx Store Core',
      heading: 'Unidirectional Architecture & Selector Memoization',
      lead: 'Explore how Actions, pure Reducers, and memoized Selectors synchronize state with predictable immutability and time-travel auditability.',
      focusAriaLabel: 'Focus on specific NgRx Store concept',
      focusOptions: {
        all: 'All Concepts',
        concept: 'Unidirectional Flow Model',
        actions: 'Action Groups',
        reducers: 'Feature Reducers',
        selectors: 'Memoized Selectors',
        timeTravel: 'Time-Travel',
      },
      conceptCard: {
        badge: 'Core Architecture',
        title: 'The Redux Mental Model: The Bank Ledger Analogy',
        descriptionPrefix: 'In simple apps, developers mutate variables directly (',
        descriptionSuffix: '). In large enterprise apps, direct mutation creates hidden side effects, race conditions, and un-debuggable state.',
        pillar1Title: '1. Single Source of Truth',
        pillar1Desc: 'The entire application state is stored in a single immutable object tree inside the Store.',
        pillar2Title: '2. State is Read-Only',
        pillar2Desc: 'To change state, you cannot assign properties. You must issue an Action voucher capturing intent.',
        pillar3Title: '3. Pure Transitions',
        pillar3DescPrefix: 'Reducers are strictly pure functions:',
        pillar3DescSuffix: 'with zero side-effects.',
        calloutStrong: 'Why Immutability Matters:',
        calloutPart1: 'Because reducers return a',
        calloutEm: 'new state reference',
        calloutPart2: '(via object spread',
        calloutPart3: '), components and selectors can perform instant O(1) reference comparisons (',
        calloutPart4: ') rather than deeply checking thousands of nested properties!',
      },
      actionsCard: {
        badge: '1. Action Group (createActionGroup)',
        title: 'Dispatch Typed Actions',
        description: 'Actions represent unique events in the application lifecycle. They contain a type tag and a typed payload.',
        addBookBtn: '+ Add Book ($65)',
        applyCouponBtn: 'Apply 25% Coupon',
        clearCartBtn: 'Clear Cart',
        unrelatedActionBtn: 'Dispatch Unrelated Action',
        hygieneTitle: '⚡ Action Hygiene Rule: Events, Not Commands',
        hygienePart1: 'Name actions after',
        hygieneStrong: 'events that happened in the UI',
        hygienePart2: ', not commands (e.g.',
        hygienePart3: '). This makes Redux DevTools logs read like a chronological storyboard of user interactions.',
        codePreviewTitle: 'Action Definition Code:',
      },
      reducersCard: {
        badge: '2. Pure Reducer (createFeature)',
        title: 'Current Immutable State',
        descriptionPrefix: 'Reducers are pure functions:',
        descriptionSuffix: '. They never mutate state directly.',
        removeBtn: 'Remove',
        emptyCart: 'Cart is empty. Add items above to populate state.',
        couponAppliedLabel: 'Coupon Applied:',
        offSuffix: '% OFF',
        noteTitle: '🛡️ Pure Function Guarantees:',
        notePart1: 'Notice how the reducer never calls',
        notePart2: '. It always returns a new object',
        notePart3: '. This guarantees previous state snapshots remain intact for time-travel debugging!',
      },
      selectorsCard: {
        badge: '3. Memoized Selectors (createSelector)',
        title: 'Selector Projection & Cache Efficiency',
        description: 'Selectors compute derived slices. If their input arguments have not changed by reference, their projector is skipped and the cached value is returned instantly.',
        itemsCountLabel: 'Items Count',
        subtotalLabel: 'Subtotal',
        discountedTotalLabel: 'Discounted Total',
        lastActionPrefix: 'Last Action:',
        cacheHitStrong: 'CACHE HIT (Projector Skipped)',
        projectorExecutedStrong: 'PROJECTOR EXECUTED',
        projectorExecutionsLabel: 'Projector Executions:',
        cacheHitsLabel: 'Cache Hits (Skipped recomputation):',
        tipText: 'Tip: Clicking "Dispatch Unrelated Action" dispatches an event that does not touch the cart. Notice that cache hits increase while projector runs stay the same!',
      },
    },
  },
  fr: {
    navigation: {
      ariaLabel: 'Modules du labo NgRx',
      storeFlow: 'Flux Store & Voyage Temporel',
      signalStore: 'SignalStore & Entités',
      effectsCycle: 'Effects & Asynchrone',
      ngrxVsServices: 'Guide NgRx vs Services',
    },
    useCaseFocus: {
      defaultAriaLabel: 'Filtrer le cas d’usage affiché',
      focusViewLabel: 'Vue ciblée :',
      focusedPrefix: 'Ciblé :',
      showAll: 'Tout afficher',
      showAllAriaLabel: 'Afficher tous les cas d’usage',
    },
    stateFlowDiagram: {
      title: 'Cycle réactif unidirectionnel NgRx',
      stages: {
        idle: 'En attente (Prêt pour une action)',
        dispatch: 'Émission de l’action (Dispatch)',
        effect: 'Intercepté par l’Effect (Async)',
        reducer: 'Transition d’état pure',
        store: 'Arbre du Store mis à jour',
        selector: 'Émission des tranches mémoïsées',
        component: 'Composant rafraîchi',
      },
      nodes: {
        componentName: 'Composant',
        componentDesc: 'Événement UI',
        actionName: 'Action',
        actionDesc: 'Événement unique',
        effectName: 'Effect',
        effectDesc: 'Effet / API',
        reducerName: 'Reducer',
        reducerDesc: 'Transition pure',
        storeName: 'Store',
        storeDesc: 'Source unique',
        selectorName: 'Selector',
        selectorDesc: 'Cache mémoïsé',
      },
      arrows: {
        dispatch: 'dispatch()',
        stream: 'flux',
        newState: 'nouvel état',
        slice: 'tranche',
      },
    },
    timeTravelPanel: {
      title: 'Historique d’état (Time-Travel)',
      actionsRecorded: (count) => `${count} actions enregistrées`,
      backBtn: '◀ Précédent',
      backAriaLabel: 'Reculer d’une action',
      snapshotIndicator: (current, total) => `Instantané ${current} / ${total}`,
      forwardBtn: 'Suivant ▶',
      forwardAriaLabel: 'Avancer d’une action',
      latestBtn: 'Dernier ⏭️',
      snapshotStateTitle: (id) => `État de l’instantané (#${id})`,
      timeTravellingBadge: '⚠️ Voyage temporel actif',
    },
    storeFlow: {
      eyebrow: 'Cœur NgRx Store',
      heading: 'Architecture unidirectionnelle & mémoïsation des sélecteurs',
      lead: 'Explorez comment les Actions, Reducers purs et Selectors mémoïsés synchronisent l’état avec une immuabilité prévisible et un audit temporel complet.',
      focusAriaLabel: 'Cibler un concept NgRx Store',
      focusOptions: {
        all: 'Tous les concepts',
        concept: 'Flux unidirectionnel',
        actions: 'Groupes d’actions',
        reducers: 'Feature Reducers',
        selectors: 'Sélecteurs mémoïsés',
        timeTravel: 'Voyage temporel',
      },
      conceptCard: {
        badge: 'Architecture fondamentale',
        title: 'Le modèle mental Redux : l’analogie du grand livre bancaire',
        descriptionPrefix: 'Dans les petites applications, on mute directement les variables (',
        descriptionSuffix: '). À l’échelle entreprise, la mutation directe provoque des effets de bord cachés, des conditions de concurrence et un état impossible à déboguer.',
        pillar1Title: '1. Source unique de vérité',
        pillar1Desc: 'Tout l’état applicatif est stocké dans un arbre d’objets immuable unique au sein du Store.',
        pillar2Title: '2. État en lecture seule',
        pillar2Desc: 'Pour modifier l’état, impossible d’assigner des propriétés : il faut émettre une Action décrivant l’intention.',
        pillar3Title: '3. Transitions pures',
        pillar3DescPrefix: 'Les reducers sont des fonctions strictement pures :',
        pillar3DescSuffix: 'sans aucun effet de bord.',
        calloutStrong: 'Pourquoi l’immuabilité est cruciale :',
        calloutPart1: 'Comme les reducers retournent une',
        calloutEm: 'nouvelle référence d’état',
        calloutPart2: '(via l’opérateur spread',
        calloutPart3: '), les composants et sélecteurs effectuent des comparaisons de référence instantanées en O(1) (',
        calloutPart4: ') au lieu de parcourir des milliers de propriétés imbriquées !',
      },
      actionsCard: {
        badge: '1. Groupe d’actions (createActionGroup)',
        title: 'Émettre des actions typées',
        description: 'Les actions représentent des événements uniques du cycle de vie applicatif. Elles portent un type et une charge utile (payload) typée.',
        addBookBtn: '+ Ajouter livre (65 $)',
        applyCouponBtn: 'Appliquer coupon 25 %',
        clearCartBtn: 'Vider le panier',
        unrelatedActionBtn: 'Action non liée au panier',
        hygieneTitle: '⚡ Règle d’hygiène : des événements, pas des commandes',
        hygienePart1: 'Nommez les actions d’après les',
        hygieneStrong: 'événements survenus dans l’UI',
        hygienePart2: ', et non comme des ordres (ex.',
        hygienePart3: '). Ainsi, le journal Redux DevTools se lit comme un récit chronologique des interactions utilisateur.',
        codePreviewTitle: 'Code de définition des actions :',
      },
      reducersCard: {
        badge: '2. Reducer pur (createFeature)',
        title: 'État immuable actuel',
        descriptionPrefix: 'Les reducers sont des fonctions pures :',
        descriptionSuffix: '. Ils ne mutent jamais l’état en place.',
        removeBtn: 'Retirer',
        emptyCart: 'Le panier est vide. Ajoutez des articles ci-dessus.',
        couponAppliedLabel: 'Coupon appliqué :',
        offSuffix: '% DE RÉDUCTION',
        noteTitle: '🛡️ Garanties des fonctions pures :',
        notePart1: 'Notez que le reducer n’appelle jamais',
        notePart2: '. Il retourne toujours un nouvel objet',
        notePart3: '. Cela garantit que les instantanés précédents restent intacts pour le débogage temporel !',
      },
      selectorsCard: {
        badge: '3. Sélecteurs mémoïsés (createSelector)',
        title: 'Projection & efficacité du cache',
        description: 'Les sélecteurs calculent des tranches dérivées. Si leurs entrées n’ont pas changé par référence, le calcul est ignoré et la valeur en cache est renvoyée instantanément.',
        itemsCountLabel: 'Nombre d’articles',
        subtotalLabel: 'Sous-total',
        discountedTotalLabel: 'Total remisé',
        lastActionPrefix: 'Dernière action :',
        cacheHitStrong: 'CACHE HIT (Calcul évité)',
        projectorExecutedStrong: 'PROJECTEUR EXÉCUTÉ',
        projectorExecutionsLabel: 'Exécutions du projecteur :',
        cacheHitsLabel: 'Succès du cache (Calculs évités) :',
        tipText: 'Astuce : Cliquer sur « Action non liée au panier » émet un événement qui ne touche pas au panier. Observez que les succès du cache augmentent alors que les exécutions du projecteur restent stables !',
      },
    },
  },
  ar: {
    navigation: {
      ariaLabel: 'وحدات مختبر NgRx',
      storeFlow: 'تدفق المخزن والسفر عبر الزمن',
      signalStore: 'SignalStore والكيانات',
      effectsCycle: 'التأثيرات والعمليات غير المتزامنة',
      ngrxVsServices: 'دليل مقارنة NgRx والخدمات',
    },
    useCaseFocus: {
      defaultAriaLabel: 'تصفية حالة الاستخدام المعروضة',
      focusViewLabel: 'عرض التركيز:',
      focusedPrefix: 'التركيز:',
      showAll: 'عرض الكل',
      showAllAriaLabel: 'عرض جميع حالات الاستخدام',
    },
    stateFlowDiagram: {
      title: 'الدورة التفاعلية أحادية الاتجاه في NgRx',
      stages: {
        idle: 'خامل (بانتظار إجراء)',
        dispatch: 'إرسال الإجراء (Dispatch)',
        effect: 'اعتراض بواسطة التأثير (غير متزامن)',
        reducer: 'انتقال حالة نقي (Pure)',
        store: 'تم تحديث شجرة المخزن',
        selector: 'إصدار الشرائح المخزنة مؤقتًا',
        component: 'إعادة تصيير المكوّن',
      },
      nodes: {
        componentName: 'المكوّن',
        componentDesc: 'حدث المستخدم',
        actionName: 'الإجراء',
        actionDesc: 'حدث فريد',
        effectName: 'التأثير',
        effectDesc: 'تأثير جانبي / API',
        reducerName: 'المختزل',
        reducerDesc: 'انتقال نقي',
        storeName: 'المخزن',
        storeDesc: 'مصدر وحيد',
        selectorName: 'المحدد',
        selectorDesc: 'ذاكرة مخبأة',
      },
      arrows: {
        dispatch: 'dispatch()',
        stream: 'تدفق',
        newState: 'حالة جديدة',
        slice: 'شريحة',
      },
    },
    timeTravelPanel: {
      title: 'سجل الحالة والسفر عبر الزمن',
      actionsRecorded: (count) => `تم تسجيل ${count} إجراءات`,
      backBtn: '▶ رجوع',
      backAriaLabel: 'الرجوع خطوة واحدة للخلف',
      snapshotIndicator: (current, total) => `لقطة ${current} / ${total}`,
      forwardBtn: 'تقدم ◀',
      forwardAriaLabel: 'التقدم خطوة واحدة للأمام',
      latestBtn: 'الأحدث ⏮️',
      snapshotStateTitle: (id) => `حالة اللقطة (#${id})`,
      timeTravellingBadge: '⚠️ وضع السفر عبر الزمن',
    },
    storeFlow: {
      eyebrow: 'نواة NgRx Store',
      heading: 'البنية أحادية الاتجاه والتخزين المؤقت للمحددات',
      lead: 'استكشف كيف تعمل الإجراءات والمختزلات النقية والمحددات المخزنة مؤقتًا على مزامنة الحالة مع ثبات متوقع وقابلية تدقيق عبر الزمن.',
      focusAriaLabel: 'التركيز على مفهوم محدد في NgRx Store',
      focusOptions: {
        all: 'جميع المفاهيم',
        concept: 'نموذج التدفق أحادي الاتجاه',
        actions: 'مجموعات الإجراءات',
        reducers: 'مختزلات الميزات',
        selectors: 'المحددات المخزنة مؤقتًا',
        timeTravel: 'السفر عبر الزمن',
      },
      conceptCard: {
        badge: 'البنية الأساسية',
        title: 'النموذج الذهني لـ Redux: تشبيه دفتر الأستاذ البنكي',
        descriptionPrefix: 'في التطبيقات البسيطة يغيّر المطورون المتغيرات مباشرة (',
        descriptionSuffix: '). أما في تطبيقات المؤسسات الكبيرة، فإن التعديل المباشر يولد تأثيرات جانبية خفية وحالات تسابق يصعب تتبعها.',
        pillar1Title: '1. مصدر وحيد للحقيقة',
        pillar1Desc: 'يتم تخزين حالة التطبيق بالكامل في شجرة كائنات واحدة غير قابلة للتغيير داخل المخزن (Store).',
        pillar2Title: '2. الحالة للقراءة فقط',
        pillar2Desc: 'لتغيير الحالة لا يمكنك إسناد الخصائص مباشرة، بل يجب إصدار إجراء (Action) يوثّق النية.',
        pillar3Title: '3. انتقالات نقية',
        pillar3DescPrefix: 'المختزلات (Reducers) هي دوال نقية تمامًا:',
        pillar3DescSuffix: 'بدون أي تأثيرات جانبية.',
        calloutStrong: 'لماذا يُعد عدم القابلية للتغيير مهمًا:',
        calloutPart1: 'لأن المختزلات تُرجع',
        calloutEm: 'مرجع حالة جديد',
        calloutPart2: '(عبر تفكيك الكائن',
        calloutPart3: ')، يمكن للمكونات والمحددات إجراء مقارنات مرجعية فورية بتعقيد O(1) (',
        calloutPart4: ') بدلًا من الفحص العميق لآلاف الخصائص المتداخلة!',
      },
      actionsCard: {
        badge: '1. مجموعة الإجراءات (createActionGroup)',
        title: 'إرسال إجراءات ذات أنواع محددة',
        description: 'تمثل الإجراءات أحداثًا فريدة في دورة حياة التطبيق، وتحتوي على وسم النوع وحمولة بيانات (Payload) محددة النوع.',
        addBookBtn: '+ إضافة كتاب ($65)',
        applyCouponBtn: 'تطبيق قسيمة 25%',
        clearCartBtn: 'إفراغ السلة',
        unrelatedActionBtn: 'إرسال إجراء غير مرتبط',
        hygieneTitle: '⚡ قاعدة صياغة الإجراءات: أحداث وليست أوامر',
        hygienePart1: 'سمِّ الإجراءات باسم',
        hygieneStrong: 'الأحداث التي وقعت في واجهة المستخدم',
        hygienePart2: '، وليس كأوامر مباشرة (مثل',
        hygienePart3: '). هذا يجعل سجلات Redux DevTools تُقرأ كقصة زمنية واضحة لتفاعلات المستخدم.',
        codePreviewTitle: 'كود تعريف الإجراءات:',
      },
      reducersCard: {
        badge: '2. المختزل النقي (createFeature)',
        title: 'الحالة الحالية غير القابلة للتغيير',
        descriptionPrefix: 'المختزلات هي دوال نقية:',
        descriptionSuffix: '. لا تقوم بتعديل الحالة مباشرة أبدًا.',
        removeBtn: 'حذف',
        emptyCart: 'السلة فارغة. أضف عناصر من الأعلى لتعبئة الحالة.',
        couponAppliedLabel: 'تم تطبيق القسيمة:',
        offSuffix: '% خصم',
        noteTitle: '🛡️ ضمانات الدالة النقية:',
        notePart1: 'لاحظ أن المختزل لا يستدعي أبدًا',
        notePart2: '. بل يُرجع دائمًا كائنًا جديدًا',
        notePart3: '. وهذا يضمن بقاء لقطات الحالة السابقة سليمة لتصحيح الأخطاء عبر الزمن!',
      },
      selectorsCard: {
        badge: '3. المحددات المخزنة مؤقتًا (createSelector)',
        title: 'إسقاط المحددات وكفاءة الذاكرة المؤقتة',
        description: 'تحسب المحددات شرائح مشتقة من الحالة. إذا لم تتغير مدخلاتها بالمرجع، يتم تخطي دالة الإسقاط وإرجاع القيمة المخزنة مؤقتًا فورًا.',
        itemsCountLabel: 'عدد العناصر',
        subtotalLabel: 'المجموع الفرعي',
        discountedTotalLabel: 'الإجمالي بعد الخصم',
        lastActionPrefix: 'آخر إجراء:',
        cacheHitStrong: 'إصابة الذاكرة المؤقتة (تم تخطي الحساب)',
        projectorExecutedStrong: 'تم تنفيذ دالة الإسقاط',
        projectorExecutionsLabel: 'مرات تنفيذ الإسقاط:',
        cacheHitsLabel: 'إصابات الذاكرة المؤقتة (حسابات متخطاة):',
        tipText: 'نصيحة: النقر على "إرسال إجراء غير مرتبط" يرسل حدثًا لا يمس السلة. لاحظ زيادة إصابات الذاكرة المؤقتة بينما يظل عدد مرات تنفيذ الإسقاط ثابتًا!',
      },
    },
  },
  it: {
    navigation: {
      ariaLabel: 'Moduli del laboratorio NgRx',
      storeFlow: 'Flusso Store & Time-Travel',
      signalStore: 'SignalStore & Entità',
      effectsCycle: 'Effects & Asincrono',
      ngrxVsServices: 'Guida NgRx vs Servizi',
    },
    useCaseFocus: {
      defaultAriaLabel: 'Filtra il caso d’uso visualizzato',
      focusViewLabel: 'Vista focalizzata:',
      focusedPrefix: 'Focus:',
      showAll: 'Mostra tutto',
      showAllAriaLabel: 'Mostra tutti i casi d’uso',
    },
    stateFlowDiagram: {
      title: 'Ciclo reattivo unidirezionale NgRx',
      stages: {
        idle: 'Inattivo (In attesa di Action)',
        dispatch: 'Invio Action (Dispatch)',
        effect: 'Intercettato da Effect (Async)',
        reducer: 'Transizione di stato pura',
        store: 'Albero dello Store aggiornato',
        selector: 'Emissione slice memoizzate',
        component: 'Componente ri-renderizzato',
      },
      nodes: {
        componentName: 'Componente',
        componentDesc: 'Evento utente',
        actionName: 'Action',
        actionDesc: 'Evento unico',
        effectName: 'Effect',
        effectDesc: 'Side-Effect / API',
        reducerName: 'Reducer',
        reducerDesc: 'Transizione pura',
        storeName: 'Store',
        storeDesc: 'Fonte unica',
        selectorName: 'Selector',
        selectorDesc: 'Cache memoizzata',
      },
      arrows: {
        dispatch: 'dispatch()',
        stream: 'stream',
        newState: 'nuovo stato',
        slice: 'slice',
      },
    },
    timeTravelPanel: {
      title: 'Cronologia di stato Time-Travel',
      actionsRecorded: (count) => `${count} azioni registrate`,
      backBtn: '◀ Indietro',
      backAriaLabel: 'Torna indietro di un’azione',
      snapshotIndicator: (current, total) => `Snapshot ${current} / ${total}`,
      forwardBtn: 'Avanti ▶',
      forwardAriaLabel: 'Avanza di un’azione',
      latestBtn: 'Ultimo ⏭️',
      snapshotStateTitle: (id) => `Stato Snapshot (#${id})`,
      timeTravellingBadge: '⚠️ Time-Travel attivo',
    },
    storeFlow: {
      eyebrow: 'Fondamenti NgRx Store',
      heading: 'Architettura unidirezionale & memoizzazione dei Selector',
      lead: 'Scopri come Action, Reducer puri e Selector memoizzati sincronizzano lo stato con immutabilità prevedibile e auditabilità time-travel.',
      focusAriaLabel: 'Focalizzati su uno specifico concetto NgRx Store',
      focusOptions: {
        all: 'Tutti i concetti',
        concept: 'Modello unidirezionale',
        actions: 'Gruppi di Action',
        reducers: 'Feature Reducer',
        selectors: 'Selector memoizzati',
        timeTravel: 'Time-Travel',
      },
      conceptCard: {
        badge: 'Architettura Core',
        title: 'Il modello mentale Redux: l’analogia del libro mastro bancario',
        descriptionPrefix: 'Nelle app semplici gli sviluppatori mutano le variabili direttamente (',
        descriptionSuffix: '). Nelle grandi app enterprise, la mutazione diretta genera side-effect nascosti, race condition e stati impossibili da debuggare.',
        pillar1Title: '1. Unica fonte di verità',
        pillar1Desc: 'L’intero stato applicativo è conservato in un singolo albero di oggetti immutabile dentro lo Store.',
        pillar2Title: '2. Lo stato è in sola lettura',
        pillar2Desc: 'Per modificare lo stato non puoi assegnare proprietà: devi emettere una Action che descrive l’intento.',
        pillar3Title: '3. Transizioni pure',
        pillar3DescPrefix: 'I reducer sono funzioni strettamente pure:',
        pillar3DescSuffix: 'con zero effetti collaterali.',
        calloutStrong: 'Perché l’immutabilità è fondamentale:',
        calloutPart1: 'Poiché i reducer restituiscono un',
        calloutEm: 'nuovo riferimento di stato',
        calloutPart2: '(tramite object spread',
        calloutPart3: '), componenti e selector possono eseguire confronti di riferimento istantanei in O(1) (',
        calloutPart4: ') anziché ispezionare in profondità migliaia di proprietà annidate!',
      },
      actionsCard: {
        badge: '1. Action Group (createActionGroup)',
        title: 'Invia Action tipizzate',
        description: 'Le Action rappresentano eventi unici nel ciclo di vita dell’applicazione. Contengono un tag di tipo e un payload tipizzato.',
        addBookBtn: '+ Aggiungi libro ($65)',
        applyCouponBtn: 'Applica coupon 25%',
        clearCartBtn: 'Svuota carrello',
        unrelatedActionBtn: 'Invia Action non correlata',
        hygieneTitle: '⚡ Regola d’igiene delle Action: eventi, non comandi',
        hygienePart1: 'Dai alle Action il nome degli',
        hygieneStrong: 'eventi accaduti nella UI',
        hygienePart2: ', non di comandi imperativi (es.',
        hygienePart3: '). Così i log di Redux DevTools si leggono come uno storyboard cronologico delle interazioni utente.',
        codePreviewTitle: 'Codice definizione Action:',
      },
      reducersCard: {
        badge: '2. Reducer puro (createFeature)',
        title: 'Stato immutabile corrente',
        descriptionPrefix: 'I reducer sono funzioni pure:',
        descriptionSuffix: '. Non mutano mai lo stato direttamente.',
        removeBtn: 'Rimuovi',
        emptyCart: 'Il carrello è vuoto. Aggiungi articoli sopra per popolare lo stato.',
        couponAppliedLabel: 'Coupon applicato:',
        offSuffix: '% SCONTO',
        noteTitle: '🛡️ Garanzie delle funzioni pure:',
        notePart1: 'Nota come il reducer non chiami mai',
        notePart2: '. Restituisce sempre un nuovo oggetto',
        notePart3: '. Questo garantisce che gli snapshot precedenti restino intatti per il debugging time-travel!',
      },
      selectorsCard: {
        badge: '3. Selector memoizzati (createSelector)',
        title: 'Proiezione Selector & efficienza della cache',
        description: 'I selector calcolano slice derivate. Se i loro argomenti di input non sono cambiati per riferimento, il proiettore viene saltato e il valore in cache viene restituito all’istante.',
        itemsCountLabel: 'Numero articoli',
        subtotalLabel: 'Subtotale',
        discountedTotalLabel: 'Totale scontato',
        lastActionPrefix: 'Ultima Action:',
        cacheHitStrong: 'CACHE HIT (Proiettore saltato)',
        projectorExecutedStrong: 'PROIETTORE ESEGUITO',
        projectorExecutionsLabel: 'Esecuzioni del proiettore:',
        cacheHitsLabel: 'Cache Hit (Ricalcoli evitati):',
        tipText: 'Consiglio: Cliccando su "Invia Action non correlata" viene emesso un evento che non tocca il carrello. Nota come i cache hit aumentano mentre le esecuzioni del proiettore restano invariate!',
      },
    },
  },
  de: {
    navigation: {
      ariaLabel: 'NgRx-Labor-Module',
      storeFlow: 'Store-Fluss & Zeitreise',
      signalStore: 'SignalStore & Entitäten',
      effectsCycle: 'Effects & Asynchronität',
      ngrxVsServices: 'NgRx vs. Services Leitfaden',
    },
    useCaseFocus: {
      defaultAriaLabel: 'Angezeigten Anwendungsfall filtern',
      focusViewLabel: 'Fokus-Ansicht:',
      focusedPrefix: 'Fokus:',
      showAll: 'Alle anzeigen',
      showAllAriaLabel: 'Alle Anwendungsfälle anzeigen',
    },
    stateFlowDiagram: {
      title: 'Reaktiver unidirektionaler NgRx-Zyklus',
      stages: {
        idle: 'Bereit (Wartet auf Action)',
        dispatch: 'Action wird gesendet (Dispatch)',
        effect: 'Vom Effect abgefangen (Async)',
        reducer: 'Reiner Zustandsübergang',
        store: 'Store-Baum aktualisiert',
        selector: 'Memoisierte Slices emittiert',
        component: 'Komponente neu gerendert',
      },
      nodes: {
        componentName: 'Komponente',
        componentDesc: 'Nutzer-Event',
        actionName: 'Action',
        actionDesc: 'Eindeutiges Event',
        effectName: 'Effect',
        effectDesc: 'Side-Effect / API',
        reducerName: 'Reducer',
        reducerDesc: 'Reiner Übergang',
        storeName: 'Store',
        storeDesc: 'Single Source',
        selectorName: 'Selector',
        selectorDesc: 'Memoisierter Cache',
      },
      arrows: {
        dispatch: 'dispatch()',
        stream: 'Stream',
        newState: 'neuer State',
        slice: 'Slice',
      },
    },
    timeTravelPanel: {
      title: 'Time-Travel-Zustandshistorie',
      actionsRecorded: (count) => `${count} Actions aufgezeichnet`,
      backBtn: '◀ Zurück',
      backAriaLabel: 'Eine Action zurückgehen',
      snapshotIndicator: (current, total) => `Snapshot ${current} / ${total}`,
      forwardBtn: 'Vor ▶',
      forwardAriaLabel: 'Eine Action vorgehen',
      latestBtn: 'Neuester ⏭️',
      snapshotStateTitle: (id) => `Snapshot-Zustand (#${id})`,
      timeTravellingBadge: '⚠️ Zeitreise aktiv',
    },
    storeFlow: {
      eyebrow: 'NgRx Store Kernkonzepte',
      heading: 'Unidirektionale Architektur & Selector-Memoisierung',
      lead: 'Erleben Sie, wie Actions, reine Reducers und memoisierte Selectors den Zustand mit vorhersagbarer Unveränderlichkeit und Time-Travel-Auditierbarkeit synchronisieren.',
      focusAriaLabel: 'Auf bestimmtes NgRx-Store-Konzept fokussieren',
      focusOptions: {
        all: 'Alle Konzepte',
        concept: 'Unidirektionales Flussmodell',
        actions: 'Action-Gruppen',
        reducers: 'Feature-Reducers',
        selectors: 'Memoisierte Selectors',
        timeTravel: 'Time-Travel',
      },
      conceptCard: {
        badge: 'Kernarchitektur',
        title: 'Das mentale Redux-Modell: Die Bankbuch-Analogie',
        descriptionPrefix: 'In einfachen Apps mutieren Entwickler Variablen direkt (',
        descriptionSuffix: '). In großen Enterprise-Apps führt direkte Mutation zu versteckten Seiteneffekten, Race Conditions und nicht debuggbarem State.',
        pillar1Title: '1. Single Source of Truth',
        pillar1Desc: 'Der gesamte Anwendungszustand wird in einem einzigen unveränderlichen Objektbaum im Store gespeichert.',
        pillar2Title: '2. State ist schreibgeschützt',
        pillar2Desc: 'Um State zu ändern, dürfen keine Eigenschaften direkt zugewiesen werden – es muss eine Action als Absichtserklärung gesendet werden.',
        pillar3Title: '3. Reine Übergänge',
        pillar3DescPrefix: 'Reducers sind strikt reine Funktionen:',
        pillar3DescSuffix: 'ohne jegliche Seiteneffekte.',
        calloutStrong: 'Warum Unveränderlichkeit (Immutability) zählt:',
        calloutPart1: 'Da Reducers eine',
        calloutEm: 'neue State-Referenz',
        calloutPart2: '(per Object-Spread',
        calloutPart3: ') zurückgeben, können Komponenten und Selectors sofortige O(1)-Referenzvergleiche (',
        calloutPart4: ') durchführen, statt tausende verschachtelte Eigenschaften tief zu prüfen!',
      },
      actionsCard: {
        badge: '1. Action Group (createActionGroup)',
        title: 'Typisierte Actions dispatchen',
        description: 'Actions repräsentieren eindeutige Ereignisse im Lebenszyklus der Anwendung. Sie enthalten ein Typ-Tag und ein typisiertes Payload.',
        addBookBtn: '+ Buch hinzufügen ($65)',
        applyCouponBtn: '25%-Gutschein anwenden',
        clearCartBtn: 'Warenkorb leeren',
        unrelatedActionBtn: 'Unabhängige Action senden',
        hygieneTitle: '⚡ Action-Hygiene-Regel: Ereignisse statt Befehle',
        hygienePart1: 'Benennen Sie Actions nach',
        hygieneStrong: 'Ereignissen in der Oberfläche',
        hygienePart2: ', nicht nach imperativen Befehlen (z. B.',
        hygienePart3: '). Dadurch lesen sich Redux-DevTools-Logs wie ein chronologisches Storyboard der Nutzerinteraktionen.',
        codePreviewTitle: 'Action-Definitionscode:',
      },
      reducersCard: {
        badge: '2. Reiner Reducer (createFeature)',
        title: 'Aktueller unveränderlicher State',
        descriptionPrefix: 'Reducers sind reine Funktionen:',
        descriptionSuffix: '. Sie mutieren den State niemals direkt.',
        removeBtn: 'Entfernen',
        emptyCart: 'Warenkorb ist leer. Fügen Sie oben Artikel hinzu.',
        couponAppliedLabel: 'Gutschein aktiv:',
        offSuffix: '% RABATT',
        noteTitle: '🛡️ Garantien reiner Funktionen:',
        notePart1: 'Beachten Sie, dass der Reducer niemals',
        notePart2: 'aufruft. Er gibt immer ein neues Objekt',
        notePart3: 'zurück. So bleiben frühere State-Snapshots für das Time-Travel-Debugging unangetastet!',
      },
      selectorsCard: {
        badge: '3. Memoisierte Selectors (createSelector)',
        title: 'Selector-Projektion & Cache-Effizienz',
        description: 'Selectors berechnen abgeleitete State-Slices. Wenn sich ihre Eingabeargumente per Referenz nicht geändert haben, wird die Projektionsfunktion übersprungen und sofort der Cache-Wert geliefert.',
        itemsCountLabel: 'Artikelanzahl',
        subtotalLabel: 'Zwischensumme',
        discountedTotalLabel: 'Gesamtsumme (rabattiert)',
        lastActionPrefix: 'Letzte Action:',
        cacheHitStrong: 'CACHE-TREFFER (Projektor übersprungen)',
        projectorExecutedStrong: 'PROJEKTOR AUSGEFÜHRT',
        projectorExecutionsLabel: 'Projektor-Ausführungen:',
        cacheHitsLabel: 'Cache-Treffer (Neuberechnung gespart):',
        tipText: 'Tipp: Ein Klick auf „Unabhängige Action senden“ löst ein Event aus, das den Warenkorb nicht verändert. Beachten Sie, wie die Cache-Treffer steigen, während die Projektor-Ausführungen gleich bleiben!',
      },
    },
  },
};
