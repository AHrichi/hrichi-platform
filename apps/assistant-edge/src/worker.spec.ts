import { describe, expect, it } from 'vitest';
import { type Env, handleRequest, type RateLimit } from './worker';

const ORIGIN = 'https://product-serracalc.ahmed-hrichi.workers.dev';
const allow: RateLimit = { limit: async () => ({ success: true }) };
const deny: RateLimit = { limit: async () => ({ success: false }) };

function env(overrides: Partial<Env> = {}): Env {
  return {
    ALLOWED_ORIGINS: `${ORIGIN},http://localhost:4314`,
    LADDER: 'groq:openai/gpt-oss-120b',
    GROQ_API_KEY: 'test-key',
    PER_IP: allow,
    GLOBAL: allow,
    ...overrides,
  };
}

const CHAT = {
  v: 1,
  app: 'serracalc',
  locale: 'en',
  context: {
    screen: 'projects',
    mode: 'standalone',
    activeProjectId: null,
    projects: [],
    prefs: { language: 'en', theme: 'light', sunlight: false },
  },
  messages: [{ role: 'user', content: 'What can you do?' }],
};

function post(body: unknown, headers: Record<string, string> = {}): Request {
  return new Request('https://assistant-edge.example/v1/chat', {
    method: 'POST',
    headers: { origin: ORIGIN, 'content-type': 'application/json', ...headers },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });
}

/** Groq answering once with `content`; records what it was sent. */
function groq(content: string) {
  const sent: Record<string, unknown>[] = [];
  const fetchFn = (async (_input: RequestInfo | URL, init?: RequestInit) => {
    sent.push(JSON.parse(String(init?.body)));
    return new Response(
      JSON.stringify({ choices: [{ message: { content } }] }),
      { status: 200 },
    );
  }) as typeof fetch;
  return { fetchFn, sent };
}

describe('the assistant Worker', () => {
  it('runs a chat round for an allowed page, with CORS and no caching', async () => {
    const { fetchFn, sent } = groq('I can read and change your projects.');
    const lines: string[] = [];
    const response = await handleRequest(post(CHAT), env(), {
      fetch: fetchFn,
      log: (line) => lines.push(line),
    });
    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe(ORIGIN);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(await response.json()).toMatchObject({
      ok: true,
      provider: 'Groq (openai/gpt-oss-120b)',
      message: { content: 'I can read and change your projects.' },
    });
    // SerraCalc's own prompt and tools, from its profile.
    const messages = sent[0]['messages'] as { role: string; content: string }[];
    expect(messages[0].content).toContain('assistant inside SerraCalc');
    expect((sent[0]['tools'] as unknown[]).length).toBe(15);
    // Logs carry metadata, never what was said.
    expect(lines.join('\n')).not.toContain('What can you do');
    expect(JSON.parse(lines[0])).toMatchObject({
      route: '/v1/chat',
      status: 200,
    });
  });

  it('answers preflights, with CORS only for allowed pages', async () => {
    const preflight = (origin: string) =>
      handleRequest(
        new Request('https://x/v1/chat', {
          method: 'OPTIONS',
          headers: { origin },
        }),
        env(),
      );
    expect(
      (await preflight(ORIGIN)).headers.get('access-control-allow-origin'),
    ).toBe(ORIGIN);
    expect(
      (await preflight('https://evil.example')).headers.get(
        'access-control-allow-origin',
      ),
    ).toBeNull();
  });

  it('refuses other pages, other content and oversized bodies', async () => {
    const { fetchFn } = groq('x');
    const run = (request: Request) =>
      handleRequest(request, env(), { fetch: fetchFn, log: () => undefined });
    const statuses = [
      (await run(post(CHAT, { origin: 'https://evil.example' }))).status,
      (await run(post(CHAT, { 'content-type': 'text/plain' }))).status,
      (await run(post(CHAT, { 'content-length': '999999' }))).status,
      // No length announced: the body is counted as it arrives.
      (await run(post({ ...CHAT, padding: 'x'.repeat(60_000) }))).status,
      (await run(post('{not json'))).status,
    ];
    expect(statuses).toEqual([403, 400, 413, 413, 400]);
  });

  it('says when a caller sends too much, and when to retry', async () => {
    const response = await handleRequest(post(CHAT), env({ PER_IP: deny }), {
      log: () => undefined,
    });
    expect(response.status).toBe(429);
    expect(response.headers.get('retry-after')).toBe('60');
    expect(await response.json()).toMatchObject({
      ok: false,
      code: 'RATE_LIMITED',
    });
  });

  it('says it is unavailable with no model set up', async () => {
    const response = await handleRequest(
      post(CHAT),
      env({ GROQ_API_KEY: undefined }),
      { log: () => undefined },
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({ code: 'UNAVAILABLE' });
  });

  it('shows which models are set up, never their keys', async () => {
    const response = await handleRequest(
      new Request('https://x/health'),
      env({ LADDER: 'groq:openai/gpt-oss-120b,gemini:gemini-flash-latest' }),
    );
    const body = await response.json();
    expect(body).toEqual({
      ok: true,
      models: ['Groq (openai/gpt-oss-120b)'],
      skipped: ['gemini:gemini-flash-latest (no key)'],
    });
    expect(JSON.stringify(body)).not.toContain('test-key');
  });
});
