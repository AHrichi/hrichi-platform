import type { FieldEnvironment } from './environment.model';

/** The farm's hosted Supabase project. Null until one is set up. */
export const environment: FieldEnvironment = {
  supabase: null,
};
