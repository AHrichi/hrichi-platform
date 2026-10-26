import type { Education, Profile, SkillGroup } from './model';

export const profile: Profile = {
  name: 'Ahmed Hrichi',
  role: 'Angular & Full-Stack Developer',
  location: 'Tunis, Tunisia',
  workSetup: 'Remote worldwide · open to relocation within Europe',
  timezone: 'UTC+1 (overlaps EU business hours)',
  availability: 'Open to full-time roles and freelance projects',
  summary:
    'Angular and full-stack developer with 5+ years of experience designing, building and optimizing enterprise SaaS platforms, micro-frontends and complex 2D/3D web applications. I work across the modern Angular ecosystem (v12 to v22, Signals, standalone APIs, RxJS, Nx monorepos) and back it with NestJS and MongoDB services: schema-driven UIs, ERP and shipping integrations, and browser performance for high-traffic applications.',
  email: 'ahmed.hrichi.web@gmail.com',
  linkedin: 'https://www.linkedin.com/in/a-hrichi/',
  github: 'https://github.com/AHrichi',
};

export const skills: readonly SkillGroup[] = [
  {
    name: 'Frontend',
    items: [
      'Angular (v12 to v22)',
      'Signals & NgRx SignalStore',
      'Standalone APIs & zoneless',
      'RxJS',
      'TypeScript',
      'Nx monorepos',
      'Micro-frontends (Native Federation)',
      'PrimeNG & Angular Material',
      'PWA',
    ],
  },
  {
    name: '2D/3D graphics',
    items: [
      'Three.js (WebGL, custom shaders)',
      '3D product previews',
      'Fabric.js canvas editors',
      'CKEditor integration',
    ],
  },
  {
    name: 'Backend & integrations',
    items: [
      'NestJS',
      'MongoDB',
      'BullMQ',
      'n8n workflow automation',
      'Stripe',
      'OAuth 2.0 & JWT',
    ],
  },
  {
    name: 'Desktop, mobile & JVM',
    items: ['Electron', 'Ionic & Capacitor', 'Java & Spring Boot'],
  },
  {
    name: 'Quality & delivery',
    items: [
      'Vitest, Jest, Jasmine & Karma',
      'Playwright',
      'GitHub Actions',
      'Agile / Scrum',
    ],
  },
];

export const education: readonly Education[] = [
  {
    title: 'National Engineering Degree',
    school: 'National Engineering School of Monastir (ENIM)',
    period: '2017 – 2020',
  },
  {
    title: 'Full-Stack Web Development Certification',
    school: 'GoMyCode',
    period: '2020 – 2021',
  },
  {
    title: 'Preparatory Cycle for Engineering Studies',
    school: 'Preparatory Institute for Engineering Studies',
    period: '2015 – 2017',
  },
];

export const languages: readonly { language: string; level: string }[] = [
  { language: 'Arabic', level: 'Native' },
  { language: 'English', level: 'Full professional proficiency' },
  { language: 'French', level: 'Working knowledge' },
];
