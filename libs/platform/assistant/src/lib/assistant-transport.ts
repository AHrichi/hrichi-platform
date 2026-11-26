import { inject, InjectionToken } from '@angular/core';
import type { ChatRequest, ChatResponse } from '@ah/shared/assistant';
import { SiteConfigService } from '@ah/shared/site-config';

/** Sends one chat round and returns the reply (or a failure), never throws. */
export interface AssistantTransport {
  chat(request: ChatRequest, signal: AbortSignal): Promise<ChatResponse | null>;
}

/** No answer at all: offline, the Worker unreachable, or no URL set up. */
export const NO_ANSWER = null;

/**
 * Past the server's own longest deadline (25 s for hosted models, 120 s
 * with a local one), which answers BUSY in time: this only catches a
 * connection that hangs.
 */
const TIMEOUT_MS = 130_000;

/**
 * The assistant's Worker, at `assistantUrl` from site-config.json. A
 * response that isn't the protocol's (a proxy's error page) counts as no
 * answer. Swappable in tests (and for another host).
 */
export const ASSISTANT_TRANSPORT = new InjectionToken<AssistantTransport>(
  'ASSISTANT_TRANSPORT',
  {
    providedIn: 'root',
    factory: () => {
      const config = inject(SiteConfigService);
      return {
        async chat(request, signal) {
          const url = (await config.load()).assistantUrl;
          if (!url) return NO_ANSWER;
          try {
            const response = await fetch(`${url.replace(/\/$/, '')}/v1/chat`, {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify(request),
              signal: AbortSignal.any([
                signal,
                AbortSignal.timeout(TIMEOUT_MS),
              ]),
            });
            const body = (await response.json()) as ChatResponse;
            return typeof body === 'object' && body !== null && 'ok' in body
              ? body
              : NO_ANSWER;
          } catch {
            return NO_ANSWER;
          }
        },
      };
    },
  },
);
