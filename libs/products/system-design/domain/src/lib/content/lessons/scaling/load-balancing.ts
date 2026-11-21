import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 02.02: Load Balancing (`load-balancing`).
 * Scenario: Three servers, one front door (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'load-balancing',
  learn: [
    'How round robin and weighted rotation split even traffic',
    'Why least connections beats round robin for uneven work',
    'How active health checks route around crashed servers',
    'The trade-offs between L4 transport and L7 HTTP balancing',
    'Why sticky sessions skew load and LBs need redundancy',
  ],
  scene: {
    nodes: [
      {
        id: 'users',
        kind: 'client',
        at: { x: 1, y: 5 },
        label: 'Shoppers',
        sublabel: '1,200 RPS',
      },
      {
        id: 'lb',
        kind: 'load-balancer',
        at: { x: 5, y: 5 },
        label: 'Load balancer',
        sublabel: 'Front door',
      },
      {
        id: 'app-1',
        kind: 'server',
        at: { x: 10, y: 2 },
        label: 'App 1',
        sublabel: 'Web server',
      },
      {
        id: 'app-2',
        kind: 'server',
        at: { x: 10, y: 5 },
        label: 'App 2',
        sublabel: 'Web server',
      },
      {
        id: 'app-3',
        kind: 'server',
        at: { x: 10, y: 8 },
        label: 'App 3',
        sublabel: 'Web server',
      },
    ],
    edges: [
      { id: 'users-lb', from: 'users', to: 'lb', label: '1,200 RPS' },
      { id: 'lb-1', from: 'lb', to: 'app-1' },
      { id: 'lb-2', from: 'lb', to: 'app-2' },
      { id: 'lb-3', from: 'lb', to: 'app-3' },
    ],
    zones: [
      {
        id: 'pool-zone',
        from: { x: 8, y: 1 },
        to: { x: 12, y: 9 },
        hue: 'blue',
        label: 'App pool',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'rps', label: 'Pool RPS', icon: 'gauge', value: '1,200' },
    { id: 'balance', label: 'Balance', icon: 'chart', value: 'Skewed' },
    { id: 'l4-l7', label: 'Mode', icon: 'route', value: '—' },
    { id: 'avail', label: 'Entry', icon: 'shield', value: 'Single LB' },
  ],
  steps: [
    {
      id: 'front-door',
      label: 'Front door',
      kind: 'problem',
      title: 'Three servers, one public front door',
      body: [
        'Your storefront runs on three identical servers, yet browsers connect to a single domain name. If DNS hands out only `App 1`’s address—or clients cache it—`App 1` melts while `App 2` and `App 3` sit idle.',
        'A **load balancer** stands at the front door, terminating connections and choosing which backend gets each request.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-1',
          patch: { state: 'hot', load: 0.94, badge: 'overloaded' },
        },
        {
          op: 'update-node',
          id: 'app-2',
          patch: { state: 'dim', load: 0.05 },
        },
        {
          op: 'update-node',
          id: 'app-3',
          patch: { state: 'dim', load: 0.05 },
        },
        { op: 'packet', edge: 'users-lb', kind: 'request', count: 3, wave: 0 },
        { op: 'packet', edge: 'lb-1', kind: 'request', count: 3, wave: 1 },
      ],
    },
    {
      id: 'round-robin',
      label: 'Round robin',
      kind: 'technique',
      title: 'Rotate evenly with round robin',
      body: [
        '**Round robin** walks the server list in a loop: `App 1`, `App 2`, `App 3`, then back to `App 1`. When servers match in size and requests finish quickly, each handles **400 RPS**.',
        'If `App 3` is twice as big as the others, **weighted round robin** assigns it double the turns (`2 : 1 : 1`).',
      ],
      changes: [
        { type: 'changed', text: 'Traffic spread evenly across all 3 servers' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'lb',
          patch: { sublabel: 'Round robin', state: 'focus' },
        },
        {
          op: 'update-node',
          id: 'app-1',
          patch: { state: 'normal', load: 0.45, badge: null },
        },
        {
          op: 'update-node',
          id: 'app-2',
          patch: { state: 'normal', load: 0.45 },
        },
        {
          op: 'update-node',
          id: 'app-3',
          patch: { state: 'normal', load: 0.45 },
        },
        { op: 'packet', edge: 'lb-1', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'lb-2', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'lb-3', kind: 'request', wave: 0 },
        {
          op: 'set-metric',
          id: 'balance',
          value: 'Even (400 ea)',
          tone: 'good',
        },
      ],
      learns: [0],
    },
    {
      id: 'least-connections',
      label: 'Least conns',
      kind: 'case',
      title: 'Uneven requests fool round robin',
      body: [
        'Now some shoppers upload 4K product photos taking **8 seconds**, while others fetch tiny JSON taking **10 ms**. Round robin still sends every third request to `App 1` even as slow uploads pile up open sockets on it.',
        '**Least connections** picks whichever backend currently holds the fewest active connections, naturally steering new requests away from bogged-down servers.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Round robin counts requests sent; least connections measures work still running.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'lb',
          patch: { sublabel: 'Least connections' },
        },
        {
          op: 'update-node',
          id: 'app-1',
          patch: { state: 'hot', load: 0.88, badge: '48 conns' },
        },
        {
          op: 'update-node',
          id: 'app-2',
          patch: { state: 'focus', load: 0.35, badge: '12 conns' },
        },
        {
          op: 'update-node',
          id: 'app-3',
          patch: { state: 'focus', load: 0.35, badge: '12 conns' },
        },
        { op: 'packet', edge: 'lb-2', kind: 'request', count: 2, wave: 0 },
        { op: 'packet', edge: 'lb-3', kind: 'request', count: 2, wave: 0 },
        {
          op: 'set-metric',
          id: 'balance',
          value: 'By open conns',
          tone: 'good',
        },
      ],
      learns: [1],
    },
    {
      id: 'health-checks',
      label: 'Health checks',
      kind: 'technique',
      title: 'Probe /health and pull dead servers fast',
      body: [
        '`App 3` crashes after running out of memory. Left in the pool, one-third of all shopper requests fail.',
        'The load balancer runs active **health checks** (`GET /health` every `5 s`). After three missed probes, it drains `App 3` from rotation so `App 1` and `App 2` keep serving `1,200 RPS` cleanly.',
      ],
      changes: [
        {
          type: 'changed',
          text: 'App 3 pulled from rotation after failed probes',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-3',
          patch: { state: 'down', load: null, badge: '3 fails' },
        },
        { op: 'update-edge', id: 'lb-3', patch: { state: 'broken' } },
        {
          op: 'add-note',
          note: {
            id: 'hc-note',
            anchor: { edge: 'lb-3' },
            text: 'Unhealthy → pulled',
            tone: 'bad',
            icon: 'warning',
          },
        },
        {
          op: 'update-node',
          id: 'app-1',
          patch: { state: 'normal', load: 0.65, badge: null },
        },
        {
          op: 'update-node',
          id: 'app-2',
          patch: { state: 'normal', load: 0.65, badge: null },
        },
        { op: 'packet', edge: 'lb-1', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'lb-2', kind: 'request', wave: 0 },
        { op: 'set-metric', id: 'balance', value: '2 healthy' },
      ],
      learns: [2],
    },
    {
      id: 'l4-vs-l7',
      label: 'L4 vs L7',
      kind: 'technique',
      title: 'L4 routes packets; L7 inspects HTTP',
      body: [
        '**Layer 4 (L4)** balancers look only at IP addresses and TCP ports—forwarding raw packets at huge throughput without decrypting traffic.',
        '**Layer 7 (L7)** balancers terminate TLS and inspect HTTP URLs, headers, and cookies, letting them route `/api/*` differently from `/images/*` or add rate limits at the cost of extra CPU.',
      ],
      ops: [
        { op: 'remove-note', id: 'hc-note' },
        {
          op: 'update-node',
          id: 'app-3',
          patch: { state: 'normal', load: 0.45, badge: null },
        },
        { op: 'update-edge', id: 'lb-3', patch: { state: 'normal' } },
        { op: 'update-node', id: 'app-1', patch: { load: 0.45 } },
        { op: 'update-node', id: 'app-2', patch: { load: 0.45 } },
        {
          op: 'update-node',
          id: 'lb',
          patch: { sublabel: 'L7 HTTP + TLS', state: 'focus' },
        },
        {
          op: 'add-note',
          note: {
            id: 'l7-note',
            anchor: { node: 'lb' },
            text: 'Inspects URL & cookie',
            tone: 'info',
            icon: 'route',
          },
        },
        { op: 'set-metric', id: 'l4-l7', value: 'L7 HTTP', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'sticky-sessions',
      label: 'Sticky trap',
      kind: 'watch-out',
      title: 'Sticky sessions recreate hot spots',
      body: [
        'Turning on **sticky sessions** (pinning a user’s IP or cookie to one server) sounds handy when servers cache local state, until an office shares one public IP—sending 500 shoppers straight to `App 1`.',
        'Worse, if `App 1` restarts, pinned users lose their state anyway. Keep backends stateless so any server can answer.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Hash-based stickiness lets one corporate NAT or hot key overload a single backend.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'lb',
          patch: { state: 'normal', sublabel: 'IP hash sticky' },
        },
        {
          op: 'update-node',
          id: 'app-1',
          patch: { state: 'hot', load: 0.94, badge: 'NAT skew' },
        },
        {
          op: 'update-note',
          id: 'l7-note',
          patch: { text: 'Hash → App 1', tone: 'bad' },
        },
        { op: 'packet', edge: 'lb-1', kind: 'request', count: 3, wave: 0 },
        { op: 'set-metric', id: 'balance', value: 'Skewed', tone: 'bad' },
      ],
      learns: [4],
    },
    {
      id: 'redundant-lbs',
      label: 'Redundant LBs',
      kind: 'technique',
      title: 'Run redundant balancers so front doors stay up',
      body: [
        'Putting all traffic through **one** load balancer trades server SPOFs for a front-door SPOF!',
        'Deploy an **active-active** (or active-passive) pair behind DNS or Anycast virtual IPs. If `LB 1` fails or gets upgraded, `LB 2` handles the entire pool without dropping traffic.',
      ],
      changes: [
        { type: 'added', text: 'Second active load balancer (LB 2)' },
        { type: 'changed', text: 'Front-door SPOF eliminated' },
      ],
      ops: [
        { op: 'remove-note', id: 'l7-note' },
        {
          op: 'update-node',
          id: 'lb',
          patch: {
            at: { x: 5, y: 3 },
            label: 'LB 1',
            sublabel: 'Active L7',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'lb-2',
            kind: 'load-balancer',
            at: { x: 5, y: 7 },
            label: 'LB 2',
            sublabel: 'Active L7',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'users-lb2',
            from: 'users',
            to: 'lb-2',
            label: 'DNS/VIP',
          },
        },
        { op: 'add-edge', edge: { id: 'lb2-1', from: 'lb-2', to: 'app-1' } },
        { op: 'add-edge', edge: { id: 'lb2-2', from: 'lb-2', to: 'app-2' } },
        { op: 'add-edge', edge: { id: 'lb2-3', from: 'lb-2', to: 'app-3' } },
        {
          op: 'update-node',
          id: 'app-1',
          patch: { state: 'normal', load: 0.45, badge: null },
        },
        {
          op: 'set-metric',
          id: 'avail',
          value: 'Active-active LBs',
          tone: 'good',
        },
        {
          op: 'set-metric',
          id: 'balance',
          value: 'Even (400 ea)',
          tone: 'good',
        },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Pick algorithms, probe health, add redundancy',
      body: [
        'Load balancers turn a cluster of independent servers into one reliable entry point. Pick the routing rule for your workload, automate health checks, avoid sticky sessions where possible, and run at least two balancers.',
      ],
      ops: [
        { op: 'update-node', id: 'lb', patch: { state: 'normal' } },
        { op: 'update-node', id: 'lb-2', patch: { state: 'normal' } },
        {
          op: 'add-note',
          note: {
            id: 'lb-summary',
            anchor: { at: { x: 2, y: 1 } },
            text: 'Balancing cheatsheet',
            tone: 'info',
            icon: 'route',
            rows: [
              ['Round robin', 'Short even reqs'],
              ['Least conns', 'Slow / uneven work'],
              ['L4 vs L7', 'TCP vs HTTP path'],
            ],
            total: ['Entry rule', '2+ active LBs'],
          },
        },
      ],
      takeaways: [
        'Round robin fits uniform requests; least connections adapts when request durations vary',
        'Active health checks automatically pull failing servers out of rotation',
        'L4 balances raw TCP/UDP fast; L7 terminates TLS and routes on HTTP paths or headers',
        'Avoid sticky sessions where possible, and deploy redundant load balancers',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-least-connections',
      kind: 'choice',
      prompt:
        'Your API serves both 5 ms health pings and 10-second PDF exports on identical servers. Which balancing algorithm prevents exports from piling up on one unlucky host?',
      options: ['Least connections', 'Plain round robin', 'Client IP hashing'],
      answer: 0,
      explain:
        'Least connections tracks active open requests and steers new traffic toward servers with fewer jobs still running.',
      step: 'least-connections',
    },
    {
      id: 'choice-l4-vs-l7',
      kind: 'choice',
      prompt:
        'You need one balancer to send `/api/*` to the API pool and `/media/*` to an object-storage proxy based on URL path. Which layer must the balancer operate at?',
      options: [
        'Layer 7 (L7 application load balancer)',
        'Layer 4 (L4 transport load balancer)',
        'Layer 2 MAC switching only',
      ],
      answer: 0,
      explain:
        'Only an L7 balancer decrypts TLS and parses HTTP URLs and headers; L4 sees only IP and TCP port.',
      step: 'l4-vs-l7',
    },
    {
      id: 'order-health-failover',
      kind: 'order',
      prompt:
        'Put the steps of an automated load-balancer health-check failover in order.',
      items: [
        'App 3 crashes and stops answering GET /health',
        'Load balancer detects consecutive missed health probes',
        'Load balancer removes App 3 from the active target pool',
        'Incoming traffic routes cleanly to App 1 and App 2',
      ],
      explain:
        'Probes detect failure after a threshold of misses, drain the bad target from the pool, and keep user requests flowing to healthy servers.',
      step: 'health-checks',
    },
    {
      id: 'numeric-pool-capacity',
      kind: 'numeric',
      prompt:
        'Three servers behind a load balancer handle 1,800 RPS total under round robin. If one server fails its health check and leaves the pool, how many RPS does each remaining server receive?',
      unit: 'RPS',
      answer: 900,
      tolerance: 0.05,
      explain:
        '1,800 RPS split evenly across the 2 remaining healthy servers gives 900 RPS each.',
      step: 'health-checks',
    },
  ],
  cards: [
    {
      front: 'When should you prefer least connections over round robin?',
      back: 'When request durations vary widely (e.g. file uploads, slow queries, WebSockets), so slow work does not accumulate unfairly on one backend.',
    },
    {
      front:
        'What is the main difference between an L4 and an L7 load balancer?',
      back: 'L4 routes on IP and TCP/UDP port without reading payloads; L7 terminates TLS and routes using HTTP URLs, headers, and cookies.',
    },
    {
      front:
        'Why are sticky sessions usually considered an anti-pattern at scale?',
      back: 'They create uneven hot spots (e.g. shared corporate NAT IPs) and drop user state whenever the pinned server restarts or scales in.',
    },
    {
      front:
        'How do you prevent the load balancer itself from becoming a single point of failure?',
      back: 'Run multiple load balancers (active-active or active-passive) behind DNS or Anycast virtual IPs.',
    },
  ],
} satisfies Lesson;
