import type { CaseStudy } from './model';
import site from './site.json';

const employerWork =
  'Client work: described at the level of my CV, without client code, data or screenshots.';

export const caseStudies: readonly CaseStudy[] = [
  {
    slug: 'instant-3d-quoting',
    title: 'Instant 3D quoting for a manufacturing marketplace',
    summary:
      'Core features of a B2B marketplace where customers get instant prices from 3D files, across a customer portal, an admin dashboard and an embeddable widget.',
    client: 'SeekMake',
    period: '2023 – present',
    role: 'Angular & full-stack developer',
    context:
      'SeekMake is a B2B manufacturing SaaS platform and marketplace: customers upload parts and get instant 3D quotes, and orders are routed, invoiced and fulfilled by partner manufacturers. The product is an Nx monorepo of Angular applications backed by NestJS microservices.',
    problem:
      'The same quoting experience had to work in three places (the customer portal, the admin dashboard and a widget embedded on other sites) while complex 3D pricing calculations competed with the UI for browser resources and slowed loading.',
    approach: [
      {
        decision:
          'Build the features on Signals and standalone components (Angular up to v19).',
        why: 'Fine-grained reactivity re-renders only what a price change touches, instead of sweeping change detection across the whole page.',
      },
      {
        decision:
          'Share the quoting logic through Nx libraries used by the portal, the dashboard and the widget.',
        why: 'One implementation of the pricing rules and UI, with module boundaries so each app only pulls in what it needs.',
      },
      {
        decision: 'Streamline the 3D pricing calculations in the browser.',
        why: 'Less work per interaction meant lower browser resource use and faster loads, which matters most in the embedded widget.',
      },
    ],
    outcome: [
      'Quoting features delivered across the customer portal, admin dashboard and embeddable widget from one monorepo.',
      'Lower browser resource use and load times for 3D pricing.',
    ],
    stack: [
      'Angular',
      'Signals',
      'Standalone components',
      'RxJS',
      'Nx',
      'NestJS',
    ],
    confidentiality: employerWork,
    rank: { recruiter: 1, engineer: 2, client: 2 },
  },
  {
    slug: 'schema-driven-integrations',
    title: 'A plug-and-play integration platform',
    summary:
      'Shipping carriers and accounting suites connected through JSON-schema-driven forms and n8n workers, so new providers ship without a deployment.',
    client: 'SeekMake',
    period: '2023 – present',
    role: 'Angular & full-stack developer',
    context:
      'Manufacturers on the platform ship with different carriers and keep their books in different accounting tools. Each integration needs its own settings screen and its own way of talking to the provider.',
    problem:
      'Hand-building a settings UI and a backend connector for every provider made each new integration a development project and a deployment.',
    approach: [
      {
        decision:
          'Describe each provider’s settings as a JSON schema and render the Angular forms from it.',
        why: 'Adding a provider becomes data, not code: validation, defaults and layout come from the schema.',
      },
      {
        decision: 'Run the provider-specific logic in n8n webhook workers.',
        why: 'Connectors change without redeploying the platform, and each provider’s flow is visible and testable on its own.',
      },
    ],
    outcome: [
      'Carriers (InPost, DHL, inTime) and accounting suites (QuickBooks, Fakturownia, e-boekhouden) integrated through one framework.',
      'New providers onboarded without deployments.',
    ],
    stack: ['Angular', 'JSON Schema', 'n8n', 'NestJS', 'MongoDB'],
    confidentiality: employerWork,
    rank: { recruiter: 2, engineer: 3, client: 1 },
  },
  {
    slug: 'myeasylogo-graphics-library',
    title: 'A 2D/3D graphics library for product personalization',
    summary:
      'A reusable Angular library combining Three.js shaders for real-time 3D previews with a Fabric.js editor for text, images and undo/redo.',
    client: 'Euro Tech Conseil (MyEasyLogo)',
    period: '2021 – 2023',
    role: 'Front-end Angular developer',
    context:
      'MyEasyLogo lets customers design personalized products, such as engraved wood, and see the result before ordering. Several apps needed the same design and preview capabilities.',
    problem:
      'Customers needed to see a realistic 3D preview of materials and laser engraving while editing curved text and images, and the feature had to be reusable across applications.',
    approach: [
      {
        decision:
          'Package the editor and the preview as a standalone Angular library.',
        why: 'Each application consumes the same component API instead of copying canvas code.',
      },
      {
        decision: 'Render materials with custom WebGL shaders in Three.js.',
        why: 'Real-time wood and laser-engraving previews that update as the design changes.',
      },
      {
        decision:
          'Use Fabric.js for the 2D editor, with a state-driven undo/redo engine.',
        why: 'Curve and arc text, image distortion and CKEditor text editing, with every change reversible.',
      },
    ],
    outcome: [
      'Real-time 3D wood and laser-engraving previews in the browser.',
      'One reusable library behind the design features.',
    ],
    stack: [
      'Angular',
      'Three.js',
      'WebGL shaders',
      'Fabric.js',
      'CKEditor',
      'RxJS',
    ],
    confidentiality: employerWork,
    rank: { recruiter: 3, engineer: 4, client: 3 },
  },
  {
    slug: 'this-platform',
    title: 'This site: a micro-frontend platform deployed for $0',
    summary:
      'An Nx monorepo of zoneless Angular 22 micro-frontends on Native Federation, prerendered, installable and deployed to Cloudflare by CI at zero cost.',
    client: 'Personal project',
    period: '2026',
    role: 'Architect and developer',
    context:
      'A portfolio usually lists skills. This one is built the way I would build a client’s platform, so the architecture itself is the evidence, with every decision written down as an ADR.',
    problem:
      'Combine micro-frontends, prerendering for search engines, offline support and a strict Content Security Policy, on free hosting, without any of them breaking the others.',
    approach: [
      {
        decision:
          'Native Federation on Angular’s esbuild builder instead of Webpack Module Federation.',
        why: 'Nx 23 deprecated its Angular Module Federation tooling; Native Federation follows Angular’s own build system.',
      },
      {
        decision:
          'Prerender content in the shell; render micro-frontends in the browser only.',
        why: 'Search engines get real HTML from a CDN with no server, and remotes still deploy independently.',
      },
      {
        decision:
          'Treat every remote as unreliable: a timeout, a contract check and a fallback page.',
        why: 'A remote that is down, slow or incompatible shows a message instead of breaking the site.',
      },
      {
        decision:
          'Generate the CSP header at deploy time from hashes of the built HTML.',
        why: 'Angular’s automatic CSP cannot be combined with prerendering; hashing keeps the policy strict anyway.',
      },
    ],
    outcome: [
      'Live on Cloudflare at no cost, deployed by GitHub Actions only for the apps that changed.',
      'Zero Content Security Policy violations and no console errors in production.',
      'Works offline after the first visit, including the federated Angular packages.',
    ],
    stack: [
      'Angular 22',
      'Zoneless',
      'Native Federation',
      'Nx 24',
      'NgRx SignalStore',
      'Cloudflare Workers',
      'Playwright',
    ],
    links: [
      { label: 'Source code', href: site.repository, external: true },
      {
        label: 'Architecture decisions',
        href: `${site.repository}/tree/main/docs/adr`,
        external: true,
      },
      { label: 'Design system', href: site.designSystem, external: true },
    ],
    rank: { recruiter: 4, engineer: 1, client: 4 },
  },
];

export function caseStudyBySlug(slug: string): CaseStudy | undefined {
  return caseStudies.find((study) => study.slug === slug);
}
