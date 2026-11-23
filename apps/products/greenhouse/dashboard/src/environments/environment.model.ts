import type { GreenhouseSupabaseConfig } from '@ah/products/greenhouse/data-access';

/** What a build of the dashboard talks to. Kept apart from `environment.ts`, which builds swap out. */
export interface DashboardEnvironment {
  /** Null: the demo farm, in memory. */
  supabase: GreenhouseSupabaseConfig | null;
}
