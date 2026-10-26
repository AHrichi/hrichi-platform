import { audienceCopy, audiences, isAudience, mailto } from './audiences';
import { caseStudies, caseStudyBySlug } from './case-studies';
import { experience } from './experience';
import { services } from './services';

/** Routes the shell prerenders; internal CTAs must point at one of them. */
const routes = [
  '/',
  '/experience',
  '/work',
  '/services',
  '/cv',
  ...caseStudies.map((study) => `/work/${study.slug}`),
];

describe('content', () => {
  it('has unique case study slugs that are safe in URLs', () => {
    const slugs = caseStudies.map((study) => study.slug);

    expect(new Set(slugs).size).toBe(slugs.length);
    for (const slug of slugs) {
      expect(slug).toMatch(/^[a-z0-9]+(-[a-z0-9]+)*$/);
    }
  });

  it('ranks every case study for every audience', () => {
    for (const study of caseStudies) {
      expect(Object.keys(study.rank).sort()).toEqual([...audiences].sort());
    }
  });

  it('only cites case studies that exist as proof for services', () => {
    for (const service of services) {
      for (const slug of service.proof) {
        expect(caseStudyBySlug(slug), `${service.id} -> ${slug}`).toBeDefined();
      }
    }
  });

  it('points every internal call to action at a real route', () => {
    for (const audience of audiences) {
      const { primaryCta, secondaryCta, sections } = audienceCopy[audience];
      for (const cta of [primaryCta, secondaryCta]) {
        if (cta.href.startsWith('/')) {
          expect(routes, `${audience}: ${cta.label}`).toContain(cta.href);
        }
      }
      expect(new Set(sections).size).toBe(sections.length);
    }
  });

  it('lists roles newest first with valid ISO months', () => {
    const starts = experience.map((role) => role.start);

    expect([...starts].sort().reverse()).toEqual(starts);
    for (const role of experience) {
      expect(role.start).toMatch(/^\d{4}-(0[1-9]|1[0-2])$/);
    }
  });

  it('recognizes audiences and builds encoded mailto links', () => {
    expect(isAudience('client')).toBe(true);
    expect(isAudience('hacker')).toBe(false);
    expect(mailto('Project & idea')).toBe(
      'mailto:ahmed.hrichi.web@gmail.com?subject=Project%20%26%20idea',
    );
  });
});
