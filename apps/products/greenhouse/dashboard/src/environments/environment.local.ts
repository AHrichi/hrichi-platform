import type { DashboardEnvironment } from './environment.model';

/**
 * The Supabase stack `supabase start` runs on this machine (see the
 * Supabase README). Its anon key is the CLI's fixed local-development key.
 */
export const environment: DashboardEnvironment = {
  supabase: {
    url: 'http://127.0.0.1:54321',
    anonKey: 'sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH',
  },
};
