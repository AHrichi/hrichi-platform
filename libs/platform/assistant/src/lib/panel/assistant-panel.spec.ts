import {
  ChangeDetectionStrategy,
  Component,
  provideZonelessChangeDetection,
  signal,
} from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { type ChatResponse, defineTool } from '@ah/shared/assistant';
import * as v from 'valibot';
import { afterEach, describe, expect, it } from 'vitest';
import { ASSISTANT_TRANSPORT } from '../assistant-transport';
import { provideAssistant } from '../provide-assistant';
import { AssistantPanel } from './assistant-panel';

const PROFILE = {
  id: 'demo',
  version: 1,
  context: v.object({}),
  system: () => '',
  tools: [
    defineTool({
      name: 'create_project',
      description: '',
      effect: 'write',
      args: v.object({ title: v.string() }),
    }),
  ],
};

@Component({
  imports: [AssistantPanel],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" class="opener" (click)="open.set(true)">Ask</button>
    <ah-assistant-panel
      [(open)]="open"
      greeting="Hello, ask me anything."
      [suggestions]="['Create a project']"
      privacy="Messages go to an AI service."
      placeholder="Ask…"
    />
  `,
})
class Host {
  readonly open = signal(false);
}

function render(replies: ChatResponse[]) {
  const created: string[] = [];
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      {
        provide: ASSISTANT_TRANSPORT,
        useValue: { chat: async () => replies.shift() ?? null },
      },
      provideAssistant(() => ({
        profile: PROFILE,
        locale: () => 'en',
        context: () => ({}),
        executors: {
          create_project: {
            describe: (args: { title: string }) => ({
              heading: `Create “${args.title}”`,
              lines: ['Crop: tomato'],
            }),
            run: (args: { title: string }) => {
              created.push(args.title);
              return { ok: true, result: { id: 'p1' } };
            },
          },
        },
      })),
    ],
  });
  const fixture = TestBed.createComponent(Host);
  const root = fixture.nativeElement as HTMLElement;
  const dialog = () => root.querySelector('dialog') as HTMLDialogElement;
  return { fixture, root, dialog, created };
}

/** Lets the loop, the renders and the panel's timers run. */
async function settle(fixture: { whenStable(): Promise<unknown> }) {
  for (let i = 0; i < 5; i++) {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await fixture.whenStable();
  }
}

const text = (element: Element | null) =>
  element?.textContent?.replace(/\s+/g, ' ').trim() ?? '';

describe('AssistantPanel', () => {
  afterEach(() => sessionStorage.clear());

  it('opens with a greeting, suggestions and where messages go', async () => {
    const { fixture, root, dialog } = render([]);
    await settle(fixture);
    expect(dialog().open).toBe(false);

    (root.querySelector('.opener') as HTMLButtonElement).click();
    await settle(fixture);
    expect(dialog().open).toBe(true);
    expect(dialog().getAttribute('aria-labelledby')).toBe(
      dialog().querySelector('h2')?.id,
    );
    expect(text(dialog().querySelector('[role="log"]'))).toContain(
      'Hello, ask me anything.',
    );
    expect(text(dialog())).toContain('Messages go to an AI service.');
    expect(document.activeElement?.tagName).toBe('TEXTAREA');
  });

  it('asks a suggestion, then applies the change it proposes', async () => {
    const { fixture, root, dialog, created } = render([
      {
        v: 1,
        ok: true,
        provider: 'fake',
        message: {
          content: null,
          toolCalls: [
            { id: 'c1', name: 'create_project', arguments: { title: 'East' } },
          ],
        },
      },
      {
        v: 1,
        ok: true,
        provider: 'fake',
        message: { content: 'East is ready.', toolCalls: [] },
      },
    ]);
    fixture.componentInstance.open.set(true);
    await settle(fixture);

    (dialog().querySelector('.chip') as HTMLButtonElement).click();
    await settle(fixture);
    const card = root.querySelector('ah-action-card');
    expect(text(card)).toContain('Create “East”');
    expect(text(card)).toContain('Crop: tomato');
    expect(created).toEqual([]);

    (card?.querySelector('.apply') as HTMLButtonElement).click();
    await settle(fixture);
    expect(created).toEqual(['East']);
    expect(text(dialog().querySelector('[role="log"]'))).toContain(
      'East is ready.',
    );
  });

  it('closes on Escape and gives focus back', async () => {
    const { fixture, root, dialog } = render([]);
    const opener = root.querySelector('.opener') as HTMLButtonElement;
    document.body.append(root);
    opener.focus();
    opener.click();
    await settle(fixture);

    dialog().dispatchEvent(
      new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    await settle(fixture);
    expect(fixture.componentInstance.open()).toBe(false);
    expect(dialog().open).toBe(false);
    expect(document.activeElement).toBe(opener);
    root.remove();
  });
});
