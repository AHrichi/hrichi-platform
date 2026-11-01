import { Route } from '@angular/router';
import { remoteRoutes } from './remote.routes';

/** Standalone mode serves the same routes the shell mounts. */
export const appRoutes: Route[] = remoteRoutes;
