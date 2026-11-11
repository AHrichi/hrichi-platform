import * as v from 'valibot';
import { strictJsonSchema } from '@ah/shared/ai-schema';
import {
  FallbackDecisionModel,
  JevDecisionModel,
  LadderDecisionModel,
} from './decision';
import { LadderExhaustedError, ModelLadder } from './ladder';
import { GeminiModel, GroqChatModel, type ModelCall } from './models';
import { buildAiProviders } from './providers';
import { FakeFetch, geminiReply, groqReply } from './testing/fake-fetch';
import {
  FallbackTranscriber,
  GeminiTranscriber,
  GroqWhisperTranscriber,
} from './transcriber';

const schema = strictJsonSchema(
  v.strictObject({ essence: v.string(), note: v.nullable(v.string()) }),
);
const call: ModelCall = {
  name: 'explain_concept',
  system: 'Explain.',
  user: 'Opportunity cost',
  schema,
  maxTokens: 800,
  strict: true,
};
const good = { essence: 'What you give up.', note: null };

function ladderOf(fake: FakeFetch) {
  return new ModelLadder(
    [
      new GroqChatModel('openai/gpt-oss-120b', 'gk', fake.fetch),
      new GroqChatModel('qwen/qwen3.8-27b', 'gk', fake.fetch),
      new GeminiModel('gemini-flash-latest', 'mk', fake.fetch),
    ],
    0,
  );
}

describe('ModelLadder', () => {
  it('takes the first reply that fits, sending gpt-oss the strict schema', async () => {
    const fake = new FakeFetch().reply(200, groqReply(good));
    const result = await ladderOf(fake).run(call);
    expect(result).toEqual({
      data: good,
      provider: 'Groq (openai/gpt-oss-120b)',
    });

    const [request] = fake.requests;
    expect(request.url).toBe('https://api.groq.com/openai/v1/chat/completions');
    expect(request.headers['authorization']).toBe('Bearer gk');
    expect(request.body).toMatchObject({
      model: 'openai/gpt-oss-120b',
      reasoning_effort: 'low',
      max_completion_tokens: 800,
      response_format: {
        type: 'json_schema',
        json_schema: { name: 'explain_concept', strict: true },
      },
    });
  });

  it('climbs past an HTTP error, a reply that won’t parse and one that doesn’t fit', async () => {
    const fake = new FakeFetch()
      .reply(429, { error: { message: 'rate limited' } })
      .reply(200, groqReply('I cannot help with that.'))
      .reply(200, geminiReply(good));
    const result = await ladderOf(fake).run(call);
    expect(result.provider).toBe('Gemini (gemini-flash-latest)');
    // Qwen gets the schema in the prompt and json_object mode.
    expect(fake.requests[1].body).toMatchObject({
      response_format: { type: 'json_object' },
    });
    expect(JSON.stringify(fake.requests[1].body)).toContain('JSON Schema');
    expect(fake.requests[2].headers['x-goog-api-key']).toBe('mk');
  });

  it('tidies a near miss and salvages what Groq refused', async () => {
    const tidied = await ladderOf(
      new FakeFetch().reply(200, groqReply({ essence: 'x', extra: 1 })),
    ).run(call);
    expect(tidied.data).toEqual({ essence: 'x', note: null });

    const salvaged = await ladderOf(
      new FakeFetch().reply(400, {
        error: {
          failed_generation: JSON.stringify({ essence: 'y', note: 'n' }),
        },
      }),
    ).run(call);
    expect(salvaged.data).toEqual({ essence: 'y', note: 'n' });
  });

  it('retries Gemini once, then gives up with every attempt listed', async () => {
    const fake = new FakeFetch()
      .reply(500, {})
      .reply(200, groqReply({ wrong: true }))
      .reply(503, {})
      .reply(503, {});
    const error = await ladderOf(fake)
      .run(call)
      .catch((e: unknown) => e);
    expect(error).toBeInstanceOf(LadderExhaustedError);
    expect(
      (error as LadderExhaustedError).attempts.map((a) => a.outcome),
    ).toEqual(['http-error', 'schema-mismatch', 'http-error', 'http-error']);
    expect(fake.requests).toHaveLength(4);
  });

  it('says so when no model is configured', async () => {
    const empty = new ModelLadder([]);
    expect(empty.configured).toBe(false);
    await expect(empty.run(call)).rejects.toThrow('No AI model is configured.');
  });
});

describe('transcription', () => {
  const clip = {
    bytes: new Uint8Array([1, 2, 3]),
    mimeType: 'audio/webm;codecs=opus',
  };

  it('sends Groq the file and model, and falls back to Gemini', async () => {
    const fake = new FakeFetch()
      .reply(503, {})
      .reply(200, geminiReply('Opportunity cost is what you give up.'));
    const transcriber = new FallbackTranscriber([
      new GroqWhisperTranscriber('gk', undefined, fake.fetch),
      new GeminiTranscriber('mk', undefined, fake.fetch),
    ]);
    expect(await transcriber.transcribe(clip)).toBe(
      'Opportunity cost is what you give up.',
    );
    expect(fake.requests[0].body).toEqual({
      file: '[file audio/webm;codecs=opus]',
      model: 'whisper-large-v3-turbo',
      response_format: 'json',
      language: 'en',
    });
    expect(JSON.stringify(fake.requests[1].body)).toContain(
      '"mime_type":"audio/webm"',
    );
  });

  it('treats an empty transcript as a failure', async () => {
    const fake = new FakeFetch().reply(200, { text: '  ' });
    const transcriber = new FallbackTranscriber([
      new GroqWhisperTranscriber('gk', undefined, fake.fetch),
    ]);
    await expect(transcriber.transcribe(clip)).rejects.toThrow(
      /empty transcript/,
    );
  });
});

describe('decision models', () => {
  const questions = {
    faithful: {
      type: 'noul' as const,
      instructions: 'Does the explanation say only what the source says?',
    },
    kind: {
      type: 'choice' as const,
      instructions: 'What is this capture?',
      criteria: { learnable: 'an idea to remember', todo: null, noise: null },
    },
  };

  it('asks Jev and maps its typed answers', async () => {
    const fake = new FakeFetch().reply(200, {
      model: 'jev-1.13.0',
      answers: {
        faithful: { type: 'noul', noul: 0.82 },
        kind: {
          type: 'choice',
          choice: 'learnable',
          confidence: 0.91,
          probabilities: { learnable: 0.91, todo: 0.06, noise: 0.03 },
        },
      },
    });
    const decision = await new JevDecisionModel(
      'tk',
      undefined,
      fake.fetch,
    ).decide('state', questions);
    expect(fake.requests[0]).toMatchObject({
      url: 'https://api.typesafe.ai/v1/systemone',
      body: { model: 'jev-latest', state: 'state', questions },
    });
    expect(decision).toEqual({
      provider: 'Jev (jev-1.13.0)',
      calibrated: true,
      answers: {
        faithful: { type: 'noul', p: 0.82 },
        kind: {
          type: 'choice',
          choice: 'learnable',
          confidence: 0.91,
          probabilities: { learnable: 0.91, todo: 0.06, noise: 0.03 },
        },
      },
    });
  });

  it('falls back to the ladder, marked uncalibrated', async () => {
    const fake = new FakeFetch()
      .reply(502, {})
      .reply(200, groqReply({ faithful: false, kind: 'todo' }));
    const ladder = new ModelLadder(
      [new GroqChatModel('openai/gpt-oss-120b', 'gk', fake.fetch)],
      0,
    );
    const decision = await new FallbackDecisionModel([
      new JevDecisionModel('tk', undefined, fake.fetch),
      new LadderDecisionModel(ladder),
    ]).decide('state', questions);
    expect(decision.calibrated).toBe(false);
    expect(decision.answers['faithful']).toEqual({ type: 'noul', p: 1 - 0.9 });
    expect(decision.answers['kind']).toMatchObject({ choice: 'todo' });
    const sent = fake.requests[1].body as {
      response_format: { json_schema: { schema: unknown } };
    };
    expect(sent.response_format.json_schema.schema).toEqual({
      type: 'object',
      properties: {
        faithful: {
          type: 'boolean',
          description: questions.faithful.instructions,
        },
        kind: {
          type: 'string',
          enum: ['learnable', 'todo', 'noise'],
          description: questions.kind.instructions,
        },
      },
      required: ['faithful', 'kind'],
      additionalProperties: false,
    });
  });
});

describe('buildAiProviders', () => {
  it('builds only what has keys', () => {
    expect(
      buildAiProviders({ groq: null, gemini: null, typesafe: null }).summary,
    ).toBe('none');
    const some = buildAiProviders({ groq: 'g', gemini: null, typesafe: 't' });
    expect(some.summary).toBe('Groq, Jev');
    expect(some.ladder.configured).toBe(true);
    expect(some.decisions.label).toBe('Jev (jev-latest) → generative ladder');
  });
});
