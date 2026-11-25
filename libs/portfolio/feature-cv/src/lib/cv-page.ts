import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  OnInit,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  energyProjects,
  getEducation,
  getEnergyProfile,
  getExperience,
  getLanguages,
  getProfile,
  getSkills,
  rolePeriod,
  site,
} from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { Seo } from '@ah/portfolio/util-seo';
import { AhButton } from '@ah/ui';
import { CV_COPY } from './cv-copy';

/** Which CV: the software one at /cv, or the energy engineering one at /cv/energy. */
export type CvVariant = 'software' | 'energy';

const siteHost = new URL(site.url).host;

/**
 * The CV as a page. The deploy step prints /cv to /ahmed-hrichi-cv.pdf and
 * /cv/energy to /ahmed-hrichi-energy-cv.pdf, so the site and the PDFs never
 * disagree.
 */
@Component({
  selector: 'ah-cv-page',
  imports: [AhButton, NgTemplateOutlet, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cv-page.html',
  styleUrl: './cv-page.scss',
})
export class CvPage implements OnInit {
  /** Bound from the route's data; any other value means the software CV. */
  readonly variant = input<CvVariant>();

  private readonly document = inject(DOCUMENT);
  private readonly seo = inject(Seo);
  protected readonly preferences = inject(PreferencesStore);
  protected readonly isEnergy = computed(() => this.variant() === 'energy');
  protected readonly copy = computed(
    () => CV_COPY[this.preferences.language()] ?? CV_COPY.en,
  );
  protected readonly profile = computed(() =>
    getProfile(this.preferences.language()),
  );
  private readonly energy = computed(() =>
    getEnergyProfile(this.preferences.language()),
  );
  protected readonly role = computed(() =>
    this.isEnergy() ? this.energy().role : this.profile().role,
  );
  protected readonly summary = computed(() =>
    this.isEnergy() ? this.energy().summary : this.profile().summary,
  );
  protected readonly pdfHref = computed(
    () => `/${this.isEnergy() ? site.energyCvFile : site.cvFile}`,
  );
  /** Screen only: each CV links to the other. */
  protected readonly otherCv = computed(() =>
    this.isEnergy()
      ? { path: '/cv', label: this.copy().toSoftwareCv }
      : { path: '/cv/energy', label: this.copy().toEnergyCv },
  );
  protected readonly portfolio = {
    href: `${site.url}/energy`,
    label: `${siteHost}/energy`,
  };
  protected readonly projects = computed(() =>
    this.isEnergy()
      ? energyProjects(this.preferences.language()).map((project) => ({
          ...project,
          href: `${site.url}/apps/${project.id}`,
          label: `${siteHost}/apps/${project.id}`,
        }))
      : [],
  );
  protected readonly roles = computed(() => {
    const lang = this.preferences.language();
    return getExperience(lang).map((role) => ({
      ...role,
      period: rolePeriod(role, lang),
    }));
  });
  protected readonly skills = computed(() =>
    this.isEnergy()
      ? this.energy().skills
      : getSkills(this.preferences.language()),
  );
  protected readonly education = computed(() =>
    getEducation(this.preferences.language()),
  );
  protected readonly languages = computed(() =>
    getLanguages(this.preferences.language()),
  );

  ngOnInit(): void {
    const { name, role } = getProfile('en');
    this.seo.update(
      this.isEnergy()
        ? {
            title: 'Energy engineering CV',
            description: `Energy engineering CV of ${name}: ENIM degree in energy engineering, greenhouse heating and solar lighting projects, skills and languages.`,
            path: '/cv/energy',
          }
        : {
            title: 'CV',
            description: `CV of ${name}, ${role}: experience, skills, education and languages.`,
            path: '/cv',
          },
    );
  }

  protected print(): void {
    this.document.defaultView?.print();
  }
}
