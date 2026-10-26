import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  caseStudyBySlug,
  engagement,
  mailto,
  process,
  services,
} from '@ah/shared/content';
import { Seo } from '@ah/portfolio/util-seo';
import { ActionLink, SectionHeading } from '@ah/ui';

@Component({
  selector: 'ah-services-page',
  imports: [ActionLink, RouterLink, SectionHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './services-page.html',
  styleUrl: './services-page.scss',
})
export class ServicesPage {
  protected readonly engagement = engagement;
  protected readonly process = process;
  protected readonly services = services.map((service) => ({
    ...service,
    proofStudies: service.proof.flatMap((slug) => caseStudyBySlug(slug) ?? []),
  }));
  protected readonly startProject = {
    label: 'Start a project',
    href: mailto('Project enquiry'),
  };

  constructor() {
    inject(Seo).update({
      title: 'Services',
      description:
        'Freelance Angular modernization, Nx monorepos and micro-frontends, Three.js 3D product experiences, NestJS and n8n integrations, PWAs and desktop apps.',
      path: '/services',
    });
  }
}
