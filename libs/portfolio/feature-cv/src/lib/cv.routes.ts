import { Routes } from '@angular/router';
import { CvPage } from './cv-page';

export const cvRoutes: Routes = [
  { path: '', pathMatch: 'full', component: CvPage },
  // Bound to CvPage's `variant` input (withComponentInputBinding).
  { path: 'energy', component: CvPage, data: { variant: 'energy' } },
];
