import { describe, expect, it } from 'vitest';
import { handleRequest } from './worker';

/**
 * A real model, through the Worker's own handler: skipped unless one is
 * named. Locally with Ollama:
 *   ASSISTANT_LIVE_LADDER=ollama:qwen2.5:7b OLLAMA_URL=http://127.0.0.1:11434 \
 *     pnpm nx test assistant-edge
 * or with GROQ_API_KEY and ASSISTANT_LIVE_LADDER=groq:openai/gpt-oss-120b.
 */
const LADDER = process.env['ASSISTANT_LIVE_LADDER'];

const CASES = [
  {
    locale: 'en',
    ask: 'Create a project called "North house" for peppers in Sfax.',
    expected: { title: 'North house', crop: 'pepper', climateId: 'sfax' },
  },
  {
    locale: 'fr',
    ask: 'Crée un projet « Serre Est » pour des tomates à Kebili.',
    expected: { title: 'Serre Est', crop: 'tomato', climateId: 'kebili' },
  },
] as const;

describe.skipIf(!LADDER)('the assistant with a real model', () => {
  it.each(CASES)(
    'turns a request in $locale into the right tool call',
    { timeout: 120_000 },
    async ({ locale, ask, expected }) => {
      const origin = 'http://localhost:4314';
      const response = await handleRequest(
        new Request('http://localhost:8788/v1/chat', {
          method: 'POST',
          headers: { origin, 'content-type': 'application/json' },
          body: JSON.stringify({
            v: 1,
            app: 'serracalc',
            locale,
            context: {
              screen: 'projects',
              mode: 'standalone',
              activeProjectId: null,
              projects: [],
              prefs: { language: locale, theme: 'light', sunlight: false },
            },
            messages: [
              {
                role: 'user',
                content: ask,
              },
            ],
          }),
        }),
        {
          ALLOWED_ORIGINS: origin,
          LADDER: LADDER ?? '',
          OLLAMA_URL: process.env['OLLAMA_URL'],
          GROQ_API_KEY: process.env['GROQ_API_KEY'],
          GEMINI_API_KEY: process.env['GEMINI_API_KEY'],
        },
        { log: () => undefined },
      );
      const body = await response.json();
      expect(response.status, JSON.stringify(body)).toBe(200);
      const call = body.message.toolCalls[0];
      expect(call.name).toBe('create_project');
      expect(call.arguments).toMatchObject(expected);
    },
  );
});
