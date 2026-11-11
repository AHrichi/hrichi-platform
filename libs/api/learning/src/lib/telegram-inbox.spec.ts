import {
  type EdgeInboxItem,
  inboxKey,
  MIN_SECRET_LENGTH,
  SERVER_TOKEN_SUBJECT,
  verifyDeviceToken,
} from '@ah/learning/domain';
import { CapturePipeline } from './capture-pipeline';
import { TelegramInbox } from './telegram-inbox';
import { fakeAi, FakeTranscriber } from './testing/ai-fakes';
import { InMemoryLearningRepository } from './testing/in-memory-learning.repository';
import { WriteLock } from './write-lock';

const secret = 't'.repeat(MIN_SECRET_LENGTH);
const now = new Date('2026-11-12T08:00:00Z');

const text: EdgeInboxItem = {
  key: inboxKey(812),
  id: '0b6f0c30-0000-4000-8000-0000000003a1',
  updateId: 812,
  at: '2026-11-12T07:00:00.000Z',
  text: 'Sunk cost: money spent that can’t come back.',
  voice: null,
};
const voice: EdgeInboxItem = {
  key: inboxKey(813),
  id: '0b6f0c30-0000-4000-8000-0000000003a2',
  updateId: 813,
  at: '2026-11-12T07:05:00.000Z',
  text: null,
  voice: { fileId: 'AwACAg', mimeType: 'audio/ogg', seconds: 14 },
};

/** The Worker and Telegram, as far as the inbox sees them. */
function edge(items: EdgeInboxItem[], { fileFails = false } = {}) {
  const acked: string[][] = [];
  const auth: string[] = [];
  const fetchFn = (async (input: string | URL, init?: RequestInit) => {
    const url = String(input);
    if (url === 'https://edge.example/inbox') {
      auth.push(new Headers(init?.headers).get('authorization') ?? '');
      return Response.json({ items });
    }
    if (url === 'https://edge.example/inbox/ack') {
      acked.push(JSON.parse(String(init?.body)).keys);
      return new Response(null, { status: 204 });
    }
    if (url.includes('/getFile?file_id=AwACAg')) {
      return Response.json({ ok: true, result: { file_path: 'voice/1.oga' } });
    }
    if (url.endsWith('/file/botBOT/voice/1.oga')) {
      return fileFails
        ? new Response('', { status: 502 })
        : new Response(new Uint8Array([1, 2, 3]));
    }
    return new Response('', { status: 404 });
  }) as typeof fetch;
  return { fetchFn, acked, auth };
}

function setup(botToken: string | null = 'BOT') {
  const repository = new InMemoryLearningRepository();
  const transcriber = new FakeTranscriber('Spaced repetition, said aloud.');
  const ai = fakeAi(undefined, undefined, transcriber);
  const pipeline = new CapturePipeline(
    repository,
    new WriteLock(),
    ai,
    () => now,
  );
  // Processing is the pipeline's own business; here it stays queued.
  vi.spyOn(pipeline, 'kick').mockResolvedValue(undefined as never);
  const make = (fetchFn: typeof fetch) =>
    new TelegramInbox(
      { edgeUrl: 'https://edge.example/', botToken, tokenSecret: secret },
      pipeline,
      () => now,
      fetchFn,
    );
  const capture = async (id: string) =>
    (await repository.getRecord('capture', id))?.data;
  return { make, capture, transcriber };
}

describe('TelegramInbox', () => {
  it('turns messages into captures, then acknowledges them', async () => {
    const { make, capture, transcriber } = setup();
    const worker = edge([text, voice]);
    expect(await make(worker.fetchFn).pull()).toBe(2);

    expect(await capture(text.id)).toMatchObject({
      modality: 'text',
      text: text.text,
      status: 'queued',
      source: { app: 'telegram', objectId: '812' },
    });
    expect(await capture(voice.id)).toMatchObject({
      modality: 'voice',
      hasAudio: true,
      transcript: 'Spaced repetition, said aloud.',
    });
    expect(transcriber.heard[0]).toMatchObject({ mimeType: 'audio/ogg' });
    expect(worker.acked).toEqual([[text.key, voice.key]]);

    // The Worker only answers the server's own token.
    const claims = await verifyDeviceToken(
      secret,
      worker.auth[0].slice('Bearer '.length),
      now,
    );
    expect(claims?.deviceId).toBe(SERVER_TOKEN_SUBJECT);
  });

  it('leaves a voice note in the Worker until it can be fetched', async () => {
    const { make, capture } = setup();
    const failing = edge([text, voice], { fileFails: true });
    expect(await make(failing.fetchFn).pull()).toBe(1);
    expect(failing.acked).toEqual([[text.key]]);
    expect(await capture(voice.id)).toMatchObject({ transcript: null });

    // Next time it works, and the capture isn't made twice.
    const working = edge([voice]);
    expect(await make(working.fetchFn).pull()).toBe(1);
    expect(await capture(voice.id)).toMatchObject({
      transcript: 'Spaced repetition, said aloud.',
    });
  });

  it('keeps voice notes waiting without a bot token', async () => {
    const { make } = setup(null);
    const worker = edge([voice]);
    expect(await make(worker.fetchFn).pull()).toBe(0);
    expect(worker.acked).toEqual([]);
  });

  it('does nothing without an edge URL', async () => {
    const { capture } = setup();
    const inbox = new TelegramInbox(
      { edgeUrl: null, botToken: 'BOT', tokenSecret: secret },
      {} as CapturePipeline,
    );
    expect(inbox.configured).toBe(false);
    expect(await inbox.pull()).toBe(0);
    expect(await capture(text.id)).toBeUndefined();
  });
});
