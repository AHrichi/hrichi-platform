import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 09.04: Design a Chat System (`design-chat`).
 * Scenario: one-to-one and group chat (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'design-chat',
  learn: [
    'Why chat needs long-lived WebSocket connections',
    'How partitioning by conversation keeps messages in order',
    'How delivery and read receipts flow back to the sender',
    'What happens when the receiver is offline',
    'How presence stays cheap with heartbeats and TTLs',
    'Why big groups change the fan-out math',
  ],
  scene: {
    nodes: [
      {
        id: 'ana',
        kind: 'phone',
        at: { x: 1, y: 2 },
        label: 'Ana',
        sublabel: 'Sender',
      },
      {
        id: 'ben',
        kind: 'phone',
        at: { x: 1, y: 7 },
        label: 'Ben',
        sublabel: 'Receiver',
      },
      {
        id: 'chat-api',
        kind: 'server',
        at: { x: 5, y: 4 },
        label: 'Chat API',
        sublabel: 'HTTP polling',
      },
    ],
    edges: [
      { id: 'ana-api', from: 'ana', to: 'chat-api', label: 'POST /msg' },
      { id: 'ben-api', from: 'ben', to: 'chat-api', label: 'GET /new' },
    ],
    zones: [
      {
        id: 'backend',
        from: { x: 3, y: 0 },
        to: { x: 13, y: 9 },
        hue: 'teal',
        label: 'Chat backend',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'delivery', label: 'Delivery', icon: 'timer', value: '—' },
    { id: 'sockets', label: 'Open sockets', icon: 'link', value: '0' },
    { id: 'order', label: 'Ordering', icon: 'hash', value: 'Phone clock' },
    { id: 'offline', label: 'Offline', icon: 'mail', value: 'Lost' },
  ],
  steps: [
    {
      id: 'polling',
      label: 'Polling lag',
      kind: 'problem',
      title: 'Messages arrive seconds late',
      body: [
        'Ana sends Ben a message. Ben’s app asks `GET /new` every **3 seconds**, so the reply feels sluggish, and most polls come back empty.',
        'Across **5M** open apps that is over a million empty requests per second, and the phones’ batteries pay for every one.',
      ],
      ops: [
        { op: 'packet', edge: 'ana-api', kind: 'write', label: 'hi Ben' },
        {
          op: 'packet',
          edge: 'ben-api',
          kind: 'request',
          count: 3,
          label: 'anything?',
          wave: 1,
        },
        { op: 'set-metric', id: 'delivery', value: 'up to 3 s', tone: 'bad' },
      ],
    },
    {
      id: 'sockets',
      label: 'WebSockets',
      kind: 'technique',
      title: 'Keep one connection open per device',
      body: [
        'Each phone opens a **WebSocket** to a gateway and keeps it. The server can now push a message the moment it exists, with no polling.',
        'Gateways only hold connections; one machine can keep **hundreds of thousands** of mostly idle sockets.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Push beats pull when updates are rare and must be fast.',
        },
      ],
      changes: [
        { type: 'removed', text: 'Polling Chat API' },
        { type: 'added', text: 'Two WebSocket gateways' },
      ],
      ops: [
        { op: 'remove-node', id: 'chat-api' },
        {
          op: 'add-node',
          node: {
            id: 'gw-a',
            kind: 'gateway',
            at: { x: 4, y: 2 },
            label: 'Gateway A',
            sublabel: 'WebSocket',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'gw-b',
            kind: 'gateway',
            at: { x: 4, y: 7 },
            label: 'Gateway B',
            sublabel: 'WebSocket',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'ana-gwa', from: 'ana', to: 'gw-a', label: 'wss' },
        },
        {
          op: 'add-edge',
          edge: { id: 'ben-gwb', from: 'ben', to: 'gw-b', label: 'wss' },
        },
        { op: 'packet', edge: 'ana-gwa', kind: 'handshake' },
        { op: 'packet', edge: 'ben-gwb', kind: 'handshake' },
        { op: 'set-metric', id: 'sockets', value: '2' },
      ],
      learns: [0],
    },
    {
      id: 'route',
      label: 'Routing',
      kind: 'technique',
      title: 'Find the gateway that holds the receiver',
      body: [
        'Ana is on gateway A, Ben on gateway B. A **message service** takes Ana’s message and asks a **session map** which gateway holds Ben’s socket.',
        'Then it hands the message to gateway B, which pushes it down Ben’s connection.',
      ],
      changes: [
        { type: 'added', text: 'Message service' },
        { type: 'added', text: 'Session map: user → gateway' },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'msg',
            kind: 'service',
            at: { x: 8, y: 4 },
            label: 'Message svc',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'sessions',
            kind: 'cache',
            at: { x: 8, y: 8 },
            label: 'Session map',
            sublabel: 'user → gateway',
          },
        },
        { op: 'add-edge', edge: { id: 'gwa-msg', from: 'gw-a', to: 'msg' } },
        {
          op: 'add-edge',
          edge: { id: 'msg-gwb', from: 'msg', to: 'gw-b', label: 'deliver' },
        },
        {
          op: 'add-edge',
          edge: { id: 'msg-sessions', from: 'msg', to: 'sessions' },
        },
        { op: 'packet', edge: 'gwa-msg', kind: 'write', label: 'hi Ben' },
        {
          op: 'packet',
          edge: 'msg-sessions',
          kind: 'request',
          label: 'Ben?',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'msg-sessions',
          kind: 'response',
          reverse: true,
          label: 'gateway B',
          wave: 2,
        },
        { op: 'packet', edge: 'msg-gwb', kind: 'event', wave: 3 },
        {
          op: 'packet',
          edge: 'ben-gwb',
          kind: 'event',
          reverse: true,
          label: 'hi Ben',
          wave: 4,
        },
        { op: 'set-metric', id: 'delivery', value: '~120 ms', tone: 'good' },
      ],
      learns: [0],
    },
    {
      id: 'store',
      label: 'Store first',
      kind: 'technique',
      title: 'Save each message before delivering it',
      body: [
        'Delivery can fail; the message must not. The service writes every message to a **message store** first, then delivers it.',
        'The store is partitioned by **conversation id**, so one chat’s whole history lives on one partition and reads back in a single range scan.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Partition by the thing you read together: here, the conversation.',
        },
      ],
      changes: [
        { type: 'added', text: 'Message store, partitioned by chat_id' },
      ],
      ops: [
        {
          op: 'add-node',
          node: {
            id: 'store',
            kind: 'database',
            at: { x: 11, y: 2 },
            label: 'Message store',
            sublabel: 'by chat_id',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'msg-store', from: 'msg', to: 'store', label: 'append' },
        },
        { op: 'packet', edge: 'msg-store', kind: 'write', label: 'chat 42' },
      ],
      learns: [1],
    },
    {
      id: 'ordering',
      label: 'Ordering',
      kind: 'technique',
      title: 'Number messages per conversation',
      body: [
        'Phone clocks disagree, so sorting by the sender’s timestamp can show a reply before its question.',
        'Instead, the partition that owns a conversation stamps each message with the next **sequence number**. Every device sorts by that number and spots gaps.',
      ],
      callouts: [
        {
          kind: 'good-to-know',
          text: 'Ordering is only needed within a chat, never across all chats.',
        },
      ],
      ops: [
        { op: 'update-node', id: 'store', patch: { badge: 'seq 1043' } },
        {
          op: 'packet',
          edge: 'msg-store',
          kind: 'write',
          label: 'seq 1042',
          count: 2,
        },
        { op: 'set-metric', id: 'order', value: 'Per-chat seq', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'receipts',
      label: 'Receipts',
      kind: 'technique',
      title: 'Send delivered and read receipts back',
      body: [
        'When Ben’s phone receives message 1043 it sends a tiny **delivered** receipt; when he opens the chat, a **read** receipt.',
        'Receipts travel the same path in reverse and only carry the conversation id and the highest sequence number seen.',
      ],
      ops: [
        {
          op: 'packet',
          edge: 'ben-gwb',
          kind: 'event',
          label: 'delivered 1043',
        },
        {
          op: 'packet',
          edge: 'msg-gwb',
          kind: 'event',
          reverse: true,
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'gwa-msg',
          kind: 'event',
          reverse: true,
          wave: 2,
        },
        {
          op: 'packet',
          edge: 'ana-gwa',
          kind: 'event',
          reverse: true,
          label: '✓✓',
          wave: 3,
        },
      ],
      learns: [2],
    },
    {
      id: 'offline',
      label: 'Offline',
      kind: 'case',
      title: 'Ben’s phone is off',
      body: [
        'The session map has no socket for Ben. The message is already stored, so nothing is lost: the service sends a **push notification** through Apple’s or Google’s push service instead.',
        'When Ben reconnects, his app asks for everything after the last sequence number it saw.',
      ],
      changes: [{ type: 'added', text: 'Push notification service' }],
      ops: [
        {
          op: 'update-node',
          id: 'ben',
          patch: { state: 'down', badge: 'offline' },
        },
        {
          op: 'add-node',
          node: {
            id: 'push',
            kind: 'external',
            at: { x: 12, y: 7 },
            label: 'Push service',
            sublabel: 'APNs / FCM',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'msg-push', from: 'msg', to: 'push', label: 'notify' },
        },
        { op: 'packet', edge: 'msg-sessions', kind: 'request', label: 'Ben?' },
        {
          op: 'packet',
          edge: 'msg-sessions',
          kind: 'response',
          reverse: true,
          label: 'no socket',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'msg-push',
          kind: 'event',
          label: 'new message',
          wave: 2,
        },
        { op: 'set-metric', id: 'offline', value: 'Push + sync', tone: 'good' },
      ],
      learns: [3],
    },
    {
      id: 'presence',
      label: 'Presence',
      kind: 'technique',
      title: 'Show who is online without flooding everyone',
      body: [
        'Each app sends a **heartbeat** every 30 seconds; the gateway refreshes the user’s session entry with a **60-second TTL**. No heartbeat, and the entry expires: offline.',
        'Presence changes go only to people looking at a chat with that user, not to every contact.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'ben',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'gwb-sessions',
            from: 'gw-b',
            to: 'sessions',
            label: 'TTL 60 s',
          },
        },
        { op: 'packet', edge: 'ben-gwb', kind: 'event', label: 'heartbeat' },
        {
          op: 'packet',
          edge: 'gwb-sessions',
          kind: 'write',
          label: 'Ben online',
          wave: 1,
        },
      ],
      learns: [4],
    },
    {
      id: 'groups',
      label: 'Big groups',
      kind: 'watch-out',
      title: 'One group message, hundreds of deliveries',
      body: [
        'In a 500-member group, one message means **499 deliveries**. Twenty messages a minute is about **10,000 pushes a minute** for one chat.',
        'Group by gateway: send each gateway one copy with its member list, and store the message once, not once per member.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never write a copy per member; store once, fan out on delivery.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'msg',
          patch: { state: 'hot', load: 0.85, badge: '×499' },
        },
        {
          op: 'add-note',
          note: {
            id: 'fanout',
            anchor: { node: 'msg' },
            text: '1 message → 499 deliveries',
            tone: 'bad',
          },
        },
        {
          op: 'packet',
          edge: 'msg-gwb',
          kind: 'event',
          count: 5,
          label: 'per gateway',
        },
      ],
      learns: [5],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Where each chat concern lives',
      body: [
        'Gateways hold sockets, the message service routes, the store keeps order and history, and push covers phones that are away.',
      ],
      callouts: [
        {
          kind: 'coming-up',
          text: 'Try it in the Design Lab: add queues and replicas and watch the load.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'msg',
          patch: { state: 'normal', load: null, badge: null },
        },
        { op: 'remove-note', id: 'fanout' },
        {
          op: 'add-note',
          note: {
            id: 'summary',
            anchor: { at: { x: 8, y: 0 } },
            text: 'Who does what',
            rows: [
              ['Connections', 'WebSocket gateways'],
              ['Routing', 'Session map'],
              ['Order', 'Per-chat sequence'],
              ['Offline', 'Push + sync'],
            ],
          },
        },
      ],
      takeaways: [
        'Long-lived WebSockets replace wasteful polling',
        'Partition by conversation; order by per-chat sequence',
        'Store first, then deliver, so nothing is lost',
        'Offline users get a push and sync from their last sequence',
        'Big groups fan out per gateway, never a copy per member',
      ],
    },
  ],
  checks: [
    {
      id: 'why-sockets',
      kind: 'choice',
      prompt: 'Why do chat apps keep a WebSocket open instead of polling?',
      options: [
        'Sockets encrypt messages and polling cannot',
        'The server can push each message the moment it exists, without empty requests',
        'WebSockets make the message store faster',
      ],
      answer: 1,
      explain:
        'An open connection lets the server push immediately, which removes both the polling delay and the flood of empty requests.',
      step: 'sockets',
    },
    {
      id: 'partition-key',
      kind: 'choice',
      prompt: 'What should the message store be partitioned by?',
      options: ['Sender id', 'Conversation id', 'Send time', 'A random key'],
      answer: 1,
      explain:
        'A chat is read as a whole, so keeping each conversation on one partition makes history a single range read and lets that partition number its messages.',
      step: 'store',
    },
    {
      id: 'send-path',
      kind: 'order',
      prompt:
        'Put the steps of delivering Ana’s message to an online Ben in order.',
      items: [
        'Gateway A receives the message',
        'The message service stores it with the next sequence number',
        'The session map says Ben is on gateway B',
        'Gateway B pushes it down Ben’s socket',
      ],
      explain:
        'Store first so nothing is lost, then look up the receiver’s gateway and push.',
      step: 'route',
    },
    {
      id: 'group-fanout',
      kind: 'numeric',
      prompt:
        'A 500-member group sends 20 messages a minute. About how many deliveries per minute is that?',
      unit: 'deliveries/min',
      answer: 10000,
      tolerance: 0.05,
      explain:
        'Each message goes to the other 499 members: 20 × 499 ≈ 10,000 deliveries a minute.',
      step: 'groups',
    },
    {
      id: 'offline-receiver',
      kind: 'choice',
      prompt: 'Ben is offline when Ana’s message arrives. What should happen?',
      options: [
        'Drop the message; Ana can resend it',
        'Keep it stored, send a push notification, and let Ben sync from his last sequence number',
        'Retry Ben’s socket every second until it opens',
      ],
      answer: 1,
      explain:
        'The message is already durable. A push wakes Ben up, and on reconnect his app fetches everything after the last sequence number it saw.',
      step: 'offline',
    },
  ],
  cards: [
    {
      front: 'Why does chat use WebSockets instead of polling?',
      back: 'The server can push messages instantly over one open connection, with no empty requests.',
    },
    {
      front: 'How does a chat system keep messages in order?',
      back: 'The partition that owns a conversation stamps each message with the next per-chat sequence number.',
    },
    {
      front: 'What happens to a message for an offline user?',
      back: 'It is already stored; a push notification goes out, and the app syncs from its last sequence number on reconnect.',
    },
    {
      front: 'How do you deliver a message to a 500-member group efficiently?',
      back: 'Store it once and send one copy per gateway with its member list, not one copy per member.',
    },
  ],
} satisfies Lesson;
