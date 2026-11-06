import type { Routes } from '@angular/router';
import { AutoSphereShellComponent } from './shell/autosphere-shell.component';

export const AUTOSPHERE_ROUTES: Routes = [
  {
    path: '',
    component: AutoSphereShellComponent,
    title: 'AutoSphere — Digital Showroom & Dynamic Configurator',
  },
];
