import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  type Audience,
  audiences,
  getAudiencesCopy,
  getCaseStudies,
  getExperience,
  getProfile,
  getServices,
  rolePeriod,
  site,
} from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { personJsonLd, Seo } from '@ah/portfolio/util-seo';
import {
  ActionLink,
  LinkCard,
  SectionHeading,
  SegmentedControl,
  type SegmentedOption,
} from '@ah/ui';
import { ConstellationFigure } from './constellation/constellation-figure';
import { HOME_COPY } from './home-copy';

@Component({
  selector: 'ah-home-page',
  imports: [
    ActionLink,
    ConstellationFigure,
    LinkCard,
    RouterLink,
    SectionHeading,
    SegmentedControl,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  protected readonly preferences = inject(PreferencesStore);
  protected readonly copy = computed(
    () => HOME_COPY[this.preferences.language()] ?? HOME_COPY.en,
  );
  protected readonly profile = computed(() =>
    getProfile(this.preferences.language()),
  );
  protected readonly currentRole = computed(
    () => getExperience(this.preferences.language())[0],
  );
  protected readonly currentPeriod = computed(() =>
    rolePeriod(this.currentRole(), this.preferences.language()),
  );
  protected readonly featuredServices = computed(() =>
    getServices(this.preferences.language()).slice(0, 3),
  );
  /** The closing call to action: the form first, then email and the CV. */
  protected readonly closingLinks = computed(() => {
    const c = this.copy().closing;
    return {
      contact: { label: c.contact, href: '/contact' },
      email: { label: c.email, href: 'mailto:' + this.profile().email },
      cv: { label: c.cv, href: '/cv' },
    };
  });
  protected readonly repository = site.repository;
  protected readonly designSystem = site.designSystem;

  protected readonly audienceOptions = computed<SegmentedOption<Audience>[]>(
    () => {
      const auds = getAudiencesCopy(this.preferences.language());
      return audiences.map((value) => ({
        value,
        label: auds[value].label,
      }));
    },
  );

  /** The three case studies this audience should see first. */
  protected readonly featuredWork = computed(() => {
    const audience = this.preferences.audience();
    const studies = getCaseStudies(this.preferences.language());
    return [...studies]
      .sort((a, b) => a.rank[audience] - b.rank[audience])
      .slice(0, 3);
  });

  constructor() {
    const seo = inject(Seo);
    seo.update({
      description: `${getProfile('en').role} with 5+ years of enterprise SaaS: Angular, Nx monorepos, micro-frontends, Three.js and NestJS. Case studies, services and CV.`,
      path: '/',
      type: 'profile',
    });
    seo.setJsonLd('person', personJsonLd());
    inject(DestroyRef).onDestroy(() => seo.removeJsonLd('person'));
  }
}
