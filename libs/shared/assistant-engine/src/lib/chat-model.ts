import type { ChatMessage, ToolCall, ToolSpec } from '@ah/shared/assistant';

/** `read-only` models are offered only tools that can't change data. */
export type ModelCapability = 'tools' | 'read-only';

export interface ModelRequest {
  readonly system: string;
  readonly messages: readonly ChatMessage[];
  readonly tools: readonly ToolSpec[];
  readonly maxTokens: number;
}

export interface ModelReply {
  readonly content: string | null;
  readonly toolCalls: readonly ToolCall[];
}

/** One model behind one provider, speaking chat with tools. */
export interface ChatModel {
  /** e.g. `Groq (openai/gpt-oss-120b)`, for logs and the reply. */
  readonly label: string;
  readonly capability: ModelCapability;
  complete(request: ModelRequest, signal: AbortSignal): Promise<ModelReply>;
}

/**
 * Why a model gave no usable answer:
 * - `rate_limited`: a free tier's limit; `retryAfterSec` says when.
 * - `unavailable`: down, overloaded, or not set up (a bad key).
 * - `bad_output`: an answer that can't be used (broken tool call).
 * - `timeout`: no answer in time.
 */
export type ModelErrorKind =
  'rate_limited' | 'unavailable' | 'bad_output' | 'timeout';

export class ModelError extends Error {
  override readonly name = 'ModelError';

  constructor(
    readonly model: string,
    readonly kind: ModelErrorKind,
    message: string,
    readonly retryAfterSec: number | null = null,
  ) {
    super(`${model}: ${message}`);
  }
}

/** Seconds to wait from a Retry-After header, or a "try again in 7.5s". */
export function retryAfter(header: string | null, text: string): number | null {
  const fromHeader = header === null ? NaN : Number(header);
  if (Number.isFinite(fromHeader) && fromHeader >= 0) {
    return Math.ceil(fromHeader);
  }
  const match = /try again in (?:(\d+)m)?([\d.]+)s/i.exec(text);
  if (match) {
    return Math.ceil(Number(match[1] ?? 0) * 60 + Number(match[2]));
  }
  return null;
}

/** Drops a model's visible reasoning (`<think>…</think>`) from its text. */
export function cleanText(text: string | null | undefined): string | null {
  const clean = (text ?? '').replace(/<think>[\s\S]*?<\/think>/gi, '').trim();
  return clean.length > 0 ? clean : null;
}
