import type { RemoteErrorKind } from './remote-error';

/** The private bucket hygiene photos go to (`<farm>/<check>/<file>`). */
export const HYGIENE_BUCKET = 'hygiene-photos';

/** A Storage API failure, as supabase-js reports it. */
export interface StorageFailure {
  message: string;
  status?: number | string;
  statusCode?: number | string;
}

/**
 * What a failed upload means. `'exists'`: the photo is already there (a
 * retry after a lost reply), which counts as done.
 */
export function classifyStorageFailure(
  error: StorageFailure,
): RemoteErrorKind | 'exists' {
  const status = Number(error.status ?? error.statusCode ?? 0);
  const message = error.message ?? '';
  if (/already exists|duplicate/i.test(message) || status === 409) {
    return 'exists';
  }
  if (
    status === 0 ||
    /failed to fetch|networkerror|fetch failed|load failed/i.test(message)
  ) {
    return 'offline';
  }
  if (/row-level security|unauthorized|not allowed/i.test(message)) {
    return 'rejected';
  }
  if (status === 401 || /jwt/i.test(message)) return 'auth';
  if (status === 408 || status === 429 || status >= 500) return 'server';
  return 'rejected';
}
