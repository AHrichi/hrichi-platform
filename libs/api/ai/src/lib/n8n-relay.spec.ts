import { createHmac } from 'node:crypto';
import { ModelCallError } from './models';
import { N8nRelay, RELAY_UNREACHABLE, signRelay } from './n8n-relay';
import { buildAiProviders } from './providers';
import { FakeFetch, geminiReply, groqReply } from './testing/fake-fetch';

const secret = 'r'.repeat(32);
const options = { url: 'https://n8n.example/', secret };
const groqUrl = 'https://api.groq.com/openai/v1/chat/completions';
const call = {
  name: 'explain_concept',
  system: 'Explain.',
  user: 'Opportunity cost',
  schema: {
    type: 'object',
    properties: { title: { type: 'string' } },
    required: ['title'],
    additionalProperties: false,
  },
  maxTokens: 100,
  strict: true,
};

describe('N8nRelay', () => {
  it('sends a provider call to n8n, signed, and hands back its reply', async () => {
    const fake = new FakeFetch().reply(200, {
      status: 200,
      body: groqReply({ ok: true }),
    });
    const relay = new N8nRelay(options, fake.fetch, () => 1_794_000_000_000);
    const response = await relay.fetch(groqUrl, {
      method: 'POST',
      headers: { authorization: 'Bearer held-by-n8n' },
      body: JSON.stringify({ model: 'openai/gpt-oss-20b' }),
    });
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(groqReply({ ok: true }));

    const [sent] = fake.requests;
    expect(sent.url).toBe('https://n8n.example/webhook/learning-ai');
    expect(sent.body).toEqual({
      provider: 'groq',
      path: '/openai/v1/chat/completions',
      body: { model: 'openai/gpt-oss-20b' },
    });
    // The key placeholder never leaves; the signature covers time and body.
    expect(JSON.stringify(sent)).not.toContain('held-by-n8n');
    expect(sent.headers['x-learning-timestamp']).toBe('1794000000000');
    const expected = createHmac('sha256', secret)
      .update(`1794000000000.${JSON.stringify(sent.body)}`)
      .digest('hex');
    expect(sent.headers['x-learning-signature']).toBe(`sha256=${expected}`);
    expect(signRelay(secret, '1', '{}')).toMatch(/^sha256=[0-9a-f]{64}$/);
  });

  it('passes a provider error through, and marks n8n trouble apart', async () => {
    const fake = new FakeFetch()
      .reply(200, { status: 429, body: { error: { message: 'slow down' } } })
      .reply(404, { message: 'endpoint offline' });
    const relay = new N8nRelay(options, fake.fetch);
    const init = { method: 'POST', body: '{}' };
    expect((await relay.fetch(groqUrl, init)).status).toBe(429);
    expect((await relay.fetch(groqUrl, init)).status).toBe(RELAY_UNREACHABLE);
  });

  it('relays only Groq chat and Gemini generateContent, as JSON', async () => {
    const relay = new N8nRelay(options, new FakeFetch().fetch);
    await expect(
      relay.fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        body: '{}',
      }),
    ).rejects.toThrow('relays Groq chat');
    await expect(
      relay.fetch('https://evil.example/openai/v1/chat/completions', {
        method: 'POST',
        body: '{}',
      }),
    ).rejects.toThrow('relays Groq chat');
    await expect(
      relay.fetch(groqUrl, { method: 'POST', body: new FormData() }),
    ).rejects.toThrow('JSON bodies only');
  });

  it('pings n8n once a minute at most', async () => {
    let at = 0;
    const fake = new FakeFetch()
      .reply(200, { status: 200, body: { pong: true } })
      .fail('tunnel down');
    const relay = new N8nRelay(options, fake.fetch, () => at);
    expect(await relay.reachable()).toBe(true);
    at = 30_000;
    expect(await relay.reachable()).toBe(true);
    expect(fake.requests).toHaveLength(1);
    at = 61_000;
    expect(await relay.reachable()).toBe(false);
    expect(fake.requests[0].body).toEqual({ provider: 'ping' });
  });
});

describe('buildAiProviders with n8n', () => {
  it('climbs the same ladder through n8n when no key is set here', async () => {
    const fake = new FakeFetch()
      .reply(200, { status: 503, body: {} })
      .reply(200, { status: 200, body: groqReply({ title: 'ok' }) });
    const ai = buildAiProviders(
      { groq: null, gemini: null, typesafe: null, n8n: options },
      fake.fetch,
    );
    expect(ai.summary).toBe('Groq through n8n, Gemini through n8n');
    const reply = await ai.ladder.run(call);
    expect(reply.data).toEqual({ title: 'ok' });
    expect(
      fake.requests.map(
        (r) => (r.body as { body: { model: string } }).body.model,
      ),
    ).toEqual(['openai/gpt-oss-120b', 'openai/gpt-oss-20b']);
    expect(ai.transcriber.configured).toBe(true);
  });

  it('transcribes through Gemini, and keys set here win', async () => {
    const fake = new FakeFetch().reply(200, {
      status: 200,
      body: geminiReply('A voice note.'),
    });
    const ai = buildAiProviders(
      { groq: null, gemini: null, typesafe: null, n8n: options },
      fake.fetch,
    );
    await expect(
      ai.transcriber.transcribe({
        bytes: new Uint8Array([1, 2]),
        mimeType: 'audio/webm',
      }),
    ).resolves.toBe('A voice note.');
    expect((fake.requests[0].body as { provider: string }).provider).toBe(
      'gemini',
    );

    const direct = buildAiProviders(
      { groq: 'key', gemini: null, typesafe: null, n8n: options },
      new FakeFetch().fetch,
    );
    expect(direct.summary).toBe('Groq, Gemini through n8n');
    expect(await direct.reachable()).toBe(true);
  });

  it('is unreachable without keys or n8n', async () => {
    const none = buildAiProviders({ groq: null, gemini: null, typesafe: null });
    expect(await none.reachable()).toBe(false);
    expect(new ModelCallError('x', 'y', RELAY_UNREACHABLE).status).toBe(599);
  });
});
