import type { DashboardEnvironment } from './environment.model';

/**
 * The default and portfolio build: no server, the demo farm. The `local`
 * build (and `development`) swaps this file for one that names the
 * Supabase stack on this machine.
 */
export const environment: DashboardEnvironment = {
  supabase: null,
};
