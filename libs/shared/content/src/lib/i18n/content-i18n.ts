import type {
  Audience,
  AudienceCopy,
  CaseStudy,
  Education,
  ProcessStep,
  Profile,
  Role,
  Service,
  SkillGroup,
} from '../model';
import type {
  LanguageItem,
  ContentBundle,
  SiteLanguage,
} from './content-i18n.types';
import { CONTENT_EN } from './content.en';
import { CONTENT_FR } from './content.fr';
import { CONTENT_AR } from './content.ar';
import { CONTENT_IT } from './content.it';
import { CONTENT_DE } from './content.de';

const BUNDLES: Record<SiteLanguage, ContentBundle> = {
  en: CONTENT_EN,
  fr: CONTENT_FR,
  ar: CONTENT_AR,
  it: CONTENT_IT,
  de: CONTENT_DE,
};

export function getContentBundle(lang: SiteLanguage = 'en'): ContentBundle {
  return BUNDLES[lang] ?? CONTENT_EN;
}

export function getProfile(lang: SiteLanguage = 'en'): Profile {
  return getContentBundle(lang).profile;
}

export function getSkills(lang: SiteLanguage = 'en'): readonly SkillGroup[] {
  return getContentBundle(lang).skills;
}

export function getEducation(lang: SiteLanguage = 'en'): readonly Education[] {
  return getContentBundle(lang).education;
}

export function getLanguages(
  lang: SiteLanguage = 'en',
): readonly LanguageItem[] {
  return getContentBundle(lang).languages;
}

export function getAudiencesCopy(
  lang: SiteLanguage = 'en',
): Record<Audience, AudienceCopy> {
  return getContentBundle(lang).audiences;
}

export function getAudienceCopy(
  audience: Audience,
  lang: SiteLanguage = 'en',
): AudienceCopy {
  return (
    getContentBundle(lang).audiences[audience] ?? CONTENT_EN.audiences[audience]
  );
}

export function getExperience(lang: SiteLanguage = 'en'): readonly Role[] {
  return getContentBundle(lang).experience;
}

export function getServices(lang: SiteLanguage = 'en'): readonly Service[] {
  return getContentBundle(lang).services;
}

export function getProcess(lang: SiteLanguage = 'en'): readonly ProcessStep[] {
  return getContentBundle(lang).process;
}

export function getEngagement(lang: SiteLanguage = 'en'): string {
  return getContentBundle(lang).engagement;
}

export function getCaseStudies(
  lang: SiteLanguage = 'en',
): readonly CaseStudy[] {
  return getContentBundle(lang).caseStudies;
}

export function getCaseStudyBySlug(
  slug: string,
  lang: SiteLanguage = 'en',
): CaseStudy | undefined {
  return getContentBundle(lang).caseStudies.find(
    (study) => study.slug === slug,
  );
}
