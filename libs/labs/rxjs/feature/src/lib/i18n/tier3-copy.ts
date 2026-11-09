import type { SiteLanguage } from '@ah/shared/state';
import type { ArchitectureScenario } from '../exercises/rxjs-vs-signals/rxjs-vs-signals.component';
import type { QuizQuestion } from '../shared/models/quiz.model';

export interface SignalsCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  focusAriaLabel: string;
  focusOptions: {
    all: string;
    basics: string;
    toSignal: string;
    linkedSignal: string;
    rxResource: string;
    resource: string;
    toObservable: string;
  };
  analogyStrong: string;
  statusPrefix: string;
  writable: {
    title: string;
    description: string;
    firstNameLabel: string;
    lastNameLabel: string;
    quantityLabel: string;
  };
  computed: {
    title: string;
    description: string;
    fullNameLabel: string;
    isStockLowLabel: string;
    stockMessageLabel: string;
    lowStockMsg: (qty: number) => string;
    inStockMsg: (qty: number) => string;
  };
  effect: {
    title: string;
    description: string;
    auditTrailTitle: string;
  };
  toSignal: {
    title: string;
    description: string;
    analogyText: string;
    streamLabel: string;
    resultingSignalLabel: string;
    computedEvenLabel: string;
    startStreamBtn: string;
    stopStreamBtn: string;
  };
  linkedSignal: {
    title: string;
    description: string;
    whyStrong: string;
    whyText: string;
    choosePlanLabel: string;
    starterBtn: string;
    proBtn: string;
    enterpriseBtn: string;
    adjustCreditsLabel: string;
    overriddenBadge: string;
    resetDefaultBtn: string;
    planDefaultBadge: string;
  };
  rxResource: {
    title: string;
    description: string;
    zonelessStrong: string;
    zonelessText: string;
    selectUserIdLabel: string;
    userBtn: (id: number) => string;
    reloadStreamBtn: string;
    streamingDataText: string;
  };
  resource: {
    title: string;
    description: string;
    promisesStrong: string;
    promisesText: string;
    selectTopicLabel: string;
    reloadBtn: string;
    executingLoaderText: string;
  };
  toObservable: {
    title: string;
    description: string;
    typeToSearchLabel: string;
    searchPlaceholder: string;
    rawInputLabel: string;
    debouncedSignalLabel: string;
  };
}

export interface RxjsVsSignalsCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  focusAriaLabel: string;
  focusOptions: {
    all: string;
    decisionMatrix: string;
    searchDebounce: string;
    derivedState: string;
    asyncResource: string;
    linkedState: string;
    coexistence: string;
  };
  coexistence: {
    title: string;
    badge: string;
    description: string;
    step1Badge: string;
    step1Title: string;
    step1Items: readonly string[];
    step2Badge: string;
    step2Title: string;
    step2Items: readonly string[];
    ruleStrong: string;
    ruleQuote: string;
    ruleText: string;
  };
  decisionMatrix: {
    title: string;
    description: string;
    categoryPrefix: string;
    recommendedPrefix: string;
    rxjsApproachTitle: string;
    signalsApproachTitle: string;
    hybridApproachTitle: string;
    takeawayStrong: string;
  };
  scenarios: readonly ArchitectureScenario[];
  derivedState: {
    title: string;
    description: string;
    basePriceLabel: string;
    discountLabel: string;
    taxRateLabel: string;
    fixed20Badge: string;
    signalsComputedLabel: string;
    syncPullBadge: string;
    signalsNote: string;
    rxjsCombineLabel: string;
    pushStreamBadge: string;
    rxjsNote: string;
  };
  searchDebounce: {
    title: string;
    description: string;
    inputLabel: string;
    inputPlaceholder: string;
    rawSignalLabel: string;
    debouncedSignalLabel: string;
  };
  asyncResource: {
    title: string;
    description: string;
    selectLocationLabel: string;
    parisBtn: string;
    tokyoBtn: string;
    nycBtn: string;
    reloadStreamBtn: string;
    fetchingWeatherText: string;
    statusPrefix: string;
  };
  linkedState: {
    title: string;
    description: string;
    selectPlanLabel: string;
    basicBtn: string;
    proBtn: string;
    enterpriseBtn: string;
    adjustQuotaLabel: string;
    customOverrideBadge: string;
    resetPlanDefaultBtn: string;
    planDefaultBadge: string;
  };
}

export interface QuizCopy {
  eyebrow: string;
  heading: string;
  lead: string;
  tracks: {
    beginnerTitle: string;
    beginnerBadge: string;
    beginnerDesc: string;
    beginnerBtn: string;
    midTitle: string;
    midBadge: string;
    midDesc: string;
    midBtn: string;
    seniorTitle: string;
    seniorBadge: string;
    seniorDesc: string;
    seniorBtn: string;
  };
  questionProgress: (current: number, total: number) => string;
  answerPlaceholder: string;
  correctAnswerLabel: string;
  submitAnswerBtn: string;
  correctToast: string;
  incorrectToast: string;
  correctFeedback: string;
  incorrectFeedback: string;
  reviewConceptBtn: string;
  nextQuestionBtn: string;
  finishQuizBtn: string;
  quizCompleteTitle: string;
  scoreText: (score: number, total: number) => string;
  tryAnotherBtn: string;
  questions: readonly QuizQuestion[];
}

export interface Tier3Copy {
  signals: SignalsCopy;
  rxjsVsSignals: RxjsVsSignalsCopy;
  quiz: QuizCopy;
}

export const TIER3_COPY: Record<SiteLanguage, Tier3Copy> = {
  en: {
    signals: {
      eyebrow: 'Angular 22 · Reactive Primitives',
      heading: 'Exercise: Signals & Reactive Interop',
      lead: 'Explore fine-grained signals, derived computeds, side-effects, linkedSignal resets, and bidirectional RxJS interop with toSignal, toObservable, and rxResource.',
      focusAriaLabel: 'Filter signal topic',
      focusOptions: {
        all: 'All Signal Topics',
        basics: 'Signal Basics',
        toSignal: 'toSignal()',
        linkedSignal: 'linkedSignal()',
        rxResource: 'rxResource()',
        resource: 'resource() [Promise]',
        toObservable: 'toObservable()',
      },
      analogyStrong: 'Analogy:',
      statusPrefix: 'Status:',
      writable: {
        title: '1. Writable Signals: signal()',
        description:
          'The fundamental sources of truth in modern Angular. Directly mutate state and notify fine-grained dependencies.',
        firstNameLabel: 'First Name:',
        lastNameLabel: 'Last Name:',
        quantityLabel: 'Quantity:',
      },
      computed: {
        title: '2. Computed Signals: computed()',
        description:
          'Derive read-only values memoized on change. Evaluated lazily and re-computed only when dependencies change.',
        fullNameLabel: 'Full Name:',
        isStockLowLabel: 'Is Stock Low?',
        stockMessageLabel: 'Stock Message:',
        lowStockMsg: (qty) => `Only ${qty} left in stock - order soon!`,
        inStockMsg: (qty) => `${qty} in stock.`,
      },
      effect: {
        title: '3. Effects: effect()',
        description:
          'Side-effects scheduled on microtask ticks whenever tracked signals change.',
        auditTrailTitle: 'Effect Audit Trail',
      },
      toSignal: {
        title: '4. RxJS Interop: toSignal()',
        description:
          'Converts an RxJS Observable into a reactive read-only Signal with automatic subscription cleanup.',
        analogyText:
          'Subscribing to a publication (Observable). Each new release is placed directly in your mailbox (Signal), ready to read synchronously without manual subscription boilerplates.',
        streamLabel: 'RxJS interval(1000) Observable Stream',
        resultingSignalLabel: 'Resulting Signal (counterSignal):',
        computedEvenLabel: 'Computed from Signal (isEven):',
        startStreamBtn: 'Start Stream',
        stopStreamBtn: 'Stop Stream',
      },
      linkedSignal: {
        title: '5. Angular 22: linkedSignal()',
        description:
          'A writable signal that resets to a computed default whenever its source dependency changes, while still supporting direct user mutations.',
        whyStrong: 'Why linkedSignal?',
        whyText:
          'With computed(), state is strictly read-only. With separate writable signals and effects, synchronization is prone to glitches. linkedSignal() solves this cleanly.',
        choosePlanLabel: 'Choose Plan Tier:',
        starterBtn: 'Starter (5)',
        proBtn: 'Pro (25)',
        enterpriseBtn: 'Enterprise (100)',
        adjustCreditsLabel: 'Adjust Compute Credits (Direct Mutation):',
        overriddenBadge: 'Overridden',
        resetDefaultBtn: 'Reset to default',
        planDefaultBadge: 'Plan default',
      },
      rxResource: {
        title: '6. Angular 22: rxResource() Async Loader',
        description:
          'Bridges asynchronous RxJS streams directly into declarative Signals with loading flags, cancellation, and error boundaries.',
        zonelessStrong: 'Async Data in Zoneless Angular:',
        zonelessText:
          'rxResource() executes an RxJS loader stream, exposing synchronous signals for value(), isLoading(), and status() with zero zone.js.',
        selectUserIdLabel: 'Select User ID:',
        userBtn: (id) => `User ${id}`,
        reloadStreamBtn: 'Reload Stream',
        streamingDataText: 'Streaming data via RxJS...',
      },
      resource: {
        title: '7. Angular 22: resource() Promise Loader',
        description:
          'Async loader using native async/await Promises with automatic AbortSignal cancellation support.',
        promisesStrong: 'Native Promises in Zoneless:',
        promisesText:
          'While rxResource() wraps RxJS Observables, resource() connects directly to standard fetch() or async/await functions, passing an AbortSignal that aborts if the parameter changes before completion.',
        selectTopicLabel: 'Select Search Topic:',
        reloadBtn: 'Reload',
        executingLoaderText: 'Executing async loader...',
      },
      toObservable: {
        title: '7. Bidirectional Interop: toObservable() + toSignal()',
        description:
          'Signal input piped through RxJS operators (like debounceTime), then mirrored back into a Signal.',
        typeToSearchLabel: 'Type to search (debounced 350ms):',
        searchPlaceholder: 'Type search terms...',
        rawInputLabel: 'Raw Signal Input:',
        debouncedSignalLabel: 'Debounced + UpperCase Signal:',
      },
    },
    rxjsVsSignals: {
      eyebrow: 'Angular 22 Architecture · Reactive Paradigms',
      heading: 'RxJS vs Angular Signals: Coexistence Guide',
      lead: "Master the reactive spectrum in modern Angular. Understand the fundamental trade-offs, when to use RxJS, when to use Signals, and how the 'Events In, State Out' pattern provides rock-solid zoneless architecture.",
      focusAriaLabel: 'Filter architecture topic',
      focusOptions: {
        all: 'All Architectures',
        decisionMatrix: 'Decision Matrix',
        searchDebounce: 'Search & Debounce',
        derivedState: 'Derived Calculations',
        asyncResource: 'Async Data Fetching',
        linkedState: 'Resetting Dependent State',
        coexistence: 'Coexistence Philosophy',
      },
      coexistence: {
        title: 'Architectural Philosophy: "Events In, State Out"',
        badge: 'Core Foundation',
        description:
          'Signals and RxJS are not competing rivals; they solve fundamentally different problems in application architecture.',
        step1Badge: '1. Events In (RxJS)',
        step1Title: 'Asynchronous Coordination',
        step1Items: [
          'User keystrokes, clicks, scrolls',
          'WebSocket & Server-Sent Events',
          'Debounce, throttle, debounceTime',
          'Retries, timeouts & exponential backoff',
          'Concurrency: switchMap, exhaustMap, concatMap',
        ],
        step2Badge: '2. State Out (Signals)',
        step2Title: 'Synchronous UI State',
        step2Items: [
          'Component and view model state',
          'Synchronous derivations (computed)',
          'Template bindings & zoneless CD',
          'Automatic cleanup (zero memory leaks)',
          'Signal I/O (input, output, model)',
        ],
        ruleStrong: 'The Universal Rule of Thumb:',
        ruleQuote:
          '"Use RxJS for events over time; use Signals for values over time."',
        ruleText:
          'If you need time, cancellation, or concurrency control, reach for RxJS. If you are holding, deriving, or displaying synchronous UI state, reach for Signals.',
      },
      decisionMatrix: {
        title: 'Interactive Decision Matrix',
        description:
          'Select a common production requirement to compare the RxJS, Signals, and Hybrid approaches.',
        categoryPrefix: 'Category:',
        recommendedPrefix: 'Recommended:',
        rxjsApproachTitle: 'RxJS Approach',
        signalsApproachTitle: 'Signals Approach',
        hybridApproachTitle: 'Best Practice / Hybrid',
        takeawayStrong: 'Architecture Takeaway:',
      },
      scenarios: [
        {
          id: 'search',
          title: 'Typeahead / Search Autocomplete',
          category: 'Hybrid',
          winner: 'Hybrid (Both)',
          summary:
            'Handling asynchronous key events with debounce and cancellation, then projecting the result into synchronous UI state.',
          rxjsApproach:
            'searchInput$.pipe(debounceTime(300), distinctUntilChanged(), switchMap(q => api.search(q)))',
          signalsApproach:
            'Signals do not natively support time-based throttling or debouncing without external timer plumbing.',
          hybridApproach:
            'query = signal(""); query$ = toObservable(this.query); results = toSignal(this.query$.pipe(debounceTime(300), switchMap(q => api.search(q))), { initialValue: [] })',
          ruleOfThumb:
            'Use RxJS to coordinate the asynchronous event stream over time, then terminate with toSignal() for clean, zoneless template rendering.',
        },
        {
          id: 'derived',
          title: 'Cart Total & Price Calculations',
          category: 'State',
          winner: 'Signals',
          summary:
            'Deriving synchronous computation from multiple state sources (items, quantity, discount, tax).',
          rxjsApproach:
            'combineLatest([items$, discount$, tax$]).pipe(map(([items, d, t]) => calculate(items, d, t))) — requires subscription, pipe, and manual change detection triggers in zoneless.',
          signalsApproach:
            'total = computed(() => calculate(this.items(), this.discount(), this.tax())) — automatic dynamic dependency tracking, synchronous pull, zero subscriptions, zero memory leaks.',
          hybridApproach:
            'Pure Signals win hands-down here. No RxJS needed for synchronous in-memory state derivation.',
          ruleOfThumb:
            'If state is synchronous in memory, always prefer signal() and computed().',
        },
        {
          id: 'websockets',
          title: 'Real-Time WebSockets & Event Feeds',
          category: 'Events',
          winner: 'RxJS',
          summary:
            'Continuous stream of push-based network packets, reconnection backoff, heartbeat intervals, and message filtering.',
          rxjsApproach:
            'webSocket$.pipe(retry({ delay: 2000 }), filter(isRelevant), scan(accumulateFeed, [])) — RxJS is designed specifically for push-based streams over time.',
          signalsApproach:
            'Signals only represent the latest discrete value; they do not natively model multi-emission push streams, dropouts, or packet queues.',
          hybridApproach:
            'Manage the socket lifecycle and buffering in RxJS, then expose feed = toSignal(feed$) for declarative template binding.',
          ruleOfThumb:
            'Whenever events are pushed over time (sockets, message buses, sensor feeds), RxJS is the gold standard.',
        },
        {
          id: 'spam-prevention',
          title: 'Form Submission & Double-Click Prevention',
          category: 'Events',
          winner: 'RxJS',
          summary:
            'Ensuring an in-flight submission blocks any rapid duplicate button clicks until the backend response returns.',
          rxjsApproach:
            'submitClick$.pipe(exhaustMap(() => authService.login(credentials))) — exhaustMap automatically discards clicks while the inner request is active.',
          signalsApproach:
            'Requires manual flag management: isSubmitting = signal(false); if (this.isSubmitting()) return; this.isSubmitting.set(true); try { ... } finally { this.isSubmitting.set(false); }',
          hybridApproach:
            'Use exhaustMap or a resource with disabled button state.',
          ruleOfThumb:
            'Use exhaustMap when concurrency requires ignoring incoming triggers during an active asynchronous operation.',
        },
        {
          id: 'dependent-reset',
          title: 'Dependent State Reset (e.g. Master-Detail)',
          category: 'State',
          winner: 'Signals',
          summary:
            'Changing a parent category resets the selected item to a default, while still permitting user selection.',
          rxjsApproach:
            'Historically required nested subjects or complex switchMap state resets in a service.',
          signalsApproach:
            'selectedItem = linkedSignal({ source: () => this.category(), computation: (cat) => cat.defaultItem }) — resets automatically on source change, yet directly writable with selectedItem.set()!',
          hybridApproach:
            'Pure Angular 22 linkedSignal() is the cleanest pattern for this in the entire frontend ecosystem.',
          ruleOfThumb:
            'Use linkedSignal() for writable local state that must stay in sync with a source dependency.',
        },
      ],
      derivedState: {
        title: 'Live Sandbox: Derived State (combineLatest vs computed)',
        description:
          'Deriving a synchronous total from base price, discount, and tax rate. Compare the clean ergonomics of Signals against stream piping.',
        basePriceLabel: 'Base Price ($):',
        discountLabel: 'Discount ($):',
        taxRateLabel: 'Tax Rate (20%):',
        fixed20Badge: '20% Fixed',
        signalsComputedLabel: 'Signals (computed)',
        syncPullBadge: 'Synchronous Pull',
        signalsNote:
          'Evaluated lazily, glitch-free, memoized, zero subscription cleanup required.',
        rxjsCombineLabel: 'RxJS (combineLatest)',
        pushStreamBadge: 'Push Stream',
        rxjsNote:
          'Requires 3 BehaviorSubjects, combineLatest, map pipe, and toSignal or async pipe.',
      },
      searchDebounce: {
        title: 'Live Sandbox: Time-Based Search (Hybrid Interop)',
        description:
          'Signals have no native concept of time delays or debouncing. We use toObservable() to leverage RxJS time operators, then store the result in a Signal via toSignal().',
        inputLabel: 'Type rapidly to observe debounce (400ms):',
        inputPlaceholder: 'Type query...',
        rawSignalLabel: 'Raw Keystroke Signal (Immediate):',
        debouncedSignalLabel: 'Debounced + Normalized Signal (toSignal):',
      },
      asyncResource: {
        title: 'Live Sandbox: Async Data with rxResource()',
        description:
          'Angular 22 introduces resource() and rxResource() to unify async data fetching with signals. It manages loading indicators, params reactivity, and cancellation automatically.',
        selectLocationLabel: 'Select Location:',
        parisBtn: 'Paris',
        tokyoBtn: 'Tokyo',
        nycBtn: 'New York',
        reloadStreamBtn: 'Reload Stream',
        fetchingWeatherText: 'Fetching weather stream via rxResource...',
        statusPrefix: 'Status:',
      },
      linkedState: {
        title: 'Live Sandbox: Dependent State with linkedSignal()',
        description:
          "In Angular applications, a classic bug is resetting child state when parent state changes. Angular 22's linkedSignal() provides an auto-resetting writable signal.",
        selectPlanLabel: 'Select Plan Tier (Parent State):',
        basicBtn: 'Basic (20GB)',
        proBtn: 'Pro (100GB)',
        enterpriseBtn: 'Enterprise (500GB)',
        adjustQuotaLabel: 'Adjust Storage Quota (Writable Signal Mutation):',
        customOverrideBadge: 'Custom Override',
        resetPlanDefaultBtn: 'Reset to plan default',
        planDefaultBadge: 'Plan default',
      },
    },
    quiz: {
      eyebrow: 'Knowledge Assessment',
      heading: 'RxJS & Angular Reactivity Challenge',
      lead: 'Test your mastery of stream transformation, multicasting, error recovery, caching, and modern Angular 22 Signals.',
      tracks: {
        beginnerTitle: 'Beginner',
        beginnerBadge: 'Fundamentals',
        beginnerDesc: 'Observables, basic operators, and primary data sharing.',
        beginnerBtn: 'Start Beginner Track',
        midTitle: 'Mid-level',
        midBadge: 'Operators & Subjects',
        midDesc: 'Higher-order mapping, multicasting, caching, and batching.',
        midBtn: 'Start Mid-level Track',
        seniorTitle: 'Senior',
        seniorBadge: 'Architecture & Interop',
        seniorDesc:
          'Zoneless execution, linkedSignal, rxResource, and edge cases.',
        seniorBtn: 'Start Senior Track',
      },
      questionProgress: (current, total) => `Question ${current} of ${total}`,
      answerPlaceholder: 'Type your answer and press Enter...',
      correctAnswerLabel: 'Correct answer:',
      submitAnswerBtn: 'Submit Answer',
      correctToast: 'Correct!',
      incorrectToast: 'Not quite! Review the concept for help.',
      correctFeedback: 'Correct! Well done.',
      incorrectFeedback: 'Not quite. This concept is covered in:',
      reviewConceptBtn: 'Review Concept',
      nextQuestionBtn: 'Next Question',
      finishQuizBtn: 'Finish Quiz',
      quizCompleteTitle: 'Quiz Complete!',
      scoreText: (score, total) => `You scored ${score} out of ${total}`,
      tryAnotherBtn: 'Try Another Level',
      questions: [
        {
          id: 1,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'Which operator is used to handle errors in a stream and provide a fallback value?',
          options: ['retry', 'throwError', 'catchError', 'finalize'],
          answer: 'catchError',
          relatedRoute: '/error-handling',
        },
        {
          id: 2,
          type: 'fill-in-the-blank',
          difficulty: 'Beginner',
          text: 'A "cold" observable starts producing values only when a ____ subscribes to it.',
          answer: 'subscriber',
          relatedRoute: '/multicasting',
        },
        {
          id: 7,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'Which function is used to pass data from a parent component to a child component?',
          options: ['output()', 'input()', 'signal()', 'effect()'],
          answer: 'input()',
          relatedRoute: '/sharing-data',
        },
        {
          id: 10,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'What does the `$` suffix traditionally signify on a variable name in RxJS?',
          options: [
            'A Subject',
            'A final value',
            'An Observable',
            'A private property',
          ],
          answer: 'An Observable',
          relatedRoute: '/multicasting',
        },
        {
          id: 11,
          type: 'fill-in-the-blank',
          difficulty: 'Beginner',
          text: 'In Angular, the ____ function is used to create a derived value from one or more signals.',
          answer: 'computed',
          relatedRoute: '/signals',
        },
        {
          id: 3,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'For a live search input, which higher-order mapping operator is best to prevent unnecessary network requests?',
          options: ['concatMap', 'mergeMap', 'exhaustMap', 'switchMap'],
          answer: 'switchMap',
          relatedRoute: '/transforming-streams',
        },
        {
          id: 4,
          type: 'code-completion',
          difficulty: 'Mid-level',
          text: 'Complete the code to run both API calls in parallel and get the results only when both are complete.',
          codeSnippet: `\nconst user$ = this.http.get('/api/user');\nconst permissions$ = this.http.get('/api/permissions');\n\n____([user$, permissions$]).subscribe(([user, permissions]) => {\n  // ...\n});`,
          answer: 'forkJoin',
          relatedRoute: '/bulk-operations',
        },
        {
          id: 8,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'Which operator is ideal for caching and sharing the result of an HTTP request?',
          options: ['share', 'cache', 'shareReplay', 'multicast'],
          answer: 'shareReplay',
          relatedRoute: '/reactive-caching',
        },
        {
          id: 12,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: "Which Subject is best for storing a user's authentication status that new components can check upon creation?",
          options: [
            'Subject',
            'AsyncSubject',
            'BehaviorSubject',
            'ReplaySubject',
          ],
          answer: 'BehaviorSubject',
          relatedRoute: '/multicasting',
        },
        {
          id: 13,
          type: 'code-completion',
          difficulty: 'Mid-level',
          text: 'Fill in the blank to batch incoming data into arrays of 4.',
          codeSnippet: `\nsource$.pipe(\n  ____(4)\n).subscribe(batch => console.log(batch));`,
          answer: 'bufferCount',
          relatedRoute: '/bulk-operations',
        },
        {
          id: 16,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'In Angular 22, which signal primitive creates a writable signal that resets to a computed default when its source changes?',
          options: ['computed()', 'linkedSignal()', 'toSignal()', 'effect()'],
          answer: 'linkedSignal()',
          relatedRoute: '/signals',
        },
        {
          id: 5,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'Which Subject type will give a new subscriber the last 3 emitted values?',
          options: [
            'Subject',
            'AsyncSubject',
            'BehaviorSubject(3)',
            'ReplaySubject(3)',
          ],
          answer: 'ReplaySubject(3)',
          relatedRoute: '/multicasting',
        },
        {
          id: 6,
          type: 'fill-in-the-blank',
          difficulty: 'Senior',
          text: 'To convert a "cold" observable into a "hot" one that starts emitting on the first subscription and shares its values, you can use the ____ operator.',
          answer: 'share()',
          relatedRoute: '/multicasting',
        },
        {
          id: 9,
          type: 'code-completion',
          difficulty: 'Senior',
          text: 'Fill in the blank to ensure the login request is ignored if one is already in progress.',
          codeSnippet: `\nloginClick$.pipe(\n  ____(() => this.authService.login(credentials))\n).subscribe();`,
          answer: 'exhaustMap',
          relatedRoute: '/transforming-streams',
        },
        {
          id: 14,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'In RxJS marble testing, what does the character `|` signify?',
          options: [
            'An error',
            'A value emission',
            'Completion of the stream',
            'A subscription point',
          ],
          answer: 'Completion of the stream',
          relatedRoute: '/multicasting',
        },
        {
          id: 15,
          type: 'code-completion',
          difficulty: 'Senior',
          text: 'Complete the code to convert an observable to a signal, providing a default value until the observable emits.',
          codeSnippet: `\nconst data$ = this.dataService.getData();\nconst data = toSignal(data$, { ____: 'Loading...' });`,
          answer: 'initialValue',
          relatedRoute: '/signals',
        },
        {
          id: 17,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'In Angular 22, which function from @angular/core/rxjs-interop loads asynchronous data from an RxJS stream into declarative signals with automatic loading and reload capabilities?',
          options: [
            'toSignal()',
            'rxResource()',
            'toObservable()',
            'outputFromObservable()',
          ],
          answer: 'rxResource()',
          relatedRoute: '/signals',
        },
      ],
    },
  },
  fr: {
    signals: {
      eyebrow: 'Angular 22 · Primitives réactives',
      heading: 'Exercice : Signals et interopérabilité réactive',
      lead: 'Explorez les signaux à granularité fine, les signaux calculés (computed), les effets, les réinitialisations avec linkedSignal et l’interopérabilité RxJS bidirectionnelle.',
      focusAriaLabel: 'Filtrer le sujet Signal',
      focusOptions: {
        all: 'Tous les sujets',
        basics: 'Bases des Signals',
        toSignal: 'toSignal()',
        linkedSignal: 'linkedSignal()',
        rxResource: 'rxResource()',
        resource: 'resource() [Promise]',
        toObservable: 'toObservable()',
      },
      analogyStrong: 'Analogie :',
      statusPrefix: 'Statut :',
      writable: {
        title: '1. Signals modifiables : signal()',
        description:
          'Les sources de vérité fondamentales dans Angular moderne. Mutent directement l’état et notifient finement les dépendances.',
        firstNameLabel: 'Prénom :',
        lastNameLabel: 'Nom :',
        quantityLabel: 'Quantité :',
      },
      computed: {
        title: '2. Signals calculés : computed()',
        description:
          'Dérivent des valeurs en lecture seule mémoïsées. Évalués paresseusement et recalculés uniquement lorsque leurs dépendances changent.',
        fullNameLabel: 'Nom complet :',
        isStockLowLabel: 'Stock faible ?',
        stockMessageLabel: 'Message de stock :',
        lowStockMsg: (qty) => `Plus que ${qty} en stock — commandez vite !`,
        inStockMsg: (qty) => `${qty} en stock.`,
      },
      effect: {
        title: '3. Effets : effect()',
        description:
          'Effets de bord planifiés dès que les signaux suivis changent.',
        auditTrailTitle: 'Journal d’audit des effets',
      },
      toSignal: {
        title: '4. Interopérabilité RxJS : toSignal()',
        description:
          'Convertit un Observable RxJS en un Signal réactif en lecture seule avec nettoyage automatique de l’abonnement.',
        analogyText:
          'S’abonner à un magazine (Observable) : chaque nouveau numéro est déposé dans votre boîte aux lettres (Signal), prêt à être lu de manière synchrone.',
        streamLabel: 'Flux Observable RxJS interval(1000)',
        resultingSignalLabel: 'Signal résultant (counterSignal) :',
        computedEvenLabel: 'Calculé depuis le Signal (isEven) :',
        startStreamBtn: 'Démarrer le flux',
        stopStreamBtn: 'Arrêter le flux',
      },
      linkedSignal: {
        title: '5. Angular 22 : linkedSignal()',
        description:
          'Un signal modifiable qui se réinitialise à une valeur par défaut calculée lorsque sa dépendance source change, tout en permettant des modifications directes.',
        whyStrong: 'Pourquoi linkedSignal ?',
        whyText:
          'Avec computed(), l’état est en lecture seule. Avec des signaux séparés et des effets, la synchronisation crée des glitches. linkedSignal() résout cela élégamment.',
        choosePlanLabel: 'Choisir le forfait :',
        starterBtn: 'Starter (5)',
        proBtn: 'Pro (25)',
        enterpriseBtn: 'Enterprise (100)',
        adjustCreditsLabel:
          'Ajuster les crédits de calcul (Mutation directe) :',
        overriddenBadge: 'Personnalisé',
        resetDefaultBtn: 'Réinitialiser par défaut',
        planDefaultBadge: 'Valeur par défaut du forfait',
      },
      rxResource: {
        title: '6. Angular 22 : Chargeur asynchrone rxResource()',
        description:
          'Relie directement les flux RxJS asynchrones à des Signals déclaratifs avec état de chargement, annulation et gestion d’erreurs.',
        zonelessStrong: 'Données asynchrones en Angular Zoneless :',
        zonelessText:
          'rxResource() exécute un flux RxJS et expose des signaux synchrones value(), isLoading() et status() sans zone.js.',
        selectUserIdLabel: 'Sélectionner l’ID utilisateur :',
        userBtn: (id) => `Utilisateur ${id}`,
        reloadStreamBtn: 'Recharger le flux',
        streamingDataText: 'Flux de données via RxJS...',
      },
      resource: {
        title: '7. Angular 22 : Chargeur Promise resource()',
        description:
          'Chargeur asynchrone utilisant des Promises async/await natives avec annulation automatique via AbortSignal.',
        promisesStrong: 'Promises natives en mode Zoneless :',
        promisesText:
          'Tandis que rxResource() encapsule des Observables RxJS, resource() se connecte directement à fetch() ou async/await en passant un AbortSignal.',
        selectTopicLabel: 'Choisir le sujet :',
        reloadBtn: 'Recharger',
        executingLoaderText: 'Exécution du chargeur asynchrone...',
      },
      toObservable: {
        title:
          '7. Interopérabilité bidirectionnelle : toObservable() + toSignal()',
        description:
          'Un Signal d’entrée passé dans des opérateurs RxJS (comme debounceTime), puis reconverti en Signal.',
        typeToSearchLabel: 'Tapez pour rechercher (debounce 350 ms) :',
        searchPlaceholder: 'Saisissez des termes...',
        rawInputLabel: 'Signal d’entrée brut :',
        debouncedSignalLabel: 'Signal avec debounce + Majuscules :',
      },
    },
    rxjsVsSignals: {
      eyebrow: 'Architecture Angular 22 · Paradigmes réactifs',
      heading: 'RxJS vs Angular Signals : Guide de coexistence',
      lead: 'Maîtrisez le spectre réactif dans Angular moderne. Comprenez quand utiliser RxJS, quand utiliser les Signals et comment le modèle « Événements en entrée, État en sortie » structure une architecture zoneless robuste.',
      focusAriaLabel: 'Filtrer le sujet d’architecture',
      focusOptions: {
        all: 'Toutes les architectures',
        decisionMatrix: 'Matrice de décision',
        searchDebounce: 'Recherche & Debounce',
        derivedState: 'Calculs dérivés',
        asyncResource: 'Chargement asynchrone',
        linkedState: 'Réinitialisation d’état lié',
        coexistence: 'Philosophie de coexistence',
      },
      coexistence: {
        title:
          'Philosophie d’architecture : « Événements en entrée, État en sortie »',
        badge: 'Fondation clé',
        description:
          'Les Signals et RxJS ne sont pas des rivaux : ils résolvent des problèmes fondamentalement complémentaires.',
        step1Badge: '1. Événements en entrée (RxJS)',
        step1Title: 'Coordination asynchrone',
        step1Items: [
          'Frappes clavier, clics, défilement',
          'WebSockets & événements serveur (SSE)',
          'Debounce, throttle, debounceTime',
          'Nouvelles tentatives, timeouts & backoff exponentiel',
          'Concurrence : switchMap, exhaustMap, concatMap',
        ],
        step2Badge: '2. État en sortie (Signals)',
        step2Title: 'État UI synchrone',
        step2Items: [
          'État des composants et du modèle de vue',
          'Dérivations synchrones (computed)',
          'Liaisons de template & détection sans Zone',
          'Nettoyage automatique (zéro fuite mémoire)',
          'Entrées/Sorties Signal (input, output, model)',
        ],
        ruleStrong: 'La règle d’or universelle :',
        ruleQuote:
          '« Utilisez RxJS pour les événements dans le temps ; utilisez les Signals pour les valeurs dans le temps. »',
        ruleText:
          'Si vous avez besoin de gestion du temps, d’annulation ou de concurrence, choisissez RxJS. Pour stocker, dériver ou afficher un état UI synchrone, choisissez les Signals.',
      },
      decisionMatrix: {
        title: 'Matrice de décision interactive',
        description:
          'Sélectionnez un besoin courant en production pour comparer les approches RxJS, Signals et Hybride.',
        categoryPrefix: 'Catégorie :',
        recommendedPrefix: 'Recommandé :',
        rxjsApproachTitle: 'Approche RxJS',
        signalsApproachTitle: 'Approche Signals',
        hybridApproachTitle: 'Bonne pratique / Hybride',
        takeawayStrong: 'À retenir :',
      },
      scenarios: [
        {
          id: 'search',
          title: 'Autocomplétion / Recherche instantanée',
          category: 'Hybrid',
          winner: 'Hybrid (Both)',
          summary:
            'Gestion des frappes clavier asynchrones avec debounce et annulation, puis projection du résultat dans un état UI synchrone.',
          rxjsApproach:
            'searchInput$.pipe(debounceTime(300), distinctUntilChanged(), switchMap(q => api.search(q)))',
          signalsApproach:
            'Les Signals ne gèrent pas nativement le throttling ou le debouncing temporel sans minuterie externe.',
          hybridApproach:
            'query = signal(""); query$ = toObservable(this.query); results = toSignal(this.query$.pipe(debounceTime(300), switchMap(q => api.search(q))), { initialValue: [] })',
          ruleOfThumb:
            'Utilisez RxJS pour coordonner le flux d’événements asynchrones dans le temps, puis terminez avec toSignal() pour un rendu zoneless propre.',
        },
        {
          id: 'derived',
          title: 'Total du panier et calculs de prix',
          category: 'State',
          winner: 'Signals',
          summary:
            'Dérivation synchrone à partir de plusieurs sources d’état (articles, quantité, remise, taxes).',
          rxjsApproach:
            'combineLatest([items$, discount$, tax$]).pipe(map(...)) — nécessite abonnement, pipe et gestion manuelle.',
          signalsApproach:
            'total = computed(() => calculate(this.items(), this.discount(), this.tax())) — suivi dynamique automatique, lecture synchrone, zéro abonnement.',
          hybridApproach:
            'Les Signals purs l’emportent largement ici. Aucun besoin de RxJS pour dériver un état synchrone en mémoire.',
          ruleOfThumb:
            'Si l’état est synchrone en mémoire, privilégiez toujours signal() et computed().',
        },
        {
          id: 'websockets',
          title: 'WebSockets temps réel et flux d’événements',
          category: 'Events',
          winner: 'RxJS',
          summary:
            'Flux continu de paquets réseau poussés, reconnexion automatique, battements de cœur et filtrage de messages.',
          rxjsApproach:
            'webSocket$.pipe(retry({ delay: 2000 }), filter(isRelevant), scan(accumulateFeed, [])) — RxJS est conçu pour les flux push dans le temps.',
          signalsApproach:
            'Les Signals ne représentent que la dernière valeur discrète et ne modélisent pas nativement les files de paquets.',
          hybridApproach:
            'Gérez le cycle de vie du socket dans RxJS, puis exposez feed = toSignal(feed$) pour le template.',
          ruleOfThumb:
            'Dès que des événements sont poussés au fil du temps (sockets, bus de messages), RxJS reste la référence.',
        },
        {
          id: 'spam-prevention',
          title: 'Soumission de formulaire et anti double-clic',
          category: 'Events',
          winner: 'RxJS',
          summary:
            'Garantir qu’une soumission en cours ignore les clics répétés jusqu’à la réponse du serveur.',
          rxjsApproach:
            'submitClick$.pipe(exhaustMap(() => authService.login(credentials))) — exhaustMap ignore automatiquement les clics tant que la requête est active.',
          signalsApproach:
            'Nécessite une gestion manuelle de drapeau booléen isSubmitting avec bloc try/finally.',
          hybridApproach:
            'Utilisez exhaustMap ou une ressource avec bouton désactivé.',
          ruleOfThumb:
            'Utilisez exhaustMap lorsque la concurrence impose d’ignorer les déclencheurs entrants pendant une opération active.',
        },
        {
          id: 'dependent-reset',
          title: 'Réinitialisation d’état dépendant (Master-Detail)',
          category: 'State',
          winner: 'Signals',
          summary:
            'Changer une catégorie parente réinitialise l’élément sélectionné par défaut, tout en permettant la sélection manuelle.',
          rxjsApproach:
            'Nécessitait historiquement des Subjects imbriqués ou des switchMap complexes.',
          signalsApproach:
            'selectedItem = linkedSignal({ source: () => this.category(), computation: (cat) => cat.defaultItem }) — se réinitialise automatiquement tout en restant modifiable !',
          hybridApproach:
            'linkedSignal() d’Angular 22 est le modèle le plus propre de tout l’écosystème frontend.',
          ruleOfThumb:
            'Utilisez linkedSignal() pour un état local modifiable qui doit rester synchronisé avec une source.',
        },
      ],
      derivedState: {
        title: 'Bac à sable : État dérivé (combineLatest vs computed)',
        description:
          'Calculer un total synchrone à partir du prix de base, de la remise et de la TVA. Comparez l’ergonomie des Signals face aux flux.',
        basePriceLabel: 'Prix de base ($) :',
        discountLabel: 'Remise ($) :',
        taxRateLabel: 'Taux de TVA (20 %) :',
        fixed20Badge: '20 % Fixe',
        signalsComputedLabel: 'Signals (computed)',
        syncPullBadge: 'Lecture synchrone',
        signalsNote:
          'Évalué paresseusement, sans glitch, mémoïsé, aucun nettoyage d’abonnement requis.',
        rxjsCombineLabel: 'RxJS (combineLatest)',
        pushStreamBadge: 'Flux Push',
        rxjsNote:
          'Nécessite 3 BehaviorSubjects, combineLatest, map et toSignal ou le pipe async.',
      },
      searchDebounce: {
        title: 'Bac à sable : Recherche temporisée (Interop hybride)',
        description:
          'Les Signals n’ont pas de notion native de délai. On utilise toObservable() pour les opérateurs temporels RxJS, puis toSignal() pour l’affichage.',
        inputLabel: 'Tapez rapidement pour observer le debounce (400 ms) :',
        inputPlaceholder: 'Saisissez une requête...',
        rawSignalLabel: 'Signal de frappe brut (Immédiat) :',
        debouncedSignalLabel: 'Signal temporisé et normalisé (toSignal) :',
      },
      asyncResource: {
        title: 'Bac à sable : Données asynchrones avec rxResource()',
        description:
          'Angular 22 introduit resource() et rxResource() pour unifier le chargement asynchrone et les Signals avec gestion automatique du chargement et de l’annulation.',
        selectLocationLabel: 'Choisir une ville :',
        parisBtn: 'Paris',
        tokyoBtn: 'Tokyo',
        nycBtn: 'New York',
        reloadStreamBtn: 'Recharger le flux',
        fetchingWeatherText: 'Chargement de la météo via rxResource...',
        statusPrefix: 'Statut :',
      },
      linkedState: {
        title: 'Bac à sable : État dépendant avec linkedSignal()',
        description:
          'Réinitialiser un état enfant lorsque le parent change est un classique. linkedSignal() d’Angular 22 fournit un signal modifiable auto-réinitialisé.',
        selectPlanLabel: 'Choisir le forfait (État parent) :',
        basicBtn: 'Basic (20 Go)',
        proBtn: 'Pro (100 Go)',
        enterpriseBtn: 'Enterprise (500 Go)',
        adjustQuotaLabel: 'Ajuster le quota de stockage (Mutation directe) :',
        customOverrideBadge: 'Quota personnalisé',
        resetPlanDefaultBtn: 'Réinitialiser au forfait',
        planDefaultBadge: 'Valeur du forfait',
      },
    },
    quiz: {
      eyebrow: 'Évaluation des connaissances',
      heading: 'Défi RxJS & Réactivité Angular',
      lead: 'Testez votre maîtrise de la transformation de flux, de la multidiffusion, de la gestion d’erreurs, du cache et des Signals Angular 22.',
      tracks: {
        beginnerTitle: 'Débutant',
        beginnerBadge: 'Fondamentaux',
        beginnerDesc: 'Observables, opérateurs de base et partage de données.',
        beginnerBtn: 'Démarrer le parcours Débutant',
        midTitle: 'Intermédiaire',
        midBadge: 'Opérateurs & Subjects',
        midDesc: 'Projection d’ordre supérieur, multidiffusion, cache et lots.',
        midBtn: 'Démarrer le parcours Intermédiaire',
        seniorTitle: 'Senior',
        seniorBadge: 'Architecture & Interop',
        seniorDesc:
          'Exécution zoneless, linkedSignal, rxResource et cas avancés.',
        seniorBtn: 'Démarrer le parcours Senior',
      },
      questionProgress: (current, total) => `Question ${current} sur ${total}`,
      answerPlaceholder: 'Tapez votre réponse et appuyez sur Entrée...',
      correctAnswerLabel: 'Bonne réponse :',
      submitAnswerBtn: 'Valider la réponse',
      correctToast: 'Exact !',
      incorrectToast: 'Pas tout à fait ! Révisez le concept pour vous aider.',
      correctFeedback: 'Exact ! Bien joué.',
      incorrectFeedback: 'Pas tout à fait. Ce concept est abordé dans :',
      reviewConceptBtn: 'Réviser le concept',
      nextQuestionBtn: 'Question suivante',
      finishQuizBtn: 'Terminer le quiz',
      quizCompleteTitle: 'Quiz terminé !',
      scoreText: (score, total) => `Votre score : ${score} sur ${total}`,
      tryAnotherBtn: 'Essayer un autre niveau',
      questions: [
        {
          id: 1,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'Quel opérateur permet d’intercepter les erreurs dans un flux et de fournir une valeur de repli ?',
          options: ['retry', 'throwError', 'catchError', 'finalize'],
          answer: 'catchError',
          relatedRoute: '/error-handling',
        },
        {
          id: 2,
          type: 'fill-in-the-blank',
          difficulty: 'Beginner',
          text: 'Un Observable « froid » (cold) ne commence à produire des valeurs que lorsqu’un ____ s’y abonne.',
          answer: 'subscriber',
          relatedRoute: '/multicasting',
        },
        {
          id: 7,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'Quelle fonction est utilisée pour transmettre des données d’un composant parent à un composant enfant ?',
          options: ['output()', 'input()', 'signal()', 'effect()'],
          answer: 'input()',
          relatedRoute: '/sharing-data',
        },
        {
          id: 10,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'Que signifie traditionnellement le suffixe `$` sur un nom de variable en RxJS ?',
          options: [
            'Un Subject',
            'Une valeur finale',
            'Un Observable',
            'Une propriété privée',
          ],
          answer: 'Un Observable',
          relatedRoute: '/multicasting',
        },
        {
          id: 11,
          type: 'fill-in-the-blank',
          difficulty: 'Beginner',
          text: 'Dans Angular, la fonction ____ permet de créer une valeur dérivée à partir d’un ou plusieurs signaux.',
          answer: 'computed',
          relatedRoute: '/signals',
        },
        {
          id: 3,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'Pour un champ de recherche en direct, quel opérateur de projection évite les requêtes réseau obsolètes ?',
          options: ['concatMap', 'mergeMap', 'exhaustMap', 'switchMap'],
          answer: 'switchMap',
          relatedRoute: '/transforming-streams',
        },
        {
          id: 4,
          type: 'code-completion',
          difficulty: 'Mid-level',
          text: 'Complétez le code pour exécuter les deux appels API en parallèle et obtenir les résultats une fois les deux terminés.',
          codeSnippet: `\nconst user$ = this.http.get('/api/user');\nconst permissions$ = this.http.get('/api/permissions');\n\n____([user$, permissions$]).subscribe(([user, permissions]) => {\n  // ...\n});`,
          answer: 'forkJoin',
          relatedRoute: '/bulk-operations',
        },
        {
          id: 8,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'Quel opérateur est idéal pour mettre en cache et partager le résultat d’une requête HTTP ?',
          options: ['share', 'cache', 'shareReplay', 'multicast'],
          answer: 'shareReplay',
          relatedRoute: '/reactive-caching',
        },
        {
          id: 12,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'Quel Subject est le plus adapté pour stocker l’état d’authentification qu’un nouveau composant doit lire dès sa création ?',
          options: [
            'Subject',
            'AsyncSubject',
            'BehaviorSubject',
            'ReplaySubject',
          ],
          answer: 'BehaviorSubject',
          relatedRoute: '/multicasting',
        },
        {
          id: 13,
          type: 'code-completion',
          difficulty: 'Mid-level',
          text: 'Complétez le code pour regrouper les données entrantes par tableaux de 4 éléments.',
          codeSnippet: `\nsource$.pipe(\n  ____(4)\n).subscribe(batch => console.log(batch));`,
          answer: 'bufferCount',
          relatedRoute: '/bulk-operations',
        },
        {
          id: 16,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'Dans Angular 22, quelle primitive crée un signal modifiable qui se réinitialise lorsque sa source change ?',
          options: ['computed()', 'linkedSignal()', 'toSignal()', 'effect()'],
          answer: 'linkedSignal()',
          relatedRoute: '/signals',
        },
        {
          id: 5,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'Quel type de Subject fournit à un nouvel abonné les 3 dernières valeurs émises ?',
          options: [
            'Subject',
            'AsyncSubject',
            'BehaviorSubject(3)',
            'ReplaySubject(3)',
          ],
          answer: 'ReplaySubject(3)',
          relatedRoute: '/multicasting',
        },
        {
          id: 6,
          type: 'fill-in-the-blank',
          difficulty: 'Senior',
          text: 'Pour convertir un Observable froid en Observable chaud qui partage ses valeurs dès le premier abonnement, on utilise l’opérateur ____.',
          answer: 'share()',
          relatedRoute: '/multicasting',
        },
        {
          id: 9,
          type: 'code-completion',
          difficulty: 'Senior',
          text: 'Complétez le code pour ignorer les clics de connexion tant qu’une requête est déjà en cours.',
          codeSnippet: `\nloginClick$.pipe(\n  ____(() => this.authService.login(credentials))\n).subscribe();`,
          answer: 'exhaustMap',
          relatedRoute: '/transforming-streams',
        },
        {
          id: 14,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'Dans les tests de billes (marble testing) RxJS, que représente le caractère `|` ?',
          options: [
            'Une erreur',
            'Une émission de valeur',
            'La complétion du flux',
            'Un point d’abonnement',
          ],
          answer: 'La complétion du flux',
          relatedRoute: '/multicasting',
        },
        {
          id: 15,
          type: 'code-completion',
          difficulty: 'Senior',
          text: 'Complétez le code pour convertir un Observable en Signal avec une valeur par défaut avant la première émission.',
          codeSnippet: `\nconst data$ = this.dataService.getData();\nconst data = toSignal(data$, { ____: 'Loading...' });`,
          answer: 'initialValue',
          relatedRoute: '/signals',
        },
        {
          id: 17,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'Dans Angular 22, quelle fonction de @angular/core/rxjs-interop charge des données asynchrones depuis un flux RxJS dans des signaux déclaratifs ?',
          options: [
            'toSignal()',
            'rxResource()',
            'toObservable()',
            'outputFromObservable()',
          ],
          answer: 'rxResource()',
          relatedRoute: '/signals',
        },
      ],
    },
  },
  ar: {
    signals: {
      eyebrow: 'Angular 22 · الأساسيات التفاعلية',
      heading: 'تمرين: الإشارات (Signals) والتكامل التفاعلي',
      lead: 'استكشف الإشارات الدقيقة، والقيم المحسوبة (computed)، والتأثيرات الجانبية، وإعادة التعيين بـ linkedSignal، والتكامل ثنائي الاتجاه مع RxJS.',
      focusAriaLabel: 'تصفية موضوع الإشارات',
      focusOptions: {
        all: 'جميع مواضيع الإشارات',
        basics: 'أساسيات الإشارات',
        toSignal: 'toSignal()',
        linkedSignal: 'linkedSignal()',
        rxResource: 'rxResource()',
        resource: 'resource() [Promise]',
        toObservable: 'toObservable()',
      },
      analogyStrong: 'تشبيه:',
      statusPrefix: 'الحالة:',
      writable: {
        title: '1. الإشارات القابلة للكتابة: signal()',
        description:
          'مصادر الحقيقة الأساسية في Angular الحديث. عدّل الحالة مباشرة وأشعر التبعيات بدقة.',
        firstNameLabel: 'الاسم الأول:',
        lastNameLabel: 'اسم العائلة:',
        quantityLabel: 'الكمية:',
      },
      computed: {
        title: '2. الإشارات المحسوبة: computed()',
        description:
          'اشتقاق قيم للقراءة فقط مخزنة مؤقتًا عند التغيير. تُقيّم بشكل كسول ولا يعاد حسابها إلا عند تغير تبعياتها.',
        fullNameLabel: 'الاسم الكامل:',
        isStockLowLabel: 'هل المخزون منخفض؟',
        stockMessageLabel: 'رسالة المخزون:',
        lowStockMsg: (qty) => `تبقى ${qty} فقط في المخزون - اطلب قريبًا!`,
        inStockMsg: (qty) => `${qty} في المخزون.`,
      },
      effect: {
        title: '3. التأثيرات: effect()',
        description:
          'آثار جانبية تُجدول تلقائيًا كلما تغيرت الإشارات المتتبعة.',
        auditTrailTitle: 'سجل تدقيق التأثيرات',
      },
      toSignal: {
        title: '4. تكامل RxJS: toSignal()',
        description:
          'يحوّل Observable في RxJS إلى إشارة تفاعلية للقراءة فقط مع تنظيف تلقائي للاشتراك.',
        analogyText:
          'الاشتراك في مجلة دورية (Observable): يتم وضع كل عدد جديد مباشرة في صندوق بريدك (Signal) ليكون جاهزًا للقراءة المتزامنة فورًا.',
        streamLabel: 'تدفق Observable لـ interval(1000) في RxJS',
        resultingSignalLabel: 'الإشارة الناتجة (counterSignal):',
        computedEvenLabel: 'محسوب من الإشارة (isEven):',
        startStreamBtn: 'بدء التدفق',
        stopStreamBtn: 'إيقاف التدفق',
      },
      linkedSignal: {
        title: '5. Angular 22: linkedSignal()',
        description:
          'إشارة قابلة للكتابة تعيد تعيين نفسها إلى قيمة افتراضية محسوبة كلما تغيرت تبعية المصدر، مع دعم التعديل المباشر.',
        whyStrong: 'لماذا linkedSignal؟',
        whyText:
          'مع computed() تكون الحالة للقراءة فقط، ومع الإشارات المنفصلة والتأثيرات قد تحدث اختلالات تزامن. تحل linkedSignal() ذلك بأناقة.',
        choosePlanLabel: 'اختر فئة الخطة:',
        starterBtn: 'Starter (5)',
        proBtn: 'Pro (25)',
        enterpriseBtn: 'Enterprise (100)',
        adjustCreditsLabel: 'تعديل رصيد الحوسبة (تعديل مباشر):',
        overriddenBadge: 'معدّل يدويًا',
        resetDefaultBtn: 'إعادة إلى الافتراضي',
        planDefaultBadge: 'افتراضي الخطة',
      },
      rxResource: {
        title: '6. Angular 22: محمّل rxResource() غير المتزامن',
        description:
          'يربط تدفقات RxJS غير المتزامنة مباشرة بإشارات تصريحية مع مؤشرات التحميل والإلغاء وحدود الأخطاء.',
        zonelessStrong: 'البيانات غير المتزامنة بدون Zone.js:',
        zonelessText:
          'ينفذ rxResource() تدفق محمّل RxJS، ويوفر إشارات متزامنة لـ value() وisLoading() وstatus() بدون zone.js.',
        selectUserIdLabel: 'اختر معرّف المستخدم:',
        userBtn: (id) => `المستخدم ${id}`,
        reloadStreamBtn: 'إعادة تحميل التدفق',
        streamingDataText: 'جارٍ بث البيانات عبر RxJS...',
      },
      resource: {
        title: '7. Angular 22: محمّل الوعود resource()',
        description:
          'محمّل غير متزامن يستخدم وعود async/await الأصلية مع دعم الإلغاء التلقائي عبر AbortSignal.',
        promisesStrong: 'الوعود الأصلية في وضع Zoneless:',
        promisesText:
          'بينما يغلف rxResource() تدفقات RxJS، يتصل resource() مباشرة بـ fetch() أو دوال async/await ويمرر AbortSignal للإلغاء التلقائي.',
        selectTopicLabel: 'اختر موضوع البحث:',
        reloadBtn: 'إعادة تحميل',
        executingLoaderText: 'جارٍ تنفيذ المحمّل غير المتزامن...',
      },
      toObservable: {
        title: '7. التكامل ثنائي الاتجاه: toObservable() + toSignal()',
        description:
          'تمرير إشارة إدخال عبر معاملات RxJS الزمنية (مثل debounceTime) ثم إعادتها إلى إشارة.',
        typeToSearchLabel: 'اكتب للبحث (تأخير 350 مللي ثانية):',
        searchPlaceholder: 'اكتب عبارات البحث...',
        rawInputLabel: 'إشارة الإدخال الخام:',
        debouncedSignalLabel: 'الإشارة المؤجلة بالأحرف الكبيرة:',
      },
    },
    rxjsVsSignals: {
      eyebrow: 'معمارية Angular 22 · الأنماط التفاعلية',
      heading: 'RxJS مقابل Angular Signals: دليل التعايش',
      lead: 'أتقن الطيف التفاعلي في Angular الحديث. افهم متى تستخدم RxJS ومتى تستخدم Signals وكيف يوفر نمط "الأحداث داخلة، الحالة خارجة" معمارية صلبة بدون Zone.js.',
      focusAriaLabel: 'تصفية موضوع المعمارية',
      focusOptions: {
        all: 'جميع المعماريات',
        decisionMatrix: 'مصفوفة القرار',
        searchDebounce: 'البحث والتأخير الزمني',
        derivedState: 'الحسابات المشتقة',
        asyncResource: 'جلب البيانات غير المتزامن',
        linkedState: 'إعادة تعيين الحالة التابعة',
        coexistence: 'فلسفة التعايش',
      },
      coexistence: {
        title: 'الفلسفة المعمارية: "الأحداث داخلة، الحالة خارجة"',
        badge: 'الأساس الجوهري',
        description:
          'ليست Signals وRxJS متنافسين؛ بل يحلان مشكلتين مختلفتين جوهريًا في معمارية التطبيقات.',
        step1Badge: '1. الأحداث داخلة (RxJS)',
        step1Title: 'التنسيق غير المتزامن',
        step1Items: [
          'نقرات المفاتيح والفأرة والتمرير',
          'WebSocket والأحداث المرسلة من الخادم',
          'التأخير والتنظيم الزمني debounceTime',
          'إعادة المحاولة والمهل الزمنية والتراجع الأسي',
          'التزامن: switchMap وexhaustMap وconcatMap',
        ],
        step2Badge: '2. الحالة خارجة (Signals)',
        step2Title: 'حالة واجهة المستخدم المتزامنة',
        step2Items: [
          'حالة المكوّن ونموذج العرض',
          'الاشتقاقات المتزامنة (computed)',
          'ربط القوالب واكتشاف التغيير بدون Zone',
          'تنظيف تلقائي (صفر تسرب للذاكرة)',
          'مدخلات ومخرجات الإشارات (input, output, model)',
        ],
        ruleStrong: 'القاعدة الذهبية الشاملة:',
        ruleQuote:
          '"استخدم RxJS للأحداث عبر الزمن؛ واستخدم Signals للقيم عبر الزمن."',
        ruleText:
          'إذا كنت بحاجة إلى التحكم في الوقت أو الإلغاء أو التزامن، فاستخدم RxJS. وإذا كنت تحتفظ بحالة متزامنة أو تشتقها أو تعرضها في الواجهة، فاستخدم Signals.',
      },
      decisionMatrix: {
        title: 'مصفوفة القرار التفاعلية',
        description:
          'اختر متطلبًا شائعًا في بيئة الإنتاج لمقارنة نهج RxJS وSignals والنهج الهجين.',
        categoryPrefix: 'الفئة:',
        recommendedPrefix: 'الموصى به:',
        rxjsApproachTitle: 'نهج RxJS',
        signalsApproachTitle: 'نهج Signals',
        hybridApproachTitle: 'أفضل ممارسة / الهجين',
        takeawayStrong: 'الخلاصة المعمارية:',
      },
      scenarios: [
        {
          id: 'search',
          title: 'الإكمال التلقائي للبحث (Typeahead)',
          category: 'Hybrid',
          winner: 'Hybrid (Both)',
          summary:
            'التعامل مع أحداث الكتابة غير المتزامنة مع التأخير والإلغاء، ثم عرض النتيجة في حالة واجهة متزامنة.',
          rxjsApproach:
            'searchInput$.pipe(debounceTime(300), distinctUntilChanged(), switchMap(q => api.search(q)))',
          signalsApproach:
            'لا تدعم الإشارات أصليًا التأخير الزمني (debouncing) بدون مؤقتات خارجية.',
          hybridApproach:
            'query = signal(""); query$ = toObservable(this.query); results = toSignal(this.query$.pipe(debounceTime(300), switchMap(q => api.search(q))), { initialValue: [] })',
          ruleOfThumb:
            'استخدم RxJS لتنسيق تدفق الأحداث غير المتزامنة عبر الزمن، ثم أنهِ بـ toSignal() لعرض سلس في القالب.',
        },
        {
          id: 'derived',
          title: 'إجمالي السلة وحسابات الأسعار',
          category: 'State',
          winner: 'Signals',
          summary:
            'اشتقاق حساب متزامن من عدة مصادر حالة (العناصر، الكمية، الخصم، الضريبة).',
          rxjsApproach:
            'combineLatest([items$, discount$, tax$]).pipe(map(...)) — يتطلب اشتراكًا وإدارة يدوية.',
          signalsApproach:
            'total = computed(() => calculate(this.items(), this.discount(), this.tax())) — تتبع ديناميكي تلقائي للتبعيات وبدون اشتراكات.',
          hybridApproach:
            'الإشارات النقية تفوز هنا بجدارة؛ لا حاجة لـ RxJS لاشتقاق الحالة المتزامنة في الذاكرة.',
          ruleOfThumb:
            'إذا كانت الحالة متزامنة في الذاكرة، ففضّل دائمًا signal() وcomputed().',
        },
        {
          id: 'websockets',
          title: 'اتصالات WebSockets والتدفقات الفورية',
          category: 'Events',
          winner: 'RxJS',
          summary:
            'تدفق مستمر من حزم الشبكة المدفوعة، وإعادة الاتصال التلقائي، وتصفية الرسائل.',
          rxjsApproach:
            'webSocket$.pipe(retry({ delay: 2000 }), filter(isRelevant), scan(accumulateFeed, [])) — صُمم RxJS خصيصًا للتدفقات المدفوعة عبر الزمن.',
          signalsApproach:
            'تمثل الإشارات أحدث قيمة منفصلة فقط ولا تنمذج طوابير الحزم المتعددة.',
          hybridApproach:
            'أدر دورة حياة الاتصال في RxJS، ثم اعرض النتيجة عبر feed = toSignal(feed$).',
          ruleOfThumb:
            'كلما تم دفع الأحداث عبر الزمن (مقابس الشبكة، ناقلات الرسائل)، فإن RxJS هو المعيار الذهبي.',
        },
        {
          id: 'spam-prevention',
          title: 'إرسال النماذج ومنع النقر المزدوج',
          category: 'Events',
          winner: 'RxJS',
          summary:
            'ضمان تجاهل النقرات المتكررة السريعة أثناء وجود طلب إرسال قيد التنفيذ.',
          rxjsApproach:
            'submitClick$.pipe(exhaustMap(() => authService.login(credentials))) — يتجاهل exhaustMap النقرات تلقائيًا أثناء نشاط الطلب الداخلي.',
          signalsApproach:
            'يتطلب إدارة يدوية لمتغير حالة isSubmitting مع كتل try/finally.',
          hybridApproach: 'استخدم exhaustMap أو موردًا مع تعطيل زر الإرسال.',
          ruleOfThumb:
            'استخدم exhaustMap عندما يتطلب التزامن تجاهل المشغّلات الواردة أثناء عملية غير متزامنة نشطة.',
        },
        {
          id: 'dependent-reset',
          title: 'إعادة تعيين الحالة التابعة (Master-Detail)',
          category: 'State',
          winner: 'Signals',
          summary:
            'تغيير الفئة الأب يعيد تعيين العنصر المحدد إلى الافتراضي، مع السماح للمستخدم بالاختيار.',
          rxjsApproach: 'كان يتطلب سابقًا Subjects متداخلة أو switchMap معقدة.',
          signalsApproach:
            'selectedItem = linkedSignal({ source: () => this.category(), computation: (cat) => cat.defaultItem }) — يعيد التعيين تلقائيًا مع بقائه قابلاً للكتابة!',
          hybridApproach:
            'دالة linkedSignal() في Angular 22 هي أنظف نمط لهذا السيناريو.',
          ruleOfThumb:
            'استخدم linkedSignal() للحالة المحلية القابلة للكتابة التي يجب أن تظل متزامنة مع تبعية مصدر.',
        },
      ],
      derivedState: {
        title: 'بيئة تفاعلية: الحالة المشتقة (combineLatest مقابل computed)',
        description:
          'اشتقاق إجمالي متزامن من السعر الأساسي والخصم ونسبة الضريبة. قارن بساطة Signals مقابل أنابيب التدفقات.',
        basePriceLabel: 'السعر الأساسي ($):',
        discountLabel: 'الخصم ($):',
        taxRateLabel: 'نسبة الضريبة (20%):',
        fixed20Badge: '20% ثابتة',
        signalsComputedLabel: 'الإشارات (computed)',
        syncPullBadge: 'سحب متزامن',
        signalsNote:
          'تقييم كسول، خالٍ من الاختلالات، مخزن مؤقتًا، ولا يتطلب إلغاء اشتراك.',
        rxjsCombineLabel: 'RxJS (combineLatest)',
        pushStreamBadge: 'تدفق دفع',
        rxjsNote:
          'يتطلب 3 BehaviorSubjects وcombineLatest وmap وtoSignal أو أنبوب async.',
      },
      searchDebounce: {
        title: 'بيئة تفاعلية: البحث المؤجل زمنيًا (تكامل هجين)',
        description:
          'ليس لدى الإشارات مفهوم أصلي للتأخير الزمني. نستخدم toObservable() للاستفادة من معاملات الوقت في RxJS ثم نخزن النتيجة في إشارة عبر toSignal().',
        inputLabel: 'اكتب بسرعة لملاحظة التأخير الزمني (400 مللي ثانية):',
        inputPlaceholder: 'اكتب استعلام البحث...',
        rawSignalLabel: 'إشارة الكتابة الخام (فورية):',
        debouncedSignalLabel: 'الإشارة المؤجلة والمطبّعة (toSignal):',
      },
      asyncResource: {
        title: 'بيئة تفاعلية: البيانات غير المتزامنة باستخدام rxResource()',
        description:
          'يقدم Angular 22 دالتي resource() وrxResource() لتوحيد جلب البيانات غير المتزامنة مع الإشارات وإدارة التحميل والإلغاء تلقائيًا.',
        selectLocationLabel: 'اختر الموقع:',
        parisBtn: 'باريس',
        tokyoBtn: 'طوكيو',
        nycBtn: 'نيويورك',
        reloadStreamBtn: 'إعادة تحميل التدفق',
        fetchingWeatherText: 'جارٍ جلب حالة الطقس عبر rxResource...',
        statusPrefix: 'الحالة:',
      },
      linkedState: {
        title: 'بيئة تفاعلية: الحالة التابعة باستخدام linkedSignal()',
        description:
          'في تطبيقات Angular، يُعد إعادة تعيين حالة الابن عند تغير حالة الأب تحديًا كلاسيكيًا. توفر linkedSignal() إشارة قابلة للكتابة تعيد تعيين نفسها تلقائيًا.',
        selectPlanLabel: 'اختر فئة الخطة (حالة الأب):',
        basicBtn: 'Basic (20GB)',
        proBtn: 'Pro (100GB)',
        enterpriseBtn: 'Enterprise (500GB)',
        adjustQuotaLabel: 'تعديل حصة التخزين (تعديل مباشر للإشارة):',
        customOverrideBadge: 'تخصيص يدوي',
        resetPlanDefaultBtn: 'إعادة إلى افتراضي الخطة',
        planDefaultBadge: 'افتراضي الخطة',
      },
    },
    quiz: {
      eyebrow: 'تقييم المعرفة',
      heading: 'تحدي RxJS والتفاعلية في Angular',
      lead: 'اختبر إتقانك لتحويل التدفقات، والبث المتعدد، واستعادة الأخطاء، والتخزين المؤقت، وإشارات Angular 22 الحديثة.',
      tracks: {
        beginnerTitle: 'مبتدئ',
        beginnerBadge: 'الأساسيات',
        beginnerDesc:
          'الـ Observables والمعاملات الأساسية ومشاركة البيانات الأولية.',
        beginnerBtn: 'بدء مسار المبتدئين',
        midTitle: 'متوسط',
        midBadge: 'المعاملات والـ Subjects',
        midDesc:
          'التحويل عالي الرتبة، والبث المتعدد، والتخزين المؤقت، والدفعات.',
        midBtn: 'بدء المسار المتوسط',
        seniorTitle: 'متقدم (Senior)',
        seniorBadge: 'المعمارية والتكامل',
        seniorDesc:
          'التنفيذ بدون Zone، وlinkedSignal، وrxResource، والحالات الدقيقة.',
        seniorBtn: 'بدء المسار المتقدم',
      },
      questionProgress: (current, total) => `السؤال ${current} من ${total}`,
      answerPlaceholder: 'اكتب إجابتك واضغط Enter...',
      correctAnswerLabel: 'الإجابة الصحيحة:',
      submitAnswerBtn: 'إرسال الإجابة',
      correctToast: 'إجابة صحيحة!',
      incorrectToast: 'ليست دقيقة! راجع المفهوم للمساعدة.',
      correctFeedback: 'صحيح! أحسنت.',
      incorrectFeedback: 'ليست دقيقة. هذا المفهوم مشروح في:',
      reviewConceptBtn: 'مراجعة المفهوم',
      nextQuestionBtn: 'السؤال التالي',
      finishQuizBtn: 'إنهاء الاختبار',
      quizCompleteTitle: 'اكتمل الاختبار!',
      scoreText: (score, total) => `لقد أحرزت ${score} من أصل ${total}`,
      tryAnotherBtn: 'تجربة مستوى آخر',
      questions: [
        {
          id: 1,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'أي معامل يُستخدم لمعالجة الأخطاء في التدفق وتوفير قيمة احتياطية؟',
          options: ['retry', 'throwError', 'catchError', 'finalize'],
          answer: 'catchError',
          relatedRoute: '/error-handling',
        },
        {
          id: 2,
          type: 'fill-in-the-blank',
          difficulty: 'Beginner',
          text: 'يبدأ الـ Observable "البارد" (cold) في إنتاج القيم فقط عندما يشترك فيه ____.',
          answer: 'subscriber',
          relatedRoute: '/multicasting',
        },
        {
          id: 7,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'أي دالة تُستخدم لتمرير البيانات من المكوّن الأب إلى المكوّن الابن؟',
          options: ['output()', 'input()', 'signal()', 'effect()'],
          answer: 'input()',
          relatedRoute: '/sharing-data',
        },
        {
          id: 10,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'إلى ماذا يرمز اللاحق `$` تقليديًا في نهاية اسم المتغير في RxJS؟',
          options: ['Subject', 'قيمة نهائية', 'Observable', 'خاصية خاصة'],
          answer: 'Observable',
          relatedRoute: '/multicasting',
        },
        {
          id: 11,
          type: 'fill-in-the-blank',
          difficulty: 'Beginner',
          text: 'في Angular، تُستخدم الدالة ____ لإنشاء قيمة مشتقة من إشارة واحدة أو أكثر.',
          answer: 'computed',
          relatedRoute: '/signals',
        },
        {
          id: 3,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'بالنسبة لحقل البحث الفوري، أي معامل تحويل عالي الرتبة هو الأفضل لمنع طلبات الشبكة غير الضرورية؟',
          options: ['concatMap', 'mergeMap', 'exhaustMap', 'switchMap'],
          answer: 'switchMap',
          relatedRoute: '/transforming-streams',
        },
        {
          id: 4,
          type: 'code-completion',
          difficulty: 'Mid-level',
          text: 'أكمل الكود لتشغيل طلبي الواجهة البرمجية بالتوازي والحصول على النتائج فقط عند اكتمال كليهما.',
          codeSnippet: `\nconst user$ = this.http.get('/api/user');\nconst permissions$ = this.http.get('/api/permissions');\n\n____([user$, permissions$]).subscribe(([user, permissions]) => {\n  // ...\n});`,
          answer: 'forkJoin',
          relatedRoute: '/bulk-operations',
        },
        {
          id: 8,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'أي معامل مثالي لتخزين ومشاركة نتيجة طلب HTTP مؤقتًا؟',
          options: ['share', 'cache', 'shareReplay', 'multicast'],
          answer: 'shareReplay',
          relatedRoute: '/reactive-caching',
        },
        {
          id: 12,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'أي Subject هو الأفضل لتخزين حالة مصادقة المستخدم بحيث تتمكن المكوّنات الجديدة من قراءتها فور إنشائها؟',
          options: [
            'Subject',
            'AsyncSubject',
            'BehaviorSubject',
            'ReplaySubject',
          ],
          answer: 'BehaviorSubject',
          relatedRoute: '/multicasting',
        },
        {
          id: 13,
          type: 'code-completion',
          difficulty: 'Mid-level',
          text: 'املأ الفراغ لتجميع البيانات الواردة في مصفوفات من 4 عناصر.',
          codeSnippet: `\nsource$.pipe(\n  ____(4)\n).subscribe(batch => console.log(batch));`,
          answer: 'bufferCount',
          relatedRoute: '/bulk-operations',
        },
        {
          id: 16,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'في Angular 22، أي أداة إشارات تنشئ إشارة قابلة للكتابة تعيد تعيين نفسها إلى قيمة افتراضية محسوبة عند تغير مصدرها؟',
          options: ['computed()', 'linkedSignal()', 'toSignal()', 'effect()'],
          answer: 'linkedSignal()',
          relatedRoute: '/signals',
        },
        {
          id: 5,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'أي نوع Subject يمنح المشترك الجديد آخر 3 قيم تم إصدارها؟',
          options: [
            'Subject',
            'AsyncSubject',
            'BehaviorSubject(3)',
            'ReplaySubject(3)',
          ],
          answer: 'ReplaySubject(3)',
          relatedRoute: '/multicasting',
        },
        {
          id: 6,
          type: 'fill-in-the-blank',
          difficulty: 'Senior',
          text: 'لتحويل Observable بارد إلى ساخن يبدأ في الإصدار عند أول اشتراك ويشارك قيمه، يمكنك استخدام المعامل ____.',
          answer: 'share()',
          relatedRoute: '/multicasting',
        },
        {
          id: 9,
          type: 'code-completion',
          difficulty: 'Senior',
          text: 'املأ الفراغ لضمان تجاهل طلب تسجيل الدخول إذا كان هناك طلب قيد التنفيذ بالفعل.',
          codeSnippet: `\nloginClick$.pipe(\n  ____(() => this.authService.login(credentials))\n).subscribe();`,
          answer: 'exhaustMap',
          relatedRoute: '/transforming-streams',
        },
        {
          id: 14,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'في اختبارات الكرات (marble testing) في RxJS، إلى ماذا يرمز الرمز `|`؟',
          options: ['خطأ', 'إصدار قيمة', 'اكتمال التدفق', 'نقطة اشتراك'],
          answer: 'اكتمال التدفق',
          relatedRoute: '/multicasting',
        },
        {
          id: 15,
          type: 'code-completion',
          difficulty: 'Senior',
          text: 'أكمل الكود لتحويل Observable إلى إشارة مع توفير قيمة افتراضية حتى يُصدر التدفق أول قيمة.',
          codeSnippet: `\nconst data$ = this.dataService.getData();\nconst data = toSignal(data$, { ____: 'Loading...' });`,
          answer: 'initialValue',
          relatedRoute: '/signals',
        },
        {
          id: 17,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'في Angular 22، أي دالة من @angular/core/rxjs-interop تحمّل البيانات غير المتزامنة من تدفق RxJS إلى إشارات تصريحية؟',
          options: [
            'toSignal()',
            'rxResource()',
            'toObservable()',
            'outputFromObservable()',
          ],
          answer: 'rxResource()',
          relatedRoute: '/signals',
        },
      ],
    },
  },
  it: {
    signals: {
      eyebrow: 'Angular 22 · Primitive reattive',
      heading: 'Esercizio: Signals e interoperabilità reattiva',
      lead: 'Esplora signal a grana fine, computed derivati, effetti collaterali, reset con linkedSignal e interoperabilità bidirezionale RxJS con toSignal, toObservable e rxResource.',
      focusAriaLabel: 'Filtra argomento Signal',
      focusOptions: {
        all: 'Tutti gli argomenti',
        basics: 'Basi dei Signal',
        toSignal: 'toSignal()',
        linkedSignal: 'linkedSignal()',
        rxResource: 'rxResource()',
        resource: 'resource() [Promise]',
        toObservable: 'toObservable()',
      },
      analogyStrong: 'Analogia:',
      statusPrefix: 'Stato:',
      writable: {
        title: '1. Signal scrivibili: signal()',
        description:
          'Le fonti di verità fondamentali in Angular moderno. Mutano direttamente lo stato e notificano le dipendenze a grana fine.',
        firstNameLabel: 'Nome:',
        lastNameLabel: 'Cognome:',
        quantityLabel: 'Quantità:',
      },
      computed: {
        title: '2. Signal calcolati: computed()',
        description:
          'Derivano valori in sola lettura memoizzati al cambiamento. Valutati in modo pigro e ricalcolati solo quando cambiano le dipendenze.',
        fullNameLabel: 'Nome completo:',
        isStockLowLabel: 'Scorte in esaurimento?',
        stockMessageLabel: 'Messaggio scorte:',
        lowStockMsg: (qty) =>
          `Solo ${qty} rimasti in magazzino - ordina presto!`,
        inStockMsg: (qty) => `${qty} disponibili.`,
      },
      effect: {
        title: '3. Effetti: effect()',
        description:
          'Effetti collaterali pianificati ogni volta che i signal tracciati cambiano.',
        auditTrailTitle: 'Registro di audit degli effetti',
      },
      toSignal: {
        title: '4. Interoperabilità RxJS: toSignal()',
        description:
          'Converte un Observable RxJS in un Signal reattivo in sola lettura con pulizia automatica della sottoscrizione.',
        analogyText:
          'Abbonarsi a una rivista (Observable): ogni nuova uscita viene depositata nella cassetta della posta (Signal), pronta per essere letta in modo sincrono.',
        streamLabel: 'Flusso Observable RxJS interval(1000)',
        resultingSignalLabel: 'Signal risultante (counterSignal):',
        computedEvenLabel: 'Calcolato dal Signal (isEven):',
        startStreamBtn: 'Avvia flusso',
        stopStreamBtn: 'Ferma flusso',
      },
      linkedSignal: {
        title: '5. Angular 22: linkedSignal()',
        description:
          'Un signal scrivibile che si ripristina a un valore predefinito calcolato quando cambia la sua dipendenza sorgente, pur supportando modifiche dirette.',
        whyStrong: 'Perché linkedSignal?',
        whyText:
          'Con computed() lo stato è di sola lettura. Con signal separati ed effect la sincronizzazione è soggetta a glitch. linkedSignal() risolve il problema in modo pulito.',
        choosePlanLabel: 'Scegli il piano:',
        starterBtn: 'Starter (5)',
        proBtn: 'Pro (25)',
        enterpriseBtn: 'Enterprise (100)',
        adjustCreditsLabel: 'Regola crediti di calcolo (Mutazione diretta):',
        overriddenBadge: 'Personalizzato',
        resetDefaultBtn: 'Ripristina predefinito',
        planDefaultBadge: 'Predefinito del piano',
      },
      rxResource: {
        title: '6. Angular 22: Loader asincrono rxResource()',
        description:
          'Collega flussi RxJS asincroni direttamente in Signal dichiarativi con stati di caricamento, cancellazione e gestione errori.',
        zonelessStrong: 'Dati asincroni in Angular Zoneless:',
        zonelessText:
          'rxResource() esegue un flusso loader RxJS esponendo signal sincroni per value(), isLoading() e status() senza zone.js.',
        selectUserIdLabel: 'Seleziona ID Utente:',
        userBtn: (id) => `Utente ${id}`,
        reloadStreamBtn: 'Ricarica flusso',
        streamingDataText: 'Streaming dati tramite RxJS...',
      },
      resource: {
        title: '7. Angular 22: Loader Promise resource()',
        description:
          'Loader asincrono basato su Promise async/await native con supporto automatico di cancellazione tramite AbortSignal.',
        promisesStrong: 'Promise native in modalità Zoneless:',
        promisesText:
          'Mentre rxResource() incapsula Observable RxJS, resource() si collega direttamente a fetch() o funzioni async/await passando un AbortSignal.',
        selectTopicLabel: 'Seleziona argomento:',
        reloadBtn: 'Ricarica',
        executingLoaderText: 'Esecuzione loader asincrono...',
      },
      toObservable: {
        title: '7. Interoperabilità bidirezionale: toObservable() + toSignal()',
        description:
          'Un Signal di input passato attraverso operatori RxJS (come debounceTime) e poi riconvertito in Signal.',
        typeToSearchLabel: 'Digita per cercare (debounce 350ms):',
        searchPlaceholder: 'Digita termini di ricerca...',
        rawInputLabel: 'Signal di input grezzo:',
        debouncedSignalLabel: 'Signal con debounce + Maiuscole:',
      },
    },
    rxjsVsSignals: {
      eyebrow: 'Architettura Angular 22 · Paradigmi reattivi',
      heading: 'RxJS vs Angular Signals: Guida alla coesistenza',
      lead: 'Padroneggia lo spettro reattivo in Angular moderno. Comprendi quando usare RxJS, quando usare i Signals e come il pattern "Eventi in ingresso, Stato in uscita" offra un’architettura zoneless solida.',
      focusAriaLabel: 'Filtra argomento architetturale',
      focusOptions: {
        all: 'Tutte le architetture',
        decisionMatrix: 'Matrice decisionale',
        searchDebounce: 'Ricerca & Debounce',
        derivedState: 'Calcoli derivati',
        asyncResource: 'Caricamento dati asincrono',
        linkedState: 'Reset stato dipendente',
        coexistence: 'Filosofia di coesistenza',
      },
      coexistence: {
        title:
          'Filosofia architetturale: "Eventi in ingresso, Stato in uscita"',
        badge: 'Fondamento chiave',
        description:
          'Signals e RxJS non sono rivali: risolvono problemi fondamentalmente diversi nell’architettura delle applicazioni.',
        step1Badge: '1. Eventi in ingresso (RxJS)',
        step1Title: 'Coordinamento asincrono',
        step1Items: [
          'Digitazioni utente, clic, scroll',
          'WebSocket & Server-Sent Events',
          'Debounce, throttle, debounceTime',
          'Retry, timeout e backoff esponenziale',
          'Concorrenza: switchMap, exhaustMap, concatMap',
        ],
        step2Badge: '2. Stato in uscita (Signals)',
        step2Title: 'Stato UI sincrono',
        step2Items: [
          'Stato del componente e del view model',
          'Derivazioni sincrone (computed)',
          'Binding nei template e change detection zoneless',
          'Pulizia automatica (zero memory leak)',
          'I/O reattivo (input, output, model)',
        ],
        ruleStrong: 'La regola d’oro universale:',
        ruleQuote:
          '"Usa RxJS per gli eventi nel tempo; usa i Signals per i valori nel tempo."',
        ruleText:
          'Se hai bisogno di tempo, cancellazione o controllo della concorrenza, scegli RxJS. Se stai mantenendo, derivando o mostrando stato UI sincrono, scegli i Signals.',
      },
      decisionMatrix: {
        title: 'Matrice decisionale interattiva',
        description:
          'Seleziona un requisito comune in produzione per confrontare gli approcci RxJS, Signals e Ibrido.',
        categoryPrefix: 'Categoria:',
        recommendedPrefix: 'Consigliato:',
        rxjsApproachTitle: 'Approccio RxJS',
        signalsApproachTitle: 'Approccio Signals',
        hybridApproachTitle: 'Best Practice / Ibrido',
        takeawayStrong: 'Punto chiave:',
      },
      scenarios: [
        {
          id: 'search',
          title: 'Typeahead / Autocompletamento ricerca',
          category: 'Hybrid',
          winner: 'Hybrid (Both)',
          summary:
            'Gestire eventi di digitazione asincroni con debounce e cancellazione, proiettando il risultato nello stato UI sincrono.',
          rxjsApproach:
            'searchInput$.pipe(debounceTime(300), distinctUntilChanged(), switchMap(q => api.search(q)))',
          signalsApproach:
            'I Signals non supportano nativamente throttling o debouncing temporale senza timer esterni.',
          hybridApproach:
            'query = signal(""); query$ = toObservable(this.query); results = toSignal(this.query$.pipe(debounceTime(300), switchMap(q => api.search(q))), { initialValue: [] })',
          ruleOfThumb:
            'Usa RxJS per coordinare il flusso di eventi asincroni nel tempo, poi termina con toSignal() per il template.',
        },
        {
          id: 'derived',
          title: 'Totale carrello e calcoli di prezzo',
          category: 'State',
          winner: 'Signals',
          summary:
            'Derivare calcoli sincroni da più sorgenti di stato (articoli, quantità, sconto, tasse).',
          rxjsApproach:
            'combineLatest([items$, discount$, tax$]).pipe(map(...)) — richiede sottoscrizione e gestione manuale.',
          signalsApproach:
            'total = computed(() => calculate(this.items(), this.discount(), this.tax())) — tracciamento automatico delle dipendenze, pull sincrono, zero leak.',
          hybridApproach:
            'I puri Signals vincono nettamente qui. Nessun bisogno di RxJS per derivazioni sincrone in memoria.',
          ruleOfThumb:
            'Se lo stato è sincrono in memoria, preferisci sempre signal() e computed().',
        },
        {
          id: 'websockets',
          title: 'WebSocket in tempo reale e feed di eventi',
          category: 'Events',
          winner: 'RxJS',
          summary:
            'Flusso continuo di pacchetti di rete push, backoff di riconnessione, heartbeat e filtraggio messaggi.',
          rxjsApproach:
            'webSocket$.pipe(retry({ delay: 2000 }), filter(isRelevant), scan(accumulateFeed, [])) — RxJS è progettato per flussi push nel tempo.',
          signalsApproach:
            'I Signals rappresentano solo l’ultimo valore discreto e non modellano code di pacchetti multi-emissione.',
          hybridApproach:
            'Gestisci il ciclo di vita del socket in RxJS, poi esponi feed = toSignal(feed$) per il template.',
          ruleOfThumb:
            'Ogni volta che gli eventi vengono inviati nel tempo (socket, message bus), RxJS è lo standard di riferimento.',
        },
        {
          id: 'spam-prevention',
          title: 'Invio form e prevenzione doppio clic',
          category: 'Events',
          winner: 'RxJS',
          summary:
            'Garantire che un invio in corso blocchi i clic duplicati rapidi finché il backend non risponde.',
          rxjsApproach:
            'submitClick$.pipe(exhaustMap(() => authService.login(credentials))) — exhaustMap scarta automaticamente i clic mentre la richiesta è attiva.',
          signalsApproach:
            'Richiede gestione manuale di flag booleani isSubmitting con blocchi try/finally.',
          hybridApproach:
            'Usa exhaustMap oppure una resource con pulsante disabilitato.',
          ruleOfThumb:
            'Usa exhaustMap quando la concorrenza richiede di ignorare nuovi trigger durante un’operazione asincrona attiva.',
        },
        {
          id: 'dependent-reset',
          title: 'Reset dello stato dipendente (Master-Detail)',
          category: 'State',
          winner: 'Signals',
          summary:
            'Cambiare una categoria padre ripristina l’elemento selezionato al valore predefinito, consentendo comunque la selezione manuale.',
          rxjsApproach:
            'Storicamente richiedeva Subject annidati o complessi reset con switchMap.',
          signalsApproach:
            'selectedItem = linkedSignal({ source: () => this.category(), computation: (cat) => cat.defaultItem }) — si ripristina automaticamente restando scrivibile!',
          hybridApproach:
            'linkedSignal() di Angular 22 è il pattern più pulito dell’intero ecosistema frontend.',
          ruleOfThumb:
            'Usa linkedSignal() per uno stato locale scrivibile che deve restare sincronizzato con una dipendenza sorgente.',
        },
      ],
      derivedState: {
        title: 'Sandbox live: Stato derivato (combineLatest vs computed)',
        description:
          'Derivare un totale sincrono da prezzo base, sconto e aliquota fiscale. Confronta l’ergonomia dei Signals rispetto alle pipe RxJS.',
        basePriceLabel: 'Prezzo base ($):',
        discountLabel: 'Sconto ($):',
        taxRateLabel: 'Aliquota IVA (20%):',
        fixed20Badge: '20% Fisso',
        signalsComputedLabel: 'Signals (computed)',
        syncPullBadge: 'Pull sincrono',
        signalsNote:
          'Valutato pigramente, glitch-free, memoizzato, nessuna pulizia di sottoscrizione richiesta.',
        rxjsCombineLabel: 'RxJS (combineLatest)',
        pushStreamBadge: 'Flusso Push',
        rxjsNote:
          'Richiede 3 BehaviorSubject, combineLatest, map pipe e toSignal o async pipe.',
      },
      searchDebounce: {
        title: 'Sandbox live: Ricerca temporizzata (Interop ibrida)',
        description:
          'I Signals non hanno un concetto nativo di ritardo temporale. Usiamo toObservable() per gli operatori temporali RxJS e poi toSignal().',
        inputLabel: 'Digita rapidamente per osservare il debounce (400ms):',
        inputPlaceholder: 'Digita query...',
        rawSignalLabel: 'Signal digitazione grezzo (Immediato):',
        debouncedSignalLabel: 'Signal con debounce e normalizzato (toSignal):',
      },
      asyncResource: {
        title: 'Sandbox live: Dati asincroni con rxResource()',
        description:
          'Angular 22 introduce resource() e rxResource() per unificare il caricamento dati asincrono con i signal, gestendo loading e cancellazione.',
        selectLocationLabel: 'Seleziona località:',
        parisBtn: 'Parigi',
        tokyoBtn: 'Tokyo',
        nycBtn: 'New York',
        reloadStreamBtn: 'Ricarica flusso',
        fetchingWeatherText: 'Caricamento meteo tramite rxResource...',
        statusPrefix: 'Stato:',
      },
      linkedState: {
        title: 'Sandbox live: Stato dipendente con linkedSignal()',
        description:
          'Un bug classico è reimpostare lo stato figlio quando cambia lo stato padre. linkedSignal() di Angular 22 fornisce un signal scrivibile auto-ripristinante.',
        selectPlanLabel: 'Seleziona piano (Stato padre):',
        basicBtn: 'Basic (20GB)',
        proBtn: 'Pro (100GB)',
        enterpriseBtn: 'Enterprise (500GB)',
        adjustQuotaLabel: 'Regola quota di archiviazione (Mutazione diretta):',
        customOverrideBadge: 'Override personalizzato',
        resetPlanDefaultBtn: 'Ripristina predefinito del piano',
        planDefaultBadge: 'Predefinito del piano',
      },
    },
    quiz: {
      eyebrow: 'Valutazione delle competenze',
      heading: 'Sfida RxJS & Reattività Angular',
      lead: 'Metti alla prova la tua padronanza di trasformazione dei flussi, multicasting, recupero errori, caching e Signals di Angular 22.',
      tracks: {
        beginnerTitle: 'Principiante',
        beginnerBadge: 'Fondamentali',
        beginnerDesc:
          'Observable, operatori di base e condivisione dati primaria.',
        beginnerBtn: 'Avvia percorso Principiante',
        midTitle: 'Intermedio',
        midBadge: 'Operatori & Subject',
        midDesc:
          'Mappatura di ordine superiore, multicasting, caching e batching.',
        midBtn: 'Avvia percorso Intermedio',
        seniorTitle: 'Senior',
        seniorBadge: 'Architettura & Interop',
        seniorDesc:
          'Esecuzione zoneless, linkedSignal, rxResource e casi limite.',
        seniorBtn: 'Avvia percorso Senior',
      },
      questionProgress: (current, total) => `Domanda ${current} di ${total}`,
      answerPlaceholder: 'Digita la risposta e premi Invio...',
      correctAnswerLabel: 'Risposta corretta:',
      submitAnswerBtn: 'Invia risposta',
      correctToast: 'Corretto!',
      incorrectToast: 'Non proprio! Ripassa il concetto per ricevere aiuto.',
      correctFeedback: 'Corretto! Ottimo lavoro.',
      incorrectFeedback: 'Non proprio. Questo concetto è trattato in:',
      reviewConceptBtn: 'Ripassa il concetto',
      nextQuestionBtn: 'Prossima domanda',
      finishQuizBtn: 'Termina Quiz',
      quizCompleteTitle: 'Quiz completato!',
      scoreText: (score, total) => `Hai totalizzato ${score} su ${total}`,
      tryAnotherBtn: 'Prova un altro livello',
      questions: [
        {
          id: 1,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'Quale operatore viene usato per gestire gli errori in un flusso e fornire un valore di fallback?',
          options: ['retry', 'throwError', 'catchError', 'finalize'],
          answer: 'catchError',
          relatedRoute: '/error-handling',
        },
        {
          id: 2,
          type: 'fill-in-the-blank',
          difficulty: 'Beginner',
          text: 'Un observable "cold" inizia a produrre valori solo quando un ____ si sottoscrive ad esso.',
          answer: 'subscriber',
          relatedRoute: '/multicasting',
        },
        {
          id: 7,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'Quale funzione viene usata per passare dati da un componente padre a un componente figlio?',
          options: ['output()', 'input()', 'signal()', 'effect()'],
          answer: 'input()',
          relatedRoute: '/sharing-data',
        },
        {
          id: 10,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'Cosa indica tradizionalmente il suffisso `$` nel nome di una variabile in RxJS?',
          options: [
            'Un Subject',
            'Un valore finale',
            'Un Observable',
            'Una proprietà privata',
          ],
          answer: 'Un Observable',
          relatedRoute: '/multicasting',
        },
        {
          id: 11,
          type: 'fill-in-the-blank',
          difficulty: 'Beginner',
          text: 'In Angular, la funzione ____ viene usata per creare un valore derivato da uno o più signal.',
          answer: 'computed',
          relatedRoute: '/signals',
        },
        {
          id: 3,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'Per un campo di ricerca live, quale operatore di mappatura di ordine superiore è migliore per evitare richieste di rete inutili?',
          options: ['concatMap', 'mergeMap', 'exhaustMap', 'switchMap'],
          answer: 'switchMap',
          relatedRoute: '/transforming-streams',
        },
        {
          id: 4,
          type: 'code-completion',
          difficulty: 'Mid-level',
          text: 'Completa il codice per eseguire entrambe le chiamate API in parallelo e ottenere i risultati solo quando entrambe sono completate.',
          codeSnippet: `\nconst user$ = this.http.get('/api/user');\nconst permissions$ = this.http.get('/api/permissions');\n\n____([user$, permissions$]).subscribe(([user, permissions]) => {\n  // ...\n});`,
          answer: 'forkJoin',
          relatedRoute: '/bulk-operations',
        },
        {
          id: 8,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'Quale operatore è ideale per memorizzare nella cache e condividere il risultato di una richiesta HTTP?',
          options: ['share', 'cache', 'shareReplay', 'multicast'],
          answer: 'shareReplay',
          relatedRoute: '/reactive-caching',
        },
        {
          id: 12,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'Quale Subject è più adatto per memorizzare lo stato di autenticazione di un utente che i nuovi componenti devono leggere alla creazione?',
          options: [
            'Subject',
            'AsyncSubject',
            'BehaviorSubject',
            'ReplaySubject',
          ],
          answer: 'BehaviorSubject',
          relatedRoute: '/multicasting',
        },
        {
          id: 13,
          type: 'code-completion',
          difficulty: 'Mid-level',
          text: 'Completa il codice per raggruppare i dati in arrivo in array di 4 elementi.',
          codeSnippet: `\nsource$.pipe(\n  ____(4)\n).subscribe(batch => console.log(batch));`,
          answer: 'bufferCount',
          relatedRoute: '/bulk-operations',
        },
        {
          id: 16,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'In Angular 22, quale primitiva crea un signal scrivibile che si reimposta a un valore predefinito calcolato quando cambia la sua sorgente?',
          options: ['computed()', 'linkedSignal()', 'toSignal()', 'effect()'],
          answer: 'linkedSignal()',
          relatedRoute: '/signals',
        },
        {
          id: 5,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'Quale tipo di Subject fornirà a un nuovo sottoscrittore gli ultimi 3 valori emessi?',
          options: [
            'Subject',
            'AsyncSubject',
            'BehaviorSubject(3)',
            'ReplaySubject(3)',
          ],
          answer: 'ReplaySubject(3)',
          relatedRoute: '/multicasting',
        },
        {
          id: 6,
          type: 'fill-in-the-blank',
          difficulty: 'Senior',
          text: 'Per convertire un observable "cold" in uno "hot" che inizia a emettere alla prima sottoscrizione e condivide i valori, puoi usare l’operatore ____.',
          answer: 'share()',
          relatedRoute: '/multicasting',
        },
        {
          id: 9,
          type: 'code-completion',
          difficulty: 'Senior',
          text: 'Completa il codice per assicurarti che la richiesta di login venga ignorata se una è già in corso.',
          codeSnippet: `\nloginClick$.pipe(\n  ____(() => this.authService.login(credentials))\n).subscribe();`,
          answer: 'exhaustMap',
          relatedRoute: '/transforming-streams',
        },
        {
          id: 14,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'Nel marble testing di RxJS, cosa indica il carattere `|`?',
          options: [
            'Un errore',
            'Un’emissione di valore',
            'Il completamento del flusso',
            'Un punto di sottoscrizione',
          ],
          answer: 'Il completamento del flusso',
          relatedRoute: '/multicasting',
        },
        {
          id: 15,
          type: 'code-completion',
          difficulty: 'Senior',
          text: 'Completa il codice per convertire un observable in un signal, fornendo un valore predefinito finché l’observable non emette.',
          codeSnippet: `\nconst data$ = this.dataService.getData();\nconst data = toSignal(data$, { ____: 'Loading...' });`,
          answer: 'initialValue',
          relatedRoute: '/signals',
        },
        {
          id: 17,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'In Angular 22, quale funzione di @angular/core/rxjs-interop carica dati asincroni da un flusso RxJS in signal dichiarativi?',
          options: [
            'toSignal()',
            'rxResource()',
            'toObservable()',
            'outputFromObservable()',
          ],
          answer: 'rxResource()',
          relatedRoute: '/signals',
        },
      ],
    },
  },
  de: {
    signals: {
      eyebrow: 'Angular 22 · Reaktive Primitive',
      heading: 'Übung: Signals & Reaktive Interoperabilität',
      lead: 'Erkunden Sie feingranulare Signals, abgeleitete Computeds, Seiteneffekte, linkedSignal-Resets und bidirektionale RxJS-Interoperabilität mit toSignal, toObservable und rxResource.',
      focusAriaLabel: 'Signal-Thema filtern',
      focusOptions: {
        all: 'Alle Signal-Themen',
        basics: 'Signal-Grundlagen',
        toSignal: 'toSignal()',
        linkedSignal: 'linkedSignal()',
        rxResource: 'rxResource()',
        resource: 'resource() [Promise]',
        toObservable: 'toObservable()',
      },
      analogyStrong: 'Analogie:',
      statusPrefix: 'Status:',
      writable: {
        title: '1. Beschreibbare Signals: signal()',
        description:
          'Die grundlegenden „Sources of Truth“ in modernem Angular. Mutieren Zustand direkt und benachrichtigen feingranulare Abhängigkeiten.',
        firstNameLabel: 'Vorname:',
        lastNameLabel: 'Nachname:',
        quantityLabel: 'Menge:',
      },
      computed: {
        title: '2. Berechnete Signals: computed()',
        description:
          'Leiten schreibgeschützte, memoisierte Werte ab. Werden verzögert (lazy) ausgewertet und nur bei Änderung ihrer Abhängigkeiten neu berechnet.',
        fullNameLabel: 'Vollständiger Name:',
        isStockLowLabel: 'Niedriger Lagerbestand?',
        stockMessageLabel: 'Bestandsmeldung:',
        lowStockMsg: (qty) => `Nur noch ${qty} auf Lager – jetzt bestellen!`,
        inStockMsg: (qty) => `${qty} auf Lager.`,
      },
      effect: {
        title: '3. Effekte: effect()',
        description:
          'Seiteneffekte, die ausgeführt werden, sobald sich überwachte Signals ändern.',
        auditTrailTitle: 'Effekt-Audit-Protokoll',
      },
      toSignal: {
        title: '4. RxJS-Interop: toSignal()',
        description:
          'Konvertiert ein RxJS-Observable in ein reaktives schreibgeschütztes Signal mit automatischer Abo-Bereinigung.',
        analogyText:
          'Ein Zeitschriften-Abo (Observable): Jede neue Ausgabe landet direkt in Ihrem Briefkasten (Signal) und kann jederzeit synchron gelesen werden.',
        streamLabel: 'RxJS interval(1000) Observable-Stream',
        resultingSignalLabel: 'Resultierendes Signal (counterSignal):',
        computedEvenLabel: 'Berechnet aus Signal (isEven):',
        startStreamBtn: 'Stream starten',
        stopStreamBtn: 'Stream stoppen',
      },
      linkedSignal: {
        title: '5. Angular 22: linkedSignal()',
        description:
          'Ein beschreibbares Signal, das sich auf einen berechneten Standardwert zurücksetzt, sobald sich seine Quell-Abhängigkeit ändert, aber direkte Änderungen erlaubt.',
        whyStrong: 'Warum linkedSignal?',
        whyText:
          'Mit computed() ist der Zustand schreibgeschützt. Mit getrennten Signals und Effekten entstehen leicht Synchronisationsfehler. linkedSignal() löst dies sauber.',
        choosePlanLabel: 'Tarifstufe wählen:',
        starterBtn: 'Starter (5)',
        proBtn: 'Pro (25)',
        enterpriseBtn: 'Enterprise (100)',
        adjustCreditsLabel: 'Rechen-Credits anpassen (Direkte Mutation):',
        overriddenBadge: 'Überschrieben',
        resetDefaultBtn: 'Auf Standard zurücksetzen',
        planDefaultBadge: 'Tarif-Standard',
      },
      rxResource: {
        title: '6. Angular 22: Asynchroner Loader rxResource()',
        description:
          'Verbindet asynchrone RxJS-Streams direkt mit deklarativen Signals inklusive Ladezustand, Abbruch und Fehlergrenzen.',
        zonelessStrong: 'Asynchrone Daten in Zoneless Angular:',
        zonelessText:
          'rxResource() führt einen RxJS-Loader-Stream aus und stellt synchrone Signals für value(), isLoading() und status() ganz ohne zone.js bereit.',
        selectUserIdLabel: 'Benutzer-ID wählen:',
        userBtn: (id) => `Benutzer ${id}`,
        reloadStreamBtn: 'Stream neu laden',
        streamingDataText: 'Daten werden über RxJS gestreamt...',
      },
      resource: {
        title: '7. Angular 22: Promise-Loader resource()',
        description:
          'Asynchroner Loader auf Basis nativer async/await-Promises mit automatischer AbortSignal-Unterstützung.',
        promisesStrong: 'Native Promises im Zoneless-Modus:',
        promisesText:
          'Während rxResource() RxJS-Observables kapselt, verbindet sich resource() direkt mit fetch() oder async/await und übergibt ein AbortSignal.',
        selectTopicLabel: 'Suchthema wählen:',
        reloadBtn: 'Neu laden',
        executingLoaderText: 'Asynchroner Loader wird ausgeführt...',
      },
      toObservable: {
        title: '7. Bidirektionale Interop: toObservable() + toSignal()',
        description:
          'Ein Signal-Input wird durch RxJS-Operatoren (wie debounceTime) geleitet und anschließend zurück in ein Signal gespiegelt.',
        typeToSearchLabel: 'Tippen zum Suchen (350 ms Debounce):',
        searchPlaceholder: 'Suchbegriffe eingeben...',
        rawInputLabel: 'Rohes Signal-Input:',
        debouncedSignalLabel: 'Entprelltes + Großbuchstaben-Signal:',
      },
    },
    rxjsVsSignals: {
      eyebrow: 'Angular 22 Architektur · Reaktive Paradigmen',
      heading: 'RxJS vs. Angular Signals: Leitfaden zur Koexistenz',
      lead: 'Meistern Sie das reaktive Spektrum in modernem Angular. Verstehen Sie, wann RxJS und wann Signals die richtige Wahl sind und wie das Muster „Events rein, State raus“ eine solide Zoneless-Architektur ermöglicht.',
      focusAriaLabel: 'Architektur-Thema filtern',
      focusOptions: {
        all: 'Alle Architekturen',
        decisionMatrix: 'Entscheidungsmatrix',
        searchDebounce: 'Suche & Debounce',
        derivedState: 'Abgeleitete Berechnungen',
        asyncResource: 'Asynchroner Datenabruf',
        linkedState: 'Abhängigen State zurücksetzen',
        coexistence: 'Philosophie der Koexistenz',
      },
      coexistence: {
        title: 'Architektur-Philosophie: „Events rein, State raus“',
        badge: 'Kernfundament',
        description:
          'Signals und RxJS sind keine Konkurrenten; sie lösen grundlegend unterschiedliche Probleme in der Anwendungsarchitektur.',
        step1Badge: '1. Events rein (RxJS)',
        step1Title: 'Asynchrone Koordination',
        step1Items: [
          'Tastatureingaben, Klicks, Scroll-Events',
          'WebSocket & Server-Sent Events',
          'Debounce, Throttle, debounceTime',
          'Retries, Timeouts & exponentielles Backoff',
          'Nebenläufigkeit: switchMap, exhaustMap, concatMap',
        ],
        step2Badge: '2. State raus (Signals)',
        step2Title: 'Synchroner UI-State',
        step2Items: [
          'Komponenten- und ViewModel-Zustand',
          'Synchrone Ableitungen (computed)',
          'Template-Bindings & Zoneless Change Detection',
          'Automatische Bereinigung (keine Memory Leaks)',
          'Signal-I/O (input, output, model)',
        ],
        ruleStrong: 'Die universelle Faustregel:',
        ruleQuote:
          '„Nutzen Sie RxJS für Ereignisse über die Zeit; nutzen Sie Signals für Werte über die Zeit.“',
        ruleText:
          'Wenn Sie Zeitsteuerung, Abbruch oder Nebenläufigkeit benötigen, greifen Sie zu RxJS. Wenn Sie synchronen UI-Zustand halten, ableiten oder anzeigen, greifen Sie zu Signals.',
      },
      decisionMatrix: {
        title: 'Interaktive Entscheidungsmatrix',
        description:
          'Wählen Sie eine typische Produktionsanforderung, um den RxJS-, Signals- und Hybrid-Ansatz zu vergleichen.',
        categoryPrefix: 'Kategorie:',
        recommendedPrefix: 'Empfohlen:',
        rxjsApproachTitle: 'RxJS-Ansatz',
        signalsApproachTitle: 'Signals-Ansatz',
        hybridApproachTitle: 'Best Practice / Hybrid',
        takeawayStrong: 'Architektur-Fazit:',
      },
      scenarios: [
        {
          id: 'search',
          title: 'Typeahead / Such-Autovervollständigung',
          category: 'Hybrid',
          winner: 'Hybrid (Both)',
          summary:
            'Asynchrone Tastatureingaben mit Debounce und Abbruch verarbeiten und das Ergebnis in synchronen UI-Zustand projizieren.',
          rxjsApproach:
            'searchInput$.pipe(debounceTime(300), distinctUntilChanged(), switchMap(q => api.search(q)))',
          signalsApproach:
            'Signals unterstützen ohne externe Timer-Logik kein zeitbasiertes Throttling oder Debouncing.',
          hybridApproach:
            'query = signal(""); query$ = toObservable(this.query); results = toSignal(this.query$.pipe(debounceTime(300), switchMap(q => api.search(q))), { initialValue: [] })',
          ruleOfThumb:
            'Nutzen Sie RxJS zur zeitlichen Koordination des asynchronen Event-Streams und schliessen Sie mit toSignal() für das Template ab.',
        },
        {
          id: 'derived',
          title: 'Warenkorb-Summe & Preisberechnungen',
          category: 'State',
          winner: 'Signals',
          summary:
            'Synchrone Berechnung aus mehreren Zustandsquellen (Artikel, Menge, Rabatt, Steuer).',
          rxjsApproach:
            'combineLatest([items$, discount$, tax$]).pipe(map(...)) — erfordert Abonnement und manuelle Bereinigung.',
          signalsApproach:
            'total = computed(() => calculate(this.items(), this.discount(), this.tax())) — automatisches Dependency-Tracking, synchroner Pull, null Subscriptions.',
          hybridApproach:
            'Reine Signals gewinnen hier klar. Für synchrone In-Memory-Ableitungen ist kein RxJS nötig.',
          ruleOfThumb:
            'Wenn Zustand synchron im Speicher liegt, bevorzugen Sie immer signal() und computed().',
        },
        {
          id: 'websockets',
          title: 'Echtzeit-WebSockets & Event-Feeds',
          category: 'Events',
          winner: 'RxJS',
          summary:
            'Kontinuierlicher Strom von Push-Netzwerkpaketen, Reconnect-Backoff, Heartbeats und Nachrichtenfilterung.',
          rxjsApproach:
            'webSocket$.pipe(retry({ delay: 2000 }), filter(isRelevant), scan(accumulateFeed, [])) — RxJS ist speziell für Push-Streams über die Zeit gebaut.',
          signalsApproach:
            'Signals repräsentieren nur den jeweils neuesten Einzelwert und modellieren keine Paket-Warteschlangen.',
          hybridApproach:
            'Verwalten Sie den Socket-Lebenszyklus in RxJS und stellen Sie feed = toSignal(feed$) für das Template bereit.',
          ruleOfThumb:
            'Immer wenn Ereignisse über die Zeit gepusht werden (Sockets, Message-Busse), ist RxJS der Goldstandard.',
        },
        {
          id: 'spam-prevention',
          title: 'Formular-Übermittlung & Doppelklick-Schutz',
          category: 'Events',
          winner: 'RxJS',
          summary:
            'Sicherstellen, dass eine laufende Übermittlung schnelle Doppelklicks blockiert, bis die Serverantwort eintrifft.',
          rxjsApproach:
            'submitClick$.pipe(exhaustMap(() => authService.login(credentials))) — exhaustMap verwirft Klicks automatisch, solange der Request aktiv ist.',
          signalsApproach:
            'Erfordert manuelle Flag-Verwaltung (isSubmitting) mit try/finally-Blöcken.',
          hybridApproach:
            'Nutzen Sie exhaustMap oder eine Resource mit deaktiviertem Button-Status.',
          ruleOfThumb:
            'Nutzen Sie exhaustMap, wenn eingehende Auslöser während einer laufenden asynchronen Operation ignoriert werden müssen.',
        },
        {
          id: 'dependent-reset',
          title: 'Zurücksetzen abhängiger Zustände (Master-Detail)',
          category: 'State',
          winner: 'Signals',
          summary:
            'Der Wechsel einer übergeordneten Kategorie setzt das ausgewählte Element auf den Standard zurück, erlaubt aber weiterhin manuelle Auswahl.',
          rxjsApproach:
            'Erforderte früher verschachtelte Subjects oder komplexe switchMap-Resets.',
          signalsApproach:
            'selectedItem = linkedSignal({ source: () => this.category(), computation: (cat) => cat.defaultItem }) — setzt sich automatisch zurück und bleibt direkt beschreibbar!',
          hybridApproach:
            'Angular 22 linkedSignal() ist hierfür das sauberste Muster im gesamten Frontend-Ökosystem.',
          ruleOfThumb:
            'Nutzen Sie linkedSignal() für beschreibbaren lokalen Zustand, der mit einer Quell-Abhängigkeit synchron bleiben muss.',
        },
      ],
      derivedState: {
        title:
          'Live-Sandbox: Abgeleiteter Zustand (combineLatest vs. computed)',
        description:
          'Berechnung einer synchronen Gesamtsumme aus Grundpreis, Rabatt und Steuersatz. Vergleichen Sie die Ergonomie von Signals mit Stream-Pipes.',
        basePriceLabel: 'Grundpreis ($):',
        discountLabel: 'Rabatt ($):',
        taxRateLabel: 'Steuersatz (20 %):',
        fixed20Badge: '20 % Fest',
        signalsComputedLabel: 'Signals (computed)',
        syncPullBadge: 'Synchroner Pull',
        signalsNote:
          'Lazy ausgewertet, glitch-frei, memoisiert, keine Abo-Bereinigung erforderlich.',
        rxjsCombineLabel: 'RxJS (combineLatest)',
        pushStreamBadge: 'Push-Stream',
        rxjsNote:
          'Erfordert 3 BehaviorSubjects, combineLatest, map-Pipe sowie toSignal oder AsyncPipe.',
      },
      searchDebounce: {
        title: 'Live-Sandbox: Zeitbasierte Suche (Hybrid-Interop)',
        description:
          'Signals kennen nativ keine Zeitverzögerung. Wir nutzen toObservable() für RxJS-Zeitoperatoren und speichern das Ergebnis über toSignal().',
        inputLabel:
          'Tippen Sie schnell, um das Debouncing (400 ms) zu beobachten:',
        inputPlaceholder: 'Suchbegriff eingeben...',
        rawSignalLabel: 'Rohes Tastatur-Signal (Sofort):',
        debouncedSignalLabel: 'Entprelltes + normalisiertes Signal (toSignal):',
      },
      asyncResource: {
        title: 'Live-Sandbox: Asynchrone Daten mit rxResource()',
        description:
          'Angular 22 führt resource() und rxResource() ein, um asynchronen Datenabruf und Signals inklusive Ladestatus und Abbruch zu vereinen.',
        selectLocationLabel: 'Ort auswählen:',
        parisBtn: 'Paris',
        tokyoBtn: 'Tokio',
        nycBtn: 'New York',
        reloadStreamBtn: 'Stream neu laden',
        fetchingWeatherText: 'Wetter-Stream wird über rxResource geladen...',
        statusPrefix: 'Status:',
      },
      linkedState: {
        title: 'Live-Sandbox: Abhängiger Zustand mit linkedSignal()',
        description:
          'Ein klassischer Fehler in Angular-Apps ist das Zurücksetzen von Kind-Zustand bei Änderung des Eltern-Zustands. linkedSignal() löst dies deklarativ.',
        selectPlanLabel: 'Tarifstufe wählen (Eltern-Zustand):',
        basicBtn: 'Basic (20 GB)',
        proBtn: 'Pro (100 GB)',
        enterpriseBtn: 'Enterprise (500 GB)',
        adjustQuotaLabel: 'Speicherkontingent anpassen (Direkte Mutation):',
        customOverrideBadge: 'Benutzerdefiniert',
        resetPlanDefaultBtn: 'Auf Tarif-Standard zurücksetzen',
        planDefaultBadge: 'Tarif-Standard',
      },
    },
    quiz: {
      eyebrow: 'Wissensüberprüfung',
      heading: 'RxJS & Angular Reaktivitäts-Challenge',
      lead: 'Testen Sie Ihr Wissen über Stream-Transformation, Multicasting, Fehlerbehandlung, Caching und moderne Angular 22 Signals.',
      tracks: {
        beginnerTitle: 'Einsteiger',
        beginnerBadge: 'Grundlagen',
        beginnerDesc:
          'Observables, Basis-Operatoren und einfacher Datenaustausch.',
        beginnerBtn: 'Einsteiger-Track starten',
        midTitle: 'Fortgeschritten',
        midBadge: 'Operatoren & Subjects',
        midDesc: 'Higher-Order-Mapping, Multicasting, Caching und Batching.',
        midBtn: 'Fortgeschrittenen-Track starten',
        seniorTitle: 'Senior',
        seniorBadge: 'Architektur & Interop',
        seniorDesc:
          'Zoneless-Ausführung, linkedSignal, rxResource und Grenzfälle.',
        seniorBtn: 'Senior-Track starten',
      },
      questionProgress: (current, total) => `Frage ${current} von ${total}`,
      answerPlaceholder: 'Antwort eingeben und Eingabetaste drücken...',
      correctAnswerLabel: 'Richtige Antwort:',
      submitAnswerBtn: 'Antwort absenden',
      correctToast: 'Richtig!',
      incorrectToast:
        'Nicht ganz! Schauen Sie sich das Konzept noch einmal an.',
      correctFeedback: 'Richtig! Gut gemacht.',
      incorrectFeedback: 'Nicht ganz. Dieses Konzept wird behandelt in:',
      reviewConceptBtn: 'Konzept wiederholen',
      nextQuestionBtn: 'Nächste Frage',
      finishQuizBtn: 'Quiz beenden',
      quizCompleteTitle: 'Quiz abgeschlossen!',
      scoreText: (score, total) =>
        `Sie haben ${score} von ${total} Punkten erreicht`,
      tryAnotherBtn: 'Anderes Level versuchen',
      questions: [
        {
          id: 1,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'Welcher Operator wird verwendet, um Fehler in einem Stream abzufangen und einen Ersatzwert bereitzustellen?',
          options: ['retry', 'throwError', 'catchError', 'finalize'],
          answer: 'catchError',
          relatedRoute: '/error-handling',
        },
        {
          id: 2,
          type: 'fill-in-the-blank',
          difficulty: 'Beginner',
          text: 'Ein „Cold“ Observable beginnt erst dann Werte zu produzieren, wenn ein ____ es abonniert.',
          answer: 'subscriber',
          relatedRoute: '/multicasting',
        },
        {
          id: 7,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'Welche Funktion wird verwendet, um Daten von einer Eltern-Komponente an eine Kind-Komponente zu übergeben?',
          options: ['output()', 'input()', 'signal()', 'effect()'],
          answer: 'input()',
          relatedRoute: '/sharing-data',
        },
        {
          id: 10,
          type: 'multiple-choice',
          difficulty: 'Beginner',
          text: 'Was kennzeichnet traditionell das Suffix `$` am Ende eines Variablennamens in RxJS?',
          options: [
            'Ein Subject',
            'Einen Endwert',
            'Ein Observable',
            'Eine private Eigenschaft',
          ],
          answer: 'Ein Observable',
          relatedRoute: '/multicasting',
        },
        {
          id: 11,
          type: 'fill-in-the-blank',
          difficulty: 'Beginner',
          text: 'In Angular wird die Funktion ____ verwendet, um einen abgeleiteten Wert aus einem oder mehreren Signals zu erstellen.',
          answer: 'computed',
          relatedRoute: '/signals',
        },
        {
          id: 3,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'Welcher Higher-Order-Mapping-Operator eignet sich bei einer Live-Suche am besten, um unnötige Netzwerkaufrufe zu vermeiden?',
          options: ['concatMap', 'mergeMap', 'exhaustMap', 'switchMap'],
          answer: 'switchMap',
          relatedRoute: '/transforming-streams',
        },
        {
          id: 4,
          type: 'code-completion',
          difficulty: 'Mid-level',
          text: 'Vervollständigen Sie den Code, um beide API-Aufrufe parallel auszuführen und das Ergebnis erst zu erhalten, wenn beide abgeschlossen sind.',
          codeSnippet: `\nconst user$ = this.http.get('/api/user');\nconst permissions$ = this.http.get('/api/permissions');\n\n____([user$, permissions$]).subscribe(([user, permissions]) => {\n  // ...\n});`,
          answer: 'forkJoin',
          relatedRoute: '/bulk-operations',
        },
        {
          id: 8,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'Welcher Operator ist ideal, um das Ergebnis eines HTTP-Requests zwischenzuspeichern und zu teilen?',
          options: ['share', 'cache', 'shareReplay', 'multicast'],
          answer: 'shareReplay',
          relatedRoute: '/reactive-caching',
        },
        {
          id: 12,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'Welches Subject eignet sich am besten, um den Authentifizierungsstatus zu speichern, den neue Komponenten sofort beim Erstellen abfragen?',
          options: [
            'Subject',
            'AsyncSubject',
            'BehaviorSubject',
            'ReplaySubject',
          ],
          answer: 'BehaviorSubject',
          relatedRoute: '/multicasting',
        },
        {
          id: 13,
          type: 'code-completion',
          difficulty: 'Mid-level',
          text: 'Füllen Sie die Lücke, um eingehende Daten in Arrays von je 4 Elementen zu bündeln.',
          codeSnippet: `\nsource$.pipe(\n  ____(4)\n).subscribe(batch => console.log(batch));`,
          answer: 'bufferCount',
          relatedRoute: '/bulk-operations',
        },
        {
          id: 16,
          type: 'multiple-choice',
          difficulty: 'Mid-level',
          text: 'Welches Signal-Primitiv in Angular 22 erzeugt ein beschreibbares Signal, das sich bei Änderung seiner Quelle auf einen berechneten Standardwert zurücksetzt?',
          options: ['computed()', 'linkedSignal()', 'toSignal()', 'effect()'],
          answer: 'linkedSignal()',
          relatedRoute: '/signals',
        },
        {
          id: 5,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'Welcher Subject-Typ liefert einem neuen Abonnenten sofort die letzten 3 emittierten Werte?',
          options: [
            'Subject',
            'AsyncSubject',
            'BehaviorSubject(3)',
            'ReplaySubject(3)',
          ],
          answer: 'ReplaySubject(3)',
          relatedRoute: '/multicasting',
        },
        {
          id: 6,
          type: 'fill-in-the-blank',
          difficulty: 'Senior',
          text: 'Um ein „Cold“ Observable in ein „Hot“ Observable umzuwandeln, das beim ersten Abonnement startet und seine Werte teilt, nutzt man den Operator ____.',
          answer: 'share()',
          relatedRoute: '/multicasting',
        },
        {
          id: 9,
          type: 'code-completion',
          difficulty: 'Senior',
          text: 'Füllen Sie die Lücke, damit ein Login-Request ignoriert wird, solange bereits einer läuft.',
          codeSnippet: `\nloginClick$.pipe(\n  ____(() => this.authService.login(credentials))\n).subscribe();`,
          answer: 'exhaustMap',
          relatedRoute: '/transforming-streams',
        },
        {
          id: 14,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'Was bedeutet das Zeichen `|` beim RxJS-Marble-Testing?',
          options: [
            'Einen Fehler',
            'Eine Wert-Emission',
            'Den Abschluss des Streams',
            'Einen Abonnement-Zeitpunkt',
          ],
          answer: 'Den Abschluss des Streams',
          relatedRoute: '/multicasting',
        },
        {
          id: 15,
          type: 'code-completion',
          difficulty: 'Senior',
          text: 'Vervollständigen Sie den Code, um ein Observable mit einem Startwert in ein Signal umzuwandeln.',
          codeSnippet: `\nconst data$ = this.dataService.getData();\nconst data = toSignal(data$, { ____: 'Loading...' });`,
          answer: 'initialValue',
          relatedRoute: '/signals',
        },
        {
          id: 17,
          type: 'multiple-choice',
          difficulty: 'Senior',
          text: 'Welche Funktion aus @angular/core/rxjs-interop lädt in Angular 22 asynchrone Daten aus einem RxJS-Stream in deklarative Signals?',
          options: [
            'toSignal()',
            'rxResource()',
            'toObservable()',
            'outputFromObservable()',
          ],
          answer: 'rxResource()',
          relatedRoute: '/signals',
        },
      ],
    },
  },
};
