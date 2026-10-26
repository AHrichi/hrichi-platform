import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  education,
  experience,
  languages,
  profile,
  rolePeriod,
  skills,
} from '@ah/shared/content';
import { Seo } from '@ah/portfolio/util-seo';
import { SectionHeading, Tag } from '@ah/ui';

@Component({
  selector: 'ah-experience-page',
  imports: [RouterLink, SectionHeading, Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './experience-page.html',
  styleUrl: './experience-page.scss',
})
export class ExperiencePage {
  protected readonly profile = profile;
  protected readonly roles = experience.map((role) => ({
    ...role,
    period: rolePeriod(role),
  }));
  protected readonly skills = skills;
  protected readonly education = education;
  protected readonly languages = languages;

  constructor() {
    inject(Seo).update({
      title: 'Experience',
      description:
        'Five years of Angular and full-stack work at SeekMake, E-NOVATIONDUWEB and Euro Tech Conseil, plus skills, education and languages.',
      path: '/experience',
    });
  }
}
