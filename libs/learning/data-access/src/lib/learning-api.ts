import type { HostLinked, HostLinkRequest } from '@ah/learning/contracts';
import type {
  Capture,
  Concept,
  DevicePaired,
  DeviceSummary,
  PairingStarted,
  SyncRequest,
  SyncResponse,
  TeachBackFeedback,
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

  /** A voice note's audio; 404 means its capture hasn't synced yet. */
  uploadAudio(
    captureId: string,
    audio: { bytes: ArrayBuffer; mimeType: string },
    token: string,
  ): Promise<Capture> {
    const form = new FormData();
    form.append(
      'audio',
      new Blob([audio.bytes], { type: audio.mimeType }),
      'voice-note',
    );
    return this.call(
      'POST',
      `/captures/${encodeURIComponent(captureId)}/audio`,
      form,
      token,
    );
  }

  /** "Make it simpler": the server rewrites the explanation. */
  revise(
    conceptId: string,
    instruction: string,
    token: string,
  ): Promise<Concept> {
    return this.call(
      'POST',
      `/concepts/${encodeURIComponent(conceptId)}/revise`,
      { instruction },
      token,
    );
  }

  /** Grades a typed answer; callers give it a short deadline. */
  grade(
    request: {
      question: string;
      expected: string;
      keyPoints: string[];
      answer: string;
    },
    token: string,
    signal?: AbortSignal,
  ): Promise<{
    verdict: 'nailed' | 'close' | 'missed' | null;
    missed: string[];
    suggested: 'again' | 'hard' | 'good' | null;
  }> {
    return this.call('POST', '/grade', request, token, signal);
  }

  /** A teach-back's recording, as text. */
  transcribe(
    audio: { bytes: ArrayBuffer; mimeType: string },
    token: string,
    signal?: AbortSignal,
  ): Promise<{ text: string }> {
    const form = new FormData();
    form.append(
      'audio',
      new Blob([audio.bytes], { type: audio.mimeType }),
      'teach-back',
    );
    return this.call('POST', '/transcribe', form, token, signal);
  }

  /** Judges a teach-back by its points and clarity. */
  teachBack(
    request: { title: string; points: string[]; transcript: string },
    token: string,
    signal?: AbortSignal,
  ): Promise<TeachBackFeedback> {
    return this.call('POST', '/teach-back', request, token, signal);
  }

  /** Lets a host app in (design §9): a link for the host routes only. */
  linkHost(request: HostLinkRequest, token: string): Promise<HostLinked> {
    return this.call('POST', '/hosts', request, token);
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
    signal?: AbortSignal,
  ): Promise<T> {
    let response: Response;
    try {
      response = await this.fetchFn(`${this.base}${path}`, {
        method,
        headers: {
          // FormData sets its own multipart content type and boundary.
          ...(body === undefined || body instanceof FormData
            ? {}
            : { 'content-type': 'application/json' }),
          ...(token ? { authorization: `Bearer ${token}` } : {}),
        },
        body:
          body === undefined
            ? undefined
            : body instanceof FormData
              ? body
              : JSON.stringify(body),
        signal: signal
          ? AbortSignal.any([signal, AbortSignal.timeout(TIMEOUT_MS)])
          : AbortSignal.timeout(TIMEOUT_MS),
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
