import type { FieldEnvironment } from './environment.model';

/**
 * The hosted Supabase project `greenhouse-labor` (Paris, `eu-west-3`).
 * The publishable key is public by design: row-level security decides what
 * each signed-in person can read and write. Never put the secret key here.
 */
export const environment: FieldEnvironment = {
  supabase: {
    url: 'https://wxziozlataokzoftcpgb.supabase.co',
    anonKey: 'sb_publishable_6-ALBAOUkHiwxIR-F--DpQ_uxzmQTgS',
  },
};
