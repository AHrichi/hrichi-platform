import * as v from 'valibot';
import { ASSISTANT_LIMITS as L } from './limits';

/** The languages the platform speaks (as `SiteLanguage`). */
export const ASSISTANT_LOCALES = ['en', 'fr', 'ar', 'it', 'de'] as const;
export type AssistantLocale = (typeof ASSISTANT_LOCALES)[number];

/** A model's request to run a tool, with its arguments parsed. */
export interface ToolCall {
  readonly id: string;
  readonly name: string;
  readonly arguments: Record<string, unknown>;
}

export type ChatMessage =
  | { readonly role: 'user'; readonly content: string }
  | {
      readonly role: 'assistant';
      readonly content: string | null;
      readonly toolCalls?: readonly ToolCall[];
    }
  | {
      readonly role: 'tool';
      readonly toolCallId: string;
      readonly name: string;
      /** The tool's result, as JSON text. */
      readonly content: string;
    };

/**
 * What the app sends: which app (its profile, held by the server), the
 * reader's language, its current state and the conversation. Never a
 * prompt or a tool: those are the server's, so the endpoint can't be used
 * as a free general-purpose model.
 */
export interface ChatRequest {
  readonly v: 1;
  readonly app: string;
  readonly locale: AssistantLocale;
  /** Tools to leave out here (they can only narrow the profile's). */
  readonly omitTools?: readonly string[];
  readonly context: unknown;
  readonly messages: readonly ChatMessage[];
}

export type ChatErrorCode =
  | 'BAD_REQUEST'
  | 'TOO_LARGE'
  | 'FORBIDDEN_ORIGIN'
  | 'RATE_LIMITED'
  | 'BUSY'
  | 'UNAVAILABLE';

export interface ChatSuccess {
  readonly v: 1;
  readonly ok: true;
  /** Which model answered, e.g. `Groq (openai/gpt-oss-120b)`. */
  readonly provider: string;
  readonly message: {
    readonly content: string | null;
    readonly toolCalls: readonly ToolCall[];
  };
}

export interface ChatFailure {
  readonly v: 1;
  readonly ok: false;
  readonly code: ChatErrorCode;
  readonly message: string;
  /** When to try again, for RATE_LIMITED and BUSY. */
  readonly retryAfterSec?: number;
}

export type ChatResponse = ChatSuccess | ChatFailure;

const ID = v.pipe(v.string(), v.regex(/^[\w-]{1,64}$/));
const TOOL_NAME = v.pipe(v.string(), v.regex(/^[a-z][a-z0-9_]{1,47}$/));

const ToolCallSchema = v.object({
  id: ID,
  name: TOOL_NAME,
  arguments: v.record(v.string(), v.unknown()),
});

const MessageSchema = v.variant('role', [
  v.object({
    role: v.literal('user'),
    content: v.pipe(v.string(), v.minLength(1), v.maxLength(L.userChars)),
  }),
  v.object({
    role: v.literal('assistant'),
    content: v.nullable(v.pipe(v.string(), v.maxLength(L.assistantChars))),
    toolCalls: v.optional(
      v.pipe(v.array(ToolCallSchema), v.maxLength(L.toolCallsPerTurn)),
    ),
  }),
  v.object({
    role: v.literal('tool'),
    toolCallId: ID,
    name: TOOL_NAME,
    content: v.pipe(v.string(), v.maxLength(L.toolResultChars)),
  }),
]);

/** A request's shape and sizes; the profile checks the rest. */
export const ChatRequestSchema = v.object({
  v: v.literal(1),
  app: v.pipe(v.string(), v.regex(/^[a-z][a-z0-9-]{1,31}$/)),
  locale: v.picklist(ASSISTANT_LOCALES),
  omitTools: v.optional(v.pipe(v.array(TOOL_NAME), v.maxLength(32))),
  context: v.unknown(),
  messages: v.pipe(
    v.array(MessageSchema),
    v.minLength(1),
    v.maxLength(L.messages),
  ),
});

/** The size of a value as JSON, in UTF-8 bytes. */
export function jsonBytes(value: unknown): number {
  return new TextEncoder().encode(JSON.stringify(value) ?? '').length;
}
