import type { Lesson } from '../../../model/lesson';

/**
 * Lesson 07.02: Authorization (`authorization`).
 * Scenario: A user opens someone else's invoice (`docs/system-design/lesson-authoring.md` §10).
 */
export const lesson = {
  id: 'authorization',
  learn: [
    'Distinguishing AuthN (identity) from AuthZ (permissions)',
    'Role-Based Access Control (RBAC) for coarse role rules',
    'Resource ownership checks to stop IDOR / BOLA leaks',
    'Attribute-Based Access Control (ABAC) for context policies',
    'Enforcing least privilege server-side on every request',
  ],
  scene: {
    nodes: [
      {
        id: 'alice',
        kind: 'user',
        at: { x: 1, y: 4 },
        label: 'Alice',
        sublabel: 'user_42',
      },
      {
        id: 'gateway',
        kind: 'gateway',
        at: { x: 5, y: 4 },
        label: 'API Gateway',
        sublabel: 'Verifies JWT',
      },
      {
        id: 'invoice-svc',
        kind: 'service',
        at: { x: 8, y: 4 },
        label: 'Invoice API',
        sublabel: 'GET /invoices/:id',
      },
      {
        id: 'invoices-db',
        kind: 'database',
        at: { x: 11, y: 4 },
        label: 'Invoices DB',
        sublabel: 'owner_id + org',
      },
    ],
    edges: [
      {
        id: 'alice-gw',
        from: 'alice',
        to: 'gateway',
        label: 'HTTPS + JWT',
      },
      {
        id: 'gw-svc',
        from: 'gateway',
        to: 'invoice-svc',
        label: 'user_42',
      },
      {
        id: 'svc-db',
        from: 'invoice-svc',
        to: 'invoices-db',
        label: 'SQL',
      },
    ],
    zones: [
      {
        id: 'billing-zone',
        from: { x: 4, y: 1 },
        to: { x: 12, y: 8 },
        hue: 'green',
        label: 'Billing backend',
      },
    ],
    notes: [],
  },
  hud: [
    { id: 'authn', label: 'AuthN', icon: 'user', value: 'user_42' },
    { id: 'authz', label: 'AuthZ rule', icon: 'shield', value: 'None' },
    {
      id: 'invoice-1043',
      label: 'GET /1043',
      icon: 'file',
      value: '200 Leak!',
    },
    {
      id: 'blast-radius',
      label: 'Blast radius',
      icon: 'warning',
      value: 'All orgs',
    },
  ],
  steps: [
    {
      id: 'idor-bug',
      label: 'Invoice leak',
      kind: 'problem',
      title: 'Logged in as Alice, reading Bob’s invoice',
      body: [
        'Alice logs in cleanly as `user_42` and opens `/invoices/1042`. Out of curiosity, she edits the URL to `/invoices/1043`—an invoice belonging to Bob (`user_99`).',
        '**API Gateway** verifies Alice’s JWT, **Invoice API** runs `SELECT * FROM invoices WHERE id = 1043`, and returns Bob’s PDF. Why did a valid login leak someone else’s bill?',
      ],
      ops: [
        { op: 'update-node', id: 'alice', patch: { state: 'focus' } },
        {
          op: 'update-node',
          id: 'invoice-svc',
          patch: { state: 'hot', badge: '200 Leak!' },
        },
        {
          op: 'packet',
          edge: 'alice-gw',
          kind: 'request',
          label: 'GET /1043',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'gw-svc',
          kind: 'request',
          label: 'user_42',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'svc-db',
          kind: 'request',
          label: 'id = 1043',
          wave: 2,
        },
        {
          op: 'packet',
          edge: 'alice-gw',
          kind: 'error',
          reverse: true,
          label: 'Bob’s PDF!',
          wave: 3,
        },
        {
          op: 'set-metric',
          id: 'invoice-1043',
          value: '200 Leak!',
          tone: 'bad',
        },
        {
          op: 'set-metric',
          id: 'blast-radius',
          value: 'All orgs',
          tone: 'bad',
        },
      ],
    },
    {
      id: 'authn-vs-authz',
      label: 'AuthN vs AuthZ',
      kind: 'technique',
      title: 'AuthN checks who you are; AuthZ checks rights',
      body: [
        '**Authentication (`AuthN`)** answers _"Who is calling?"_—the gateway proved Alice is `user_42`.',
        '**Authorization (`AuthZ`)** answers _"May `user_42` read invoice `1043`?"_ Passing `AuthN` never grants blanket access to every record behind the door.',
      ],
      callouts: [
        {
          kind: 'key-idea',
          text: 'AuthN establishes identity; AuthZ decides what that identity may do to a specific resource.',
        },
      ],
      changes: [
        {
          type: 'added',
          text: 'Distinction between Gateway AuthN and Service AuthZ',
        },
      ],
      ops: [
        { op: 'update-node', id: 'alice', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'gateway',
          patch: { state: 'focus', badge: 'AuthN OK' },
        },
        {
          op: 'update-node',
          id: 'invoice-svc',
          patch: { state: 'hot', badge: 'No AuthZ' },
        },
        {
          op: 'add-note',
          note: {
            id: 'gw-note',
            anchor: { node: 'gateway' },
            text: 'AuthN = identity',
            tone: 'info',
            icon: 'user',
          },
        },
        {
          op: 'add-note',
          note: {
            id: 'svc-note',
            anchor: { node: 'invoice-svc' },
            text: 'AuthZ = missing!',
            tone: 'bad',
            icon: 'shield',
          },
        },
      ],
      learns: [0],
    },
    {
      id: 'rbac',
      label: 'RBAC',
      kind: 'technique',
      title: 'Role-Based Access Control groups coarse rights',
      body: [
        'Start with **RBAC** (_Role-Based Access Control_), assigning permissions to roles rather than individual users: `customer` reads invoices, `billing_admin` issues refunds, `support` views ticket headers.',
        'RBAC cleanly guards whole areas and admin endpoints—yet Alice _is_ a `customer`, so roles alone still cannot separate her invoices from Bob’s.',
      ],
      changes: [
        { type: 'added', text: 'Support Rep caller and RBAC role check' },
        { type: 'changed', text: 'AuthZ rule set to RBAC (coarse)' },
      ],
      ops: [
        { op: 'update-node', id: 'gateway', patch: { state: 'normal' } },
        {
          op: 'add-node',
          node: {
            id: 'support',
            kind: 'client',
            at: { x: 1, y: 7 },
            label: 'Support Rep',
            sublabel: 'role: support',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'support-gw',
            from: 'support',
            to: 'gateway',
            label: 'RBAC: support',
            route: 'elbow-x',
          },
        },
        {
          op: 'update-node',
          id: 'invoice-svc',
          patch: { state: 'focus', badge: 'RBAC: customer' },
        },
        {
          op: 'packet',
          edge: 'alice-gw',
          kind: 'request',
          label: 'role=customer',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'support-gw',
          kind: 'request',
          label: 'role=support',
          wave: 0,
        },
        { op: 'set-metric', id: 'authz', value: 'RBAC (coarse)' },
      ],
      learns: [1],
    },
    {
      id: 'ownership-check',
      label: 'Ownership check',
      kind: 'technique',
      title: 'Check record ownership on every API query',
      body: [
        'Swapping an ID in the URL to read another user’s data is called **IDOR** (_Insecure Direct Object Reference_, or **BOLA** in APIs).',
        'Fix it inside **Invoice API** by loading the invoice’s `owner_id` (or scoping SQL with `AND owner_id = :callerId`) and verifying `invoice.owner_id === user_42`. Alice’s probe for `/invoices/1043` now returns **`403 Forbidden`**.',
      ],
      changes: [
        {
          type: 'changed',
          text: 'Invoice API checks owner_id === caller on every read',
        },
        { type: 'changed', text: 'GET /1043 blocked with 403 Forbidden' },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'invoice-svc',
          patch: { state: 'focus', badge: 'owner_id check' },
        },
        {
          op: 'update-note',
          id: 'svc-note',
          patch: { text: 'owner_id === user_42?', tone: 'good' },
        },
        {
          op: 'packet',
          edge: 'alice-gw',
          kind: 'request',
          label: 'GET /1043',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'gw-svc',
          kind: 'request',
          label: 'user_42',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'svc-db',
          kind: 'request',
          label: 'WHERE owner=42',
          wave: 2,
        },
        {
          op: 'packet',
          edge: 'alice-gw',
          kind: 'error',
          reverse: true,
          label: '403 Forbidden',
          wave: 3,
        },
        { op: 'set-metric', id: 'authz', value: 'RBAC + Owner', tone: 'good' },
        {
          op: 'set-metric',
          id: 'invoice-1043',
          value: '403 Blocked',
          tone: 'good',
        },
      ],
      learns: [2],
    },
    {
      id: 'abac',
      label: 'ABAC rules',
      kind: 'case',
      title: 'ABAC evaluates user, resource, and context',
      body: [
        'What if **Support Rep** needs to inspect Bob’s invoice to resolve a live dispute, without opening every account worldwide?',
        '**ABAC** (_Attribute-Based Access Control_) checks rich attributes together: **user** (`dept=support, region=EU`), **resource** (`region=EU, openTicket=true`), and **context** (`officeHours=true, mfa=true`).',
      ],
      changes: [
        {
          type: 'changed',
          text: 'ABAC policy evaluates user, resource, and context attributes',
        },
      ],
      ops: [
        { op: 'update-node', id: 'alice', patch: { state: 'dim' } },
        { op: 'update-node', id: 'support', patch: { state: 'focus' } },
        {
          op: 'update-note',
          id: 'gw-note',
          patch: { text: 'user + resource + env' },
        },
        {
          op: 'update-node',
          id: 'invoice-svc',
          patch: { badge: 'ABAC policy' },
        },
        {
          op: 'packet',
          edge: 'support-gw',
          kind: 'request',
          label: 'EU + open ticket',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'gw-svc',
          kind: 'request',
          label: 'attrs match',
          wave: 1,
        },
        {
          op: 'packet',
          edge: 'support-gw',
          kind: 'response',
          reverse: true,
          label: '200 Allowed',
          wave: 2,
        },
        { op: 'set-metric', id: 'authz', value: 'RBAC + ABAC' },
      ],
      learns: [3],
    },
    {
      id: 'client-ui-trap',
      label: 'UI-only check',
      kind: 'watch-out',
      title: 'Hiding a button in the UI is not authorization',
      body: [
        'Never rely on hiding an "Admin" or "Delete" button in frontend code while leaving the backend route open.',
        'Any attacker can replay or edit requests using `curl` or browser DevTools. **Enforce every rule server-side** and **deny by default** whenever no rule explicitly grants access.',
      ],
      callouts: [
        {
          kind: 'watch-out',
          text: 'Frontend checks improve UX only; the server API must verify permissions and deny by default.',
        },
      ],
      changes: [
        {
          type: 'changed',
          text: 'Direct curl request rejected server-side with 403',
        },
      ],
      ops: [
        {
          op: 'update-node',
          id: 'alice',
          patch: { state: 'hot', badge: 'curl DELETE' },
        },
        { op: 'update-node', id: 'support', patch: { state: 'normal' } },
        {
          op: 'update-node',
          id: 'invoice-svc',
          patch: { state: 'focus', badge: 'deny by default' },
        },
        {
          op: 'packet',
          edge: 'alice-gw',
          kind: 'request',
          label: 'curl DELETE /1043',
          wave: 0,
        },
        {
          op: 'packet',
          edge: 'alice-gw',
          kind: 'error',
          reverse: true,
          label: '403 Denied',
          wave: 1,
        },
      ],
    },
    {
      id: 'least-privilege',
      label: 'Least privilege',
      kind: 'technique',
      title: 'Give every caller only the minimum access needed',
      body: [
        'Apply **least privilege** across users, tokens, and internal services. **Invoice API**’s database role needs `SELECT, INSERT` on `invoices`—not `DROP TABLE` or access to payroll.',
        'Narrow scopes, short-lived grants, and an **Audit Log** of allow/deny decisions ensure a compromised module cannot cascade across the company.',
      ],
      changes: [
        {
          type: 'added',
          text: 'Audit Log and scoped DB role on Invoices DB',
        },
        { type: 'changed', text: 'Blast radius reduced to Single scope' },
      ],
      ops: [
        { op: 'update-node', id: 'alice', patch: { state: 'normal', badge: null } },
        {
          op: 'update-node',
          id: 'invoices-db',
          patch: { state: 'focus', badge: 'invoices R/W only' },
        },
        {
          op: 'add-node',
          node: {
            id: 'audit-log',
            kind: 'storage',
            at: { x: 11, y: 7 },
            label: 'Audit Log',
            sublabel: 'Allow / Deny',
            state: 'focus',
          },
        },
        {
          op: 'add-edge',
          edge: {
            id: 'svc-audit',
            from: 'invoice-svc',
            to: 'audit-log',
            label: 'log',
            style: 'dashed',
            route: 'elbow-y',
          },
        },
        {
          op: 'packet',
          edge: 'svc-audit',
          kind: 'write',
          label: 'audit event',
          wave: 0,
        },
        {
          op: 'set-metric',
          id: 'blast-radius',
          value: 'Single scope',
          tone: 'good',
        },
      ],
      learns: [4],
    },
    {
      id: 'recap',
      label: 'Recap',
      kind: 'recap',
      title: 'Check identity, role, and ownership on the server',
      body: [
        'Authentication proves who stepped into the building; authorization checks their role, context attributes, and resource ownership on the server before returning a single invoice.',
      ],
      ops: [
        { op: 'remove-note', id: 'gw-note' },
        { op: 'remove-note', id: 'svc-note' },
        {
          op: 'update-node',
          id: 'gateway',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'invoice-svc',
          patch: { state: 'normal', badge: null },
        },
        {
          op: 'update-node',
          id: 'invoices-db',
          patch: { state: 'normal', badge: null },
        },
        { op: 'update-node', id: 'audit-log', patch: { state: 'normal' } },
        {
          op: 'add-note',
          note: {
            id: 'authz-summary',
            anchor: { at: { x: 6.5, y: 7.5 } },
            text: 'AuthZ checklist',
            tone: 'good',
            icon: 'shield',
            rows: [
              ['AuthN', 'Who is calling?'],
              ['RBAC', 'Coarse role rights'],
              ['Ownership', 'owner_id === caller'],
              ['ABAC', 'User + item + env'],
            ],
            total: ['Rule', 'Deny by default, server-side'],
          },
        },
      ],
      takeaways: [
        'AuthN proves caller identity; AuthZ decides whether that caller may perform an action on a specific resource',
        'Combine RBAC for coarse role permissions with per-record ownership checks (preventing IDOR) and ABAC for context',
        'Always enforce authorization server-side with deny-by-default—never trust hidden UI controls',
        'Grant users, tokens, and internal services least privilege to contain the blast radius of any bug or breach',
      ],
    },
  ],
  checks: [
    {
      id: 'choice-idor-fix',
      kind: 'choice',
      prompt:
        'Alice (signed in as user_42) changes /invoices/1042 to /invoices/1043 and receives Bob’s invoice. What stops this IDOR vulnerability?',
      options: [
        'Check invoice.owner_id === callerId on the server for every request and return 403 Forbidden on mismatch',
        'Hide the invoice number from the browser address bar with JavaScript',
        'Use HTTPS so the URL path is encrypted in transit',
      ],
      answer: 0,
      explain:
        'HTTPS hides traffic from network eavesdroppers, and frontend routing hides nothing from curl; only a server-side ownership check stops IDOR.',
      step: 'ownership-check',
    },
    {
      id: 'choice-rbac-vs-abac',
      kind: 'choice',
      prompt:
        'Which authorization rule requires ABAC rather than pure RBAC?',
      options: [
        'Support reps in EU may view an invoice only when the customer has an open ticket during business hours',
        'Users with the billing_admin role may issue refunds',
        'Users with the viewer role cannot call POST endpoints',
      ],
      answer: 0,
      explain:
        'Evaluating user attributes (region), resource attributes (open ticket), and environment attributes (business hours) together is ABAC.',
      step: 'abac',
    },
    {
      id: 'order-authz-flow',
      kind: 'order',
      prompt:
        'Order the server checks for an incoming GET /invoices/1043 request from first to last.',
      items: [
        'Verify the caller’s JWT signature and expiry (AuthN)',
        'Check whether the caller’s role allows reading invoices (RBAC)',
        'Verify invoice.owner_id matches caller or ABAC policy allows access',
        'Return the invoice and write an audit log entry',
      ],
      explain:
        'Identify the caller first (AuthN), check broad role rights (RBAC), enforce record-level ownership or ABAC policy, then return data and log.',
      step: 'authn-vs-authz',
    },
    {
      id: 'numeric-least-privilege',
      kind: 'numeric',
      prompt:
        'A multi-tenant database holds 5,000 invoices split evenly across 250 companies (20 each). After adding tenant ownership checks instead of global reads, at most how many invoices can one customer read?',
      unit: 'invoices',
      answer: 20,
      tolerance: 0.05,
      explain:
        'Ownership scoping limits each tenant to its own 20 invoices instead of exposing all 5,000 across 250 companies.',
      step: 'least-privilege',
    },
  ],
  cards: [
    {
      front: 'What is the difference between Authentication (AuthN) and Authorization (AuthZ)?',
      back: 'AuthN verifies who the caller is ("user_42"); AuthZ decides what that caller is allowed to do on a given resource.',
    },
    {
      front: 'What is IDOR (BOLA) and how do you prevent it?',
      back: 'Insecure Direct Object Reference happens when changing an id in a request exposes someone else’s record; prevent it with server-side ownership or relationship checks on every fetch.',
    },
    {
      front: 'When should you combine RBAC with ABAC?',
      back: 'Use RBAC for coarse role permissions (admin vs viewer) and ABAC when access depends on attributes of the user, resource, and context (region, status, time).',
    },
    {
      front: 'Why is hiding a button in the UI never sufficient for security?',
      back: 'Attackers bypass the UI and send requests directly with curl or modified payloads; authorization must always be enforced server-side with deny-by-default.',
    },
    {
      front: 'What does the principle of least privilege mean for backend services?',
      back: 'Give each user, token, and service only the minimum permissions and tables required for its job—never wildcard admin access.',
    },
  ],
} satisfies Lesson;
