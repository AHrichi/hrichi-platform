import { createHmac } from 'node:crypto';
import {
  N8nChannel,
  signPayload,
  TelegramChannel,
  telegramMessage,
} from './channels';
import type { Lead } from './lead';

const lead: Lead = {
  id: '6650f0c2a1b2c3d4e5f60718',
  idempotencyKey: '7b7e2c5a-3f43-4c1e-9b6f-2c1d6e8f9a10',
  name: 'Ada <script>',
  email: 'ada@example.com',
  message: 'Build us a 3D configurator & more',
  intent: 'project',
  audience: 'client',
  humanCheck: 'passed',
  createdAt: new Date('2026-10-26T12:00:00Z'),
  delivery: {
    telegram: { status: 'pending', attempts: 0, nextAttemptAt: new Date() },
    n8n: { status: 'pending', attempts: 0, nextAttemptAt: new Date() },
  },
};

function recordingFetch(status = 200) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchFn = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response('{}', { status });
  }) as unknown as typeof fetch;
  return { calls, fetchFn };
}

describe('telegramMessage', () => {
  it('escapes HTML from the visitor and labels the intent', () => {
    const text = telegramMessage(lead);

    expect(text).toContain('<b>Project enquiry</b> from the portfolio');
    expect(text).toContain('Ada &lt;script&gt;');
    expect(text).toContain('configurator &amp; more');
    expect(text).toContain('Viewing as: client');
  });

  it('warns when the human check could not be verified', () => {
    expect(telegramMessage({ ...lead, humanCheck: 'unavailable' })).toContain(
      'human check not verified',
    );
  });
});

describe('TelegramChannel', () => {
  it('posts to the bot API and throws when Telegram refuses', async () => {
    const ok = recordingFetch();
    await new TelegramChannel({ botToken: 'T', chatId: '42' }, ok.fetchFn).send(
      lead,
    );
    expect(ok.calls[0].url).toBe('https://api.telegram.org/botT/sendMessage');
    expect(JSON.parse(ok.calls[0].init.body as string)).toMatchObject({
      chat_id: '42',
      parse_mode: 'HTML',
    });

    const refused = recordingFetch(401);
    await expect(
      new TelegramChannel(
        { botToken: 'T', chatId: '42' },
        refused.fetchFn,
      ).send(lead),
    ).rejects.toThrow('Telegram answered 401');
  });

  it('is disabled without configuration', () => {
    expect(new TelegramChannel(null).enabled).toBe(false);
  });
});

describe('N8nChannel', () => {
  it('signs the exact body with the timestamp so n8n can verify it', async () => {
    const { calls, fetchFn } = recordingFetch();
    const channel = new N8nChannel(
      { webhookUrl: 'https://n8n.example/webhook/lead', secret: 's3cret' },
      fetchFn,
      () => 1_790_000_000_000,
    );

    await channel.send(lead);

    const headers = calls[0].init.headers as Record<string, string>;
    const body = calls[0].init.body as string;
    const expected = createHmac('sha256', 's3cret')
      .update(`1790000000000.${body}`)
      .digest('hex');
    expect(headers['x-lead-timestamp']).toBe('1790000000000');
    expect(headers['x-lead-signature']).toBe(`sha256=${expected}`);
    expect(signPayload('s3cret', '1790000000000', body)).toBe(expected);
    expect(JSON.parse(body)).toMatchObject({ id: lead.id, intent: 'project' });
  });
});
