import { Routes } from '@angular/router';
import { EnergyPage } from './energy-page';
import { ExperiencePage } from './experience-page';

export const experienceRoutes: Routes = [
  { path: '', component: ExperiencePage },
];

/** /energy: the energy engineering degree and the projects that use it. */
export const energyRoutes: Routes = [{ path: '', component: EnergyPage }];
