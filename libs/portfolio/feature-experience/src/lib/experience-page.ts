import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  getEducation,
  getExperience,
  getLanguages,
  getProfile,
  getSkills,
  rolePeriod,
} from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { Seo } from '@ah/portfolio/util-seo';
import { AhButton, SectionHeading, Tag } from '@ah/ui';
import { EXPERIENCE_COPY } from './experience-copy';

@Component({
  selector: 'ah-experience-page',
  imports: [AhButton, RouterLink, SectionHeading, Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './experience-page.html',
  styleUrl: './experience-page.scss',
})
export class ExperiencePage {
  protected readonly preferences = inject(PreferencesStore);
  protected readonly copy = computed(
    () => EXPERIENCE_COPY[this.preferences.language()] ?? EXPERIENCE_COPY.en,
  );
  protected readonly profile = computed(() =>
    getProfile(this.preferences.language()),
  );
  protected readonly roles = computed(() => {
    const lang = this.preferences.language();
    return getExperience(lang).map((role) => ({
      ...role,
      period: rolePeriod(role, lang),
    }));
  });
  protected readonly skills = computed(() =>
    getSkills(this.preferences.language()),
  );
  protected readonly education = computed(() =>
    getEducation(this.preferences.language()),
  );
  protected readonly languages = computed(() =>
    getLanguages(this.preferences.language()),
  );

  constructor() {
    inject(Seo).update({
      title: 'Experience',
      description:
        'Five years of Angular and full-stack work at SeekMake, E-NOVATIONDUWEB and Euro Tech Conseil, plus skills, education and languages.',
      path: '/experience',
    });
  }
}
