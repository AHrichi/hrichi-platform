import type { Routes } from '@angular/router';
import { SystemDesignShell } from './shell/system-design-shell';

/** Mounted under /apps/system-design in the portfolio and at / standalone. */
export const SYSTEM_DESIGN_ROUTES: Routes = [
  { path: '', component: SystemDesignShell, title: 'System Design' },
  { path: '**', redirectTo: '' },
];
