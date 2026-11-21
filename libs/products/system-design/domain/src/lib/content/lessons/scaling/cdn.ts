import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 02.05: Content Delivery Networks (`cdn`).
 * Scenario: Sydney users fetching images from Frankfurt (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'cdn',
  learn: [
    'Why speed-of-light RTT makes distant origins feel slow',
    'How CDN edge PoPs serve cache hits close to users',
    'How an origin shield protects your origin on edge misses',
    'How Cache-Control, purges, and dynamic limits govern CDNs',
  ],
  scene: {
    nodes: [
      {
        id: 'sydney',
        kind: 'phone',
        at: { x: 1, y: 5 },
        label: 'Sydney user',
        sublabel: 'Australia',
      },
      {
        id: 'origin',
        kind: 'server',
        at: { x: 11, y: 3 },
        label: 'Origin server',
        sublabel: 'Frankfurt, DE',
      },
      {
        id: 'blobs',
        kind: 'storage',
        at: { x: 11, y: 7 },
        label: 'Media store',
        sublabel: 'Frankfurt S3',
      },
    ],
    edges: [
      {
        id: 'sydney-origin',
        from: 'sydney',
        to: 'origin',
        label: '16,500 km · 280 ms',
      },
      { id: 'origin-blobs', from: 'origin', to: 'blobs', label: 'Fetch' },
    ],
    zones: [
      {
        id: 'au-zone',
        from: { x: 0, y: 3 },
        to: { x: 2, y: 7 },
        hue: 'green',
        label: 'Sydney',
      },
      {
        id: 'eu-zone',
        from: { x: 9, y: 1 },
        to: { x: 12, y: 8 },
        hue: 'blue',
        label: 'Frankfurt',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'rtt', label: 'RTT', icon: 'timer', value: '280 ms' },
    {
      id: 'img-load',
      label: 'Image load',
      icon: 'download',
      value: '1,120 ms',
    },
    { id: 'origin-bw', label: 'Origin egress', icon: 'cloud', value: '100%' },
  ],
  steps: [
    {
      id: 'long-haul',
      label: '16,500 km',
      kind: 'problem',
      title: 'Sydney users crawl across the globe for images',
      body: [
        'Your travel app runs in **Frankfurt**, serving a hero photo in just **15 ms** locally. Yet visitors in **Sydney** wait **1,120 ms** per image.',
        'Every single request and packet has to cross `16,500 km` of subsea fiber and come back.',
      ],
      ops: [
        { op: 'update-node', id: 'sydney', patch: { state: 'hot' } },
        { op: 'packet', edge: 'sydney-origin', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'sydney-origin',
          kind: 'response',
          reverse: true,
          label: '1.12 s',
          wave: 1,
        },
      ],
    },
    {
      id: 'rtt-distance',
      label: 'Light speed',
      kind: 'technique',
      title: 'Distance sets a hard floor on round-trip time',
      body: [
        'Light in glass fiber travels near `200,000 km/s`, locking Sydney–Frankfurt **round-trip time** (`RTT`) at **~280 ms**. Faster origin CPUs cannot bend physics.',
        'TCP setup, TLS 1.3 handshake, HTTP `GET`, and TCP slow-start easily burn **4 round trips** (`4 × 280 ms = 1,120 ms`) per cold photo load.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Bandwidth cannot fix distance: when RTT is 280 ms, you must bring bytes physically closer to the user.',
        },
      ],
      ops: [
        {
          op: 'add-note',
          note: {
            id: 'rtt-note',
            anchor: { edge: 'sydney-origin' },
            text: '4 RTTs × 280 ms = 1.12 s',
            tone: 'bad',
            icon: 'timer',
          },
        },
        {
          op: 'packet',
          edge: 'sydney-origin',
          kind: 'handshake',
          count: 2,
          label: 'TCP + TLS',
          wave: 0,
        },
      ],
      learns: [0],
    },
    {
      id: 'edge-pops',
      label: 'Edge PoPs',
      kind: 'technique',
      title: 'Place CDN Points of Presence near users',
      body: [
        'A **CDN** (_Content Delivery Network_) deploys hundreds of **edge PoPs** (_Points of Presence_) in cities worldwide—including **Sydney**.',
        'Through DNS or **Anycast** routing, Sydney browsers connect to a PoP **12 ms** away instead of crossing oceans for handshakes.',
      ],
      changes: [{ type: 'added', text: 'Sydney CDN edge PoP (12 ms RTT)' }],
      ops: [
        { op: 'remove-note', id: 'rtt-note' },
        { op: 'remove-edge', id: 'sydney-origin' },
        {
          op: 'add-node',
          node: {
            id: 'pop-syd',
            kind: 'cdn',
            at: { x: 4, y: 5 },
            label: 'Sydney PoP',
            sublabel: '12 ms RTT',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'syd-pop',
            from: 'sydney',
            to: 'pop-syd',
            label: '12 ms RTT',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'pop-origin',
            from: 'pop-syd',
            to: 'origin',
            label: 'Miss pull',
            style: 'dashed',
          },
        },
        {
          op: 'packet',
          edge: 'syd-pop',
          kind: 'handshake',
          label: '12 ms TLS',
          wave: 0,
        },
        { op: 'set-metric', id: 'rtt', value: '12 ms', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'edge-hit',
      label: 'Edge hit',
      kind: 'technique',
      title: 'Edge cache hits serve assets locally in 45 ms',
      body: [
        'The very first Sydney request triggers an **edge miss**: the PoP fetches `hero.webp` from Frankfurt once and caches it on local SSD/RAM.',
        'Every visitor in Sydney after that gets an **edge hit** straight from the local PoP—slashing image load from **1,120 ms** to **45 ms** and cutting origin bandwidth by **95%**.',
      ],
      ops: [
        { op: 'update-node', id: 'sydney', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'pop-syd',
          patch: { badge: '95% HIT' },
        },
        { op: 'packet', edge: 'syd-pop', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'syd-pop',
          kind: 'response',
          reverse: true,
          label: '45 ms HIT',
          wave: 1,
        },
        { op: 'set-metric', id: 'img-load', value: '45 ms', tone: 'good' },
        { op: 'set-metric', id: 'origin-bw', value: '5%', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'origin-shield',
      label: 'Origin shield',
      kind: 'case',
      title: '200 global PoPs missing at once overload origin',
      body: [
        'Publish a new viral banner and **200 global PoPs** miss simultaneously, sending 200 parallel downloads straight to Frankfurt!',
        'Adding an **origin shield**—a shared intermediate cache tier near Frankfurt—coalesces all 200 edge misses into **one** origin fetch.',
      ],
      changes: [
        { type: 'added', text: 'Origin shield coalescing edge misses' },
      ],
      ops: [
        { op: 'remove-edge', id: 'pop-origin' },
        {
          op: 'add-node',
          node: {
            id: 'shield',
            kind: 'cdn',
            at: { x: 8, y: 3 },
            label: 'Origin shield',
            sublabel: 'EU cache tier',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'pop-shield',
            from: 'pop-syd',
            to: 'shield',
            label: 'Coalesced',
            style: 'dashed',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'shield-origin',
            from: 'shield',
            to: 'origin',
            label: '1 fetch',
          },
        },
        {
          op: 'packet',
          edge: 'pop-shield',
          kind: 'request',
          count: 3,
          label: 'PoP misses',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'shield-origin',
          kind: 'request',
          count: 1,
          label: '1 pull',
          wave: 1,
        },
      ],
      learns: [2],
    },
    {
      id: 'cache-headers',
      label: 'Headers & URL',
      kind: 'technique',
      title: 'Use Cache-Control and versioned filenames',
      body: [
        'Your origin tells the CDN what to cache via HTTP headers: `Cache-Control: public, max-age=31536000, immutable` keeps static assets at the edge for a year.',
        'Global **cache purges** take seconds or minutes to propagate. Instead, publish **content-hashed URLs** (`hero.a9f3c.webp`) so updated HTML immediately requests a brand-new key.',
      ],
      ops: [
        {
          op: 'add-note',
          note: {
            id: 'header-note',
            anchor: { node: 'origin' },
            text: 'max-age=1y · immutable',
            tone: 'good',
            icon: 'check',
          },
        },
        {
          op: 'update-node',
          id: 'pop-syd',
          patch: { badge: 'hero.a9f3c.webp' },
        },
        { op: 'update-node', id: 'shield', patch: { state: 'normal' } },
      ],
      learns: [3],
    },
    {
      id: 'dynamic-limits',
      label: 'Dynamic trap',
      kind: 'watch-out',
      title: 'Never edge-cache private or live user data',
      body: [
        'CDNs excel at images, CSS, JS, and public pages—**not** private bank accounts or live carts. Caching personalised responses risks leaking User A’s page to User B.',
        'Mark private endpoints `Cache-Control: private, no-store` so PoPs forward them straight to origin over warm edge connections.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Marking a personalised response `public` on a CDN leaks one user’s private data to everyone nearby.',
        },
      ],
      ops: [
        { op: 'remove-note', id: 'header-note' },
        {
          op: 'update-node',
          id: 'pop-syd',
          patch: { state: 'normal', badge: 'no-store pass' },
        },
        {
          op: 'update-node',
          id: 'origin',
          patch: { state: 'focus', badge: 'Dynamic API' },
        },
        {
          op: 'packet',
          edge: 'syd-pop',
          kind: 'request',
          label: 'GET /cart',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'pop-shield',
          kind: 'request',
          label: 'Pass-through',
          wave: 1,
        },
        { op: 'packet', edge: 'shield-origin', kind: 'request', wave: 2 },
      ],
      learns: [3],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Outrun round trips by caching at the edge',
      body: [
        'CDNs solve speed-of-light latency by terminating connections and caching static assets inside user cities, shielding your origin from bursts while forwarding dynamic requests safely.',
      ],
      ops: [
        { op: 'update-node', id: 'pop-syd', patch: { badge: null } },
        {
          op: 'update-node',
          id: 'origin',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'cdn-summary',
            anchor: { at: { x: 3, y: 1 } },
            text: 'CDN takeaways',
            tone: 'info',
            icon: 'globe',
            rows: [
              ['Sydney → DE', '280 ms RTT'],
              ['Sydney PoP hit', '12 ms RTT · 45 ms'],
              ['Updates', 'Hashed filenames'],
            ],
            total: ['Private API', 'private, no-store'],
          },
        },
      ],
      takeaways: [
        'Speed-of-light RTT makes distant origins slow regardless of server CPU power',
        'Edge PoPs cut RTT and serve cache hits in tens of milliseconds while slashing origin egress',
        'An origin shield coalesces misses from many PoPs into a single fetch to your origin',
        'Use long `Cache-Control` lifetimes with versioned URLs for assets, and `private, no-store` for user-specific responses',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-why-cdn',
      kind: 'choice',
      prompt:
        'Why did upgrading the Frankfurt server from 8 CPUs to 64 CPUs barely speed up image loads for users in Sydney?',
      options: [
        'Latency was dominated by the 280 ms cross-globe network round trips, not server compute',
        'Browsers throttle downloads from European IP ranges',
        'Images are always rendered on the database server',
      ],
      answer: 0,
      explain:
        'TCP/TLS handshakes and data flights cross 16,500 km at fiber light speed (~280 ms RTT); only moving content closer via edge PoPs removes that travel delay.',
      step: 'rtt-distance',
    },
    {
      id: 'choice-origin-shield',
      kind: 'choice',
      prompt:
        'What problem does an origin shield solve when 200 global CDN PoPs simultaneously cache-miss on a newly released hero image?',
      options: [
        'It collapses the 200 PoP fetches into a single request to the origin server',
        'It encrypts images with per-user TLS keys at the browser',
        'It eliminates the need for Cache-Control headers',
      ],
      answer: 0,
      explain:
        'The origin shield acts as a shared intermediate cache tier so all edge PoPs pull from the shield rather than hammering the origin simultaneously.',
      step: 'origin-shield',
    },
    {
      id: 'order-cdn-request',
      kind: 'order',
      prompt:
        'Order the path of a cache-miss image request through a shielded CDN.',
      items: [
        'Browser in Sydney requests hero.a9f3c.webp from the nearest edge PoP',
        'Sydney PoP misses and forwards the request to the origin shield',
        'Origin shield pulls the file once from the Frankfurt origin',
        'Shield and Sydney PoP cache the response for subsequent local hits',
      ],
      explain:
        'Requests hit the local PoP first, fall back to the origin shield on miss, fetch once from origin, and populate both caches along the way back.',
      step: 'origin-shield',
    },
    {
      id: 'numeric-cdn-egress',
      kind: 'numeric',
      prompt:
        'Sydney users generate 2,000 image requests per second, each 200 KB. If the CDN serves a 95% hit ratio, how many requests per second still reach the origin?',
      unit: 'RPS',
      answer: 100,
      tolerance: 0.05,
      explain:
        'At a 95% hit ratio, only 5% miss: 0.05 × 2,000 RPS = 100 RPS reaching the origin.',
      step: 'edge-hit',
    },
  ],
  cards: [
    {
      front:
        'Why can’t a faster origin server eliminate latency for distant global users?',
      back: 'The speed of light through fiber sets a hard round-trip time (RTT) floor across continents; TCP/TLS handshakes and HTTP transfers multiply that RTT.',
    },
    {
      front: 'What is a CDN origin shield and when does it help?',
      back: 'An intermediate cache tier sitting in front of your origin that coalesces simultaneous misses from many edge PoPs into one origin pull.',
    },
    {
      front:
        'Why are content-hashed filenames (e.g. app.a9f3c.js) preferred over CDN purges?',
      back: 'Purges take time to propagate across every PoP globally; new hashed filenames let you cache forever (`immutable`) and switch immediately on deploy.',
    },
    {
      front:
        'What Cache-Control rule protects user-specific API responses behind a CDN?',
      back: 'Send `Cache-Control: private, no-store` so edge PoPs never store or leak one user’s personalised data to another.',
    },
  ],
} satisfies Lesson;
