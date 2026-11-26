import {
  computed,
  DestroyRef,
  inject,
  Injectable,
  signal,
} from '@angular/core';
import {
  ASSISTANT_LIMITS,
  type AssistantTool,
  type ChatMessage,
  type ChatResponse,
  checkToolCall,
  compileProfile,
  type ToolCall,
} from '@ah/shared/assistant';
import { assistantCopy } from './assistant-copy';
import {
  ASSISTANT_SETUP,
  type AssistantEntry,
  type ToolOutcome,
} from './assistant.model';
import { ASSISTANT_TRANSPORT } from './assistant-transport';
import { resultText, trimHistory } from './history';

/** An entry before it has its id (one of the union's kinds). */
type NewEntry = AssistantEntry extends infer E
  ? E extends AssistantEntry
    ? Omit<E, 'id'>
    : never
  : never;

const ACTION_TIMEOUT_MS = 20_000;

/** An action the chat stopped waiting for: too slow, or the reader's Stop. */
class Late extends Error {
  constructor(
    readonly reason: 'timeout' | 'stopped',
    limitMs: number,
  ) {
    // What the model reads: it may still happen, so no blind retry.
    super(
      reason === 'timeout'
        ? `didn't finish within ${Math.round(limitMs / 1000)} s; it may still complete, so check before trying again`
        : 'stopped by the user before it finished; it may still complete',
    );
  }
}

interface Executed {
  /** What the model reads back. */
  readonly result: unknown;
  readonly late?: Late['reason'];
}

interface Saved {
  readonly v: 1;
  readonly history: ChatMessage[];
  readonly entries: AssistantEntry[];
}

/**
 * One conversation with an app's assistant, and the loop that runs it:
 * send what the reader wrote with the app's state, run the tools the model
 * asks for, send their results back, until the model answers in words.
 *
 * - **Looking and moving** (`read`, `navigate`) run at once.
 * - **Settings** run at once, with Undo next to their note.
 * - **Changes and deletions** wait on a card whose words the app writes:
 *   nothing changes until the reader presses Apply.
 *
 * Every call is checked against the app's own profile before it runs. A
 * message gets at most five rounds, and a model repeating itself is
 * stopped. The conversation lives in this tab only (sessionStorage).
 */
@Injectable()
export class AssistantService {
  private readonly setup = inject(ASSISTANT_SETUP);
  private readonly transport = inject(ASSISTANT_TRANSPORT);
  private readonly tools: ReadonlyMap<string, AssistantTool> = compileProfile(
    this.setup.profile,
  ).tools;

  private readonly list = signal<AssistantEntry[]>([]);
  readonly entries = this.list.asReadonly();
  readonly busy = signal(false);
  readonly online = signal(
    typeof navigator === 'undefined' ? true : navigator.onLine,
  );
  readonly copy = computed(() => assistantCopy(this.setup.locale()));

  private history: ChatMessage[] = [];
  private nextId = 1;
  private run: AbortController | null = null;
  private decide: ((apply: boolean) => void) | null = null;
  private readonly undos = new Map<number, () => void | Promise<void>>();

  constructor() {
    this.restore();
    if (typeof window !== 'undefined') {
      const update = () => this.online.set(navigator.onLine);
      window.addEventListener('online', update);
      window.addEventListener('offline', update);
      inject(DestroyRef).onDestroy(() => {
        window.removeEventListener('online', update);
        window.removeEventListener('offline', update);
        this.run?.abort();
      });
    }
  }

  /** Sends the reader's message and runs the rounds it takes. */
  async send(text: string): Promise<void> {
    const content = text.trim().slice(0, ASSISTANT_LIMITS.userChars);
    if (!content || this.busy()) return;
    if (!this.online()) {
      this.notice(this.copy().offline, 'error');
      return;
    }
    this.add({ kind: 'user', text: content });
    this.history.push({ role: 'user', content });
    this.busy.set(true);
    const run = (this.run = new AbortController());
    try {
      await this.rounds(run.signal);
    } finally {
      if (this.run === run) this.run = null;
      this.busy.set(false);
      this.save();
    }
  }

  /** The reader's answer to the card waiting for one. */
  decideAction(apply: boolean): void {
    this.decide?.(apply);
  }

  /** Stops the answer on its way; a waiting card counts as cancelled. */
  stop(): void {
    this.decide?.(false);
    this.run?.abort();
  }

  async undo(entryId: number): Promise<void> {
    const undo = this.undos.get(entryId);
    if (!undo) return;
    this.undos.delete(entryId);
    await undo();
    this.list.update((all) =>
      all.map((entry) =>
        entry.id === entryId && entry.kind === 'notice'
          ? {
              ...entry,
              undoable: false,
              text: `${entry.text} (${this.copy().undo.toLowerCase()})`,
            }
          : entry,
      ),
    );
    this.save();
  }

  /** Forgets the conversation. */
  reset(): void {
    this.stop();
    this.history = [];
    this.undos.clear();
    this.list.set([]);
    this.save();
  }

  private async rounds(signal: AbortSignal): Promise<void> {
    let lastCalls = '';
    for (
      let round = 0;
      round < ASSISTANT_LIMITS.roundsPerUserMessage;
      round++
    ) {
      const response = await this.transport.chat(
        {
          v: 1,
          app: this.setup.profile.id,
          locale: this.setup.locale(),
          omitTools: this.setup.omitTools?.() ?? [],
          context: this.setup.context(),
          messages: trimHistory(this.history),
        },
        signal,
      );
      if (signal.aborted) {
        this.notice(this.copy().stopped);
        return;
      }
      if (!response || !response.ok) {
        this.failure(response);
        return;
      }
      const { content, toolCalls } = response.message;
      this.history.push({
        role: 'assistant',
        content,
        ...(toolCalls.length ? { toolCalls: [...toolCalls] } : {}),
      });
      if (content) this.add({ kind: 'assistant', text: content });
      if (toolCalls.length === 0) return;

      // A model asking for the very same thing again is going in circles.
      const calls = JSON.stringify(toolCalls.map((c) => [c.name, c.arguments]));
      if (calls === lastCalls) {
        this.answerAll(toolCalls, { error: 'repeated' });
        this.notice(this.copy().tooManySteps);
        return;
      }
      lastCalls = calls;

      for (const result of await this.runCalls(toolCalls, signal)) {
        this.history.push(result);
      }
      if (signal.aborted) {
        this.notice(this.copy().stopped);
        return;
      }
    }
    this.notice(this.copy().tooManySteps);
  }

  /** Runs a round's calls: at once, or after the reader's Apply. */
  private async runCalls(
    calls: readonly ToolCall[],
    signal: AbortSignal,
  ): Promise<ChatMessage[]> {
    const offered = this.offered();
    const results = new Map<string, unknown>();
    const waiting: { call: ToolCall; args: unknown; tool: AssistantTool }[] =
      [];

    for (const call of calls) {
      const checked = checkToolCall(offered, call);
      if (!checked.ok) {
        results.set(call.id, { error: checked.problem });
      } else if (
        checked.tool.effect === 'write' ||
        checked.tool.effect === 'destructive'
      ) {
        const problem = this.problem(call.name, checked.args);
        if (problem) results.set(call.id, { error: problem });
        else waiting.push({ call, args: checked.args, tool: checked.tool });
      } else {
        const { result } = await this.execute(call.name, checked.args, signal);
        results.set(call.id, result);
      }
    }

    if (waiting.length > 0 && !signal.aborted) {
      const executors = this.setup.executors;
      const described = waiting.map(
        ({ call, args }) =>
          executors[call.name]?.describe?.(args as never) ?? {
            heading: call.name,
            lines: [],
          },
      );
      const card = this.add({
        kind: 'action',
        heading: described.map((d) => d.heading).join(' · '),
        lines: described.flatMap((d) => d.lines ?? []),
        tone: waiting.some((w) => w.tool.effect === 'destructive')
          ? 'danger'
          : 'default',
        status: 'pending',
      });
      const apply = await new Promise<boolean>((resolve) => {
        this.decide = resolve;
        signal.addEventListener('abort', () => resolve(false), { once: true });
      });
      this.decide = null;
      if (!apply) {
        this.setStatus(card, 'cancelled');
        for (const { call } of waiting) {
          results.set(call.id, { status: 'cancelled_by_user' });
        }
      } else {
        let failure: string | null = null;
        for (const { call, args } of waiting) {
          // After Stop, the rest of the card doesn't run.
          if (signal.aborted) {
            results.set(call.id, { status: 'cancelled_by_user' });
            continue;
          }
          const { result, late } = await this.execute(
            call.name,
            args,
            signal,
            false,
          );
          results.set(call.id, result);
          if (failure) continue;
          if (late) {
            failure =
              late === 'timeout' ? this.copy().tooSlow : this.copy().stopped;
          } else if (
            typeof result === 'object' &&
            result !== null &&
            'error' in result
          ) {
            failure = String((result as { error: unknown }).error);
          }
        }
        this.setStatus(
          card,
          failure ? 'failed' : 'applied',
          failure ?? undefined,
        );
      }
    }

    return calls.map((call) => ({
      role: 'tool' as const,
      toolCallId: call.id,
      name: call.name,
      content: resultText(results.get(call.id) ?? { error: 'not run' }),
    }));
  }

  /**
   * Runs one tool, within the time limit and until Stop; a note (and
   * Undo) shows for settings and moves.
   */
  private async execute(
    name: string,
    args: unknown,
    signal: AbortSignal,
    showNote = true,
  ): Promise<Executed> {
    const executor = this.setup.executors[name];
    if (!executor) return { result: { error: `${name} isn't available here` } };
    let outcome: ToolOutcome;
    try {
      outcome = await this.inTime(() => executor.run(args as never), signal);
    } catch (error) {
      if (error instanceof Late) {
        return { result: { error: error.message }, late: error.reason };
      }
      return {
        result: {
          error: error instanceof Error ? error.message : String(error),
        },
      };
    }
    if (!outcome.ok) return { result: { error: outcome.error } };
    if (showNote && outcome.note) {
      const entry = this.notice(outcome.note, 'default', Boolean(outcome.undo));
      if (outcome.undo) this.undos.set(entry, outcome.undo);
    }
    return { result: outcome.result ?? { ok: true } };
  }

  /** An action's outcome, unless it outlasts the time limit or Stop. */
  private inTime<T>(
    run: () => T | Promise<T>,
    signal: AbortSignal,
  ): Promise<T> {
    const limit = this.setup.actionTimeoutMs ?? ACTION_TIMEOUT_MS;
    return new Promise<T>((resolve, reject) => {
      let settled = false;
      const settle = (finish: () => void) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        signal.removeEventListener('abort', onStop);
        finish();
      };
      const onStop = () => settle(() => reject(new Late('stopped', limit)));
      const timer = setTimeout(
        () => settle(() => reject(new Late('timeout', limit))),
        limit,
      );
      if (signal.aborted) {
        onStop();
        return;
      }
      signal.addEventListener('abort', onStop, { once: true });
      Promise.resolve()
        .then(run)
        .then(
          (value) => settle(() => resolve(value)),
          (error: unknown) => settle(() => reject(error)),
        );
    });
  }

  /** Why a change can't run, before the reader is asked about it. */
  private problem(name: string, args: unknown): string | null {
    const executor = this.setup.executors[name];
    if (!executor) return `${name} isn't available here`;
    try {
      return executor.check?.(args as never) ?? null;
    } catch (error) {
      return error instanceof Error ? error.message : String(error);
    }
  }

  private offered(): ReadonlyMap<string, AssistantTool> {
    const omit = new Set(this.setup.omitTools?.() ?? []);
    return new Map([...this.tools].filter(([name]) => !omit.has(name)));
  }

  private answerAll(calls: readonly ToolCall[], result: unknown): void {
    for (const call of calls) {
      this.history.push({
        role: 'tool',
        toolCallId: call.id,
        name: call.name,
        content: resultText(result),
      });
    }
  }

  private failure(response: ChatResponse | null): void {
    const copy = this.copy();
    if (!response) {
      this.notice(this.online() ? copy.unavailable : copy.offline, 'error');
    } else if (!response.ok) {
      const wait = response.retryAfterSec ?? 30;
      if (response.code === 'BUSY' || response.code === 'RATE_LIMITED') {
        this.notice(wait > 3600 ? copy.resting : copy.busy(wait), 'error');
      } else if (response.code === 'UNAVAILABLE') {
        this.notice(copy.unavailable, 'error');
      } else {
        this.notice(copy.broken, 'error');
      }
    }
    // The reader's message got no answer: drop it, so the next one works.
    while (
      this.history.length &&
      this.history[this.history.length - 1].role !== 'user'
    ) {
      this.history.pop();
    }
    this.history.pop();
  }

  private add(entry: NewEntry): number {
    const id = this.nextId++;
    this.list.update((all) => [...all, { ...entry, id } as AssistantEntry]);
    return id;
  }

  private notice(
    text: string,
    tone: 'default' | 'error' = 'default',
    undoable = false,
  ): number {
    return this.add({ kind: 'notice', text, tone, undoable });
  }

  private setStatus(
    id: number,
    status: 'applied' | 'cancelled' | 'failed',
    detail?: string,
  ): void {
    this.list.update((all) =>
      all.map((entry) =>
        entry.id === id && entry.kind === 'action'
          ? { ...entry, status, detail }
          : entry,
      ),
    );
  }

  private save(): void {
    const key = this.setup.storageKey;
    if (!key || typeof sessionStorage === 'undefined') return;
    try {
      const saved: Saved = {
        v: 1,
        history: this.history,
        // Undo can't outlive the page: its note stays, without the button.
        entries: this.list().map((entry) =>
          entry.kind === 'notice' ? { ...entry, undoable: false } : entry,
        ),
      };
      sessionStorage.setItem(key, JSON.stringify(saved));
    } catch {
      // Full or blocked: the conversation lasts as long as the page.
    }
  }

  private restore(): void {
    const key = this.setup.storageKey;
    if (!key || typeof sessionStorage === 'undefined') return;
    try {
      const saved = JSON.parse(
        sessionStorage.getItem(key) ?? 'null',
      ) as Saved | null;
      if (saved?.v !== 1) return;
      this.history = completeExchanges(saved.history);
      this.list.set(
        saved.entries.map((entry) =>
          entry.kind === 'action' && entry.status === 'pending'
            ? { ...entry, status: 'cancelled' }
            : entry,
        ),
      );
      this.nextId = Math.max(0, ...saved.entries.map((e) => e.id)) + 1;
    } catch {
      // Damaged: start afresh.
    }
  }
}

/**
 * The conversation up to its last finished exchange (one that ends with
 * the assistant's words), so it never resumes with a call left unanswered.
 */
function completeExchanges(history: readonly ChatMessage[]): ChatMessage[] {
  let end = history.length;
  while (end > 0) {
    const last = history[end - 1];
    if (last.role === 'assistant' && !last.toolCalls?.length) break;
    end--;
  }
  return history.slice(0, end);
}
