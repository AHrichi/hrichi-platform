import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 02.03: Stateless Services (`stateless-services`).
 * Scenario: Users logged out after a deploy (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'stateless-services',
  learn: [
    'Why in-memory server sessions break scaling and deploys',
    'How a shared session store (Redis) keeps logins intact',
    'How signed tokens (JWT) verify state without a store lookup',
    'Where sessions, durable data, and uploaded files belong',
  ],
  scene: {
    nodes: [
      {
        id: 'users',
        kind: 'user',
        at: { x: 1, y: 4 },
        label: 'Learners',
        sublabel: '12.4k active',
      },
      {
        id: 'lb',
        kind: 'load-balancer',
        at: { x: 4, y: 4 },
        label: 'Load balancer',
        sublabel: 'Round robin',
      },
      {
        id: 'app-1',
        kind: 'server',
        at: { x: 8, y: 2 },
        label: 'App 1',
        sublabel: 'RAM sessions',
        badge: '6.2k sess',
      },
      {
        id: 'app-2',
        kind: 'server',
        at: { x: 8, y: 6 },
        label: 'App 2',
        sublabel: 'RAM sessions',
        badge: '6.2k sess',
      },
      {
        id: 'db',
        kind: 'database',
        at: { x: 12, y: 2 },
        label: 'Main DB',
        sublabel: 'Postgres',
      },
    ],
    edges: [
      { id: 'users-lb', from: 'users', to: 'lb', label: 'HTTPS' },
      { id: 'lb-1', from: 'lb', to: 'app-1' },
      { id: 'lb-2', from: 'lb', to: 'app-2' },
      { id: 'app1-db', from: 'app-1', to: 'db', label: 'SQL' },
      { id: 'app2-db', from: 'app-2', to: 'db', label: 'SQL' },
    ],
    zones: [
      {
        id: 'app-zone',
        from: { x: 6, y: 1 },
        to: { x: 10, y: 7 },
        hue: 'blue',
        label: 'App tier',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'sessions', label: 'Sessions', icon: 'key', value: '12,400' },
    { id: 'logouts', label: 'Logouts/deploy', icon: 'warning', value: '100%' },
    { id: 'store', label: 'Auth store', icon: 'layers', value: 'Local RAM' },
    { id: 'deploys', label: 'Safe deploys', icon: 'check', value: 'No' },
  ],
  steps: [
    {
      id: 'deploy-logout',
      label: 'Post-deploy',
      kind: 'problem',
      title: 'Every deploy logs your users out',
      body: [
        'You ship a tiny CSS fix to your study app and roll `App 1` then `App 2` one by one. Seconds later, support floods with reports of learners kicked back to the login screen mid-quiz.',
        'Why did restarting a web server erase active user logins?',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-1',
          patch: { state: 'down', badge: 'restarting' },
        },
        { op: 'packet', edge: 'users-lb', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'lb-1',
          kind: 'error',
          reverse: true,
          label: '401 Logged out',
          wave: 1,
        },
        { op: 'set-metric', id: 'logouts', value: '100%', tone: 'bad' },
      ],
    },
    {
      id: 'ram-sessions',
      label: 'Local RAM',
      kind: 'case',
      title: 'In-memory sessions trap users on one box',
      body: [
        'Both servers store login state (`{ userId: 42 }`) inside process **RAM**. When `App 1` restarts for a deploy, its 6,200 sessions evaporate.',
        'Even without a deploy, when round robin sends Alice’s next request from `App 2` to `App 1`, `App 1` has no record of her session cookie and returns `401`.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Sticky sessions only paper over local state—restarts, crashes, and scale-ins still drop users.',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'app-1',
          patch: { state: 'normal', badge: '0 sess' },
        },
        {
          op: 'update-node',
          id: 'app-2',
          patch: { state: 'focus', badge: '6.2k sess' },
        },
        {
          op: 'add-note',
          note: {
            id: 'alice-note',
            anchor: { node: 'app-1' },
            text: 'Alice hits App 1 → 401',
            tone: 'bad',
            icon: 'warning',
          },
        },
        {
          op: 'packet',
          edge: 'lb-1',
          kind: 'error',
          reverse: true,
          label: '401 Unknown',
          wave: 0,
        },
      ],
      learns: [0],
    },
    {
      id: 'shared-store',
      label: 'Shared store',
      kind: 'technique',
      title: 'Move sessions into a shared Redis store',
      body: [
        'Move session data out of app servers into a shared in-memory **Session store** (like **Redis**).',
        'Now the browser cookie holds only an opaque `sessionId`. Any server reads Alice’s state from Redis in under a millisecond—so rolling deploys and autoscaling never log anyone out.',
      ],
      changes: [
        { type: 'added', text: 'Shared Redis session store' },
        { type: 'changed', text: 'App 1 and App 2 are now stateless' },
      ],
      ops: [
        { op: 'remove-note', id: 'alice-note' },
        {
          op: 'add-node',
          node: {
            id: 'redis',
            kind: 'cache',
            at: { x: 12, y: 5 },
            label: 'Session store',
            sublabel: 'Redis · <1 ms',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: { id: 'app1-redis', from: 'app-1', to: 'redis', label: 'Sess' },
        },
        {
          op: 'add-edge',
          edge: { id: 'app2-redis', from: 'app-2', to: 'redis', label: 'Sess' },
        },
        {
          op: 'update-node',
          id: 'app-1',
          patch: { sublabel: 'Stateless', badge: null },
        },
        {
          op: 'update-node',
          id: 'app-2',
          patch: { sublabel: 'Stateless', state: 'normal', badge: null },
        },
        { op: 'packet', edge: 'lb-1', kind: 'request', wave: 0 },
        {
          op: 'packet',
          edge: 'app1-redis',
          kind: 'request',
          label: 'GET sess',
          wave: 1,
        },
        { op: 'set-metric', id: 'store', value: 'Shared Redis', tone: 'good' },
        { op: 'set-metric', id: 'logouts', value: '0%', tone: 'good' },
        { op: 'set-metric', id: 'deploys', value: 'Yes', tone: 'good' },
      ],
      learns: [1],
    },
    {
      id: 'signed-tokens',
      label: 'Signed tokens',
      kind: 'technique',
      title: 'Or carry signed state inside a JWT',
      body: [
        'Another stateless option avoids the Redis hop on reads: give the client a **signed token** such as a **JWT** (_JSON Web Token_) containing `{ userId: 42, exp: ... }` signed with a server secret.',
        'Any app server verifies the cryptographic signature locally in microseconds without calling a store.',
      ],
      ops: [
        { op: 'update-node', id: 'redis', patch: { state: 'dim' } },
        {
          op: 'add-note',
          note: {
            id: 'jwt-note',
            anchor: { node: 'users' },
            text: 'Cookie: signed JWT',
            tone: 'info',
            icon: 'key',
          },
        },
        {
          op: 'packet',
          edge: 'users-lb',
          kind: 'request',
          label: 'JWT',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'lb-2',
          kind: 'request',
          label: 'Verify sig',
          wave: 1,
        },
        { op: 'set-metric', id: 'store', value: 'JWT / Redis' },
      ],
      learns: [2],
    },
    {
      id: 'token-tradeoffs',
      label: 'Token traps',
      kind: 'watch-out',
      title: 'Signed tokens are hard to revoke early',
      body: [
        'Self-contained tokens have a catch: if a user logs out or a laptop is stolen, that JWT remains valid until its `exp` timestamp unless you check a shared revocation list—which brings back a network lookup!',
        'Keep JWTs short-lived (`5–15 min`), or stick to opaque session IDs in Redis when instant revocation matters.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'JWT payloads are base64-encoded, not encrypted—anyone can read them, so never embed secrets.',
        },
      ],
      ops: [
        { op: 'update-node', id: 'redis', patch: { state: 'normal' } },
        {
          op: 'update-note',
          id: 'jwt-note',
          patch: { text: 'Stolen JWT valid till exp', tone: 'bad' },
        },
        {
          op: 'packet',
          edge: 'users-lb',
          kind: 'error',
          label: 'Revoke?',
          wave: 0,
        },
      ],
    },
    {
      id: 'store-dependency',
      label: 'Store SPOF',
      kind: 'watch-out',
      title: 'Your shared store becomes a critical tier',
      body: [
        'Moving sessions to Redis lets app instances come and go freely, yet every request now depends on that store.',
        'Replicate the session store across availability zones and set strict network timeouts (`~50 ms`) so a slow cache never hangs every app worker.',
      ],
      changes: [{ type: 'added', text: 'Standby Redis replica for failover' }],
      ops: [
        { op: 'remove-note', id: 'jwt-note' },
        {
          op: 'update-node',
          id: 'redis',
          patch: { state: 'hot', badge: 'Replicate!' },
        },
        {
          op: 'add-node',
          node: {
            id: 'redis-rep',
            kind: 'replica',
            at: { x: 12, y: 8 },
            label: 'Redis replica',
            sublabel: 'Standby AZ-2',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'redis-sync',
            from: 'redis',
            to: 'redis-rep',
            label: 'sync',
            style: 'dashed',
          },
        },
        {
          op: 'add-note',
          note: {
            id: 'timeout-note',
            anchor: { node: 'redis' },
            text: 'Set 50 ms timeout',
            tone: 'info',
            icon: 'timer',
          },
        },
        {
          op: 'set-metric',
          id: 'store',
          value: 'Replicated Redis',
          tone: 'good',
        },
      ],
      learns: [1],
    },
    {
      id: 'where-state-lives',
      label: 'State map',
      kind: 'technique',
      title: 'Put every kind of state in its right home',
      body: [
        'Sessions are not the only trap: local temp files, uploaded avatars, and in-process cron queues also tie users to one machine.',
        'Keep app servers purely stateless compute: store **durable records** in a database, **files** in object storage, **background jobs** in a queue, and **sessions** in Redis or signed tokens.',
      ],
      changes: [{ type: 'added', text: 'State placement reference map' }],
      ops: [
        { op: 'remove-note', id: 'timeout-note' },
        {
          op: 'update-node',
          id: 'redis',
          patch: { state: 'normal', badge: null },
        },
        { op: 'update-node', id: 'redis-rep', patch: { state: 'normal' } },
        {
          op: 'add-note',
          note: {
            id: 'state-map',
            anchor: { at: { x: 2.5, y: 1 } },
            text: 'Where state belongs',
            tone: 'good',
            icon: 'layers',
            rows: [
              ['Sessions', 'Redis / JWT'],
              ['Uploads', 'Object storage'],
              ['Orders', 'Database'],
              ['App tier', 'Zero local state'],
            ],
          },
        },
      ],
      learns: [3],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Disposable servers make scaling effortless',
      body: [
        'Stateless services treat every compute instance as replaceable. Externalise sessions, uploads, and queues so deploys, crashes, and autoscaling happen invisibly to users.',
      ],
      ops: [
        { op: 'packet', edge: 'users-lb', kind: 'request', wave: 0 },
        { op: 'packet', edge: 'lb-2', kind: 'request', wave: 1 },
        { op: 'packet', edge: 'app2-redis', kind: 'request', wave: 2 },
      ],
      takeaways: [
        'Never store login sessions or uploads in local server memory or disk',
        'Shared session stores (Redis) give instant revocation and survive deploys, provided they are replicated with timeouts',
        'Signed tokens (JWT) verify locally without a store lookup, but cannot easily be revoked before expiry',
        'Stateless compute + externalised state lets load balancers and autoscalers add or kill nodes anytime',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-ram-logout',
      kind: 'choice',
      prompt:
        'Why do rolling deploys log users out when an app stores sessions in process memory?',
      options: [
        'Restarting a process wipes its local RAM, and other instances do not have those session keys',
        'Load balancers strip HTTP cookies during deploys',
        'Browsers clear local storage whenever a TLS certificate renews',
      ],
      answer: 0,
      explain:
        'Each server process has isolated RAM; rebooting it discards every session held in memory, and peer servers reject unknown session IDs.',
      step: 'ram-sessions',
    },
    {
      id: 'choice-redis-vs-jwt',
      kind: 'choice',
      prompt:
        'A security requirement demands that clicking "Sign out all devices" invalidates compromised sessions within 1 second. Which approach fits best?',
      options: [
        'Opaque session IDs stored in a replicated Redis cluster',
        'Long-lived 30-day JWTs verified without any backend store',
        'Storing sessions in a single server’s local RAM with sticky cookies',
      ],
      answer: 0,
      explain:
        'Deleting an opaque session key in Redis immediately invalidates the session everywhere; stateless JWTs stay valid until expiration unless checked against a shared revocation store.',
      step: 'token-tradeoffs',
    },
    {
      id: 'order-stateless-migration',
      kind: 'order',
      prompt:
        'Order the steps to make a stateful two-server web tier safe for zero-downtime rolling deploys.',
      items: [
        'Provision a replicated Redis session store',
        'Update app instances to read/write sessions from Redis instead of local RAM',
        'Move uploaded user media from local disk to object storage',
        'Remove sticky-session pinning on the load balancer',
      ],
      explain:
        'Externalise both sessions and uploaded files first so instances hold no unique state, then let the load balancer route freely across servers.',
      step: 'where-state-lives',
    },
    {
      id: 'numeric-redis-session-memory',
      kind: 'numeric',
      prompt:
        'Each user session object takes 2 KB in Redis. How many megabytes (MB, using 1,000 KB per MB) of memory do 50,000 concurrent sessions require?',
      unit: 'MB',
      answer: 100,
      tolerance: 0.05,
      explain:
        '50,000 sessions × 2 KB = 100,000 KB = 100 MB, which fits comfortably in a small replicated Redis instance.',
      step: 'shared-store',
    },
  ],
  cards: [
    {
      front: 'What makes a web service "stateless"?',
      back: 'It stores no user or request state between calls in local memory or disk, so any instance in the pool can handle any request identically.',
    },
    {
      front: 'Compare shared session stores (Redis) vs signed tokens (JWT).',
      back: '• Redis: easy instant revocation, tiny cookie ID, adds a fast network hop and dependency.\n• JWT: zero lookup to verify signature, harder to revoke early, payload readable unless encrypted.',
    },
    {
      front: 'What precaution must you take after moving sessions to Redis?',
      back: 'Replicate Redis across failure domains and configure strict client timeouts so the shared store does not become a single point of failure.',
    },
    {
      front:
        'Where should different kinds of application state live in a scalable design?',
      back: '• Sessions: Redis / signed tokens\n• Durable records: Database\n• Blobs & uploads: Object storage\n• Background work: Message queue',
    },
  ],
} satisfies Lesson;
