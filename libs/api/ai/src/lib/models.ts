import type { JsonSchema } from '@ah/shared/ai-schema';

type Fetch = typeof fetch;

/** One structured-output call, before any provider shapes it. */
export interface ModelCall {
  /** A short name for the schema, e.g. `explain_concept`. */
  name: string;
  system: string;
  user: string;
  schema: JsonSchema;
  maxTokens: number;
  /**
   * Ask for strict structured output where the model supports it. Off,
   * the schema goes in the prompt and the ladder checks the reply.
   */
  strict: boolean;
}

/** What a model returned: its text, which may still not fit the schema. */
export interface ModelReply {
  text: string;
  /** e.g. `Groq (openai/gpt-oss-120b)`. */
  provider: string;
}

/** A call that failed outright; `salvage` is text the provider refused anyway. */
export class ModelCallError extends Error {
  override readonly name = 'ModelCallError';

  constructor(
    readonly provider: string,
    message: string,
    readonly status: number | null = null,
    readonly salvage: string | null = null,
  ) {
    super(`${provider}: ${message}`);
  }
}

export interface GenerativeModel {
  readonly label: string;
  generate(call: ModelCall): Promise<ModelReply>;
}

function promptedSystem(call: ModelCall): string {
  return `${call.system}\n\nReply with one JSON object that matches this JSON Schema:\n${JSON.stringify(call.schema)}`;
}

async function post(
  fetchFn: Fetch,
  provider: string,
  url: string,
  headers: Record<string, string>,
  body: unknown,
  timeoutMs: number,
): Promise<unknown> {
  let response: Response;
  try {
    response = await fetchFn(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...headers },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    throw new ModelCallError(
      provider,
      error instanceof Error ? error.message : 'no response',
    );
  }
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const failed = (payload as { error?: { failed_generation?: unknown } })
      ?.error?.failed_generation;
    throw new ModelCallError(
      provider,
      `HTTP ${response.status}`,
      response.status,
      typeof failed === 'string' ? failed : null,
    );
  }
  return payload;
}

/**
 * Groq's OpenAI-compatible chat completions, as StudyLM's workflow calls
 * them: strict `json_schema` for gpt-oss (Qwen loops under it), low
 * reasoning effort and a token cap to stay inside the free per-minute
 * budget.
 */
export class GroqChatModel implements GenerativeModel {
  readonly label: string;

  constructor(
    private readonly model: string,
    private readonly apiKey: string,
    private readonly fetchFn: Fetch = (input, init) => fetch(input, init),
    private readonly timeoutMs = 25_000,
  ) {
    this.label = `Groq (${model})`;
  }

  async generate(call: ModelCall): Promise<ModelReply> {
    const gptOss = this.model.startsWith('openai/gpt-oss');
    const strict = call.strict && gptOss;
    const body: Record<string, unknown> = {
      model: this.model,
      messages: [
        {
          role: 'system',
          content: strict ? call.system : promptedSystem(call),
        },
        { role: 'user', content: call.user },
      ],
      temperature: 0.2,
      max_completion_tokens: call.maxTokens,
      response_format: strict
        ? {
            type: 'json_schema',
            json_schema: { name: call.name, schema: call.schema, strict: true },
          }
        : { type: 'json_object' },
    };
    if (gptOss) body['reasoning_effort'] = 'low';
    const payload = (await post(
      this.fetchFn,
      this.label,
      'https://api.groq.com/openai/v1/chat/completions',
      { authorization: `Bearer ${this.apiKey}` },
      body,
      this.timeoutMs,
    )) as { choices?: { message?: { content?: unknown } }[] };
    return {
      text: String(payload?.choices?.[0]?.message?.content ?? ''),
      provider: this.label,
    };
  }
}

/** Gemini's generateContent with a JSON response; the schema rides in the prompt. */
export class GeminiModel implements GenerativeModel {
  readonly label: string;

  constructor(
    private readonly model: string,
    private readonly apiKey: string,
    private readonly fetchFn: Fetch = (input, init) => fetch(input, init),
    private readonly timeoutMs = 30_000,
  ) {
    this.label = `Gemini (${model})`;
  }

  async generate(call: ModelCall): Promise<ModelReply> {
    const payload = (await post(
      this.fetchFn,
      this.label,
      `https://generativelanguage.googleapis.com/v1beta/models/${this.model}:generateContent`,
      { 'x-goog-api-key': this.apiKey },
      {
        systemInstruction: { parts: [{ text: promptedSystem(call) }] },
        contents: [{ role: 'user', parts: [{ text: call.user }] }],
        generationConfig: {
          maxOutputTokens: Math.max(call.maxTokens, 4000),
          responseMimeType: 'application/json',
        },
      },
      this.timeoutMs,
    )) as {
      candidates?: {
        content?: { parts?: { text?: string; thought?: boolean }[] };
      }[];
    };
    const parts = payload?.candidates?.[0]?.content?.parts ?? [];
    return {
      text: parts
        .filter((part) => !part.thought)
        .map((part) => part.text ?? '')
        .join(''),
      provider: this.label,
    };
  }
}
