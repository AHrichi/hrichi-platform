import type { Lesson } from '../../../model/lesson';

/**
 * Golden lesson 01.01: One Request, End to End (`request-journey`).
 * Follows the 11-step outline in `docs/system-design/lesson-authoring.md` §9.
 */
export const lesson = {
  id: 'request-journey',
  learn: [
    'How DNS turns a hostname into an IP address',
    'Why TCP and TLS handshakes cost round trips before HTTP',
    'How a web server and database build the HTML response',
    'How multiplexing and keep-alive speed up repeat requests',
  ],
  scene: {
    nodes: [
      {
        id: 'phone',
        kind: 'phone',
        at: { x: 1, y: 4 },
        label: 'Your phone',
        sublabel: '4G client',
      },
    ],
    edges: [],
    zones: [
      {
        id: 'client-zone',
        from: { x: 0, y: 3 },
        to: { x: 2, y: 5 },
        hue: 'green',
      },
    ],
    notes: [
      {
        id: 'url-note',
        anchor: { at: { x: 3.2, y: 6.2 } },
        text: 'recipes.example/pasta',
        tone: 'info',
        icon: 'link',
      },
    ],
  },
  hud: [
    { id: 'dns', label: 'DNS', icon: 'globe', value: '—' },
    { id: 'connect', label: 'Connect', icon: 'lock', value: '—' },
    { id: 'server', label: 'Server', icon: 'server', value: '—' },
    { id: 'transfer', label: 'Transfer', icon: 'download', value: '—' },
    { id: 'total', label: 'Total', icon: 'timer', value: '—' },
  ],
  steps: [
    {
      id: 'tap',
      label: 'Tap',
      kind: 'problem',
      title: 'One tap, a whole chain of machines',
      body: [
        'You tap `recipes.example/pasta` on your phone over mobile data. Just **1.2 seconds** later a recipe page appears, yet your phone started knowing only a human-readable text string.',
        'Before a single byte of HTML can arrive, your browser has to find which machine owns that name, open an encrypted pipe, and wait for the backend to assemble the page.',
      ],
      ops: [{ op: 'update-node', id: 'phone', patch: { state: 'focus' } }],
    },
    {
      id: 'name-lookup',
      label: 'Name lookup',
      kind: 'technique',
      title: 'DNS translates the name to an IP',
      body: [
        'Routers route by IP addresses, not domain names. Your phone first checks its local cache; on a cold miss it asks a **DNS resolver** (_Domain Name System_ phonebook) for `recipes.example`.',
        'The resolver answers with `198.51.100.24` in one network round trip (**40 ms**).',
      ],
      changes: [
        { type: 'added', text: 'DNS resolver node and lookup link' },
        { type: 'changed', text: 'DNS metric set to 40 ms' },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'dns',
            kind: 'dns',
            at: { x: 4, y: 1 },
            label: 'DNS resolver',
            sublabel: 'UDP 53',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'phone-dns',
            from: 'phone',
            to: 'dns',
            label: 'DNS',
            style: 'dashed',
          },
        },
        {
          op: 'packet',
          edge: 'phone-dns',
          kind: 'request',
          label: 'recipes.example?',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'phone-dns',
          kind: 'response',
          reverse: true,
          label: '198.51.100.24',
          wave: 1,
        },
        { op: 'set-metric', id: 'dns', value: '40 ms' },
        { op: 'set-metric', id: 'total', value: '40 ms' },
      ],
      learns: [0],
    },
    {
      id: 'handshake',
      label: 'Handshake',
      kind: 'technique',
      title: 'TCP and TLS open an encrypted pipe',
      body: [
        'Now your phone knows the server address `198.51.100.24`. It runs a **TCP** handshake to agree on sequence numbers, followed immediately by a **TLS 1.3** handshake to negotiate encryption keys.',
        'At **60 ms** per round trip, two handshake waves add **120 ms** before any HTTP request is sent. Meanwhile, the DNS answer is cached with a _TTL_ (time-to-live).',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Connection setup is pure round-trip latency: bandwidth cannot speed up handshakes.',
        },
      ],
      changes: [
        { type: 'added', text: 'Web server at 198.51.100.24' },
        { type: 'added', text: 'DNS TTL cache note (300 s)' },
      ],
      ops: [
        { op: 'update-node', id: 'dns', patch: { state: 'dim' } },
        {
          op: 'add-note',
          note: {
            id: 'dns-ttl-note',
            anchor: { edge: 'phone-dns' },
            text: 'TTL 300 s',
            tone: 'plain',
          },
        },
        {
          op: 'add-zone',
          zone: {
            id: 'origin-zone',
            from: { x: 6, y: 2 },
            to: { x: 12, y: 6 },
            hue: 'blue',
            label: 'Origin cloud',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'web',
            kind: 'server',
            at: { x: 7, y: 4 },
            label: 'Web server',
            sublabel: '198.51.100.24',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'phone-web',
            from: 'phone',
            to: 'web',
            label: 'HTTPS',
          },
        },
        {
          op: 'packet',
          edge: 'phone-web',
          kind: 'handshake',
          label: 'TCP SYN',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'phone-web',
          kind: 'handshake',
          reverse: true,
          label: 'SYN-ACK',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'phone-web',
          kind: 'handshake',
          label: 'TLS 1.3',
          wave: 2,
        },
        {
          op: 'packet',
          edge: 'phone-web',
          kind: 'handshake',
          reverse: true,
          label: 'Finished',
          wave: 3,
        },
        { op: 'set-metric', id: 'connect', value: '120 ms' },
        { op: 'set-metric', id: 'total', value: '160 ms' },
      ],
      learns: [1],
    },
    {
      id: 'request',
      label: 'Request',
      kind: 'technique',
      title: 'Send GET /pasta over the tunnel',
      body: [
        'With the TLS session established, the browser finally writes its HTTP request: `GET /pasta` along with headers for cookies, accepted encodings, and language.',
        'The request rides the encrypted connection straight to the web server.',
      ],
      ops: [
        { op: 'update-node', id: 'phone', patch: { state: 'normal' } },
        {
          op: 'packet',
          edge: 'phone-web',
          kind: 'request',
          label: 'GET /pasta',
          wave: 0,
        },
      ],
    },
    {
      id: 'server-work',
      label: 'Server work',
      kind: 'technique',
      title: 'The web server routes and runs handler code',
      body: [
        'The web server parses the path `/pasta`, checks your session cookie, and starts the recipe controller.',
        'To render the ingredients and cooking steps, the application handler needs the recipe row stored in the database.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'web',
          patch: { state: 'focus', badge: 'routing' },
        },
      ],
    },
    {
      id: 'database',
      label: 'Database',
      kind: 'technique',
      title: 'Query the database and render HTML',
      body: [
        'The server runs a parameterised SQL query against the **database** over the private network. Inside the same data centre, the hop takes milliseconds.',
        'Query execution plus HTML template rendering takes **90 ms** of server time.',
      ],
      changes: [
        { type: 'added', text: 'Database node inside the origin cloud' },
        { type: 'changed', text: 'Server metric set to 90 ms' },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'db',
            kind: 'database',
            at: { x: 11, y: 4 },
            label: 'Recipes DB',
            sublabel: 'Postgres',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'web-db',
            from: 'web',
            to: 'db',
            label: 'SQL',
          },
        },
        {
          op: 'packet',
          edge: 'web-db',
          kind: 'request',
          label: 'SELECT pasta',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'web-db',
          kind: 'response',
          reverse: true,
          label: '1 row',
          wave: 1,
        },
        { op: 'update-node', id: 'web', patch: { badge: null } },
        { op: 'set-metric', id: 'server', value: '90 ms' },
        { op: 'set-metric', id: 'total', value: '250 ms' },
      ],
      learns: [2],
    },
    {
      id: 'response',
      label: 'Response',
      kind: 'technique',
      title: 'Stream 200 OK back to the phone',
      body: [
        'The web server compresses the rendered HTML down to **64 KB** and streams `200 OK` back across the mobile link.',
        'Downloading the payload takes **60 ms**, bringing the first document load to **310 ms**.',
      ],
      ops: [
        { op: 'update-node', id: 'db', patch: { state: 'normal' } },
        { op: 'update-node', id: 'phone', patch: { state: 'focus' } },
        {
          op: 'packet',
          edge: 'phone-web',
          kind: 'response',
          reverse: true,
          label: '200 · 64 KB',
          wave: 0,
        },
        { op: 'set-metric', id: 'transfer', value: '60 ms' },
        { op: 'set-metric', id: 'total', value: '310 ms', tone: 'good' },
      ],
    },
    {
      id: 'assets',
      label: 'Assets',
      kind: 'technique',
      title: 'Fetch CSS, JS and images on one connection',
      body: [
        'As the browser parses the HTML, it discovers `<link>` stylesheets, scripts, and hero photos. With **HTTP/2 multiplexing**, it fires three requests in parallel over the existing TCP+TLS connection.',
        'No extra DNS lookup or handshake is needed for assets on the same host.',
      ],
      ops: [
        {
          op: 'packet',
          edge: 'phone-web',
          kind: 'request',
          count: 3,
          label: 'CSS · JS · img',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'phone-web',
          kind: 'response',
          reverse: true,
          count: 3,
          label: 'assets',
          wave: 1,
        },
        { op: 'set-metric', id: 'transfer', value: '210 ms' },
        { op: 'set-metric', id: 'total', value: '460 ms' },
      ],
      learns: [3],
    },
    {
      id: 'mobile',
      label: 'Mobile',
      kind: 'watch-out',
      title: 'Weak signal doubles every round trip',
      body: [
        'What if you are on a crowded train with **150 ms** round-trip time and packet retransmissions? DNS jumps to **150 ms**, the two handshakes double to **300 ms**, and asset transfer stretches.',
        'The backend still finishes in **90 ms**, yet the user waits **1.2 s** because network round trips dominate.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Optimising a 90 ms query by 10 ms barely registers when the client spends 450 ms before sending GET.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'phone',
          patch: { state: 'hot', badge: 'high RTT' },
        },
        {
          op: 'packet',
          edge: 'phone-web',
          kind: 'handshake',
          count: 2,
          label: '150 ms RTT',
          wave: 0,
        },
        { op: 'set-metric', id: 'dns', value: '150 ms', tone: 'bad' },
        { op: 'set-metric', id: 'connect', value: '300 ms', tone: 'bad' },
        { op: 'set-metric', id: 'transfer', value: '660 ms', tone: 'bad' },
        { op: 'set-metric', id: 'total', value: '1,200 ms', tone: 'bad' },
      ],
    },
    {
      id: 'repeat',
      label: 'Repeat',
      kind: 'case',
      title: 'A second tap skips DNS and handshakes',
      body: [
        'Five seconds later you tap `/lasagna` on the same site. The DNS answer is still within its `300 s` TTL, and the browser reuses its **keep-alive** TLS connection.',
        'DNS is **0 ms**, Connect is **0 ms**, and the page renders in **150 ms**.',
      ],
      changes: [
        { type: 'changed', text: 'DNS and Connect drop to 0 ms via reuse' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'phone',
          patch: { state: 'focus', badge: 'warm' },
        },
        {
          op: 'packet',
          edge: 'phone-web',
          kind: 'request',
          label: 'GET /lasagna',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'phone-web',
          kind: 'response',
          reverse: true,
          label: '200 OK',
          wave: 1,
        },
        { op: 'set-metric', id: 'dns', value: '0 ms', tone: 'good' },
        { op: 'set-metric', id: 'connect', value: '0 ms', tone: 'good' },
        { op: 'set-metric', id: 'server', value: '90 ms', tone: 'normal' },
        { op: 'set-metric', id: 'transfer', value: '60 ms', tone: 'good' },
        { op: 'set-metric', id: 'total', value: '150 ms', tone: 'good' },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Where the time went',
      body: [
        'Every web request is a relay across **DNS**, **TCP+TLS**, **application logic**, **storage**, and **payload transfer**. Before optimising code, measure which leg actually holds the clock.',
      ],
      ops: [
        { op: 'remove-note', id: 'url-note' },
        {
          op: 'update-node',
          id: 'phone',
          patch: { state: 'normal', badge: null },
        },
        { op: 'update-node', id: 'web', patch: { state: 'normal' } },
        {
          op: 'add-note',
          note: {
            id: 'time-breakdown',
            anchor: { at: { x: 4, y: 6 } },
            text: 'Cold first load',
            tone: 'info',
            icon: 'timer',
            rows: [
              ['DNS lookup', '40 ms'],
              ['TCP + TLS', '120 ms'],
              ['Server + DB', '90 ms'],
              ['Transfer', '60 ms'],
            ],
            total: ['Total HTML', '310 ms'],
          },
        },
        { op: 'set-metric', id: 'dns', value: '40 ms', tone: 'normal' },
        { op: 'set-metric', id: 'connect', value: '120 ms', tone: 'normal' },
        { op: 'set-metric', id: 'server', value: '90 ms', tone: 'normal' },
        { op: 'set-metric', id: 'transfer', value: '60 ms', tone: 'normal' },
        { op: 'set-metric', id: 'total', value: '310 ms', tone: 'good' },
      ],
      takeaways: [
        'A cold request pays for DNS and TCP+TLS handshakes before sending a single HTTP byte',
        'Round-trip time (RTT) multiplies handshake latency regardless of server speed',
        'DNS caching (TTL) and HTTP keep-alive make repeat requests dramatically faster',
        'HTTP/2 multiplexes assets over one warm connection instead of opening new pipes',
      ],
    },
  ],
  checks: [
    {
      id: 'order-cold-request',
      kind: 'order',
      prompt:
        'Put the phases of a cold HTTPS page load in the order they happen.',
      items: [
        'DNS lookup translates hostname to IP',
        'TCP and TLS handshakes open an encrypted connection',
        'Browser sends HTTP GET request',
        'Web server queries the database and streams HTML',
      ],
      explain:
        'The browser needs an IP from DNS before it can open TCP/TLS, and it needs the encrypted tunnel before sending HTTP GET.',
      step: 'handshake',
    },
    {
      id: 'choice-rtt-bottleneck',
      kind: 'choice',
      prompt:
        'When a user moves onto a high-RTT mobile link, which part of a cold request grows the most before the server even sees GET?',
      options: [
        'DNS lookup and TCP/TLS handshakes',
        'SQL query execution inside the origin cloud',
        'HTML template rendering on the web server',
      ],
      answer: 0,
      explain:
        'DNS and connection handshakes require multiple client-to-network round trips, whereas server and database work stay inside the data centre.',
      step: 'mobile',
    },
    {
      id: 'numeric-cold-total',
      kind: 'numeric',
      prompt:
        'A cold load spends 30 ms in DNS, 100 ms in TCP+TLS connect, 80 ms on the server, and 50 ms transferring the response. What is the total time?',
      unit: 'ms',
      answer: 260,
      tolerance: 0.05,
      explain: '30 + 100 + 80 + 50 = 260 ms across the four sequential phases.',
      step: 'response',
    },
    {
      id: 'choice-repeat-visit',
      kind: 'choice',
      prompt:
        'Why does tapping a second link on the same site moments later skip the 40 ms DNS and 120 ms Connect cost?',
      options: [
        'The DNS record is cached within its TTL and HTTP keep-alive reuses the open TLS connection',
        'The database pushes the second page before the user taps',
        'Browsers skip TLS encryption on the second request to a domain',
      ],
      answer: 0,
      explain:
        'A valid DNS TTL avoids the resolver lookup, and a kept-alive connection sends GET immediately without a new handshake.',
      step: 'repeat',
    },
  ],
  cards: [
    {
      front: 'What are the four main latency legs of a cold HTTPS request?',
      back: '1. DNS lookup\n2. TCP + TLS handshakes (Connect)\n3. Server + database processing\n4. Response transfer',
    },
    {
      front:
        'Why does high round-trip time (RTT) hurt connection setup even on a fast server?',
      back: 'DNS, TCP, and TLS handshakes require sequential round trips between client and server before any HTTP request byte is sent.',
    },
    {
      front: 'How do DNS TTL and HTTP keep-alive speed up subsequent requests?',
      back: 'DNS TTL caches the hostname-to-IP mapping locally, and keep-alive reuses the already established TCP+TLS connection.',
    },
    {
      front:
        'How does HTTP/2 load CSS, JavaScript, and images after the HTML arrives?',
      back: 'It multiplexes multiple parallel streams over the same open TCP+TLS connection.',
    },
  ],
} satisfies Lesson;
