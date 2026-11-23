import type { FieldEnvironment } from './environment.model';

/**
 * The demo build (`build:demo`, the portfolio): no server. The `local` and
 * `production` builds swap this file for one that names a Supabase project.
 */
export const environment: FieldEnvironment = {
  supabase: null,
};
