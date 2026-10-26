import type { ProcessStep, Service } from './model';

export const services: readonly Service[] = [
  {
    id: 'angular-modernization',
    title: 'Angular modernization',
    summary:
      'Upgrade older Angular apps (v12 onwards) to current Angular: standalone components, Signals and zoneless change detection, with tests that keep the upgrade safe.',
    deliverables: [
      'Upgrade plan with risks and order of work',
      'Incremental, reviewable pull requests',
      'Tests on the critical user paths',
      'Before/after performance report',
    ],
    proof: ['instant-3d-quoting', 'this-platform'],
  },
  {
    id: 'monorepos-micro-frontends',
    title: 'Nx monorepos & micro-frontends',
    summary:
      'Set up or untangle an Nx workspace: module boundaries, shared libraries, micro-frontends with Native Federation, and CI that only builds what changed.',
    deliverables: [
      'Workspace and library structure',
      'Enforced module boundaries',
      'Micro-frontend setup with fallbacks',
      'CI with affected builds and deploys',
    ],
    proof: ['this-platform', 'instant-3d-quoting'],
  },
  {
    id: '3d-product-experiences',
    title: '3D product experiences',
    summary:
      'Interactive 3D product previews and configurators with Three.js and custom shaders, and 2D design editors with Fabric.js, inside your Angular app.',
    deliverables: [
      '3D preview or configurator component',
      'Custom materials and shaders',
      '2D editor with undo/redo',
      'Performance budget for mobile devices',
    ],
    proof: ['myeasylogo-graphics-library', 'instant-3d-quoting'],
  },
  {
    id: 'integrations-automation',
    title: 'Integrations & automation',
    summary:
      'Connect your product to carriers, accounting tools, CRMs and email with NestJS services and n8n workflows, configured through schema-driven forms.',
    deliverables: [
      'NestJS integration services',
      'n8n workflows you can see and change',
      'Schema-driven settings screens',
      'Retries and idempotency for reliable delivery',
    ],
    proof: ['schema-driven-integrations'],
  },
  {
    id: 'pwa-desktop',
    title: 'PWA & desktop apps',
    summary:
      'Installable, offline-capable progressive web apps and Electron desktop builds from one Angular codebase.',
    deliverables: [
      'Offline strategy and service worker',
      'Installable PWA',
      'Electron desktop builds with auto-update',
      'Release pipeline',
    ],
    proof: ['this-platform'],
  },
];

export const process: readonly ProcessStep[] = [
  {
    title: 'Understand the goal',
    text: 'A short call and a read through your code, so the plan starts from what you actually have.',
  },
  {
    title: 'Write the plan down',
    text: 'Scope, risks and the key decisions in a short document you can review before work starts.',
  },
  {
    title: 'Ship in small steps',
    text: 'Reviewable pull requests and a weekly demo, so you see progress and can steer early.',
  },
  {
    title: 'Hand over cleanly',
    text: 'Tests, CI and documentation, so your team can keep going without me.',
  },
];

export const engagement =
  'Fixed-scope projects or a monthly retainer. Remote, with working hours that overlap EU business hours.';
