import { InjectionToken } from '@angular/core';

/** The Supabase project the field app sends to in standalone mode. */
export interface GreenhouseSupabaseConfig {
  url: string;
  /** The project's public anon key; row-level security does the guarding. */
  anonKey: string;
}

/**
 * Null (the default) means no server: entries stay on the phone. The
 * portfolio demo ignores it and talks to a pretend server instead.
 */
export const GREENHOUSE_SUPABASE =
  new InjectionToken<GreenhouseSupabaseConfig | null>('GREENHOUSE_SUPABASE', {
    providedIn: 'root',
    factory: () => null,
  });

/** The field app's IndexedDB names (ADR-0026). */
export const FIELD_DB = {
  app: 'greenhouse-field',
  standalone: 'greenhouse_field_v1',
} as const;
