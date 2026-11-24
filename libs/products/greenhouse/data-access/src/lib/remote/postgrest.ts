import { RemoteError, type RemoteErrorKind } from './remote-error';

/** The parts of a PostgREST reply that say what went wrong. */
export interface PostgrestFailure {
  status: number;
  error: { message: string; code?: string } | null;
}

/**
 * What a failed PostgREST call means for the sync. Data the database
 * refuses (constraints, RLS, bad values) is `rejected`; a missing network,
 * a timeout or a busy server is worth retrying.
 */
export function classifyFailure({
  status,
  error,
}: PostgrestFailure): RemoteErrorKind {
  const code = error?.code ?? '';
  const message = error?.message ?? '';
  if (
    status === 0 ||
    /failed to fetch|networkerror|fetch failed|load failed/i.test(message) ||
    // Angular's service worker answers a request it couldn't send with an
    // empty 504, which is how no signal looks once the app is installed.
    (status === 504 && !code)
  ) {
    return 'offline';
  }
  if (status === 401 || code.startsWith('PGRST30') || /jwt/i.test(message)) {
    return 'auth';
  }
  if (status === 408 || status === 429 || status >= 500) return 'server';
  // 22xxx bad data, 23xxx constraints, 42501 row-level security.
  if (
    /^(22|23)/.test(code) ||
    code === '42501' ||
    (status >= 400 && status < 500)
  ) {
    return 'rejected';
  }
  return 'server';
}

/** A supabase-js query, awaited for its data, error and HTTP status. */
export type PostgrestQuery<T> = PromiseLike<{
  data: T;
  error: { message: string; code?: string } | null;
  status: number;
}>;

/** Awaits a query and turns a failure into a `RemoteError`. */
export async function callPostgrest<T>(query: PostgrestQuery<T>): Promise<T> {
  let reply: Awaited<typeof query>;
  try {
    reply = await query;
  } catch (error) {
    throw new RemoteError('offline', String(error));
  }
  if (reply.error) {
    throw new RemoteError(classifyFailure(reply), reply.error.message);
  }
  return reply.data;
}
