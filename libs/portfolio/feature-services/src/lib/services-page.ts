import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  getCaseStudyBySlug,
  getEngagement,
  getProcess,
  getServices,
  mailto,
} from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { Seo } from '@ah/portfolio/util-seo';
import { ActionLink, SectionHeading } from '@ah/ui';
import { SERVICES_COPY } from './services-copy';

@Component({
  selector: 'ah-services-page',
  imports: [ActionLink, RouterLink, SectionHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './services-page.html',
  styleUrl: './services-page.scss',
})
export class ServicesPage {
  protected readonly preferences = inject(PreferencesStore);
  protected readonly copy = computed(
    () => SERVICES_COPY[this.preferences.language()] ?? SERVICES_COPY.en,
  );
  protected readonly engagement = computed(() =>
    getEngagement(this.preferences.language()),
  );
  protected readonly process = computed(() =>
    getProcess(this.preferences.language()),
  );
  protected readonly services = computed(() => {
    const lang = this.preferences.language();
    return getServices(lang).map((service) => ({
      ...service,
      proofStudies: service.proof.flatMap(
        (slug) => getCaseStudyBySlug(slug, lang) ?? [],
      ),
    }));
  });
  protected readonly startProject = computed(() => ({
    label: this.copy().services.startProject,
    href: mailto(this.copy().services.projectEnquiry),
  }));

  constructor() {
    inject(Seo).update({
      title: 'Services',
      description:
        'Freelance Angular modernization, Nx monorepos and micro-frontends, Three.js 3D product experiences, NestJS and n8n integrations, PWAs and desktop apps.',
      path: '/services',
    });
  }
}
