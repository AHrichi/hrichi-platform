/** Who a visitor is; the site reorders and rewords itself for each (`?for=`). */
export type Audience = 'recruiter' | 'engineer' | 'client';

export interface Link {
  label: string;
  href: string;
  /** External links open in a new tab and get rel="noopener". */
  external?: boolean;
}

export interface Profile {
  name: string;
  role: string;
  location: string;
  workSetup: string;
  timezone: string;
  availability: string;
  summary: string;
  email: string;
  linkedin: string;
  github: string;
}

export interface Role {
  company: string;
  title: string;
  location: string;
  /** ISO month, e.g. 2023-10 */
  start: string;
  /** ISO month; omitted while the role is current. */
  end?: string;
  context: string;
  highlights: readonly { title: string; text: string }[];
  stack: readonly string[];
}

export interface Education {
  title: string;
  school: string;
  period: string;
}

export interface SkillGroup {
  name: string;
  items: readonly string[];
}

/** An app in this portfolio that does engineering work, told for the energy CV. */
export interface EngineeringProject {
  /** The app's key in PORTFOLIO_APPS_CONFIG; it opens at /apps/<id>. */
  id: 'serracalc' | 'lighting';
  name: string;
  title: string;
  summary: string;
  highlights: readonly { title: string; text: string }[];
  /** Standards and published methods the calculations follow. */
  methods: readonly string[];
}

/** The energy engineering track: the degree and the work that uses it. */
export interface EnergyProfile {
  role: string;
  summary: string;
  degree: Education;
  skills: readonly SkillGroup[];
  projects: readonly EngineeringProject[];
  targetRoles: readonly string[];
}

export interface Decision {
  decision: string;
  why: string;
}

export interface CaseStudy {
  slug: string;
  title: string;
  summary: string;
  client: string;
  period: string;
  role: string;
  context: string;
  problem: string;
  approach: readonly Decision[];
  outcome: readonly string[];
  stack: readonly string[];
  links?: readonly Link[];
  /** Shown when the work was for an employer: what is and isn't public. */
  confidentiality?: string;
  /** Order on the home page per audience; lower comes first. */
  rank: Record<Audience, number>;
}

export interface Service {
  id: string;
  title: string;
  summary: string;
  deliverables: readonly string[];
  /** Slugs of case studies that prove the service. */
  proof: readonly string[];
}

export interface ProcessStep {
  title: string;
  text: string;
}

export type HomeSection = 'work' | 'services' | 'experience' | 'platform';

export interface AudienceCopy {
  label: string;
  headline: string;
  intro: string;
  primaryCta: Link;
  secondaryCta: Link;
  sections: readonly HomeSection[];
}
