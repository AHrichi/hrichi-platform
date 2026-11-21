import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 04.05: Polling, SSE & WebSockets (`realtime`).
 * Scenario: Live courier tracking (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'realtime',
  learn: [
    'Why short polling wastes bandwidth and database capacity',
    'How long polling and SSE stream server updates over HTTP',
    'When full-duplex WebSockets beat one-way streams',
    'How connection servers fan out updates over pub/sub',
    'How to handle reconnects, backfills, and presence',
  ],
  scene: {
    nodes: [
      {
        id: 'courier',
        kind: 'phone',
        at: { x: 1, y: 2 },
        label: 'Courier GPS',
        sublabel: 'Sends location',
      },
      {
        id: 'buyer',
        kind: 'phone',
        at: { x: 1, y: 7 },
        label: 'Buyer phone',
        sublabel: 'Watching map',
      },
      {
        id: 'api',
        kind: 'server',
        at: { x: 5, y: 2 },
        label: 'Tracking API',
        sublabel: 'Stateless HTTP',
      },
      {
        id: 'loc-db',
        kind: 'database',
        at: { x: 11, y: 2 },
        label: 'Location DB',
        sublabel: 'Latest pin',
      },
    ],
    edges: [
      {
        id: 'courier-api',
        from: 'courier',
        to: 'api',
        label: 'POST /loc',
      },
      {
        id: 'buyer-api',
        from: 'buyer',
        to: 'api',
        label: 'GET /loc',
      },
      {
        id: 'api-db',
        from: 'api',
        to: 'loc-db',
        label: 'Read/Write',
      },
    ],
    zones: [
      {
        id: 'cloud',
        from: { x: 4, y: 1 },
        to: { x: 12, y: 8 },
        hue: 'teal',
        label: 'Tracking backend',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'protocol', label: 'Transport', icon: 'link', value: 'Short poll' },
    { id: 'wasted', label: 'Empty polls', icon: 'warning', value: '95%' },
    { id: 'lag', label: 'Update lag', icon: 'timer', value: '2.5 s' },
    { id: 'conns', label: 'Open conns', icon: 'gauge', value: '0' },
  ],
  steps: [
    {
      id: 'live-map',
      label: 'Live map',
      kind: 'problem',
      title: 'Show a moving courier to 100,000 buyers',
      body: [
        'Your delivery app shows a **live courier pin** moving across a city map for **100,000 waiting buyers**.',
        'Standard HTTP works in request-response turns: the client asks, the server answers. Without a server-push channel, how does the buyer’s phone know the courier just turned a corner?',
      ],
      ops: [
        { op: 'update-node', id: 'courier', patch: { state: 'focus' } },
        { op: 'update-node', id: 'buyer', patch: { state: 'focus' } },
        { op: 'packet', edge: 'courier-api', kind: 'write', wave: 0 },
        { op: 'packet', edge: 'api-db', kind: 'write', wave: 1 },
      ],
    },
    {
      id: 'short-polling',
      label: 'Short polling',
      kind: 'case',
      title: 'Short polling burns 50,000 RPS on empty checks',
      body: [
        'The simplest hack is **short polling**: each buyer phone fires `GET /loc` every **2 seconds**—generating **50,000 RPS** with full HTTP headers.',
        'Because the courier’s GPS updates every 10 seconds, **95% of polls return "unchanged"**, slamming your API and `Location DB` with useless reads.',
      ],
      ops: [
        { op: 'update-node', id: 'courier', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'api',
          patch: { state: 'hot', load: 0.9, badge: '50k RPS' },
        },
        {
          op: 'update-node',
          id: 'loc-db',
          patch: { state: 'hot', badge: '95% wasted' },
        },
        {
          op: 'packet',
          edge: 'buyer-api',
          kind: 'request',
          count: 4,
          label: 'GET /loc',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'buyer-api',
          kind: 'response',
          reverse: true,
          count: 3,
          label: '304 unchanged',
          wave: 1,
        },
        { op: 'set-metric', id: 'wasted', value: '95%', tone: 'bad' },
        { op: 'set-metric', id: 'lag', value: '2.0 s', tone: 'bad' },
      ],
      learns: [0],
    },
    {
      id: 'long-polling',
      label: 'Long polling',
      kind: 'technique',
      title: 'Hold requests open until fresh coordinates land',
      body: [
        'With **long polling**, `Tracking API` holds the buyer’s `GET` open (up to 30 s) until new coordinates arrive, then responds—and the client immediately opens the next request.',
        'Empty responses drop from 95% to ~10%, though every single update still tears down and starts a fresh HTTP cycle.',
      ],
      changes: [
        { type: 'changed', text: 'API holds requests open until new GPS arrives' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'loc-db',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'api',
          patch: { state: 'focus', load: 0.4, badge: 'Hold open' },
        },
        {
          op: 'packet',
          edge: 'buyer-api',
          kind: 'request',
          label: 'Wait ≤ 30 s',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'buyer-api',
          kind: 'response',
          reverse: true,
          label: '200 new pin',
          wave: 1,
        },
        { op: 'set-metric', id: 'protocol', value: 'Long poll' },
        { op: 'set-metric', id: 'wasted', value: '~10%' },
        { op: 'set-metric', id: 'lag', value: '150 ms' },
        { op: 'set-metric', id: 'conns', value: '100k' },
      ],
    },
    {
      id: 'sse-stream',
      label: 'SSE stream',
      kind: 'technique',
      title: 'Stream server events over one HTTP response',
      body: [
        '**Server-Sent Events (`SSE`)** keep a single HTTP response open (`text/event-stream`) and push newline-delimited events whenever the courier moves.',
        'SSE rides standard HTTP/2 multiplexing, passes corporate proxies effortlessly, and auto-reconnects using `Last-Event-ID`—ideal whenever data flows strictly **server → client**.',
      ],
      changes: [
        { type: 'changed', text: 'Buyer subscribes via persistent SSE stream' },
      ],
      ops: [
        { op: 'update-node', id: 'api', patch: { badge: 'SSE stream' } },
        {
          op: 'update-edge',
          id: 'buyer-api',
          patch: { label: 'text/event-stream' },
        },
        { op: 'packet', edge: 'courier-api', kind: 'event', wave: 0 },
        {
          op: 'packet',
          edge: 'buyer-api',
          kind: 'event',
          reverse: true,
          count: 3,
          label: 'pin events',
          wave: 1,
        },
        { op: 'set-metric', id: 'protocol', value: 'SSE', tone: 'good' },
        { op: 'set-metric', id: 'wasted', value: '0%', tone: 'good' },
        { op: 'set-metric', id: 'lag', value: '80 ms', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'websockets',
      label: 'WebSockets',
      kind: 'technique',
      title: 'Upgrade to WebSockets for two-way live frames',
      body: [
        'Now buyers also send instant chat messages and gate codes back to the courier. SSE is one-way (`server → client` only).',
        'A **WebSocket** upgrades an HTTP handshake (`101 Switching Protocols`) into a persistent **full-duplex** TCP pipe: tiny frames flow both ways simultaneously in **~25 ms**.',
      ],
      callouts: [
        {
          kind: 'good-to-know',
          text: 'Prefer SSE for one-way live feeds; reach for WebSockets when clients also push frequent messages back.',
        },
      ],
      ops: [
        { op: 'update-node', id: 'api', patch: { badge: 'WS 101' } },
        { op: 'update-edge', id: 'buyer-api', patch: { label: 'WS duplex' } },
        {
          op: 'packet',
          edge: 'buyer-api',
          kind: 'handshake',
          label: '101 Upgrade',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'buyer-api',
          kind: 'event',
          label: 'chat msg',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'buyer-api',
          kind: 'event',
          reverse: true,
          label: 'pin frame',
          wave: 1,
        },
        { op: 'set-metric', id: 'protocol', value: 'WebSocket', tone: 'good' },
        { op: 'set-metric', id: 'lag', value: '25 ms', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'conn-pubsub',
      label: 'Pub/sub fanout',
      kind: 'technique',
      title: 'Scale connection servers with pub/sub fan-out',
      body: [
        'One machine cannot hold 500,000 open sockets, and the courier connects to **WS Server A** while the buyer holds a socket on **WS Server B**.',
        'Connect stateful **Connection Servers** through a **Pub/Sub bus**: Server A publishes to `order:42`, and only Server B holding that buyer pushes the live frame.',
      ],
      changes: [
        { type: 'added', text: 'WS Server B and Pub/Sub bus for cross-server fan-out' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'api',
          patch: { label: 'WS Server A', sublabel: 'Courier conn', badge: null },
        },
        {
          op: 'add-node',
          node: {
            id: 'ws-b',
            kind: 'server',
            at: { x: 5, y: 7 },
            label: 'WS Server B',
            sublabel: 'Buyer conn',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'pubsub',
            kind: 'stream',
            at: { x: 9, y: 5 },
            label: 'Pub/Sub bus',
            sublabel: 'order:42',
            state: 'focus',
          },
        },
        { op: 'remove-edge', id: 'buyer-api' },
        {
          op: 'add-edge',
          edge: {
            id: 'buyer-wsb',
            from: 'buyer',
            to: 'ws-b',
            label: 'WS duplex',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-pubsub',
            from: 'api',
            to: 'pubsub',
            label: 'publish',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'pubsub-wsb',
            from: 'pubsub',
            to: 'ws-b',
            label: 'deliver',
          },
        },
        { op: 'packet', edge: 'courier-api', kind: 'event', wave: 0 },
        { op: 'packet', edge: 'api-pubsub', kind: 'event', wave: 1 },
        { op: 'packet', edge: 'pubsub-wsb', kind: 'event', wave: 2 },
        {
          op: 'packet',
          edge: 'buyer-wsb',
          kind: 'event',
          reverse: true,
          wave: 3,
        },
        { op: 'set-metric', id: 'conns', value: '500k' },
      ],
      learns: [3],
    },
    {
      id: 'reconnect-storm',
      label: 'Reconnects',
      kind: 'watch-out',
      title: 'Avoid reconnect storms and backfill missed pins',
      body: [
        'A cell tower blip drops 100,000 WebSockets at once. If every phone reconnects immediately at `t = 0`, handshake load crushes your gateway (**thundering herd**).',
        'Reconnect using **exponential backoff with random jitter**, and send `lastSeenSeq` so the server backfills missed coordinates before resuming the live stream.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Stateful sockets complicate deploys too: drain servers gradually and always enforce jittered client reconnects.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'ws-b',
          patch: { state: 'hot', badge: '100k drops' },
        },
        {
          op: 'packet',
          edge: 'buyer-wsb',
          kind: 'error',
          count: 4,
          label: 'Thundering herd',
          wave: 0,
        },
        {
          op: 'add-note',
          note: {
            id: 'backoff-note',
            anchor: { at: { x: 1, y: 4.5 } },
            text: 'Backoff + jitter + lastSeq',
            tone: 'info',
            icon: 'timer',
          },
        },
      ],
    },
    {
      id: 'presence-heartbeat',
      label: 'Presence',
      kind: 'technique',
      title: 'Track presence with heartbeats and short TTL',
      body: [
        'Mobile TCP sockets hang silently inside elevators—never rely on TCP close events alone to track **online presence**.',
        'Have clients send a tiny `PING` **heartbeat** every 20 seconds to refresh a **35 s TTL** key in Redis. When heartbeats stop, the key expires automatically.',
      ],
      changes: [
        { type: 'added', text: 'Presence cache tracking TTL heartbeats' },
      ],
      ops: [
        { op: 'remove-note', id: 'backoff-note' },
        { op: 'update-node', id: 'pubsub', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'ws-b',
          patch: { state: 'normal', badge: 'PING / PONG' },
        },
        {
          op: 'add-node',
          node: {
            id: 'presence-cache',
            kind: 'cache',
            at: { x: 11, y: 7 },
            label: 'Presence cache',
            sublabel: 'Redis TTL 35 s',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'wsb-presence',
            from: 'ws-b',
            to: 'presence-cache',
            label: 'SETEX 35s',
          },
        },
        {
          op: 'packet',
          edge: 'wsb-presence',
          kind: 'write',
          label: 'heartbeat',
          wave: 0,
        },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Choose the lightest real-time pipe that fits',
      body: [
        'Skip wasteful short polling: use SSE for one-way feeds, WebSockets for two-way interaction, pub/sub across connection servers, and jittered reconnects plus TTL heartbeats.',
      ],
      ops: [
        { op: 'update-node', id: 'presence-cache', patch: { state: 'normal' } },
        { op: 'update-node', id: 'buyer', patch: { state: 'normal' } },
        { op: 'update-node', id: 'ws-b', patch: { badge: null } },
        {
          op: 'add-note',
          note: {
            id: 'realtime-table',
            anchor: { at: { x: 1, y: 4.5 } },
            text: 'Real-time transports',
            tone: 'info',
            icon: 'link',
            rows: [
              ['Short poll', 'Simple, 95% waste'],
              ['Long poll', 'Fewer polls, HTTP churn'],
              ['SSE', '1-way HTTP push'],
              ['WebSocket', '2-way full-duplex'],
            ],
          },
        },
      ],
      takeaways: [
        'Short polling wastes RPS and database reads when updates are sparse',
        'Use Server-Sent Events (SSE) for one-way server-to-client streams over plain HTTP',
        'Use WebSockets for low-latency bidirectional frames like chat or live collaboration',
        'Scale stateful connection servers via pub/sub, and guard drops with jittered backoff and TTL presence',
      ],
    },
  ],
  checks: [
    {
      id: 'numeric-short-poll-rps',
      kind: 'numeric',
      prompt:
        'Suppose 60,000 active buyers short-poll GET /location once every 3 seconds. How many requests per second hit the tracking API?',
      unit: 'RPS',
      answer: 20000,
      tolerance: 0.05,
      explain: '60,000 buyers ÷ 3 seconds per poll = 20,000 requests per second.',
      step: 'short-polling',
    },
    {
      id: 'choice-sse-vs-ws',
      kind: 'choice',
      prompt:
        'A live sports ticker only pushes score updates from server to browser over standard corporate proxies. Which transport is the simplest fit?',
      options: [
        'Server-Sent Events (SSE)',
        'Short polling every 200 milliseconds',
        'Raw UDP multicast sockets from the browser',
      ],
      answer: 0,
      explain:
        'SSE streams one-way server-to-client updates over plain HTTP with built-in reconnection and Last-Event-ID support.',
      step: 'sse-stream',
    },
    {
      id: 'choice-pubsub-ws',
      kind: 'choice',
      prompt:
        'Why do multi-node WebSocket tiers place a pub/sub bus between connection servers?',
      options: [
        'A sender and receiver often hold open sockets on different connection servers that must route frames across nodes',
        'WebSocket frames cannot carry JSON unless converted into Kafka offsets first',
        'Pub/sub eliminates the need for TLS certificates on client connections',
      ],
      answer: 0,
      explain:
        'Each connection server only holds a subset of client sockets; publishing to a topic lets whichever node holds the recipient push the frame.',
      step: 'conn-pubsub',
    },
    {
      id: 'order-reconnect-backfill',
      kind: 'order',
      prompt:
        'Order the recovery sequence when a mobile WebSocket client loses signal and reconnects.',
      items: [
        'Wait for an exponential backoff interval plus random jitter',
        'Re-establish the WebSocket handshake sending lastSeenSeq',
        'Receive any missed backfill events since lastSeenSeq',
        'Resume receiving live updates and sending TTL heartbeats',
      ],
      explain:
        'Jittered backoff prevents thundering-herd reconnect storms, while lastSeenSeq lets the server close the gap before live streaming resumes.',
      step: 'reconnect-storm',
    },
  ],
  cards: [
    {
      front: 'When should you pick SSE over WebSockets?',
      back: 'When updates only flow server → client (feeds, tickers, progress); SSE uses plain HTTP, traverses proxies easily, and auto-reconnects.',
    },
    {
      front: 'How do connection servers route real-time updates at scale?',
      back: 'An ingest or server node publishes the event to a pub/sub topic, and whichever connection server holds that user’s open socket forwards the frame.',
    },
    {
      front: 'How do you prevent a WebSocket reconnect storm after a disconnect?',
      back: 'Clients reconnect with exponential backoff plus random jitter, and pass lastSeenSeq to backfill missed events.',
    },
    {
      front: 'Why use heartbeats with a short TTL for online presence?',
      back: 'Mobile connections often drop silently without firing TCP close; periodic PING heartbeats refresh a Redis TTL key that expires automatically when a client goes offline.',
    },
  ],
} satisfies Lesson;
