import * as v from 'valibot';
import { type AssistantTool, toolSpec, type ToolSpec } from './tool';
import type { AssistantLocale, ChatMessage, ToolCall } from './wire';

/**
 * An app's assistant, owned by the app and held by the server: what it
 * may talk about (the system prompt), the tools it may ask for, and the
 * shape of the state the app sends along.
 */
export interface AssistantProfile<
  TContext extends v.GenericSchema = v.GenericSchema,
> {
  /** The app's id in requests, e.g. `serracalc`. */
  readonly id: string;
  readonly version: number;
  readonly tools: readonly AssistantTool[];
  readonly context: TContext;
  /** The system prompt, telling the model to answer in `locale`. */
  readonly system: (locale: AssistantLocale) => string;
}

/** A profile with its specs built once (not per request). */
export interface CompiledProfile {
  readonly profile: AssistantProfile;
  readonly specs: readonly ToolSpec[];
  readonly tools: ReadonlyMap<string, AssistantTool>;
}

export function compileProfile(profile: AssistantProfile): CompiledProfile {
  const tools = new Map<string, AssistantTool>();
  for (const tool of profile.tools) {
    if (tools.has(tool.name)) throw new Error(`Tool "${tool.name}" twice`);
    tools.set(tool.name, tool);
  }
  return { profile, specs: profile.tools.map(toolSpec), tools };
}

/** A call with its arguments checked, or why it can't run. */
export type CheckedCall =
  | { readonly ok: true; readonly tool: AssistantTool; readonly args: unknown }
  | { readonly ok: false; readonly problem: string };

/** Whether a model's call names a tool on offer, with valid arguments. */
export function checkToolCall(
  tools: ReadonlyMap<string, AssistantTool>,
  call: Pick<ToolCall, 'name' | 'arguments'>,
): CheckedCall {
  const tool = tools.get(call.name);
  if (!tool) return { ok: false, problem: `No tool "${call.name}"` };
  const parsed = v.safeParse(tool.args, call.arguments);
  if (!parsed.success) {
    const issue = parsed.issues[0];
    const where =
      issue.path?.map((p) => String(p.key)).join('.') || 'arguments';
    return { ok: false, problem: `${call.name}: ${where}: ${issue.message}` };
  }
  return { ok: true, tool, args: parsed.output };
}

/**
 * A conversation the models can take: every tool result answers a call
 * made just before it (so no call is left unanswered before the next
 * turn), only offered tools appear, and it ends with the user or a result.
 */
export function historyProblems(
  messages: readonly ChatMessage[],
  offered: ReadonlySet<string>,
): string[] {
  const problems: string[] = [];
  let open = new Map<string, string>();
  messages.forEach((message, index) => {
    if (message.role === 'tool') {
      if (open.get(message.toolCallId) !== message.name) {
        problems.push(`#${index}: result for an unknown call`);
      }
      open.delete(message.toolCallId);
      return;
    }
    if (open.size > 0) {
      problems.push(`#${index}: calls left without results`);
      open = new Map();
    }
    if (message.role === 'assistant') {
      for (const call of message.toolCalls ?? []) {
        if (!offered.has(call.name)) {
          problems.push(`#${index}: "${call.name}" isn't on offer`);
        }
        open.set(call.id, call.name);
      }
    }
  });
  if (open.size > 0) problems.push('calls left without results');
  const last = messages[messages.length - 1];
  if (last && last.role === 'assistant') {
    problems.push('ends with the assistant');
  }
  return problems;
}
