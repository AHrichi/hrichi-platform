import type { ChatMessage, ToolCall } from '@ah/shared/assistant';
import {
  type ChatModel,
  cleanText,
  type ModelCapability,
  ModelError,
  type ModelReply,
  type ModelRequest,
  retryAfter,
} from './chat-model';

type Fetch = typeof fetch;

export interface OpenAiCompatibleOptions {
  readonly label: string;
  /** e.g. `https://api.groq.com/openai/v1`. */
  readonly baseUrl: string;
  readonly model: string;
  /** Null for a local server (Ollama). */
  readonly apiKey: string | null;
  readonly fetch: Fetch;
  readonly capability?: ModelCapability;
  /** Provider-specific fields, e.g. `{ reasoning_effort: 'low' }`. */
  readonly extra?: Readonly<Record<string, unknown>>;
  readonly timeoutMs?: number;
}

interface WireToolCall {
  id?: string;
  function?: { name?: string; arguments?: unknown };
}

/**
 * Chat with tools over the OpenAI chat-completions format, which Groq,
 * Gemini (its OpenAI endpoint), Ollama and many others speak: changing
 * provider is a base URL, a key and a model name.
 */
export class OpenAiCompatibleModel implements ChatModel {
  readonly label: string;
  readonly capability: ModelCapability;

  constructor(private readonly options: OpenAiCompatibleOptions) {
    this.label = options.label;
    this.capability = options.capability ?? 'tools';
  }

  async complete(
    request: ModelRequest,
    signal: AbortSignal,
  ): Promise<ModelReply> {
    const { baseUrl, model, apiKey, extra, timeoutMs = 20_000 } = this.options;
    const body = {
      model,
      messages: [
        { role: 'system', content: request.system },
        ...request.messages.map(toWire),
      ],
      temperature: 0.2,
      max_tokens: request.maxTokens,
      ...(request.tools.length > 0
        ? {
            tools: request.tools.map((tool) => ({
              type: 'function',
              function: tool,
            })),
            tool_choice: 'auto',
          }
        : {}),
      ...extra,
    };
    const timeout = AbortSignal.timeout(timeoutMs);
    let response: Response;
    try {
      response = await this.options.fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}),
        },
        body: JSON.stringify(body),
        signal: AbortSignal.any([signal, timeout]),
      });
    } catch (error) {
      if (timeout.aborted || signal.aborted) {
        throw new ModelError(this.label, 'timeout', 'no answer in time');
      }
      throw new ModelError(this.label, 'unavailable', String(error));
    }
    const text = await response.text();
    if (!response.ok) throw this.failure(response, text);

    let data: {
      choices?: {
        message?: { content?: string | null; tool_calls?: WireToolCall[] };
      }[];
    };
    try {
      data = JSON.parse(text);
    } catch {
      throw new ModelError(this.label, 'bad_output', 'not JSON');
    }
    const message = data.choices?.[0]?.message;
    if (!message) throw new ModelError(this.label, 'bad_output', 'no message');
    return {
      content: cleanText(message.content),
      toolCalls: (message.tool_calls ?? []).map((call, index) =>
        this.toolCall(call, index),
      ),
    };
  }

  private toolCall(call: WireToolCall, index: number): ToolCall {
    const name = call.function?.name;
    if (!name) throw new ModelError(this.label, 'bad_output', 'nameless call');
    const raw = call.function?.arguments ?? {};
    let args: unknown = raw;
    if (typeof raw === 'string') {
      try {
        args = raw.trim() === '' ? {} : JSON.parse(raw);
      } catch {
        throw new ModelError(
          this.label,
          'bad_output',
          `bad arguments for ${name}`,
        );
      }
    }
    if (args === null || typeof args !== 'object' || Array.isArray(args)) {
      throw new ModelError(
        this.label,
        'bad_output',
        `bad arguments for ${name}`,
      );
    }
    return {
      id: sanitizeId(call.id) ?? `call_${index}_${Date.now().toString(36)}`,
      name,
      arguments: args as Record<string, unknown>,
    };
  }

  private failure(response: Response, text: string): ModelError {
    const status = response.status;
    if (status === 429) {
      return new ModelError(
        this.label,
        'rate_limited',
        'rate limited',
        retryAfter(response.headers.get('retry-after'), text),
      );
    }
    // Groq's "the model wrote a tool call it couldn't parse".
    if (status === 400 && text.includes('tool_use_failed')) {
      return new ModelError(this.label, 'bad_output', 'tool_use_failed');
    }
    return new ModelError(
      this.label,
      'unavailable',
      `HTTP ${status}${providerError(text)}`,
    );
  }
}

/**
 * The provider's own word on a refused request (`invalid_api_key`,
 * `model_not_found`, a schema it won't take), for the logs: its code and
 * the start of its message. Never the request: a provider's error doesn't
 * repeat the conversation, and Groq's generation-failed body (which does)
 * is handled before this.
 */
function providerError(text: string): string {
  try {
    const parsed = JSON.parse(text) as unknown;
    const error = (Array.isArray(parsed) ? parsed[0] : parsed) as {
      error?: { code?: unknown; type?: unknown; message?: unknown };
    };
    const { code, type, message } = error?.error ?? {};
    const label = [code, type].find((v) => typeof v === 'string' && v);
    const said = typeof message === 'string' ? message.slice(0, 200) : '';
    return label || said ? ` ${label ?? ''}${said ? `: ${said}` : ''}` : '';
  } catch {
    return '';
  }
}

function toWire(message: ChatMessage): Record<string, unknown> {
  switch (message.role) {
    case 'user':
      return { role: 'user', content: message.content };
    case 'assistant':
      return {
        role: 'assistant',
        content: message.content ?? '',
        ...(message.toolCalls?.length
          ? {
              tool_calls: message.toolCalls.map((call) => ({
                id: call.id,
                type: 'function',
                function: {
                  name: call.name,
                  arguments: JSON.stringify(call.arguments),
                },
              })),
            }
          : {}),
      };
    case 'tool':
      return {
        role: 'tool',
        tool_call_id: message.toolCallId,
        name: message.name,
        content: message.content,
      };
  }
}

/** Provider ids as the wire allows them (letters, digits, `_`, `-`). */
function sanitizeId(id: string | undefined): string | null {
  const clean = (id ?? '').replace(/[^\w-]/g, '').slice(0, 64);
  return clean.length > 0 ? clean : null;
}
