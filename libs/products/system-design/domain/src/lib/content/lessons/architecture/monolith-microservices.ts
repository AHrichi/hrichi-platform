import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 06.01: Monolith vs Microservices (`monolith-microservices`).
 * Scenario: A growing team blocking each other (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'monolith-microservices',
  learn: [
    'Why monoliths speed up small teams and slow down large ones',
    'How modular monoliths enforce domain boundaries first',
    'Why microservices unlock independent team deployments',
    'Network latency and failure costs of splitting services',
    'Why each microservice must own its private database',
  ],
  scene: {
    nodes: [
      {
        id: 'shoppers',
        kind: 'client',
        at: { x: 1, y: 4 },
        label: 'Shoppers',
        sublabel: 'Web & mobile',
      },
      {
        id: 'monolith',
        kind: 'server',
        at: { x: 6, y: 4 },
        label: 'Store Monolith',
        sublabel: '45 engineers',
        load: 0.35,
      },
      {
        id: 'shared-db',
        kind: 'database',
        at: { x: 11, y: 4 },
        label: 'Store DB',
        sublabel: 'Shared tables',
      },
    ],
    edges: [
      {
        id: 'shoppers-mono',
        from: 'shoppers',
        to: 'monolith',
        label: 'HTTPS',
      },
      {
        id: 'mono-db',
        from: 'monolith',
        to: 'shared-db',
        label: 'SQL joins',
      },
    ],
    zones: [
      {
        id: 'mono-zone',
        from: { x: 5, y: 2 },
        to: { x: 12, y: 6 },
        hue: 'amber',
        label: 'Single deploy unit',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'deploys', label: 'Deploys/wk', icon: 'clock', value: '2' },
    { id: 'call-cost', label: 'Call cost', icon: 'timer', value: '0.01 ms' },
    { id: 'coupling', label: 'DB tables', icon: 'database', value: 'Shared' },
    { id: 'ops', label: 'Pipelines', icon: 'layers', value: '1' },
  ],
  steps: [
    {
      id: 'merge-queue',
      label: 'Merge jam',
      kind: 'problem',
      title: 'Forty engineers, one slow release train',
      body: [
        'Your store started with four engineers shipping twice a day. Now **45 engineers** edit one **Store Monolith** backed by one **Store DB**.',
        'Squads share tables, builds, and deploy queues. One flaky billing test blocks Catalog from shipping, dropping releases to **two per week**.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'monolith',
          patch: { state: 'hot', load: 0.85, badge: '45 devs' },
        },
        {
          op: 'add-note',
          note: {
            id: 'jam-note',
            anchor: { node: 'monolith' },
            text: '1 broken test blocks everyone',
            tone: 'bad',
            icon: 'warning',
          },
        },
        { op: 'packet', edge: 'shoppers-mono', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'mono-db', kind: 'write', wave: 1 },
      ],
    },
    {
      id: 'modular-monolith',
      label: 'Modularize',
      kind: 'technique',
      title: 'Build a modular monolith before splitting',
      body: [
        'First organize the single codebase into a **modular monolith**: clean internal modules (`Catalog`, `Orders`, `Billing`) that talk only through explicit public interfaces—never reaching directly into another module’s tables.',
        'Function calls stay in memory at **0.01 ms**, local SQL transactions remain atomic, and only **one** pipeline needs ops care.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'If you cannot keep module boundaries clean inside one repo, splitting over a network creates a distributed tangle.',
        },
      ],
      changes: [
        {
          type: 'changed',
          text: 'Codebase split into three strict internal modules',
        },
        {
          type: 'changed',
          text: 'Deploys rise to 5/week with scoped ownership',
        },
      ],
      ops: [
        { op: 'remove-note', id: 'jam-note' },
        {
          op: 'update-node',
          id: 'monolith',
          patch: {
            state: 'focus',
            sublabel: '3 clean modules',
            badge: 'In-process',
            load: 0.4,
          },
        },
        {
          op: 'update-node',
          id: 'shared-db',
          patch: { sublabel: 'Logical schemas' },
        },
        {
          op: 'add-note',
          note: {
            id: 'modules-note',
            anchor: { at: { x: 6, y: 8 } },
            text: 'Catalog · Orders · Billing',
            tone: 'info',
            icon: 'layers',
          },
        },
        { op: 'set-metric', id: 'deploys', value: '5' },
        { op: 'set-metric', id: 'coupling', value: 'Scoped' },
      ],
      learns: [0],
    },
    {
      id: 'domain-boundaries',
      label: 'Domain split',
      kind: 'technique',
      title: 'Draw service boundaries by business domain',
      body: [
        'Once module boundaries stop shifting, extract microservices along **business domains**—capabilities like _Catalog_, _Orders_, and _Billing_—rather than technical layers.',
        'Good domain boundaries keep most new features inside one team and one service, instead of forcing three squads to coordinate every change.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Catalog and Billing extracted as separate services',
        },
        { type: 'changed', text: 'CI/CD pipelines grow from 1 to 3' },
      ],
      ops: [
        { op: 'remove-zone', id: 'mono-zone' },
        { op: 'remove-note', id: 'modules-note' },
        {
          op: 'update-node',
          id: 'monolith',
          patch: {
            label: 'Orders',
            sublabel: 'Orders squad',
            badge: null,
            state: 'normal',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'catalog',
            kind: 'service',
            at: { x: 6, y: 1 },
            label: 'Catalog',
            sublabel: 'Catalog squad',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'billing',
            kind: 'service',
            at: { x: 6, y: 7 },
            label: 'Billing',
            sublabel: 'Billing squad',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'shop-cat',
            from: 'shoppers',
            to: 'catalog',
            label: 'HTTPS',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'shop-bill',
            from: 'shoppers',
            to: 'billing',
            label: 'HTTPS',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'cat-db',
            from: 'catalog',
            to: 'shared-db',
            label: 'SQL',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'bill-db',
            from: 'billing',
            to: 'shared-db',
            label: 'SQL',
          },
        },
        { op: 'set-metric', id: 'ops', value: '3' },
      ],
      learns: [1],
    },
    {
      id: 'independent-deploys',
      label: 'Deploys',
      kind: 'technique',
      title: 'Deploy and scale one service at a time',
      body: [
        'With separate services, the **Catalog** squad ships search tweaks ten times a week even during a Billing freeze.',
        'During holiday traffic, you scale **Catalog** out to 6 pods while keeping **Orders** and **Billing** at 2—raising total org deploys to **18 per week**.',
      ],
      changes: [
        { type: 'changed', text: 'Catalog scales independently to 6 pods' },
        { type: 'changed', text: 'Release velocity jumps to 18 deploys/week' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'catalog',
          patch: { state: 'focus', badge: 'v42 · 6 pods', load: 0.75 },
        },
        {
          op: 'update-node',
          id: 'monolith',
          patch: { state: 'normal', badge: 'v19 · 2 pods' },
        },
        {
          op: 'update-node',
          id: 'billing',
          patch: { state: 'normal', badge: 'v12 · 2 pods' },
        },
        {
          op: 'packet',
          edge: 'shop-cat',
          kind: 'request',
          count: 3,
          label: 'Browse burst',
          wave: 0,
        },
        { op: 'packet', edge: 'shoppers-mono', kind: 'request', wave: 0 },
        { op: 'set-metric', id: 'deploys', value: '18', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'network-cost',
      label: 'Network cost',
      kind: 'case',
      title: 'In-process calls become slow network hops',
      body: [
        'Inside the monolith, checking a price and charging a card took **0.01 ms** in RAM. Now **Orders** makes network **RPC** calls (_Remote Procedure Calls_) to **Catalog** and **Billing**.',
        'Each hop adds serialization, TLS, and **~4 ms** of latency—and any network call can fail partway, forcing timeouts and retries.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Chatty microservices turn one tight loop into dozens of slow, failure-prone network calls.',
        },
      ],
      changes: [
        {
          type: 'added',
          text: 'gRPC links between Orders, Catalog, and Billing',
        },
        { type: 'changed', text: 'Call cost climbs from 0.01 ms to 4–20 ms' },
      ],
      ops: [
        {
          op: 'add-edge',
          edge: {
            id: 'orders-cat',
            from: 'monolith',
            to: 'catalog',
            label: 'gRPC price',
            route: 'straight',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'orders-bill',
            from: 'monolith',
            to: 'billing',
            label: 'gRPC charge',
            route: 'straight',
          },
        },
        {
          op: 'update-node',
          id: 'monolith',
          patch: { state: 'hot', badge: 'RPC fan-out' },
        },
        { op: 'packet', edge: 'shoppers-mono', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'orders-cat',
          kind: 'request',
          label: '4 ms',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'orders-bill',
          kind: 'error',
          label: 'Timeout',
          wave: 2,
        },
        { op: 'set-metric', id: 'call-cost', value: '4–20 ms', tone: 'bad' },
      ],
      learns: [3],
    },
    {
      id: 'shared-db-trap',
      label: 'Shared DB',
      kind: 'watch-out',
      title: 'A shared database breaks independence',
      body: [
        'Look at **Store DB**: Catalog renames a `sku` column and breaks Orders queries in production! Worse, Billing’s heavy monthly report locks tables and slows down checkout.',
        'Sharing one database gives you the **network latency of microservices** with the **release coupling of a monolith**—a _distributed monolith_.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Services that share tables or must deploy together are really one service split badly.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'shared-db',
          patch: { state: 'hot', badge: 'Schema clash' },
        },
        {
          op: 'update-node',
          id: 'monolith',
          patch: { state: 'down', badge: 'SQL broken' },
        },
        {
          op: 'update-edge',
          id: 'mono-db',
          patch: { state: 'broken', label: 'Bad col!' },
        },
        {
          op: 'packet',
          edge: 'cat-db',
          kind: 'write',
          label: 'ALTER table',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'mono-db',
          kind: 'error',
          reverse: true,
          label: '500 Error',
          wave: 1,
        },
        { op: 'set-metric', id: 'coupling', value: 'Broken!', tone: 'bad' },
      ],
    },
    {
      id: 'data-ownership',
      label: 'Own data',
      kind: 'technique',
      title: 'Each service owns its private database',
      body: [
        'Enforce **database-per-service**: give **Catalog** and **Billing** private stores, while **Orders** keeps `Orders DB`. No service reads another’s tables; cross-service data flows only via APIs or events.',
        'Now SQL joins across domains disappear, and every squad migrates its own schema safely.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Expose an API or event stream—never your raw database tables.',
        },
      ],
      changes: [
        { type: 'added', text: 'Private Catalog DB and Billing DB' },
        { type: 'removed', text: 'Cross-service SQL links to Store DB' },
      ],
      ops: [
        { op: 'remove-edge', id: 'cat-db' },
        { op: 'remove-edge', id: 'bill-db' },
        {
          op: 'update-edge',
          id: 'mono-db',
          patch: { state: 'normal', label: 'Private SQL' },
        },
        {
          op: 'update-node',
          id: 'shared-db',
          patch: {
            state: 'normal',
            label: 'Orders DB',
            sublabel: 'Private to Orders',
            badge: null,
          },
        },
        {
          op: 'update-node',
          id: 'monolith',
          patch: { state: 'normal', badge: 'v19 · 2 pods' },
        },
        {
          op: 'add-node',
          node: {
            id: 'catalog-db',
            kind: 'database',
            at: { x: 11, y: 1 },
            label: 'Catalog DB',
            sublabel: 'Private',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'billing-db',
            kind: 'database',
            at: { x: 11, y: 7 },
            label: 'Billing DB',
            sublabel: 'Private',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'cat-own-db',
            from: 'catalog',
            to: 'catalog-db',
            label: 'Private SQL',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'bill-own-db',
            from: 'billing',
            to: 'billing-db',
            label: 'Private SQL',
          },
        },
        { op: 'set-metric', id: 'coupling', value: 'Private', tone: 'good' },
        { op: 'set-metric', id: 'call-cost', value: '4 ms', tone: 'normal' },
      ],
      learns: [4],
    },
    {
      id: 'when-to-split',
      label: 'When to split',
      kind: 'case',
      title: 'Earn microservices when scale or teams demand it',
      body: [
        'Each domain island now needs **service discovery**, **distributed tracing**, **sagas** instead of ACID joins, and separate deploy pipelines.',
        'A 5-person startup pays heavy operational tax for zero gain. Start with a **modular monolith**, and extract a service only when team blocking or asymmetric scaling proves its worth.',
      ],
      ops: [
        {
          op: 'add-zone',
          zone: {
            id: 'cat-zone',
            from: { x: 5, y: 0 },
            to: { x: 12, y: 2 },
            hue: 'teal',
            label: 'Catalog boundary',
          },
        },
        {
          op: 'add-zone',
          zone: {
            id: 'ord-zone',
            from: { x: 5, y: 3 },
            to: { x: 12, y: 5 },
            hue: 'blue',
            label: 'Orders boundary',
          },
        },
        {
          op: 'add-zone',
          zone: {
            id: 'bill-zone',
            from: { x: 5, y: 6 },
            to: { x: 12, y: 8 },
            hue: 'amber',
            label: 'Billing boundary',
          },
        },
        { op: 'packet', edge: 'cat-own-db', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'mono-db', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'bill-own-db', kind: 'write', wave: 0 },
        { op: 'set-metric', id: 'ops', value: '3 + tracing' },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Split by domain and own your data',
      body: [
        'Monoliths maximize simplicity and local transaction speed; microservices maximize team autonomy and independent scaling. Respect domain boundaries and private data ownership either way.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'catalog',
          patch: { state: 'normal', badge: null, load: null },
        },
        {
          op: 'update-node',
          id: 'monolith',
          patch: { state: 'normal', badge: null, load: null },
        },
        {
          op: 'update-node',
          id: 'billing',
          patch: { state: 'normal', badge: null, load: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'summary-table',
            anchor: { at: { x: 1, y: 8 } },
            text: 'Monolith vs Microservices',
            tone: 'info',
            icon: 'layers',
            rows: [
              ['Calls', '0.01 ms vs ~4 ms RPC'],
              ['Data', 'Shared ACID vs Private DB'],
              ['Deploys', 'Coupled vs Independent'],
            ],
            total: ['Default', 'Modular monolith first'],
          },
        },
      ],
      takeaways: [
        'Start with a modular monolith to keep fast in-process calls and ACID transactions',
        'Split microservices along stable business domains, never technical layers',
        'Every microservice must own its private database—shared tables create a distributed monolith',
        'Microservices trade operational simplicity and local joins for independent deploys and scaling',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-distributed-monolith',
      kind: 'choice',
      prompt:
        'Three microservices run in separate containers, but all read and write the same SQL tables. Why is this called a distributed monolith?',
      options: [
        'It adds network RPC overhead while keeping schema and deploy coupling across teams',
        'It forces every service to use a different programming language',
        'It prevents horizontal scaling of stateless API servers',
      ],
      answer: 0,
      explain:
        'Sharing tables means a schema migration or runaway query in one service breaks the others, eliminating microservice independence while still paying network costs.',
      step: 'shared-db-trap',
    },
    {
      id: 'choice-modular-first',
      kind: 'choice',
      prompt:
        'A 6-engineer startup is launching an e-commerce app whose product features change weekly. Which architecture fits best today?',
      options: [
        'A modular monolith with clean internal module interfaces',
        'Twelve domain microservices with separate Kubernetes pipelines',
        'Separate UI and SQL microservices sharing one raw database',
      ],
      answer: 0,
      explain:
        'A modular monolith gives fast iteration, 0.01 ms in-process calls, and simple ops while preparing clean boundaries if a future split is ever needed.',
      step: 'modular-monolith',
    },
    {
      id: 'numeric-rpc-fanout',
      kind: 'numeric',
      prompt:
        'An in-process monolith checkout runs 5 internal calls taking 0.02 ms each. After splitting into services, those 5 sequential hops run over RPC at 4 ms per hop. Roughly how long do the 5 RPC hops take in total?',
      unit: 'ms',
      answer: 20,
      tolerance: 0.1,
      explain:
        '5 sequential network hops × 4 ms per hop = 20 ms (about 200× slower than 0.1 ms in-memory calls).',
      step: 'network-cost',
    },
    {
      id: 'order-extraction-path',
      kind: 'order',
      prompt:
        'Order the safe progression from a growing codebase to healthy microservices.',
      items: [
        'Organize one repository into clean domain modules',
        'Isolate each module’s tables behind explicit internal APIs',
        'Extract a stable, fast-growing domain into its own service and private DB',
        'Add service discovery, distributed tracing, and sagas across services',
      ],
      explain:
        'Stabilizing module boundaries and data ownership inside the monolith first avoids extracting tangled services.',
      step: 'when-to-split',
    },
  ],
  cards: [
    {
      front:
        'What is a modular monolith, and why build one before microservices?',
      back: 'A single deployable application divided into isolated business modules with explicit interfaces. It keeps 0.01 ms in-process calls and ACID transactions while proving domain boundaries before paying network overhead.',
    },
    {
      front: 'How should you choose microservice boundaries?',
      back: 'Split along stable business capabilities/domains (Catalog, Orders, Billing) so features stay within one team, rather than by technical layers.',
    },
    {
      front: 'What is a "distributed monolith" and how do you avoid it?',
      back: 'Services deployed separately that still share a database or must change in lockstep. Avoid it by giving each service its own private database and communicating via APIs or events.',
    },
    {
      front:
        'What extra costs do microservices introduce compared to a monolith?',
      back: 'Network latency and partial failures on RPCs, no cross-service SQL joins or ACID transactions (requiring sagas), plus service discovery, distributed tracing, and multiple CI/CD pipelines.',
    },
  ],
} satisfies Lesson;
