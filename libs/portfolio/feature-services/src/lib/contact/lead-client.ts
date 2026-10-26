import type { LeadRequest, LeadResponse } from '@ah/shared/contracts';

/** Why a lead could not be sent. */
export type LeadFailure = 'rejected' | 'invalid' | 'unreachable';

export class LeadError extends Error {
  constructor(readonly reason: LeadFailure) {
    super(reason);
  }
}

/** Waits between attempts: ~90 s in total covers a free-tier cold start. */
export const retryDelaysMs = [3000, 6000, 12_000, 24_000, 30_000];

export interface SendOptions {
  fetchFn?: typeof fetch;
  sleep?: (ms: number) => Promise<void>;
  /** Called before each retry, so the UI can say the server is waking up. */
  onRetry?: (attempt: number) => void;
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

/**
 * POST /leads with retries for network errors, timeouts and 5xx. Safe to
 * retry because the idempotency key makes the API store the lead once.
 */
export async function sendLead(
  apiUrl: string,
  lead: LeadRequest,
  { fetchFn = fetch, sleep = wait, onRetry }: SendOptions = {},
): Promise<LeadResponse> {
  for (let attempt = 0; ; attempt++) {
    let status: number | null = null;
    try {
      const response = await fetchFn(`${apiUrl}/leads`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(lead),
        signal: AbortSignal.timeout(20_000),
      });
      if (response.ok) {
        return (await response.json()) as LeadResponse;
      }
      status = response.status;
    } catch {
      // Network error or timeout: the server may be waking up.
    }
    if (status === 403) {
      throw new LeadError('rejected');
    }
    if (status !== null && status >= 400 && status < 500 && status !== 429) {
      throw new LeadError('invalid');
    }
    const delay = retryDelaysMs[attempt];
    if (delay === undefined) {
      throw new LeadError('unreachable');
    }
    onRetry?.(attempt + 1);
    await sleep(delay);
  }
}

/** Wakes a sleeping free-tier API early; the result doesn't matter. */
export function prewarm(apiUrl: string, fetchFn: typeof fetch = fetch): void {
  fetchFn(`${apiUrl}/health`, { signal: AbortSignal.timeout(60_000) }).catch(
    () => undefined,
  );
}
