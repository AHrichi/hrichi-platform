import {
  ASSISTANT_LIMITS,
  type AssistantTool,
  type ChatMessage,
  checkToolCall,
  READ_ONLY_EFFECTS,
  type ToolCall,
  type ToolSpec,
} from '@ah/shared/assistant';
import {
  type ChatModel,
  ModelError,
  type ModelErrorKind,
  type ModelReply,
} from './chat-model';

export interface LadderRun {
  readonly system: string;
  readonly messages: readonly ChatMessage[];
  /** The tools on offer, specs and definitions, by name. */
  readonly specs: readonly ToolSpec[];
  readonly tools: ReadonlyMap<string, AssistantTool>;
  readonly maxTokens?: number;
}

export interface AttemptLog {
  readonly model: string;
  readonly outcome: ModelErrorKind;
  readonly detail: string;
}

export interface LadderResult {
  readonly provider: string;
  readonly reply: ModelReply;
  readonly attempts: readonly AttemptLog[];
}

/** Every model failed; `retryAfterSec` is the soonest any said to retry. */
export class LadderExhausted extends Error {
  override readonly name = 'LadderExhausted';

  constructor(
    readonly attempts: readonly AttemptLog[],
    readonly retryAfterSec: number | null,
  ) {
    super(
      attempts.length
        ? `Every model failed: ${attempts.map((a) => `${a.model} ${a.outcome}`).join('; ')}`
        : 'No model is configured.',
    );
  }
}

/**
 * Tries the models in order until one gives a usable answer: text, or tool
 * calls that name tools on offer with valid arguments. A rate limit, an
 * outage, a broken call or a timeout moves on to the next. Read-only
 * models see only tools that can't change data. The whole climb has a
 * deadline, so the user isn't left waiting.
 */
export class ChatLadder {
  constructor(
    readonly models: readonly ChatModel[],
    private readonly deadlineMs = 25_000,
    private readonly now: () => number = () => Date.now(),
  ) {}

  get configured(): boolean {
    return this.models.length > 0;
  }

  get labels(): string[] {
    return this.models.map((model) => model.label);
  }

  async run(run: LadderRun): Promise<LadderResult> {
    const attempts: AttemptLog[] = [];
    const ends = this.now() + this.deadlineMs;
    let soonest: number | null = null;
    for (const model of this.models) {
      const left = ends - this.now();
      if (left <= 0) break;
      const readOnly = model.capability === 'read-only';
      const specs = readOnly
        ? run.specs.filter((spec) =>
            READ_ONLY_EFFECTS.includes(
              run.tools.get(spec.name)?.effect ?? 'write',
            ),
          )
        : run.specs;
      const offered = new Map(
        specs.flatMap((spec) => {
          const tool = run.tools.get(spec.name);
          return tool ? [[spec.name, tool] as const] : [];
        }),
      );
      try {
        const reply = await model.complete(
          {
            system: run.system,
            messages: run.messages,
            tools: specs,
            maxTokens: run.maxTokens ?? ASSISTANT_LIMITS.maxOutputTokens,
          },
          AbortSignal.timeout(left),
        );
        return {
          provider: model.label,
          reply: usable(model.label, reply, offered),
          attempts,
        };
      } catch (error) {
        const failure =
          error instanceof ModelError
            ? error
            : new ModelError(model.label, 'unavailable', String(error));
        attempts.push({
          model: model.label,
          outcome: failure.kind,
          detail: failure.message,
        });
        if (failure.retryAfterSec !== null) {
          soonest = Math.min(soonest ?? Infinity, failure.retryAfterSec);
        }
      }
    }
    throw new LadderExhausted(attempts, soonest);
  }
}

/** The reply with checked calls, or a `bad_output` error to move on. */
function usable(
  label: string,
  reply: ModelReply,
  offered: ReadonlyMap<string, AssistantTool>,
): ModelReply {
  const calls: ToolCall[] = [];
  for (const call of reply.toolCalls.slice(
    0,
    ASSISTANT_LIMITS.toolCallsPerTurn,
  )) {
    const checked = checkToolCall(offered, call);
    if (!checked.ok) throw new ModelError(label, 'bad_output', checked.problem);
    calls.push({
      ...call,
      arguments: (checked.args ?? {}) as Record<string, unknown>,
    });
  }
  const content =
    reply.content?.slice(0, ASSISTANT_LIMITS.assistantChars) ?? null;
  if (!content && calls.length === 0) {
    throw new ModelError(label, 'bad_output', 'empty answer');
  }
  return { content, toolCalls: calls };
}
