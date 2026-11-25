import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { energyProjects, getEnergyProfile, site } from '@ah/shared/content';
import { PreferencesStore } from '@ah/shared/state';
import { Seo } from '@ah/portfolio/util-seo';
import { AhButton, SectionHeading, Tag } from '@ah/ui';
import { ENERGY_COPY } from './energy-copy';

/**
 * The energy engineering degree and the work that uses it, for readers
 * hiring for energy roles. The energy CV (/cv/energy) prints the same facts.
 */
@Component({
  selector: 'ah-energy-page',
  imports: [AhButton, RouterLink, SectionHeading, Tag],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './energy-page.html',
  styleUrl: './energy-page.scss',
})
export class EnergyPage {
  protected readonly preferences = inject(PreferencesStore);
  protected readonly copy = computed(
    () => ENERGY_COPY[this.preferences.language()] ?? ENERGY_COPY.en,
  );
  protected readonly energy = computed(() =>
    getEnergyProfile(this.preferences.language()),
  );
  protected readonly projects = computed(() =>
    energyProjects(this.preferences.language()),
  );
  protected readonly pdfHref = `/${site.energyCvFile}`;

  constructor() {
    inject(Seo).update({
      title: 'Energy engineering',
      description:
        'Energy engineer (ENIM) who builds engineering software: greenhouse heating, cooling and water sizing with SerraCalc, and solar and grid street lighting with LuxPath.',
      path: '/energy',
    });
  }
}
