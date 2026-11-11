import { createHmac } from 'node:crypto';

type Fetch = typeof fetch;

/**
 * The model keys can stay in n8n (ADR-0024): the API's model classes call
 * Groq and Gemini through `relay.fetch`, which sends each request, signed,
 * to an n8n webhook (tools/n8n/workflows/learning-ai.json). n8n checks the
 * signature, adds the credential it already holds for StudyLM, calls the
 * provider and hands back its status and body. The ladder, the schemas and
 * the checks stay in the API; n8n only holds the keys.
 */
export interface N8nRelayOptions {
  /** n8n's public base URL (the tunnel), without /webhook. */
  url: string;
  /** Shared with n8n's "Learning AI secret" credential; ≥ 32 characters. */
  secret: string;
}

export const N8N_RELAY_PATH = '/webhook/learning-ai';
/**
 * The status a relayed call answers with when n8n itself is unreachable
 * or refused it, so it never reads as the provider's own error.
 */
export const RELAY_UNREACHABLE = 599;
/** How long a reachability check is trusted. */
const REACHABLE_TTL_MS = 60_000;

/** The only calls n8n relays; anything else is refused before it leaves. */
const ROUTES = [
  {
    provider: 'groq',
    origin: 'https://api.groq.com',
    path: /^\/openai\/v1\/chat\/completions$/,
  },
  {
    provider: 'gemini',
    origin: 'https://generativelanguage.googleapis.com',
    path: /^\/v1beta\/models\/[\w.-]+:generateContent$/,
  },
] as const;

/** `sha256=` + the HMAC of "<timestamp>.<body>", as the leads pipeline signs. */
export function signRelay(
  secret: string,
  timestamp: string,
  body: string,
): string {
  return `sha256=${createHmac('sha256', secret).update(`${timestamp}.${body}`).digest('hex')}`;
}

export class N8nRelay {
  private readonly endpoint: string;
  private checked: { at: number; ok: boolean } | null = null;

  constructor(
    options: N8nRelayOptions,
    private readonly fetchFn: Fetch = (input, init) => fetch(input, init),
    private readonly now: () => number = () => Date.now(),
  ) {
    this.endpoint = `${options.url.replace(/\/+$/, '')}${N8N_RELAY_PATH}`;
    this.secret = options.secret;
  }

  private readonly secret: string;

  private async send(
    envelope: Record<string, unknown>,
    signal?: AbortSignal | null,
  ): Promise<Response> {
    const body = JSON.stringify(envelope);
    const timestamp = String(this.now());
    return this.fetchFn(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-learning-timestamp': timestamp,
        'x-learning-signature': signRelay(this.secret, timestamp, body),
        // ngrok's free tier shows browsers a warning page first.
        'ngrok-skip-browser-warning': '1',
      },
      body,
      signal: signal ?? AbortSignal.timeout(90_000),
    });
  }

  /** A fetch for GroqChatModel, GeminiModel and GeminiTranscriber. */
  readonly fetch: Fetch = async (input, init) => {
    const url = new URL(
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url,
    );
    const route = ROUTES.find(
      (r) => url.origin === r.origin && r.path.test(url.pathname),
    );
    if (!route) {
      throw new TypeError(
        `n8n relays Groq chat and Gemini generateContent only, not ${url.origin}${url.pathname}`,
      );
    }
    if (typeof init?.body !== 'string') {
      throw new TypeError('The n8n relay sends JSON bodies only.');
    }
    const response = await this.send(
      {
        provider: route.provider,
        path: url.pathname,
        body: JSON.parse(init.body),
      },
      init.signal,
    );
    const reply = (await response.json().catch(() => null)) as {
      status?: unknown;
      body?: unknown;
    } | null;
    const status = Number(reply?.status);
    if (!response.ok || !Number.isInteger(status) || status < 200) {
      return Response.json(
        { error: { message: `The n8n relay answered ${response.status}.` } },
        { status: RELAY_UNREACHABLE },
      );
    }
    return Response.json(reply?.body ?? null, {
      status: Math.min(status, 599),
    });
  };

  /**
   * Whether n8n answers a signed ping (the PC may be off). Trusted for a
   * minute, so a sweep over many captures asks once.
   */
  async reachable(): Promise<boolean> {
    const at = this.now();
    if (this.checked && at - this.checked.at < REACHABLE_TTL_MS) {
      return this.checked.ok;
    }
    let ok = false;
    try {
      const response = await this.send(
        { provider: 'ping' },
        AbortSignal.timeout(10_000),
      );
      const reply = (await response.json().catch(() => null)) as {
        status?: unknown;
      } | null;
      ok = response.ok && reply?.status === 200;
    } catch {
      ok = false;
    }
    this.checked = { at, ok };
    return ok;
  }
}
