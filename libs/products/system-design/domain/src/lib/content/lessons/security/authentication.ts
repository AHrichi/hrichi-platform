import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 07.01: Authentication (`authentication`).
 * Scenario: Log in once, stay logged in (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'authentication',
  learn: [
    'Why passwords need salted, slow hashes like Argon2id',
    'Stateful server sessions vs stateless signed JWTs',
    'Short-lived access tokens paired with rotating refresh',
    'How OAuth 2.0 and OIDC delegate login to an IdP',
    'Why MFA stops stolen passwords from taking over accounts',
  ],
  scene: {
    nodes: [
      {
        id: 'browser',
        kind: 'client',
        at: { x: 1, y: 4 },
        label: 'Browser',
        sublabel: 'NotesApp web',
      },
      {
        id: 'auth-svc',
        kind: 'server',
        at: { x: 6, y: 4 },
        label: 'Auth Server',
        sublabel: 'POST /login',
      },
      {
        id: 'users-db',
        kind: 'database',
        at: { x: 11, y: 4 },
        label: 'Users DB',
        sublabel: 'Credentials',
      },
    ],
    edges: [
      {
        id: 'browser-auth',
        from: 'browser',
        to: 'auth-svc',
        label: 'HTTPS',
      },
      {
        id: 'auth-db',
        from: 'auth-svc',
        to: 'users-db',
        label: 'SQL',
      },
    ],
    zones: [
      {
        id: 'backend-zone',
        from: { x: 4, y: 1 },
        to: { x: 12, y: 7 },
        hue: 'green',
        label: 'Backend cloud',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'auth-state', label: 'Proof', icon: 'key', value: 'Password' },
    { id: 'hash-time', label: 'Hash cost', icon: 'hash', value: '—' },
    { id: 'token-ttl', label: 'Token TTL', icon: 'timer', value: '—' },
    { id: 'risk', label: 'Takeover risk', icon: 'shield', value: 'High' },
  ],
  steps: [
    {
      id: 'login-once',
      label: 'Login once',
      kind: 'problem',
      title: 'Prove who you are once, not on every click',
      body: [
        'You sign in to **NotesApp** with an email and password, then open fifty notes over the next week without retyping your password.',
        'Sending your raw password on every API click would leak it into browser memory and proxies. **Authentication** (`AuthN`) checks your password once and swaps it for a safer, bounded proof.',
      ],
      ops: [
        { op: 'update-node', id: 'auth-svc', patch: { state: 'focus' } },
        {
          op: 'packet',
          edge: 'browser-auth',
          kind: 'request',
          label: 'POST /login',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'browser-auth',
          kind: 'response',
          reverse: true,
          label: '200 OK',
          wave: 1,
        },
      ],
    },
    {
      id: 'password-hashing',
      label: 'Password hash',
      kind: 'technique',
      title: 'Hash passwords slowly with per-user salts',
      body: [
        'Never store plaintext passwords—or fast hashes like `SHA-256`, which GPUs brute-force at billions of guesses per second.',
        'Store a **salted, memory-hard hash** using **Argon2id** (or **bcrypt**). A random per-user **salt** defeats precomputed tables, and tuning work cost to **~100 ms** makes cracking millions of leaked rows prohibitively expensive.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'Fast hashes check file integrity; password hashes (Argon2id, bcrypt) are intentionally slow and salted.',
        },
      ],
      changes: [
        {
          type: 'added',
          text: 'Argon2id + per-user salt policy on Users DB',
        },
        { type: 'changed', text: 'Hash cost set to 100 ms' },
      ],
      ops: [
        { op: 'update-node', id: 'auth-svc', patch: { state: 'normal' } },
        { op: 'update-node', id: 'users-db', patch: { state: 'focus' } },
        {
          op: 'add-note',
          note: {
            id: 'hash-note',
            anchor: { node: 'users-db' },
            text: 'Argon2id + 16 B salt',
            tone: 'good',
            icon: 'hash',
          },
        },
        {
          op: 'packet',
          edge: 'auth-db',
          kind: 'request',
          label: 'verify hash',
          wave: 0,
        },
        {
          op: 'set-metric',
          id: 'hash-time',
          value: '100 ms',
          tone: 'good',
        },
      ],
      learns: [0],
    },
    {
      id: 'server-sessions',
      label: 'Sessions',
      kind: 'technique',
      title: 'Stateful sessions store a random id in Redis',
      body: [
        'Once verified, **Auth Server** generates a random **session id** (128+ bits from an OS CSPRNG), saves `{userId, exp}` in **Session Redis**, and sets an `HttpOnly`, `Secure`, `SameSite` cookie.',
        '**Notes API** looks up that session id on each call. Logout or kicking out a compromised device is instant: delete one key in Redis.',
      ],
      changes: [
        { type: 'added', text: 'Notes API and shared Session Redis store' },
        { type: 'changed', text: 'Proof switched to Session cookie' },
      ],
      ops: [
        { op: 'update-node', id: 'users-db', patch: { state: 'normal' } },
        {
          op: 'add-node',
          node: {
            id: 'notes-api',
            kind: 'service',
            at: { x: 7, y: 2 },
            label: 'Notes API',
            sublabel: 'App cluster',
            state: 'focus',
          },
        },
        {
          op: 'add-node',
          node: {
            id: 'session-cache',
            kind: 'cache',
            at: { x: 10, y: 2 },
            label: 'Session Redis',
            sublabel: 'Shared store',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'browser-notes',
            from: 'browser',
            to: 'notes-api',
            label: 'Cookie: sid',
            route: 'elbow-y',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'auth-redis',
            from: 'auth-svc',
            to: 'session-cache',
            label: 'SET sid',
            route: 'elbow-x',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'notes-redis',
            from: 'notes-api',
            to: 'session-cache',
            label: 'GET sid',
          },
        },
        {
          op: 'packet',
          edge: 'auth-redis',
          kind: 'write',
          label: 'SET sid',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'browser-notes',
          kind: 'request',
          label: 'GET /notes',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'notes-redis',
          kind: 'request',
          label: 'lookup',
          wave: 2,
        },
        { op: 'set-metric', id: 'auth-state', value: 'Session cookie' },
        { op: 'set-metric', id: 'token-ttl', value: '24 h sliding' },
      ],
      learns: [1],
    },
    {
      id: 'jwt-tokens',
      label: 'Signed JWTs',
      kind: 'technique',
      title: 'Stateless JWTs verify locally without a lookup',
      body: [
        'To skip the Redis lookup on every request, **Auth Server** can sign a **JWT** (_JSON Web Token_) carrying `{sub, exp}` with its private key (`Ed25519`).',
        '**Notes API** caches the public key and verifies the signature locally in microseconds—making reads stateless across every server instance.',
      ],
      changes: [
        { type: 'changed', text: 'Notes API verifies JWT signatures locally' },
        { type: 'changed', text: 'Session Redis bypassed on API reads' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'session-cache',
          patch: { state: 'dim' },
        },
        {
          op: 'update-edge',
          id: 'notes-redis',
          patch: { state: 'dim', style: 'dashed' },
        },
        {
          op: 'update-edge',
          id: 'browser-notes',
          patch: { label: 'Bearer JWT' },
        },
        {
          op: 'update-node',
          id: 'notes-api',
          patch: { badge: 'public key' },
        },
        {
          op: 'add-note',
          note: {
            id: 'api-note',
            anchor: { node: 'notes-api' },
            text: 'Verify Ed25519 locally',
            tone: 'info',
            icon: 'key',
          },
        },
        {
          op: 'packet',
          edge: 'browser-notes',
          kind: 'request',
          label: 'Bearer JWT',
          wave: 0,
        },
        { op: 'set-metric', id: 'auth-state', value: 'Signed JWT' },
      ],
      learns: [1],
    },
    {
      id: 'jwt-trap',
      label: 'JWT revocation',
      kind: 'watch-out',
      title: 'Stolen long-lived JWTs cannot be easily revoked',
      body: [
        'Stateless trust has a sharp catch: if a **30-day JWT** leaks via XSS or a stolen laptop, deleting a database row will **not** reject it until `exp` passes.',
        'Also remember: a JWT payload is **Base64-encoded**, not encrypted—anyone holding it can read its claims.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Never store secrets in JWT claims, and never issue long-lived access JWTs you cannot revoke.',
        },
      ],
      changes: [
        {
          type: 'changed',
          text: 'Leaked 30-day JWT keeps passing local signature checks',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'notes-api',
          patch: { state: 'hot', badge: 'no revoke!' },
        },
        {
          op: 'update-note',
          id: 'api-note',
          patch: { text: 'Valid for 30 days!', tone: 'bad' },
        },
        {
          op: 'packet',
          edge: 'browser-notes',
          kind: 'error',
          label: 'stolen 30d JWT',
          wave: 0,
        },
        { op: 'set-metric', id: 'token-ttl', value: '30 d!', tone: 'bad' },
        {
          op: 'set-metric',
          id: 'risk',
          value: 'High (stuck)',
          tone: 'bad',
        },
      ],
    },
    {
      id: 'refresh-rotation',
      label: 'Refresh tokens',
      kind: 'case',
      title: 'Short access JWTs + rotating refresh tokens',
      body: [
        'Pair a **10-minute access JWT** (kept in memory) with a **14-day opaque refresh token** in an `HttpOnly` cookie tracked in **Redis**.',
        'Every refresh returns a new pair and invalidates the old refresh token. If a stolen refresh token is replayed after rotation, **Auth Server** detects reuse and revokes the entire token family.',
      ],
      changes: [
        {
          type: 'changed',
          text: 'Access JWT capped at 10 min; Redis tracks rotating refresh families',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'notes-api',
          patch: { state: 'normal', badge: '10m JWT' },
        },
        {
          op: 'update-node',
          id: 'session-cache',
          patch: {
            state: 'focus',
            label: 'Token Store',
            sublabel: 'Refresh families',
          },
        },
        {
          op: 'update-note',
          id: 'api-note',
          patch: { text: '10m TTL + reuse check', tone: 'good' },
        },
        {
          op: 'packet',
          edge: 'browser-auth',
          kind: 'request',
          label: 'POST /refresh',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'auth-redis',
          kind: 'write',
          label: 'rotate family',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'browser-auth',
          kind: 'response',
          reverse: true,
          label: 'new 10m JWT',
          wave: 2,
        },
        { op: 'set-metric', id: 'auth-state', value: 'JWT + Refresh' },
        {
          op: 'set-metric',
          id: 'token-ttl',
          value: '10 m / 14 d',
          tone: 'good',
        },
        { op: 'set-metric', id: 'risk', value: 'Contained', tone: 'good' },
      ],
      learns: [2],
    },
    {
      id: 'oauth-oidc',
      label: 'OAuth & OIDC',
      kind: 'technique',
      title: 'Delegate login with OAuth 2.0 and OIDC',
      body: [
        'Rather than holding passwords yourself, redirect users to a trusted **Identity Provider** (`IdP`) using **OAuth 2.0** + **OIDC** (_OpenID Connect_).',
        'After the user signs in, your backend exchanges the short-lived authorization code (protected by **PKCE**) for an **ID token** (who logged in, for your app) and an **access token** (for permitted scopes).',
      ],
      changes: [
        {
          type: 'added',
          text: 'External Identity Provider (OIDC + PKCE flow)',
        },
      ],
      ops: [
        { op: 'update-node', id: 'session-cache', patch: { state: 'normal' } },
        {
          op: 'add-node',
          node: {
            id: 'idp',
            kind: 'external',
            at: { x: 1, y: 1 },
            label: 'Identity Provider',
            sublabel: 'OAuth 2.0 / OIDC',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'browser-idp',
            from: 'browser',
            to: 'idp',
            label: 'Redirect + PKCE',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'auth-idp',
            from: 'auth-svc',
            to: 'idp',
            label: 'Code → tokens',
            style: 'dashed',
            route: 'straight',
          },
        },
        {
          op: 'packet',
          edge: 'browser-idp',
          kind: 'request',
          label: 'user login',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'auth-idp',
          kind: 'request',
          label: 'exchange code',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'auth-idp',
          kind: 'response',
          reverse: true,
          label: 'ID + Access JWT',
          wave: 2,
        },
        { op: 'set-metric', id: 'auth-state', value: 'OIDC + PKCE' },
      ],
      learns: [3],
    },
    {
      id: 'mfa',
      label: 'Add MFA',
      kind: 'technique',
      title: 'Require a second factor beyond the password',
      body: [
        'Passwords still get phished or reused from old breaches. **MFA** (_Multi-Factor Authentication_) demands two independent proofs: something you **know** (password), something you **have** (**TOTP** app or **WebAuthn/passkey**), or something you **are**.',
        'Phishing-resistant passkeys sign a challenge bound to the exact domain, blocking look-alike login sites.',
      ],
      changes: [
        {
          type: 'changed',
          text: 'Passkey / TOTP second factor enforced on sign-in',
        },
      ],
      ops: [
        { op: 'remove-note', id: 'api-note' },
        {
          op: 'update-node',
          id: 'browser',
          patch: { state: 'focus', badge: 'Passkey / MFA' },
        },
        { op: 'update-node', id: 'idp', patch: { state: 'normal' } },
        {
          op: 'packet',
          edge: 'browser-idp',
          kind: 'handshake',
          label: 'WebAuthn signed',
          wave: 0,
        },
        {
          op: 'set-metric',
          id: 'auth-state',
          value: 'OIDC + MFA',
          tone: 'good',
        },
        { op: 'set-metric', id: 'risk', value: 'Very low', tone: 'good' },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Verify once, bound every credential’s lifetime',
      body: [
        'Solid authentication pairs slow, salted hashing (or federated **OIDC** + **MFA**) with short-lived access credentials and revocable refresh rotation, keeping blast radius tiny when a token leaks.',
      ],
      ops: [
        { op: 'remove-note', id: 'hash-note' },
        {
          op: 'update-node',
          id: 'browser',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'notes-api',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'auth-summary',
            anchor: { at: { x: 8, y: 7 } },
            text: 'AuthN layers',
            tone: 'good',
            icon: 'shield',
            rows: [
              ['Password store', 'Argon2id + salt'],
              ['Access token', '10 min JWT'],
              ['Refresh token', 'Rotated + family'],
              ['Second factor', 'Passkey / TOTP'],
            ],
            total: ['Delegated SSO', 'OAuth 2.0 + OIDC'],
          },
        },
      ],
      takeaways: [
        'Hash passwords with salted, memory-hard algorithms like Argon2id or bcrypt—never fast hashes like SHA-256',
        'Server sessions revoke immediately; stateless JWTs trade instant revocation for local signature checks',
        'Pair 5–15 minute access JWTs with rotating HttpOnly refresh tokens that revoke the whole family on reuse',
        'Use OAuth 2.0 + OIDC (with PKCE) to delegate sign-in and require phishing-resistant MFA such as passkeys',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-password-hash',
      kind: 'choice',
      prompt:
        'Why should a backend hash user passwords with Argon2id or bcrypt instead of SHA-256?',
      options: [
        'Argon2id and bcrypt use unique salts and high CPU/memory cost to slow down brute-force cracking',
        'SHA-256 produces shorter strings that cannot fit in a database column',
        'Argon2id encrypts the password so the server can decrypt and email it back',
      ],
      answer: 0,
      explain:
        'SHA-256 is built for speed, allowing GPUs to test billions of guesses per second; Argon2id and bcrypt add per-user salts and configurable work cost.',
      step: 'password-hashing',
    },
    {
      id: 'choice-jwt-revocation',
      kind: 'choice',
      prompt:
        'A user reports a stolen laptop while holding a stateless 30-day JWT access token. Why is logging that device out immediately difficult?',
      options: [
        'Services verify the JWT signature locally without consulting a central store, so the token stays valid until exp',
        'JWT signatures change automatically every minute',
        'Browsers refuse to delete HttpOnly cookies even on logout',
      ],
      answer: 0,
      explain:
        'Because stateless JWTs are self-contained and verified locally, invalidating one before expiry requires short lifetimes or introducing a shared deny list.',
      step: 'jwt-trap',
    },
    {
      id: 'numeric-access-ttl',
      kind: 'numeric',
      prompt:
        'Your auth service issues 10-minute access JWTs and 14-day rotating refresh tokens. If a single access JWT is copied from memory without the refresh token, at most how many minutes does it remain usable?',
      unit: 'minutes',
      answer: 10,
      tolerance: 0.05,
      explain:
        'Without the refresh token to mint a new pair, a stolen 10-minute access JWT stops passing expiry checks after 10 minutes.',
      step: 'refresh-rotation',
    },
    {
      id: 'order-oidc-flow',
      kind: 'order',
      prompt:
        'Put the steps of an OAuth 2.0 + OIDC authorization-code login in order.',
      items: [
        'App redirects browser to the Identity Provider with a PKCE challenge',
        'User signs in and passes MFA at the Identity Provider',
        'Browser returns to the app with a short-lived authorization code',
        'Backend exchanges the code + PKCE verifier for an ID token and access token',
      ],
      explain:
        'The browser authenticates directly at the IdP, returns a one-time code, and the backend safely exchanges that code for tokens over a back-channel call.',
      step: 'oauth-oidc',
    },
  ],
  cards: [
    {
      front: 'Why use Argon2id or bcrypt for passwords instead of SHA-256?',
      back: 'Passwords need per-user salts and deliberately slow, memory-hard hashing so leaked password tables resist GPU brute-forcing.',
    },
    {
      front:
        'What is the trade-off between server sessions and stateless JWTs?',
      back: 'Server sessions allow instant revocation by deleting a Redis/DB row; stateless JWTs verify locally without a lookup but stay valid until exp unless denied.',
    },
    {
      front:
        'How does the "short access + rotating refresh" pattern detect token theft?',
      back: 'Access JWTs expire in 5–15 minutes, while each refresh use replaces the refresh token; if an already-used refresh token is replayed, the server revokes the whole token family.',
    },
    {
      front:
        'In OAuth 2.0 + OIDC, how does an ID token differ from an access token?',
      back: 'The ID token is a JWT telling the client who signed in (never sent to APIs); the access token authorizes calls to protected API scopes.',
    },
    {
      front: 'Why do passkeys (WebAuthn) beat SMS codes for MFA?',
      back: 'Passkeys cryptographically bind the signature to the exact site domain, preventing attackers from stealing codes on phishing pages or via SIM swaps.',
    },
  ],
} satisfies Lesson;
