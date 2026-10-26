import { Routes } from '@angular/router';
import { CaseStudyPage } from './case-study-page';
import { WorkListPage } from './work-list-page';

/** Needs the router's withComponentInputBinding() for the :slug input. */
export const workRoutes: Routes = [
  { path: '', component: WorkListPage },
  { path: ':slug', component: CaseStudyPage },
];
