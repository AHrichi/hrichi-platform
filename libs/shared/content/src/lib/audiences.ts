import type { Audience, AudienceCopy } from './model';
import { profile } from './profile';
import site from './site.json';

export const audiences: readonly Audience[] = [
  'recruiter',
  'engineer',
  'client',
];

/** Prerendered pages use this; `?for=` and the switch change it in the browser. */
export const defaultAudience: Audience = 'recruiter';

export function isAudience(value: unknown): value is Audience {
  return audiences.includes(value as Audience);
}

export function mailto(subject: string): string {
  return `mailto:${profile.email}?subject=${encodeURIComponent(subject)}`;
}

export const audienceCopy: Record<Audience, AudienceCopy> = {
  recruiter: {
    label: 'Recruiter',
    headline: 'Angular & full-stack developer with 5+ years of enterprise SaaS',
    intro:
      'I build and modernize Angular platforms (Nx monorepos, micro-frontends, 3D product tools) and the NestJS services behind them. Based in Tunis, working remotely, open to relocation within Europe.',
    primaryCta: { label: 'View my CV', href: '/cv' },
    secondaryCta: {
      label: 'Email me',
      href: mailto('Opportunity for Ahmed Hrichi'),
    },
    sections: ['experience', 'work', 'services', 'platform'],
  },
  engineer: {
    label: 'Engineer',
    headline: 'I build Angular platforms that scale',
    intro:
      'This site is one of them: an Nx monorepo of zoneless Angular 22 micro-frontends on Native Federation, prerendered, installable and deployed for $0. The code and every architecture decision are public.',
    primaryCta: {
      label: 'How this site is built',
      href: '/work/this-platform',
    },
    secondaryCta: {
      label: 'Source on GitHub',
      href: site.repository,
      external: true,
    },
    sections: ['platform', 'work', 'experience', 'services'],
  },
  client: {
    label: 'Client',
    headline: 'Angular, 3D and integration work for product teams',
    intro:
      'I help teams upgrade their Angular apps, ship 3D product experiences and connect their tools with NestJS and n8n. Remote, with hours that overlap EU business hours.',
    primaryCta: { label: 'Start a project', href: mailto('Project enquiry') },
    secondaryCta: { label: 'See services', href: '/services' },
    sections: ['services', 'work', 'experience', 'platform'],
  },
};
