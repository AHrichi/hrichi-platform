import { audienceCopy, audiences, isAudience, mailto } from './audiences';
import { caseStudies, caseStudyBySlug } from './case-studies';
import { experience, formatMonth, rolePeriod } from './experience';
import { services } from './services';
import {
  getContentBundle,
  getProfile,
  getCaseStudies,
  getExperience,
  getServices,
  getAudiencesCopy,
} from './i18n/content-i18n';
import type { SiteLanguage } from './i18n/content-i18n.types';

/** Routes the shell prerenders; internal CTAs must point at one of them. */
const routes = [
  '/',
  '/experience',
  '/work',
  '/services',
  '/cv',
  ...caseStudies.map((study) => `/work/${study.slug}`),
];

const supportedLangs: readonly SiteLanguage[] = ['en', 'fr', 'ar', 'it', 'de'];

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

  describe('multi-language bundles', () => {
    for (const lang of supportedLangs) {
      it(`provides complete and valid bundle for ${lang}`, () => {
        const bundle = getContentBundle(lang);
        expect(bundle.profile.name).toBeTruthy();
        expect(bundle.profile.role).toBeTruthy();
        expect(bundle.profile.summary).toBeTruthy();

        expect(bundle.skills.length).toBeGreaterThanOrEqual(4);
        expect(bundle.education.length).toBeGreaterThanOrEqual(1);
        expect(bundle.languages.length).toBe(3);

        const auds = getAudiencesCopy(lang);
        for (const aud of audiences) {
          expect(auds[aud].headline).toBeTruthy();
          expect(auds[aud].intro).toBeTruthy();
          expect(auds[aud].primaryCta.label).toBeTruthy();
          expect(auds[aud].secondaryCta.label).toBeTruthy();
        }

        const exp = getExperience(lang);
        expect(exp.length).toBe(3);
        for (const role of exp) {
          expect(role.company).toBeTruthy();
          expect(role.title).toBeTruthy();
          expect(role.context).toBeTruthy();
          expect(role.highlights.length).toBeGreaterThanOrEqual(3);
          const period = rolePeriod(role, lang);
          expect(period).toBeTruthy();
        }

        const srv = getServices(lang);
        expect(srv.length).toBe(5);
        for (const service of srv) {
          expect(service.title).toBeTruthy();
          expect(service.summary).toBeTruthy();
          expect(service.deliverables.length).toBe(4);
        }

        const cs = getCaseStudies(lang);
        expect(cs.length).toBe(4);
        for (const study of cs) {
          expect(study.title).toBeTruthy();
          expect(study.summary).toBeTruthy();
          expect(study.problem).toBeTruthy();
          expect(study.approach.length).toBeGreaterThanOrEqual(2);
          expect(study.outcome.length).toBeGreaterThanOrEqual(2);
        }
      });
    }

    it('formats localized months and periods correctly', () => {
      expect(formatMonth('2023-10', 'en')).toContain('2023');
      expect(formatMonth('2023-10', 'fr')).toContain('2023');
      expect(formatMonth('2023-10', 'it')).toContain('2023');
      expect(formatMonth('2023-10', 'de')).toContain('2023');

      const currentRole = experience[0];
      expect(rolePeriod(currentRole, 'en')).toContain('present');
      expect(rolePeriod(currentRole, 'fr')).toContain('actuel');
      expect(rolePeriod(currentRole, 'ar')).toContain('حتى الآن');
      expect(rolePeriod(currentRole, 'it')).toContain('presente');
      expect(rolePeriod(currentRole, 'de')).toContain('heute');
    });
  });
});
