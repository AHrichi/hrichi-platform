import type { ChatMessage, ToolCall } from '@ah/shared/assistant';
import {
  type ChatModel,
  cleanText,
  type ModelCapability,
  ModelError,
  type ModelReply,
  type ModelRequest,
} from './chat-model';

/** The part of a Worker's `ai` binding this uses. */
export interface WorkersAiBinding {
  run(model: string, input: unknown): Promise<unknown>;
}

interface LooseCall {
  id?: string;
  name?: string;
  arguments?: unknown;
  function?: { name?: string; arguments?: unknown };
}

/**
 * Cloudflare Workers AI through the Worker's binding: no key, a free daily
 * allowance. Its models call tools less reliably, so by default it is
 * read-only: it may answer, look things up and open screens, never touch
 * data. Earlier tool turns are passed as plain text, which every model
 * there reads.
 */
export class WorkersAiModel implements ChatModel {
  readonly label: string;

  constructor(
    private readonly ai: WorkersAiBinding,
    private readonly model: string,
    readonly capability: ModelCapability = 'read-only',
    private readonly now: () => Date = () => new Date(),
  ) {
    this.label = `Workers AI (${model})`;
  }

  async complete(
    request: ModelRequest,
    signal: AbortSignal,
  ): Promise<ModelReply> {
    const input = {
      messages: [
        { role: 'system', content: request.system },
        ...request.messages.map(asText),
      ],
      ...(request.tools.length > 0
        ? {
            tools: request.tools.map((tool) => ({
              name: tool.name,
              description: tool.description,
              parameters: tool.parameters,
            })),
          }
        : {}),
      max_tokens: request.maxTokens,
      temperature: 0.2,
    };
    let output: unknown;
    try {
      output = await abortable(this.ai.run(this.model, input), signal);
    } catch (error) {
      if (signal.aborted) {
        throw new ModelError(this.label, 'timeout', 'no answer in time');
      }
      const text = String(error);
      // Out of the free daily allowance: back at midnight UTC.
      if (/4006|neuron|daily|quota/i.test(text)) {
        throw new ModelError(
          this.label,
          'rate_limited',
          'daily allowance used',
          secondsToMidnightUtc(this.now()),
        );
      }
      throw new ModelError(this.label, 'unavailable', text);
    }
    return this.reply(output);
  }

  /** Workers AI answers in two shapes, by model: its own, or OpenAI's. */
  private reply(output: unknown): ModelReply {
    const data = (output ?? {}) as {
      response?: unknown;
      tool_calls?: LooseCall[];
      choices?: {
        message?: { content?: string | null; tool_calls?: LooseCall[] };
      }[];
    };
    const openAi = data.choices?.[0]?.message;
    const content = openAi
      ? openAi.content
      : typeof data.response === 'string'
        ? data.response
        : null;
    const calls = openAi?.tool_calls ?? data.tool_calls ?? [];
    if (calls.length === 0 && content) {
      // It copies how earlier calls read in its history (asText) instead
      // of calling: take those sentences back as the calls they mean.
      const echoed = echoedCalls(content);
      if (echoed.calls.length > 0) {
        return {
          content: cleanText(echoed.rest),
          toolCalls: echoed.calls.map((call, index) =>
            this.toolCall(call, index),
          ),
        };
      }
    }
    return {
      content: cleanText(content),
      toolCalls: calls.map((call, index) => this.toolCall(call, index)),
    };
  }

  private toolCall(call: LooseCall, index: number): ToolCall {
    const name = call.function?.name ?? call.name;
    if (!name) throw new ModelError(this.label, 'bad_output', 'nameless call');
    let args = call.function?.arguments ?? call.arguments ?? {};
    if (typeof args === 'string') {
      try {
        args = JSON.parse(args);
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
      id: `wai_${index}_${Date.now().toString(36)}`,
      name,
      arguments: args as Record<string, unknown>,
    };
  }
}

/** "Called open_screen with {...}." as asText writes a call into history. */
const ECHOED_CALL = /Called ([a-z_][a-z0-9_]*) with (\{.*?\})\.?(?=\s|$)/gs;

/** The calls a reply wrote out as asText's sentences, and the other text. */
function echoedCalls(text: string): { calls: LooseCall[]; rest: string } {
  const calls: LooseCall[] = [];
  const rest = text.replace(ECHOED_CALL, (sentence, name: string, json) => {
    try {
      calls.push({ name, arguments: JSON.parse(json) as unknown });
      return '';
    } catch {
      return sentence;
    }
  });
  return { calls, rest: rest.trim() };
}

function asText(message: ChatMessage): { role: string; content: string } {
  switch (message.role) {
    case 'user':
      return { role: 'user', content: message.content };
    case 'assistant': {
      const calls = (message.toolCalls ?? [])
        .map(
          (call) =>
            `Called ${call.name} with ${JSON.stringify(call.arguments)}.`,
        )
        .join(' ');
      return {
        role: 'assistant',
        content: [message.content ?? '', calls].filter(Boolean).join(' '),
      };
    }
    case 'tool':
      return {
        role: 'user',
        content: `Result of ${message.name}: ${message.content}`,
      };
  }
}

function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason);
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason);
    signal.addEventListener('abort', onAbort, { once: true });
    promise.then(
      (value) => {
        signal.removeEventListener('abort', onAbort);
        resolve(value);
      },
      (error) => {
        signal.removeEventListener('abort', onAbort);
        reject(error);
      },
    );
  });
}

export function secondsToMidnightUtc(now: Date): number {
  const midnight = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + 1,
  );
  return Math.max(1, Math.ceil((midnight - now.getTime()) / 1000));
}
