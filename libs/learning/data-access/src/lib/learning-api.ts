import type {
  DevicePaired,
  DeviceSummary,
  PairingStarted,
  SyncRequest,
  SyncResponse,
} from '@ah/learning/domain';

export type LearningApiErrorKind =
  /** No connection, or the server took too long (it may be waking up). */
  | 'network'
  /** The token is missing, expired or revoked: pair again. */
  | 'unauthorized'
  /** The server refused the request; `message` says why. */
  | 'refused'
  /** The server failed. */
  | 'server';

export class LearningApiError extends Error {
  override readonly name = 'LearningApiError';

  constructor(
    readonly kind: LearningApiErrorKind,
    message: string,
    readonly status: number | null = null,
  ) {
    super(message);
  }
}

/**
 * Render's free tier sleeps after 15 minutes and takes about a minute to
 * wake, so a first request may wait that long (architecture §10).
 */
const TIMEOUT_MS = 90_000;

type Fetch = typeof fetch;

/** The Learning Engine's HTTP API (`/learning/*` on the Nest API). */
export class LearningApi {
  private readonly base: string;

  constructor(
    apiUrl: string,
    private readonly fetchFn: Fetch = (input, init) => fetch(input, init),
  ) {
    this.base = `${apiUrl.replace(/\/+$/, '')}/learning`;
  }

  startPairing(deviceName: string): Promise<PairingStarted> {
    return this.call('POST', '/pairing', { deviceName });
  }

  confirmPairing(pairingId: string, code: string): Promise<DevicePaired> {
    return this.call(
      'POST',
      `/pairing/${encodeURIComponent(pairingId)}/confirm`,
      {
        code,
      },
    );
  }

  sync(request: SyncRequest, token: string): Promise<SyncResponse> {
    return this.call('POST', '/sync', request, token);
  }

  devices(token: string): Promise<DeviceSummary[]> {
    return this.call('GET', '/devices', undefined, token);
  }

  async revokeDevice(id: string, token: string): Promise<void> {
    await this.call(
      'DELETE',
      `/devices/${encodeURIComponent(id)}`,
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
    let response: Response;
    try {
      response = await this.fetchFn(`${this.base}${path}`, {
        method,
        headers: {
          ...(body === undefined ? {} : { 'content-type': 'application/json' }),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new LearningApiError(
        'network',
        'The server could not be reached. Your changes are saved on this device.',
      );
    }
    if (response.status === 204) return undefined as T;
    const payload: unknown = await response.json().catch(() => null);
    if (response.ok) return payload as T;

    const message =
      messageOf(payload) ?? `The server answered ${response.status}.`;
    if (response.status === 401) {
      throw new LearningApiError('unauthorized', message, 401);
    }
    if (response.status >= 500) {
      throw new LearningApiError('server', message, response.status);
    }
    throw new LearningApiError('refused', message, response.status);
  }
}

function messageOf(payload: unknown): string | null {
  if (payload && typeof payload === 'object' && 'message' in payload) {
    const message = (payload as { message: unknown }).message;
    if (typeof message === 'string') return message;
    if (Array.isArray(message)) return message.join(' ');
  }
  return null;
}
