import { Routes } from '@angular/router';
import { AlarmEngineShellComponent } from './shell/alarm-engine-shell.component';

export const ALARM_ENGINE_ROUTES: Routes = [
  {
    path: '',
    component: AlarmEngineShellComponent,
    title: 'Nightly Alarm Decision Engine',
  },
];
