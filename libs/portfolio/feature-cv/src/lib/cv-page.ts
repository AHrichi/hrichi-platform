import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import {
  education,
  experience,
  languages,
  profile,
  rolePeriod,
  site,
  skills,
} from '@ah/shared/content';
import { Seo } from '@ah/portfolio/util-seo';
import { AhButton } from '@ah/ui';

/**
 * The CV as a page. The deploy step prints this route to
 * /ahmed-hrichi-cv.pdf, so the site and the PDF never disagree.
 */
@Component({
  selector: 'ah-cv-page',
  imports: [AhButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cv-page.html',
  styleUrl: './cv-page.scss',
})
export class CvPage {
  private readonly document = inject(DOCUMENT);
  protected readonly profile = profile;
  protected readonly pdfHref = `/${site.cvFile}`;
  protected readonly roles = experience.map((role) => ({
    ...role,
    period: rolePeriod(role),
  }));
  protected readonly skills = skills;
  protected readonly education = education;
  protected readonly languages = languages;

  constructor() {
    inject(Seo).update({
      title: 'CV',
      description: `CV of ${profile.name}, ${profile.role}: experience, skills, education and languages.`,
      path: '/cv',
    });
  }

  protected print(): void {
    this.document.defaultView?.print();
  }
}
