// The Supabase config and token are shared with the dashboard.
export {
  GREENHOUSE_SUPABASE,
  type GreenhouseSupabaseConfig,
} from '@ah/products/greenhouse/data-access';

/** The field app's IndexedDB names (ADR-0026). */
export const FIELD_DB = {
  app: 'greenhouse-field',
  standalone: 'greenhouse_field_v1',
} as const;
