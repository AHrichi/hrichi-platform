import type { SiteLanguage } from '@ah/shared/state';

export interface ErrorHandlingCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  focusAriaLabel: string;
  focusOptions: {
    all: string;
    replace: string;
    rethrow: string;
    retry: string;
    retryWhen: string;
  };
  configTitle: string;
  retryDelayLabel: string;
  maxRetriesLabel: string;
  archTitle: string;
  archBadge: string;
  archSubtitle: string;
  archPitfallStrong: string;
  archPitfallText: string;
  marbleTitle: string;
  marbleDescription: string;
  outerLaneLabel: string;
  outerLaneBadge: string;
  innerLaneLabel: string;
  innerLaneBadge: string;
  operatorDescription: string;
  operatorFormula: string;
  useCaseStrong: string;
  replace: {
    title: string;
    description: string;
    useCaseText: string;
    fetchSuccessBtn: string;
    fetchFailBtn: string;
    placeholder: string;
    successMsg: string;
    errorPrefix: string;
  };
  rethrow: {
    title: string;
    description: string;
    useCaseText: string;
    fetchRethrowBtn: string;
    placeholder: string;
    errorPrefix: string;
  };
  retry: {
    title: string;
    description: string;
    useCaseText: string;
    attemptFetchBtn: (retries: number) => string;
    attemptingText: (attempt: number) => string;
    placeholder: string;
    failedMsg: (attempts: number, msg: string) => string;
  };
  retryWhen: {
    title: string;
    description: string;
    migrationStrong: string;
    migrationText: string;
    attemptFetchBtn: string;
    attemptingText: (attempt: number) => string;
    placeholder: string;
    failedMsg: (msg: string) => string;
  };
}

export interface CombiningStreamsCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  focusAriaLabel: string;
  focusOptions: {
    all: string;
    withLatestFrom: string;
    combineLatest: string;
  };
  comparisonTitle: string;
  comparisonBadge: string;
  comparisonSubtitle: string;
  distinctionStrong: string;
  distinctionText: string;
  useCaseStrong: string;
  emitPrefix: string;
  withLatestFrom: {
    title: string;
    description: string;
    useCaseText: string;
    primaryStreamTitle: string;
    secondaryStreamTitle: string;
    latestFromSecondaryLabel: string;
    marbleTitle: string;
    marbleDescription: string;
    primaryLaneLabel: string;
    primaryLaneBadge: string;
    secondaryLaneLabel: string;
    secondaryLaneBadge: string;
    outputLaneLabel: string;
    outputLaneBadge: string;
    operatorDescription: string;
  };
  combineLatest: {
    title: string;
    description: string;
    useCaseText: string;
    source1Title: string;
    source2Title: string;
    latestFromSource1Label: string;
    latestFromSource2Label: string;
    marbleTitle: string;
    marbleDescription: string;
    source1LaneLabel: string;
    source1LaneBadge: string;
    source2LaneLabel: string;
    source2LaneBadge: string;
    outputLaneLabel: string;
    outputLaneBadge: string;
    operatorDescription: string;
  };
}

export interface TransformingStreamsCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  focusAriaLabel: string;
  focusOptions: {
    all: string;
    concatMap: string;
    switchMap: string;
    mergeMap: string;
    exhaustMap: string;
  };
  configTitle: string;
  sourceEmissionsLabel: string;
  sourceIntervalLabel: string;
  innerValuesLabel: string;
  innerIntervalLabel: string;
  startEmittingBtn: string;
  sourceStreamLabel: string;
  innerStreamsLabel: string;
  outputAnimatedLabel: string;
  finalOutputLabel: string;
  logsLabel: string;
  analogyStrong: string;
  triggersBadge: string;
  concatMap: {
    title: string;
    description: string;
    analogyText: string;
    marbleTitle: string;
    marbleDescription: string;
    outLaneLabel: string;
    outLaneBadge: string;
    operatorDescription: string;
  };
  switchMap: {
    title: string;
    description: string;
    analogyText: string;
    marbleTitle: string;
    marbleDescription: string;
    outLaneLabel: string;
    outLaneBadge: string;
    operatorDescription: string;
  };
  mergeMap: {
    title: string;
    description: string;
    analogyText: string;
    marbleTitle: string;
    marbleDescription: string;
    outLaneLabel: string;
    outLaneBadge: string;
    operatorDescription: string;
  };
  exhaustMap: {
    title: string;
    description: string;
    analogyText: string;
    marbleTitle: string;
    marbleDescription: string;
    outLaneLabel: string;
    outLaneBadge: string;
    operatorDescription: string;
  };
}

export interface SharingDataCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  focusAriaLabel: string;
  focusOptions: {
    all: string;
    input: string;
    output: string;
    service: string;
    viewChild: string;
  };
  analogyStrong: string;
  parentComponentLabel: string;
  childComponentLabel: string;
  senderComponentLabel: string;
  receiverComponentLabel: string;
  receivedLabel: string;
  input: {
    title: string;
    description: string;
    analogyText: string;
    dataToSendLabel: string;
    inputPlaceholder: string;
    sendToChildBtn: string;
  };
  output: {
    title: string;
    description: string;
    analogyText: string;
    sendDataToParentBtn: string;
  };
  service: {
    title: string;
    description: string;
    analogyText: string;
    sendViaServiceBtn: string;
  };
  viewChild: {
    title: string;
    description: string;
    analogyText: string;
    triggerHighlightBtn: string;
    controlledByParentText: string;
  };
}

export interface Tier1Copy {
  errorHandling: ErrorHandlingCopy;
  combiningStreams: CombiningStreamsCopy;
  transformingStreams: TransformingStreamsCopy;
  sharingData: SharingDataCopy;
}

export const TIER1_COPY: Record<SiteLanguage, Tier1Copy> = {
  en: {
    errorHandling: {
      eyebrow: 'Chapter 4 · Resilient Streams',
      heading: 'Exercise: Error Handling',
      lead: 'Master error recovery with catchError (fallback replacement), throwError (catch & rethrow), and modern delay-based retry policies.',
      focusAriaLabel: 'Filter error handling strategy',
      focusOptions: {
        all: 'All Error Strategies',
        replace: 'Catch & Replace',
        rethrow: 'Catch & Rethrow',
        retry: 'Modern Retry',
        retryWhen: 'Legacy RetryWhen',
      },
      configTitle: 'Retry Configuration (Applies to retry strategies)',
      retryDelayLabel: 'Retry Delay (ms):',
      maxRetriesLabel: 'Max Retries:',
      archTitle: 'Architecture Rule: Inner vs. Outer Error Handling',
      archBadge: 'Critical Best Practice',
      archSubtitle: 'The most widespread bug in reactive Angular applications is attaching catchError to the wrong stream level.',
      archPitfallStrong: 'The Pitfall:',
      archPitfallText: 'When an Observable encounters an unhandled error notification, the contract of RxJS terminates the stream permanently. If you place catchError after a switchMap (on the outer stream), any HTTP error permanently destroys user keystrokes!',
      marbleTitle: 'Inner vs. Outer Stream Resilience',
      marbleDescription: 'Isolating catchError inside switchMap prevents catastrophic termination of outer UI streams',
      outerLaneLabel: 'Outer Search Stream (keystrokes$)',
      outerLaneBadge: 'User Events',
      innerLaneLabel: 'Inner HTTP Stream (fetch$)',
      innerLaneBadge: 'Inner catchError',
      operatorDescription: 'Catching errors INSIDE the switchMap maintains outer stream vitality, allowing future user keystrokes to succeed.',
      operatorFormula: 'Inner error caught -> Outer stream stays alive',
      useCaseStrong: 'Production Use Case:',
      replace: {
        title: 'The catchError Operator (Replace Strategy)',
        description: 'Catch an error from an upstream Observable and replace it with a graceful fallback value.',
        useCaseText: 'Degrading gracefully when an auxiliary microservice fails (e.g. recommendation carousel, profile avatar, cached weather). Return of(FALLBACK_DATA) so the rest of the dashboard remains operational.',
        fetchSuccessBtn: 'Fetch Success',
        fetchFailBtn: 'Fetch with Failure',
        placeholder: 'Click a button to test catchError replacement.',
        successMsg: '✅ Data fetched successfully!',
        errorPrefix: '❌ Error handled:',
      },
      rethrow: {
        title: 'The throwError Operator (Rethrow Strategy)',
        description: 'Perform a logging side-effect or telemetry dispatch when an error occurs, then rethrow it downstream.',
        useCaseText: 'HTTP interceptors, global telemetry error loggers, or form submission boundaries where a toast is displayed, but the caller still needs the rejected Promise or error notification.',
        fetchRethrowBtn: 'Fetch with Rethrow',
        placeholder: 'Click to trigger an error that is logged and rethrown.',
        errorPrefix: '❌ Rethrown error captured by UI:',
      },
      retry: {
        title: 'The retry Operator (Modern Strategy)',
        description: 'Retry a failing stream with configurable attempts and a delay timer (modern RxJS 7+ configuration).',
        useCaseText: 'Network instability on mobile devices, transient gateway errors (HTTP 502/503/504), rate limit cooldowns (HTTP 429), or WebSocket reconnection handshakes.',
        attemptFetchBtn: (retries) => `Attempt Fetch (retries ${retries}x)`,
        attemptingText: (attempt) => `Attempting fetch (Attempt: ${attempt})...`,
        placeholder: 'Click to trigger modern retry policy.',
        failedMsg: (attempts, msg) => `❌ Failed after ${attempts} attempts. Error: ${msg}`,
      },
      retryWhen: {
        title: 'The retryWhen Operator (Legacy)',
        description: 'Demonstrates delayed retry using RxJS 6 retryWhen and delayWhen notification streams.',
        migrationStrong: 'Migration Note:',
        migrationText: 'In modern Angular / RxJS 7+, retryWhen is officially deprecated in favor of retry({ delay }). Use retry({ delay }) for cleaner, type-safe retry logic.',
        attemptFetchBtn: 'Attempt Fetch with RetryWhen',
        attemptingText: (attempt) => `Attempting fetch (Attempt: ${attempt})...`,
        placeholder: 'Click to trigger legacy retryWhen stream.',
        failedMsg: (msg) => `❌ Failed after retries. Error: ${msg}`,
      },
    },
    combiningStreams: {
      eyebrow: 'Chapter 5 · Stream Combination',
      heading: 'Exercise: Combining Streams',
      lead: 'Explore the difference between trigger-based sampling with withLatestFrom and multi-source reactivity with combineLatest.',
      focusAriaLabel: 'Filter combining operator',
      focusOptions: {
        all: 'All Combining Operators',
        withLatestFrom: 'withLatestFrom',
        combineLatest: 'combineLatest',
      },
      comparisonTitle: 'Combination Mental Model: Master-Slave vs. Democratic',
      comparisonBadge: 'Architecture Guide',
      comparisonSubtitle: 'Choosing the right combination operator prevents redundant network calls, timing glitches, and silent deadlocks.',
      distinctionStrong: 'The Core Distinction:',
      distinctionText: 'withLatestFrom is a master-slave relationship (only the master stream triggers emissions). combineLatest is democratic (any source emission triggers a recalculation, provided all sources have emitted at least once).',
      useCaseStrong: 'Production Use Case:',
      emitPrefix: 'Emit',
      withLatestFrom: {
        title: 'The withLatestFrom Operator',
        description: 'Emits only when the primary stream emits, combining its value with the latest value from the secondary stream.',
        useCaseText: 'User clicks a "Save" button. The click event is the primary trigger, and it samples the latest form values and auth credentials without creating multiple triggers when the form inputs change.',
        primaryStreamTitle: 'Primary Stream (Trigger)',
        secondaryStreamTitle: 'Secondary Stream (Sampled)',
        latestFromSecondaryLabel: 'Latest from Secondary:',
        marbleTitle: 'withLatestFrom Marble Visualizer',
        marbleDescription: 'Primary stream drives emissions; secondary stream provides instant snapshot',
        primaryLaneLabel: 'Primary Stream (Trigger)',
        primaryLaneBadge: 'Master',
        secondaryLaneLabel: 'Secondary Stream (Sampled)',
        secondaryLaneBadge: 'Snapshot',
        outputLaneLabel: 'Combined Output (withLatestFrom)',
        outputLaneBadge: 'Result',
        operatorDescription: 'Emits ONLY when the primary trigger stream emits, reading the most recent value from secondary$.',
      },
      combineLatest: {
        title: 'The combineLatest Operator',
        description: 'Emits an array of the latest values from all source streams whenever any source stream emits (once each has emitted at least once).',
        useCaseText: 'Complex dashboard filters where changing the search box, the dropdown category, or the date range should immediately recalculate and re-fetch filtered grid items.',
        source1Title: 'Source 1 (Strings)',
        source2Title: 'Source 2 (Numbers)',
        latestFromSource1Label: 'Latest from Source 1:',
        latestFromSource2Label: 'Latest from Source 2:',
        marbleTitle: 'combineLatest Marble Visualizer',
        marbleDescription: 'Multi-source democratic synchronization: emits whenever any stream updates',
        source1LaneLabel: 'Source 1 (Strings)',
        source1LaneBadge: 'Stream A',
        source2LaneLabel: 'Source 2 (Numbers)',
        source2LaneBadge: 'Stream B',
        outputLaneLabel: 'Combined Stream (combineLatest$)',
        outputLaneBadge: 'Democratic Output',
        operatorDescription: 'Re-emits whenever EITHER source emits, as long as each source has emitted at least once.',
      },
    },
    transformingStreams: {
      eyebrow: 'Chapter 6 · Higher-Order Mapping',
      heading: 'Exercise: Transforming Streams',
      lead: 'Explore how concatMap, switchMap, mergeMap, and exhaustMap handle concurrent inner streams. Filter to a single operator to inspect its timeline and marble behavior in full detail.',
      focusAriaLabel: 'Filter transforming operator',
      focusOptions: {
        all: 'All Operators',
        concatMap: 'concatMap',
        switchMap: 'switchMap',
        mergeMap: 'mergeMap',
        exhaustMap: 'exhaustMap',
      },
      configTitle: 'Source Stream Configuration',
      sourceEmissionsLabel: 'Source Emissions:',
      sourceIntervalLabel: 'Source Interval (ms):',
      innerValuesLabel: 'Values per Inner Stream:',
      innerIntervalLabel: 'Inner Interval (ms):',
      startEmittingBtn: 'Start Emitting',
      sourceStreamLabel: 'Source Stream',
      innerStreamsLabel: 'Inner Streams',
      outputAnimatedLabel: 'Output Stream (Animated)',
      finalOutputLabel: 'Final Output',
      logsLabel: 'Logs',
      analogyStrong: 'Analogy:',
      triggersBadge: 'Triggers',
      concatMap: {
        title: 'The concatMap Operator',
        description: 'Maps each source value to an inner Observable and processes them in sequence. Guarantees order.',
        analogyText: 'A meticulous chef following a recipe. They complete one step (e.g., chopping vegetables) before starting the next (e.g., sautéing). The order is crucial.',
        marbleTitle: 'concatMap Stream Lifecycle',
        marbleDescription: 'Sequential execution: subsequent inner streams queue until active stream completes',
        outLaneLabel: 'Ordered Output (concatMap)',
        outLaneBadge: 'Sequential',
        operatorDescription: 'Sequentially processes each inner Observable in strict FIFO order.',
      },
      switchMap: {
        title: 'The switchMap Operator',
        description: 'Switches to a new inner Observable when the source emits, cancelling the previous one. Ideal for cancellation.',
        analogyText: 'Typing in a search bar. You only care about the results for the latest thing you typed. Old searches are cancelled and discarded.',
        marbleTitle: 'switchMap Stream Lifecycle',
        marbleDescription: 'Cancellation policy: active inner stream is unsubscribed upon new source emission',
        outLaneLabel: 'Latest Output (switchMap)',
        outLaneBadge: 'Unsubscribed Prev',
        operatorDescription: 'Cancels the previous inner subscription immediately upon receiving a new source value.',
      },
      mergeMap: {
        title: 'The mergeMap Operator',
        description: 'Runs multiple inner Observables concurrently without cancelling or queuing. Order depends on timing.',
        analogyText: 'A busy intersection with multiple lanes flowing at the same time. Cars from all directions merge into the main flow as they arrive.',
        marbleTitle: 'mergeMap Stream Lifecycle',
        marbleDescription: 'Concurrent interleaving: parallel inner streams emit independently as values resolve',
        outLaneLabel: 'Parallel Output (mergeMap)',
        outLaneBadge: 'Interleaved',
        operatorDescription: 'Subscribes concurrently to all inner Observables and emits their values in parallel as they arrive.',
      },
      exhaustMap: {
        title: 'The exhaustMap Operator',
        description: 'Ignores new source values while an inner Observable is currently active. Ideal for spam prevention.',
        analogyText: 'A revolving door that only lets one person enter at a time. Anyone attempting to enter while it is turning must wait or is turned away.',
        marbleTitle: 'exhaustMap Stream Lifecycle',
        marbleDescription: 'Spam prevention: new source emissions dropped while inner stream is in flight',
        outLaneLabel: 'Ignored Spam Output (exhaustMap)',
        outLaneBadge: 'Guarded',
        operatorDescription: 'Ignores incoming source emissions while a previously started inner Observable is still executing.',
      },
    },
    sharingData: {
      eyebrow: 'Angular Architecture · Component Communication',
      heading: 'Exercise: Sharing Data Between Components',
      lead: 'Compare unidirectional signal inputs, event-driven signal outputs, shared reactive services, and viewChild component queries.',
      focusAriaLabel: 'Filter communication pattern',
      focusOptions: {
        all: 'All Communication Patterns',
        input: 'Parent to Child (input)',
        output: 'Child to Parent (output)',
        service: 'Shared Service',
        viewChild: 'Component Query (viewChild)',
      },
      analogyStrong: 'Analogy:',
      parentComponentLabel: 'Parent Component',
      childComponentLabel: 'Child Component',
      senderComponentLabel: 'Sender Component',
      receiverComponentLabel: 'Receiver Component',
      receivedLabel: 'Received:',
      input: {
        title: 'Parent to Child: input()',
        description: 'The parent component passes data down to the child using a declarative signal input binding.',
        analogyText: 'A parent giving a child a specific toy to play with. The data flow is one-way, from parent down to child.',
        dataToSendLabel: 'Data to send:',
        inputPlaceholder: 'Type message to child...',
        sendToChildBtn: 'Send to Child',
      },
      output: {
        title: 'Child to Parent: output()',
        description: 'The child component emits a typed event that the parent listens and reacts to.',
        analogyText: 'A child notifying a parent of an event. The child initiates communication, and the parent updates its state in response.',
        sendDataToParentBtn: 'Send Data to Parent',
      },
      service: {
        title: 'Sibling Communication: Shared Service',
        description: 'Components with no direct parent-child relationship communicate via an injected singleton service.',
        analogyText: 'A shared community bulletin board. Anyone can post a notice (sender), and anyone interested can read updates (receiver).',
        sendViaServiceBtn: 'Send via Service',
      },
      viewChild: {
        title: 'Component Reference: viewChild()',
        description: 'The parent queries a direct signal reference to an embedded child component to invoke its public methods.',
        analogyText: 'A conductor cueing a specific musician in an orchestra. The conductor directly signals the musician to play their solo.',
        triggerHighlightBtn: "Trigger Child's Highlight Method",
        controlledByParentText: 'I can be controlled by the parent!',
      },
    },
  },
  fr: {
    errorHandling: {
      eyebrow: 'Chapitre 4 · Flux résilients',
      heading: 'Exercice : Gestion des erreurs',
      lead: 'Maîtrisez la récupération sur erreur avec catchError (valeur de repli), throwError (interception et relance) et les politiques modernes de retry temporisé.',
      focusAriaLabel: 'Filtrer la stratégie de gestion des erreurs',
      focusOptions: {
        all: 'Toutes les stratégies',
        replace: 'Intercepter et remplacer',
        rethrow: 'Intercepter et relancer',
        retry: 'Retry moderne',
        retryWhen: 'RetryWhen historique',
      },
      configTitle: 'Configuration des tentatives (s’applique aux stratégies retry)',
      retryDelayLabel: 'Délai entre tentatives (ms) :',
      maxRetriesLabel: 'Tentatives max :',
      archTitle: 'Règle d’architecture : gestion d’erreur interne vs externe',
      archBadge: 'Bonne pratique critique',
      archSubtitle: 'Le bug le plus répandu dans les applications Angular réactives consiste à placer catchError au mauvais niveau de flux.',
      archPitfallStrong: 'Le piège :',
      archPitfallText: 'Lorsqu’un Observable rencontre une erreur non gérée, le contrat RxJS termine définitivement le flux. Si vous placez catchError après un switchMap (sur le flux externe), la moindre erreur HTTP détruit définitivement l’écoute des frappes clavier !',
      marbleTitle: 'Résilience du flux interne vs externe',
      marbleDescription: 'Isoler catchError à l’intérieur de switchMap évite l’arrêt catastrophique des flux UI externes',
      outerLaneLabel: 'Flux de recherche externe (keystrokes$)',
      outerLaneBadge: 'Événements UI',
      innerLaneLabel: 'Flux HTTP interne (fetch$)',
      innerLaneBadge: 'catchError interne',
      operatorDescription: 'Intercepter les erreurs À L’INTÉRIEUR du switchMap préserve la vitalité du flux externe pour les prochaines saisies.',
      operatorFormula: 'Erreur interne interceptée -> Le flux externe reste actif',
      useCaseStrong: 'Cas d’usage en production :',
      replace: {
        title: 'L’opérateur catchError (Stratégie de remplacement)',
        description: 'Intercepte une erreur d’un Observable amont et la remplace par une valeur de repli sûre.',
        useCaseText: 'Dégradation gracieuse lorsqu’un microservice auxiliaire échoue (carrousel de recommandations, avatar, météo en cache). Retourner of(FALLBACK_DATA) maintient le tableau de bord opérationnel.',
        fetchSuccessBtn: 'Requête réussie',
        fetchFailBtn: 'Requête en échec',
        placeholder: 'Cliquez sur un bouton pour tester le remplacement via catchError.',
        successMsg: '✅ Données récupérées avec succès !',
        errorPrefix: '❌ Erreur gérée :',
      },
      rethrow: {
        title: 'L’opérateur throwError (Stratégie de relance)',
        description: 'Exécute un effet de bord (journalisation ou télémétrie) lors d’une erreur, puis la relance en aval.',
        useCaseText: 'Intercepteurs HTTP, journalisation globale d’erreurs ou soumission de formulaires où un toast est affiché tout en propageant l’erreur au composant appelant.',
        fetchRethrowBtn: 'Requête avec relance',
        placeholder: 'Cliquez pour déclencher une erreur journalisée puis relancée.',
        errorPrefix: '❌ Erreur relancée capturée par l’UI :',
      },
      retry: {
        title: 'L’opérateur retry (Stratégie moderne)',
        description: 'Réessaie un flux en échec avec un nombre de tentatives et un délai configurables (RxJS 7+).',
        useCaseText: 'Instabilité réseau mobile, erreurs passerelle transitoires (HTTP 502/503/504), limitation de débit (HTTP 429) ou reconnexion WebSocket.',
        attemptFetchBtn: (retries) => `Tenter la requête (${retries}x tentatives)`,
        attemptingText: (attempt) => `Tentative en cours (Essai : ${attempt})...`,
        placeholder: 'Cliquez pour déclencher la politique moderne de retry.',
        failedMsg: (attempts, msg) => `❌ Échec après ${attempts} tentatives. Erreur : ${msg}`,
      },
      retryWhen: {
        title: 'L’opérateur retryWhen (Historique)',
        description: 'Illustre la nouvelle tentative différée avec les flux de notification retryWhen et delayWhen de RxJS 6.',
        migrationStrong: 'Note de migration :',
        migrationText: 'Dans Angular moderne / RxJS 7+, retryWhen est déprécié au profit de retry({ delay }). Privilégiez retry({ delay }) pour une logique plus propre et typée.',
        attemptFetchBtn: 'Tenter avec RetryWhen',
        attemptingText: (attempt) => `Tentative en cours (Essai : ${attempt})...`,
        placeholder: 'Cliquez pour déclencher le flux retryWhen historique.',
        failedMsg: (msg) => `❌ Échec après nouvelles tentatives. Erreur : ${msg}`,
      },
    },
    combiningStreams: {
      eyebrow: 'Chapitre 5 · Combinaison de flux',
      heading: 'Exercice : Combiner des flux',
      lead: 'Explorez la différence entre l’échantillonnage déclenché par un flux maître avec withLatestFrom et la réactivité multi-sources avec combineLatest.',
      focusAriaLabel: 'Filtrer l’opérateur de combinaison',
      focusOptions: {
        all: 'Tous les opérateurs',
        withLatestFrom: 'withLatestFrom',
        combineLatest: 'combineLatest',
      },
      comparisonTitle: 'Modèle mental : Maître-Esclave vs Démocratique',
      comparisonBadge: 'Guide d’architecture',
      comparisonSubtitle: 'Choisir le bon opérateur de combinaison évite les appels réseau redondants, les glitches temporels et les blocages silencieux.',
      distinctionStrong: 'La distinction fondamentale :',
      distinctionText: 'withLatestFrom établit une relation maître-esclave (seul le flux maître déclenche une émission). combineLatest est démocratique (toute émission d’une source recalcule l’ensemble, dès que chaque source a émis au moins une fois).',
      useCaseStrong: 'Cas d’usage en production :',
      emitPrefix: 'Émettre',
      withLatestFrom: {
        title: 'L’opérateur withLatestFrom',
        description: 'N’émet que lorsque le flux primaire émet, en combinant sa valeur avec la dernière valeur du flux secondaire.',
        useCaseText: 'L’utilisateur clique sur « Enregistrer ». Le clic est le déclencheur primaire qui échantillonne les dernières valeurs du formulaire sans déclencher de requête à chaque frappe.',
        primaryStreamTitle: 'Flux primaire (Déclencheur)',
        secondaryStreamTitle: 'Flux secondaire (Échantillonné)',
        latestFromSecondaryLabel: 'Dernière valeur secondaire :',
        marbleTitle: 'Visualiseur de billes withLatestFrom',
        marbleDescription: 'Le flux primaire pilote les émissions ; le flux secondaire fournit un instantané',
        primaryLaneLabel: 'Flux primaire (Déclencheur)',
        primaryLaneBadge: 'Maître',
        secondaryLaneLabel: 'Flux secondaire (Échantillonné)',
        secondaryLaneBadge: 'Instantané',
        outputLaneLabel: 'Sortie combinée (withLatestFrom)',
        outputLaneBadge: 'Résultat',
        operatorDescription: 'Émet UNIQUEMENT lorsque le flux primaire émet, en lisant la valeur la plus récente de secondary$.',
      },
      combineLatest: {
        title: 'L’opérateur combineLatest',
        description: 'Émet un tableau des dernières valeurs de toutes les sources dès qu’une source émet (après au moins une émission de chacune).',
        useCaseText: 'Filtres de tableau de bord complexes où modifier la recherche, la catégorie ou la période recalcule et recharge immédiatement la grille.',
        source1Title: 'Source 1 (Chaînes)',
        source2Title: 'Source 2 (Nombres)',
        latestFromSource1Label: 'Dernière valeur Source 1 :',
        latestFromSource2Label: 'Dernière valeur Source 2 :',
        marbleTitle: 'Visualiseur de billes combineLatest',
        marbleDescription: 'Synchronisation démocratique multi-sources : émet dès qu’un flux est mis à jour',
        source1LaneLabel: 'Source 1 (Chaînes)',
        source1LaneBadge: 'Flux A',
        source2LaneLabel: 'Source 2 (Nombres)',
        source2LaneBadge: 'Flux B',
        outputLaneLabel: 'Flux combiné (combineLatest$)',
        outputLaneBadge: 'Sortie démocratique',
        operatorDescription: 'Ré-émet dès que L’UNE des sources émet, à condition que chaque source ait émis au moins une fois.',
      },
    },
    transformingStreams: {
      eyebrow: 'Chapitre 6 · Projection d’ordre supérieur',
      heading: 'Exercice : Transformer des flux',
      lead: 'Découvrez comment concatMap, switchMap, mergeMap et exhaustMap gèrent les flux internes concurrents. Filtrez un opérateur pour inspecter sa chronologie en détail.',
      focusAriaLabel: 'Filtrer l’opérateur de transformation',
      focusOptions: {
        all: 'Tous les opérateurs',
        concatMap: 'concatMap',
        switchMap: 'switchMap',
        mergeMap: 'mergeMap',
        exhaustMap: 'exhaustMap',
      },
      configTitle: 'Configuration du flux source',
      sourceEmissionsLabel: 'Émissions source :',
      sourceIntervalLabel: 'Intervalle source (ms) :',
      innerValuesLabel: 'Valeurs par flux interne :',
      innerIntervalLabel: 'Intervalle interne (ms) :',
      startEmittingBtn: 'Démarrer les émissions',
      sourceStreamLabel: 'Flux source',
      innerStreamsLabel: 'Flux internes',
      outputAnimatedLabel: 'Flux de sortie (Animé)',
      finalOutputLabel: 'Sortie finale',
      logsLabel: 'Journaux',
      analogyStrong: 'Analogie :',
      triggersBadge: 'Déclencheurs',
      concatMap: {
        title: 'L’opérateur concatMap',
        description: 'Projette chaque valeur source vers un Observable interne et les traite séquentiellement. Garantit l’ordre.',
        analogyText: 'Un chef méticuleux qui suit une recette étape par étape : il termine de couper les légumes avant de les faire sauter. L’ordre est strictement respecté.',
        marbleTitle: 'Cycle de vie concatMap',
        marbleDescription: 'Exécution séquentielle : les flux internes suivants patientent en file d’attente',
        outLaneLabel: 'Sortie ordonnée (concatMap)',
        outLaneBadge: 'Séquentiel',
        operatorDescription: 'Traite séquentiellement chaque Observable interne selon un ordre strict FIFO.',
      },
      switchMap: {
        title: 'L’opérateur switchMap',
        description: 'Bascule vers un nouvel Observable interne à chaque émission source en annulant le précédent. Idéal pour l’annulation.',
        analogyText: 'Saisir dans une barre de recherche : seuls les résultats de la dernière saisie comptent. Les recherches précédentes sont annulées.',
        marbleTitle: 'Cycle de vie switchMap',
        marbleDescription: 'Politique d’annulation : le flux interne actif est désabonné dès une nouvelle émission source',
        outLaneLabel: 'Dernière sortie (switchMap)',
        outLaneBadge: 'Préc. annulé',
        operatorDescription: 'Annule immédiatement la souscription interne précédente dès réception d’une nouvelle valeur source.',
      },
      mergeMap: {
        title: 'L’opérateur mergeMap',
        description: 'Exécute plusieurs Observables internes en parallèle sans annulation ni file d’attente.',
        analogyText: 'Un carrefour à plusieurs voies où les véhicules de toutes directions s’insèrent dans le flux principal dès leur arrivée.',
        marbleTitle: 'Cycle de vie mergeMap',
        marbleDescription: 'Entrelacement concurrent : les flux internes parallèles émettent indépendamment',
        outLaneLabel: 'Sortie parallèle (mergeMap)',
        outLaneBadge: 'Entrelacé',
        operatorDescription: 'Souscrit en parallèle à tous les Observables internes et émet leurs valeurs au fil de l’eau.',
      },
      exhaustMap: {
        title: 'L’opérateur exhaustMap',
        description: 'Ignore les nouvelles valeurs sources tant qu’un Observable interne est actif. Idéal contre le spam de clics.',
        analogyText: 'Une porte tambour qui ne laisse entrer qu’une personne à la fois : toute tentative pendant la rotation est ignorée.',
        marbleTitle: 'Cycle de vie exhaustMap',
        marbleDescription: 'Anti-spam : les nouvelles émissions sources sont ignorées tant que le flux interne est en cours',
        outLaneLabel: 'Sortie protégée (exhaustMap)',
        outLaneBadge: 'Protégé',
        operatorDescription: 'Ignore les émissions sources entrantes tant qu’un Observable interne précédent est encore en cours d’exécution.',
      },
    },
    sharingData: {
      eyebrow: 'Architecture Angular · Communication entre composants',
      heading: 'Exercice : Partager des données entre composants',
      lead: 'Comparez les entrées signal unidirectionnelles, les sorties d’événements, les services réactifs partagés et les requêtes viewChild.',
      focusAriaLabel: 'Filtrer le modèle de communication',
      focusOptions: {
        all: 'Tous les modèles',
        input: 'Parent vers Enfant (input)',
        output: 'Enfant vers Parent (output)',
        service: 'Service partagé',
        viewChild: 'Requête composant (viewChild)',
      },
      analogyStrong: 'Analogie :',
      parentComponentLabel: 'Composant Parent',
      childComponentLabel: 'Composant Enfant',
      senderComponentLabel: 'Composant Émetteur',
      receiverComponentLabel: 'Composant Récepteur',
      receivedLabel: 'Reçu :',
      input: {
        title: 'Parent vers Enfant : input()',
        description: 'Le composant parent transmet des données à l’enfant via une liaison déclarative signal input.',
        analogyText: 'Un parent qui confie un jouet à son enfant. Le flux de données est unidirectionnel, du parent vers l’enfant.',
        dataToSendLabel: 'Données à envoyer :',
        inputPlaceholder: 'Saisissez un message pour l’enfant...',
        sendToChildBtn: 'Envoyer à l’enfant',
      },
      output: {
        title: 'Enfant vers Parent : output()',
        description: 'Le composant enfant émet un événement typé auquel le parent écoute et réagit.',
        analogyText: 'Un enfant qui prévient son parent d’un événement. L’enfant initie la communication et le parent met à jour son état.',
        sendDataToParentBtn: 'Envoyer au parent',
      },
      service: {
        title: 'Communication entre frères : Service partagé',
        description: 'Des composants sans relation directe parent-enfant communiquent via un service singleton injecté.',
        analogyText: 'Un tableau d’affichage communautaire : chacun peut publier une annonce (émetteur) et chacun peut lire les mises à jour (récepteur).',
        sendViaServiceBtn: 'Envoyer via le service',
      },
      viewChild: {
        title: 'Référence de composant : viewChild()',
        description: 'Le parent obtient une référence signal directe vers un composant enfant intégré pour appeler ses méthodes publiques.',
        analogyText: 'Un chef d’orchestre qui donne le départ à un musicien précis pour jouer son solo.',
        triggerHighlightBtn: 'Déclencher la mise en évidence de l’enfant',
        controlledByParentText: 'Je peux être contrôlé par le parent !',
      },
    },
  },
  ar: {
    errorHandling: {
      eyebrow: 'الفصل 4 · التدفقات المرنة',
      heading: 'تمرين: معالجة الأخطاء',
      lead: 'أتقن استعادة الأخطاء باستخدام catchError (القيمة البديلة)، وthrowError (الالتقاط وإعادة الرمي)، وسياسات إعادة المحاولة الحديثة المعتمدة على التأخير.',
      focusAriaLabel: 'تصفية استراتيجية معالجة الأخطاء',
      focusOptions: {
        all: 'جميع استراتيجيات الأخطاء',
        replace: 'الالتقاط والاستبدال',
        rethrow: 'الالتقاط وإعادة الرمي',
        retry: 'إعادة المحاولة الحديثة',
        retryWhen: 'RetryWhen التقليدي',
      },
      configTitle: 'إعدادات إعادة المحاولة (تنطبق على استراتيجيات إعادة المحاولة)',
      retryDelayLabel: 'تأخير إعادة المحاولة (مللي ثانية):',
      maxRetriesLabel: 'الحد الأقصى للمحاولات:',
      archTitle: 'قاعدة معمارية: معالجة الأخطاء الداخلية مقابل الخارجية',
      archBadge: 'ممارسة حرجة',
      archSubtitle: 'الخطأ الأكثر شيوعًا في تطبيقات Angular التفاعلية هو ربط catchError بمستوى التدفق الخاطئ.',
      archPitfallStrong: 'الفخ المعماري:',
      archPitfallText: 'عندما يواجه Observable خطأ غير معالج، فإن عقد RxJS ينهي التدفق نهائيًا. إذا وضعت catchError بعد switchMap (على التدفق الخارجي)، فإن أي خطأ HTTP يدمر استماع نقرات المفاتيح للأبد!',
      marbleTitle: 'مرونة التدفق الداخلي مقابل الخارجي',
      marbleDescription: 'عزل catchError داخل switchMap يمنع الإنهاء الكارثي لتدفقات واجهة المستخدم الخارجية',
      outerLaneLabel: 'تدفق البحث الخارجي (keystrokes$)',
      outerLaneBadge: 'أحداث المستخدم',
      innerLaneLabel: 'تدفق HTTP الداخلي (fetch$)',
      innerLaneBadge: 'catchError داخلي',
      operatorDescription: 'التقاط الأخطاء داخل switchMap يحافظ على حيوية التدفق الخارجي، مما يسمح بنجاح عمليات البحث اللاحقة.',
      operatorFormula: 'التقاط الخطأ الداخلي -> بقاء التدفق الخارجي نشطًا',
      useCaseStrong: 'حالة استخدام إنتاجية:',
      replace: {
        title: 'المعامل catchError (استراتيجية الاستبدال)',
        description: 'التقط خطأً من Observable منبع واستبدله بقيمة احتياطية آمنة.',
        useCaseText: 'التدهور السلس عند فشل خدمة مصغرة مساعدة (مثل شريط التوصيات أو الصورة الرمزية أو حالة الطقس المخزنة). إرجاع of(FALLBACK_DATA) يبقي بقية لوحة التحكم قيد التشغيل.',
        fetchSuccessBtn: 'جلب ناجح',
        fetchFailBtn: 'جلب مع فشل',
        placeholder: 'انقر فوق زر لاختبار الاستبدال باستخدام catchError.',
        successMsg: '✅ تم جلب البيانات بنجاح!',
        errorPrefix: '❌ تمت معالجة الخطأ:',
      },
      rethrow: {
        title: 'المعامل throwError (استراتيجية إعادة الرمي)',
        description: 'نفّذ أثرًا جانبيًا للتسجيل أو القياس عن بُعد عند حدوث خطأ، ثم أعد رميه للمصب.',
        useCaseText: 'معترضات HTTP أو مسجلات الأخطاء الشاملة أو حدود إرسال النماذج حيث يتم عرض إشعار مع استمرار حاجة المستدعي لتلقي الخطأ.',
        fetchRethrowBtn: 'جلب مع إعادة الرمي',
        placeholder: 'انقر لإطلاق خطأ يتم تسجيله وإعادة رميه.',
        errorPrefix: '❌ خطأ معاد رميه التقطته الواجهة:',
      },
      retry: {
        title: 'المعامل retry (الاستراتيجية الحديثة)',
        description: 'أعد محاولة تدفق فاشل بعدد محاولات ومؤقت تأخير قابلين للتكوين (RxJS 7+).',
        useCaseText: 'عدم استقرار الشبكة على الهواتف، أخطاء البوابة المؤقتة (HTTP 502/503/504)، فترات تهدئة حدود المعدل (HTTP 429)، أو إعادة اتصال WebSocket.',
        attemptFetchBtn: (retries) => `محاولة الجلب (إعادة ${retries} مرات)`,
        attemptingText: (attempt) => `جارٍ محاولة الجلب (المحاولة: ${attempt})...`,
        placeholder: 'انقر لتشغيل سياسة إعادة المحاولة الحديثة.',
        failedMsg: (attempts, msg) => `❌ فشل بعد ${attempts} محاولات. الخطأ: ${msg}`,
      },
      retryWhen: {
        title: 'المعامل retryWhen (التقليدي)',
        description: 'يوضح إعادة المحاولة المؤجلة باستخدام تدفقات إشعارات retryWhen وdelayWhen في RxJS 6.',
        migrationStrong: 'ملاحظة ترحيل:',
        migrationText: 'في Angular الحديث وRxJS 7+، تم إهمال retryWhen رسميًا لصالح retry({ delay }). استخدم retry({ delay }) لمنطق أنظف وأكثر أمانًا مع الأنواع.',
        attemptFetchBtn: 'محاولة الجلب باستخدام RetryWhen',
        attemptingText: (attempt) => `جارٍ محاولة الجلب (المحاولة: ${attempt})...`,
        placeholder: 'انقر لتشغيل تدفق retryWhen التقليدي.',
        failedMsg: (msg) => `❌ فشل بعد إعادة المحاولات. الخطأ: ${msg}`,
      },
    },
    combiningStreams: {
      eyebrow: 'الفصل 5 · دمج التدفقات',
      heading: 'تمرين: دمج التدفقات',
      lead: 'استكشف الفرق بين أخذ العينات المعتمد على المشغّل باستخدام withLatestFrom والتفاعلية متعددة المصادر باستخدام combineLatest.',
      focusAriaLabel: 'تصفية معامل الدمج',
      focusOptions: {
        all: 'جميع معاملات الدمج',
        withLatestFrom: 'withLatestFrom',
        combineLatest: 'combineLatest',
      },
      comparisonTitle: 'النموذج الذهني للدمج: الرئيسي-التابع مقابل الديمقراطي',
      comparisonBadge: 'دليل المعمارية',
      comparisonSubtitle: 'اختيار معامل الدمج الصحيح يمنع طلبات الشبكة المتكررة والاختلالات الزمنية وحالات التوقف الصامتة.',
      distinctionStrong: 'الفرق الجوهري:',
      distinctionText: 'معامل withLatestFrom يتبع علاقة رئيسي-تابع (التدفق الرئيسي فقط يطلق الانبعاثات). أما combineLatest فهو ديمقراطي (أي انبعاث من أي مصدر يعيد الحساب بشرط أن يكون كل مصدر قد أصدر قيمة واحدة على الأقل).',
      useCaseStrong: 'حالة استخدام إنتاجية:',
      emitPrefix: 'إصدار',
      withLatestFrom: {
        title: 'المعامل withLatestFrom',
        description: 'يُصدر فقط عندما يُصدر التدفق الأساسي، دامجًا قيمته مع أحدث قيمة من التدفق الثانوي.',
        useCaseText: 'ينقر المستخدم على زر "حفظ". حدث النقر هو المشغّل الأساسي، ويأخذ عينة من أحدث قيم النموذج وبيانات المصادقة دون إطلاق طلبات عند كل تعديل في الحقول.',
        primaryStreamTitle: 'التدفق الأساسي (المشغّل)',
        secondaryStreamTitle: 'التدفق الثانوي (المأخوذ كعينة)',
        latestFromSecondaryLabel: 'الأحدث من الثانوي:',
        marbleTitle: 'مخطط كرات withLatestFrom',
        marbleDescription: 'التدفق الأساسي يقود الانبعاثات؛ والتدفق الثانوي يوفر لقطة فورية',
        primaryLaneLabel: 'التدفق الأساسي (المشغّل)',
        primaryLaneBadge: 'رئيسي',
        secondaryLaneLabel: 'التدفق الثانوي (لقطة)',
        secondaryLaneBadge: 'لقطة',
        outputLaneLabel: 'المخرج المدمج (withLatestFrom)',
        outputLaneBadge: 'النتيجة',
        operatorDescription: 'يُصدر فقط عندما يُصدر تدفق المشغّل الأساسي، قارئًا أحدث قيمة من secondary$.',
      },
      combineLatest: {
        title: 'المعامل combineLatest',
        description: 'يُصدر مصفوفة بأحدث القيم من جميع المصادر كلما أصدر أي تدفق مصدر (بعد أن يُصدر كل منها مرة واحدة على الأقل).',
        useCaseText: 'مرشحات لوحة تحكم معقدة حيث يؤدي تغيير مربع البحث أو الفئة أو النطاق الزمني إلى إعادة الحساب وجلب العناصر المصفاة فورًا.',
        source1Title: 'المصدر 1 (نصوص)',
        source2Title: 'المصدر 2 (أرقام)',
        latestFromSource1Label: 'الأحدث من المصدر 1:',
        latestFromSource2Label: 'الأحدث من المصدر 2:',
        marbleTitle: 'مخطط كرات combineLatest',
        marbleDescription: 'مزامنة ديمقراطية متعددة المصادر: يُصدر كلما تحدّث أي تدفق',
        source1LaneLabel: 'المصدر 1 (نصوص)',
        source1LaneBadge: 'تدفق A',
        source2LaneLabel: 'المصدر 2 (أرقام)',
        source2LaneBadge: 'تدفق B',
        outputLaneLabel: 'التدفق المدمج (combineLatest$)',
        outputLaneBadge: 'مخرج ديمقراطي',
        operatorDescription: 'يعيد الإصدار كلما أصدر أي من المصدرين، طالما أصدر كل مصدر مرة واحدة على الأقل.',
      },
    },
    transformingStreams: {
      eyebrow: 'الفصل 6 · التحويل عالي الرتبة',
      heading: 'تمرين: تحويل التدفقات',
      lead: 'استكشف كيف تتعامل concatMap وswitchMap وmergeMap وexhaustMap مع التدفقات الداخلية المتزامنة. صفِّ إلى معامل واحد لفحص خطه الزمني بالتفصيل.',
      focusAriaLabel: 'تصفية معامل التحويل',
      focusOptions: {
        all: 'جميع المعاملات',
        concatMap: 'concatMap',
        switchMap: 'switchMap',
        mergeMap: 'mergeMap',
        exhaustMap: 'exhaustMap',
      },
      configTitle: 'إعدادات تدفق المصدر',
      sourceEmissionsLabel: 'انبعاثات المصدر:',
      sourceIntervalLabel: 'الفاصل الزمني للمصدر (مللي ثانية):',
      innerValuesLabel: 'القيم لكل تدفق داخلي:',
      innerIntervalLabel: 'الفاصل الداخلي (مللي ثانية):',
      startEmittingBtn: 'بدء الإصدار',
      sourceStreamLabel: 'تدفق المصدر',
      innerStreamsLabel: 'التدفقات الداخلية',
      outputAnimatedLabel: 'تدفق المخرجات (متحرك)',
      finalOutputLabel: 'المخرج النهائي',
      logsLabel: 'السجلات',
      analogyStrong: 'تشبيه:',
      triggersBadge: 'المشغّلات',
      concatMap: {
        title: 'المعامل concatMap',
        description: 'يربط كل قيمة مصدر بـ Observable داخلي ويعالجها بالتسلسل مع ضمان الترتيب.',
        analogyText: 'طاهٍ دقيق يتبع وصفة خطوة بخطوة: ينتهي من تقطيع الخضروات قبل البدء في القلي. الترتيب حاسم.',
        marbleTitle: 'دورة حياة concatMap',
        marbleDescription: 'تنفيذ متسلسل: تنتظر التدفقات الداخلية اللاحقة في الطابور حتى يكتمل التدفق النشط',
        outLaneLabel: 'مخرج مرتب (concatMap)',
        outLaneBadge: 'متسلسل',
        operatorDescription: 'يعالج كل Observable داخلي بالتسلسل وفق ترتيب صارم (FIFO).',
      },
      switchMap: {
        title: 'المعامل switchMap',
        description: 'ينتقل إلى Observable داخلي جديد عند إصدار المصدر، ملغيًا السابق. مثالي للإلغاء.',
        analogyText: 'الكتابة في شريط البحث: يهمك فقط نتائج آخر ما كتبته، بينما يتم إلغاء عمليات البحث القديمة.',
        marbleTitle: 'دورة حياة switchMap',
        marbleDescription: 'سياسة الإلغاء: يتم إلغاء اشتراك التدفق الداخلي النشط فور وصول انبعاث مصدر جديد',
        outLaneLabel: 'أحدث مخرج (switchMap)',
        outLaneBadge: 'إلغاء السابق',
        operatorDescription: 'يلغي الاشتراك الداخلي السابق فورًا عند استلام قيمة مصدر جديدة.',
      },
      mergeMap: {
        title: 'المعامل mergeMap',
        description: 'يشغّل عدة Observables داخلية بالتزامن دون إلغاء أو طابور انتظار. يعتمد الترتيب على التوقيت.',
        analogyText: 'تقاطع طرق مزدحم بعدة مسارات تتدفق في نفس الوقت، حيث تندمج السيارات في المسار الرئيسي فور وصولها.',
        marbleTitle: 'دورة حياة mergeMap',
        marbleDescription: 'تداخل متزامن: تصدر التدفقات الداخلية المتوازية بشكل مستقل فور جاهزية القيم',
        outLaneLabel: 'مخرج متوازٍ (mergeMap)',
        outLaneBadge: 'متداخل',
        operatorDescription: 'يشترك بالتزامن في جميع التدفقات الداخلية ويُصدر قيمها بالتوازي فور وصولها.',
      },
      exhaustMap: {
        title: 'المعامل exhaustMap',
        description: 'يتجاهل قيم المصدر الجديدة طالما أن هناك Observable داخليًا نشطًا حاليًا. مثالي لمنع التكرار المفرط.',
        analogyText: 'باب دوّار يسمح بدخول شخص واحد فقط في كل مرة؛ أي شخص يحاول الدخول أثناء دورانه يتم تجاهله.',
        marbleTitle: 'دورة حياة exhaustMap',
        marbleDescription: 'منع الإزعاج: يتم إسقاط انبعاثات المصدر الجديدة أثناء عمل التدفق الداخلي',
        outLaneLabel: 'مخرج محمي (exhaustMap)',
        outLaneBadge: 'محمي',
        operatorDescription: 'يتجاهل انبعاثات المصدر الواردة طالما أن التدفق الداخلي السابق لا يزال قيد التنفيذ.',
      },
    },
    sharingData: {
      eyebrow: 'معمارية Angular · التواصل بين المكوّنات',
      heading: 'تمرين: مشاركة البيانات بين المكوّنات',
      lead: 'قارن بين مدخلات الإشارات أحادية الاتجاه، ومخرجات الأحداث، والخدمات التفاعلية المشتركة، واستعلامات viewChild.',
      focusAriaLabel: 'تصفية نمط التواصل',
      focusOptions: {
        all: 'جميع أنماط التواصل',
        input: 'من الأب إلى الابن (input)',
        output: 'من الابن إلى الأب (output)',
        service: 'خدمة مشتركة',
        viewChild: 'استعلام المكوّن (viewChild)',
      },
      analogyStrong: 'تشبيه:',
      parentComponentLabel: 'المكوّن الأب',
      childComponentLabel: 'المكوّن الابن',
      senderComponentLabel: 'المكوّن المرسل',
      receiverComponentLabel: 'المكوّن المستقبل',
      receivedLabel: 'المستلم:',
      input: {
        title: 'من الأب إلى الابن: input()',
        description: 'يمرر المكوّن الأب البيانات إلى الابن باستخدام ربط مدخلات الإشارة التصريحي.',
        analogyText: 'أب يعطي طفله لعبة محددة ليلعب بها. تدفق البيانات أحادي الاتجاه من الأب إلى الابن.',
        dataToSendLabel: 'البيانات المراد إرسالها:',
        inputPlaceholder: 'اكتب رسالة للابن...',
        sendToChildBtn: 'إرسال إلى الابن',
      },
      output: {
        title: 'من الابن إلى الأب: output()',
        description: 'يُصدر المكوّن الابن حدثًا محدد النوع يستمع إليه الأب ويتفاعل معه.',
        analogyText: 'طفل يبلغ والده بحدث ما. يبدأ الطفل التواصل ويقوم الأب بتحديث حالته استجابةً لذلك.',
        sendDataToParentBtn: 'إرسال بيانات إلى الأب',
      },
      service: {
        title: 'تواصل الأشقاء: خدمة مشتركة',
        description: 'تتواصل المكوّنات التي لا تربطها علاقة أب-ابن مباشرة عبر خدمة مفردة محقونة.',
        analogyText: 'لوحة إعلانات مجتمعية مشتركة: يمكن لأي شخص نشر إعلان (المرسل) ويمكن لأي مهتم قراءة التحديثات (المستقبل).',
        sendViaServiceBtn: 'إرسال عبر الخدمة',
      },
      viewChild: {
        title: 'مرجع المكوّن: viewChild()',
        description: 'يستعلم الأب عن مرجع إشارة مباشر لمكوّن ابن مضمّن لاستدعاء دواله العامة.',
        analogyText: 'قائد أوركسترا يعطي إشارة لموسيقي معين ليعزف مقطوعته المنفردة مباشرة.',
        triggerHighlightBtn: 'تشغيل دالة التمييز في الابن',
        controlledByParentText: 'يمكن التحكم بي من قِبل المكوّن الأب!',
      },
    },
  },
  it: {
    errorHandling: {
      eyebrow: 'Capitolo 4 · Flussi resilienti',
      heading: 'Esercizio: Gestione degli errori',
      lead: 'Padroneggia il recupero dagli errori con catchError (valore di fallback), throwError (intercetta e rilancia) e le moderne politiche di retry con ritardo.',
      focusAriaLabel: 'Filtra strategia di gestione errori',
      focusOptions: {
        all: 'Tutte le strategie',
        replace: 'Intercetta e sostituisci',
        rethrow: 'Intercetta e rilancia',
        retry: 'Retry moderno',
        retryWhen: 'RetryWhen legacy',
      },
      configTitle: 'Configurazione tentativi (si applica alle strategie retry)',
      retryDelayLabel: 'Ritardo tentativi (ms):',
      maxRetriesLabel: 'Tentativi massimi:',
      archTitle: 'Regola architetturale: gestione errori interna vs esterna',
      archBadge: 'Best practice critica',
      archSubtitle: 'Il bug più diffuso nelle applicazioni Angular reattive è collegare catchError al livello di flusso sbagliato.',
      archPitfallStrong: 'La trappola:',
      archPitfallText: 'Quando un Observable incontra un errore non gestito, il contratto RxJS termina il flusso in modo permanente. Se posizioni catchError dopo uno switchMap (sul flusso esterno), qualsiasi errore HTTP distrugge per sempre il flusso di digitazione dell’utente!',
      marbleTitle: 'Resilienza del flusso interno vs esterno',
      marbleDescription: 'Isolare catchError dentro switchMap previene la terminazione catastrofica dei flussi UI esterni',
      outerLaneLabel: 'Flusso di ricerca esterno (keystrokes$)',
      outerLaneBadge: 'Eventi utente',
      innerLaneLabel: 'Flusso HTTP interno (fetch$)',
      innerLaneBadge: 'catchError interno',
      operatorDescription: 'Intercettare gli errori DENTRO switchMap mantiene vivo il flusso esterno, consentendo alle digitazioni successive di funzionare.',
      operatorFormula: 'Errore interno intercettato -> Il flusso esterno resta attivo',
      useCaseStrong: 'Caso d’uso in produzione:',
      replace: {
        title: 'L’operatore catchError (Strategia di sostituzione)',
        description: 'Intercetta un errore da un Observable a monte e lo sostituisce con un valore di fallback sicuro.',
        useCaseText: 'Degradazione elegante quando un microservizio ausiliario fallisce (es. carosello consigli, avatar profilo, meteo in cache). Restituire of(FALLBACK_DATA) mantiene operativa la dashboard.',
        fetchSuccessBtn: 'Richiesta riuscita',
        fetchFailBtn: 'Richiesta con errore',
        placeholder: 'Clicca un pulsante per testare la sostituzione con catchError.',
        successMsg: '✅ Dati recuperati con successo!',
        errorPrefix: '❌ Errore gestito:',
      },
      rethrow: {
        title: 'L’operatore throwError (Strategia di rilancio)',
        description: 'Esegue un effetto collaterale di logging o telemetria quando si verifica un errore, poi lo rilancia a valle.',
        useCaseText: 'Interceptor HTTP, logger globali di telemetria o invio form in cui viene mostrato un toast ma il chiamante deve comunque ricevere l’errore.',
        fetchRethrowBtn: 'Richiesta con rilancio',
        placeholder: 'Clicca per generare un errore registrato e rilanciato.',
        errorPrefix: '❌ Errore rilanciato catturato dalla UI:',
      },
      retry: {
        title: 'L’operatore retry (Strategia moderna)',
        description: 'Riprova un flusso in errore con tentativi configurabili e timer di ritardo (configurazione moderna RxJS 7+).',
        useCaseText: 'Instabilità di rete mobile, errori gateway transitori (HTTP 502/503/504), cooldown di rate limit (HTTP 429) o riconnessione WebSocket.',
        attemptFetchBtn: (retries) => `Tenta richiesta (${retries}x tentativi)`,
        attemptingText: (attempt) => `Tentativo in corso (Tentativo: ${attempt})...`,
        placeholder: 'Clicca per avviare la politica di retry moderna.',
        failedMsg: (attempts, msg) => `❌ Fallito dopo ${attempts} tentativi. Errore: ${msg}`,
      },
      retryWhen: {
        title: 'L’operatore retryWhen (Legacy)',
        description: 'Dimostra il retry ritardato usando i flussi di notifica retryWhen e delayWhen di RxJS 6.',
        migrationStrong: 'Nota di migrazione:',
        migrationText: 'In Angular moderno / RxJS 7+, retryWhen è ufficialmente deprecato in favore di retry({ delay }). Usa retry({ delay }) per una logica più pulita e type-safe.',
        attemptFetchBtn: 'Tenta con RetryWhen',
        attemptingText: (attempt) => `Tentativo in corso (Tentativo: ${attempt})...`,
        placeholder: 'Clicca per avviare il flusso legacy retryWhen.',
        failedMsg: (msg) => `❌ Fallito dopo i tentativi. Errore: ${msg}`,
      },
    },
    combiningStreams: {
      eyebrow: 'Capitolo 5 · Combinazione di flussi',
      heading: 'Esercizio: Combinare i flussi',
      lead: 'Esplora la differenza tra il campionamento guidato da trigger con withLatestFrom e la reattività multi-sorgente con combineLatest.',
      focusAriaLabel: 'Filtra operatore di combinazione',
      focusOptions: {
        all: 'Tutti gli operatori',
        withLatestFrom: 'withLatestFrom',
        combineLatest: 'combineLatest',
      },
      comparisonTitle: 'Modello mentale: Master-Slave vs Democratico',
      comparisonBadge: 'Guida architetturale',
      comparisonSubtitle: 'Scegliere il giusto operatore di combinazione previene chiamate di rete ridondanti, glitch temporali e deadlock silenziosi.',
      distinctionStrong: 'La distinzione fondamentale:',
      distinctionText: 'withLatestFrom è una relazione master-slave (solo il flusso master innesca emissioni). combineLatest è democratico (qualsiasi emissione ricalcola il risultato, purché tutte le sorgenti abbiano emesso almeno una volta).',
      useCaseStrong: 'Caso d’uso in produzione:',
      emitPrefix: 'Emetti',
      withLatestFrom: {
        title: 'L’operatore withLatestFrom',
        description: 'Emette solo quando il flusso primario emette, combinando il suo valore con l’ultimo valore del flusso secondario.',
        useCaseText: 'L’utente clicca "Salva". Il clic è il trigger primario che campiona gli ultimi valori del form senza generare richieste ad ogni modifica dei campi.',
        primaryStreamTitle: 'Flusso primario (Trigger)',
        secondaryStreamTitle: 'Flusso secondario (Campionato)',
        latestFromSecondaryLabel: 'Ultimo dal secondario:',
        marbleTitle: 'Visualizzatore Marble withLatestFrom',
        marbleDescription: 'Il flusso primario guida le emissioni; il flusso secondario fornisce uno snapshot istantaneo',
        primaryLaneLabel: 'Flusso primario (Trigger)',
        primaryLaneBadge: 'Master',
        secondaryLaneLabel: 'Flusso secondario (Campionato)',
        secondaryLaneBadge: 'Snapshot',
        outputLaneLabel: 'Output combinato (withLatestFrom)',
        outputLaneBadge: 'Risultato',
        operatorDescription: 'Emette SOLO quando il flusso trigger primario emette, leggendo il valore più recente da secondary$.',
      },
      combineLatest: {
        title: 'L’operatore combineLatest',
        description: 'Emette un array con gli ultimi valori di tutte le sorgenti ogni volta che una sorgente emette (dopo almeno una emissione ciascuna).',
        useCaseText: 'Filtri complessi di una dashboard in cui modificare la ricerca, la categoria o l’intervallo date ricalcola e ricarica subito gli elementi.',
        source1Title: 'Sorgente 1 (Stringhe)',
        source2Title: 'Sorgente 2 (Numeri)',
        latestFromSource1Label: 'Ultimo da Sorgente 1:',
        latestFromSource2Label: 'Ultimo da Sorgente 2:',
        marbleTitle: 'Visualizzatore Marble combineLatest',
        marbleDescription: 'Sincronizzazione democratica multi-sorgente: emette a ogni aggiornamento di qualsiasi flusso',
        source1LaneLabel: 'Sorgente 1 (Stringhe)',
        source1LaneBadge: 'Flusso A',
        source2LaneLabel: 'Sorgente 2 (Numeri)',
        source2LaneBadge: 'Flusso B',
        outputLaneLabel: 'Flusso combinato (combineLatest$)',
        outputLaneBadge: 'Output democratico',
        operatorDescription: 'Riemette ogni volta che UNA delle sorgenti emette, purché ciascuna abbia emesso almeno una volta.',
      },
    },
    transformingStreams: {
      eyebrow: 'Capitolo 6 · Mappatura di ordine superiore',
      heading: 'Esercizio: Trasformare i flussi',
      lead: 'Esplora come concatMap, switchMap, mergeMap ed exhaustMap gestiscono i flussi interni concorrenti. Filtra un singolo operatore per ispezionare timeline e marble in dettaglio.',
      focusAriaLabel: 'Filtra operatore di trasformazione',
      focusOptions: {
        all: 'Tutti gli operatori',
        concatMap: 'concatMap',
        switchMap: 'switchMap',
        mergeMap: 'mergeMap',
        exhaustMap: 'exhaustMap',
      },
      configTitle: 'Configurazione flusso sorgente',
      sourceEmissionsLabel: 'Emissioni sorgente:',
      sourceIntervalLabel: 'Intervallo sorgente (ms):',
      innerValuesLabel: 'Valori per flusso interno:',
      innerIntervalLabel: 'Intervallo interno (ms):',
      startEmittingBtn: 'Avvia emissioni',
      sourceStreamLabel: 'Flusso sorgente',
      innerStreamsLabel: 'Flussi interni',
      outputAnimatedLabel: 'Flusso di output (Animato)',
      finalOutputLabel: 'Output finale',
      logsLabel: 'Log',
      analogyStrong: 'Analogia:',
      triggersBadge: 'Trigger',
      concatMap: {
        title: 'L’operatore concatMap',
        description: 'Mappa ogni valore sorgente in un Observable interno e li elabora in sequenza. Garantisce l’ordine.',
        analogyText: 'Uno chef meticoloso che segue una ricetta: completa un passaggio (tagliare le verdure) prima di iniziare il successivo (soffriggere). L’ordine è fondamentale.',
        marbleTitle: 'Ciclo di vita concatMap',
        marbleDescription: 'Esecuzione sequenziale: i flussi interni successivi attendono in coda il completamento di quello attivo',
        outLaneLabel: 'Output ordinato (concatMap)',
        outLaneBadge: 'Sequenziale',
        operatorDescription: 'Elabora in sequenza ogni Observable interno in rigoroso ordine FIFO.',
      },
      switchMap: {
        title: 'L’operatore switchMap',
        description: 'Passa a un nuovo Observable interno quando la sorgente emette, annullando il precedente. Ideale per la cancellazione.',
        analogyText: 'Digitare in una barra di ricerca: interessano solo i risultati dell’ultima parola digitata. Le ricerche precedenti vengono annullate.',
        marbleTitle: 'Ciclo di vita switchMap',
        marbleDescription: 'Politica di cancellazione: il flusso interno attivo viene annullato a ogni nuova emissione sorgente',
        outLaneLabel: 'Ultimo output (switchMap)',
        outLaneBadge: 'Prec. annullato',
        operatorDescription: 'Annulla immediatamente la sottoscrizione interna precedente alla ricezione di un nuovo valore sorgente.',
      },
      mergeMap: {
        title: 'L’operatore mergeMap',
        description: 'Esegue più Observable interni in parallelo senza annullare né mettere in coda. L’ordine dipende dal timing.',
        analogyText: 'Un incrocio trafficato con più corsie che scorrono contemporaneamente: le auto si immettono nel flusso principale man mano che arrivano.',
        marbleTitle: 'Ciclo di vita mergeMap',
        marbleDescription: 'Interleaving concorrente: i flussi interni paralleli emettono in modo indipendente',
        outLaneLabel: 'Output parallelo (mergeMap)',
        outLaneBadge: 'Interleaved',
        operatorDescription: 'Si sottoscrive in parallelo a tutti gli Observable interni ed emette i valori man mano che arrivano.',
      },
      exhaustMap: {
        title: 'L’operatore exhaustMap',
        description: 'Ignora i nuovi valori sorgente mentre un Observable interno è attivo. Ideale contro lo spam di clic.',
        analogyText: 'Una porta girevole che fa entrare una sola persona alla volta: chi tenta di entrare mentre gira viene ignorato.',
        marbleTitle: 'Ciclo di vita exhaustMap',
        marbleDescription: 'Prevenzione spam: le nuove emissioni sorgente vengono scartate mentre il flusso interno è in corso',
        outLaneLabel: 'Output protetto (exhaustMap)',
        outLaneBadge: 'Protetto',
        operatorDescription: 'Ignora le emissioni sorgente in arrivo mentre un Observable interno precedente è ancora in esecuzione.',
      },
    },
    sharingData: {
      eyebrow: 'Architettura Angular · Comunicazione tra componenti',
      heading: 'Esercizio: Condividere dati tra componenti',
      lead: 'Confronta signal input unidirezionali, signal output guidati da eventi, servizi reattivi condivisi e query viewChild.',
      focusAriaLabel: 'Filtra pattern di comunicazione',
      focusOptions: {
        all: 'Tutti i pattern',
        input: 'Padre a Figlio (input)',
        output: 'Figlio a Padre (output)',
        service: 'Servizio condiviso',
        viewChild: 'Query componente (viewChild)',
      },
      analogyStrong: 'Analogia:',
      parentComponentLabel: 'Componente Padre',
      childComponentLabel: 'Componente Figlio',
      senderComponentLabel: 'Componente Mittente',
      receiverComponentLabel: 'Componente Ricevitore',
      receivedLabel: 'Ricevuto:',
      input: {
        title: 'Padre a Figlio: input()',
        description: 'Il componente padre passa i dati al figlio usando un binding dichiarativo signal input.',
        analogyText: 'Un genitore che dà al figlio un giocattolo specifico: il flusso di dati è unidirezionale, dal padre al figlio.',
        dataToSendLabel: 'Dati da inviare:',
        inputPlaceholder: 'Scrivi un messaggio al figlio...',
        sendToChildBtn: 'Invia al Figlio',
      },
      output: {
        title: 'Figlio a Padre: output()',
        description: 'Il componente figlio emette un evento tipizzato che il padre ascolta e gestisce.',
        analogyText: 'Un bambino che avvisa il genitore di un evento: il figlio avvia la comunicazione e il padre aggiorna il proprio stato.',
        sendDataToParentBtn: 'Invia dati al Padre',
      },
      service: {
        title: 'Comunicazione tra fratelli: Servizio condiviso',
        description: 'Componenti senza relazione diretta padre-figlio comunicano tramite un servizio singleton iniettato.',
        analogyText: 'Una bacheca condominiale condivisa: chiunque può affiggere un avviso (mittente) e chiunque può leggere gli aggiornamenti (ricevitore).',
        sendViaServiceBtn: 'Invia tramite Servizio',
      },
      viewChild: {
        title: 'Riferimento al componente: viewChild()',
        description: 'Il padre interroga un riferimento signal diretto a un componente figlio incorporato per invocarne i metodi pubblici.',
        analogyText: 'Un direttore d’orchestra che dà l’attacco a un musicista specifico per suonare il suo assolo.',
        triggerHighlightBtn: 'Attiva metodo Highlight del Figlio',
        controlledByParentText: 'Posso essere controllato dal componente padre!',
      },
    },
  },
  de: {
    errorHandling: {
      eyebrow: 'Kapitel 4 · Resiliente Streams',
      heading: 'Übung: Fehlerbehandlung',
      lead: 'Meistern Sie die Fehlerbehandlung mit catchError (Fallback-Ersatz), throwError (Abfangen & Weiterwerfen) und modernen verzögerungsbasierten Retry-Strategien.',
      focusAriaLabel: 'Fehlerbehandlungsstrategie filtern',
      focusOptions: {
        all: 'Alle Fehlerstrategien',
        replace: 'Abfangen & Ersetzen',
        rethrow: 'Abfangen & Weiterwerfen',
        retry: 'Modernes Retry',
        retryWhen: 'Legacy RetryWhen',
      },
      configTitle: 'Retry-Konfiguration (gilt für Retry-Strategien)',
      retryDelayLabel: 'Retry-Verzögerung (ms):',
      maxRetriesLabel: 'Max. Versuche:',
      archTitle: 'Architekturregel: Innere vs. äußere Fehlerbehandlung',
      archBadge: 'Kritische Best Practice',
      archSubtitle: 'Der häufigste Fehler in reaktiven Angular-Anwendungen ist das Anbinden von catchError auf der falschen Stream-Ebene.',
      archPitfallStrong: 'Die Falle:',
      archPitfallText: 'Trifft ein Observable auf einen unbehandelten Fehler, beendet der RxJS-Vertrag den Stream dauerhaft. Platzieren Sie catchError nach einem switchMap (auf dem äußeren Stream), zerstört jeder HTTP-Fehler dauerhaft den Tastatureingabe-Stream!',
      marbleTitle: 'Resilienz innerer vs. äußerer Streams',
      marbleDescription: 'Die Isolierung von catchError innerhalb von switchMap verhindert den katastrophalen Abbruch äußerer UI-Streams',
      outerLaneLabel: 'Äußerer Such-Stream (keystrokes$)',
      outerLaneBadge: 'Benutzer-Events',
      innerLaneLabel: 'Innerer HTTP-Stream (fetch$)',
      innerLaneBadge: 'Inneres catchError',
      operatorDescription: 'Das Abfangen von Fehlern INNERHALB von switchMap erhält den äußeren Stream am Leben, sodass zukünftige Eingaben weiter funktionieren.',
      operatorFormula: 'Innerer Fehler abgefangen -> Äußerer Stream bleibt aktiv',
      useCaseStrong: 'Produktions-Anwendungsfall:',
      replace: {
        title: 'Der catchError-Operator (Ersetzungsstrategie)',
        description: 'Fängt einen Fehler eines vorgelagerten Observables ab und ersetzt ihn durch einen sicheren Fallback-Wert.',
        useCaseText: 'Sanfte Degradierung beim Ausfall eines Hilfs-Microservices (z. B. Empfehlungskarussell, Profilbild, Wetter-Cache). Geben Sie of(FALLBACK_DATA) zurück, damit das restliche Dashboard funktionsfähig bleibt.',
        fetchSuccessBtn: 'Erfolgreicher Abruf',
        fetchFailBtn: 'Abruf mit Fehler',
        placeholder: 'Klicken Sie auf eine Schaltfläche, um catchError zu testen.',
        successMsg: '✅ Daten erfolgreich abgerufen!',
        errorPrefix: '❌ Fehler behandelt:',
      },
      rethrow: {
        title: 'Der throwError-Operator (Weiterwurf-Strategie)',
        description: 'Führt bei einem Fehler einen Logging- oder Telemetrie-Seiteneffekt aus und wirft den Fehler anschließend weiter.',
        useCaseText: 'HTTP-Interceptoren, globale Fehler-Logger oder Formularübermittlungen, bei denen ein Toast angezeigt wird, der Aufrufer den Fehler aber dennoch benötigt.',
        fetchRethrowBtn: 'Abruf mit Weiterwurf',
        placeholder: 'Klicken Sie, um einen Fehler auszulösen, der protokolliert und weitergeworfen wird.',
        errorPrefix: '❌ Weitergeworfener Fehler von UI erfasst:',
      },
      retry: {
        title: 'Der retry-Operator (Moderne Strategie)',
        description: 'Wiederholt einen fehlgeschlagenen Stream mit konfigurierbarer Anzahl und Verzögerung (RxJS 7+).',
        useCaseText: 'Netzwerkinstabilität auf Mobilgeräten, temporäre Gateway-Fehler (HTTP 502/503/504), Rate-Limiting (HTTP 429) oder WebSocket-Reconnects.',
        attemptFetchBtn: (retries) => `Abruf starten (${retries}x Wiederholungen)`,
        attemptingText: (attempt) => `Abruf läuft (Versuch: ${attempt})...`,
        placeholder: 'Klicken Sie, um die moderne Retry-Strategie zu starten.',
        failedMsg: (attempts, msg) => `❌ Fehlgeschlagen nach ${attempts} Versuchen. Fehler: ${msg}`,
      },
      retryWhen: {
        title: 'Der retryWhen-Operator (Legacy)',
        description: 'Demonstriert verzögerte Wiederholungen mit RxJS 6 retryWhen- und delayWhen-Benachrichtigungs-Streams.',
        migrationStrong: 'Migrationshinweis:',
        migrationText: 'In modernem Angular / RxJS 7+ ist retryWhen offiziell zugunsten von retry({ delay }) als veraltet markiert. Nutzen Sie retry({ delay }) für sauberere, typsichere Retry-Logik.',
        attemptFetchBtn: 'Abruf mit RetryWhen starten',
        attemptingText: (attempt) => `Abruf läuft (Versuch: ${attempt})...`,
        placeholder: 'Klicken Sie, um den Legacy-retryWhen-Stream zu starten.',
        failedMsg: (msg) => `❌ Nach Wiederholungen fehlgeschlagen. Fehler: ${msg}`,
      },
    },
    combiningStreams: {
      eyebrow: 'Kapitel 5 · Stream-Kombination',
      heading: 'Übung: Streams kombinieren',
      lead: 'Erkunden Sie den Unterschied zwischen triggerbasiertem Sampling mit withLatestFrom und Multi-Source-Reaktivität mit combineLatest.',
      focusAriaLabel: 'Kombinationsoperator filtern',
      focusOptions: {
        all: 'Alle Operatoren',
        withLatestFrom: 'withLatestFrom',
        combineLatest: 'combineLatest',
      },
      comparisonTitle: 'Mentales Modell: Master-Slave vs. Demokratisch',
      comparisonBadge: 'Architektur-Leitfaden',
      comparisonSubtitle: 'Die Wahl des richtigen Kombinationsoperators verhindert redundante Netzwerkaufrufe, Timing-Glitches und stille Deadlocks.',
      distinctionStrong: 'Der Kernunterschied:',
      distinctionText: 'withLatestFrom ist eine Master-Slave-Beziehung (nur der Master-Stream löst Emissionen aus). combineLatest ist demokratisch (jede Quell-Emission löst eine Neuberechnung aus, sobald alle Quellen mindestens einmal emittiert haben).',
      useCaseStrong: 'Produktions-Anwendungsfall:',
      emitPrefix: 'Emittiere',
      withLatestFrom: {
        title: 'Der withLatestFrom-Operator',
        description: 'Emittiert nur, wenn der primäre Stream emittiert, und kombiniert dessen Wert mit dem neuesten Wert des sekundären Streams.',
        useCaseText: 'Ein Benutzer klickt auf „Speichern“. Das Klick-Event ist der primäre Auslöser und liest die aktuellen Formulardaten, ohne bei jeder Feldeingabe einen Request auszulösen.',
        primaryStreamTitle: 'Primärer Stream (Auslöser)',
        secondaryStreamTitle: 'Sekundärer Stream (Abgetastet)',
        latestFromSecondaryLabel: 'Aktuellster Sekundärwert:',
        marbleTitle: 'withLatestFrom-Marble-Visualisierer',
        marbleDescription: 'Primärer Stream steuert Emissionen; sekundärer Stream liefert Momentaufnahme',
        primaryLaneLabel: 'Primärer Stream (Auslöser)',
        primaryLaneBadge: 'Master',
        secondaryLaneLabel: 'Sekundärer Stream (Abgetastet)',
        secondaryLaneBadge: 'Snapshot',
        outputLaneLabel: 'Kombinierte Ausgabe (withLatestFrom)',
        outputLaneBadge: 'Ergebnis',
        operatorDescription: 'Emittiert NUR, wenn der primäre Auslöser-Stream emittiert, und liest den neuesten Wert von secondary$.',
      },
      combineLatest: {
        title: 'Der combineLatest-Operator',
        description: 'Emittiert ein Array der neuesten Werte aller Quell-Streams, sobald irgendeine Quelle emittiert (nachdem jede mindestens einmal emittiert hat).',
        useCaseText: 'Komplexe Dashboard-Filter, bei denen Änderungen an Suchfeld, Kategorie oder Zeitraum sofort die gefilterten Daten neu berechnen.',
        source1Title: 'Quelle 1 (Strings)',
        source2Title: 'Quelle 2 (Zahlen)',
        latestFromSource1Label: 'Aktuellster Wert Quelle 1:',
        latestFromSource2Label: 'Aktuellster Wert Quelle 2:',
        marbleTitle: 'combineLatest-Marble-Visualisierer',
        marbleDescription: 'Demokratische Multi-Source-Synchronisation: emittiert bei jedem Update einer Quelle',
        source1LaneLabel: 'Quelle 1 (Strings)',
        source1LaneBadge: 'Stream A',
        source2LaneLabel: 'Quelle 2 (Zahlen)',
        source2LaneBadge: 'Stream B',
        outputLaneLabel: 'Kombinierter Stream (combineLatest$)',
        outputLaneBadge: 'Demokratisch',
        operatorDescription: 'Emittiert erneut, sobald EINE der Quellen emittiert, sofern jede Quelle mindestens einmal emittiert hat.',
      },
    },
    transformingStreams: {
      eyebrow: 'Kapitel 6 · Higher-Order-Mapping',
      heading: 'Übung: Streams transformieren',
      lead: 'Erkunden Sie, wie concatMap, switchMap, mergeMap und exhaustMap gleichzeitige innere Streams verarbeiten. Filtern Sie auf einen Operator für alle Details.',
      focusAriaLabel: 'Transformationsoperator filtern',
      focusOptions: {
        all: 'Alle Operatoren',
        concatMap: 'concatMap',
        switchMap: 'switchMap',
        mergeMap: 'mergeMap',
        exhaustMap: 'exhaustMap',
      },
      configTitle: 'Quell-Stream-Konfiguration',
      sourceEmissionsLabel: 'Quell-Emissionen:',
      sourceIntervalLabel: 'Quell-Intervall (ms):',
      innerValuesLabel: 'Werte pro innerem Stream:',
      innerIntervalLabel: 'Inneres Intervall (ms):',
      startEmittingBtn: 'Emission starten',
      sourceStreamLabel: 'Quell-Stream',
      innerStreamsLabel: 'Innere Streams',
      outputAnimatedLabel: 'Ausgabe-Stream (Animiert)',
      finalOutputLabel: 'Endergebnis',
      logsLabel: 'Protokolle',
      analogyStrong: 'Analogie:',
      triggersBadge: 'Auslöser',
      concatMap: {
        title: 'Der concatMap-Operator',
        description: 'Projiziert jeden Quellwert auf ein inneres Observable und verarbeitet sie nacheinander. Garantiert die Reihenfolge.',
        analogyText: 'Ein sorgfältiger Koch, der ein Rezept Schritt für Schritt abarbeitet: Erst wird das Gemüse geschnitten, danach angebraten.',
        marbleTitle: 'concatMap-Stream-Lebenszyklus',
        marbleDescription: 'Sequenzielle Ausführung: nachfolgende innere Streams warten in der Warteschlange',
        outLaneLabel: 'Geordnete Ausgabe (concatMap)',
        outLaneBadge: 'Sequenziell',
        operatorDescription: 'Verarbeitet jedes innere Observable nacheinander in strikter FIFO-Reihenfolge.',
      },
      switchMap: {
        title: 'Der switchMap-Operator',
        description: 'Wechselt bei einer neuen Quell-Emission auf ein neues inneres Observable und bricht das vorherige ab.',
        analogyText: 'Tippen in ein Suchfeld: Nur die Ergebnisse für die neueste Eingabe zählen; ältere Suchanfragen werden abgebrochen.',
        marbleTitle: 'switchMap-Stream-Lebenszyklus',
        marbleDescription: 'Abbruch-Strategie: aktiver innerer Stream wird bei neuer Quell-Emission abgemeldet',
        outLaneLabel: 'Neueste Ausgabe (switchMap)',
        outLaneBadge: 'Vorh. abgebrochen',
        operatorDescription: 'Bricht das vorherige innere Abonnement sofort ab, sobald ein neuer Quellwert eintrifft.',
      },
      mergeMap: {
        title: 'Der mergeMap-Operator',
        description: 'Führt mehrere innere Observables gleichzeitig aus, ohne abzubrechen oder zu warten. Die Reihenfolge hängt vom Timing ab.',
        analogyText: 'Eine mehrspurige Kreuzung, auf der Autos aus allen Richtungen gleichzeitig in den Hauptstrom einfädeln.',
        marbleTitle: 'mergeMap-Stream-Lebenszyklus',
        marbleDescription: 'Parallele Verschränkung: innere Streams emittieren unabhängig voneinander',
        outLaneLabel: 'Parallele Ausgabe (mergeMap)',
        outLaneBadge: 'Verschränkt',
        operatorDescription: 'Abonniert alle inneren Observables gleichzeitig und gibt deren Werte parallel aus.',
      },
      exhaustMap: {
        title: 'Der exhaustMap-Operator',
        description: 'Ignoriert neue Quellwerte, solange ein inneres Observable aktiv ist. Ideal zum Schutz vor Mehrfachklicks.',
        analogyText: 'Eine Drehtür, die jeweils nur eine Person einlässt: Wer während der Drehung eintritt, wird abgewiesen.',
        marbleTitle: 'exhaustMap-Stream-Lebenszyklus',
        marbleDescription: 'Spam-Schutz: neue Quell-Emissionen werden verworfen, solange der innere Stream läuft',
        outLaneLabel: 'Geschützte Ausgabe (exhaustMap)',
        outLaneBadge: 'Geschützt',
        operatorDescription: 'Ignoriert eingehende Quell-Emissionen, solange ein zuvor gestartetes inneres Observable noch ausgeführt wird.',
      },
    },
    sharingData: {
      eyebrow: 'Angular-Architektur · Komponentenkommunikation',
      heading: 'Übung: Daten zwischen Komponenten teilen',
      lead: 'Vergleichen Sie unidirektionale Signal-Inputs, ereignisbasierte Signal-Outputs, geteilte reaktive Services und viewChild-Abfragen.',
      focusAriaLabel: 'Kommunikationsmuster filtern',
      focusOptions: {
        all: 'Alle Kommunikationsmuster',
        input: 'Eltern zu Kind (input)',
        output: 'Kind zu Eltern (output)',
        service: 'Geteilter Service',
        viewChild: 'Komponenten-Abfrage (viewChild)',
      },
      analogyStrong: 'Analogie:',
      parentComponentLabel: 'Eltern-Komponente',
      childComponentLabel: 'Kind-Komponente',
      senderComponentLabel: 'Sender-Komponente',
      receiverComponentLabel: 'Empfänger-Komponente',
      receivedLabel: 'Empfangen:',
      input: {
        title: 'Eltern zu Kind: input()',
        description: 'Die Eltern-Komponente übergibt Daten über ein deklaratives Signal-Input-Binding an das Kind.',
        analogyText: 'Ein Elternteil gibt einem Kind ein bestimmtes Spielzeug. Der Datenfluss verläuft in eine Richtung von Eltern zu Kind.',
        dataToSendLabel: 'Zu sendende Daten:',
        inputPlaceholder: 'Nachricht an Kind eingeben...',
        sendToChildBtn: 'An Kind senden',
      },
      output: {
        title: 'Kind zu Eltern: output()',
        description: 'Die Kind-Komponente sendet ein typisiertes Ereignis, auf das die Eltern-Komponente hört und reagiert.',
        analogyText: 'Ein Kind informiert die Eltern über ein Ereignis: Das Kind startet die Kommunikation und die Eltern aktualisieren ihren Status.',
        sendDataToParentBtn: 'Daten an Eltern senden',
      },
      service: {
        title: 'Geschwister-Kommunikation: Geteilter Service',
        description: 'Komponenten ohne direkte Eltern-Kind-Beziehung kommunizieren über einen injizierten Singleton-Service.',
        analogyText: 'Ein gemeinsames Schwarzes Brett: Jeder kann eine Nachricht anheften (Sender) und jeder Interessierte kann Updates lesen (Empfänger).',
        sendViaServiceBtn: 'Über Service senden',
      },
      viewChild: {
        title: 'Komponenten-Referenz: viewChild()',
        description: 'Die Eltern-Komponente fragt eine direkte Signal-Referenz auf eine eingebettete Kind-Komponente ab, um deren öffentliche Methoden aufzurufen.',
        analogyText: 'Ein Dirigent gibt einem bestimmten Musiker im Orchester direkt den Einsatz für sein Solo.',
        triggerHighlightBtn: 'Highlight-Methode des Kindes auslösen',
        controlledByParentText: 'Ich kann von der Eltern-Komponente gesteuert werden!',
      },
    },
  },
};
