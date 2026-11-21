import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 06.02: Service Discovery (`service-discovery`).
 * Scenario: Instances come and go each minute (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'service-discovery',
  learn: [
    'Why hard-coded IP lists break in autoscaling fleets',
    'How a service registry tracks live nodes via heartbeats',
    'Client-side vs server-side discovery routing trade-offs',
    'How DNS-based discovery works and why TTL lag hurts',
    'How sidecar proxies and service meshes move routing out',
  ],
  scene: {
    nodes: [
      {
        id: 'checkout',
        kind: 'service',
        at: { x: 1, y: 4 },
        label: 'Checkout',
        sublabel: 'Static IP config',
      },
      {
        id: 'inv-1',
        kind: 'server',
        at: { x: 10, y: 2 },
        label: 'Inventory-1',
        sublabel: '10.0.1.12',
      },
      {
        id: 'inv-2',
        kind: 'server',
        at: { x: 10, y: 6 },
        label: 'Inventory-2',
        sublabel: '10.0.1.15',
      },
    ],
    edges: [
      {
        id: 'co-inv1',
        from: 'checkout',
        to: 'inv-1',
        label: '10.0.1.12',
      },
      {
        id: 'co-inv2',
        from: 'checkout',
        to: 'inv-2',
        label: '10.0.1.15',
      },
    ],
    zones: [
      {
        id: 'fleet-zone',
        from: { x: 9, y: 0 },
        to: { x: 13, y: 8 },
        hue: 'blue',
        label: 'Autoscaling fleet',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'instances', label: 'Live nodes', icon: 'server', value: '2' },
    { id: 'stale', label: 'Stale hits', icon: 'warning', value: '0%' },
    { id: 'hops', label: 'Network hops', icon: 'route', value: '1' },
    { id: 'ttl-lag', label: 'Stale window', icon: 'clock', value: 'Manual' },
  ],
  steps: [
    {
      id: 'hardcoded-ips',
      label: 'Static IPs',
      kind: 'problem',
      title: 'Hard-coded IP lists break when containers churn',
      body: [
        'Your **Checkout** service calls **Inventory** using two IP addresses baked into a config file. Tonight autoscaling replaces `Inventory-2` (`10.0.1.15`) with a new pod at `10.0.1.88`.',
        'Checkout keeps hitting the dead IP and never discovers the new pod until an engineer redeploys config—dropping **50% of calls**.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'inv-2',
          patch: { state: 'down', badge: 'Terminated' },
        },
        {
          op: 'add-node',
          node: {
            id: 'inv-3',
            kind: 'server',
            at: { x: 12, y: 4 },
            label: 'Inventory-3',
            sublabel: '10.0.1.88',
            state: 'dim',
            badge: 'Unknown',
          },
        },
        {
          op: 'update-edge',
          id: 'co-inv2',
          patch: { state: 'broken', label: '10.0.1.15 dead' },
        },
        { op: 'packet', edge: 'co-inv1', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'co-inv2',
          kind: 'error',
          label: 'Timeout',
          wave: 0,
        },
        {
          op: 'set-metric',
          id: 'instances',
          value: '2 (1 lost)',
          tone: 'bad',
        },
        { op: 'set-metric', id: 'stale', value: '50%', tone: 'bad' },
      ],
    },
    {
      id: 'registry-heartbeats',
      label: 'Registry',
      kind: 'technique',
      title: 'A registry tracks live leases via heartbeats',
      body: [
        'Add a **Service Registry** (like Consul, etcd, or ZooKeeper): a live phonebook of healthy endpoints. When `Inventory-3` starts, it registers `inventory -> 10.0.1.88`.',
        'Each node sends a **heartbeat** every `10 s` to renew its _lease_ (an expiring registration). If a pod crashes, its `30 s` lease expires and the registry removes it.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Service Registry tracking live Inventory leases',
        },
        {
          type: 'removed',
          text: 'Dead Inventory-2 instance evicted on timeout',
        },
      ],
      ops: [
        { op: 'remove-node', id: 'inv-2' },
        {
          op: 'add-node',
          node: {
            id: 'registry',
            kind: 'database',
            at: { x: 6, y: 1 },
            label: 'Registry',
            sublabel: 'Lease = 30 s',
            state: 'focus',
          },
        },
        {
          op: 'update-node',
          id: 'inv-3',
          patch: { state: 'focus', badge: 'Registered' },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'inv1-reg',
            from: 'inv-1',
            to: 'registry',
            label: 'Heartbeat',
            style: 'dashed',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'inv3-reg',
            from: 'inv-3',
            to: 'registry',
            label: 'Register',
            style: 'dashed',
          },
        },
        {
          op: 'packet',
          edge: 'inv1-reg',
          kind: 'event',
          label: '10s beat',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'inv3-reg',
          kind: 'write',
          label: '10.0.1.88',
          wave: 0,
        },
        { op: 'set-metric', id: 'instances', value: '2 healthy', tone: 'good' },
        { op: 'set-metric', id: 'stale', value: '0%', tone: 'good' },
        { op: 'set-metric', id: 'ttl-lag', value: '30 s lease' },
      ],
      learns: [0, 1],
    },
    {
      id: 'client-side',
      label: 'Client-side',
      kind: 'technique',
      title: 'Client-side: caller queries and balances',
      body: [
        'In **client-side discovery**, `Checkout` embeds a discovery library that watches the registry, caches the healthy Inventory IPs, and picks one directly.',
        'Traffic travels straight from caller to target in **1 hop** with no middleman bottleneck, though every programming language you use must maintain that smart client SDK.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Checkout watches Registry and calls Inv-3 directly',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'checkout',
          patch: { sublabel: 'Discovery SDK', state: 'focus' },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'co-reg',
            from: 'checkout',
            to: 'registry',
            label: 'Watch list',
            style: 'dashed',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'co-inv3',
            from: 'checkout',
            to: 'inv-3',
            label: '10.0.1.88',
          },
        },
        {
          op: 'packet',
          edge: 'co-reg',
          kind: 'response',
          reverse: true,
          label: '2 live IPs',
          wave: 0,
        },
        { op: 'packet', edge: 'co-inv1', kind: 'request', wave: 1 },
        { op: 'packet', edge: 'co-inv3', kind: 'request', wave: 1 },
        { op: 'set-metric', id: 'hops', value: '1' },
      ],
      learns: [2],
    },
    {
      id: 'server-side',
      label: 'Server-side',
      kind: 'technique',
      title: 'Server-side: hide the registry behind an LB',
      body: [
        'In **server-side discovery**, `Checkout` calls one stable address on an internal **Load Balancer**. The load balancer watches the registry and forwards requests to healthy Inventory pods.',
        'Clients stay simple in any language—plain HTTP or gRPC—at the cost of **1 extra network hop** through the load balancer.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Internal Load Balancer routing between services',
        },
        { type: 'changed', text: 'Checkout simplified; hops rise from 1 to 2' },
      ],
      ops: [
        { op: 'remove-edge', id: 'co-reg' },
        { op: 'remove-edge', id: 'co-inv1' },
        { op: 'remove-edge', id: 'co-inv3' },
        {
          op: 'update-node',
          id: 'checkout',
          patch: { sublabel: 'Plain HTTP client', state: 'normal' },
        },
        {
          op: 'add-node',
          node: {
            id: 'lb',
            kind: 'load-balancer',
            at: { x: 6, y: 4 },
            label: 'Internal LB',
            sublabel: 'Queries registry',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'co-lb',
            from: 'checkout',
            to: 'lb',
            label: 'http://inv',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'lb-reg',
            from: 'lb',
            to: 'registry',
            label: 'Sync',
            style: 'dashed',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'lb-inv1', from: 'lb', to: 'inv-1' },
        },
        {
          op: 'add-edge',
          edge: { id: 'lb-inv3', from: 'lb', to: 'inv-3' },
        },
        { op: 'packet', edge: 'co-lb', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'lb-inv3', kind: 'request', wave: 1 },
        { op: 'set-metric', id: 'hops', value: '2' },
      ],
      learns: [2],
    },
    {
      id: 'dns-discovery',
      label: 'DNS caching',
      kind: 'case',
      title: 'DNS discovery fails slowly when TTLs go stale',
      body: [
        'Platforms like Kubernetes offer **DNS-based discovery**: `inventory.internal` resolves straight to healthy pod IPs, with zero client SDKs needed.',
        'The catch appears when `Inventory-3` crashes: callers and OS resolvers cache DNS answers for the **TTL** (`60 s`), hammering a dead IP until the cache expires.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Many runtimes cache DNS forever by default; never rely on DNS TTL alone for sub-second failover.',
        },
      ],
      changes: [
        {
          type: 'changed',
          text: 'Switched internal LB for DNS lookup (60 s TTL)',
        },
      ],
      ops: [
        { op: 'remove-node', id: 'lb' },
        {
          op: 'add-node',
          node: {
            id: 'dns',
            kind: 'dns',
            at: { x: 6, y: 4 },
            label: 'Internal DNS',
            sublabel: 'TTL = 60 s',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'co-dns',
            from: 'checkout',
            to: 'dns',
            label: 'A record?',
            style: 'dashed',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'dns-reg',
            from: 'dns',
            to: 'registry',
            label: 'Backend',
            style: 'dashed',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'co-inv3',
            from: 'checkout',
            to: 'inv-3',
            state: 'broken',
            label: 'Cached 60s',
          },
        },
        {
          op: 'update-node',
          id: 'inv-3',
          patch: { state: 'down', badge: 'Crashed' },
        },
        { op: 'packet', edge: 'co-dns', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'co-inv3',
          kind: 'error',
          label: 'Dead IP hit',
          wave: 1,
        },
        { op: 'set-metric', id: 'stale', value: 'Up to 60 s', tone: 'bad' },
        { op: 'set-metric', id: 'ttl-lag', value: '60 s TTL', tone: 'bad' },
        { op: 'set-metric', id: 'hops', value: '1' },
      ],
      learns: [3],
    },
    {
      id: 'stale-registry-watchout',
      label: 'Stale reads',
      kind: 'watch-out',
      title: 'Even registries lag—callers still need timeouts',
      body: [
        'Even with a push-based registry, a node can freeze for `30 s` before its heartbeat lease expires, or a cache update can arrive late.',
        'Treat every discovered IP as a **best-effort hint**, never a guarantee. Pair discovery with short connect timeouts and fast retries to another healthy pod.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Discovery is eventually consistent: fail fast on connect timeout and retry the next endpoint.',
        },
      ],
      ops: [
        { op: 'remove-node', id: 'dns' },
        {
          op: 'update-node',
          id: 'registry',
          patch: { state: 'hot', badge: '30 s lease lag' },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'co-inv1',
            from: 'checkout',
            to: 'inv-1',
            label: 'Retry OK',
          },
        },
        {
          op: 'packet',
          edge: 'co-inv3',
          kind: 'error',
          label: '100ms timeout',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'co-inv1',
          kind: 'request',
          label: 'Retry wins',
          wave: 1,
        },
        {
          op: 'set-metric',
          id: 'stale',
          value: '<1% (retried)',
          tone: 'normal',
        },
      ],
    },
    {
      id: 'sidecar-mesh',
      label: 'Sidecar mesh',
      kind: 'technique',
      title: 'Sidecar proxies move routing out of app code',
      body: [
        'In a **service mesh** (like Istio or Linkerd), a lightweight **sidecar proxy** runs beside each app container. `Checkout` simply calls `localhost`.',
        'The sidecar streams updates from the registry, load-balances across healthy Inventory pods, ejects failing nodes immediately, and adds **mTLS** encryption—no SDK inside your app, though you manage a proxy per pod.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'A sidecar mesh gives client-side routing smarts to any language without touching application code.',
        },
      ],
      changes: [
        {
          type: 'added',
          text: 'Sidecar proxy handling xDS discovery and mTLS',
        },
        {
          type: 'changed',
          text: 'Stale window drops below 1 s via push stream',
        },
      ],
      ops: [
        { op: 'remove-edge', id: 'co-inv3' },
        { op: 'remove-edge', id: 'co-inv1' },
        {
          op: 'update-node',
          id: 'inv-3',
          patch: { state: 'normal', badge: 'Healthy' },
        },
        {
          op: 'add-node',
          node: {
            id: 'sidecar-a',
            kind: 'gateway',
            at: { x: 4, y: 4 },
            label: 'Sidecar proxy',
            sublabel: 'Beside Checkout',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'co-sidecar',
            from: 'checkout',
            to: 'sidecar-a',
            label: 'localhost',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'sidecar-reg',
            from: 'sidecar-a',
            to: 'registry',
            label: 'xDS watch',
            style: 'dashed',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'sidecar-inv1',
            from: 'sidecar-a',
            to: 'inv-1',
            label: 'mTLS',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'sidecar-inv3',
            from: 'sidecar-a',
            to: 'inv-3',
            label: 'mTLS',
          },
        },
        { op: 'packet', edge: 'co-sidecar', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'sidecar-inv1', kind: 'request', wave: 1 },
        { op: 'set-metric', id: 'stale', value: '0% (ejected)', tone: 'good' },
        { op: 'set-metric', id: 'ttl-lag', value: '< 1 s push', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Discover peers dynamically, never trust blindly',
      body: [
        'Ephemeral containers make static IPs obsolete. Use a heartbeat registry—via client SDKs, internal load balancers, DNS, or sidecar meshes—and always guard calls with fast timeouts and retries.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'registry',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'sidecar-a',
          patch: { state: 'normal' },
        },
        {
          op: 'update-node',
          id: 'inv-3',
          patch: { badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'discovery-table',
            anchor: { at: { x: 4, y: 8 } },
            text: 'Service discovery styles',
            tone: 'info',
            icon: 'route',
            rows: [
              ['Client-side', '1 hop · SDK per language'],
              ['Server-side', '2 hops · simple callers'],
              ['DNS', 'Universal · TTL staleness'],
              ['Sidecar mesh', 'Smart + mTLS · proxy ops'],
            ],
          },
        },
        { op: 'set-metric', id: 'hops', value: '1 + proxy' },
      ],
      takeaways: [
        'Never hard-code instance IPs in autoscaling fleets; track live leases in a heartbeat registry',
        'Client-side discovery saves a network hop but requires an SDK in every language; server-side hides it behind an LB',
        'DNS discovery needs zero app changes, but cached TTLs route calls to dead instances until expiry',
        'Sidecar meshes centralize discovery, retries, and mTLS beside the app; callers still need short timeouts',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-discovery-compare',
      kind: 'choice',
      prompt:
        'Your backend mixes Go, Python, and Java services and teams want simple callers with zero discovery SDKs. Which pattern fits cleanly?',
      options: [
        'Server-side discovery behind an internal load balancer (or sidecar proxy)',
        'Hard-coded IP lists updated via weekly deploys',
        'Client-side discovery requiring every team to build a custom registry SDK',
      ],
      answer: 0,
      explain:
        'Server-side discovery (and sidecar meshes) keeps discovery and balancing logic out of application code so callers just make standard requests.',
      step: 'server-side',
    },
    {
      id: 'choice-dns-staleness',
      kind: 'choice',
      prompt:
        'An autoscaler replaces a failing pod, yet callers using DNS discovery keep failing against the dead pod IP for 45 seconds. Why?',
      options: [
        'Resolvers and client runtimes cache the old DNS A record until its TTL expires',
        'DNS servers cannot store private RFC 1918 IP addresses',
        'TCP handshakes ignore IP changes during an active deploy',
      ],
      answer: 0,
      explain:
        'DNS responses are cached for their TTL (and sometimes longer by language runtimes), delaying awareness of newly replaced pods.',
      step: 'dns-discovery',
    },
    {
      id: 'numeric-lease-expiry',
      kind: 'numeric',
      prompt:
        'Instances send heartbeats every 10 seconds to renew a 35-second registry lease. If an instance crashes immediately after a heartbeat, how many seconds pass before its lease expires?',
      unit: 'seconds',
      answer: 35,
      tolerance: 0.1,
      explain:
        'Because the instance just renewed for 35 seconds right before crashing, the registry keeps the entry until the full 35-second lease expires.',
      step: 'registry-heartbeats',
    },
    {
      id: 'order-discovery-lifecycle',
      kind: 'order',
      prompt:
        'Order the lifecycle of an ephemeral instance inside a heartbeat-based service registry.',
      items: [
        'New container starts and registers its IP with a lease TTL',
        'Container sends periodic heartbeats to keep its lease alive',
        'Caller or proxy fetches healthy endpoints from the registry',
        'Container stops heartbeating and the registry evicts its entry on lease expiry',
      ],
      explain:
        'Registration creates the lease, heartbeats extend it while healthy, callers route to live entries, and missed heartbeats trigger eviction.',
      step: 'registry-heartbeats',
    },
  ],
  cards: [
    {
      front: 'How do heartbeats and leases keep a service registry accurate?',
      back: 'Instances register their IP on startup with a short TTL lease and renew via periodic heartbeats; if an instance crashes and misses renewals, the registry automatically evicts it.',
    },
    {
      front: 'Compare client-side vs server-side service discovery.',
      back: 'Client-side: caller queries the registry and balances directly (1 hop, requires SDK per language). Server-side: caller hits a load balancer that queries the registry (simple clients, 1 extra hop).',
    },
    {
      front: 'What is the main risk of DNS-based service discovery?',
      back: 'Client OSes and runtimes cache DNS records up to (or past) their TTL, sending requests to terminated instance IPs until caches expire.',
    },
    {
      front:
        'What does a sidecar service mesh add, and what must callers still do?',
      back: 'A sidecar proxy beside every pod handles registry watching, load balancing, retries, and mTLS outside app code. Callers still need short timeouts because registries lag slightly behind crashes.',
    },
  ],
} satisfies Lesson;
