/**
 * The contract between the site's contact form and the API (`POST /leads`).
 * Type-only, so the browser and Node share it without runtime coupling.
 */

export type LeadIntent = 'role' | 'project' | 'other';

export const leadIntents: readonly LeadIntent[] = ['role', 'project', 'other'];

export interface LeadRequest {
  name: string;
  email: string;
  message: string;
  intent: LeadIntent;
  /** The site's audience mode (?for=) when the form was sent. */
  audience?: 'recruiter' | 'engineer' | 'client';
  /** One UUID per filled-in form; retries reuse it, so a lead is stored once. */
  idempotencyKey: string;
  /** Cloudflare Turnstile response token. */
  turnstileToken: string;
  /** Honeypot field: hidden from people, so only bots fill it in. */
  website?: string;
}

export interface LeadResponse {
  id: string;
  status: 'accepted';
}

export const leadLimits = {
  name: 120,
  email: 254,
  message: 5000,
} as const;
