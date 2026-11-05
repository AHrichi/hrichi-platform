import { audienceCopy } from '../audiences';
import { caseStudies } from '../case-studies';
import { experience } from '../experience';
import { education, languages, profile, skills } from '../profile';
import { engagement, process, services } from '../services';
import type { ContentBundle } from './content-i18n.types';

export const CONTENT_EN: ContentBundle = {
  profile,
  skills,
  education,
  languages,
  audiences: audienceCopy,
  experience,
  services,
  process,
  engagement,
  caseStudies,
};
