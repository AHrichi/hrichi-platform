import type { GreenhouseSupabaseConfig } from '@ah/products/greenhouse/data-access';

/** What a build of the field app talks to. Kept apart from `environment.ts`, which builds swap out. */
export interface FieldEnvironment {
  /** Null: the demo farm and its pretend server. */
  supabase: GreenhouseSupabaseConfig | null;
}
