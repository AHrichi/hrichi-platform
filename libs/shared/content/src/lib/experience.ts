import type { Role } from './model';

/** "2023-10" becomes "Oct 2023"; identical on the server and in the browser. */
export function formatMonth(isoMonth: string): string {
  const [year, month] = isoMonth.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1)).toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  });
}

export function rolePeriod(role: Role): string {
  return `${formatMonth(role.start)} – ${role.end ? formatMonth(role.end) : 'present'}`;
}

export const experience: readonly Role[] = [
  {
    company: 'SeekMake',
    title: 'Angular & Full-Stack Developer',
    location: 'Tunis, Tunisia',
    start: '2023-10',
    context:
      'B2B manufacturing SaaS platform and marketplace: instant 3D quoting, automated order routing, invoicing and partner fulfilment, across an Nx monorepo of Angular applications and NestJS microservices.',
    highlights: [
      {
        title: 'Modern Angular & monorepo',
        text: 'Built and optimized core features across the customer portal, admin dashboard and embeddable instant-quote widget with Angular (up to v19), Signals, standalone components, RxJS and Nx, streamlining complex 3D pricing calculations to reduce browser resource use and load times.',
      },
      {
        title: 'Schema-driven integration platform',
        text: 'Built a plug-and-play integration framework for shipping carriers (InPost, DHL, inTime) and accounting suites (QuickBooks, Fakturownia, e-boekhouden), with Angular forms driven by JSON schemas and n8n webhook workers, so new providers are onboarded without deployments.',
      },
      {
        title: 'Onboarding & replication engine',
        text: 'Designed a modular configuration engine in NestJS and MongoDB that clones complex manufacturing setups (machines, materials, pricing formulas, tax rules, currencies) across tenants, with dry-run conflict previews and one-click rollback.',
      },
      {
        title: 'Document & PDF design engine',
        text: 'Built a fault-tolerant document customization engine in 13 languages, with a visual Angular editor for quotes, invoices and work orders, live previews and guaranteed render stability.',
      },
      {
        title: 'Marketing automation',
        text: 'Developed a multi-path lifecycle marketing engine: a visual campaign builder in Angular and a BullMQ distributed queue on the backend enforcing idempotent send limits across large lead databases.',
      },
      {
        title: 'White-label transactional email',
        text: 'Migrated 16+ transactional email workflows from third-party vendors to an in-house multilingual template engine with tenant-branded SMTP, feature-flagged rollouts and real-time delivery tracking.',
      },
    ],
    stack: [
      'Angular',
      'Signals',
      'RxJS',
      'Nx',
      'NestJS',
      'MongoDB',
      'BullMQ',
      'n8n',
    ],
  },
  {
    company: 'E-NOVATIONDUWEB',
    title: 'Front-End Angular Developer',
    location: 'Paris, France (remote from Tunis)',
    start: '2023-05',
    end: '2023-10',
    context:
      'Thalasso n°1: back-office management and booking platform for the travel and hospitality sector.',
    highlights: [
      {
        title: 'Data-intensive dashboards',
        text: 'Built responsive back-office workflows and analytics views with Angular, TypeScript and PrimeNG: advanced data tables, custom filtering and interactive reporting widgets.',
      },
      {
        title: 'CMS & performance',
        text: 'Developed a custom content management system and improved load times with route-level lazy loading, code splitting and reactive state management in RxJS.',
      },
      {
        title: 'Quality',
        text: 'Improved accessibility and release reliability with automated unit tests in Jasmine and Karma.',
      },
    ],
    stack: ['Angular', 'TypeScript', 'PrimeNG', 'RxJS', 'Jasmine', 'Karma'],
  },
  {
    company: 'Euro Tech Conseil',
    title: 'Front-End Angular Developer',
    location: 'Paris, France / Kairouan, Tunisia',
    start: '2021-09',
    end: '2023-05',
    context:
      'Four core enterprise web applications: 2D/3D graphic design libraries, visual publishing platforms, a financial CRM and automotive PWAs.',
    highlights: [
      {
        title: 'Standalone 2D/3D graphics library (MyEasyLogo)',
        text: 'Engineered a reusable Angular library integrating Three.js (custom WebGL shaders for real-time 3D wood and laser-engraving previews) and Fabric.js (curve and arc text, image distortion, CKEditor integration and a state-driven undo/redo engine).',
      },
      {
        title: 'Web-based visual design platform (MyEasyContent)',
        text: 'Developed an interactive graphic design workspace with Angular, Fabric.js and RxJS (BehaviorSubject state synchronization), with secure OAuth 2.0 / JWT authentication and role-based access control.',
      },
      {
        title:
          'Financial CRM & workflow scheduling (IXIA, France Finance Conseil)',
        text: 'Designed an interactive inspection and document-treatment scheduling system, led an Angular change-detection refactoring initiative and established the core unit testing framework.',
      },
      {
        title: 'Automotive inspection PWA (GEFCO)',
        text: 'Built a mobile-first progressive web app for field vehicle inspections, with real-time hardware barcode scanning and secure JWT-authenticated workflows.',
      },
    ],
    stack: ['Angular', 'Three.js', 'Fabric.js', 'RxJS', 'PWA', 'OAuth 2.0'],
  },
];
