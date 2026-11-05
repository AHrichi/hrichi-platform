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

export type SiteLanguage = 'fr' | 'ar' | 'en' | 'it' | 'de';

export interface LanguageItem {
  language: string;
  level: string;
}

export interface ContentBundle {
  profile: Profile;
  skills: readonly SkillGroup[];
  education: readonly Education[];
  languages: readonly LanguageItem[];
  audiences: Record<Audience, AudienceCopy>;
  experience: readonly Role[];
  services: readonly Service[];
  process: readonly ProcessStep[];
  engagement: string;
  caseStudies: readonly CaseStudy[];
}
