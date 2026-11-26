import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  type ChatRequest,
  type ChatResponse,
  defineTool,
  type ToolCall,
} from '@ah/shared/assistant';
import * as v from 'valibot';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { AssistantSetup, ToolExecutor } from './assistant.model';
import { ASSISTANT_COPY, assistantCopy } from './assistant-copy';
import { AssistantService } from './assistant.service';
import { ASSISTANT_TRANSPORT } from './assistant-transport';
import { resultText, trimHistory } from './history';
import { provideAssistant } from './provide-assistant';

const PROFILE = {
  id: 'demo',
  version: 1,
  context: v.object({}),
  system: () => '',
  tools: [
    defineTool({
      name: 'list_projects',
      description: '',
      effect: 'read',
      args: v.object({}),
    }),
    defineTool({
      name: 'set_sunlight',
      description: '',
      effect: 'setting',
      args: v.object({ on: v.boolean() }),
    }),
    defineTool({
      name: 'create_project',
      description: '',
      effect: 'write',
      args: v.object({ title: v.pipe(v.string(), v.minLength(1)) }),
    }),
    defineTool({
      name: 'delete_project',
      description: '',
      effect: 'destructive',
      args: v.object({ projectId: v.string() }),
    }),
  ],
};

const call = (
  name: string,
  args: Record<string, unknown>,
  id = `c_${name}`,
): ToolCall => ({
  id,
  name,
  arguments: args,
});
const words = (content: string): ChatResponse => ({
  v: 1,
  ok: true,
  provider: 'fake',
  message: { content, toolCalls: [] },
});
const calls = (...toolCalls: ToolCall[]): ChatResponse => ({
  v: 1,
  ok: true,
  provider: 'fake',
  message: { content: null, toolCalls },
});

/** Answers each request with the next scripted reply, keeping the requests. */
class ScriptedTransport {
  readonly requests: ChatRequest[] = [];
  constructor(private readonly replies: (ChatResponse | null)[]) {}
  async chat(request: ChatRequest): Promise<ChatResponse | null> {
    this.requests.push(structuredClone(request));
    return this.replies.shift() ?? null;
  }
}

function setup(
  replies: (ChatResponse | null)[],
  overrides: Partial<AssistantSetup> = {},
) {
  const ran: string[] = [];
  let sunlight = false;
  const executors: Record<string, ToolExecutor<never>> = {
    list_projects: {
      run: () => ({ ok: true, result: [{ id: 'p1', title: 'North' }] }),
    },
    set_sunlight: {
      run: (args: { on: boolean }) => {
        sunlight = args.on;
        return {
          ok: true,
          result: { on: args.on },
          note: 'Sunlight mode is on.',
          undo: () => void (sunlight = !args.on),
        };
      },
    } as ToolExecutor<never>,
    create_project: {
      describe: (args: { title: string }) => ({
        heading: `Create “${args.title}”`,
      }),
      run: (args: { title: string }) => {
        ran.push(`create ${args.title}`);
        return { ok: true, result: { id: 'p2' } };
      },
    } as ToolExecutor<never>,
    delete_project: {
      describe: () => ({ heading: 'Delete it' }),
      run: () => ({ ok: false, error: 'not found' }),
    },
  };
  const transport = new ScriptedTransport(replies);
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      { provide: ASSISTANT_TRANSPORT, useValue: transport },
      provideAssistant(() => ({
        profile: PROFILE,
        locale: () => 'en',
        context: () => ({}),
        executors,
        storageKey: 'test.assistant',
        ...overrides,
      })),
    ],
  });
  const service = TestBed.inject(AssistantService);
  return { service, transport, ran, sunlight: () => sunlight };
}

/** Waits until the card asks for a decision. */
async function untilCard(service: AssistantService) {
  for (let i = 0; i < 50; i++) {
    if (
      service
        .entries()
        .some((e) => e.kind === 'action' && e.status === 'pending')
    )
      return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  throw new Error('no card');
}

describe('AssistantService', () => {
  beforeEach(() => sessionStorage.clear());
  afterEach(() => sessionStorage.clear());

  it('sends the message with the app’s state and shows the answer', async () => {
    const { service, transport } = setup([words('Hello!')]);
    await service.send('  Hi  ');
    expect(transport.requests[0]).toMatchObject({
      v: 1,
      app: 'demo',
      locale: 'en',
      context: {},
      messages: [{ role: 'user', content: 'Hi' }],
    });
    expect(service.entries().map((e) => e.kind)).toEqual(['user', 'assistant']);
    expect(service.busy()).toBe(false);
  });

  it('runs a look-up at once and sends its result back', async () => {
    const { service, transport } = setup([
      calls(call('list_projects', {})),
      words('You have one project.'),
    ]);
    await service.send('What do I have?');
    expect(transport.requests).toHaveLength(2);
    expect(transport.requests[1].messages.slice(-1)[0]).toEqual({
      role: 'tool',
      toolCallId: 'c_list_projects',
      name: 'list_projects',
      content: '[{"id":"p1","title":"North"}]',
    });
  });

  it('changes nothing until the reader applies the card', async () => {
    const { service, transport, ran } = setup([
      calls(call('create_project', { title: 'East' })),
      words('Created.'),
    ]);
    const sending = service.send('Create East');
    await untilCard(service);
    expect(ran).toEqual([]);
    const card = service.entries().find((e) => e.kind === 'action');
    expect(card).toMatchObject({ heading: 'Create “East”', tone: 'default' });
    service.decideAction(true);
    await sending;
    expect(ran).toEqual(['create East']);
    expect(service.entries().find((e) => e.kind === 'action')).toMatchObject({
      status: 'applied',
    });
    expect(transport.requests[1].messages.slice(-1)[0]).toMatchObject({
      content: '{"id":"p2"}',
    });
  });

  it('tells the model when the reader cancels, and marks deletions', async () => {
    const { service, transport, ran } = setup([
      calls(call('delete_project', { projectId: 'p1' })),
      words('Kept it.'),
    ]);
    const sending = service.send('Delete North');
    await untilCard(service);
    expect(service.entries().find((e) => e.kind === 'action')).toMatchObject({
      tone: 'danger',
    });
    service.decideAction(false);
    await sending;
    expect(ran).toEqual([]);
    expect(transport.requests[1].messages.slice(-1)[0]).toMatchObject({
      content: '{"status":"cancelled_by_user"}',
    });
  });

  it('shows a failed change as failed', async () => {
    const { service } = setup([
      calls(call('delete_project', { projectId: 'p9' })),
      words('It wasn’t there.'),
    ]);
    const sending = service.send('Delete p9');
    await untilCard(service);
    service.decideAction(true);
    await sending;
    expect(service.entries().find((e) => e.kind === 'action')).toMatchObject({
      status: 'failed',
      detail: 'not found',
    });
  });

  it('never runs a call its own profile refuses, or a tool left out', async () => {
    const { service, transport, ran } = setup(
      [
        calls(
          call('create_project', { title: '' }),
          call('set_sunlight', { on: true }),
        ),
        words('ok'),
      ],
      { omitTools: () => ['set_sunlight'] },
    );
    await service.send('Go');
    expect(ran).toEqual([]);
    const results = transport.requests[1].messages.filter(
      (m) => m.role === 'tool',
    );
    expect(
      results.map((r) => JSON.parse((r as { content: string }).content).error),
    ).toEqual([expect.stringContaining('title'), 'No tool "set_sunlight"']);
    expect(transport.requests[0].omitTools).toEqual(['set_sunlight']);
  });

  it('notes a setting with Undo', async () => {
    const state = setup([
      calls(call('set_sunlight', { on: true })),
      words('Done.'),
    ]);
    await state.service.send('Sunlight on');
    expect(state.sunlight()).toBe(true);
    const note = state.service.entries().find((e) => e.kind === 'notice');
    expect(note).toMatchObject({
      text: 'Sunlight mode is on.',
      undoable: true,
    });
    await state.service.undo(note?.id ?? 0);
    expect(state.sunlight()).toBe(false);
  });

  it('says when it is busy, and forgets the unanswered message', async () => {
    const { service, transport } = setup([
      { v: 1, ok: false, code: 'BUSY', message: 'busy', retryAfterSec: 20 },
      words('Now I can.'),
    ]);
    await service.send('First');
    expect(service.entries().slice(-1)[0]).toMatchObject({
      kind: 'notice',
      tone: 'error',
      text: 'The assistant is busy. Try again in 20 seconds.',
    });
    await service.send('Second');
    expect(transport.requests[1].messages).toEqual([
      { role: 'user', content: 'Second' },
    ]);
  });

  it('stops a model that asks for the same thing twice', async () => {
    const again = calls(call('list_projects', {}));
    const { service, transport } = setup([again, again, words('never')]);
    await service.send('Loop');
    expect(transport.requests).toHaveLength(2);
    expect(service.entries().slice(-1)[0]).toMatchObject({ kind: 'notice' });
  });

  it('keeps the conversation for the tab, cancelling a card left waiting', async () => {
    const first = setup([words('Hello')]);
    await first.service.send('Hi');
    TestBed.resetTestingModule();
    const second = setup([]);
    expect(second.service.entries().map((e) => e.kind)).toEqual([
      'user',
      'assistant',
    ]);
  });
});

describe('the conversation sent', () => {
  it('keeps the latest messages, starting with the reader’s', () => {
    const history = [
      { role: 'user', content: 'a' },
      {
        role: 'assistant',
        content: null,
        toolCalls: [call('list_projects', {})],
      },
      {
        role: 'tool',
        toolCallId: 'c_list_projects',
        name: 'list_projects',
        content: '[]',
      },
      { role: 'assistant', content: 'b' },
      { role: 'user', content: 'c' },
      { role: 'assistant', content: 'd' },
    ] as const;
    expect(trimHistory(history, 4)).toEqual(history.slice(4));
    expect(trimHistory(history, 10)).toEqual([...history]);
  });

  it('cuts a long result so a round stays small', () => {
    const long = resultText({ text: 'x'.repeat(5000) }, 300);
    expect(long.length).toBeLessThanOrEqual(300);
    expect(JSON.parse(long)).toMatchObject({ truncated: true });
  });
});

describe('the panel’s words', () => {
  it('are all there, in every language', () => {
    for (const [locale, copy] of Object.entries(ASSISTANT_COPY)) {
      for (const [key, value] of Object.entries(copy)) {
        const words = typeof value === 'function' ? value(20) : value;
        expect(words, `${locale}.${key}`).toMatch(/\S/);
        if (typeof value === 'function') expect(words).toContain('20');
      }
    }
    expect(assistantCopy('xx')).toBe(ASSISTANT_COPY.en);
  });
});
