import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { caseStudies } from '@ah/shared/content';
import { Seo } from '@ah/portfolio/util-seo';
import { AhButton, LinkCard, SectionHeading } from '@ah/ui';

@Component({
  selector: 'ah-work-list-page',
  imports: [AhButton, LinkCard, RouterLink, SectionHeading],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './work-list-page.html',
  styleUrl: './work-list-page.scss',
})
export class WorkListPage {
  protected readonly studies = caseStudies;

  constructor() {
    inject(Seo).update({
      title: 'Case studies',
      description:
        'Case studies: instant 3D quoting, a schema-driven integration platform, a Three.js graphics library and this micro-frontend platform.',
      path: '/work',
    });
  }
}
