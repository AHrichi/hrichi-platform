import type { ApiProblem, NightsResponse } from '@ah/shared/api-client';
import type { Place } from '@ah/labs/sky/domain';

/**
 * The shell's service worker has nothing to cache here, so the call skips
 * it with Angular's `ngsw-bypass` parameter, which needs no CORS preflight.
 */
function bypassServiceWorker(url: string): string {
  return `${url}${url.includes('?') ? '&' : '?'}ngsw-bypass=true`;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly problem: ApiProblem | null,
  ) {
    super(problem?.detail ?? `HTTP ${status}`);
  }
}

export interface RequestOptions {
  signal?: AbortSignal;
  /** Called once if the API hasn't answered after a few seconds (asleep). */
  onWaking?: () => void;
}

/** A free instance takes up to a minute to wake, plus the JVM's start. */
const DEADLINE_MS = 150_000;
const ATTEMPT_TIMEOUT_MS = 90_000;
const WAKING_AFTER_MS = 3_000;

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms);
    signal?.addEventListener('abort', () => {
      clearTimeout(timer);
      reject(signal.reason);
    });
  });

/**
 * The night planner on the Orbit API (ADR-0017), on Render's free tier: it
 * may be asleep, which resolves itself, so a request retries until a
 * deadline instead of failing at once.
 */
export class NightPlannerApi {
  constructor(
    private readonly baseUrl: string,
    private readonly fetcher: typeof fetch = (...args) => fetch(...args),
  ) {}

  /**
   * The coming nights at a place. Coordinates go out rounded to 0.1°
   * (about 11 km): enough for twilight times, and no one's exact spot.
   */
  nights(
    place: Place,
    zone: string,
    options?: RequestOptions,
  ): Promise<NightsResponse> {
    const query = new URLSearchParams({
      lat: place.lat.toFixed(1),
      lon: place.lon.toFixed(1),
      days: '14',
      zone,
    });
    return this.get<NightsResponse>(`/nights?${query}`, options);
  }

  private async get<T>(
    path: string,
    { signal, onWaking }: RequestOptions = {},
  ): Promise<T> {
    const deadline = Date.now() + DEADLINE_MS;
    const waking = setTimeout(() => onWaking?.(), WAKING_AFTER_MS);
    let pause = 2_000;
    try {
      for (;;) {
        const attempt = AbortSignal.any([
          AbortSignal.timeout(ATTEMPT_TIMEOUT_MS),
          ...(signal ? [signal] : []),
        ]);
        let response: Response | null = null;
        try {
          response = await this.fetcher(
            bypassServiceWorker(`${this.baseUrl}${path}`),
            { signal: attempt, headers: { Accept: 'application/json' } },
          );
        } catch (error) {
          if (signal?.aborted) {
            throw error;
          }
          // Network error or timeout: usually a sleeping instance.
        }
        if (response?.ok) {
          return (await response.json()) as T;
        }
        if (response && response.status !== 503 && response.status < 500) {
          const problem = await response.json().catch(() => null);
          throw new ApiError(response.status, problem);
        }
        const retryAfter = Number(response?.headers.get('Retry-After'));
        const wait = retryAfter > 0 ? retryAfter * 1000 : pause;
        if (Date.now() + wait > deadline) {
          throw new ApiError(response?.status ?? 0, null);
        }
        onWaking?.();
        await sleep(wait, signal);
        pause = Math.min(pause * 2, 10_000);
      }
    } finally {
      clearTimeout(waking);
    }
  }
}
