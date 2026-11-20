import type { Cheatsheet } from '../../model/cheatsheet';

/**
 * Module 07 (Security) cheatsheet: token types, crypto primitives,
 * authorization models and the rules that keep secrets secret.
 */
export const cheatsheet = {
  module: 'security',
  intro:
    'Which token or key does which job, which cryptographic tool to reach for, and where access checks belong.',
  sections: [
    {
      kind: 'table',
      title: 'Token Types',
      columns: ['Token', 'What it is', 'Lifetime', 'Kept in', 'Revoking it'],
      rows: [
        [
          'Session id',
          'A random id pointing at server-side session data',
          'Hours to days, often sliding',
          'HttpOnly, Secure, SameSite cookie',
          'Delete the server session',
        ],
        [
          'Access token (JWT)',
          'Signed, self-contained claims the API verifies locally',
          '5–15 minutes',
          'Memory; sent as a Bearer header',
          'Hard before expiry: keep it short, or keep a deny list',
        ],
        [
          'Refresh token',
          'An opaque token traded for new access tokens',
          'Days to weeks, rotated on each use',
          'HttpOnly cookie or the platform’s secure storage',
          'Revoke at the auth server; reuse signals theft',
        ],
        [
          'ID token (OIDC)',
          'A JWT telling the client who signed in',
          'Minutes',
          'The client only',
          'Not for calling APIs',
        ],
        [
          'API key',
          'A long-lived secret identifying a calling system',
          'Until rotated',
          'A secret manager, never the repo',
          'Rotate it; scope one key per caller',
        ],
        [
          'Pre-signed URL',
          'A signed link to one object for one action',
          'Minutes',
          'Handed to the client for a single upload or download',
          'Let it expire; keep lifetimes short',
        ],
      ],
    },
    {
      kind: 'table',
      title: 'Crypto Primitives',
      columns: ['Primitive', 'Use it for', 'Good choices', 'Avoid'],
      rows: [
        [
          'Password hash',
          'Storing passwords',
          'Argon2id, scrypt, bcrypt',
          'Fast hashes (SHA-256, MD5), no salt',
        ],
        [
          'Hash function',
          'Integrity checks and fingerprints',
          'SHA-256, SHA-3, BLAKE2',
          'MD5 and SHA-1',
        ],
        [
          'MAC',
          'Proving a message is unchanged and came from a key holder',
          'HMAC-SHA-256',
          'hash(secret + message)',
        ],
        [
          'Symmetric AEAD',
          'Encrypting data at rest and in transit',
          'AES-256-GCM, ChaCha20-Poly1305',
          'ECB mode; encryption without authentication',
        ],
        [
          'Key exchange',
          'Agreeing a shared key over an open network',
          'X25519 (ECDH), as in TLS 1.3',
          'Static keys with no forward secrecy',
        ],
        [
          'Digital signature',
          'Proving who produced data; signing tokens',
          'Ed25519, ECDSA P-256, RSA-PSS',
          'Accepting alg “none” in JWTs',
        ],
        [
          'Secure random',
          'Tokens, keys, nonces, ids',
          'The OS CSPRNG (crypto.getRandomValues)',
          'Math.random()',
        ],
      ],
    },
    {
      kind: 'list',
      title: 'Hashing ≠ Encryption ≠ Encoding',
      items: [
        'Hashing is one-way: you can check a value, never recover it.',
        'Encryption is reversible, but only with the key.',
        'Encoding (Base64, URL encoding) hides nothing: anyone can decode it.',
        'A JWT is signed, not encrypted: never put secrets in its claims.',
      ],
    },
    {
      kind: 'table',
      title: 'Authorization Models',
      columns: ['Model', 'Decision based on', 'Fits'],
      rows: [
        ['RBAC', 'The caller’s roles', 'Admin areas, staff tools'],
        [
          'ABAC',
          'Attributes of user, resource and context',
          'Rules like “same region, office hours”',
        ],
        [
          'Ownership / relationship',
          'Whether the caller owns or shares the resource',
          'User data: invoices, documents, photos',
        ],
      ],
    },
    {
      kind: 'pattern',
      title: 'Short Access, Rotating Refresh',
      when: 'Users should stay signed in for weeks, but a stolen token must stop working quickly.',
      how: 'Issue short-lived access tokens and a refresh token that is replaced on every use; if an old refresh token shows up again, revoke the whole family.',
      watch:
        'Keep refresh tokens out of JavaScript-readable storage, away from XSS.',
      lesson: 'authentication',
    },
    {
      kind: 'pattern',
      title: 'Check Ownership on the Server',
      when: 'Changing an id in the URL lets one user read another user’s records.',
      how: 'On every request, load the resource and check it belongs to (or is shared with) the caller before returning it; deny by default.',
      watch:
        'Hiding a button is not authorization; the API must enforce the rule.',
      lesson: 'authorization',
    },
    {
      kind: 'pattern',
      title: 'Envelope Encryption',
      when: 'Lots of data must be encrypted at rest, and keys must be rotatable without re-encrypting everything.',
      how: 'Encrypt each object with its own data key, encrypt that data key with a master key held in a KMS, and store the wrapped key beside the data.',
      watch:
        'Log and limit who can call the KMS decrypt operation; that is the real key.',
      lesson: 'encryption-secrets',
    },
  ],
} satisfies Cheatsheet;
