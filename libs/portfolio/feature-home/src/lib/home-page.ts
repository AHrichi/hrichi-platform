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
  audienceCopy,
  audiences,
  caseStudies,
  experience,
  profile,
  rolePeriod,
  services,
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

@Component({
  selector: 'ah-home-page',
  imports: [ActionLink, LinkCard, RouterLink, SectionHeading, SegmentedControl],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  protected readonly preferences = inject(PreferencesStore);
  protected readonly profile = profile;
  protected readonly currentRole = experience[0];
  protected readonly currentPeriod = rolePeriod(experience[0]);
  protected readonly featuredServices = services.slice(0, 3);
  protected readonly repository = site.repository;
  protected readonly audienceOptions: SegmentedOption<Audience>[] =
    audiences.map((value) => ({ value, label: audienceCopy[value].label }));

  /** The three case studies this audience should see first. */
  protected readonly featuredWork = computed(() => {
    const audience = this.preferences.audience();
    return [...caseStudies]
      .sort((a, b) => a.rank[audience] - b.rank[audience])
      .slice(0, 3);
  });

  constructor() {
    const seo = inject(Seo);
    seo.update({
      description: `${profile.role} with 5+ years of enterprise SaaS: Angular, Nx monorepos, micro-frontends, Three.js and NestJS. Case studies, services and CV.`,
      path: '/',
      type: 'profile',
    });
    seo.setJsonLd('person', personJsonLd());
    inject(DestroyRef).onDestroy(() => seo.removeJsonLd('person'));
  }
}
