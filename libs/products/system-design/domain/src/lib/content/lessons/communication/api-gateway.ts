import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 04.02: API Gateways (`api-gateway`).
 * Scenario: Ten services, one public entry (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'api-gateway',
  learn: [
    'How an API gateway routes paths to internal services',
    'How TLS termination simplifies backend services',
    'Why auth and rate limiting belong at the edge',
    'How a BFF aggregates calls to cut mobile round trips',
    'How to avoid turning the gateway into a bottleneck',
  ],
  scene: {
    nodes: [
      {
        id: 'phone',
        kind: 'phone',
        at: { x: 0, y: 2 },
        label: 'Mobile app',
        sublabel: '3 public hosts',
      },
      {
        id: 'web',
        kind: 'client',
        at: { x: 0, y: 7 },
        label: 'Web app',
        sublabel: '3 public hosts',
      },
      {
        id: 'users-svc',
        kind: 'service',
        at: { x: 11, y: 2 },
        label: 'Users svc',
        sublabel: '/users',
      },
      {
        id: 'orders-svc',
        kind: 'service',
        at: { x: 11, y: 5 },
        label: 'Orders svc',
        sublabel: '/orders',
      },
      {
        id: 'catalog-svc',
        kind: 'service',
        at: { x: 11, y: 8 },
        label: 'Catalog svc',
        sublabel: '/catalog',
      },
    ],
    edges: [
      {
        id: 'phone-users',
        from: 'phone',
        to: 'users-svc',
        label: 'users.shop.io',
      },
      {
        id: 'phone-orders',
        from: 'phone',
        to: 'orders-svc',
        label: 'orders.shop.io',
      },
      {
        id: 'web-catalog',
        from: 'web',
        to: 'catalog-svc',
        label: 'catalog.shop.io',
      },
    ],
    zones: [
      {
        id: 'services-zone',
        from: { x: 7, y: 1 },
        to: { x: 13, y: 9 },
        hue: 'blue',
        label: '10 internal services',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'entry', label: 'Public hosts', icon: 'link', value: '10' },
    { id: 'edge-checks', label: 'Edge policy', icon: 'shield', value: 'None' },
    { id: 'trips', label: 'Round trips', icon: 'route', value: '3' },
    { id: 'edge-p99', label: 'Edge p99', icon: 'timer', value: '—' },
  ],
  steps: [
    {
      id: 'ten-doors',
      label: 'Ten doors',
      kind: 'problem',
      title: 'Ten services, ten public doors to secure',
      body: [
        'Your storefront has split into **ten microservices**. Today clients call `users.shop.io`, `orders.shop.io`, and `catalog.shop.io` directly.',
        'Every team duplicates auth checks, rate limits, and TLS certificates—and mobile spends three separate handshakes and round trips just to paint one home screen.',
      ],
      ops: [
        { op: 'update-node', id: 'phone', patch: { state: 'focus' } },
        { op: 'update-node', id: 'web', patch: { state: 'focus' } },
        { op: 'packet', edge: 'phone-users', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'phone-orders', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'web-catalog', kind: 'request', wave: 0 },
      ],
    },
    {
      id: 'edge-routing',
      label: 'Edge routing',
      kind: 'technique',
      title: 'Expose one public host with L7 path routing',
      body: [
        'Place a single **API Gateway** at `api.shop.io` in front of your services. Clients now talk to **one hostname**.',
        'Using _L7 routing_ (inspecting URL paths and HTTP headers), the gateway forwards `/users/*` to Users, `/orders/*` to Orders, and `/catalog/*` to Catalog while keeping internal topology hidden.',
      ],
      changes: [
        { type: 'added', text: 'API Gateway as the single public entry point' },
        {
          type: 'changed',
          text: 'Clients route via paths instead of 10 hosts',
        },
      ],
      ops: [
        { op: 'remove-edge', id: 'phone-users' },
        { op: 'remove-edge', id: 'phone-orders' },
        { op: 'remove-edge', id: 'web-catalog' },
        {
          op: 'add-node',
          node: {
            id: 'gateway',
            kind: 'gateway',
            at: { x: 5, y: 3 },
            label: 'API Gateway',
            sublabel: 'api.shop.io',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'phone-gw',
            from: 'phone',
            to: 'gateway',
            label: 'HTTPS',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'web-gw', from: 'web', to: 'gateway', label: 'HTTPS' },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'gw-users',
            from: 'gateway',
            to: 'users-svc',
            label: '/users/*',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'gw-orders',
            from: 'gateway',
            to: 'orders-svc',
            label: '/orders/*',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'gw-catalog',
            from: 'gateway',
            to: 'catalog-svc',
            label: '/catalog/*',
          },
        },
        {
          op: 'packet',
          edge: 'phone-gw',
          kind: 'request',
          label: '/orders',
          wave: 0,
        },
        { op: 'packet', edge: 'gw-orders', kind: 'request', wave: 1 },
        { op: 'set-metric', id: 'entry', value: '1', tone: 'good' },
      ],
      learns: [0],
    },
    {
      id: 'tls-termination',
      label: 'TLS edge',
      kind: 'technique',
      title: 'Terminate TLS once at the front door',
      body: [
        'Clients open one **TLS 1.3** encrypted session with the gateway, which manages your public certificates.',
        'Inside the private network, the gateway reuses warm **keep-alive** connections (or internal mTLS) to backend services—renewing certs in one place and shedding handshake CPU across ten teams.',
      ],
      changes: [
        { type: 'changed', text: 'Public TLS 1.3 terminated at the gateway' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'phone',
          patch: { state: 'normal', sublabel: '1 host' },
        },
        {
          op: 'update-node',
          id: 'web',
          patch: { state: 'normal', sublabel: '1 host' },
        },
        {
          op: 'update-node',
          id: 'gateway',
          patch: { badge: 'TLS 1.3' },
        },
        {
          op: 'packet',
          edge: 'phone-gw',
          kind: 'handshake',
          label: 'TLS 1.3',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'gw-users',
          kind: 'request',
          label: 'Keep-alive',
          wave: 1,
        },
        { op: 'set-metric', id: 'edge-p99', value: '12 ms', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'auth-ratelimit',
      label: 'Auth & limits',
      kind: 'technique',
      title: 'Verify tokens and enforce limits at the edge',
      body: [
        'Move cross-cutting policy out of ten codebases into the gateway: verify the signed **JWT** (_JSON Web Token_), inject `X-User-Id`, and check per-key **rate limits**.',
        'Bad credentials and scraper floods are dropped at the door with `401` or `429 Too Many Requests` before touching backend databases.',
      ],
      changes: [
        {
          type: 'changed',
          text: 'JWT auth and rate limits enforced at the edge',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'gateway',
          patch: { badge: 'JWT + 100/m' },
        },
        {
          op: 'packet',
          edge: 'web-gw',
          kind: 'request',
          label: 'Burst flood',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'web-gw',
          kind: 'error',
          reverse: true,
          label: '401 / 429',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'phone-gw',
          kind: 'request',
          label: 'Valid JWT',
          wave: 0,
        },
        {
          op: 'set-metric',
          id: 'edge-checks',
          value: 'JWT + Limit',
          tone: 'good',
        },
      ],
      learns: [2],
    },
    {
      id: 'bff-aggregation',
      label: 'BFF fan-out',
      kind: 'technique',
      title: 'Aggregate screen data in a dedicated BFF',
      body: [
        'Even behind one host, mobile still sends 3 requests over slow cellular radio for profile, orders, and catalog.',
        'Route `/mobile/home` to a **BFF** (_Backend for Frontend_) inside your VPC. It fans out across the **1 ms** LAN and stitches one slim reply in **1 client round trip**.',
      ],
      changes: [
        { type: 'added', text: 'Mobile BFF inside the service zone' },
        { type: 'changed', text: 'Client round trips drop from 3 to 1' },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'mobile-bff',
            kind: 'server',
            at: { x: 8, y: 4 },
            label: 'Mobile BFF',
            sublabel: 'Fan-out',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'gw-bff',
            from: 'gateway',
            to: 'mobile-bff',
            label: '/mobile/*',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'bff-users', from: 'mobile-bff', to: 'users-svc' },
        },
        {
          op: 'add-edge',
          edge: { id: 'bff-orders', from: 'mobile-bff', to: 'orders-svc' },
        },
        {
          op: 'add-edge',
          edge: { id: 'bff-catalog', from: 'mobile-bff', to: 'catalog-svc' },
        },
        {
          op: 'packet',
          edge: 'phone-gw',
          kind: 'request',
          label: 'GET /home',
          wave: 0,
        },
        { op: 'packet', edge: 'gw-bff', kind: 'request', wave: 1 },
        { op: 'packet', edge: 'bff-users', kind: 'request', wave: 2 },
        { op: 'packet', edge: 'bff-orders', kind: 'request', wave: 2 },
        { op: 'packet', edge: 'bff-catalog', kind: 'request', wave: 2 },
        { op: 'set-metric', id: 'trips', value: '1', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'gateway-bottleneck',
      label: 'Edge overload',
      kind: 'case',
      title: 'A fat, single gateway melts under flash load',
      body: [
        'During a **25,000 RPS** flash sale, teams have stuffed custom SQL checks and heavy XML transforms right inside the single **API Gateway**.',
        'Every request flows through that one tier: CPU hits **98%**, `edge-p99` spikes to **420 ms**, and healthy backend services sit idle behind a choked door.',
      ],
      ops: [
        { op: 'update-node', id: 'mobile-bff', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'gateway',
          patch: { state: 'hot', load: 0.98, badge: '98% CPU' },
        },
        {
          op: 'packet',
          edge: 'phone-gw',
          kind: 'request',
          count: 4,
          label: '25k RPS',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'web-gw',
          kind: 'error',
          reverse: true,
          count: 2,
          label: '504 Timeout',
          wave: 1,
        },
        { op: 'set-metric', id: 'edge-p99', value: '420 ms', tone: 'bad' },
      ],
    },
    {
      id: 'keep-it-lean',
      label: 'Scale & lean',
      kind: 'watch-out',
      title: 'Keep the gateway stateless and free of logic',
      body: [
        'Never turn the gateway into a **distributed monolith**. Keep domain logic inside BFFs or services, and run stateless **gateway replicas** behind a fast **L4 load balancer**.',
        'Add strict upstream timeouts and circuit breakers so one slow service cannot exhaust gateway connections for healthy routes.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Keep the gateway limited to routing, TLS, auth, and rate limits—never run database queries or business workflows inside edge plugins.',
        },
      ],
      changes: [
        { type: 'added', text: 'L4 load balancer and Gateway B replica' },
        { type: 'changed', text: 'Edge p99 recovers to 14 ms' },
      ],
      ops: [
        { op: 'remove-edge', id: 'phone-gw' },
        { op: 'remove-edge', id: 'web-gw' },
        {
          op: 'add-node',
          node: {
            id: 'edge-lb',
            kind: 'load-balancer',
            at: { x: 2, y: 4 },
            label: 'L4 Load balancer',
            sublabel: 'Health checks',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'gateway-b',
            kind: 'gateway',
            at: { x: 5, y: 7 },
            label: 'Gateway B',
            sublabel: 'Stateless replica',
            state: 'focus',
          },
        },
        {
          op: 'update-node',
          id: 'gateway',
          patch: {
            state: 'normal',
            load: 0.45,
            label: 'Gateway A',
            badge: 'Lean edge',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'phone-lb', from: 'phone', to: 'edge-lb' },
        },
        {
          op: 'add-edge',
          edge: { id: 'web-lb', from: 'web', to: 'edge-lb' },
        },
        {
          op: 'add-edge',
          edge: { id: 'lb-gwa', from: 'edge-lb', to: 'gateway' },
        },
        {
          op: 'add-edge',
          edge: { id: 'lb-gwb', from: 'edge-lb', to: 'gateway-b' },
        },
        {
          op: 'add-edge',
          edge: { id: 'gwb-bff', from: 'gateway-b', to: 'mobile-bff' },
        },
        { op: 'packet', edge: 'lb-gwa', kind: 'request', wave: 0 },
        { op: 'set-metric', id: 'edge-p99', value: '14 ms', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'One lean front door for many services',
      body: [
        'An API gateway centralises routing, TLS termination, auth, and rate limits at the edge—while BFFs handle per-client aggregation and horizontal replicas keep the front door fast.',
      ],
      ops: [
        { op: 'update-node', id: 'edge-lb', patch: { state: 'normal' } },
        { op: 'update-node', id: 'gateway-b', patch: { state: 'normal' } },
        { op: 'update-node', id: 'gateway', patch: { badge: null } },
        {
          op: 'add-note',
          note: {
            id: 'gateway-roles',
            anchor: { at: { x: 3, y: 1 } },
            text: 'Gateway checklist',
            tone: 'info',
            icon: 'shield',
            rows: [
              ['Edge', 'Routing, TLS, Auth, 429'],
              ['Aggregation', 'Separate BFF service'],
              ['Scaling', 'Stateless pool + L4 LB'],
            ],
          },
        },
      ],
      takeaways: [
        'Expose one public hostname and route paths at L7 to hide internal service topology',
        'Terminate public TLS and verify auth/rate limits once at the edge',
        'Use a separate BFF service to aggregate multiple backend calls into one mobile round trip',
        'Keep domain logic out of the gateway and scale stateless replicas behind an L4 LB',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-edge-rejection',
      kind: 'choice',
      prompt:
        'Why is enforcing JWT validation and rate limits at the API gateway better than inside each of ten services?',
      options: [
        'Invalid or abusive traffic is rejected with 401/429 before reaching backend compute or databases',
        'JWT tokens are automatically encrypted only when read by an API gateway',
        'Gateways remove the need for backend services to validate any user permissions',
      ],
      answer: 0,
      explain:
        'Rejecting bad tokens and rate-limit floods at the edge protects all downstream services and eliminates duplicated auth boilerplate.',
      step: 'auth-ratelimit',
    },
    {
      id: 'choice-bff-vs-gateway',
      kind: 'choice',
      prompt:
        'Mobile needs fields from Users, Orders, and Catalog on one screen. Where should complex response aggregation live so the gateway stays fast?',
      options: [
        'In a dedicated Mobile BFF service behind the gateway',
        'Inside custom database queries embedded in the edge gateway',
        'On the mobile client via three sequential public TLS handshakes',
      ],
      answer: 0,
      explain:
        'A Backend for Frontend (BFF) sits behind the gateway inside the low-latency VPC, keeping screen-specific logic out of the shared edge tier.',
      step: 'bff-aggregation',
    },
    {
      id: 'order-gateway-pipeline',
      kind: 'order',
      prompt:
        'Order the stages of an inbound request passing through an API gateway from client to internal service.',
      items: [
        'Terminate client TLS 1.3 connection',
        'Verify JWT signature and check rate limit',
        'Match URL path via L7 routing rules',
        'Forward over warm keep-alive pool to target service',
      ],
      explain:
        'TLS opens the encrypted channel first, security and rate limits reject bad requests early, then L7 routing picks the upstream target.',
      step: 'keep-it-lean',
    },
  ],
  cards: [
    {
      front: 'What are the four core jobs of an API gateway?',
      back: 'L7 path/header routing, public TLS termination, authentication/JWT verification, and edge rate limiting.',
    },
    {
      front: 'What is a BFF (Backend for Frontend)?',
      back: 'A screen-tailored aggregation service behind the gateway that fans out over the fast LAN so clients make a single round trip.',
    },
    {
      front: 'How does TLS termination at the gateway help backend teams?',
      back: 'Public certificates are renewed in one place and backend services avoid public TLS handshake CPU overhead.',
    },
    {
      front:
        'How do you keep an API gateway from becoming a bottleneck or SPOF?',
      back: 'Run multiple stateless gateway replicas behind an L4 load balancer, enforce upstream timeouts, and keep business logic out of the gateway.',
    },
  ],
} satisfies Lesson;
