import type { SiteLanguage } from '@ah/shared/state';

export interface MulticastingCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  focusAriaLabel: string;
  focusOptions: {
    all: string;
    cold: string;
    hot: string;
    connectable: string;
    subject: string;
    behaviorSubject: string;
    replaySubject: string;
    asyncSubject: string;
  };
  analogyStrong: string;
  addSubscriberBtn: string;
  createBtn: string;
  connectBtn: string;
  createSubjectBtn: string;
  emitValueBtn: string;
  completeBtn: string;
  sourceStreamLabel: string;
  sharedSourceStreamLabel: string;
  executionLabel: (id: string) => string;
  initialValueLabel: string;
  currentValueLabel: string;
  bufferSizeLabel: string;
  bufferLabel: string;
  emptyLabel: string;
  cold: {
    title: string;
    description: string;
    analogyText: string;
  };
  hot: {
    title: string;
    description: string;
    analogyText: string;
  };
  connectable: {
    title: string;
    description: string;
    analogyText: string;
  };
  subject: {
    title: string;
    description: string;
  };
  behaviorSubject: {
    title: string;
    description: string;
  };
  replaySubject: {
    title: string;
    description: string;
  };
  asyncSubject: {
    title: string;
    description: string;
  };
}

export interface ReactiveCachingCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  focusAriaLabel: string;
  focusOptions: {
    all: string;
    user1: string;
    user2: string;
    user3: string;
  };
  title: string;
  description: string;
  analogyStrong: string;
  analogyText: string;
  fetchUserBtn: (id: number) => string;
  clearCacheBtn: string;
  currentUserDataTitle: string;
  idLabel: string;
  nameLabel: string;
  emailLabel: string;
  selectUserPlaceholder: string;
  marbleTitle: string;
  marbleDescription: string;
  networkLaneLabel: string;
  networkLaneBadge: string;
  cacheLaneLabel: string;
  cacheLaneBadge: string;
  operatorDescription: string;
  operatorFormula: string;
  auditTrailTitle: string;
  noFetchRecorded: string;
  showEnterprisePatternBtn: string;
  hideEnterprisePatternBtn: string;
}

export interface BulkOperationsCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  focusAriaLabel: string;
  focusOptions: {
    all: string;
    forkJoin: string;
    bufferCount: string;
  };
  configTitle: string;
  totalFilesLabel: string;
  batchSizeLabel: string;
  analogyStrong: string;
  filesToProcessTitle: string;
  statusLabels: {
    pending: string;
    processing: string;
    done: string;
  };
  forkJoin: {
    title: string;
    description: string;
    analogyText: string;
    processAllBtn: string;
    finalResultTitle: string;
    processingParallelText: string;
    marbleTitle: string;
    marbleDescription: string;
    outputLaneLabel: string;
    outputLaneBadge: string;
    operatorDescription: string;
    operatorFormula: string;
  };
  bufferCount: {
    title: string;
    description: string;
    analogyText: (batchSize: number) => string;
    processBatchesBtn: string;
    batchedResultsTitle: string;
    processingBatchText: string;
    batchLabel: (index: number) => string;
  };
}

export interface Tier2Copy {
  multicasting: MulticastingCopy;
  reactiveCaching: ReactiveCachingCopy;
  bulkOperations: BulkOperationsCopy;
}

export const TIER2_COPY: Record<SiteLanguage, Tier2Copy> = {
  en: {
    multicasting: {
      eyebrow: 'Chapter 8 · Multicasting',
      heading: 'Exercise: Multicasting',
      lead: 'Explore how to share a single Observable execution with multiple Observers. Filter to a single multicasting pattern to inspect subscriber timelines and marble distribution.',
      focusAriaLabel: 'Filter multicasting pattern',
      focusOptions: {
        all: 'All Multicasting',
        cold: 'Cold Observable',
        hot: 'Hot (share)',
        connectable: 'Connectable',
        subject: 'Subject',
        behaviorSubject: 'BehaviorSubject',
        replaySubject: 'ReplaySubject',
        asyncSubject: 'AsyncSubject',
      },
      analogyStrong: 'Analogy:',
      addSubscriberBtn: 'Add Subscriber',
      createBtn: 'Create',
      connectBtn: 'Connect',
      createSubjectBtn: 'Create Subject',
      emitValueBtn: 'Emit Value',
      completeBtn: 'Complete',
      sourceStreamLabel: 'Source Stream',
      sharedSourceStreamLabel: 'Shared Source Stream',
      executionLabel: (id) => `${id}'s Execution`,
      initialValueLabel: 'Initial Value:',
      currentValueLabel: 'Current Value:',
      bufferSizeLabel: 'Buffer Size:',
      bufferLabel: 'Buffer:',
      emptyLabel: 'Empty',
      cold: {
        title: 'Cold Observable',
        description: 'Each subscriber gets its own independent execution of the Observable.',
        analogyText: 'Watching a movie on Netflix. Each person who clicks play starts the movie from the beginning, getting their own private stream.',
      },
      hot: {
        title: 'Hot Observable (with share())',
        description: 'All subscribers share a single execution. Late subscribers miss earlier values.',
        analogyText: 'Tuning into a live radio broadcast. Everyone hears the same song at the same time. If you tune in late, you miss the beginning.',
      },
      connectable: {
        title: 'Hot Observable (with connectable)',
        description: 'Gives you manual control over when the shared execution starts via connect().',
        analogyText: "A movie premiere. The audience (subscribers) can gather, but the movie (source) won't start until the projectionist (you) hits the play button (connect()).",
      },
      subject: {
        title: 'Standard Subject',
        description: 'Acts as both an Observable and an Observer. It has no memory; only future values are received.',
      },
      behaviorSubject: {
        title: 'BehaviorSubject',
        description: 'Requires an initial value. New subscribers immediately receive the *most recent* value upon subscription.',
      },
      replaySubject: {
        title: 'ReplaySubject',
        description: 'Buffers a specified number of values and "replays" them to new subscribers.',
      },
      asyncSubject: {
        title: 'AsyncSubject',
        description: 'Only emits the *last* value of the source Observable, and only when the source completes.',
      },
    },
    reactiveCaching: {
      eyebrow: 'Chapter 9 · Caching & Performance',
      heading: 'Exercise: Reactive Caching',
      lead: 'Use shareReplay to cache and share the result of an asynchronous stream or HTTP request, eliminating redundant network calls.',
      focusAriaLabel: 'Filter cached user',
      focusOptions: {
        all: 'All Users (1, 2, 3)',
        user1: 'User 1 (Alice)',
        user2: 'User 2 (Bob)',
        user3: 'User 3 (Charlie)',
      },
      title: 'User Data Caching with shareReplay',
      description: 'The first time a user is fetched, a simulated network delay occurs. Subsequent requests for the same user are served instantly from memory.',
      analogyStrong: 'Analogy:',
      analogyText: 'Asking a librarian for a specific book. The first time, they retrieve it from the archive shelves (network request). If asked for the same book again, it remains immediately ready at the front desk (cache).',
      fetchUserBtn: (id) => `Fetch User ${id}`,
      clearCacheBtn: 'Clear Cache',
      currentUserDataTitle: 'Current User Data',
      idLabel: 'ID:',
      nameLabel: 'Name:',
      emailLabel: 'Email:',
      selectUserPlaceholder: 'Select a user above to fetch data.',
      marbleTitle: 'Reactive Cache Stream Timeline',
      marbleDescription: 'Visualizing the transition from initial network latency to synchronous zero-latency replay',
      networkLaneLabel: 'Network Stream (Cold Request)',
      networkLaneBadge: 'Uncached API',
      cacheLaneLabel: 'Replayed Cache Stream (shareReplay)',
      cacheLaneBadge: 'Zero Latency',
      operatorDescription: 'Caches the most recent emission and replays it synchronously to future subscribers without repeating the upstream execution.',
      operatorFormula: 'First subscriber: HTTP -> Cache; Subsequent: Replay from memory',
      auditTrailTitle: 'Audit Trail',
      noFetchRecorded: 'No fetch actions recorded yet.',
      showEnterprisePatternBtn: 'Show Enterprise Cache Pattern',
      hideEnterprisePatternBtn: 'Hide Enterprise Cache Pattern',
    },
    bulkOperations: {
      eyebrow: 'Chapter 7 · Concurrency & Batching',
      heading: 'Exercise: Bulk Operations',
      lead: 'Handle multiple asynchronous streams in parallel with forkJoin or process items sequentially in chunks with bufferCount.',
      focusAriaLabel: 'Filter bulk operation',
      focusOptions: {
        all: 'All Bulk Operations',
        forkJoin: 'forkJoin (Parallel)',
        bufferCount: 'bufferCount (Batched)',
      },
      configTitle: 'Configuration',
      totalFilesLabel: 'Total Files:',
      batchSizeLabel: 'Batch Size (for bufferCount):',
      analogyStrong: 'Analogy:',
      filesToProcessTitle: 'Files to Process:',
      statusLabels: {
        pending: 'pending',
        processing: 'processing',
        done: 'done',
      },
      forkJoin: {
        title: 'forkJoin: All or Nothing',
        description: 'Waits for multiple Observables to complete and then emits an array of their last values.',
        analogyText: 'Ordering a multi-course meal. You have to wait for the appetizer, main course, and dessert to all be ready before the full meal is served.',
        processAllBtn: 'Process All Files',
        finalResultTitle: 'Final Result (emitted once all are done):',
        processingParallelText: 'Processing in parallel...',
        marbleTitle: 'forkJoin Concurrency Timeline',
        marbleDescription: 'Parallel execution locks step until all observables finish and then emits simultaneously',
        outputLaneLabel: 'Combined Parallel Output',
        outputLaneBadge: 'forkJoin$',
        operatorDescription: 'Waits for all parallel source observables to complete, then emits a single dictionary/array containing their final values.',
        operatorFormula: 'All complete ? Emit combined array : Await remaining streams',
      },
      bufferCount: {
        title: 'bufferCount: Batch Processing',
        description: 'Collects values from the source Observable into a buffer until it reaches a specified size, then processes that batch before moving to the next.',
        analogyText: (batchSize) => `A factory assembly line that waits to fill a box with ${batchSize} items before sealing it and sending it to shipping.`,
        processBatchesBtn: 'Process in Batches',
        batchedResultsTitle: 'Batched Results:',
        processingBatchText: 'Processing batch...',
        batchLabel: (index) => `Batch ${index}:`,
      },
    },
  },
  fr: {
    multicasting: {
      eyebrow: 'Chapitre 8 · Multidiffusion (Multicasting)',
      heading: 'Exercice : Multidiffusion',
      lead: 'Découvrez comment partager une seule exécution d’Observable entre plusieurs Observers. Filtrez un modèle pour inspecter ses chronologies.',
      focusAriaLabel: 'Filtrer le modèle de multidiffusion',
      focusOptions: {
        all: 'Toute la multidiffusion',
        cold: 'Observable froid (Cold)',
        hot: 'Chaud (share)',
        connectable: 'Connectable',
        subject: 'Subject',
        behaviorSubject: 'BehaviorSubject',
        replaySubject: 'ReplaySubject',
        asyncSubject: 'AsyncSubject',
      },
      analogyStrong: 'Analogie :',
      addSubscriberBtn: 'Ajouter un abonné',
      createBtn: 'Créer',
      connectBtn: 'Connecter',
      createSubjectBtn: 'Créer le Subject',
      emitValueBtn: 'Émettre une valeur',
      completeBtn: 'Compléter',
      sourceStreamLabel: 'Flux source',
      sharedSourceStreamLabel: 'Flux source partagé',
      executionLabel: (id) => `Exécution de ${id}`,
      initialValueLabel: 'Valeur initiale :',
      currentValueLabel: 'Valeur actuelle :',
      bufferSizeLabel: 'Taille du tampon :',
      bufferLabel: 'Tampon :',
      emptyLabel: 'Vide',
      cold: {
        title: 'Observable froid (Cold Observable)',
        description: 'Chaque abonné obtient sa propre exécution indépendante de l’Observable.',
        analogyText: 'Regarder un film sur Netflix : chaque personne qui clique sur Lecture démarre le film depuis le début avec son propre flux privé.',
      },
      hot: {
        title: 'Observable chaud (avec share())',
        description: 'Tous les abonnés partagent une seule exécution. Les abonnés tardifs manquent les valeurs précédentes.',
        analogyText: 'Écouter une émission de radio en direct : tout le monde entend la même chanson en même temps. Si vous arrivez en retard, vous manquez le début.',
      },
      connectable: {
        title: 'Observable chaud (avec connectable)',
        description: 'Offre un contrôle manuel sur le démarrage de l’exécution partagée via connect().',
        analogyText: 'Une avant-première au cinéma : le public (les abonnés) s’installe, mais le film ne démarre que lorsque le projectionniste lance connect().',
      },
      subject: {
        title: 'Subject standard',
        description: 'Agit à la fois comme Observable et Observer. Il n’a aucune mémoire : seules les valeurs futures sont reçues.',
      },
      behaviorSubject: {
        title: 'BehaviorSubject',
        description: 'Requiert une valeur initiale. Les nouveaux abonnés reçoivent immédiatement la valeur la plus récente lors de l’abonnement.',
      },
      replaySubject: {
        title: 'ReplaySubject',
        description: 'Mémorise un nombre défini de valeurs et les « rejoue » aux nouveaux abonnés.',
      },
      asyncSubject: {
        title: 'AsyncSubject',
        description: 'N’émet que la toute dernière valeur de l’Observable source, et uniquement lorsque celui-ci se termine (complete).',
      },
    },
    reactiveCaching: {
      eyebrow: 'Chapitre 9 · Mise en cache et performance',
      heading: 'Exercice : Cache réactif',
      lead: 'Utilisez shareReplay pour mettre en cache et partager le résultat d’un flux asynchrone ou d’une requête HTTP, éliminant les appels réseau redondants.',
      focusAriaLabel: 'Filtrer l’utilisateur en cache',
      focusOptions: {
        all: 'Tous les utilisateurs (1, 2, 3)',
        user1: 'Utilisateur 1 (Alice)',
        user2: 'Utilisateur 2 (Bob)',
        user3: 'Utilisateur 3 (Charlie)',
      },
      title: 'Mise en cache des données utilisateur avec shareReplay',
      description: 'Lors du premier chargement d’un utilisateur, un délai réseau simulé a lieu. Les requêtes suivantes pour ce même utilisateur sont servies instantanément depuis la mémoire.',
      analogyStrong: 'Analogie :',
      analogyText: 'Demander un livre à un bibliothécaire : la première fois, il va le chercher aux archives (requête réseau). Ensuite, il le garde à portée de main au comptoir (cache).',
      fetchUserBtn: (id) => `Charger Utilisateur ${id}`,
      clearCacheBtn: 'Vider le cache',
      currentUserDataTitle: 'Données de l’utilisateur actuel',
      idLabel: 'ID :',
      nameLabel: 'Nom :',
      emailLabel: 'E-mail :',
      selectUserPlaceholder: 'Sélectionnez un utilisateur ci-dessus pour charger ses données.',
      marbleTitle: 'Chronologie du flux de cache réactif',
      marbleDescription: 'Visualisation du passage de la latence réseau initiale à la relecture synchrone sans latence',
      networkLaneLabel: 'Flux réseau (Requête froide)',
      networkLaneBadge: 'API non cachée',
      cacheLaneLabel: 'Flux en cache rejoué (shareReplay)',
      cacheLaneBadge: 'Zéro latence',
      operatorDescription: 'Met en cache la dernière émission et la rejoue de manière synchrone aux futurs abonnés sans répéter la requête amont.',
      operatorFormula: '1er abonné : HTTP -> Cache ; Suivants : Lecture mémoire',
      auditTrailTitle: 'Journal d’audit',
      noFetchRecorded: 'Aucune action enregistrée pour le moment.',
      showEnterprisePatternBtn: 'Afficher le modèle de cache Entreprise',
      hideEnterprisePatternBtn: 'Masquer le modèle de cache Entreprise',
    },
    bulkOperations: {
      eyebrow: 'Chapitre 7 · Concurrence et traitement par lots',
      heading: 'Exercice : Opérations de masse',
      lead: 'Gérez plusieurs flux asynchrones en parallèle avec forkJoin ou traitez des éléments séquentiellement par paquets avec bufferCount.',
      focusAriaLabel: 'Filtrer l’opération de masse',
      focusOptions: {
        all: 'Toutes les opérations',
        forkJoin: 'forkJoin (Parallèle)',
        bufferCount: 'bufferCount (Par lots)',
      },
      configTitle: 'Configuration',
      totalFilesLabel: 'Total de fichiers :',
      batchSizeLabel: 'Taille du lot (pour bufferCount) :',
      analogyStrong: 'Analogie :',
      filesToProcessTitle: 'Fichiers à traiter :',
      statusLabels: {
        pending: 'en attente',
        processing: 'en cours',
        done: 'terminé',
      },
      forkJoin: {
        title: 'forkJoin : Tout ou rien',
        description: 'Attend que tous les Observables soient complétés puis émet un tableau contenant la dernière valeur de chacun.',
        analogyText: 'Commander un menu complet : on attend que l’entrée, le plat et le dessert soient tous prêts avant de servir la table entière.',
        processAllBtn: 'Traiter tous les fichiers',
        finalResultTitle: 'Résultat final (émis une fois tout terminé) :',
        processingParallelText: 'Traitement en parallèle...',
        marbleTitle: 'Chronologie de concurrence forkJoin',
        marbleDescription: 'L’exécution parallèle attend que tous les Observables se terminent avant d’émettre simultanément',
        outputLaneLabel: 'Sortie parallèle combinée',
        outputLaneBadge: 'forkJoin$',
        operatorDescription: 'Attend la complétion de tous les Observables parallèles, puis émet un tableau unique de leurs valeurs finales.',
        operatorFormula: 'Tous complétés ? Émettre le tableau : Attendre les flux restants',
      },
      bufferCount: {
        title: 'bufferCount : Traitement par lots',
        description: 'Regroupe les valeurs de l’Observable source dans un tampon jusqu’à atteindre la taille définie, puis traite ce lot avant de passer au suivant.',
        analogyText: (batchSize) => `Une chaîne de montage qui attend de remplir un carton de ${batchSize} articles avant de le sceller et de l’expédier.`,
        processBatchesBtn: 'Traiter par lots',
        batchedResultsTitle: 'Résultats par lots :',
        processingBatchText: 'Traitement du lot...',
        batchLabel: (index) => `Lot ${index} :`,
      },
    },
  },
  ar: {
    multicasting: {
      eyebrow: 'الفصل 8 · البث المتعدد (Multicasting)',
      heading: 'تمرين: البث المتعدد',
      lead: 'استكشف كيفية مشاركة تنفيذ Observable واحد مع عدة مراقبين. صفِّ إلى نمط بث واحد لفحص الخطوط الزمنية للمشتركين.',
      focusAriaLabel: 'تصفية نمط البث المتعدد',
      focusOptions: {
        all: 'جميع أنماط البث المتعدد',
        cold: 'Observable بارد (Cold)',
        hot: 'ساخن (share)',
        connectable: 'قابل للاتصال (Connectable)',
        subject: 'Subject',
        behaviorSubject: 'BehaviorSubject',
        replaySubject: 'ReplaySubject',
        asyncSubject: 'AsyncSubject',
      },
      analogyStrong: 'تشبيه:',
      addSubscriberBtn: 'إضافة مشترك',
      createBtn: 'إنشاء',
      connectBtn: 'اتصال',
      createSubjectBtn: 'إنشاء Subject',
      emitValueBtn: 'إصدار قيمة',
      completeBtn: 'إكمال',
      sourceStreamLabel: 'تدفق المصدر',
      sharedSourceStreamLabel: 'تدفق المصدر المشترك',
      executionLabel: (id) => `تنفيذ ${id}`,
      initialValueLabel: 'القيمة الأولية:',
      currentValueLabel: 'القيمة الحالية:',
      bufferSizeLabel: 'حجم المخزن المؤقت:',
      bufferLabel: 'المخزن المؤقت:',
      emptyLabel: 'فارغ',
      cold: {
        title: 'Observable بارد (Cold Observable)',
        description: 'يحصل كل مشترك على تنفيذ مستقل خاص به للـ Observable.',
        analogyText: 'مشاهدة فيلم على Netflix: كل شخص ينقر على تشغيل يبدأ الفيلم من البداية في بث خاص به.',
      },
      hot: {
        title: 'Observable ساخن (باستخدام share())',
        description: 'يتشارك جميع المشتركين في تنفيذ واحد. المشتركون المتأخرون تفوتهم القيم السابقة.',
        analogyText: 'الاستماع إلى بث إذاعي مباشر: الجميع يسمع نفس الأغنية في نفس اللحظة، ومن ينضم متأخرًا تفوته البداية.',
      },
      connectable: {
        title: 'Observable ساخن (باستخدام connectable)',
        description: 'يمنحك تحكمًا يدويًا في وقت بدء التنفيذ المشترك عبر connect().',
        analogyText: 'عرض أول لفيلم: يمكن للجمهور (المشتركين) التجمع، لكن الفيلم لا يبدأ حتى يضغط المشغّل على زر البدء connect().',
      },
      subject: {
        title: 'Subject قياسي',
        description: 'يعمل كـ Observable وObserver معًا. ليس لديه ذاكرة؛ يتم استلام القيم المستقبلية فقط.',
      },
      behaviorSubject: {
        title: 'BehaviorSubject',
        description: 'يتطلب قيمة أولية. يتلقى المشتركون الجدد فورًا أحدث قيمة عند الاشتراك.',
      },
      replaySubject: {
        title: 'ReplaySubject',
        description: 'يخزن عددًا محددًا من القيم السابقة ويعيد بثها للمشتركين الجدد فور اشتراكهم.',
      },
      asyncSubject: {
        title: 'AsyncSubject',
        description: 'يُصدر فقط القيمة الأخيرة من المصدر، وفقط عندما يكتمل المصدر (complete).',
      },
    },
    reactiveCaching: {
      eyebrow: 'الفصل 9 · التخزين المؤقت والأداء',
      heading: 'تمرين: التخزين المؤقت التفاعلي',
      lead: 'استخدم shareReplay لتخزين ومشاركة نتيجة تدفق غير متزامن أو طلب HTTP، مما يلغي طلبات الشبكة المكررة.',
      focusAriaLabel: 'تصفية المستخدم المخزن مؤقتًا',
      focusOptions: {
        all: 'جميع المستخدمين (1، 2، 3)',
        user1: 'المستخدم 1 (Alice)',
        user2: 'المستخدم 2 (Bob)',
        user3: 'المستخدم 3 (Charlie)',
      },
      title: 'تخزين بيانات المستخدم مؤقتًا باستخدام shareReplay',
      description: 'في المرة الأولى التي يتم فيها جلب مستخدم، يحدث تأخير شبكة محاكى. الطلبات اللاحقة لنفس المستخدم تُلبّى فورًا من الذاكرة.',
      analogyStrong: 'تشبيه:',
      analogyText: 'طلب كتاب معين من أمين مكتبة: في المرة الأولى يحضره من الأرشيف (طلب شبكة)، وإذا طُلب مرة أخرى يكون جاهزًا فورًا على المكتب الأمامي (ذاكرة مؤقتة).',
      fetchUserBtn: (id) => `جلب المستخدم ${id}`,
      clearCacheBtn: 'مسح الذاكرة المؤقتة',
      currentUserDataTitle: 'بيانات المستخدم الحالي',
      idLabel: 'المعرّف:',
      nameLabel: 'الاسم:',
      emailLabel: 'البريد الإلكتروني:',
      selectUserPlaceholder: 'اختر مستخدمًا أعلاه لجلب البيانات.',
      marbleTitle: 'الخط الزمني لتدفق التخزين المؤقت التفاعلي',
      marbleDescription: 'تصور الانتقال من زمن استجابة الشبكة الأولي إلى الإعادة المتزامنة بدون تأخير',
      networkLaneLabel: 'تدفق الشبكة (طلب بارد)',
      networkLaneBadge: 'واجهة غير مخزنة',
      cacheLaneLabel: 'تدفق الذاكرة المؤقتة المعاد (shareReplay)',
      cacheLaneBadge: 'بدون تأخير',
      operatorDescription: 'يخزن أحدث انبعاث ويعيد بثه بشكل متزامن للمشتركين اللاحقين دون تكرار تنفيذ المصدر.',
      operatorFormula: 'المشترك الأول: HTTP -> ذاكرة مؤقتة؛ التالي: إعادة من الذاكرة',
      auditTrailTitle: 'سجل التدقيق',
      noFetchRecorded: 'لم يتم تسجيل أي عمليات جلب بعد.',
      showEnterprisePatternBtn: 'عرض نمط التخزين المؤقت للمؤسسات',
      hideEnterprisePatternBtn: 'إخفاء نمط التخزين المؤقت للمؤسسات',
    },
    bulkOperations: {
      eyebrow: 'الفصل 7 · التزامن والمعالجة بالدفعات',
      heading: 'تمرين: العمليات المجمّعة',
      lead: 'تعامل مع عدة تدفقات غير متزامنة بالتوازي باستخدام forkJoin أو عالج العناصر بالتسلسل في دفعات باستخدام bufferCount.',
      focusAriaLabel: 'تصفية العملية المجمّعة',
      focusOptions: {
        all: 'جميع العمليات المجمّعة',
        forkJoin: 'forkJoin (بالتوازي)',
        bufferCount: 'bufferCount (بالدفعات)',
      },
      configTitle: 'الإعدادات',
      totalFilesLabel: 'إجمالي الملفات:',
      batchSizeLabel: 'حجم الدفعة (لـ bufferCount):',
      analogyStrong: 'تشبيه:',
      filesToProcessTitle: 'الملفات المراد معالجتها:',
      statusLabels: {
        pending: 'قيد الانتظار',
        processing: 'قيد المعالجة',
        done: 'مكتمل',
      },
      forkJoin: {
        title: 'forkJoin: الكل أو لا شيء',
        description: 'ينتظر اكتمال عدة Observables ثم يُصدر مصفوفة بآخر قيمها معًا.',
        analogyText: 'طلب وجبة متعددة الأطباق: تنتظر جاهزية المقبلات والطبق الرئيسي والحلوى معًا قبل تقديم الوجبة الكاملة.',
        processAllBtn: 'معالجة جميع الملفات',
        finalResultTitle: 'النتيجة النهائية (تُصدر عند اكتمال الكل):',
        processingParallelText: 'جارٍ المعالجة بالتوازي...',
        marbleTitle: 'الخط الزمني للتزامن في forkJoin',
        marbleDescription: 'ينتظر التنفيذ المتوازي انتهاء جميع التدفقات ثم يُصدر النتيجة في آنٍ واحد',
        outputLaneLabel: 'المخرج المتوازي المدمج',
        outputLaneBadge: 'forkJoin$',
        operatorDescription: 'ينتظر اكتمال جميع التدفقات المتوازية، ثم يُصدر مصفوفة واحدة تحتوي على قيمها النهائية.',
        operatorFormula: 'اكتمل الكل؟ إصدار المصفوفة المدمجة : انتظار التدفقات المتبقية',
      },
      bufferCount: {
        title: 'bufferCount: المعالجة بالدفعات',
        description: 'يجمع القيم من تدفق المصدر في مخزن مؤقت حتى يصل إلى حجم محدد، ثم يعالج تلك الدفعة قبل الانتقال إلى التالية.',
        analogyText: (batchSize) => `خط إنتاج في مصنع ينتظر امتلاء صندوق بـ ${batchSize} عناصر قبل إغلاقه وإرساله للشحن.`,
        processBatchesBtn: 'معالجة بالدفعات',
        batchedResultsTitle: 'نتائج الدفعات:',
        processingBatchText: 'جارٍ معالجة الدفعة...',
        batchLabel: (index) => `الدفعة ${index}:`,
      },
    },
  },
  it: {
    multicasting: {
      eyebrow: 'Capitolo 8 · Multicasting',
      heading: 'Esercizio: Multicasting',
      lead: 'Esplora come condividere una singola esecuzione di un Observable con più Observer. Filtra un pattern per ispezionare timeline e distribuzione delle marble.',
      focusAriaLabel: 'Filtra pattern di multicasting',
      focusOptions: {
        all: 'Tutto il Multicasting',
        cold: 'Cold Observable',
        hot: 'Hot (share)',
        connectable: 'Connectable',
        subject: 'Subject',
        behaviorSubject: 'BehaviorSubject',
        replaySubject: 'ReplaySubject',
        asyncSubject: 'AsyncSubject',
      },
      analogyStrong: 'Analogia:',
      addSubscriberBtn: 'Aggiungi sottoscrittore',
      createBtn: 'Crea',
      connectBtn: 'Connetti',
      createSubjectBtn: 'Crea Subject',
      emitValueBtn: 'Emetti valore',
      completeBtn: 'Completa',
      sourceStreamLabel: 'Flusso sorgente',
      sharedSourceStreamLabel: 'Flusso sorgente condiviso',
      executionLabel: (id) => `Esecuzione di ${id}`,
      initialValueLabel: 'Valore iniziale:',
      currentValueLabel: 'Valore attuale:',
      bufferSizeLabel: 'Dimensione buffer:',
      bufferLabel: 'Buffer:',
      emptyLabel: 'Vuoto',
      cold: {
        title: 'Cold Observable',
        description: 'Ogni sottoscrittore ottiene la propria esecuzione indipendente dell’Observable.',
        analogyText: 'Guardare un film su Netflix: ogni persona che preme play avvia il film dall’inizio con il proprio flusso privato.',
      },
      hot: {
        title: 'Hot Observable (con share())',
        description: 'Tutti i sottoscrittori condividono una singola esecuzione. Chi si iscrive tardi perde i valori precedenti.',
        analogyText: 'Sintonizzarsi su una trasmissione radio dal vivo: tutti ascoltano lo stesso brano nello stesso momento. Chi arriva tardi perde l’inizio.',
      },
      connectable: {
        title: 'Hot Observable (con connectable)',
        description: 'Offre il controllo manuale su quando avviare l’esecuzione condivisa tramite connect().',
        analogyText: 'Una première cinematografica: il pubblico (i sottoscrittori) prende posto, ma il film parte solo quando il proiezionista chiama connect().',
      },
      subject: {
        title: 'Subject standard',
        description: 'Agisce sia come Observable che come Observer. Non ha memoria: vengono ricevuti solo i valori futuri.',
      },
      behaviorSubject: {
        title: 'BehaviorSubject',
        description: 'Richiede un valore iniziale. I nuovi sottoscrittori ricevono immediatamente il valore più recente al momento dell’iscrizione.',
      },
      replaySubject: {
        title: 'ReplaySubject',
        description: 'Memorizza nel buffer un numero specificato di valori e li "riproduce" ai nuovi sottoscrittori.',
      },
      asyncSubject: {
        title: 'AsyncSubject',
        description: 'Emette solo l’ultimo valore dell’Observable sorgente, e solo quando la sorgente viene completata.',
      },
    },
    reactiveCaching: {
      eyebrow: 'Capitolo 9 · Caching e prestazioni',
      heading: 'Esercizio: Caching reattivo',
      lead: 'Usa shareReplay per memorizzare nella cache e condividere il risultato di un flusso asincrono o di una richiesta HTTP, eliminando chiamate di rete ridondanti.',
      focusAriaLabel: 'Filtra utente in cache',
      focusOptions: {
        all: 'Tutti gli utenti (1, 2, 3)',
        user1: 'Utente 1 (Alice)',
        user2: 'Utente 2 (Bob)',
        user3: 'Utente 3 (Charlie)',
      },
      title: 'Caching dei dati utente con shareReplay',
      description: 'La prima volta che un utente viene richiesto, si verifica un ritardo di rete simulato. Le richieste successive per lo stesso utente sono servite istantaneamente dalla memoria.',
      analogyStrong: 'Analogia:',
      analogyText: 'Chiedere un libro a un bibliotecario: la prima volta lo recupera dagli scaffali dell’archivio (rete). Se richiesto di nuovo, è subito pronto al bancone (cache).',
      fetchUserBtn: (id) => `Carica Utente ${id}`,
      clearCacheBtn: 'Svuota Cache',
      currentUserDataTitle: 'Dati utente attuale',
      idLabel: 'ID:',
      nameLabel: 'Nome:',
      emailLabel: 'Email:',
      selectUserPlaceholder: 'Seleziona un utente sopra per caricare i dati.',
      marbleTitle: 'Timeline del flusso di cache reattiva',
      marbleDescription: 'Visualizzazione del passaggio dalla latenza di rete iniziale al replay sincrono a latenza zero',
      networkLaneLabel: 'Flusso di rete (Richiesta Cold)',
      networkLaneBadge: 'API non in cache',
      cacheLaneLabel: 'Flusso cache riprodotto (shareReplay)',
      cacheLaneBadge: 'Latenza zero',
      operatorDescription: 'Memorizza l’ultima emissione e la riproduce in modo sincrono ai futuri sottoscrittori senza ripetere l’esecuzione a monte.',
      operatorFormula: '1° sottoscrittore: HTTP -> Cache; Successivi: Replay dalla memoria',
      auditTrailTitle: 'Registro di audit',
      noFetchRecorded: 'Nessuna azione registrata finora.',
      showEnterprisePatternBtn: 'Mostra pattern Cache Enterprise',
      hideEnterprisePatternBtn: 'Nascondi pattern Cache Enterprise',
    },
    bulkOperations: {
      eyebrow: 'Capitolo 7 · Concorrenza e Batching',
      heading: 'Esercizio: Operazioni massive',
      lead: 'Gestisci più flussi asincroni in parallelo con forkJoin o elabora elementi in sequenza a blocchi con bufferCount.',
      focusAriaLabel: 'Filtra operazione massiva',
      focusOptions: {
        all: 'Tutte le operazioni',
        forkJoin: 'forkJoin (Parallelo)',
        bufferCount: 'bufferCount (A blocchi)',
      },
      configTitle: 'Configurazione',
      totalFilesLabel: 'File totali:',
      batchSizeLabel: 'Dimensione lotto (per bufferCount):',
      analogyStrong: 'Analogia:',
      filesToProcessTitle: 'File da elaborare:',
      statusLabels: {
        pending: 'in attesa',
        processing: 'in corso',
        done: 'completato',
      },
      forkJoin: {
        title: 'forkJoin: Tutto o niente',
        description: 'Attende il completamento di tutti gli Observable e poi emette un array con i loro ultimi valori.',
        analogyText: 'Ordinare un pasto completo: si attende che antipasto, piatto principale e dolce siano tutti pronti prima di servire.',
        processAllBtn: 'Elabora tutti i file',
        finalResultTitle: 'Risultato finale (emesso al termine di tutti):',
        processingParallelText: 'Elaborazione in parallelo...',
        marbleTitle: 'Timeline di concorrenza forkJoin',
        marbleDescription: 'L’esecuzione parallela attende il termine di tutti gli Observable prima di emettere simultaneamente',
        outputLaneLabel: 'Output parallelo combinato',
        outputLaneBadge: 'forkJoin$',
        operatorDescription: 'Attende che tutti gli Observable sorgente paralleli completino, poi emette un singolo array con i valori finali.',
        operatorFormula: 'Tutti completati ? Emetti array combinato : Attendi flussi rimanenti',
      },
      bufferCount: {
        title: 'bufferCount: Elaborazione a lotti',
        description: 'Raccoglie i valori dall’Observable sorgente in un buffer finché non raggiunge la dimensione specificata, poi elabora quel lotto prima di passare al successivo.',
        analogyText: (batchSize) => `Una catena di montaggio che attende di riempire una scatola con ${batchSize} articoli prima di sigillarla e spedirla.`,
        processBatchesBtn: 'Elabora a lotti',
        batchedResultsTitle: 'Risultati per lotto:',
        processingBatchText: 'Elaborazione lotto in corso...',
        batchLabel: (index) => `Lotto ${index}:`,
      },
    },
  },
  de: {
    multicasting: {
      eyebrow: 'Kapitel 8 · Multicasting',
      heading: 'Übung: Multicasting',
      lead: 'Erkunden Sie, wie eine einzelne Observable-Ausführung mit mehreren Observern geteilt wird. Filtern Sie auf ein Muster, um die Zeitachsen im Detail zu sehen.',
      focusAriaLabel: 'Multicasting-Muster filtern',
      focusOptions: {
        all: 'Alle Multicasting-Muster',
        cold: 'Cold Observable',
        hot: 'Hot (share)',
        connectable: 'Connectable',
        subject: 'Subject',
        behaviorSubject: 'BehaviorSubject',
        replaySubject: 'ReplaySubject',
        asyncSubject: 'AsyncSubject',
      },
      analogyStrong: 'Analogie:',
      addSubscriberBtn: 'Abonnent hinzufügen',
      createBtn: 'Erstellen',
      connectBtn: 'Verbinden',
      createSubjectBtn: 'Subject erstellen',
      emitValueBtn: 'Wert emittieren',
      completeBtn: 'Abschließen',
      sourceStreamLabel: 'Quell-Stream',
      sharedSourceStreamLabel: 'Geteilter Quell-Stream',
      executionLabel: (id) => `Ausführung von ${id}`,
      initialValueLabel: 'Startwert:',
      currentValueLabel: 'Aktueller Wert:',
      bufferSizeLabel: 'Puffergröße:',
      bufferLabel: 'Puffer:',
      emptyLabel: 'Leer',
      cold: {
        title: 'Cold Observable',
        description: 'Jeder Abonnent erhält seine eigene, unabhängige Ausführung des Observables.',
        analogyText: 'Einen Film auf Netflix schauen: Jeder, der auf Play klickt, startet den Film von vorn in seinem eigenen privaten Stream.',
      },
      hot: {
        title: 'Hot Observable (mit share())',
        description: 'Alle Abonnenten teilen sich eine einzige Ausführung. Späte Abonnenten verpassen frühere Werte.',
        analogyText: 'Eine Live-Radiosendung einschalten: Alle hören denselben Song zur selben Zeit. Wer später einschaltet, verpasst den Anfang.',
      },
      connectable: {
        title: 'Hot Observable (mit connectable)',
        description: 'Gibt Ihnen über connect() manuelle Kontrolle darüber, wann die geteilte Ausführung startet.',
        analogyText: 'Eine Kinopremiere: Das Publikum (Abonnenten) versammelt sich im Saal, aber der Film startet erst, wenn der Vorführer connect() drückt.',
      },
      subject: {
        title: 'Standard-Subject',
        description: 'Agiert sowohl als Observable als auch als Observer. Es hat kein Gedächtnis; nur zukünftige Werte werden empfangen.',
      },
      behaviorSubject: {
        title: 'BehaviorSubject',
        description: 'Erfordert einen Startwert. Neue Abonnenten erhalten sofort beim Abonnieren den *aktuellsten* Wert.',
      },
      replaySubject: {
        title: 'ReplaySubject',
        description: 'Puffert eine festgelegte Anzahl vergangener Werte und spielt sie neuen Abonnenten sofort ab.',
      },
      asyncSubject: {
        title: 'AsyncSubject',
        description: 'Emittiert nur den *letzten* Wert des Quell-Observables, und zwar erst beim Abschluss (complete).',
      },
    },
    reactiveCaching: {
      eyebrow: 'Kapitel 9 · Caching & Performance',
      heading: 'Übung: Reaktives Caching',
      lead: 'Nutzen Sie shareReplay, um das Ergebnis eines asynchronen Streams oder HTTP-Requests zwischenzuspeichern und redundante Netzwerkaufrufe zu vermeiden.',
      focusAriaLabel: 'Zwischengespeicherten Benutzer filtern',
      focusOptions: {
        all: 'Alle Benutzer (1, 2, 3)',
        user1: 'Benutzer 1 (Alice)',
        user2: 'Benutzer 2 (Bob)',
        user3: 'Benutzer 3 (Charlie)',
      },
      title: 'Benutzerdaten-Caching mit shareReplay',
      description: 'Beim ersten Abruf eines Benutzers tritt eine simulierte Netzwerkverzögerung auf. Folgeanfragen für denselben Benutzer werden sofort aus dem Speicher bedient.',
      analogyStrong: 'Analogie:',
      analogyText: 'Einen Bibliothekar nach einem Buch fragen: Beim ersten Mal holt er es aus dem Archiv (Netzwerk). Bei weiteren Nachfragen liegt es sofort am Schalter bereit (Cache).',
      fetchUserBtn: (id) => `Benutzer ${id} abrufen`,
      clearCacheBtn: 'Cache leeren',
      currentUserDataTitle: 'Aktuelle Benutzerdaten',
      idLabel: 'ID:',
      nameLabel: 'Name:',
      emailLabel: 'E-Mail:',
      selectUserPlaceholder: 'Wählen Sie oben einen Benutzer aus, um Daten abzurufen.',
      marbleTitle: 'Zeitachse des reaktiven Cache-Streams',
      marbleDescription: 'Visualisierung des Übergangs von initialer Netzwerklatenz zu synchronem Zero-Latency-Replay',
      networkLaneLabel: 'Netzwerk-Stream (Cold Request)',
      networkLaneBadge: 'Ungecachte API',
      cacheLaneLabel: 'Wiedergegebener Cache-Stream (shareReplay)',
      cacheLaneBadge: 'Null Latenz',
      operatorDescription: 'Speichert die letzte Emission und spielt sie zukünftigen Abonnenten synchron ab, ohne die Quell-Ausführung zu wiederholen.',
      operatorFormula: '1. Abonnent: HTTP -> Cache; Weitere: Replay aus dem Speicher',
      auditTrailTitle: 'Audit-Protokoll',
      noFetchRecorded: 'Noch keine Abrufe protokolliert.',
      showEnterprisePatternBtn: 'Enterprise-Cache-Muster anzeigen',
      hideEnterprisePatternBtn: 'Enterprise-Cache-Muster ausblenden',
    },
    bulkOperations: {
      eyebrow: 'Kapitel 7 · Nebenläufigkeit & Batch-Verarbeitung',
      heading: 'Übung: Massenoperationen',
      lead: 'Verarbeiten Sie mehrere asynchrone Streams parallel mit forkJoin oder sequenziell in Paketen mit bufferCount.',
      focusAriaLabel: 'Massenoperation filtern',
      focusOptions: {
        all: 'Alle Operationen',
        forkJoin: 'forkJoin (Parallel)',
        bufferCount: 'bufferCount (Stapel)',
      },
      configTitle: 'Konfiguration',
      totalFilesLabel: 'Dateien gesamt:',
      batchSizeLabel: 'Stapelgröße (für bufferCount):',
      analogyStrong: 'Analogie:',
      filesToProcessTitle: 'Zu verarbeitende Dateien:',
      statusLabels: {
        pending: 'ausstehend',
        processing: 'in Bearbeitung',
        done: 'fertig',
      },
      forkJoin: {
        title: 'forkJoin: Alles oder Nichts',
        description: 'Wartet auf den Abschluss mehrerer Observables und emittiert dann ein Array ihrer jeweils letzten Werte.',
        analogyText: 'Ein mehrgängiges Menü bestellen: Vorspeise, Hauptgang und Dessert müssen alle fertig sein, bevor das komplette Essen serviert wird.',
        processAllBtn: 'Alle Dateien verarbeiten',
        finalResultTitle: 'Endergebnis (emittiert, sobald alle fertig sind):',
        processingParallelText: 'Parallele Verarbeitung läuft...',
        marbleTitle: 'forkJoin-Nebenläufigkeits-Zeitachse',
        marbleDescription: 'Parallele Ausführung wartet auf den Abschluss aller Observables und emittiert dann gleichzeitig',
        outputLaneLabel: 'Kombinierte parallele Ausgabe',
        outputLaneBadge: 'forkJoin$',
        operatorDescription: 'Wartet auf den Abschluss aller parallelen Quell-Observables und gibt ein einzelnes Array mit den Endwerten aus.',
        operatorFormula: 'Alle fertig ? Kombiniertes Array senden : Auf restliche Streams warten',
      },
      bufferCount: {
        title: 'bufferCount: Stapelverarbeitung',
        description: 'Sammelt Werte aus dem Quell-Observable in einem Puffer bis zur festgelegten Größe und verarbeitet diesen Stapel vor dem nächsten.',
        analogyText: (batchSize) => `Ein Fließband in einer Fabrik, das wartet, bis ein Karton mit ${batchSize} Artikeln gefüllt ist, bevor er verschlossen und versandt wird.`,
        processBatchesBtn: 'In Stapeln verarbeiten',
        batchedResultsTitle: 'Stapelergebnisse:',
        processingBatchText: 'Stapel wird verarbeitet...',
        batchLabel: (index) => `Stapel ${index}:`,
      },
    },
  },
};
