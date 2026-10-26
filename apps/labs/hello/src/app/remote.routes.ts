import { Routes } from '@angular/router';
import { HelloLab } from './hello-lab';

/** Exposed as `./routes`; the shell mounts these under its own path. */
export const remoteRoutes: Routes = [{ path: '', component: HelloLab }];
