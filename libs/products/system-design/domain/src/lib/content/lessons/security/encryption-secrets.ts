import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 07.03: Encryption & Secrets (`encryption-secrets`).
 * Scenario: An API key leaked in a repo (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'encryption-secrets',
  learn: [
    'How TLS 1.3 protects traffic in transit against snooping',
    'Symmetric AEAD encryption (AES-256-GCM) for data at rest',
    'How KMS and envelope encryption scale key rotation',
    'Secret managers, short-lived credentials, and rotation',
    'Why hashing, encryption, and encoding solve different jobs',
  ],
  scene: {
    nodes: [
      {
        id: 'git-repo',
        kind: 'storage',
        at: { x: 1, y: 2 },
        label: 'Git Repo',
        sublabel: 'Commit history',
      },
      {
        id: 'client',
        kind: 'client',
        at: { x: 1, y: 5 },
        label: 'Client App',
        sublabel: 'Checkout UI',
      },
      {
        id: 'api-srv',
        kind: 'server',
        at: { x: 6, y: 5 },
        label: 'Billing API',
        sublabel: 'App server',
      },
      {
        id: 'data-db',
        kind: 'database',
        at: { x: 11, y: 5 },
        label: 'Billing DB',
        sublabel: 'Customer rows',
      },
      {
        id: 'stripe-ext',
        kind: 'external',
        at: { x: 6, y: 8 },
        label: 'Payment API',
        sublabel: 'External gateway',
      },
    ],
    edges: [
      {
        id: 'git-api',
        from: 'git-repo',
        to: 'api-srv',
        label: '.env deploy',
        style: 'dashed',
        route: 'straight',
      },
      {
        id: 'client-api',
        from: 'client',
        to: 'api-srv',
        label: 'HTTP?',
      },
      {
        id: 'api-db',
        from: 'api-srv',
        to: 'data-db',
        label: 'SQL',
      },
      {
        id: 'api-stripe',
        from: 'api-srv',
        to: 'stripe-ext',
        label: 'API key',
      },
    ],
    zones: [
      {
        id: 'cloud-zone',
        from: { x: 4, y: 1 },
        to: { x: 12, y: 7 },
        hue: 'green',
        label: 'Production cloud',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'in-transit', label: 'In transit', icon: 'lock', value: 'TLS 1.3' },
    { id: 'at-rest', label: 'At rest', icon: 'database', value: 'Plaintext!' },
    { id: 'secret-store', label: 'API key', icon: 'key', value: 'In Git!' },
    { id: 'exposure', label: 'Exposure', icon: 'warning', value: 'Critical' },
  ],
  steps: [
    {
      id: 'leaked-key',
      label: 'Key leaked',
      kind: 'problem',
      title: 'An API key in Git gets scraped in seconds',
      body: [
        'A developer commits `.env` containing `PAY_KEY=sk_live_9f3a...` to your repository. Bots scrape the commit in seconds and run unauthorized charges against your **Payment API**.',
        'Deleting the key in a follow-up commit still leaves it sitting in **Git history**, while customer billing records on disk remain unencrypted.',
      ],
      ops: [
        {
          op: 'update-node',
          id: 'git-repo',
          patch: { state: 'hot', badge: 'sk_live_ leak!' },
        },
        { op: 'update-node', id: 'stripe-ext', patch: { state: 'hot' } },
        {
          op: 'packet',
          edge: 'git-api',
          kind: 'error',
          label: 'scraped from Git',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'api-stripe',
          kind: 'error',
          label: 'abuse charges',
          wave: 1,
        },
      ],
    },
    {
      id: 'tls-transit',
      label: 'In transit',
      kind: 'technique',
      title: 'TLS 1.3 encrypts traffic in transit',
      body: [
        'First, protect bytes moving over networks. **TLS 1.3** authenticates the server’s certificate, negotiates ephemeral session keys (`X25519` for forward secrecy), and wraps every message in **AEAD** (_Authenticated Encryption with Associated Data_).',
        'Run TLS on public links and **mTLS** between internal services so snooping or tampering fails anywhere along the wire.',
      ],
      changes: [
        {
          type: 'changed',
          text: 'External and backend links upgraded to TLS 1.3',
        },
      ],
      ops: [
        { op: 'update-node', id: 'client', patch: { state: 'focus' } },
        { op: 'update-node', id: 'stripe-ext', patch: { state: 'normal' } },
        {
          op: 'update-edge',
          id: 'client-api',
          patch: { label: 'TLS 1.3' },
        },
        {
          op: 'update-edge',
          id: 'api-stripe',
          patch: { label: 'TLS 1.3' },
        },
        {
          op: 'packet',
          edge: 'client-api',
          kind: 'handshake',
          label: 'X25519 + cert',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'client-api',
          kind: 'request',
          label: 'AEAD payload',
          wave: 1,
        },
      ],
      learns: [0],
    },
    {
      id: 'at-rest',
      label: 'At rest',
      kind: 'technique',
      title: 'Encrypt stored disks and sensitive fields',
      body: [
        'TLS protects traffic only while moving; once **Billing DB** writes bytes to SSD or backups, TLS is gone.',
        '**Encryption at rest** uses fast symmetric **AEAD** (`AES-256-GCM` or `ChaCha20-Poly1305`) so stolen disks or snapshots yield unreadable ciphertext plus a tamper-detecting tag. Add application-level field encryption when even DB admins must not read values.',
      ],
      changes: [
        { type: 'added', text: 'AES-256-GCM encryption at rest on Billing DB' },
      ],
      ops: [
        { op: 'update-node', id: 'client', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'data-db',
          patch: { state: 'focus', badge: 'AES-256-GCM' },
        },
        {
          op: 'add-note',
          note: {
            id: 'db-note',
            anchor: { node: 'data-db' },
            text: 'Ciphertext + auth tag',
            tone: 'good',
            icon: 'lock',
          },
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'write',
          label: 'encrypted row',
          wave: 0,
        },
        {
          op: 'set-metric',
          id: 'at-rest',
          value: 'AES-256-GCM',
          tone: 'good',
        },
      ],
      learns: [1],
    },
    {
      id: 'kms-envelope',
      label: 'Envelope KMS',
      kind: 'technique',
      title: 'Envelope encryption scales KMS key rotation',
      body: [
        'Sending gigabytes through a **KMS** (_Key Management Service_) is slow, yet one static key makes rotation painful.',
        '**Envelope encryption** uses two tiers: **Billing API** generates a unique **DEK** (_Data Encryption Key_) locally to encrypt data fast, asks KMS to wrap that tiny DEK with a master **KEK** (_Key Encryption Key_) that never leaves KMS, and stores the wrapped DEK beside the ciphertext.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'KMS wraps tiny data keys (DEKs) with its master key (KEK), avoiding bulk data trips and simplifying rotation.',
        },
      ],
      changes: [
        {
          type: 'added',
          text: 'Cloud KMS holding master KEK for DEK wrapping',
        },
      ],
      ops: [
        { op: 'update-node', id: 'data-db', patch: { state: 'normal' } },
        {
          op: 'add-node',
          node: {
            id: 'kms',
            kind: 'service',
            at: { x: 10, y: 2 },
            label: 'Cloud KMS',
            sublabel: 'Master KEK',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-kms',
            from: 'api-srv',
            to: 'kms',
            label: 'Wrap DEK',
            route: 'elbow-y',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'kms-db',
            from: 'kms',
            to: 'data-db',
            label: 'key ref',
            style: 'dashed',
            route: 'elbow-x',
          },
        },
        {
          op: 'update-note',
          id: 'db-note',
          patch: { text: 'Ciphertext + wrapped DEK' },
        },
        {
          op: 'packet',
          edge: 'api-kms',
          kind: 'request',
          label: 'encrypt DEK',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'api-kms',
          kind: 'response',
          reverse: true,
          label: 'wrapped DEK',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'api-db',
          kind: 'write',
          label: 'row + wrapped DEK',
          wave: 2,
        },
      ],
      learns: [2],
    },
    {
      id: 'secret-manager',
      label: 'Secret manager',
      kind: 'technique',
      title: 'Store API keys in a Secret Manager and rotate',
      body: [
        'Remove credentials from Git and `.env` files completely. Hold `PAY_KEY` in a **Secret Manager** and fetch it at runtime using the server’s workload identity (IAM).',
        'Revoke the leaked v1 key immediately and adopt **two-version rotation** so running servers switch smoothly to v2 before the old key expires.',
      ],
      changes: [
        { type: 'added', text: 'Secret Manager with IAM-scoped runtime fetch' },
        { type: 'changed', text: 'API key moved out of Git and rotated to v2' },
      ],
      ops: [
        { op: 'update-node', id: 'kms', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'git-repo',
          patch: { state: 'dim', badge: 'v1 revoked' },
        },
        {
          op: 'add-node',
          node: {
            id: 'secret-mgr',
            kind: 'gateway',
            at: { x: 7, y: 2 },
            label: 'Secret Manager',
            sublabel: 'IAM-scoped',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'api-sm',
            from: 'api-srv',
            to: 'secret-mgr',
            label: 'Fetch v2',
            route: 'elbow-x',
          },
        },
        {
          op: 'packet',
          edge: 'api-sm',
          kind: 'request',
          label: 'IAM identity',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'api-sm',
          kind: 'response',
          reverse: true,
          label: 'PAY_KEY v2',
          wave: 1,
        },
        {
          op: 'set-metric',
          id: 'secret-store',
          value: 'Secret Manager',
          tone: 'good',
        },
        {
          op: 'set-metric',
          id: 'exposure',
          value: 'Contained',
          tone: 'good',
        },
      ],
      learns: [3],
    },
    {
      id: 'hash-vs-encrypt',
      label: 'Hash ≠ Encrypt',
      kind: 'technique',
      title: 'Hashing, encryption and encoding differ',
      body: [
        'Never mix up three distinct tools: **Hashing** (`SHA-256`, `Argon2id`) is **one-way**—ideal for passwords and integrity checks, never reversible.',
        '**Encryption** (`AES-256-GCM`) is **reversible only with the key**. **Encoding** (`Base64`, URL encoding) only changes format and offers **zero secrecy**.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Comparison table: Hashing vs Encryption vs Encoding',
        },
      ],
      ops: [
        { op: 'update-node', id: 'secret-mgr', patch: { state: 'normal' } },
        {
          op: 'add-note',
          note: {
            id: 'crypto-table',
            anchor: { at: { x: 9, y: 8 } },
            text: 'Three primitives',
            tone: 'info',
            icon: 'hash',
            rows: [
              ['Hashing', 'One-way check'],
              ['Encryption', 'Two-way w/ key'],
              ['Encoding', 'Public format'],
            ],
          },
        },
      ],
      learns: [4],
    },
    {
      id: 'key-sprawl',
      label: 'Key sprawl',
      kind: 'watch-out',
      title: 'Do not rely on Git cleanup or wildcard KMS IAM',
      body: [
        'Two common mistakes undo hard work: assuming a `git revert` erased a leaked key (bots scrape commits immediately, so **always rotate**), and granting every service `kms:Decrypt` on every KEK.',
        'If one worker is compromised under wildcard KMS access, attackers unwrap every tenant’s DEK. Scope keys per service and alert on KMS decrypt spikes.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Removing a secret from Git HEAD never un-leaks it: treat any committed secret as stolen and rotate it.',
        },
      ],
      changes: [
        {
          type: 'changed',
          text: 'KMS permissions audited to eliminate wildcard decrypt',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'kms',
          patch: { state: 'hot', badge: 'scope kms:Decrypt' },
        },
        {
          op: 'packet',
          edge: 'api-kms',
          kind: 'error',
          label: 'audit IAM policy',
          wave: 0,
        },
      ],
    },
    {
      id: 'commit-prevention',
      label: 'Guardrails',
      kind: 'case',
      title: 'Block leaks early; prefer short-lived tokens',
      body: [
        'Design for human mistakes. Add **pre-commit secret scanners** and **push protection** on your Git host so commits containing `sk_live_` are blocked before upload.',
        'Better yet, replace static API keys with **short-lived workload tokens** (OIDC federation or 1-hour database leases) so leaked credentials expire automatically.',
      ],
      changes: [
        {
          type: 'changed',
          text: 'Push protection enabled and KMS IAM scoped per service',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'kms',
          patch: { state: 'normal', badge: 'scoped IAM' },
        },
        {
          op: 'update-node',
          id: 'git-repo',
          patch: { state: 'normal', badge: 'push-block on' },
        },
        {
          op: 'packet',
          edge: 'api-stripe',
          kind: 'request',
          label: 'scoped + rotated v2',
          wave: 0,
        },
        {
          op: 'set-metric',
          id: 'exposure',
          value: 'Minimal',
          tone: 'good',
        },
      ],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Encrypt everywhere; keep secrets out of code',
      body: [
        'Protect traffic on the wire with **TLS 1.3**, protect stored data with **AES-256-GCM** + **KMS envelope encryption**, keep keys out of repos in a **Secret Manager**, and rotate fast when leaks happen.',
      ],
      ops: [
        { op: 'remove-note', id: 'db-note' },
        { op: 'remove-note', id: 'crypto-table' },
        {
          op: 'update-node',
          id: 'git-repo',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'data-db',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'kms',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'add-note',
          note: {
            id: 'crypto-recap',
            anchor: { at: { x: 9, y: 8 } },
            text: 'Defence in depth',
            tone: 'good',
            icon: 'lock',
            rows: [
              ['In transit', 'TLS 1.3 / mTLS'],
              ['At rest', 'AES-256-GCM'],
              ['Key scaling', 'KMS envelope DEK'],
              ['Secrets', 'Secret Mgr + rotate'],
            ],
            total: ['Rule', 'No secrets in Git'],
          },
        },
      ],
      takeaways: [
        'Use TLS 1.3 (and mTLS internally) to protect data in transit and AEAD (AES-256-GCM) for data at rest',
        'Use KMS envelope encryption—KEKs wrap per-object DEKs—so bulk data stays fast and key rotation is painless',
        'Keep secrets in a Secret Manager with runtime IAM injection, push protection, and fast rotation',
        'Hashing is one-way, encryption reverses with a key, and Base64 encoding provides zero confidentiality',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-envelope-encryption',
      kind: 'choice',
      prompt:
        'Why does envelope encryption generate a local Data Encryption Key (DEK) and ask KMS only to wrap that DEK with a Key Encryption Key (KEK)?',
      options: [
        'Encrypting large files locally with the DEK avoids sending bulk data to KMS over the network and makes rotating the master KEK fast',
        'KMS cannot store keys longer than 64 bits',
        'Wrapping the DEK converts symmetric encryption into one-way hashing',
      ],
      answer: 0,
      explain:
        'KMS wraps and unwraps tiny DEKs rather than streaming gigabytes of payload, keeping throughput high while centralizing master KEK control and rotation.',
      step: 'kms-envelope',
    },
    {
      id: 'choice-hash-vs-encode',
      kind: 'choice',
      prompt:
        'A teammate puts an internal API key inside a Base64-encoded header and claims it is encrypted. Why is that unsafe?',
      options: [
        'Base64 is reversible encoding without a key—anyone can decode it back to plaintext immediately',
        'Base64 is a one-way cryptographic hash, so the API server cannot verify it',
        'Base64 works only over UDP connections',
      ],
      answer: 0,
      explain:
        'Encoding only changes representation (like text to Base64) and hides nothing; encryption requires a secret key.',
      step: 'hash-vs-encrypt',
    },
    {
      id: 'order-leaked-secret-response',
      kind: 'order',
      prompt:
        'Order the right incident response when an API key is committed to a public Git repository.',
      items: [
        'Revoke the leaked key and issue a new rotated key in the Secret Manager',
        'Deploy running services using runtime Secret Manager injection instead of .env',
        'Audit Payment API and KMS logs for unauthorized usage during the leak window',
        'Enable pre-commit scanners and Git push protection to block future leaks',
      ],
      explain:
        'Bots scrape Git commits in seconds, so revoke and rotate first, verify runtime injection, audit logs for impact, then add preventative guardrails.',
      step: 'secret-manager',
    },
    {
      id: 'numeric-kms-calls',
      kind: 'numeric',
      prompt:
        'Using envelope encryption, a service encrypts 250 customer backups (each 100 MB) by generating 1 local DEK per backup and calling KMS Encrypt once per DEK. How many KMS Encrypt API calls are made in total?',
      unit: 'KMS calls',
      answer: 250,
      tolerance: 0.05,
      explain:
        'Envelope encryption makes 1 KMS Encrypt call per 100 MB backup DEK (250 tiny calls total) rather than streaming 25 GB through KMS.',
      step: 'kms-envelope',
    },
  ],
  cards: [
    {
      front:
        'How do encryption in transit (TLS 1.3) and encryption at rest differ?',
      back: 'TLS protects data while traveling across networks against eavesdroppers; encryption at rest (AES-256-GCM) protects stored disks, backups, and database rows.',
    },
    {
      front: 'Explain envelope encryption (DEK vs KEK).',
      back: 'A Data Encryption Key (DEK) encrypts bulk data fast locally; a Key Encryption Key (KEK) inside KMS encrypts (wraps) the DEK so the wrapped DEK sits safely beside the ciphertext.',
    },
    {
      front: 'Distinguish hashing, encryption, and encoding.',
      back: 'Hashing is one-way (passwords, integrity); encryption is two-way with a secret key (confidentiality); encoding (Base64) is public format conversion with zero secrecy.',
    },
    {
      front:
        'Why is deleting a secret from the latest Git commit not enough after a leak?',
      back: 'Git history preserves every prior commit and automated bots scrape pushes within seconds—any committed secret must be immediately revoked and rotated.',
    },
    {
      front: 'How do Secret Managers and workload identities protect API keys?',
      back: 'Services authenticate via short-lived cloud IAM identities to fetch secrets into memory at runtime, enabling seamless two-version rotation without storing secrets in code.',
    },
  ],
} satisfies Lesson;
