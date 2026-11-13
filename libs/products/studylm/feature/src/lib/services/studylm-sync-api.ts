import type {
  StudyLmDevicePaired,
  StudyLmDeviceSummary,
  StudyLmPairingStarted,
  StudyLmSyncRequest,
  StudyLmSyncResponse,
} from '@ah/products/studylm/domain';

export type StudyLmSyncApiErrorKind =
  'network' | 'unauthorized' | 'refused' | 'server';

export class StudyLmSyncApiError extends Error {
  override readonly name = 'StudyLmSyncApiError';

  constructor(
    readonly kind: StudyLmSyncApiErrorKind,
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
  }
}

/**
 * Render's free instance sleeps after 15 minutes of inactivity and may take up
 * to ~60s on cold start, so allow 90s for sync/pairing requests.
 */
const TIMEOUT_MS = 90_000;

type Fetch = typeof fetch;

export class StudyLmSyncApi {
  private readonly base: string;

  constructor(
    apiUrl: string,
    private readonly fetchFn: Fetch = (input, init) => fetch(input, init),
  ) {
    this.base = `${apiUrl.replace(/\/+$/, '')}/studylm`;
  }

  startPairing(deviceName: string): Promise<StudyLmPairingStarted> {
    return this.call('POST', '/pairing', { deviceName });
  }

  confirmPairing(
    pairingId: string,
    code: string,
  ): Promise<StudyLmDevicePaired> {
    return this.call(
      'POST',
      `/pairing/${encodeURIComponent(pairingId)}/confirm`,
      { code },
    );
  }

  sync(
    request: StudyLmSyncRequest,
    token: string,
  ): Promise<StudyLmSyncResponse> {
    return this.call('POST', '/sync', request, token);
  }

  devices(token: string): Promise<StudyLmDeviceSummary[]> {
    return this.call('GET', '/devices', undefined, token);
  }

  revokeDevice(deviceId: string, token: string): Promise<void> {
    return this.call(
      'DELETE',
      `/devices/${encodeURIComponent(deviceId)}`,
      undefined,
      token,
    );
  }

  private async call<T>(
    method: 'GET' | 'POST' | 'DELETE',
    path: string,
    body?: unknown,
    token?: string,
  ): Promise<T> {
    const headers: Record<string, string> = {};
    if (token) headers['authorization'] = `Bearer ${token}`;
    if (body !== undefined) headers['content-type'] = 'application/json';

    let response: Response;
    try {
      response = await this.fetchFn(`${this.base}${path}`, {
        method,
        headers,
        body: body !== undefined ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new StudyLmSyncApiError(
        'network',
        'Could not reach the sync server. Check your connection or try again in a moment.',
      );
    }

    if (response.status === 204) return undefined as T;

    const payload = await response.json().catch(() => null);
    if (!response.ok) {
      const serverMessage = formatServerError(payload);
      if (response.status === 401) {
        throw new StudyLmSyncApiError(
          'unauthorized',
          serverMessage ??
            'This device link expired or was revoked. Pair again.',
          401,
        );
      }
      if (response.status >= 400 && response.status < 500) {
        throw new StudyLmSyncApiError(
          'refused',
          serverMessage ?? `Request rejected (${response.status}).`,
          response.status,
        );
      }
      throw new StudyLmSyncApiError(
        'server',
        serverMessage ?? `Sync server returned ${response.status}.`,
        response.status,
      );
    }

    return payload as T;
  }
}

function formatServerError(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const record = payload as { message?: unknown; issues?: unknown };
  const base = typeof record.message === 'string' ? record.message : null;
  if (!Array.isArray(record.issues) || record.issues.length === 0) {
    return base;
  }
  console.warn('[studylm] sync contract rejected', record.issues);
  const first = record.issues[0] as { path?: unknown; message?: unknown };
  const detail = [first?.path, first?.message]
    .filter(
      (part): part is string => typeof part === 'string' && part.length > 0,
    )
    .join(': ');
  if (!detail) return base;
  return base ? `${base} (${detail})` : detail;
}
